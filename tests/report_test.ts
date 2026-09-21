// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  monthOf,
  readUpTo,
  runningBalance,
  summarizeDay,
  summarizeRange,
  weekOf,
} from "../src/app/report.ts";
import { dayKey, emptyDoc, type WorkDay } from "../src/app/types.ts";
import { day, project, h } from "./fixtures/helpers.ts";

function docOf(...days: WorkDay[]) {
  const doc = emptyDoc();
  const e = project();
  doc.projects[e.id] = e;
  for (const d of days) doc.days[dayKey(d.projectId, d.date)] = d;
  return doc;
}

// The week of Monday 2 March 2026.
const mon = day("2026-03-02", {
  sessions: [{ id: "s", start: h(8), end: h(17) }],
  breaks: [{ id: "b", typeId: "lunch", start: h(12), end: h(13) }],
  activities: [{ id: "a", categoryId: "code", start: h(8), end: h(17) }],
});
const tue = day("2026-03-03", {
  sessions: [{ id: "s", start: h(9), end: h(16) }],
});
const sat = day("2026-03-07", {
  sessions: [{ id: "s", start: h(10), end: h(12) }],
});

describe("readUpTo", () => {
  it("reads today to now, the past to midnight, the future to nothing", () => {
    expect(readUpTo("2026-03-02", "2026-03-02", h(10))).toBe(h(10));
    expect(readUpTo("2026-03-01", "2026-03-02", h(10))).toBe(86_400);
    expect(readUpTo("2026-03-03", "2026-03-02", h(10))).toBe(0);
  });
});

describe("summarizeDay", () => {
  it("measures a work day against the target", () => {
    const s = summarizeDay(mon, project(), "2026-03-02", 86_400);
    expect(s.expected).toBe(true);
    expect(s.target).toBe(h(8));
    expect(s.worked).toBe(h(8));
    expect(s.balance).toBe(0);
    expect(s.categories).toEqual({ code: h(8) });
    expect(s.uncategorised).toBe(0);
    expect(s.logged).toBe(true);
  });

  it("counts every second of a day off as overtime", () => {
    const s = summarizeDay(sat, project(), "2026-03-07", 86_400);
    expect(s.expected).toBe(false);
    expect(s.target).toBe(0);
    expect(s.balance).toBe(h(2));
  });

  it("reports an unlogged work day as a full shortfall", () => {
    const s = summarizeDay(null, project(), "2026-03-04", 86_400);
    expect(s.logged).toBe(false);
    expect(s.balance).toBe(-h(8));
  });
});

describe("summarizeRange", () => {
  const doc = docOf(mon, tue, sat);

  it("sums a whole week seen from its end", () => {
    const r = summarizeRange(
      doc,
      project(),
      "2026-03-02",
      "2026-03-08",
      "2026-03-08",
      h(12),
    );
    expect(r.days).toHaveLength(7);
    expect(r.worked).toBe(h(8) + h(7) + h(2));
    expect(r.target).toBe(5 * h(8));
    expect(r.balance).toBe(h(17) - h(40));
    expect(r.workedDays).toBe(3);
    expect(r.expectedDays).toBe(5);
    expect(r.breaks).toEqual({ lunch: h(1) });
    expect(r.categories).toEqual({ code: h(8) });
  });

  it("does not count days that have not come yet against the balance", () => {
    const r = summarizeRange(
      doc,
      project(),
      "2026-03-02",
      "2026-03-08",
      "2026-03-03",
      h(16),
    );
    expect(r.target).toBe(2 * h(8));
    expect(r.balance).toBe(h(15) - h(16));
    // The columns are still all there for the chart.
    expect(r.days).toHaveLength(7);
    expect(r.days[6]!.worked).toBe(0);
  });

  it("reads today up to now", () => {
    const open = day("2026-03-04", {
      sessions: [{ id: "s", start: h(8), end: null }],
    });
    const r = summarizeRange(
      docOf(open),
      project(),
      "2026-03-04",
      "2026-03-04",
      "2026-03-04",
      h(11, 30),
    );
    expect(r.worked).toBe(h(3, 30));
  });
});

