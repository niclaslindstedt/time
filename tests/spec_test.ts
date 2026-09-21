// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DEFAULT_ROUNDING,
  SPEC_ROUNDINGS,
  clampRounding,
  decimalHours,
  roundUpTo,
  specification,
  sumHours,
} from "../src/app/spec.ts";
import { specFilename, slug } from "../src/app/specExport.ts";
import { dayKey, type AppData } from "../src/app/types.ts";
import { day, h, project } from "./fixtures/helpers.ts";

// The specification is a reading of the report, so what these pin is the part
// it adds: decimal hours that add up, a row per day that happened, and the
// day's stretches for the itemised version.

const acme = project();

function docWith(...days: ReturnType<typeof day>[]): AppData {
  const data: AppData = { version: 2, projects: { acme }, days: {} };
  for (const d of days) data.days[dayKey("acme", d.date)] = d;
  return data;
}

/** A plain day at work, 08:00 to 16:30 with half an hour of lunch. */
function worked(date: string) {
  return day(date, {
    sessions: [{ id: `s-${date}`, start: h(8), end: h(16, 30) }],
    breaks: [
      { id: `b-${date}`, typeId: "lunch", start: h(12), end: h(12, 30) },
    ],
  });
}

describe("decimal hours", () => {
  it("is hours to the hundredth", () => {
    expect(decimalHours(h(7, 32))).toBe(7.53);
    expect(decimalHours(h(8))).toBe(8);
    expect(decimalHours(0)).toBe(0);
    expect(decimalHours(-60)).toBe(0);
  });

  it("adds a column without drifting into binary floating point", () => {
    expect(sumHours([0.1, 0.2])).toBe(0.3);
    expect(sumHours([7.53, 7.53, 7.53])).toBe(22.59);
    expect(sumHours([])).toBe(0);
  });
});

describe("a specification", () => {
  it("lists a row per day that happened and totals what the column adds to", () => {
    const data = docWith(
      worked("2026-03-02"),
      worked("2026-03-03"),
      worked("2026-03-04"),
    );
    const spec = specification(
      data,
      acme,
      "2026-03-02",
      "2026-03-08",
      "2026-03-31",
      0,
    );

    expect(spec.days.map((d) => d.date)).toEqual([
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
    ]);
    // Eight hours at work: 08:00–16:30 less half an hour of lunch, which this
    // project counts for nothing.
    expect(spec.days[0]!.worked).toBe(h(8));
    expect(spec.days[0]!.firstIn).toBe(h(8));
    expect(spec.days[0]!.lastOut).toBe(h(16, 30));
    expect(spec.days[0]!.breakTotal).toBe(h(0, 30));
    expect(spec.days[0]!.hours).toBe(8);
    expect(spec.totals.hours).toBe(24);
    expect(spec.totals.hours).toBe(sumHours(spec.days.map((d) => d.hours)));
    expect(spec.totals.workedDays).toBe(3);
  });

  it("leaves out a day nobody worked, and puts it back when asked", () => {
    const data = docWith(worked("2026-03-02"));
    const from = "2026-03-02";
    const to = "2026-03-06";
    const today = "2026-03-31";

    expect(
      specification(data, acme, from, to, today, 0).days.map((d) => d.date),
    ).toEqual(["2026-03-02"]);

    const every = specification(data, acme, from, to, today, 0, {
      blanks: true,
    });
    expect(every.days).toHaveLength(5);
    expect(every.days[1]!.worked).toBe(0);
    expect(every.days[1]!.logged).toBe(false);
    expect(every.days[1]!.expected).toBe(true);
    // A day nobody worked adds nothing to the column.
    expect(every.totals.hours).toBe(8);
  });

  it("does not list a weekend the project does not expect", () => {
    const data = docWith(worked("2026-03-02"));
    const spec = specification(
      data,
      acme,
      "2026-03-02",
      "2026-03-08",
      "2026-03-31",
      0,
      { blanks: true },
    );
    // Monday to Friday; the Saturday and the Sunday are neither expected nor
    // worked, so neither is listed.
    expect(spec.days).toHaveLength(5);
  });

  it("breaks a day into the stretches it was made of", () => {
    const data = docWith(
      day("2026-03-02", {
        sessions: [{ id: "s1", start: h(9), end: h(17) }],
        breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: h(12, 30) }],
        activities: [{ id: "a1", categoryId: "code", start: h(9), end: h(12) }],
      }),
    );
    const spec = specification(
      data,
      acme,
      "2026-03-02",
      "2026-03-02",
      "2026-03-31",
      0,
    );
    expect(
      spec.days[0]!.segments.map((s) => [s.kind, s.typeId, s.start, s.end]),
    ).toEqual([
      ["work", "code", h(9), h(12)],
      ["break", "lunch", h(12), h(12, 30)],
      ["work", null, h(12, 30), h(17)],
    ]);
  });

  it("says nothing about a clock-out that has not happened", () => {
    const data = docWith(
      day("2026-03-02", { sessions: [{ id: "s1", start: h(9), end: null }] }),
    );
    const spec = specification(
      data,
      acme,
      "2026-03-02",
      "2026-03-02",
      "2026-03-02",
      h(11),
    );
    expect(spec.days[0]!.firstIn).toBe(h(9));
    expect(spec.days[0]!.lastOut).toBeNull();
    expect(spec.days[0]!.worked).toBe(h(2));
  });

  it("names every kind the range holds, the project's order first", () => {
    const data = docWith(
      day("2026-03-02", {
        sessions: [{ id: "s1", start: h(9), end: h(17) }],
        activities: [
          { id: "a1", categoryId: "code", start: h(9), end: h(11) },
          { id: "a2", categoryId: "meet", start: h(11), end: h(12) },
          // A kind the project has since deleted still holds time.
          { id: "a3", categoryId: "gone", start: h(12), end: h(13) },
        ],
      }),
    );
    const spec = specification(
      data,
      acme,
      "2026-03-02",
      "2026-03-02",
      "2026-03-31",
      0,
    );
    expect(spec.categories.map((c) => c.id)).toEqual([
      "meet",
      "code",
      "gone",
      null,
    ]);
    // The shares are of the worked total and add up to it.
    expect(sumHours(spec.categories.map((c) => c.hours))).toBe(8);
    expect(
      Math.round(spec.categories.reduce((a, c) => a + c.share, 0) * 1000),
    ).toBe(1000);
  });

  it("counts a break the project pays for in the hours and still reports the break", () => {
    const paid = project({
      breakTypes: [
        {
          id: "lunch",
          name: "Lunch",
          defaultMinutes: 30,
          credit: { mode: "all" },
        },
      ],
    });
    const data: AppData = { version: 2, projects: { acme: paid }, days: {} };
    const d = worked("2026-03-02");
    data.days[dayKey("acme", d.date)] = d;
    const spec = specification(
      data,
      paid,
      "2026-03-02",
      "2026-03-02",
      "2026-03-31",
      0,
    );
    expect(spec.days[0]!.worked).toBe(h(8, 30));
    expect(spec.days[0]!.breakTotal).toBe(h(0, 30));
    expect(spec.totals.hours).toBe(8.5);
  });
});

