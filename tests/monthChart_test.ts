// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  OVER_RATIO,
  boxColor,
  boxPath,
  monthChart,
} from "../src/app/monthChart.ts";
import { monthOf, summarizeRange } from "../src/app/report.ts";
import { dayKey, emptyDoc, type WorkDay } from "../src/app/types.ts";
import { day, employer, h } from "./fixtures/helpers.ts";

function docOf(...days: WorkDay[]) {
  const doc = emptyDoc();
  const e = employer();
  doc.employers[e.id] = e;
  for (const d of days) doc.days[dayKey(d.employerId, d.date)] = d;
  return doc;
}

const worked = (date: string, hours: number) =>
  day(date, {
    sessions: [{ id: `s-${date}`, start: h(8), end: h(8 + hours) }],
  });

// April 2026 starts on a Wednesday and ends on a Thursday, so the month spills
// at both ends: Mon 30 and Tue 31 March lead it, Fri 1 May trails it.
const APRIL = monthOf("2026-04-15");
const AFTER = "2026-05-31";

/** The month laid out, with whatever days are given worked. */
function chartOf(days: WorkDay[], today = AFTER) {
  const data = docOf(...days);
  const e = employer();
  const summary = summarizeRange(data, e, APRIL.from, APRIL.to, today, 0);
  return { chart: monthChart(summary, e, 1, today), summary };
}

describe("monthChart", () => {
  it("gives the month a row per week of it", () => {
    const { chart } = chartOf([]);
    expect(chart.weeks.map((w) => w.from)).toEqual([
      "2026-03-30",
      "2026-04-06",
      "2026-04-13",
      "2026-04-20",
      "2026-04-27",
    ]);
    expect(chart.weeks.every((w) => w.boxes.length === 7)).toBe(true);
  });

  it("packs the boxes end to end, and a day off takes no width", () => {
    const { chart } = chartOf([
      worked("2026-04-01", 8),
      worked("2026-04-02", 6),
      worked("2026-04-04", 2), // a Saturday
    ]);
    const week = chart.weeks[0]!;
    expect(week.boxes.map((b) => b.width)).toEqual([
      h(8), // Mon 30 March, a spill day at the width it was meant to take
      h(8), // Tue 31 March, likewise
      h(8), // Wed 1 April
      h(6), // Thu 2 April
      0, // Fri 3 April, nothing logged
      h(2), // Sat 4 April
      0, // Sun 5 April
    ]);
    // Every box starts where the one before it ended.
    expect(week.boxes.map((b) => b.x)).toEqual([
      0,
      h(8),
      h(16),
      h(24),
      h(30),
      h(30),
      h(32),
    ]);
    expect(week.width).toBe(h(32));
  });

  it("counts a spill day for nothing but its width", () => {
    const { chart } = chartOf([worked("2026-04-01", 8)]);
    const [mon, tue, wed] = chart.weeks[0]!.boxes;
    expect(mon!.spill).toBe(true);
    expect(mon!.worked).toBe(0);
    expect(mon!.ratio).toBe(null);
    expect(tue!.spill).toBe(true);
    expect(wed!.spill).toBe(false);
    // The row is as tall as the one day this month actually worked, and the
    // week's target is the three of its days that are April's.
    expect(chart.weeks[0]!.height).toBe(h(8));
    expect(chart.weeks[0]!.target).toBe(h(24));
  });

  it("stacks the rows, so the last one ends at the month's total", () => {
    const days = [
      worked("2026-04-01", 8),
      worked("2026-04-02", 6),
      worked("2026-04-07", 9),
      worked("2026-04-20", 4),
    ];
    const { chart, summary } = chartOf(days);
    expect(chart.weeks.map((w) => w.height)).toEqual([h(14), h(9), 0, h(4), 0]);
    expect(chart.weeks.map((w) => w.y)).toEqual([
      0,
      h(14),
      h(23),
      h(23),
      h(27),
    ]);
    const last = chart.weeks[chart.weeks.length - 1]!;
    expect(last.y + last.height).toBe(chart.total);
    // The figure the Report's "Worked" tile prints, and no other.
    expect(chart.total).toBe(summary.worked);
  });

  it("carries the two targets the axes are read against", () => {
    const { chart } = chartOf([]);
    // 3 April days in the first week, 5 in each of the next three, 4 in the
    // last — 22 working days at eight hours.
    expect(chart.weeks.map((w) => w.target)).toEqual([
      h(24),
      h(40),
      h(40),
      h(40),
      h(32),
    ]);
    expect(chart.target).toBe(h(176));
    expect(chart.weekTarget).toBe(h(40));
  });

  it("does not count a day that has not come", () => {
    // A Wednesday, three weeks in.
    const { chart } = chartOf([worked("2026-04-01", 8)], "2026-04-15");
    expect(chart.target).toBe(h(88)); // 1–15 April is eleven working days
    const wed = chart.weeks[2]!.boxes[2]!;
    expect(wed.date).toBe("2026-04-15");
    expect(wed.ratio).toBe(0);
    const thu = chart.weeks[2]!.boxes[3]!;
    expect(thu.date).toBe("2026-04-16");
    expect(thu.ratio).toBe(null); // still ahead, so not a shortfall
  });

  it("measures each day against its own target", () => {
    const { chart } = chartOf([
      worked("2026-04-01", 4),
      worked("2026-04-02", 10),
      worked("2026-04-04", 2), // a Saturday: no target to fall short of
    ]);
    const [, , wed, thu, , sat] = chart.weeks[0]!.boxes;
    expect(wed!.ratio).toBe(0.5);
    expect(thu!.ratio).toBe(1.25);
    expect(sat!.target).toBe(0);
    expect(sat!.ratio).toBe(null);
  });

  it("holds the hours axis open to a full week's target", () => {
    const { chart } = chartOf([worked("2026-04-06", 1)]);
    // The widest row is the first, on its two spill days alone (16 h), but a
    // month is read against a week of work.
    expect(chart.width).toBe(h(40));
    expect(chart.dayTarget).toBe(h(8));
  });

  it("holds the hours axis open to the target when the month fell short", () => {
    const { chart } = chartOf([worked("2026-04-01", 8)]);
    expect(chart.total).toBe(h(8));
    expect(chart.height).toBe(h(176));
  });
});

