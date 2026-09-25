// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  addBreak,
  addSession,
  clockIn,
  clockOut,
  endBreak,
  isValidSpan,
  latestSession,
  moveBoundary,
  removeSpan,
  setCategory,
  setSessionStart,
  takeBreak,
  updateSpan,
} from "../src/app/actions.ts";
import { boundaryRange, dayTotals, daySegments } from "../src/app/day.ts";
import { STAMP, ctx, day, h, project } from "./fixtures/helpers.ts";

/** The project the totals here are read against — no break of it counts as
 *  work, which is what a break has always counted for. */
const acme = project();

const empty = () =>
  day("2026-03-02", { updatedAt: "2020-01-01T00:00:00.000Z" });

describe("a day as it happens", () => {
  it("clocks in, takes lunch, switches category, clocks out", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    expect(d.sessions).toEqual([{ id: "id1", start: h(8), end: null }]);
    expect(d.updatedAt).toBe(STAMP);

    d = setCategory(d, "code", h(8), c);
    d = takeBreak(d, "lunch", h(12), 30 * 60, c);
    d = setCategory(d, "meet", h(14), c);
    d = clockOut(d, h(17), c);

    const t = dayTotals(d, acme, h(23));
    expect(t.worked).toBe(h(8, 30));
    expect(t.breaks).toEqual({ lunch: h(0, 30) });
    expect(t.categories).toEqual({ code: h(5, 30), meet: h(3) });
    expect(t.state).toBe("out");
    // Everything got closed by the clock-out.
    expect(d.activities.every((a) => a.end !== null)).toBe(true);
  });

  it("closes a running break and activity on clock-out", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = setCategory(d, "code", h(8), c);
    d = takeBreak(d, "coffee", h(10), 15 * 60, c);
    d = clockOut(d, h(10, 5), c);
    expect(d.breaks[0]!.end).toBe(h(10, 5));
    expect(d.activities[0]!.end).toBe(h(10, 5));
  });

  it("drops a span closed in the same second it opened", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = clockOut(d, h(8), c);
    expect(d.sessions).toEqual([]);
  });
});

describe("a minute either side of the face", () => {
  it("drops a session stopped less than a minute after it started", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = clockOut(d, h(8) + 59, c);
    expect(d.sessions).toEqual([]);
  });

  it("keeps a session stopped a minute after it started", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = clockOut(d, h(8) + 60, c);
    expect(d.sessions).toEqual([{ id: "id1", start: h(8), end: h(8) + 60 }]);
  });

  it("drops what was begun inside a session it drops", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = setCategory(d, "code", h(8) + 5, c);
    d = takeBreak(d, "coffee", h(8) + 10, 15 * 60, c);
    d = clockOut(d, h(8) + 30, c);
    expect(d.sessions).toEqual([]);
    expect(d.breaks).toEqual([]);
    expect(d.activities).toEqual([]);
  });

  it("leaves an earlier session alone when it drops a mis-tap", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = setCategory(d, "code", h(8), c);
    d = clockOut(d, h(12), c);
    d = clockIn(d, h(13), c);
    d = clockOut(d, h(13) + 20, c);
    expect(d.sessions).toEqual([{ id: "id1", start: h(8), end: h(12) }]);
    expect(d.activities).toEqual([
      { id: "id2", categoryId: "code", start: h(8), end: h(12) },
    ]);
  });

  it("picks the session back up when it restarts inside a minute", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = setCategory(d, "code", h(8), c);
    d = clockOut(d, h(12), c);
    d = clockIn(d, h(12) + 30, c);
    // The same session, still open, with the gap inside it.
    expect(d.sessions).toEqual([{ id: "id1", start: h(8), end: null }]);
    // And the kind of work it was cut off in the middle of.
    expect(d.activities).toEqual([
      { id: "id2", categoryId: "code", start: h(8), end: null },
    ]);
    expect(dayTotals(d, acme, h(12) + 30).worked).toBe(h(4) + 30);
  });

  it("opens a second session when a minute has gone by", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = clockOut(d, h(12), c);
    d = clockIn(d, h(12) + 60, c);
    expect(d.sessions).toEqual([
      { id: "id1", start: h(8), end: h(12) },
      { id: "id2", start: h(12) + 60, end: null },
    ]);
  });

  it("resumes the session that ended last", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = clockOut(d, h(9), c);
    d = clockIn(d, h(12), c);
    d = clockOut(d, h(13), c);
    d = clockIn(d, h(13) + 10, c);
    expect(d.sessions).toEqual([
      { id: "id1", start: h(8), end: h(9) },
      { id: "id2", start: h(12), end: null },
    ]);
  });

  it("does not resume a break that was cut short with the session", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = takeBreak(d, "lunch", h(12), 30 * 60, c);
    d = clockOut(d, h(12, 10), c);
    d = clockIn(d, h(12, 10) + 30, c);
    expect(d.sessions).toEqual([{ id: "id1", start: h(8), end: null }]);
    expect(d.breaks).toEqual([
      { id: "id2", typeId: "lunch", start: h(12), end: h(12, 10) },
    ]);
  });
});

