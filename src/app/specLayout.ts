// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The specification, laid out: a `Specification` and a `SpecStyle` in, pages
// of type and rules out (`pdf/page.ts`).
//
// This is the whole design of the document, and it is here rather than in a
// component for the reason the rest of this app keeps its arithmetic out of
// its screens: there are two renderers over these pages — the PDF the user
// downloads and the SVG the modal previews and the printer prints — and a
// layout that lived in one of them would be a second layout waiting to
// disagree with the first. Pure and clock-free; the stamp on the page comes in
// with the fields.
//
// The shape of the document, in order: the head (the title and whatever
// ornament the style gives it), the details (project, period, who it is from
// and who it is for), the figures, the two breakdowns, the day-by-day table —
// the part that is actually the specification — and, if it is asked for, a
// line to sign. Every block flows: it asks the sheet for room, and the sheet
// starts a page when there is not enough.
//
// Nothing here knows any words. Every string on the page arrives in `labels`
// and `names`, so the document is translated by the same catalog as the rest
// of the app and a test can pass a stub.

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { formatDuration, formatHoursValue, formatTimeOfDay } from "./format.ts";
import {
  PAPER,
  PageBuilder,
  type Align,
  type PdfDoc,
  type PdfPage,
} from "./pdf/page.ts";
import { textWidth, truncate, wrap, type PdfFont } from "./pdf/metrics.ts";
import {
  decimalHours,
  type SpecAmount,
  type SpecDay,
  type Specification,
} from "./spec.ts";
import {
  SPEC_ACCENT,
  SPEC_DENSITY,
  SPEC_PALETTE,
  SPEC_TYPEFACE,
  type SpecStyle,
} from "./specStyle.ts";

/** The names only the app can resolve: a date in the reader's locale, and a
 *  kind of work or of break under whatever the project calls it. */
export type SpecNames = {
  day: (date: DayKey) => string;
  category: (id: string | null) => string;
  breakType: (id: string) => string;
  page: (page: number, pages: number) => string;
};

/** Every fixed word the document prints. */
export type SpecLabels = {
  title: string;
  project: string;
  period: string;
  issued: string;
  preparedBy: string;
  client: string;
  reference: string;
  summary: string;
  hours: string;
  days: string;
  target: string;
  balance: string;
  categories: string;
  breaks: string;
  daily: string;
  date: string;
  start: string;
  end: string;
  breakColumn: string;
  decimal: string;
  share: string;
  kind: string;
  total: string;
  running: string;
  /** The line the rounding adds to the breakdown. */
  rounding: string;
  /** What the document says about it, as "Every day is billed up to the next
   *  {minutes} minutes." */
  roundedNote: string;
  signature: string;
  signedDate: string;
  generated: string;
  noticeTitle: string;
  noticeBody: string;
};

/** What the person exporting typed, or left empty. An empty field is a line
 *  the document does not print at all — a specification with a blank "Client:"
 *  on it looks like a form nobody filled in. */
export type SpecFields = {
  /** The period, named the way the Report screen names it. */
  period: string;
  /** The date the document is dated, already formatted. */
  issued: string;
  preparedBy: string;
  client: string;
  reference: string;
  /** A free line under the details — a purchase order, a caveat, a thank you. */
  note: string;
};

export type SpecLayoutInput = {
  spec: Specification;
  style: SpecStyle;
  labels: SpecLabels;
  names: SpecNames;
  fields: SpecFields;
  /** Whether the document carries the free edition's notice. */
  notice: boolean;
  /** The stamp that goes in the file's properties, as an ISO string. */
  createdAt: string;
};

/** How tall the free edition's notice stands, and the air above it. It is
 *  deliberately a band rather than a line: it is an advertisement on somebody
 *  else's document, and pretending otherwise by hiding it in the footer would
 *  be worse than printing it plainly. */
const NOTICE_HEIGHT = 62;
const NOTICE_GAP = 14;

/** The footer's own strip, measured from the foot of the text block: the
 *  hairline sits a third of the way down it and the line of type under
 *  that, so the notice above can stop where this begins. */
const FOOTER_HEIGHT = 26;

