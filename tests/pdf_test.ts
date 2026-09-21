// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  CSS_FAMILY,
  CSS_STYLE,
  PDF_FONTS,
  PDF_FONT_NAME,
  charWidth,
  textWidth,
  truncate,
  winAnsi,
  wrap,
} from "../src/app/pdf/metrics.ts";
import {
  PAPER,
  PAPERS,
  PageBuilder,
  alignOffset,
  itemWidth,
  type PdfDoc,
} from "../src/app/pdf/page.ts";
import {
  fontsUsed,
  literal,
  pageContent,
  pdfDate,
  rgb,
  writePdf,
} from "../src/app/pdf/write.ts";

// The two halves of writing a PDF without embedding a font: knowing how wide
// a string comes out, and spelling it in the encoding a base-14 font is
// addressed through.

describe("the base-14 metrics", () => {
  it("has a name, a family and a cut for every face", () => {
    expect(PDF_FONTS).toHaveLength(8);
    for (const font of PDF_FONTS) {
      expect(PDF_FONT_NAME[font]).toBeTruthy();
      expect(CSS_FAMILY[font]).toBeTruthy();
      expect(CSS_STYLE[font]).toBeTruthy();
    }
  });

  it("knows Adobe's own widths", () => {
    // Helvetica's space is 278/1000 and its capital M 833; Times' space is
    // 250. These are the published numbers, and a change to them is a change
    // to where every right-ranged figure in a specification lands.
    expect(charWidth(32, "helvetica")).toBe(278);
    expect(charWidth("M".charCodeAt(0), "helvetica")).toBe(833);
    expect(charWidth(32, "times")).toBe(250);
    expect(charWidth("M".charCodeAt(0), "timesBold")).toBe(944);
  });

  it("makes Courier one width, whatever the character", () => {
    for (const code of [32, 65, 105, 87, 229]) {
      expect(charWidth(code, "courier")).toBe(600);
      expect(charWidth(code, "courierBold")).toBe(600);
    }
  });

  it("measures a string in points at its size", () => {
    // Ten monospaced characters at 10pt is six points each.
    expect(textWidth("0123456789", "courier", 10)).toBeCloseTo(60, 6);
    expect(textWidth("", "helvetica", 10)).toBe(0);
    expect(textWidth("iii", "helvetica", 10)).toBeLessThan(
      textWidth("MMM", "helvetica", 10),
    );
  });
});

describe("WinAnsi", () => {
  it("spells plain Latin as itself", () => {
    expect(winAnsi("Hi!")).toEqual([72, 105, 33]);
    expect(winAnsi("Malmö")).toEqual([77, 97, 108, 109, 246]);
  });

  it("finds the codes Windows-1252 puts where the controls would be", () => {
    expect(winAnsi("–")).toEqual([150]);
    expect(winAnsi("’")).toEqual([146]);
    expect(winAnsi("€")).toEqual([128]);
  });

  it("gives the minus sign the nearest dash there is", () => {
    // `formatBalance` sets a shortfall with a true minus, which no base-14
    // font carries.
    expect(winAnsi("−1h")).toEqual([150, 49, 104]);
  });

  it("strips the accents off a letter it cannot spell before giving up", () => {
    expect(winAnsi("ǎ")).toEqual(["a".charCodeAt(0)]);
    expect(winAnsi("中")).toEqual(["?".charCodeAt(0)]);
  });
});

describe("fitting text to a column", () => {
  it("cuts with an ellipsis and never overruns", () => {
    const cut = truncate("A rather long project name", "helvetica", 10, 50);
    expect(cut.endsWith("…")).toBe(true);
    expect(textWidth(cut, "helvetica", 10)).toBeLessThanOrEqual(50);
  });

  it("leaves what already fits alone", () => {
    expect(truncate("Acme", "helvetica", 10, 200)).toBe("Acme");
  });

  it("wraps on words and keeps every line inside the width", () => {
    const lines = wrap(
      "Hours delivered under the framework agreement of 3 March.",
      "helvetica",
      9,
      120,
    );
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(textWidth(line, "helvetica", 9)).toBeLessThanOrEqual(120);
    }
    expect(lines.join(" ")).toContain("framework");
  });
});

