// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// How a specification looks: the vocabulary the export modal picks from, and
// the six ways it is already combined.
//
// The same arrangement as the dial's (`look.ts`): every option is an id and a
// spec, so the settings can validate what comes back from storage and a test
// can walk the tables. Six presets are the way in — a consultant exporting a
// month wants a document that looks right, not eight controls — and "Custom"
// takes the same pieces apart for whoever wants to set them.
//
// The colours here are fixed hex and not the theme's tokens, which is the one
// place in the app besides the watch face where that is right: a printed
// document has a colour of its own the way an object does. The specification
// is white paper and dark ink whichever theme the app is wearing, because it
// is going to be opened by somebody who has never seen the app and possibly
// printed on a laser printer.
//
// Named for what they look like rather than for anyone who makes documents
// look that way.

import { PAPERS, type Paper } from "./pdf/page.ts";
import type { PdfFont } from "./pdf/metrics.ts";

// ── Typefaces ───────────────────────────────────────────────────────────────

/** The faces a specification is set in: one for the headings, one for the
 *  body, one for the figures, and one for a label set in capitals. Four roles
 *  rather than one family, because the figures are the part of this document
 *  anybody actually reads, and a column of them wants a face that keeps them
 *  in line. */
export type SpecTypefaceSpec = {
  heading: PdfFont;
  body: PdfFont;
  /** The figures in the tables. */
  figures: PdfFont;
  /** A column header or a small label. */
  label: PdfFont;
  /** A note or a caption. */
  note: PdfFont;
};

export type SpecTypeface =
  "sans" | "roman" | "editorial" | "technical" | "typewriter";

export const SPEC_TYPEFACES: SpecTypeface[] = [
  "sans",
  "roman",
  "editorial",
  "technical",
  "typewriter",
];

export const SPEC_TYPEFACE: Record<SpecTypeface, SpecTypefaceSpec> = {
  // One family throughout: the plainest a business document gets, and the
  // one that survives being printed badly.
  sans: {
    heading: "helveticaBold",
    body: "helvetica",
    figures: "helvetica",
    label: "helveticaBold",
    note: "helveticaOblique",
  },
  // The letterhead answer: serif everywhere, the way a letter from a firm of
  // accountants has always been set.
  roman: {
    heading: "timesBold",
    body: "times",
    figures: "times",
    label: "timesBold",
    note: "timesItalic",
  },
  // Serif headings over a sans body — a magazine's arrangement, and the one
  // that reads best when the document has more prose than table.
  editorial: {
    heading: "timesBold",
    body: "helvetica",
    figures: "helvetica",
    label: "helveticaBold",
    note: "timesItalic",
  },
  // Sans headings, monospaced figures: the columns line up to the character,
  // which is what a table somebody is going to check wants.
  technical: {
    heading: "helveticaBold",
    body: "helvetica",
    figures: "courier",
    label: "helveticaBold",
    note: "helveticaOblique",
  },
  // Monospaced throughout — a timesheet as it came off the machine.
  typewriter: {
    heading: "courierBold",
    body: "courier",
    figures: "courier",
    label: "courierBold",
    note: "courier",
  },
};

// ── The head of the first page ──────────────────────────────────────────────

/** How the top of the document is set. The one choice that decides what a
 *  reader sees before they read anything. */
export type SpecHeader =
  /** The title over a heavy rule, the details ranged right of it. */
  | "rule"
  /** A filled band in the accent with the title reversed out of it. */
  | "band"
  /** A bar of accent down the left, the title beside it. */
  | "sidebar"
  /** Title centred over a pair of rules, the details centred under. */
  | "centred"
  /** No ornament at all: the title, then the details, then the tables. */
  | "plain";

export const SPEC_HEADERS: SpecHeader[] = [
  "rule",
  "band",
  "sidebar",
  "centred",
  "plain",
];

// ── Colour ──────────────────────────────────────────────────────────────────

/** The one colour a specification is allowed, used for the rules, the
 *  headings and whatever the header fills. Eight, all of them dark enough to
 *  hold white type and quiet enough to send to a client. */
export type SpecAccent =
  "ink" | "navy" | "slate" | "teal" | "burgundy" | "forest" | "copper" | "plum";

export const SPEC_ACCENTS: SpecAccent[] = [
  "ink",
  "navy",
  "slate",
  "teal",
  "burgundy",
  "forest",
  "copper",
  "plum",
];

export const SPEC_ACCENT: Record<SpecAccent, string> = {
  ink: "#1b1f24",
  navy: "#1f3a63",
  slate: "#41505e",
  teal: "#11605f",
  burgundy: "#6d2740",
  forest: "#27513c",
  copper: "#8a4a22",
  plum: "#4c2e59",
};