/** The page, resolved: the sizes and colours every block reads. */
type Geometry = {
  width: number;
  height: number;
  margin: number;
  contentWidth: number;
  /** The first and last `y` a block may use. */
  top: number;
  bottom: number;
  accent: string;
  font: (role: keyof typeof SPEC_TYPEFACE.sans) => PdfFont;
  size: {
    title: number;
    heading: number;
    body: number;
    small: number;
    figure: number;
  };
  d: (typeof SPEC_DENSITY)["normal"];
  style: SpecStyle;
};

function geometryOf(style: SpecStyle, notice: boolean): Geometry {
  const paper = PAPER[style.paper];
  const d = SPEC_DENSITY[style.density];
  const face = SPEC_TYPEFACE[style.typeface];
  const reserved =
    (style.footer ? FOOTER_HEIGHT : 0) +
    (notice ? NOTICE_HEIGHT + NOTICE_GAP : 0);
  return {
    width: paper.width,
    height: paper.height,
    margin: d.margin,
    contentWidth: paper.width - d.margin * 2,
    top: d.margin,
    bottom: paper.height - d.margin - reserved,
    accent: SPEC_ACCENT[style.accent],
    font: (role) => face[role],
    size: {
      title: Math.round(d.body * 2.1 * 10) / 10,
      heading: Math.round(d.body * 1.05 * 10) / 10,
      body: d.body,
      small: Math.round(d.body * 0.82 * 10) / 10,
      figure: Math.round(d.body * 1.85 * 10) / 10,
    },
    d,
    style,
  };
}

/** The pages under construction, and the pen down the current one. A block
 *  asks for room with `ensure`; when there is not enough the sheet starts a
 *  page and the block carries on at the top of it. */
class Sheet {
  readonly pages: PageBuilder[] = [];
  private current: PageBuilder;
  private readonly geo: Geometry;
  y: number;

  constructor(geo: Geometry) {
    this.geo = geo;
    this.current = new PageBuilder();
    this.pages.push(this.current);
    this.y = geo.top;
  }

  get page(): PageBuilder {
    return this.current;
  }

  nextPage(): void {
    this.current = new PageBuilder();
    this.pages.push(this.current);
    this.y = this.geo.top;
  }

  ensure(height: number): void {
    if (this.y + height > this.geo.bottom && this.y > this.geo.top) {
      this.nextPage();
    }
  }

  /** Room left on the page as it stands. */
  get left(): number {
    return this.geo.bottom - this.y;
  }
}

// ── The head ────────────────────────────────────────────────────────────────

