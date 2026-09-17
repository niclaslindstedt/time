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

import { targetSeconds } from "./project.ts";
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
  type Project,
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
  /** A break nobody wrote an end for — one still running in the old sense. */
  openBreak: BreakSpan | null;
  /** The break `now` falls inside: the open one, or the one whose assumed
   *  end has not come yet. This is what "on a break" means — a break taken
   *  with the length its kind is assumed to take is a break you are on until
   *  that end passes, not one left hanging. */
  currentBreak: BreakSpan | null;
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
  const currentBreak = breakAt(day, now);
  const openActivity = day.activities.find((a) => a.end === null) ?? null;

  // The state follows what is *open*, not what the clipped intervals say —
  // a session opened a moment ago covers zero seconds and is still "in".
  const state: DayState = !openSession
    ? "out"
    : currentBreak
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
    currentBreak,
    currentCategoryId: openActivity?.categoryId ?? null,
    firstIn,
    lastOut,
  };
}

/** The break `at` falls inside: one with no end, or one whose written end
 *  has not been reached. Null when nothing is going on. */
export function breakAt(day: WorkDay, at: Seconds): BreakSpan | null {
  return (
    day.breaks.find(
      (b) =>
        (b.end === null && b.start <= at) || (b.start <= at && at < b.end!),
    ) ?? null
  );
}

/** How far ahead of `now` the day is drawn. Normally not at all — but a break
 *  is written down with the end its kind is assumed to have, so at 12:10 of a
 *  lunch booked until 12:30 the day already reaches twenty minutes into the
 *  future. The totals never read past `now` (a minute not yet worked is not
 *  worked); this is only how far the *shape* of the day is known. */
export function horizon(day: WorkDay, now: Seconds): Seconds {
  if (!day.sessions.some((s) => s.end === null)) return now;
  let end = now;
  for (const b of day.breaks) {
    if (b.end !== null && b.start <= now && b.end > end) end = b.end;
  }
  return end;
}

/** One stretch of the day: either worked time (of one kind of work, or of
 *  none) or a break of one kind. Consecutive segments meet — the end of one
 *  is the start of the next — which is what makes an end movable: pushing a
 *  break's end later starts the work after it later too. */
export type DaySegment = {
  kind: "work" | "break";
  start: Seconds;
  end: Seconds;
  /** The break type for a break, the category for labelled work, null for
   *  work no activity named. */
  typeId: string | null;
  /** True for the stretch `now` falls in. */
  current: boolean;
  /** True while the stretch has no end yet — the one the timer is counting. */
  running: boolean;
};

/**
 * The day as the list of stretches it is made of, in order: at work, then
 * lunch, then at work again. Derived from the same intervals every other
 * number is (see the header), so the timeline and the clock can never
 * disagree with the timer.
 *
 * Read out to `horizon` rather than to `now`, so a break taken with an
 * assumed end appears with that end rather than being cut off at the second
 * it is being read.
 */
export function daySegments(day: WorkDay, now: Seconds): DaySegment[] {
  const upTo = horizon(day, now);
  const presence = presenceIntervals(day, upTo);
  const breaks = breakIntervals(day, upTo);
  const activities = activityIntervals(day, upTo);
  const open = day.sessions.some((s) => s.end === null);

  const out: DaySegment[] = [];
  for (const p of presence) {
    const cuts = new Set<Seconds>([p.start, p.end]);
    for (const i of [...breaks, ...activities]) {
      if (i.start > p.start && i.start < p.end) cuts.add(i.start);
      if (i.end > p.start && i.end < p.end) cuts.add(i.end);
    }
    for (const [start, end] of pairs([...cuts].sort((a, b) => a - b))) {
      const mid = (start + end) / 2;
      const b = breaks.find((i) => i.start <= mid && mid < i.end);
      const a = b
        ? null
        : activities.find((i) => i.start <= mid && mid < i.end);
      const kind = b ? "break" : "work";
      const typeId = b ? b.typeId : (a?.categoryId ?? null);
      const last = out[out.length - 1];
      // Two cuts with nothing between them — an activity that starts where a
      // break ends puts one in — are one stretch, not two.
      if (
        last &&
        last.end === start &&
        last.kind === kind &&
        last.typeId === typeId
      ) {
        last.end = end;
      } else {
        out.push({ kind, start, end, typeId, current: false, running: false });
      }
    }
  }

  for (const s of out) s.current = s.start <= now && now < s.end;
  const last = out[out.length - 1];
  if (last && open && last.end >= now) {
    last.current = true;
    last.running = last.end <= now;
  }
  return out;
}

function pairs(points: readonly Seconds[]): [Seconds, Seconds][] {
  const out: [Seconds, Seconds][] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    out.push([points[i]!, points[i + 1]!]);
  }
  return out;
}

/** How far a moment two stretches meet at may be moved: up to the moment
 *  before it and the one after, a minute clear of each so no stretch is
 *  squeezed out of existence. Null when `at` is not one of the day's edges. */
export function boundaryRange(
  day: WorkDay,
  at: Seconds,
  now: Seconds,
): { min: Seconds; max: Seconds } | null {
  const edges = new Set<Seconds>();
  for (const s of daySegments(day, now)) {
    edges.add(s.start);
    edges.add(s.end);
  }
  if (!edges.has(at)) return null;
  const sorted = [...edges].sort((a, b) => a - b);
  const index = sorted.indexOf(at);
  const before = sorted[index - 1];
  const after = sorted[index + 1];
  return {
    min: before === undefined ? 0 : before + 60,
    max: after === undefined ? 2 * DAY_SECONDS : after - 60,
  };
}

/** Whether `at` falls inside presence. */
export function isPresentAt(day: WorkDay, at: Seconds, now: Seconds) {
  return contains(presenceIntervals(day, now), at);
}

/** How far through the day's target the worked time is, as a fraction.
 *  Unclamped above one — a day past its target is overtime, and the Today
 *  screen says 112% rather than pretending the day stopped at 100. */
export function progress(worked: Seconds, project: Project): number {
  const target = targetSeconds(project);
  return target > 0 ? worked / target : 0;
}