/** The colours every specification shares, whatever its accent: the paper,
 *  the text, the quiet text, the hairlines, and the tint a zebra stripe or a
 *  table head is filled with. */
export const SPEC_PALETTE = {
  paper: "#ffffff",
  ink: "#16191d",
  muted: "#5d6670",
  rule: "#c6ccd3",
  hairline: "#d8dde2",
  tint: "#f3f5f7",
  reverse: "#ffffff",
} as const;

// ── Tables ──────────────────────────────────────────────────────────────────

/** How the rows of a table are told apart. */
export type SpecTable =
  /** A hairline under every row. */
  | "ruled"
  /** Every other row on a tint. */
  | "zebra"
  /** Nothing between the rows: a rule under the head, a rule over the
   *  total, and white space doing the rest. */
  | "open"
  /** Ruled, and boxed in, with the columns divided. */
  | "boxed";

export const SPEC_TABLES: SpecTable[] = ["ruled", "zebra", "open", "boxed"];

// ── Density ─────────────────────────────────────────────────────────────────

export type SpecDensity = "compact" | "normal" | "roomy";

export const SPEC_DENSITIES: SpecDensity[] = ["compact", "normal", "roomy"];

/** What a density is, in points: the body size everything else is figured
 *  from, the height of a table row, the space between blocks, and the margin
 *  round the page. */
export type SpecDensitySpec = {
  body: number;
  row: number;
  gap: number;
  margin: number;
};

export const SPEC_DENSITY: Record<SpecDensity, SpecDensitySpec> = {
  compact: { body: 8.5, row: 14, gap: 14, margin: 44 },
  normal: { body: 9.5, row: 17, gap: 18, margin: 54 },
  roomy: { body: 10.5, row: 20.5, gap: 24, margin: 64 },
};

// ── Figures ─────────────────────────────────────────────────────────────────

/** How an amount of time is printed. Decimal hours are what an invoice line
 *  is worked out from; hours and minutes are what a person recognises as
 *  their own day. Most documents want both, in two columns. */
export type SpecFigures = "hm" | "decimal" | "both";

export const SPEC_FIGURE_STYLES: SpecFigures[] = ["hm", "decimal", "both"];

// ── What the document contains ──────────────────────────────────────────────

/**
 * How finely the hours are accounted for — the one choice that decides how
 * long the document is and how much of the day it tells.
 *
 * A client on a fixed monthly retainer wants the total and the kinds of work
 * it went on; a client paying by the day wants the days; a client querying an
 * invoice wants the stretches. All three are the same hours read at different
 * grains, never a different sum.
 */
export type SpecDetail =
  /** The totals for the range, and no table of days at all. */
  | "period"
  /** A row per day: when it started, when it ended, and what it came to. */
  | "day"
  /** Every stretch of every day under its day — each spell of work and each
   *  break, with the times they ran between. */
  | "entries";

export const SPEC_DETAILS: SpecDetail[] = ["period", "day", "entries"];

/** The blocks a specification may carry besides its hours, each one on or
 *  off — what this particular client is owed an account of. */
export type SpecSections = {
  /** The figures at the top: hours, days, period. */
  summary: boolean;
  /** Hours by kind of work — the table a differential rate is read off. */
  categories: boolean;
  /** Break time by kind. */
  breaks: boolean;
  /** Target and balance. Internal figures: a client is owed the hours, not
   *  how they stand against a contract of employment. */
  balance: boolean;
  /** A ruled line to sign off on. */
  signature: boolean;
};

export const SPEC_SECTIONS: (keyof SpecSections)[] = [
  "summary",
  "categories",
  "breaks",
  "balance",
  "signature",
];

// ── A style ─────────────────────────────────────────────────────────────────

export type SpecStyle = {
  typeface: SpecTypeface;
  header: SpecHeader;
  accent: SpecAccent;
  table: SpecTable;
  density: SpecDensity;
  paper: Paper;
  figures: SpecFigures;
  /** How finely the hours are accounted for. */
  detail: SpecDetail;
  sections: SpecSections;
  /** List a day the project expected but nobody worked, as the empty row it
   *  was, rather than leaving it out. */
  blanks: boolean;
  /** The line along the foot of every page: what this is, and page so-many
   *  of so-many. */
  footer: boolean;
};

export type SpecPreset =
  "ledger" | "studio" | "editorial" | "plain" | "technical" | "executive";

export const SPEC_PRESETS: SpecPreset[] = [
  "ledger",
  "studio",
  "editorial",
  "plain",
  "technical",
  "executive",
];

const ALL: SpecSections = {
  summary: true,
  categories: true,
  breaks: true,
  balance: false,
  signature: false,
};