describe("invariants", () => {
  it("does not open a second session", () => {
    const c = ctx();
    const d = clockIn(empty(), h(8), c);
    expect(clockIn(d, h(9), c)).toBe(d);
  });

  it("does nothing when out", () => {
    const c = ctx();
    const d = empty();
    expect(clockOut(d, h(9), c)).toBe(d);
    expect(takeBreak(d, "lunch", h(9), 30 * 60, c)).toBe(d);
    expect(setCategory(d, "code", h(9), c)).toBe(d);
    expect(endBreak(d, h(9), c)).toBe(d);
  });

  it("a break taken during another one cuts the first one short", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = takeBreak(d, "lunch", h(12), 30 * 60, c);
    d = takeBreak(d, "coffee", h(12, 20), 15 * 60, c);
    expect(d.breaks).toEqual([
      { id: "id2", typeId: "lunch", start: h(12), end: h(12, 20) },
      { id: "id3", typeId: "coffee", start: h(12, 20), end: h(12, 35) },
    ]);
  });

  it("re-choosing the running category changes nothing; null clears it", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = setCategory(d, "code", h(8), c);
    expect(setCategory(d, "code", h(9), c)).toBe(d);
    d = setCategory(d, null, h(9), c);
    expect(d.activities).toEqual([
      { id: "id2", categoryId: "code", start: h(8), end: h(9) },
    ]);
  });
});

describe("after the fact", () => {
  it("adds a break with both ends, and refuses an inverted one", () => {
    const c = ctx();
    const d = addBreak(empty(), "lunch", h(12), h(12, 30), c);
    expect(d.breaks).toHaveLength(1);
    expect(addBreak(d, "lunch", h(13), h(12), c)).toBe(d);
  });

  it("adds a closed session, but not a second open one", () => {
    const c = ctx();
    let d = addSession(empty(), h(8), h(12), c);
    d = addSession(d, h(13), null, c);
    expect(d.sessions).toHaveLength(2);
    expect(addSession(d, h(14), null, c)).toBe(d);
  });

  it("edits a span's ends and type, refusing an invalid edit", () => {
    const c = ctx();
    let d = addBreak(empty(), "lunch", h(12), h(12, 30), c);
    d = updateSpan(d, "break", "id1", { end: h(13), typeId: "coffee" }, c);
    expect(d.breaks[0]).toEqual({
      id: "id1",
      typeId: "coffee",
      start: h(12),
      end: h(13),
    });
    expect(updateSpan(d, "break", "id1", { start: h(14) }, c)).toBe(d);
    expect(updateSpan(d, "break", "nope", { start: h(1) }, c)).toBe(d);
  });

  it("removes a span by kind and id", () => {
    const c = ctx();
    let d = addBreak(empty(), "lunch", h(12), h(12, 30), c);
    d = addSession(d, h(8), h(17), c);
    expect(removeSpan(d, "session", "id1", c)).toBe(d);
    d = removeSpan(d, "break", "id1", c);
    expect(d.breaks).toEqual([]);
    expect(d.sessions).toHaveLength(1);
  });
});