describe("the day being worked", () => {
  const today = "2026-03-04";
  /** The day as it stands at `now`, summarised the way the Report does. */
  const at = (d: WorkDay | null, now: number) =>
    summarizeDay(d, project(), today, now, true);

  it("owes nothing before the first clock-in", () => {
    // Nine in the morning on a day nobody has started. Eight hours behind is
    // the number this rule exists to refuse.
    expect(at(null, h(9)).due).toBe(0);
    expect(at(null, h(9)).balance).toBe(0);
    expect(at(day(today), h(9)).balance).toBe(0);
    // The day is still asked for eight hours — that is what the charts draw
    // a track at. It has simply not come due.
    expect(at(null, h(9)).target).toBe(h(8));
  });

  it("owes only what there has been the chance to work", () => {
    const working = day(today, {
      sessions: [{ id: "s", start: h(8), end: null }],
    });
    // Three hours in and still at it: three hours due, and level.
    expect(at(working, h(11)).worked).toBe(h(3));
    expect(at(working, h(11)).due).toBe(h(3));
    expect(at(working, h(11)).balance).toBe(0);
  });

  it("counts overtime the moment the target is passed", () => {
    const long = day(today, {
      sessions: [{ id: "s", start: h(8), end: null }],
    });
    // Nine hours in: the target has come due in full and the ninth hour is
    // time in hand, without waiting for the day to be put away.
    expect(at(long, h(17)).due).toBe(h(8));
    expect(at(long, h(17)).balance).toBe(h(1));
  });

  it("owes the whole target once the day is put away", () => {
    const short = day(today, {
      sessions: [{ id: "s", start: h(8), end: h(12) }],
    });
    // Clocked out four hours short: that is a shortfall now, not at midnight.
    expect(at(short, h(13)).due).toBe(h(8));
    expect(at(short, h(13)).balance).toBe(-h(4));
    // And back at it — the day can be worked again, so it owes what has been
    // worked and nothing more.
    const again = day(today, {
      sessions: [
        { id: "s", start: h(8), end: h(12) },
        { id: "s2", start: h(14), end: null },
      ],
    });
    expect(at(again, h(15)).balance).toBe(0);
  });

  it("is not put away by a break", () => {
    const onBreak = day(today, {
      sessions: [{ id: "s", start: h(8), end: null }],
      breaks: [{ id: "b", typeId: "lunch", start: h(12), end: h(12, 30) }],
    });
    // Half past twelve, on lunch: paused, not stopped.
    expect(at(onBreak, h(12, 15)).balance).toBe(0);
  });

  it("leaves a day that is over to owe the whole of it", () => {
    // The same short day, read as a day in the past: a full shortfall, which
    // is what `live` off means and what every day before today gets.
    const short = day("2026-03-03", {
      sessions: [{ id: "s", start: h(8), end: h(12) }],
    });
    const s = summarizeDay(short, project(), "2026-03-03", 86_400);
    expect(s.due).toBe(h(8));
    expect(s.balance).toBe(-h(4));
  });

  it("keeps the range's target to what has come due", () => {
    const working = day(today, {
      sessions: [{ id: "s", start: h(8), end: null }],
    });
    const r = summarizeRange(
      docOf(mon, tue, working),
      project(),
      "2026-03-02",
      "2026-03-08",
      today,
      h(11),
    );
    // Three days have come, so three days are asked for — that is what the
    // share under the ring is read against, and it does not move as the day
    // is worked. Due is the other figure: Monday's eight and Tuesday's
    // eight, and of Wednesday only the three hours it has had the chance to
    // be worked.
    expect(r.target).toBe(h(24));
    expect(r.due).toBe(h(19));
    expect(r.worked).toBe(h(8) + h(7) + h(3));
    // So the balance is the two finished days' own, and Wednesday is level.
    expect(r.balance).toBe(-h(1));
    expect(r.balance).toBe(r.worked - r.due);
  });
});

describe("weekOf and monthOf", () => {
  it("finds the week from either start", () => {
    expect(weekOf("2026-03-04", 1)).toEqual({
      from: "2026-03-02",
      to: "2026-03-08",
    });
    expect(weekOf("2026-03-04", 0)).toEqual({
      from: "2026-03-01",
      to: "2026-03-07",
    });
  });

  it("finds the month, December included", () => {
    expect(monthOf("2026-02-10")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(monthOf("2026-12-25")).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });
});

describe("runningBalance", () => {
  it("runs from the first logged day to today", () => {
    const doc = docOf(mon, tue);
    // Wednesday noon: Mon 0, Tue −1h, and Wednesday itself nothing either
    // way — the day has not been worked and has not been put away, so none
    // of its target has come due yet.
    expect(runningBalance(doc, project(), "2026-03-04", h(12))).toBe(-h(1));
    expect(runningBalance(emptyDoc(), project(), "2026-03-04", h(12))).toBe(0);
  });
});