export const SPEC_PRESET: Record<SpecPreset, SpecStyle> = {
  // The accountant's letter: serif, centred, ink on white, every row ruled.
  ledger: {
    typeface: "roman",
    header: "centred",
    accent: "ink",
    table: "ruled",
    density: "normal",
    paper: "a4",
    figures: "both",
    detail: "day",
    sections: { ...ALL, signature: true },
    blanks: false,
    footer: true,
  },
  // The one that looks like it came out of a design studio: a band of colour
  // across the top and a zebra under the figures.
  studio: {
    typeface: "sans",
    header: "band",
    accent: "teal",
    table: "zebra",
    density: "normal",
    paper: "a4",
    figures: "both",
    detail: "day",
    sections: ALL,
    blanks: false,
    footer: true,
  },
  // Serif headings over a sans body, a bar of colour down the left, and air
  // between everything.
  editorial: {
    typeface: "editorial",
    header: "sidebar",
    accent: "burgundy",
    table: "open",
    density: "roomy",
    paper: "a4",
    figures: "both",
    detail: "day",
    sections: ALL,
    blanks: false,
    footer: true,
  },
  // Nothing but the hours: no ornament, decimal figures, and as many days to
  // a page as will fit.
  plain: {
    typeface: "sans",
    header: "plain",
    accent: "slate",
    table: "open",
    density: "compact",
    paper: "a4",
    figures: "decimal",
    detail: "day",
    sections: { ...ALL, breaks: false },
    blanks: false,
    footer: true,
  },
  // The itemised one: every stretch of every day, monospaced, boxed in.
  technical: {
    typeface: "technical",
    header: "rule",
    accent: "forest",
    table: "boxed",
    density: "compact",
    paper: "a4",
    figures: "both",
    detail: "entries",
    sections: { ...ALL, balance: true },
    blanks: true,
    footer: true,
  },
  // The one that goes to whoever signs it off: the totals and the kinds of
  // work they went on, no day-by-day table at all, and a line to sign.
  executive: {
    typeface: "roman",
    header: "sidebar",
    accent: "navy",
    table: "open",
    density: "roomy",
    paper: "letter",
    figures: "both",
    detail: "period",
    sections: { ...ALL, breaks: false, signature: true },
    blanks: false,
    footer: true,
  },
};

/** What the export modal opens on. */
export const DEFAULT_SPEC_PRESET: SpecPreset = "studio";

/** The style a choice comes to: one of the six, or the custom one kept
 *  beside them — the way a dial is either a preset or the custom dial
 *  (`resolveDial`). */
export function resolveSpecStyle(
  preset: SpecPreset | "custom",
  custom: SpecStyle,
): SpecStyle {
  return preset === "custom" ? custom : SPEC_PRESET[preset];
}

function oneOf<K extends string>(
  values: readonly K[],
  value: unknown,
  fallback: K,
): K {
  return values.includes(value as K) ? (value as K) : fallback;
}

/** Stored bytes → a style, every field clamped against its table, so a value
 *  from an older build or a hand-edited one can never pick a face or a paper
 *  size that does not exist. */
export function clampSpecStyle(value: unknown): SpecStyle {
  const base = SPEC_PRESET[DEFAULT_SPEC_PRESET];
  const raw = (
    typeof value === "object" && value !== null ? value : {}
  ) as Partial<Record<keyof SpecStyle, unknown>>;
  const sections = (
    typeof raw.sections === "object" && raw.sections !== null
      ? raw.sections
      : {}
  ) as Partial<Record<keyof SpecSections, unknown>>;
  return {
    typeface: oneOf(SPEC_TYPEFACES, raw.typeface, base.typeface),
    header: oneOf(SPEC_HEADERS, raw.header, base.header),
    accent: oneOf(SPEC_ACCENTS, raw.accent, base.accent),
    table: oneOf(SPEC_TABLES, raw.table, base.table),
    density: oneOf(SPEC_DENSITIES, raw.density, base.density),
    paper: oneOf(PAPERS, raw.paper, base.paper),
    figures: oneOf(SPEC_FIGURE_STYLES, raw.figures, base.figures),
    detail: oneOf(SPEC_DETAILS, raw.detail, base.detail),
    sections: SPEC_SECTIONS.reduce((out, key) => {
      out[key] =
        typeof sections[key] === "boolean"
          ? (sections[key] as boolean)
          : base.sections[key];
      return out;
    }, {} as SpecSections),
    blanks: typeof raw.blanks === "boolean" ? raw.blanks : base.blanks,
    footer: typeof raw.footer === "boolean" ? raw.footer : base.footer,
  };
}