function headBlock(sheet: Sheet, geo: Geometry, input: SpecLayoutInput): void {
  const { labels, fields, spec, style } = input;
  const { margin, contentWidth } = geo;
  const title = truncate(
    labels.title,
    geo.font("heading"),
    geo.size.title,
    contentWidth,
  );
  const subtitle = `${spec.projectName} · ${fields.period}`;

  if (style.header === "band") {
    const height = geo.size.title + geo.size.body + geo.d.gap * 1.6;
    sheet.page.rect({
      x: 0,
      y: 0,
      width: geo.width,
      height: margin + height,
      color: geo.accent,
    });
    sheet.page.text({
      x: margin,
      y: margin + geo.size.title,
      text: title,
      font: geo.font("heading"),
      size: geo.size.title,
      color: SPEC_PALETTE.reverse,
    });
    sheet.page.text({
      x: margin,
      y: margin + geo.size.title + geo.size.body + 8,
      text: truncate(subtitle, geo.font("body"), geo.size.body, contentWidth),
      font: geo.font("body"),
      size: geo.size.body,
      color: SPEC_PALETTE.reverse,
    });
    sheet.y = margin + height + geo.d.gap;
    return;
  }

  if (style.header === "sidebar") {
    const height = geo.size.title + geo.size.body + 12;
    sheet.page.rect({
      x: margin,
      y: sheet.y,
      width: 4,
      height,
      color: geo.accent,
    });
    const x = margin + 16;
    sheet.page.text({
      x,
      y: sheet.y + geo.size.title * 0.86,
      text: truncate(
        title,
        geo.font("heading"),
        geo.size.title,
        contentWidth - 16,
      ),
      font: geo.font("heading"),
      size: geo.size.title,
      color: geo.accent,
    });
    sheet.page.text({
      x,
      y: sheet.y + height - 1,
      text: truncate(
        subtitle,
        geo.font("body"),
        geo.size.body,
        contentWidth - 16,
      ),
      font: geo.font("body"),
      size: geo.size.body,
      color: SPEC_PALETTE.muted,
    });
    sheet.y += height + geo.d.gap;
    return;
  }

  if (style.header === "centred") {
    const centre = margin + contentWidth / 2;
    sheet.page.line({
      x1: margin,
      y1: sheet.y,
      x2: margin + contentWidth,
      y2: sheet.y,
      width: 1.6,
      color: geo.accent,
    });
    sheet.y += geo.size.title * 0.95 + 10;
    sheet.page.text({
      x: centre,
      y: sheet.y,
      text: title,
      font: geo.font("heading"),
      size: geo.size.title,
      color: geo.accent,
      align: "center",
      tracking: geo.size.title * 0.04,
    });
    sheet.y += geo.size.body + 8;
    sheet.page.text({
      x: centre,
      y: sheet.y,
      text: truncate(subtitle, geo.font("body"), geo.size.body, contentWidth),
      font: geo.font("body"),
      size: geo.size.body,
      color: SPEC_PALETTE.muted,
      align: "center",
    });
    sheet.y += 10;
    sheet.page.line({
      x1: margin,
      y1: sheet.y,
      x2: margin + contentWidth,
      y2: sheet.y,
      width: 0.6,
      color: geo.accent,
    });
    sheet.y += geo.d.gap;
    return;
  }

  // "rule" and "plain" share the same setting; only the rule differs.
  sheet.y += geo.size.title * 0.86;
  sheet.page.text({
    x: margin,
    y: sheet.y,
    text: title,
    font: geo.font("heading"),
    size: geo.size.title,
    color: style.header === "rule" ? geo.accent : SPEC_PALETTE.ink,
  });
  sheet.page.text({
    x: margin + contentWidth,
    y: sheet.y,
    text: truncate(
      subtitle,
      geo.font("body"),
      geo.size.body,
      contentWidth * 0.55,
    ),
    font: geo.font("body"),
    size: geo.size.body,
    color: SPEC_PALETTE.muted,
    align: "right",
  });
  sheet.y += 10;
  if (style.header === "rule") {
    sheet.page.line({
      x1: margin,
      y1: sheet.y,
      x2: margin + contentWidth,
      y2: sheet.y,
      width: 2,
      color: geo.accent,
    });
    sheet.y += 4;
  }
  sheet.y += geo.d.gap;
}

// ── The details ─────────────────────────────────────────────────────────────

/** Project, period, who it is from and who it is for — in two columns of
 *  label-over-value, and only the ones that were filled in. */
function detailsBlock(
  sheet: Sheet,
  geo: Geometry,
  input: SpecLayoutInput,
): void {
  const { labels, fields, spec } = input;
  const entries: [string, string][] = [
    [labels.project, spec.projectName],
    [labels.period, fields.period],
    [labels.issued, fields.issued],
    [labels.preparedBy, fields.preparedBy],
    [labels.client, fields.client],
    [labels.reference, fields.reference],
  ].filter(([, value]) => value.trim() !== "") as [string, string][];

  const columns = 3;
  const colWidth = geo.contentWidth / columns;
  const lineHeight = geo.size.small + geo.size.body + 14;
  const rows = Math.ceil(entries.length / columns);
  sheet.ensure(rows * lineHeight + geo.d.gap);

  entries.forEach(([label, value], i) => {
    const x = geo.margin + (i % columns) * colWidth;
    const y = sheet.y + Math.floor(i / columns) * lineHeight;
    sheet.page.text({
      x,
      y: y + geo.size.small,
      text: label.toUpperCase(),
      font: geo.font("label"),
      size: geo.size.small,
      color: SPEC_PALETTE.muted,
      tracking: geo.size.small * 0.08,
    });
    sheet.page.text({
      x,
      y: y + geo.size.small + geo.size.body + 4,
      text: truncate(value, geo.font("body"), geo.size.body, colWidth - 10),
      font: geo.font("body"),
      size: geo.size.body,
      color: SPEC_PALETTE.ink,
    });
  });
  sheet.y += rows * lineHeight;

  if (fields.note.trim() !== "") {
    const lines = wrap(
      fields.note.trim(),
      geo.font("note"),
      geo.size.body,
      geo.contentWidth,
    );
    sheet.y += 6;
    for (const line of lines) {
      sheet.ensure(geo.size.body + 3);
      sheet.y += geo.size.body;
      sheet.page.text({
        x: geo.margin,
        y: sheet.y,
        text: line,
        font: geo.font("note"),
        size: geo.size.body,
        color: SPEC_PALETTE.muted,
      });
      sheet.y += 3;
    }
  }
  sheet.y += geo.d.gap;
}

