// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The pages, as the bytes of a PDF.
//
// A PDF is a plain-text object graph with a table of byte offsets at the end,
// and that is all this writes: a catalog, a page tree, one uncompressed
// content stream per page, a font dictionary per face the pages actually use,
// and an xref. No compression, because a specification is a few hundred lines
// of vector drawing and a deflate stream would trade a readable file for a
// kilobyte; no embedded fonts, because the faces are the base-14 ones every
// reader already has (see `metrics.ts`).
//
// Everything is ASCII by construction — a WinAnsi code above 126 is written
// as an octal escape — so a character of the file is a byte of it, which is
// what lets the xref offsets be string indices.
//
// Pure: it takes a document and returns bytes. The stamp in `CreationDate`
// comes in with the document, so nothing here reads a clock.

import {
  alignOffset,
  type PdfDoc,
  type PdfPage,
  type TextItem,
} from "./page.ts";
import { PDF_FONT_NAME, winAnsi, type PdfFont } from "./metrics.ts";

/** A number as a PDF writes one: no exponent, no trailing zeros, and three
 *  decimals, which at 72 points to the inch is a thousandth of a millimetre
 *  and a good deal finer than any printer. */
function num(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const fixed = value.toFixed(3);
  return fixed.replace(/\.?0+$/, "") || "0";
}

/** "#1a2b3c" as the three components a PDF colour operator takes. */
export function rgb(color: string): [number, number, number] {
  const hex = color.trim().replace(/^#/, "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const value = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(value)) return [0, 0, 0];
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function fill(color: string): string {
  const [r, g, b] = rgb(color);
  return `${num(r)} ${num(g)} ${num(b)} rg`;
}

function stroke(color: string): string {
  const [r, g, b] = rgb(color);
  return `${num(r)} ${num(g)} ${num(b)} RG`;
}

/** A string as a PDF literal: the three characters that would end it are
 *  escaped, and everything above the printable ASCII range goes out as the
 *  octal of its WinAnsi code. */
export function literal(text: string): string {
  let out = "(";
  for (const code of winAnsi(text)) {
    if (code === 0x28 || code === 0x29 || code === 0x5c) {
      out += `\\${String.fromCharCode(code)}`;
    } else if (code < 32 || code > 126) {
      out += `\\${code.toString(8).padStart(3, "0")}`;
    } else {
      out += String.fromCharCode(code);
    }
  }
  return `${out})`;
}

/** An ISO stamp as a PDF date: `D:YYYYMMDDHHmmSSZ`. The document carries a
 *  UTC stamp, so the file does too — a local offset would say which timezone
 *  the specification was written in, which is nobody's business but the
 *  writer's. */
export function pdfDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "D:19700101000000Z";
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `D:${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}` +
    `${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`
  );
}

/** The faces a set of pages actually uses, in a stable order — so a document
 *  set in one family carries one font dictionary rather than eight. */
export function fontsUsed(pages: readonly PdfPage[]): PdfFont[] {
  const seen = new Set<PdfFont>();
  for (const page of pages) {
    for (const item of page.items) {
      if (item.kind === "text") seen.add(item.font);
    }
  }
  return [...seen].sort();
}

function textOps(item: TextItem, height: number, names: Map<PdfFont, string>) {
  const x = item.x + alignOffset(item);
  const y = height - item.y;
  const tracking = item.tracking ?? 0;
  const ops = [
    "BT",
    `/${names.get(item.font)} ${num(item.size)} Tf`,
    fill(item.color),
  ];
  if (tracking !== 0) ops.push(`${num(tracking)} Tc`);
  ops.push(`${num(x)} ${num(y)} Td`, `${literal(item.text)} Tj`, "ET");
  return ops;
}

/** One page's content stream. */
export function pageContent(
  page: PdfPage,
  height: number,
  names: Map<PdfFont, string>,
): string {
  const ops: string[] = [];
  for (const item of page.items) {
    if (item.kind === "rect") {
      ops.push(
        fill(item.color),
        `${num(item.x)} ${num(height - item.y - item.height)} ${num(item.width)} ${num(item.height)} re`,
        "f",
      );
    } else if (item.kind === "line") {
      ops.push(
        stroke(item.color),
        `${num(item.width)} w`,
        `${num(item.x1)} ${num(height - item.y1)} m`,
        `${num(item.x2)} ${num(height - item.y2)} l`,
        "S",
      );
    } else {
      ops.push(...textOps(item, height, names));
    }
  }
  return ops.join("\n");
}

/** The document, as the bytes of a PDF file. */
export function writePdf(doc: PdfDoc): Uint8Array {
  const fonts = fontsUsed(doc.pages);
  const names = new Map<PdfFont, string>(
    fonts.map((font, i) => [font, `F${i + 1}`]),
  );

  // Object 1 is the catalog and 2 the page tree; the fonts come next, so the
  // page objects can name them, and each page is followed by its stream.
  const fontFirst = 3;
  const pageFirst = fontFirst + fonts.length;
  const objects: string[] = [];
  const kids = doc.pages.map((_, i) => `${pageFirst + i * 2} 0 R`).join(" ");
  const resources = fonts.length
    ? `/Resources <</Font <<${fonts
        .map((font, i) => `/${names.get(font)} ${fontFirst + i} 0 R`)
        .join(" ")}>>>>`
    : "/Resources <<>>";

  objects.push(`<</Type /Catalog /Pages 2 0 R>>`);
  objects.push(`<</Type /Pages /Kids [${kids}] /Count ${doc.pages.length}>>`);
  for (const font of fonts) {
    objects.push(
      `<</Type /Font /Subtype /Type1 /BaseFont /${PDF_FONT_NAME[font]} /Encoding /WinAnsiEncoding>>`,
    );
  }
  doc.pages.forEach((page, i) => {
    const contentId = pageFirst + i * 2 + 1;
    objects.push(
      `<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(doc.width)} ${num(doc.height)}] ${resources} /Contents ${contentId} 0 R>>`,
    );
    const content = pageContent(page, doc.height, names);
    objects.push(
      `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
    );
  });
  const infoId = objects.length + 1;
  objects.push(
    `<</Title ${literal(doc.meta.title)} /Author ${literal(doc.meta.author)} ` +
      `/Subject ${literal(doc.meta.subject)} /Producer ${literal(doc.meta.creator ?? "Time")} ` +
      `/Creator ${literal(doc.meta.creator ?? "Time")} /CreationDate ${literal(pdfDate(doc.meta.createdAt))} ` +
      `/ModDate ${literal(pdfDate(doc.meta.createdAt))}>>`,
  );

  let file = "%PDF-1.4\n";
  // A comment of high bytes right after the header: the convention that tells
  // anything reading the file to treat it as binary rather than as text.
  file += "%âãÏÓ\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(file.length);
    file += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xref = file.length;
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    file += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  file +=
    `trailer\n<</Size ${objects.length + 1} /Root 1 0 R /Info ${infoId} 0 R>>\n` +
    `startxref\n${xref}\n%%EOF\n`;

  const bytes = new Uint8Array(file.length);
  for (let i = 0; i < file.length; i++) bytes[i] = file.charCodeAt(i) & 0xff;
  return bytes;
}
