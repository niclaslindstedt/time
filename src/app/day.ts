// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The derivation: a work day's spans → the numbers the screens show. Pure and
// clock-free — `now` is a parameter, the moment on the day's own clock the
// open spans are read up to — so the tests pin real times and the Today
// screen re-derives once a second by passing a new one.
//
// The rules, in order:
//
//   presence  = the union of the sessions
//   breaks    = the union of the break spans, inside presence
//   worked    = presence − breaks
//   category  = its activity spans ∩ worked
//
// Breaks carve time out; activities only label what is left. A break logged
// outside any session counts for nothing, and an activity outside any session
// counts for nothing — presence is the one claim of time, and the other two
// lists can only describe it.

import { targetSeconds } from "./employer.ts";
import {
  contains,
  intersect,
  subtract,
  total,
  union,
  type Interval,
} from "./intervals.ts";
import {
  DAY_SECONDS,
  type BreakSpan,
  type Employer,
  type Seconds,
  type Span,
  type WorkDay,
} from "./types.ts";

/** What the day is doing at `now`. */
export type DayState = "out" | "working" | "break";

export type DayTotals = {
  /** Seconds inside a session. */
  presence: Seconds;
  /** Presence minus breaks — the number the timer shows. */
  worked: Seconds;
  /** Break time inside presence, by break type id. */
  breaks: Record<string, Seconds>;
  breakTotal: Seconds;
  /** Worked time by category id. */
  categories: Record<string, Seconds>;
  /** Worked time no activity labelled. */
  uncategorised: Seconds;
  state: DayState;
  /** The running session, break and activity, if any. */
  openSession: Span | null;
  openBreak: BreakSpan | null;
  /** The category the running activity names, or null while uncategorised. */
  currentCategoryId: string | null;
  /** First clock-in and last clock-out of the day; the latter null while a
   *  session is still open. */
  firstIn: Seconds | null;
  lastOut: Seconds | null;
};

/** A span read up to `now`: closed spans as they are, an open one ending at
 *  `now`. Null when there is nothing to count yet. */
export function clip(span: Span, now: Seconds): Interval | null {
  const end = span.end ?? now;
  if (end <= span.start) return null;
  return { start: span.start, end };
}

function clipAll<S extends Span>(spans: readonly S[], now: Seconds) {
  const out: (Interval & { span: S })[] = [];
  for (const span of spans) {
    const i = clip(span, now);
    if (i) out.push({ ...i, span });
  }
  return out;
}

/** The moment "up to which" a day that is not today is read: its own
 *  midnight, so a session nobody closed still ends. */
export const END_OF_DAY: Seconds = DAY_SECONDS;

/** Presence as disjoint intervals. */
export function presenceIntervals(day: WorkDay, now: Seconds): Interval[] {
  return union(clipAll(day.sessions, now));
}

/** Break intervals inside presence, each still knowing its type. */
export function breakIntervals(
  day: WorkDay,
  now: Seconds,
): (Interval & { typeId: string })[] {
  const presence = presenceIntervals(day, now);
  const out: (Interval & { typeId: string })[] = [];
  for (const b of clipAll(day.breaks, now)) {
    for (const i of intersect([b], presence)) {
      out.push({ ...i, typeId: b.span.typeId });
    }
  }
  return out;
}

/** Worked intervals — presence with the breaks taken out. */
export function workedIntervals(day: WorkDay, now: Seconds): Interval[] {
  return subtract(presenceIntervals(day, now), clipAll(day.breaks, now));
}

/** Worked intervals labelled by category, for the clock's arcs. */
export function activityIntervals(
  day: WorkDay,
  now: Seconds,
): (Interval & { categoryId: string })[] {
  const worked = workedIntervals(day, now);
  const out: (Interval & { categoryId: string })[] = [];
  for (const a of clipAll(day.activities, now)) {
    for (const i of intersect([a], worked)) {
      out.push({ ...i, categoryId: a.span.categoryId });
    }
  }
  return out;
}

/** Every number about a day, read up to `now`. */
export function dayTotals(day: WorkDay, now: Seconds): DayTotals {
  const presence = presenceIntervals(day, now);
  const worked = workedIntervals(day, now);

  const breaks: Record<string, Seconds> = {};
  for (const b of breakIntervals(day, now)) {
    breaks[b.typeId] = (breaks[b.typeId] ?? 0) + (b.end - b.start);
  }
  const breakTotal = Object.values(breaks).reduce((a, b) => a + b, 0);

  const categories: Record<string, Seconds> = {};
  for (const a of activityIntervals(day, now)) {
    categories[a.categoryId] =
      (categories[a.categoryId] ?? 0) + (a.end - a.start);
  }
  const labelled = Object.values(categories).reduce((a, b) => a + b, 0);
  const workedTotal = total(worked);

  const openSession = day.sessions.find((s) => s.end === null) ?? null;
  const openBreak = day.breaks.find((b) => b.end === null) ?? null;
  const openActivity = day.activities.find((a) => a.end === null) ?? null;

  // The state follows what is *open*, not what the clipped intervals say —
  // a session opened a moment ago covers zero seconds and is still "in".
  const state: DayState = !openSession
    ? "out"
    : openBreak
      ? "break"
      : "working";

  const starts = day.sessions.map((s) => s.start);
  const firstIn = starts.length ? Math.min(...starts) : null;
  const lastOut =
    openSession || day.sessions.length === 0
      ? null
      : Math.max(...day.sessions.map((s) => s.end ?? 0));

  return {
    presence: total(presence),
    worked: workedTotal,
    breaks,
    breakTotal,
    categories,
    uncategorised: Math.max(0, workedTotal - labelled),
    state,
    openSession,
    openBreak,
    currentCategoryId: openActivity?.categoryId ?? null,
    firstIn,
    lastOut,
  };
}

/** Whether `at` falls inside presence. */
export function isPresentAt(day: WorkDay, at: Seconds, now: Seconds) {
  return contains(presenceIntervals(day, now), at);
}

/** How far through the day's target the worked time is, as a fraction.
 *  Unclamped above one — a day past its target is overtime, and the Today
 *  screen says 112% rather than pretending the day stopped at 100. */
export function progress(worked: Seconds, employer: Employer): number {
  const target = targetSeconds(employer);
  return target > 0 ? worked / target : 0;
}
