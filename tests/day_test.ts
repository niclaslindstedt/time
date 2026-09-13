// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  activityIntervals,
  breakIntervals,
  clip,
  dayTotals,
  progress,
  workedIntervals,
} from "../src/app/day.ts";
import { day, employer, h } from "./fixtures/helpers.ts";

// A typical Monday: in at 08:00, lunch 12:00–12:30, coffee 15:00–15:15, out
// at 17:00. Meetings 09:00–10:00, coding from 10:00 until leaving.
const monday = day("2026-03-02", {
  sessions: [{ id: "s1", start: h(8), end: h(17) }],
  breaks: [
    { id: "b1", typeId: "lunch", start: h(12), end: h(12, 30) },
    { id: "b2", typeId: "coffee", start: h(15), end: h(15, 15) },
  ],
  activities: [
    { id: "a1", categoryId: "meet", start: h(9), end: h(10) },
    { id: "a2", categoryId: "code", start: h(10), end: h(17) },
  ],
});

describe("clip", () => {
  it("reads a closed span as it is and an open one up to now", () => {
    expect(clip({ id: "x", start: 10, end: 20 }, 100)).toEqual({
      start: 10,
      end: 20,
    });
    expect(clip({ id: "x", start: 10, end: null }, 100)).toEqual({
      start: 10,
      end: 100,
    });
    expect(clip({ id: "x", start: 200, end: null }, 100)).toBeNull();
  });
});

describe("dayTotals on a finished day", () => {
  const t = dayTotals(monday, h(23));

  it("subtracts breaks from presence", () => {
    expect(t.presence).toBe(h(9));
    expect(t.breakTotal).toBe(h(0, 45));
    expect(t.worked).toBe(h(8, 15));
  });

  it("splits breaks by type", () => {
    expect(t.breaks).toEqual({ lunch: h(0, 30), coffee: h(0, 15) });
  });

  it("labels worked time by category, with breaks taken out", () => {
    // Coding ran 10:00–17:00 = 7h, minus lunch and coffee = 6h15.
    expect(t.categories).toEqual({ meet: h(1), code: h(6, 15) });
    // 08:00–09:00 was nothing in particular.
    expect(t.uncategorised).toBe(h(1));
  });

  it("is out, with the day's first-in and last-out", () => {
    expect(t.state).toBe("out");
    expect(t.firstIn).toBe(h(8));
    expect(t.lastOut).toBe(h(17));
    expect(t.openSession).toBeNull();
  });
});

describe("dayTotals on a running day", () => {
  const running = day("2026-03-02", {
    sessions: [{ id: "s1", start: h(8), end: null }],
    breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: null }],
    activities: [{ id: "a1", categoryId: "code", start: h(8), end: null }],
  });

  it("counts up to now and reports the break as the state", () => {
    const t = dayTotals(running, h(12, 10));
    expect(t.state).toBe("break");
    expect(t.worked).toBe(h(4));
    expect(t.breaks).toEqual({ lunch: h(0, 10) });
    expect(t.currentCategoryId).toBe("code");
    expect(t.lastOut).toBeNull();
  });

  it("is working the moment a session opens, before a second has passed", () => {
    const fresh = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: null }],
    });
    expect(dayTotals(fresh, h(8)).state).toBe("working");
    expect(dayTotals(fresh, h(8)).worked).toBe(0);
  });
});

describe("what lies outside presence counts for nothing", () => {
  it("ignores a break logged after leaving", () => {
    const d = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(12) }],
      breaks: [{ id: "b1", typeId: "lunch", start: h(12, 30), end: h(13) }],
    });
    expect(dayTotals(d, h(23)).breakTotal).toBe(0);
    expect(breakIntervals(d, h(23))).toEqual([]);
  });

  it("clips a break that straddles the clock-out", () => {
    const d = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(12, 15) }],
      breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: h(13) }],
    });
    expect(dayTotals(d, h(23)).breaks).toEqual({ lunch: h(0, 15) });
    expect(workedIntervals(d, h(23))).toEqual([{ start: h(8), end: h(12) }]);
  });

  it("only labels time that was worked", () => {
    const d = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(10) }],
      activities: [{ id: "a1", categoryId: "meet", start: h(7), end: h(11) }],
    });
    expect(activityIntervals(d, h(23))).toEqual([
      { start: h(8), end: h(10), categoryId: "meet" },
    ]);
  });
});

describe("two sessions in a day", () => {
  it("adds presence across them", () => {
    const d = day("2026-03-02", {
      sessions: [
        { id: "s1", start: h(8), end: h(12) },
        { id: "s2", start: h(13), end: h(17) },
      ],
    });
    const t = dayTotals(d, h(23));
    expect(t.worked).toBe(h(8));
    expect(t.firstIn).toBe(h(8));
    expect(t.lastOut).toBe(h(17));
  });
});

describe("progress", () => {
  it("is the worked share of the target, and runs past one", () => {
    expect(progress(h(4), employer())).toBeCloseTo(0.5);
    expect(progress(h(9), employer())).toBeCloseTo(1.125);
    expect(progress(h(3), employer({ hoursPerDay: 6 }))).toBeCloseTo(0.5);
  });
});
