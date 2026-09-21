// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { PAPER, type PdfDoc, type TextItem } from "../src/app/pdf/page.ts";
import { specification } from "../src/app/spec.ts";
import {
  layoutSpec,
  type SpecLabels,
  type SpecLayoutInput,
  type SpecNames,
} from "../src/app/specLayout.ts";
import { SPEC_PRESET, SPEC_PRESETS } from "../src/app/specStyle.ts";
import { dayKey, type AppData } from "../src/app/types.ts";
import { day, h, project } from "./fixtures/helpers.ts";

// The layout: pages of type and rules. What these pin is the part a reader
// would notice — that every block that was asked for is on the page, that
// nothing runs off the bottom of one, and that the free edition's notice is
// on every page of a document that carries one.

const acme = project();

function data(days: number): AppData {
  const doc: AppData = { version: 2, projects: { acme }, days: {} };
  for (let i = 0; i < days; i++) {
    const date = `2026-03-${String(2 + i).padStart(2, "0")}`;
    const d = day(date, {
      sessions: [{ id: `s${i}`, start: h(8), end: h(16, 30) }],
      breaks: [{ id: `b${i}`, typeId: "lunch", start: h(12), end: h(12, 30) }],
      activities: [
        { id: `a${i}`, categoryId: "code", start: h(8), end: h(12) },
      ],
    });
    doc.days[dayKey("acme", date)] = d;
  }
  return doc;
}

const labels: SpecLabels = Object.fromEntries(
  (
    [
      "title",
      "project",
      "period",
      "issued",
      "preparedBy",
      "client",
      "reference",
      "summary",
      "hours",
      "days",
      "target",
      "balance",
      "categories",
      "breaks",
      "daily",
      "date",
      "start",
      "end",
      "breakColumn",
      "decimal",
      "share",
      "kind",
      "total",
      "running",
      "signature",
      "signedDate",
      "rounding",
      "roundedNote",
      "generated",
      "noticeTitle",
      "noticeBody",
    ] as const
  ).map((key) => [key, key]),
) as SpecLabels;

const names: SpecNames = {
  day: (date) => date,
  category: (id) => id ?? "uncategorised",
  breakType: (id) => id,
  page: (page, pages) => `${page}/${pages}`,
};

function input(patch: Partial<SpecLayoutInput> = {}): SpecLayoutInput {
  const days = patch.spec ? 0 : 20;
  return {
    spec: specification(
      data(days),
      acme,
      "2026-03-02",
      "2026-03-27",
      "2026-04-30",
      0,
    ),
    style: SPEC_PRESET.studio,
    labels,
    names,
    fields: {
      period: "March 2026",
      issued: "1 Apr 2026",
      preparedBy: "",
      client: "",
      reference: "",
      note: "",
    },
    notice: false,
    createdAt: "2026-04-01T09:00:00.000Z",
    ...patch,
  };
}

const texts = (doc: PdfDoc): string[] =>
  doc.pages.flatMap((page) =>
    page.items
      .filter((i): i is TextItem => i.kind === "text")
      .map((i) => i.text),
  );

const pageTexts = (doc: PdfDoc, index: number): string[] =>
  doc.pages[index]!.items.filter((i): i is TextItem => i.kind === "text").map(
    (i) => i.text,
  );