describe("isValidSpan", () => {
  it("accepts an open end and an overnight end, rejects the rest", () => {
    expect(isValidSpan(h(8), null)).toBe(true);
    expect(isValidSpan(h(22), h(26))).toBe(true);
    expect(isValidSpan(h(8), h(8))).toBe(false);
    expect(isValidSpan(-1, h(8))).toBe(false);
    expect(isValidSpan(h(8), h(50))).toBe(false);
    expect(isValidSpan(Number.NaN, null)).toBe(false);
  });
});

// A break is written down with the end its kind is assumed to have, so it is
// a record from the moment it starts and a *guess* until it is corrected.
describe("taking a break", () => {
  it("writes the assumed end down with the start", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = takeBreak(d, "lunch", h(12), 30 * 60, c);
    expect(d.breaks).toEqual([
      { id: "id2", typeId: "lunch", start: h(12), end: h(12, 30) },
    ]);
    // Ten minutes in, the day knows it is on a break — and knows when it is
    // meant to be over.
    const t = dayTotals(d, acme, h(12, 10));
    expect(t.state).toBe("break");
    expect(t.currentBreak?.end).toBe(h(12, 30));
    // …and the ten minutes taken so far are the only ten it has taken.
    expect(t.worked).toBe(h(4));
  });

  it("ends early when you are back before the assumed end", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = takeBreak(d, "lunch", h(12), 30 * 60, c);
    d = endBreak(d, h(12, 12), c);
    expect(d.breaks[0]!.end).toBe(h(12, 12));
    expect(dayTotals(d, acme, h(13)).state).toBe("working");
  });

  it("drops a break ended in the second it started", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = takeBreak(d, "lunch", h(12), 30 * 60, c);
    d = endBreak(d, h(12), c);
    expect(d.breaks).toEqual([]);
  });

  it("drops the break it cut short when seconds of it are left", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = takeBreak(d, "lunch", h(12), 30 * 60, c);
    // The wrong pill, corrected three seconds later: one break, not two.
    d = takeBreak(d, "coffee", h(12) + 3, 15 * 60, c);
    expect(d.breaks).toEqual([
      { id: "id3", typeId: "coffee", start: h(12) + 3, end: h(12, 15) + 3 },
    ]);
  });

  it("leaving the office cuts an assumed end back to the door", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = takeBreak(d, "coffee", h(16, 50), 15 * 60, c);
    d = clockOut(d, h(17), c);
    expect(d.breaks[0]!.end).toBe(h(17));
  });

  it("gives a break of no stated length the shortest one there is", () => {
    const c = ctx();
    const d = clockIn(empty(), h(8), c);
    expect(takeBreak(d, "lunch", h(12), 0, c).breaks[0]!.end).toBe(h(12, 1));
  });
});

