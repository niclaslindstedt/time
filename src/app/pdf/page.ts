// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// A page, as the three things anything on one of these pages is made of: a
// line of type, a filled rectangle, a rule. Everything the specification
// draws — the header band, the table's zebra, the hairline under a total, the
// figures themselves — is one of those three, placed in points from the top
// left corner of the page.
//
// It is deliberately this small. The layout (`specLayout.ts`) works in these
// primitives and nothing else, which is what lets the same page go two ways:
// `write.ts` turns it into the bytes of a PDF, and `SpecPages.tsx` draws it as
// an SVG for the preview and for printing. Two renderers over one layout is
// the only arrangement in which what the modal shows, what the printer puts on
// paper and what the client opens are the same document — and a specification
// that printed differently from the file attached to the invoice would be the
// one failure this whole feature exists to avoid.
//
// Points, because that is the unit a PDF is measured in: 72 to the inch. The
// origin is the top left and `y` grows downwards, the way a page is read and
// the way SVG works; `write.ts` flips it once, at the bottom, where PDF's
// bottom-left origin is a fact about the format rather than about the layout.

import { textWidth, type PdfFont } from "./metrics.ts";

/** Where a line of type sits against its `x`. */
export type Align = "left" | "center" | "right";

/** A line of type. `y` is the baseline, which is what both a PDF text
 *  object and an SVG `<text>` are placed by. */
export type TextItem = {
  kind: "text";
  x: number;
  y: number;
  text: string;
  font: PdfFont;
  size: number;
  color: string;
  align?: Align;
  /** Extra space between characters, in points — what a line of small caps
   *  or a label set in tracked-out capitals is opened up by. */
  tracking?: number;
};

/** A filled rectangle: a header band, a zebra stripe, a swatch. */
export type RectItem = {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

/** A rule. Horizontal or vertical or neither — a line is two points. */
export type LineItem = {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: string;
};

export type PageItem = TextItem | RectItem | LineItem;

export type PdfPage = {
  items: PageItem[];
};

/** What a reader shows in its title bar and what a file manager indexes.
 *  Nothing here leaves the device — a PDF written to disk is the user's
 *  file — but it is still only ever what the user put in the form. */
export type PdfMeta = {
  title: string;
  author: string;
  subject: string;
  /** The stamp in the file's `CreationDate`, as an ISO string. Passed in
   *  rather than read, so the writer is clock-free and a test can pin it. */
  createdAt: string;
  /** What wrote the file, for the reader's document properties. */
  creator?: string;
};

export type PdfDoc = {
  /** Page size in points. */
  width: number;
  height: number;
  pages: PdfPage[];
  meta: PdfMeta;
};

/** The two paper sizes, in points. A4 is the one most of the world prints a
 *  specification on and Letter is the one the rest does; there is no third
 *  answer worth a control. */
export const PAPER = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

export type Paper = keyof typeof PAPER;

export const PAPERS: Paper[] = ["a4", "letter"];

/** A page under construction: the items, in the order they are drawn. */
export class PageBuilder {
  readonly items: PageItem[] = [];

  text(item: Omit<TextItem, "kind">): void {
    if (item.text === "") return;
    this.items.push({ kind: "text", ...item });
  }

  rect(item: Omit<RectItem, "kind">): void {
    if (item.width <= 0 || item.height <= 0) return;
    this.items.push({ kind: "rect", ...item });
  }

  line(item: Omit<LineItem, "kind">): void {
    this.items.push({ kind: "line", ...item });
  }

  page(): PdfPage {
    return { items: this.items };
  }
}

/** How wide a line of type comes out, tracking and all. The tracking counts
 *  between the characters and not after the last one, so a tracked label
 *  centres on the ink rather than on the space after it. */
export function itemWidth(item: TextItem): number {
  const gaps = Math.max(0, [...item.text].length - 1);
  return (
    textWidth(item.text, item.font, item.size) + gaps * (item.tracking ?? 0)
  );
}

/** What `align` moves the line by — added to `x` by both renderers, so a
 *  centred heading lands on the same point in the file and on the screen. */
export function alignOffset(item: TextItem): number {
  if (item.align === "center") return -itemWidth(item) / 2;
  if (item.align === "right") return -itemWidth(item);
  return 0;
}