// ── The figures ─────────────────────────────────────────────────────────────

/** The largest size, down to `min`, at which the text still fits the width.
 *  A quarter of a point at a time, which is finer than anything a reader can
 *  see and coarse enough to settle in a few steps. */
function fitted(
  text: string,
  font: PdfFont,
  size: number,
  min: number,
  width: number,
): number {
  let value = size;
  while (value > min && textWidth(text, font, value) > width) {
    value = Math.round((value - 0.25) * 100) / 100;
  }
  return value;
}

function summaryBlock(
  sheet: Sheet,
  geo: Geometry,
  input: SpecLayoutInput,
): void {
  const { labels, spec, style } = input;
  const cells: [string, string][] = [
    [labels.hours, hoursText(spec.totals.hours, spec.totals.billed, style)],
    [labels.days, String(spec.totals.workedDays)],
  ];
  if (style.sections.balance) {
    cells.push([labels.target, formatDuration(spec.totals.target)]);
    cells.push([labels.balance, signed(spec.totals.balance)]);
  }

  // The strip, set out from its two baselines rather than from its height:
  // a label in small capitals sitting a point off the figure under it reads
  // as part of the figure. The gap is the body size, which is the same air
  // the details block leaves between a caption and its line.
  const pad = 12;
  const labelBase = pad + geo.size.small;
  const figureBase = labelBase + geo.size.body * 0.8 + geo.size.figure * 0.72;
  const height = figureBase + pad * 0.7;
  sheet.ensure(height + geo.d.gap);
  const width = geo.contentWidth / cells.length;

  sheet.page.rect({
    x: geo.margin,
    y: sheet.y,
    width: geo.contentWidth,
    height,
    color: SPEC_PALETTE.tint,
  });
  sheet.page.rect({
    x: geo.margin,
    y: sheet.y,
    width: geo.contentWidth,
    height: 2,
    color: geo.accent,
  });

  cells.forEach(([label, value], i) => {
    const x = geo.margin + i * width + 12;
    sheet.page.text({
      x,
      y: sheet.y + labelBase,
      text: label.toUpperCase(),
      font: geo.font("label"),
      size: geo.size.small,
      color: SPEC_PALETTE.muted,
      tracking: geo.size.small * 0.08,
    });
    // The figure is set as large as its cell will take it. Four figures on
    // a narrow page would otherwise cut the first one in half, and a total
    // that reads "103h 29m \u2026" is not a total.
    const size = fitted(
      value,
      geo.font("heading"),
      geo.size.figure,
      geo.size.body * 1.15,
      width - 20,
    );
    sheet.page.text({
      x,
      y: sheet.y + figureBase,
      text: truncate(value, geo.font("heading"), size, width - 20),
      font: geo.font("heading"),
      size,
      color: i === 0 ? geo.accent : SPEC_PALETTE.ink,
    });
    if (i > 0) {
      sheet.page.line({
        x1: geo.margin + i * width,
        y1: sheet.y + 10,
        x2: geo.margin + i * width,
        y2: sheet.y + height - 10,
        width: 0.5,
        color: SPEC_PALETTE.rule,
      });
    }
  });
  sheet.y += height;

  // What the figure above is: a client handed a total they cannot reconcile
  // against the times beside it will ask, and should.
  if (spec.rounding > 0) {
    sheet.y += geo.size.small + 5;
    sheet.page.text({
      x: geo.margin,
      y: sheet.y,
      text: truncate(
        labels.roundedNote,
        geo.font("note"),
        geo.size.small,
        geo.contentWidth,
      ),
      font: geo.font("note"),
      size: geo.size.small,
      color: SPEC_PALETTE.muted,
    });
  }
  sheet.y += geo.d.gap;
}

// ── Tables ──────────────────────────────────────────────────────────────────

type Column = { label: string; weight: number; align: Align };