describe("moving an edge of the day", () => {
  // In at 08:00, lunch 12:00–12:30 with coding either side of it.
  const lunchDay = () =>
    day("2026-03-02", {
      sessions: [{ id: "s1", start: h(8), end: h(17) }],
      breaks: [{ id: "b1", typeId: "lunch", start: h(12), end: h(12, 30) }],
      activities: [
        { id: "a1", categoryId: "code", start: h(8), end: h(12) },
        { id: "a2", categoryId: "code", start: h(12, 30), end: h(17) },
      ],
    });

  it("pushes the next stretch along with the end it moved", () => {
    const d = moveBoundary(lunchDay(), h(12, 30), h(12, 40), ctx());
    expect(d.breaks[0]!.end).toBe(h(12, 40));
    expect(d.activities[1]!.start).toBe(h(12, 40));
    // Ten minutes of work became ten minutes of lunch; nothing else moved.
    expect(d.activities[0]).toEqual(lunchDay().activities[0]);
    expect(dayTotals(d, acme, h(23)).worked).toBe(h(8, 20));
  });

  it("pulls an end back the same way", () => {
    const d = moveBoundary(lunchDay(), h(12, 30), h(12, 10), ctx());
    expect(d.breaks[0]!.end).toBe(h(12, 10));
    expect(d.activities[1]!.start).toBe(h(12, 10));
    expect(dayTotals(d, acme, h(23)).worked).toBe(h(8, 50));
  });

  it("swallows a stretch the edge is pushed clean over", () => {
    let d = lunchDay();
    d = addBreak(d, "coffee", h(12, 35), h(12, 45), ctx());
    d = moveBoundary(d, h(12, 30), h(13), ctx());
    expect(d.breaks.map((b) => b.typeId)).toEqual(["lunch"]);
    expect(d.breaks[0]!.end).toBe(h(13));
  });

  it("leaves the day alone for a moment nothing meets at", () => {
    const d = lunchDay();
    expect(moveBoundary(d, h(9), h(9, 30), ctx())).toBe(d);
    expect(moveBoundary(d, h(12, 30), h(12, 30), ctx())).toBe(d);
    expect(moveBoundary(d, h(12, 30), -60, ctx())).toBe(d);
  });

  it("refuses a move that would invert the session", () => {
    const d = lunchDay();
    expect(moveBoundary(d, h(17), h(7), ctx())).toBe(d);
  });

  // The two mistakes the timeline is for, each fixed on the stretch it was
  // made on: its start and then its end.

  it("moves the arrival of a day started late, while it runs", () => {
    const c = ctx();
    let d = setCategory(clockIn(empty(), h(17, 40), c), "code", h(17, 40), c);
    const now = h(17, 41);
    expect(boundaryRange(d, h(17, 40), now)).toEqual({
      min: 0,
      max: h(17, 40),
    });

    d = moveBoundary(d, h(17, 40), h(8), c);
    expect(d.sessions).toEqual([{ id: "id1", start: h(8), end: null }]);
    expect(d.activities[0]).toMatchObject({ start: h(8), end: null });
    expect(daySegments(d, now)).toMatchObject([
      { kind: "work", start: h(8), end: now, typeId: "code", running: true },
    ]);
    expect(dayTotals(d, acme, now).worked).toBe(h(9, 41));
  });

  it("moves both ends of a lunch pressed at the end of it", () => {
    const c = ctx();
    let d = takeBreak(clockIn(empty(), h(8), c), "lunch", h(12, 40), 1800, c);
    const now = h(12, 41);

    d = moveBoundary(d, h(12, 40), h(12), c);
    d = moveBoundary(d, h(13, 10), h(12, 30), c);
    expect(d.breaks[0]).toMatchObject({ start: h(12), end: h(12, 30) });
    expect(daySegments(d, now)).toMatchObject([
      { kind: "work", start: h(8), end: h(12) },
      { kind: "break", start: h(12), end: h(12, 30), typeId: "lunch" },
      { kind: "work", start: h(12, 30), end: now, running: true },
    ]);
    expect(dayTotals(d, acme, now).worked).toBe(h(4, 11));
  });
});

describe("correcting the arrival", () => {
  it("moves the start of the session the timer is counting", () => {
    const c = ctx();
    let d = clockIn(empty(), h(9), c);
    const session = latestSession(d)!;
    d = setSessionStart(d, session.id, h(8, 20), c);
    expect(d.sessions[0]!.start).toBe(h(8, 20));
    expect(dayTotals(d, acme, h(10)).worked).toBe(h(1, 40));
  });

  it("refuses an arrival that reaches back over the session before it", () => {
    const c = ctx();
    let d = addSession(empty(), h(8), h(12), c);
    d = addSession(d, h(13), h(17), c);
    const session = latestSession(d)!;
    expect(setSessionStart(d, session.id, h(11), c)).toBe(d);
    expect(setSessionStart(d, session.id, h(18), c)).toBe(d);
    expect(setSessionStart(d, "nope", h(9), c)).toBe(d);
  });
});
