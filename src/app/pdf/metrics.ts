// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// What a letter is worth, and how it is spelled into a PDF.
//
// The specification is typeset in the fourteen faces every PDF reader is
// required to have — Helvetica, Times and Courier, each with the weights this
// app uses. Nothing is embedded and nothing is fetched: a base-14 font is a
// name in the file, which is why a specification this app writes is a few
// tens of kilobytes rather than a megabyte of subset outlines, and why it
// opens the same in a reader that has never seen this app.
//
// The price of that is this module. A PDF places a string at a point; it does
// not centre one or range it right, so whoever writes the file has to know how
// wide the string will come out. `WIDTHS` is Adobe's own metric for each of
// those faces — the advance of every character of WinAnsi, in thousandths of
// the type size — and `textWidth` adds them up. The same numbers are what the
// preview on screen is laid out against, so the page in the modal and the page
// in the file are the same page: the browser draws it in Arial or Liberation
// Sans, both of which were cut to Helvetica's widths, and Times New Roman and
// Courier New likewise (see `CSS_FAMILY`).
//
// The encoding is WinAnsi (Windows-1252) for the same reason: it is what a
// base-14 font is addressed through. A project named in Latin script spells
// itself; anything else is folded down to what the encoding has — accents
// stripped, then a question mark — because a specification that silently drops
// the client's name is worse than one that visibly cannot spell it.

/** The faces the specification is set in — the base-14 names, under this
 *  app's own ids. Six of the twelve text fonts: the three families, roman
 *  and bold, plus the two italics a caption or a note is set in. */
export type PdfFont =
  | "helvetica"
  | "helveticaBold"
  | "helveticaOblique"
  | "times"
  | "timesBold"
  | "timesItalic"
  | "courier"
  | "courierBold";

export const PDF_FONTS: PdfFont[] = [
  "helvetica",
  "helveticaBold",
  "helveticaOblique",
  "times",
  "timesBold",
  "timesItalic",
  "courier",
  "courierBold",
];

/** The name the font is called by inside the file — a `BaseFont` every
 *  reader resolves without being handed any outlines. */
export const PDF_FONT_NAME: Record<PdfFont, string> = {
  helvetica: "Helvetica",
  helveticaBold: "Helvetica-Bold",
  helveticaOblique: "Helvetica-Oblique",
  times: "Times-Roman",
  timesBold: "Times-Bold",
  timesItalic: "Times-Italic",
  courier: "Courier",
  courierBold: "Courier-Bold",
};

/**
 * What the preview draws the same face with.
 *
 * Arial and Liberation Sans were both cut to Helvetica's widths, Times New
 * Roman and Liberation Serif to Times', Courier New to Courier's — so the
 * browser lays the line out at the same width this module measures it at, and
 * the page on screen is the page in the file. A system font, never a fetched
 * one: the rule against reaching over the network holds here as everywhere.
 */
export const CSS_FAMILY: Record<PdfFont, string> = {
  helvetica: "Helvetica, Arial, 'Liberation Sans', sans-serif",
  helveticaBold: "Helvetica, Arial, 'Liberation Sans', sans-serif",
  helveticaOblique: "Helvetica, Arial, 'Liberation Sans', sans-serif",
  times: "Times, 'Times New Roman', 'Liberation Serif', serif",
  timesBold: "Times, 'Times New Roman', 'Liberation Serif', serif",
  timesItalic: "Times, 'Times New Roman', 'Liberation Serif', serif",
  courier: "Courier, 'Courier New', 'Liberation Mono', monospace",
  courierBold: "Courier, 'Courier New', 'Liberation Mono', monospace",
};

/** The weight and slope the preview needs, since the CSS family above names
 *  a family rather than one cut of it. */
export const CSS_STYLE: Record<PdfFont, { weight: number; italic: boolean }> = {
  helvetica: { weight: 400, italic: false },
  helveticaBold: { weight: 700, italic: false },
  helveticaOblique: { weight: 400, italic: true },
  times: { weight: 400, italic: false },
  timesBold: { weight: 700, italic: false },
  timesItalic: { weight: 400, italic: true },
  courier: { weight: 400, italic: false },
  courierBold: { weight: 700, italic: false },
};

