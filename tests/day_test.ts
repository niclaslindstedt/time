// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  activityIntervals,
  boundaryRange,
  breakIntervals,
  clip,
  daySegments,
  dayTotals,
  horizon,
  progress,
  workdayEnd,
  workedIntervals,
} from "../src/app/day.ts";
import { total } from "../src/app/intervals.ts";
import type { BreakCredit, Project } from "../src/app/types.ts";
import { day, project, h } from "./fixtures/helpers.ts";

/** The project every day here is read against: Mon–Fri, eight hours, a
 *  lunch and a coffee, and — until a test says otherwise — no break that
 *  counts as work. */
const acme = project();

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
  const t = dayTotals(monday, acme, h(23));

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
    const t = dayTotals(running, acme, h(12, 10));
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
    expect(dayTotals(fresh, acme, h(8)).state).toBe("working");
    expect(dayTotals(fresh, acme, h(8)).worked).toBe(0);
  });
});

describe("what lies outside presence counts for nothing", () => {
  it("ignores a break logged after leaving", () => {
    const d = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(12) }],
      breaks: [{ id: "b1", typeId: "lunch", start: h(12, 30), end: h(13) }],
    });
    expect(dayTotals(d, acme, h(23)).breakTotal).toBe(0);
    expect(breakIntervals(d, h(23))).toEqual([]);
  });

  it("clips a break that straddles the clock-out", () => {
    const d = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(12, 15) }],
      breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: h(13) }],
    });
    expect(dayTotals(d, acme, h(23)).breaks).toEqual({ lunch: h(0, 15) });
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
    const t = dayTotals(d, acme, h(23));
    expect(t.worked).toBe(h(8));
    expect(t.firstIn).toBe(h(8));
    expect(t.lastOut).toBe(h(17));
  });
});

describe("progress", () => {
  it("is the worked share of the target, and runs past one", () => {
    expect(progress(h(4), project())).toBeCloseTo(0.5);
    expect(progress(h(9), project())).toBeCloseTo(1.125);
    expect(progress(h(3), project({ hoursPerDay: 6 }))).toBeCloseTo(0.5);
  });
});

describe("the day as stretches", () => {
  it("cuts presence at every break and change of work", () => {
    expect(
      daySegments(monday, h(23)).map((s) => [s.kind, s.typeId, s.start, s.end]),
    ).toEqual([
      // The first hour was worked but never labelled — an activity only says
      // what work was, it never claims any.
      ["work", null, h(8), h(9)],
      ["work", "meet", h(9), h(10)],
      ["work", "code", h(10), h(12)],
      ["break", "lunch", h(12), h(12, 30)],
      ["work", "code", h(12, 30), h(15)],
      ["break", "coffee", h(15), h(15, 15)],
      ["work", "code", h(15, 15), h(17)],
    ]);
  });

  it("reads the morning as one stretch when nothing named it", () => {
    const d = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(12) }],
    });
    expect(daySegments(d, h(23))).toEqual([
      {
        kind: "work",
        typeId: null,
        start: h(8),
        end: h(12),
        current: false,
        running: false,
      },
    ]);
  });

  it("draws a break out to its assumed end and marks the rest running", () => {
    // In at 08:00, still there; lunch taken at 12:00 and booked until 12:30.
    const d = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: null }],
      breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: h(12, 30) }],
    });
    // Ten minutes into it, the day already knows it reaches 12:30…
    expect(horizon(d, h(12, 10))).toBe(h(12, 30));
    const during = daySegments(d, h(12, 10));
    expect(during.map((s) => [s.kind, s.start, s.end])).toEqual([
      ["work", h(8), h(12)],
      ["break", h(12), h(12, 30)],
    ]);
    expect(during[1]!.current).toBe(true);
    // …but the totals still stop at the moment they are read.
    expect(dayTotals(d, acme, h(12, 10)).worked).toBe(h(4));

    // Once it is over, the stretch after it is the one still running.
    const after = daySegments(d, h(13));
    expect(after[2]).toEqual({
      kind: "work",
      typeId: null,
      start: h(12, 30),
      end: h(13),
      current: true,
      running: true,
    });
  });

  it("knows the break it is inside, open-ended or assumed", () => {
    const assumed = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: null }],
      breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: h(12, 30) }],
    });
    expect(dayTotals(assumed, acme, h(12, 10)).currentBreak?.id).toBe("b1");
    expect(dayTotals(assumed, acme, h(12, 10)).openBreak).toBeNull();
    expect(dayTotals(assumed, acme, h(12, 40)).currentBreak).toBeNull();
    expect(dayTotals(assumed, acme, h(12, 40)).state).toBe("working");

    const open = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: null }],
      breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: null }],
    });
    expect(dayTotals(open, acme, h(14)).currentBreak?.id).toBe("b1");
    expect(dayTotals(open, acme, h(14)).state).toBe("break");
  });

  it("gives an edge the room between its neighbours, a minute clear", () => {
    expect(boundaryRange(monday, h(12, 30), h(23))).toEqual({
      min: h(12) + 60,
      max: h(15) - 60,
    });
    // The very first and the very last edge of the day have one neighbour.
    expect(boundaryRange(monday, h(8), h(23))?.min).toBe(0);
    expect(boundaryRange(monday, h(17), h(23))?.max).toBe(2 * 86_400);
    expect(boundaryRange(monday, h(9, 17), h(23))).toBeNull();
  });
});

