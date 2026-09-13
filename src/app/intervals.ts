// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Interval arithmetic over closed-open `[start, end)` stretches of seconds.
// The day derivation is a handful of set operations — presence minus breaks,
// activities within presence — and they are all here, pure, so `day.ts` reads
// as the rule rather than as loops.

import type { Seconds } from "./types.ts";

export type Interval = { start: Seconds; end: Seconds };

/** Seconds covered by an interval; zero for an empty or inverted one. */
export function length(i: Interval): Seconds {
  return Math.max(0, i.end - i.start);
}

/** Seconds covered by a list of intervals, which are assumed disjoint. */
export function total(intervals: readonly Interval[]): Seconds {
  return intervals.reduce((sum, i) => sum + length(i), 0);
}

/** Sort and merge overlapping or touching intervals into disjoint ones. */
export function union(intervals: readonly Interval[]): Interval[] {
  const sorted = intervals
    .filter((i) => i.end > i.start)
    .map((i) => ({ ...i }))
    .sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) {
      last.end = Math.max(last.end, i.end);
    } else {
      out.push(i);
    }
  }
  return out;
}

/** The parts of `a` that also lie inside some interval of `b`. */
export function intersect(
  a: readonly Interval[],
  b: readonly Interval[],
): Interval[] {
  const out: Interval[] = [];
  const bs = union(b);
  for (const x of union(a)) {
    for (const y of bs) {
      const start = Math.max(x.start, y.start);
      const end = Math.min(x.end, y.end);
      if (end > start) out.push({ start, end });
    }
  }
  return union(out);
}

/** The parts of `a` that lie outside every interval of `b`. */
export function subtract(
  a: readonly Interval[],
  b: readonly Interval[],
): Interval[] {
  const bs = union(b);
  const out: Interval[] = [];
  for (const x of union(a)) {
    let cursor = x.start;
    for (const y of bs) {
      if (y.end <= cursor) continue;
      if (y.start >= x.end) break;
      if (y.start > cursor) out.push({ start: cursor, end: y.start });
      cursor = Math.max(cursor, y.end);
    }
    if (cursor < x.end) out.push({ start: cursor, end: x.end });
  }
  return out;
}

/** Whether a moment falls inside any of the intervals. */
export function contains(intervals: readonly Interval[], at: Seconds): boolean {
  return intervals.some((i) => at >= i.start && at < i.end);
}
