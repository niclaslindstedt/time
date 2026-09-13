// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  addBreak,
  addBreakEndingAt,
  addSession,
  clockIn,
  clockOut,
  endBreak,
  isValidSpan,
  removeSpan,
  setCategory,
  startBreak,
  updateSpan,
} from "../src/app/actions.ts";
import { dayTotals } from "../src/app/day.ts";
import { STAMP, ctx, day, h } from "./fixtures/helpers.ts";

const empty = () =>
  day("2026-03-02", { updatedAt: "2020-01-01T00:00:00.000Z" });

describe("a day as it happens", () => {
  it("clocks in, takes lunch, switches category, clocks out", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    expect(d.sessions).toEqual([{ id: "id1", start: h(8), end: null }]);
    expect(d.updatedAt).toBe(STAMP);

    d = setCategory(d, "code", h(8), c);
    d = startBreak(d, "lunch", h(12), c);
    d = endBreak(d, h(12, 30), c);
    d = setCategory(d, "meet", h(14), c);
    d = clockOut(d, h(17), c);

    const t = dayTotals(d, h(23));
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
    d = startBreak(d, "coffee", h(10), c);
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
    expect(startBreak(d, "lunch", h(9), c)).toBe(d);
    expect(setCategory(d, "code", h(9), c)).toBe(d);
    expect(endBreak(d, h(9), c)).toBe(d);
  });

  it("switching break type ends the running break", () => {
    const c = ctx();
    let d = clockIn(empty(), h(8), c);
    d = startBreak(d, "lunch", h(12), c);
    d = startBreak(d, "coffee", h(12, 20), c);
    expect(d.breaks).toEqual([
      { id: "id2", typeId: "lunch", start: h(12), end: h(12, 20) },
      { id: "id3", typeId: "coffee", start: h(12, 20), end: null },
    ]);
    // The same type again is a no-op.
    expect(startBreak(d, "coffee", h(12, 25), c)).toBe(d);
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

  it("adds a break ending now of the type's default length", () => {
    const c = ctx();
    const d = addBreakEndingAt(empty(), "coffee", 15 * 60, h(15), c);
    expect(d.breaks[0]).toEqual({
      id: "id1",
      typeId: "coffee",
      start: h(14, 45),
      end: h(15),
    });
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