// ── What a break counts for ──
//
// A break carves time out of presence; a kind of break can say that some or
// all of it still counts as work (see `BreakCredit`). The credit reaches the
// totals and not the intervals — a break is a break wherever it is drawn.

describe("breaks that count as work", () => {
  /** The Monday above, with lunch (30 min) and coffee (15 min) taken. */
  const counts = (credit: Parameters<typeof project>[0]) =>
    dayTotals(monday, project(credit), h(23));

  const withLunch = (lunch: BreakCredit): Partial<Project> => ({
    breakTypes: [
      { id: "lunch", name: "Lunch", defaultMinutes: 30, credit: lunch },
      { id: "coffee", name: "Coffee", defaultMinutes: 15 },
    ],
  });

  it("counts none of them until a project says otherwise", () => {
    const t = counts({});
    expect(t.breakCredit).toEqual({});
    expect(t.breakCreditTotal).toBe(0);
    expect(t.worked).toBe(h(8, 15));
  });

  it("hands a fully counted break back to the day", () => {
    const t = counts(withLunch({ mode: "all" }));
    expect(t.breakCredit).toEqual({ lunch: h(0, 30) });
    // 9h present, 45 min of breaks, half an hour of it counted.
    expect(t.worked).toBe(h(8, 45));
  });

  it("hands back only the first minutes of a partial one", () => {
    const t = counts(withLunch({ mode: "partial", minutes: 20 }));
    expect(t.breakCredit).toEqual({ lunch: h(0, 20) });
    expect(t.worked).toBe(h(8, 35));
  });

  it("never hands back more of a break than was taken", () => {
    const t = counts(withLunch({ mode: "partial", minutes: 90 }));
    expect(t.breakCredit).toEqual({ lunch: h(0, 30) });
    expect(t.worked).toBe(h(8, 45));
  });

  it("spends a partial credit over the day rather than per break", () => {
    // Two coffees of a quarter of an hour each, of which twenty minutes in
    // all counts — not twenty minutes apiece.
    const d = day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(17) }],
      breaks: [
        { id: "b1", typeId: "coffee", start: h(10), end: h(10, 15) },
        { id: "b2", typeId: "coffee", start: h(14), end: h(14, 15) },
      ],
    });
    const p = project({
      breakTypes: [
        {
          id: "coffee",
          name: "Coffee",
          defaultMinutes: 15,
          credit: { mode: "partial", minutes: 20 },
        },
      ],
    });
    const t = dayTotals(d, p, h(23));
    expect(t.breakTotal).toBe(h(0, 30));
    expect(t.breakCredit).toEqual({ coffee: h(0, 20) });
    expect(t.worked).toBe(h(8, 50));
  });

  it("leaves the break's own total and the intervals alone", () => {
    const t = counts(withLunch({ mode: "all" }));
    // The whole of the break is still break time, and still drawn as one.
    expect(t.breakTotal).toBe(h(0, 45));
    expect(t.breaks).toEqual({ lunch: h(0, 30), coffee: h(0, 15) });
    expect(total(workedIntervals(monday, h(23)))).toBe(h(8, 15));
  });

  it("counts a break of a kind the project has lost for nothing", () => {
    const t = dayTotals(monday, project({ breakTypes: [] }), h(23));
    expect(t.breakCredit).toEqual({});
    expect(t.worked).toBe(h(8, 15));
  });
});