type Row = {
  cells: string[];
  /** A totals row: bold, over a rule. */
  total?: boolean;
  /** An itemised line under a day — indented, smaller, quieter. */
  detail?: boolean;
  /** A day the project expected and nobody worked. */
  faint?: boolean;
};

function columnLayout(geo: Geometry, columns: readonly Column[]) {
  const sum = columns.reduce((a, c) => a + c.weight, 0);
  let x = geo.margin;
  return columns.map((column) => {
    const width = (column.weight / sum) * geo.contentWidth;
    const box = { column, x, width };
    x += width;
    return box;
  });
}

function cellX(box: { x: number; width: number }, align: Align): number {
  const pad = 5;
  if (align === "right") return box.x + box.width - pad;
  if (align === "center") return box.x + box.width / 2;
  return box.x + pad;
}

function tableHead(
  sheet: Sheet,
  geo: Geometry,
  boxes: ReturnType<typeof columnLayout>,
): void {
  const height = geo.d.row * 0.9;
  if (geo.style.table === "boxed" || geo.style.table === "zebra") {
    sheet.page.rect({
      x: geo.margin,
      y: sheet.y,
      width: geo.contentWidth,
      height,
      color: SPEC_PALETTE.tint,
    });
  }
  for (const box of boxes) {
    sheet.page.text({
      x: cellX(box, box.column.align),
      y: sheet.y + height - (height - geo.size.small) / 2 - 1,
      text: truncate(
        box.column.label.toUpperCase(),
        geo.font("label"),
        geo.size.small,
        box.width - 10,
      ),
      font: geo.font("label"),
      size: geo.size.small,
      color: SPEC_PALETTE.muted,
      align: box.column.align,
      tracking: geo.size.small * 0.06,
    });
  }
  sheet.y += height;
  sheet.page.line({
    x1: geo.margin,
    y1: sheet.y,
    x2: geo.margin + geo.contentWidth,
    y2: sheet.y,
    width: 1,
    color: geo.accent,
  });
}

function tableRow(
  sheet: Sheet,
  geo: Geometry,
  boxes: ReturnType<typeof columnLayout>,
  row: Row,
  index: number,
): void {
  const height = row.detail ? geo.d.row * 0.78 : geo.d.row;
  const size = row.detail ? geo.size.small : geo.size.body;
  const baseline = sheet.y + (height + size) / 2 - 1;

  if (geo.style.table === "zebra" && index % 2 === 1 && !row.total) {
    sheet.page.rect({
      x: geo.margin,
      y: sheet.y,
      width: geo.contentWidth,
      height,
      color: SPEC_PALETTE.tint,
    });
  }
  if (row.total) {
    sheet.page.line({
      x1: geo.margin,
      y1: sheet.y,
      x2: geo.margin + geo.contentWidth,
      y2: sheet.y,
      width: 1,
      color: geo.accent,
    });
  }

  boxes.forEach((box, i) => {
    const text = row.cells[i] ?? "";
    if (text === "") return;
    const figures = i > 0 && !row.detail;
    const font = row.total
      ? geo.font("heading")
      : row.detail
        ? geo.font("note")
        : figures
          ? geo.font("figures")
          : geo.font("body");
    sheet.page.text({
      x: cellX(box, box.column.align) + (row.detail && i === 0 ? 12 : 0),
      y: baseline,
      text: truncate(
        text,
        font,
        size,
        box.width - 10 - (row.detail && i === 0 ? 12 : 0),
      ),
      font,
      size,
      color: row.total
        ? SPEC_PALETTE.ink
        : row.detail || row.faint
          ? SPEC_PALETTE.muted
          : SPEC_PALETTE.ink,
      align: box.column.align,
    });
  });

  sheet.y += height;

  if (
    (geo.style.table === "ruled" || geo.style.table === "boxed") &&
    !row.total
  ) {
    sheet.page.line({
      x1: geo.margin,
      y1: sheet.y,
      x2: geo.margin + geo.contentWidth,
      y2: sheet.y,
      width: 0.4,
      color: SPEC_PALETTE.hairline,
    });
  }
}

/** The vertical rules and the box a "boxed" table is drawn in, over the
 *  stretch of page the rows just took. */