describe("the file's name", () => {
  it("is the project, the range and what it is, lowercase and without a space", () => {
    expect(specFilename("Demo AB", "September 2026")).toBe(
      "demo_ab_september_2026_specification.pdf",
    );
    expect(specFilename("Acme", "2026-03-02_2026-03-08")).toBe(
      "acme_2026-03-02_2026-03-08_specification.pdf",
    );
  });

  it("folds a name down to something a file system will take", () => {
    expect(slug("Malmö Stad")).toBe("malmo_stad");
    expect(slug("A/B — C")).toBe("a_b_c");
    expect(slug("  ")).toBe("");
    expect(specFilename("", "")).toBe("specification.pdf");
  });
});

describe("rounding a day up", () => {
  it("goes up to the next whole step and never down", () => {
    // Five hours and seventeen minutes at a quarter of an hour is five and a
    // half: a quarter begun is a quarter billed.
    expect(roundUpTo(h(5, 17), 15)).toBe(h(5, 30));
    expect(roundUpTo(h(5, 17), 30)).toBe(h(5, 30));
    expect(roundUpTo(h(5, 17), 60)).toBe(h(6));
    expect(roundUpTo(h(5, 17), 10)).toBe(h(5, 20));
    expect(roundUpTo(h(5, 17), 6)).toBe(h(5, 18));
  });

  it("leaves an exact multiple, and nothing, where they are", () => {
    expect(roundUpTo(h(8), 15)).toBe(h(8));
    expect(roundUpTo(0, 15)).toBe(0);
    expect(roundUpTo(h(7, 32), 0)).toBe(h(7, 32));
  });

  it("clamps a stored step to one the app offers", () => {
    expect(SPEC_ROUNDINGS).toEqual([0, 5, 6, 10, 15, 30, 60]);
    expect(clampRounding(15)).toBe(15);
    expect(clampRounding("30")).toBe(30);
    expect(clampRounding(7)).toBe(DEFAULT_ROUNDING);
    expect(clampRounding(null)).toBe(DEFAULT_ROUNDING);
  });
});

describe("a specification that rounds", () => {
  const data = docWith(
    day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(13, 17) }],
      activities: [
        { id: "a1", categoryId: "code", start: h(8), end: h(13, 17) },
      ],
    }),
    day("2026-03-03", {
      sessions: [{ id: "s2", start: h(8), end: h(16) }],
    }),
  );

  it("bills each day up, and the range as the sum of them", () => {
    const spec = specification(
      data,
      acme,
      "2026-03-02",
      "2026-03-06",
      "2026-03-31",
      0,
      { rounding: 15 },
    );
    expect(spec.rounding).toBe(15);
    expect(spec.days[0]!.worked).toBe(h(5, 17));
    expect(spec.days[0]!.billed).toBe(h(5, 30));
    expect(spec.days[1]!.billed).toBe(h(8));
    expect(spec.totals.worked).toBe(h(13, 17));
    expect(spec.totals.billed).toBe(h(13, 30));
    expect(spec.totals.hours).toBe(13.5);
    // The column still adds up to the total under it.
    expect(sumHours(spec.days.map((d) => d.hours))).toBe(spec.totals.hours);
  });

  it("rounds nothing by default", () => {
    const spec = specification(
      data,
      acme,
      "2026-03-02",
      "2026-03-06",
      "2026-03-31",
      0,
    );
    expect(spec.rounding).toBe(0);
    expect(spec.totals.billed).toBe(spec.totals.worked);
    expect(spec.categories.every((c) => c.kind !== "rounding")).toBe(true);
  });

  it("puts what the rounding added in the breakdown, so it adds up", () => {
    const spec = specification(
      data,
      acme,
      "2026-03-02",
      "2026-03-06",
      "2026-03-31",
      0,
      { rounding: 15 },
    );
    const rounding = spec.categories.find((c) => c.kind === "rounding");
    expect(rounding?.seconds).toBe(h(0, 13));
    expect(spec.categories.reduce((a, c) => a + c.seconds, 0)).toBe(
      spec.totals.billed,
    );
    expect(
      Math.round(spec.categories.reduce((a, c) => a + c.share, 0) * 1000),
    ).toBe(1000);
  });
});