// ── When the day is done ──

describe("workdayEnd", () => {
  /** In at eight and still going, read at ten. Eight hours to do. */
  const morning = day("2026-03-02", {
    sessions: [{ id: "s1", start: h(8), end: null }],
  });

  it("is the target away from now on a day with nothing in it yet", () => {
    expect(workdayEnd(morning, acme, h(10))).toBe(h(16));
  });

  /** In at eight, half an hour of lunch, read at one. */
  const lunched = day("2026-03-02", {
    sessions: [{ id: "s1", start: h(8), end: null }],
    breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: h(12, 30) }],
  });

  it("pushes the end out by a break that counts for nothing", () => {
    expect(workdayEnd(lunched, acme, h(13))).toBe(h(16, 30));
  });

  it("leaves it where it was when the break counts in full", () => {
    const p = project({
      breakTypes: [
        {
          id: "lunch",
          name: "Lunch",
          defaultMinutes: 30,
          credit: { mode: "all" },
        },
      ],
    });
    expect(workdayEnd(lunched, p, h(13))).toBe(h(16));
  });

  it("pushes it out by whatever of the break did not count", () => {
    const p = project({
      breakTypes: [
        {
          id: "lunch",
          name: "Lunch",
          defaultMinutes: 30,
          credit: { mode: "partial", minutes: 10 },
        },
      ],
    });
    expect(workdayEnd(lunched, p, h(13))).toBe(h(16, 20));
  });

  it("reads a break's assumed end as time that has been spent", () => {
    // Ten past twelve, of a lunch written down as ending at half past: the
    // twenty minutes still to come are already on the day.
    expect(workdayEnd(lunched, acme, h(12, 10))).toBe(h(16, 30));
  });

  it("crosses the target inside a break that counts", () => {
    const p = project({
      hoursPerDay: 4.25,
      breakTypes: [
        {
          id: "lunch",
          name: "Lunch",
          defaultMinutes: 30,
          credit: { mode: "all" },
        },
      ],
    });
    // Four hours done by noon, and the quarter hour that finishes the day is
    // the first quarter of the lunch.
    expect(workdayEnd(lunched, p, h(13))).toBe(h(12, 15));
  });

  it("gives the moment the hours were done on a day that ran past them", () => {
    expect(workdayEnd(morning, acme, h(18))).toBe(h(16));
  });

  it("counts nothing towards the day while clocked out", () => {
    // Out from ten to eleven, back until now: the hour away moves the end.
    const split = day("2026-03-02", {
      sessions: [
        { id: "s1", start: h(8), end: h(10) },
        { id: "s2", start: h(11), end: null },
      ],
    });
    expect(workdayEnd(split, acme, h(12))).toBe(h(17));
  });

  it("is nothing to say before the day has started, or once it is over", () => {
    expect(workdayEnd(day("2026-03-02"), acme, h(10))).toBeNull();
    expect(workdayEnd(monday, acme, h(23))).toBeNull();
  });

  it("is nothing to say on a day the project expects no work on", () => {
    const saturday = day("2026-03-07", {
      sessions: [{ id: "s1", start: h(10), end: null }],
    });
    expect(workdayEnd(saturday, acme, h(12))).toBeNull();
  });
});