describe("placing a line of type", () => {
  const item = {
    kind: "text" as const,
    x: 100,
    y: 50,
    text: "Total",
    font: "helvetica" as const,
    size: 10,
    color: "#000000",
  };

  it("ranges left, right and centre off the same measurement", () => {
    const width = itemWidth(item);
    expect(alignOffset(item)).toBe(0);
    expect(alignOffset({ ...item, align: "right" })).toBe(-width);
    expect(alignOffset({ ...item, align: "center" })).toBe(-width / 2);
  });

  it("counts tracking between the characters and not after the last", () => {
    expect(itemWidth({ ...item, tracking: 1 })).toBeCloseTo(
      itemWidth(item) + 4,
      6,
    );
  });
});

describe("the page", () => {
  it("has the two paper sizes in points", () => {
    expect(PAPERS).toEqual(["a4", "letter"]);
    expect(PAPER.a4.height).toBeGreaterThan(PAPER.a4.width);
    expect(PAPER.letter.width).toBe(612);
  });

  it("drops what would draw nothing", () => {
    const page = new PageBuilder();
    page.text({
      x: 0,
      y: 0,
      text: "",
      font: "helvetica",
      size: 9,
      color: "#000",
    });
    page.rect({ x: 0, y: 0, width: 0, height: 10, color: "#000" });
    expect(page.page().items).toHaveLength(0);
  });
});

describe("writing the file", () => {
  const doc: PdfDoc = {
    width: 200,
    height: 100,
    pages: [
      {
        items: [
          {
            kind: "rect",
            x: 0,
            y: 0,
            width: 200,
            height: 10,
            color: "#ff0000",
          },
          {
            kind: "text",
            x: 10,
            y: 50,
            text: "Total (net)",
            font: "helveticaBold",
            size: 9,
            color: "#000000",
          },
          {
            kind: "line",
            x1: 0,
            y1: 60,
            x2: 200,
            y2: 60,
            width: 0.5,
            color: "#cccccc",
          },
        ],
      },
    ],
    meta: {
      title: "Time specification",
      author: "Alex",
      subject: "Time specification",
      createdAt: "2026-09-21T13:04:05.000Z",
    },
  };

  it("reads a colour as the three components an operator takes", () => {
    expect(rgb("#ffffff")).toEqual([1, 1, 1]);
    expect(rgb("#000")).toEqual([0, 0, 0]);
    expect(rgb("#ff0000")).toEqual([1, 0, 0]);
  });

  it("escapes what would otherwise end a string", () => {
    expect(literal("a (b) \\ c")).toBe("(a \\(b\\) \\\\ c)");
    // Anything above the printable range goes out as octal.
    expect(literal("å")).toBe("(\\345)");
  });

  it("dates the file in UTC", () => {
    expect(pdfDate("2026-09-21T13:04:05.000Z")).toBe("D:20260921130405Z");
    expect(pdfDate("not a date")).toBe("D:19700101000000Z");
  });

  it("carries only the faces the pages actually use", () => {
    expect(fontsUsed(doc.pages)).toEqual(["helveticaBold"]);
  });

  it("flips the page over once, at the bottom", () => {
    // The layout's origin is the top left; a PDF's is the bottom left, so a
    // baseline 50 down a 100pt page is drawn at 50 up.
    const content = pageContent(
      doc.pages[0]!,
      doc.height,
      new Map([["helveticaBold", "F1"]]),
    );
    expect(content).toContain("10 50 Td");
    // The band along the top of the page is drawn from 90 up.
    expect(content).toContain("0 90 200 10 re");
  });

  it("writes a file whose xref points at its objects", () => {
    const bytes = writePdf(doc);
    const file = new TextDecoder("latin1").decode(bytes);
    expect(file.startsWith("%PDF-1.4\n")).toBe(true);
    expect(file.endsWith("%%EOF\n")).toBe(true);

    const start = Number(/startxref\s+(\d+)/.exec(file)![1]);
    const lines = file.slice(start).split("\n");
    expect(lines[0]).toBe("xref");
    const count = Number(lines[1]!.split(" ")[1]);
    for (let i = 1; i < count; i++) {
      const offset = Number(lines[2 + i]!.slice(0, 10));
      expect(file.slice(offset, offset + 10)).toContain(`${i} 0 obj`);
    }
  });

  it("declares each stream's length in bytes", () => {
    const file = new TextDecoder("latin1").decode(writePdf(doc));
    const match = /<<\/Length (\d+)>>\nstream\n/.exec(file)!;
    const from = match.index + match[0].length;
    expect(
      file.slice(from + Number(match[1]), from + Number(match[1]) + 10),
    ).toBe("\nendstream");
  });

  it("is one byte a character, so the offsets can be counted in characters", () => {
    const bytes = writePdf(doc);
    const file = new TextDecoder("latin1").decode(bytes);
    expect(file.length).toBe(bytes.length);
  });
});