function tableFrame(
  sheet: Sheet,
  geo: Geometry,
  boxes: ReturnType<typeof columnLayout>,
  from: number,
): void {
  if (geo.style.table !== "boxed") return;
  const to = sheet.y;
  for (const box of boxes.slice(1)) {
    sheet.page.line({
      x1: box.x,
      y1: from,
      x2: box.x,
      y2: to,
      width: 0.4,
      color: SPEC_PALETTE.hairline,
    });
  }
  sheet.page.line({
    x1: geo.margin,
    y1: from,
    x2: geo.margin,
    y2: to,
    width: 0.4,
    color: SPEC_PALETTE.hairline,
  });
  sheet.page.line({
    x1: geo.margin + geo.contentWidth,
    y1: from,
    x2: geo.margin + geo.contentWidth,
    y2: to,
    width: 0.4,
    color: SPEC_PALETTE.hairline,
  });
}

function sectionHeading(sheet: Sheet, geo: Geometry, text: string): void {
  sheet.ensure(geo.size.heading + geo.d.row * 2);
  sheet.y += geo.size.heading;
  sheet.page.text({
    x: geo.margin,
    y: sheet.y,
    text: truncate(
      text,
      geo.font("heading"),
      geo.size.heading,
      geo.contentWidth,
    ),
    font: geo.font("heading"),
    size: geo.size.heading,
    color: geo.accent,
  });
  sheet.y += 7;
}

/** A table, flowed: the head is redrawn at the top of every page it runs
 *  onto, because a column of figures with no heading on page three is a
 *  column of figures nobody can read. */
function table(
  sheet: Sheet,
  geo: Geometry,
  columns: readonly Column[],
  rows: readonly Row[],
): void {
  const boxes = columnLayout(geo, columns);
  sheet.ensure(geo.d.row * 3);
  let frameFrom = sheet.y;
  tableHead(sheet, geo, boxes);
  rows.forEach((row, index) => {
    const height = row.detail ? geo.d.row * 0.78 : geo.d.row;
    if (sheet.left < height) {
      tableFrame(sheet, geo, boxes, frameFrom);
      sheet.nextPage();
      frameFrom = sheet.y;
      tableHead(sheet, geo, boxes);
    }
    tableRow(sheet, geo, boxes, row, index);
  });
  tableFrame(sheet, geo, boxes, frameFrom);
  sheet.y += geo.d.gap;
}

// ── The figures, as words ───────────────────────────────────────────────────

function hoursText(hours: number, seconds: number, style: SpecStyle): string {
  if (style.figures === "decimal") return formatHoursValue(hours);
  if (style.figures === "hm") return formatDuration(seconds);
  return `${formatDuration(seconds)} · ${formatHoursValue(hours)}`;
}

function signed(seconds: number): string {
  const sign = seconds < 0 ? "–" : "+";
  return `${sign}${formatDuration(Math.abs(seconds))}`;
}

function share(fraction: number): string {
  return `${Math.round(fraction * 1000) / 10}%`;
}

/** The two figure columns a table carries, which depends on the style: hours
 *  and minutes, decimal hours, or one of each. */
function figureColumns(labels: SpecLabels, style: SpecStyle): Column[] {
  if (style.figures === "hm") {
    return [{ label: labels.hours, weight: 16, align: "right" }];
  }
  if (style.figures === "decimal") {
    return [{ label: labels.decimal, weight: 16, align: "right" }];
  }
  return [
    { label: labels.hours, weight: 15, align: "right" },
    { label: labels.decimal, weight: 13, align: "right" },
  ];
}

function figureCells(
  seconds: number,
  hours: number,
  style: SpecStyle,
): string[] {
  if (style.figures === "hm") return [formatDuration(seconds)];
  if (style.figures === "decimal") return [formatHoursValue(hours)];
  return [formatDuration(seconds), formatHoursValue(hours)];
}

// ── The breakdown tables ────────────────────────────────────────────────────

function amountTable(
  sheet: Sheet,
  geo: Geometry,
  input: SpecLayoutInput,
  heading: string,
  kindLabel: string,
  amounts: readonly SpecAmount[],
  name: (id: string | null) => string,
  totalSeconds: number,
  totalHours: number,
): void {
  if (amounts.length === 0) return;
  const { labels, style } = input;
  sectionHeading(sheet, geo, heading);
  table(
    sheet,
    geo,
    [
      { label: kindLabel, weight: 46, align: "left" },
      ...figureColumns(labels, style),
      { label: labels.share, weight: 14, align: "right" },
    ],
    [
      ...amounts.map((amount) => ({
        cells: [
          amount.kind === "rounding" ? labels.rounding : name(amount.id),
          ...figureCells(amount.seconds, amount.hours, style),
          share(amount.share),
        ],
      })),
      {
        cells: [
          labels.total,
          ...figureCells(totalSeconds, totalHours, style),
          "",
        ],
        total: true,
      },
    ],
  );
}