describe("boxColor", () => {
  it("is red at nothing, green at the target, blue a fifth past", () => {
    expect(boxColor(0)).toBe("var(--danger)");
    expect(boxColor(1)).toBe("var(--success)");
    expect(boxColor(OVER_RATIO)).toBe("var(--link)");
    expect(boxColor(2)).toBe("var(--link)");
  });

  it("mixes the steps between", () => {
    expect(boxColor(0.5)).toBe(
      "color-mix(in oklab, var(--danger), var(--success) 50%)",
    );
    expect(boxColor(1.1)).toBe(
      "color-mix(in oklab, var(--success), var(--link) 50%)",
    );
  });

  it("is green on a day there was no target to fall short of", () => {
    expect(boxColor(null)).toBe("var(--success)");
  });
});

describe("boxPath", () => {
  /** The point each command lands on — the last two numbers of an M, an L or
   *  an A, leaving an arc's radii and flags out of it. */
  const points = (d: string) =>
    [...d.matchAll(/([MLA])((?: -?[\d.]+)+)/g)].map((m) => {
      const n = m[2]!.trim().split(" ").map(Number);
      return [n[n.length - 2]!, n[n.length - 1]!] as const;
    });

  it("rounds only the ends it is asked to", () => {
    // Square both ends: every corner is a corner of the box itself.
    const square = points(boxPath(10, 20, 60, 30, 0, 0));
    for (const [x, y] of square) {
      expect([10, 70]).toContain(x);
      expect([20, 50]).toContain(y);
    }
    // A right end alone pulls the two right corners in by the radius, and
    // leaves the left ones where they were.
    const capped = boxPath(10, 20, 60, 30, 0, 4);
    expect(capped).toContain("L 66 20");
    expect(capped).toContain("L 10 50");
  });

  it("never cuts a corner bigger than the box it is cut from", () => {
    // A three-pixel-tall sliver of a week: the radius has to collapse to 1.5,
    // or the two arcs would cross and turn the box inside out.
    const sliver = boxPath(0, 0, 40, 3, 4, 4);
    for (const [, y] of points(sliver)) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(3);
    }
    expect(sliver).toContain("A 1.5 1.5");
    // Likewise a box narrower than two radii.
    expect(boxPath(0, 0, 2, 30, 4, 4)).toContain("A 1 1");
  });

  it("closes the shape", () => {
    expect(boxPath(0, 0, 10, 10, 2, 2).endsWith("Z")).toBe(true);
  });
});