describe("the laid-out specification", () => {
  it("is the paper the style asked for", () => {
    const a4 = layoutSpec(input());
    expect(a4.width).toBeCloseTo(PAPER.a4.width, 2);
    const letter = layoutSpec(
      input({ style: { ...SPEC_PRESET.studio, paper: "letter" } }),
    );
    expect(letter.width).toBe(PAPER.letter.width);
  });

  it("names the document in the file's properties", () => {
    const doc = layoutSpec(
      input({
        fields: {
          period: "March 2026",
          issued: "1 Apr 2026",
          preparedBy: "Alex",
          client: "",
          reference: "",
          note: "",
        },
      }),
    );
    expect(doc.meta.title).toContain("Acme");
    expect(doc.meta.title).toContain("March 2026");
    expect(doc.meta.author).toBe("Alex");
    expect(doc.meta.createdAt).toBe("2026-04-01T09:00:00.000Z");
  });

  it("keeps everything inside the page", () => {
    for (const id of SPEC_PRESETS) {
      const doc = layoutSpec(input({ style: SPEC_PRESET[id], notice: true }));
      for (const page of doc.pages) {
        for (const item of page.items) {
          const bottom =
            item.kind === "rect"
              ? item.y + item.height
              : item.kind === "line"
                ? Math.max(item.y1, item.y2)
                : item.y;
          expect(bottom).toBeLessThanOrEqual(doc.height + 0.5);
          expect(bottom).toBeGreaterThanOrEqual(-0.5);
        }
      }
    }
  });

  it("prints a line of details only when it was filled in", () => {
    expect(texts(layoutSpec(input()))).not.toContain("client");
    const filled = layoutSpec(
      input({
        fields: {
          period: "March 2026",
          issued: "1 Apr 2026",
          preparedBy: "Alex",
          client: "Nordvik",
          reference: "PO-1",
          note: "",
        },
      }),
    );
    expect(texts(filled)).toContain("Nordvik");
    expect(texts(filled)).toContain("PO-1");
  });

  it("carries the blocks the style asked for and no others", () => {
    const bare = layoutSpec(
      input({
        style: {
          ...SPEC_PRESET.studio,
          sections: {
            summary: false,
            categories: false,
            breaks: false,
            balance: false,
            signature: false,
          },
        },
      }),
    );
    const words = texts(bare);
    expect(words).not.toContain("CATEGORIES");
    expect(words).toContain("daily");
    expect(words).not.toContain("signature");

    const full = layoutSpec(
      input({
        style: {
          ...SPEC_PRESET.studio,
          sections: {
            summary: true,
            categories: true,
            breaks: true,
            balance: true,
            signature: true,
          },
        },
      }),
    );
    expect(texts(full)).toContain("categories");
    expect(texts(full)).toContain("signature");
    expect(texts(full)).toContain("BALANCE");
  });

  it("tells the hours at the grain the style asked for", () => {
    const period = layoutSpec(
      input({ style: { ...SPEC_PRESET.studio, detail: "period" } }),
    );
    expect(texts(period)).not.toContain("daily");

    const daily = layoutSpec(
      input({ style: { ...SPEC_PRESET.studio, detail: "day" } }),
    );
    expect(texts(daily)).toContain("daily");
    expect(texts(daily)).toContain("2026-03-02");
    // A row a day and no stretches under it: nothing on the page is a break's
    // length in brackets.
    expect(texts(daily).some((t) => /^\(\d+m\)$/.test(t))).toBe(false);

    const entries = layoutSpec(
      input({ style: { ...SPEC_PRESET.studio, detail: "entries" } }),
    );
    expect(texts(entries)).toContain("code");
    expect(texts(entries)).toContain("lunch");
    // A break's length is in brackets, because it is not billed time.
    expect(texts(entries).some((t) => /^\(\d+m\)$/.test(t))).toBe(true);
    expect(entries.pages.length).toBeGreaterThan(daily.pages.length);
  });

  it("repeats the table's head on every page it runs onto", () => {
    const doc = layoutSpec(
      input({ style: { ...SPEC_PRESET.studio, detail: "entries" } }),
    );
    expect(doc.pages.length).toBeGreaterThan(1);
    for (let i = 1; i < doc.pages.length; i++) {
      expect(pageTexts(doc, i)).toContain("DATE");
    }
  });

  it("puts the notice on every page, or on none", () => {
    const withNotice = layoutSpec(input({ notice: true }));
    for (let i = 0; i < withNotice.pages.length; i++) {
      expect(pageTexts(withNotice, i)).toContain("noticeTitle");
    }
    const without = layoutSpec(input({ notice: false }));
    expect(texts(without)).not.toContain("noticeTitle");
  });

  it("numbers the pages, and stops when the footer is turned off", () => {
    const doc = layoutSpec(input());
    expect(pageTexts(doc, 0)).toContain(`1/${doc.pages.length}`);
    const quiet = layoutSpec(
      input({ style: { ...SPEC_PRESET.studio, footer: false } }),
    );
    expect(texts(quiet).some((t) => t.includes("/"))).toBe(false);
  });

  it("sets the document in the faces its typeface names", () => {
    const doc = layoutSpec(
      input({ style: { ...SPEC_PRESET.studio, typeface: "typewriter" } }),
    );
    const fonts = new Set(
      doc.pages.flatMap((page) =>
        page.items
          .filter((i): i is TextItem => i.kind === "text")
          .map((i) => i.font),
      ),
    );
    expect([...fonts].sort()).toEqual(["courier", "courierBold"]);
  });

  it("says nothing at all about a range with nothing in it", () => {
    const empty = specification(
      { version: 2, projects: { acme }, days: {} },
      acme,
      "2026-03-02",
      "2026-03-06",
      "2026-04-30",
      0,
    );
    const doc = layoutSpec(input({ spec: empty }));
    expect(doc.pages).toHaveLength(1);
    expect(texts(doc)).toContain("title");
  });

  it("says on the document what it rounded to", () => {
    // A day that does not land on a quarter of an hour, so the rounding has
    // something to add.
    const odd: AppData = { version: 2, projects: { acme }, days: {} };
    odd.days[dayKey("acme", "2026-03-02")] = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(13, 17) }],
    });
    const rounded = specification(
      odd,
      acme,
      "2026-03-02",
      "2026-03-04",
      "2026-04-30",
      0,
      { rounding: 15 },
    );
    const doc = layoutSpec(input({ spec: rounded }));
    expect(texts(doc)).toContain("roundedNote");
    // And the line the rounding added is named in the breakdown.
    expect(texts(doc)).toContain("rounding");
    // A specification that rounds nothing says nothing about rounding.
    expect(texts(layoutSpec(input()))).not.toContain("roundedNote");
  });
});