// ── The day-by-day table ────────────────────────────────────────────────────

function dailyTable(sheet: Sheet, geo: Geometry, input: SpecLayoutInput): void {
  const { labels, names, spec, style } = input;
  sectionHeading(sheet, geo, labels.daily);

  const columns: Column[] = [
    { label: labels.date, weight: 30, align: "left" },
    { label: labels.start, weight: 14, align: "right" },
    { label: labels.end, weight: 14, align: "right" },
    { label: labels.breakColumn, weight: 14, align: "right" },
    ...figureColumns(labels, style),
  ];

  const rows: Row[] = [];
  for (const day of spec.days) {
    rows.push({
      cells: [
        names.day(day.date),
        day.firstIn === null ? "–" : formatTimeOfDay(day.firstIn),
        day.lastOut === null
          ? day.firstIn === null
            ? "–"
            : labels.running
          : formatTimeOfDay(day.lastOut),
        day.breakTotal > 0 ? formatDuration(day.breakTotal) : "–",
        ...figureCells(day.billed, day.hours, style),
      ],
      faint: day.worked === 0,
    });
    if (style.detail === "entries") {
      for (const segment of day.segments) {
        rows.push({
          cells: [
            segmentName(segment, input),
            formatTimeOfDay(segment.start),
            formatTimeOfDay(segment.end),
            "",
            ...detailFigures(segment, style),
          ],
          detail: true,
        });
      }
    }
  }
  rows.push({
    cells: [
      labels.total,
      "",
      "",
      spec.totals.breakTotal > 0 ? formatDuration(spec.totals.breakTotal) : "",
      ...figureCells(spec.totals.billed, spec.totals.hours, style),
    ],
    total: true,
  });

  table(sheet, geo, columns, rows);
}

/** What a stretch puts in the figure columns: how long it ran, and — for a
 *  break — brackets round it and an empty decimal. A break is time the day
 *  did *not* bill for, and a figure of its own in the column the invoice is
 *  added up from is a figure somebody eventually adds in. */
function detailFigures(
  segment: SpecDay["segments"][number],
  style: SpecStyle,
): string[] {
  const seconds = segment.end - segment.start;
  const cells = figureCells(seconds, decimalHours(seconds), style);
  if (segment.kind !== "break") return cells;
  if (style.figures === "decimal") return [`(${cells[0]})`];
  return [`(${cells[0]})`, ...cells.slice(1).map(() => "")];
}

function segmentName(
  segment: SpecDay["segments"][number],
  input: SpecLayoutInput,
): string {
  if (segment.kind === "break") {
    return segment.typeId === null
      ? input.labels.breaks
      : input.names.breakType(segment.typeId);
  }
  return input.names.category(segment.typeId);
}

// ── Signing off ─────────────────────────────────────────────────────────────

function signatureBlock(
  sheet: Sheet,
  geo: Geometry,
  input: SpecLayoutInput,
): void {
  const height = geo.d.row * 2.6;
  sheet.ensure(height + geo.d.gap);
  sheet.y += geo.d.gap;
  const width = (geo.contentWidth - 30) / 2;
  [input.labels.signature, input.labels.signedDate].forEach((label, i) => {
    const x = geo.margin + i * (width + 30);
    sheet.page.line({
      x1: x,
      y1: sheet.y + height - geo.size.small - 6,
      x2: x + width,
      y2: sheet.y + height - geo.size.small - 6,
      width: 0.6,
      color: SPEC_PALETTE.rule,
    });
    sheet.page.text({
      x,
      y: sheet.y + height,
      text: label,
      font: geo.font("note"),
      size: geo.size.small,
      color: SPEC_PALETTE.muted,
    });
  });
  sheet.y += height;
}

// ── What every page carries ─────────────────────────────────────────────────

