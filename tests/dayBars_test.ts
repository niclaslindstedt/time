// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { dayBars } from "../src/app/dayBars.ts";
import { summarizeRange, weekOf } from "../src/app/report.ts";
import { dayKey, emptyDoc, type WorkDay } from "../src/app/types.ts";
import { day, project, h } from "./fixtures/helpers.ts";

function docOf(...days: WorkDay[]) {
  const doc = emptyDoc();
  const e = project();
  doc.projects[e.id] = e;
  for (const d of days) doc.days[dayKey(d.projectId, d.date)] = d;
  return doc;
}

const worked = (date: string, hours: number) =>
  day(date, {
    sessions: [{ id: `s-${date}`, start: h(8), end: h(8) + h(hours) }],
  });

// Monday 6 April 2026 to Sunday the 12th — a whole week, week starting Monday.
const WEEK = weekOf("2026-04-08", 1);
const AFTER = "2026-04-30";

function chartOf(days: WorkDay[], today = AFTER) {
  const data = docOf(...days);
  const e = project();
  const summary = summarizeRange(data, e, WEEK.from, WEEK.to, today, 0);
  return dayBars(summary, e, today);
}

describe("dayBars", () => {
  it("gives the range a bar a day, in order", () => {
    const chart = chartOf([]);
    expect(chart.bars.map((b) => b.date)).toEqual([
      "2026-04-06",
      "2026-04-07",
      "2026-04-08",
      "2026-04-09",
      "2026-04-10",
      "2026-04-11",
      "2026-04-12",
    ]);
  });

  it("fills the track from the floor on a short day, and leaves the rest", () => {
    const bar = chartOf([worked("2026-04-06", 6)]).bars[0]!;
    expect(bar.worked).toBe(h(6));
    expect(bar.target).toBe(h(8));
    expect(bar.inside).toBe(h(6));
    expect(bar.over).toBe(0);
    expect(bar.short).toBe(h(2));
    // The bar stands as tall as the track it did not fill.
    expect(bar.height).toBe(h(8));
    expect(bar.ratio).toBeCloseTo(0.75);
  });

  it("carries the bar past the top of the track on a long day", () => {
    const bar = chartOf([worked("2026-04-06", 9.5)]).bars[0]!;
    expect(bar.inside).toBe(h(8));
    expect(bar.over).toBe(h(1, 30));
    expect(bar.short).toBe(0);
    // Past the target the bar, not the track, is what the day stands at.
    expect(bar.height).toBe(h(9, 30));
    expect(bar.ratio).toBeCloseTo(9.5 / 8);
  });

  it("stops exactly at the top of the track on a day worked to target", () => {
    const bar = chartOf([worked("2026-04-06", 8)]).bars[0]!;
    expect(bar.inside).toBe(h(8));
    expect(bar.over).toBe(0);
    expect(bar.short).toBe(0);
    expect(bar.ratio).toBe(1);
  });

  it("gives a day off no track at all, so its hours are all above", () => {
    // Saturday the 11th: the project expects nothing of it.
    const bar = chartOf([worked("2026-04-11", 3)]).bars[5]!;
    expect(bar.date).toBe("2026-04-11");
    expect(bar.target).toBe(0);
    expect(bar.inside).toBe(0);
    expect(bar.over).toBe(h(3));
    expect(bar.short).toBe(0);
    // Nothing to fall short of, so nothing to colour the day against.
    expect(bar.ratio).toBeNull();
  });

  it("draws a day still ahead as a track with no ratio", () => {
    // Wednesday, read on the Monday: the week's Thursday has not come.
    const chart = chartOf([worked("2026-04-06", 8)], "2026-04-06");
    const thursday = chart.bars[3]!;
    expect(thursday.date).toBe("2026-04-09");
    expect(thursday.future).toBe(true);
    expect(thursday.target).toBe(h(8));
    expect(thursday.short).toBe(h(8));
    expect(thursday.ratio).toBeNull();
    expect(chart.bars[0]!.future).toBe(false);
  });

  it("stands the plot at a full working day when every day is short", () => {
    const chart = chartOf([worked("2026-04-06", 2)]);
    expect(chart.dayTarget).toBe(h(8));
    expect(chart.top).toBe(h(8));
  });

  it("raises the plot to the longest day when one overshoots", () => {
    const chart = chartOf([worked("2026-04-06", 8), worked("2026-04-07", 11)]);
    expect(chart.top).toBe(h(11));
  });

  it("raises the plot for a day off worked past a day's length", () => {
    const chart = chartOf([worked("2026-04-11", 9)]);
    expect(chart.top).toBe(h(9));
  });
});