/** The advance of every WinAnsi character from 32 up, in thousandths of the
 *  type size — Adobe's published metrics for the base-14 faces. A zero is a
 *  code the encoding leaves unassigned. Courier is monospaced and needs no
 *  table of its own (see `charWidth`). */
const WIDTHS: Record<string, string> = {
  helvetica:
    "278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500",
  helveticaBold:
    "278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556",
  helveticaOblique:
    "278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500",
  times:
    "250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,0,500,0,333,500,444,1000,500,500,333,1000,556,333,889,0,611,0,0,333,333,444,444,350,500,1000,333,980,389,333,722,0,444,722,250,333,500,500,500,500,200,500,333,760,276,500,564,333,760,333,400,564,300,300,333,500,453,250,333,300,310,500,750,750,750,444,722,722,722,722,722,722,889,667,611,611,611,611,333,333,333,333,722,722,722,722,722,722,722,564,722,722,722,722,722,722,556,500,444,444,444,444,444,444,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,564,500,500,500,500,500,500,500,500",
  timesBold:
    "250,333,555,500,500,1000,833,278,333,333,500,570,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,930,722,667,722,722,667,611,778,778,389,500,778,667,944,722,778,611,778,722,556,667,722,722,1000,722,722,667,333,278,333,581,500,333,500,556,444,556,444,333,500,556,278,333,556,278,833,556,500,556,556,444,389,333,556,500,722,500,500,444,394,220,394,520,0,500,0,333,500,500,1000,500,500,333,1000,556,333,1000,0,667,0,0,333,333,500,500,350,500,1000,333,1000,389,333,722,0,444,722,250,333,500,500,500,500,220,500,333,747,300,500,570,333,747,333,400,570,300,300,333,556,540,250,333,300,330,500,750,750,750,500,722,722,722,722,722,722,1000,722,667,667,667,667,389,389,389,389,722,722,778,778,778,778,778,570,778,722,722,722,722,722,611,556,500,500,500,500,500,500,722,444,444,444,444,444,278,278,278,278,500,556,500,500,500,500,500,570,500,556,556,556,556,500,556,500",
  timesItalic:
    "250,333,420,500,500,833,778,214,333,333,500,675,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,675,675,675,500,920,611,611,667,722,611,611,722,722,333,444,667,556,833,667,722,611,722,611,500,556,722,611,833,611,556,556,389,278,389,422,500,333,500,500,444,500,444,278,500,500,278,278,444,278,722,500,500,500,500,389,389,278,500,444,667,444,444,389,400,275,400,541,0,500,0,333,500,556,889,500,500,333,1000,500,333,944,0,556,0,0,333,333,556,556,350,500,889,333,980,389,333,667,0,389,556,250,389,500,500,500,500,275,500,333,760,276,500,675,333,760,333,400,675,300,300,333,500,523,250,333,300,310,500,750,750,750,500,611,611,611,611,611,611,889,667,611,611,611,611,333,333,333,333,722,667,722,722,722,722,722,675,722,722,722,722,722,556,611,500,500,500,500,500,500,500,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,675,500,500,500,500,500,444,500,444",
};

/** The first code the table covers. */
const FIRST_CODE = 32;

/** Courier's one advance, which every character of it has. */
const COURIER_WIDTH = 600;

/** A width nothing else answers for: the space, so a character the table has
 *  no entry for still moves the pen. */
const FALLBACK_WIDTH = 278;

const parsed = new Map<string, number[]>();

function widthTable(font: PdfFont): number[] | null {
  const raw = WIDTHS[font];
  if (raw === undefined) return null;
  let table = parsed.get(font);
  if (!table) {
    table = raw.split(",").map(Number);
    parsed.set(font, table);
  }
  return table;
}

/** The advance of one WinAnsi code, in thousandths of the type size. */
export function charWidth(code: number, font: PdfFont): number {
  const table = widthTable(font);
  if (!table) return COURIER_WIDTH;
  return table[code - FIRST_CODE] || FALLBACK_WIDTH;
}

/** The twenty-seven characters Windows-1252 puts where the control codes
 *  would be, by their Unicode value — the curly quotes, the dashes, the
 *  bullet and the ellipsis a piece of prose is full of. Everything else in
 *  the encoding is its own Latin-1 code, so nothing else needs a table. */