function footerAndNotice(
  pages: readonly PageBuilder[],
  geo: Geometry,
  input: SpecLayoutInput,
): void {
  const { labels, names, style, notice, spec, fields } = input;
  pages.forEach((page, index) => {
    const base = geo.height - geo.margin;
    if (notice) {
      const top = base - (style.footer ? FOOTER_HEIGHT : 0) - NOTICE_HEIGHT;
      page.rect({
        x: geo.margin,
        y: top,
        width: geo.contentWidth,
        height: NOTICE_HEIGHT,
        color: SPEC_PALETTE.tint,
      });
      page.rect({
        x: geo.margin,
        y: top,
        width: 3.5,
        height: NOTICE_HEIGHT,
        color: geo.accent,
      });
      page.text({
        x: geo.margin + 16,
        y: top + 22,
        text: truncate(
          labels.noticeTitle,
          geo.font("heading"),
          geo.size.body * 1.3,
          geo.contentWidth - 32,
        ),
        font: geo.font("heading"),
        size: geo.size.body * 1.3,
        color: SPEC_PALETTE.ink,
      });
      const lines = wrap(
        labels.noticeBody,
        geo.font("body"),
        geo.size.body,
        geo.contentWidth - 32,
      ).slice(0, 2);
      lines.forEach((line, i) => {
        page.text({
          x: geo.margin + 16,
          y: top + 38 + i * (geo.size.body + 3),
          text: line,
          font: geo.font("body"),
          size: geo.size.body,
          color: SPEC_PALETTE.muted,
        });
      });
    }
    if (!style.footer) return;
    // The footer's own strip, measured from the top of it, so the rule lands
    // clear of whatever stands above — the notice, on a build that carries
    // one.
    const rule = base - FOOTER_HEIGHT + 7;
    const y = rule + geo.size.small + 5;
    page.line({
      x1: geo.margin,
      y1: rule,
      x2: geo.margin + geo.contentWidth,
      y2: rule,
      width: 0.4,
      color: SPEC_PALETTE.hairline,
    });
    page.text({
      x: geo.margin,
      y,
      // What the page is, for whoever is holding one of them apart from the
      // rest: the project and the period, not the name of the app that made
      // it — that is the notice's job, and on a build that carries no notice
      // it is nobody's.
      text: truncate(
        `${spec.projectName} \u00b7 ${fields.period}`,
        geo.font("note"),
        geo.size.small,
        geo.contentWidth * 0.6,
      ),
      font: geo.font("note"),
      size: geo.size.small,
      color: SPEC_PALETTE.muted,
    });
    page.text({
      x: geo.margin + geo.contentWidth,
      y,
      text: names.page(index + 1, pages.length),
      font: geo.font("note"),
      size: geo.size.small,
      color: SPEC_PALETTE.muted,
      align: "right",
    });
  });
}

// ── The document ────────────────────────────────────────────────────────────

/** The specification as pages. */
export function layoutSpec(input: SpecLayoutInput): PdfDoc {
  const { spec, style, labels, names, fields } = input;
  const geo = geometryOf(style, input.notice);
  const sheet = new Sheet(geo);

  headBlock(sheet, geo, input);
  detailsBlock(sheet, geo, input);
  if (style.sections.summary) summaryBlock(sheet, geo, input);
  if (style.sections.categories) {
    amountTable(
      sheet,
      geo,
      input,
      labels.categories,
      labels.kind,
      spec.categories,
      (id) => names.category(id),
      spec.totals.billed,
      spec.totals.hours,
    );
  }
  if (style.sections.breaks) {
    amountTable(
      sheet,
      geo,
      input,
      labels.breaks,
      labels.kind,
      spec.breaks,
      (id) => (id === null ? labels.breaks : names.breakType(id)),
      spec.totals.breakTotal,
      spec.breaks.reduce((a, b) => a + b.hours, 0),
    );
  }
  if (style.detail !== "period") dailyTable(sheet, geo, input);
  if (style.sections.signature) signatureBlock(sheet, geo, input);

  footerAndNotice(sheet.pages, geo, input);

  const pages: PdfPage[] = sheet.pages.map((page) => page.page());
  return {
    width: geo.width,
    height: geo.height,
    pages,
    meta: {
      title: `${labels.title} — ${spec.projectName} — ${fields.period}`,
      author: fields.preparedBy,
      subject: labels.title,
      createdAt: input.createdAt,
      creator: labels.generated,
    },
  };
}
