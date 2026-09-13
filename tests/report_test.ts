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
import { day, employer, h } from "./fixtures/helpers.ts";

function docOf(...days: WorkDay[]) {
  const doc = emptyDoc();
  const e = employer();
  doc.employers[e.id] = e;
  for (const d of days) doc.days[dayKey(d.employerId, d.date)] = d;
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
    const s = summarizeDay(mon, employer(), "2026-03-02", 86_400);
    expect(s.expected).toBe(true);
    expect(s.target).toBe(h(8));
    expect(s.worked).toBe(h(8));
    expect(s.balance).toBe(0);
    expect(s.categories).toEqual({ code: h(8) });
    expect(s.uncategorised).toBe(0);
    expect(s.logged).toBe(true);
  });

  it("counts every second of a day off as overtime", () => {
    const s = summarizeDay(sat, employer(), "2026-03-07", 86_400);
    expect(s.expected).toBe(false);
    expect(s.target).toBe(0);
    expect(s.balance).toBe(h(2));
  });

  it("reports an unlogged work day as a full shortfall", () => {
    const s = summarizeDay(null, employer(), "2026-03-04", 86_400);
    expect(s.logged).toBe(false);
    expect(s.balance).toBe(-h(8));
  });
});

describe("summarizeRange", () => {
  const doc = docOf(mon, tue, sat);

  it("sums a whole week seen from its end", () => {
    const r = summarizeRange(
      doc,
      employer(),
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
      employer(),
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
      employer(),
      "2026-03-04",
      "2026-03-04",
      "2026-03-04",
      h(11, 30),
    );
    expect(r.worked).toBe(h(3, 30));
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
    // Wednesday noon: Mon 0, Tue −1h, Wed −8h so far (nothing logged).
    expect(runningBalance(doc, employer(), "2026-03-04", h(12))).toBe(-h(9));
    expect(runningBalance(emptyDoc(), employer(), "2026-03-04", h(12))).toBe(0);
  });
});