const CP1252_SPECIALS: Record<number, number> = {
  0x20ac: 128,
  0x201a: 130,
  0x0192: 131,
  0x201e: 132,
  0x2026: 133,
  0x2020: 134,
  0x2021: 135,
  0x02c6: 136,
  0x2030: 137,
  0x0160: 138,
  0x2039: 139,
  0x0152: 140,
  0x017d: 142,
  0x2018: 145,
  0x2019: 146,
  0x201c: 147,
  0x201d: 148,
  0x2022: 149,
  0x2013: 150,
  0x2014: 151,
  0x02dc: 152,
  0x2122: 153,
  0x0161: 154,
  0x203a: 155,
  0x0153: 156,
  0x017e: 158,
  0x0178: 159,
};

/** The codes WinAnsi leaves empty. A font has no glyph there, so a reader
 *  is entitled to draw nothing at all. */
const UNASSIGNED = new Set([127, 129, 141, 143, 144, 157]);

/** Characters the app prints that WinAnsi has no code for, and the nearest
 *  thing it does have. The minus sign is the one that matters: `formatBalance`
 *  sets a shortfall with a true minus (U+2212), which no base-14 font
 *  carries, and an en dash is the figure dash of the three that is closest to
 *  it. */
const NEAREST: Record<string, string> = {
  "−": "–",
  " ": " ",
  " ": " ",
  " ": " ",
  "‑": "-",
};

/** What stands in for a character the encoding cannot spell at all. */
const UNKNOWN = "?";

/** One character as a WinAnsi code, or null when the encoding has none. */
function codeOf(ch: string): number | null {
  const point = ch.codePointAt(0);
  if (point === undefined) return null;
  const special = CP1252_SPECIALS[point];
  if (special !== undefined) return special;
  if (point < 32 || point > 255 || UNASSIGNED.has(point)) return null;
  return point;
}

/**
 * A string as the codes a base-14 font is addressed by.
 *
 * Three passes, each a narrower answer than the last: the character itself if
 * WinAnsi has it, the nearest one the app is known to print if not, and
 * failing both, the letter with its accents taken off — so a name in a script
 * the encoding cannot spell comes out as its skeleton rather than as a row of
 * question marks. Only what survives none of that becomes one.
 */
export function winAnsi(text: string): number[] {
  const out: number[] = [];
  for (const ch of text.normalize("NFC")) {
    const direct = codeOf(ch);
    if (direct !== null) {
      out.push(direct);
      continue;
    }
    const nearest = NEAREST[ch];
    const nearCode = nearest === undefined ? null : codeOf(nearest);
    if (nearCode !== null) {
      out.push(nearCode);
      continue;
    }
    // Strip the accents and try what is left, a letter at a time: "ł" has no
    // decomposition and stays unknown, but "ǎ" comes out as "a".
    const bare = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    for (const part of bare === ch ? UNKNOWN : bare) {
      out.push(codeOf(part) ?? codeOf(UNKNOWN)!);
    }
  }
  return out;
}

/** How wide a string is set, in points, at a size — what every centred
 *  heading and every right-ranged figure on the page is placed by. */
export function textWidth(text: string, font: PdfFont, size: number): number {
  let thousandths = 0;
  for (const code of winAnsi(text)) thousandths += charWidth(code, font);
  return (thousandths * size) / 1000;
}

/** The text, cut to fit a width with an ellipsis after it. A column is a
 *  column: a project named at length shortens rather than running into the
 *  figures beside it. */
export function truncate(
  text: string,
  font: PdfFont,
  size: number,
  maxWidth: number,
): string {
  if (textWidth(text, font, size) <= maxWidth) return text;
  const chars = [...text];
  let cut = chars.length;
  while (cut > 0) {
    cut -= 1;
    const candidate = `${chars.slice(0, cut).join("").trimEnd()}…`;
    if (textWidth(candidate, font, size) <= maxWidth) return candidate;
  }
  return "";
}

/** The words of `text` broken into lines no wider than `maxWidth`. A word
 *  too long for a line of its own is cut rather than allowed to overhang. */
export function wrap(
  text: string,
  font: PdfFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(candidate, font, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines.map((line) =>
    textWidth(line, font, size) > maxWidth
      ? truncate(line, font, size, maxWidth)
      : line,
  );
}
