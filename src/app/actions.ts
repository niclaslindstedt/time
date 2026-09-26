// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The edits a work day can take, as pure functions from a day to a new day.
// Every button on the Today screen and every row in the Log's editor lands
// here, so the invariants — one open session at a time, one open break, one
// open activity, a break only inside a session — are arithmetic with a test
// rather than branches inside a screen.
//
// `ctx` carries the two impure things an edit needs: fresh ids and the
// timestamp the edit is stamped with for the merge. Both are parameters so
// the tests can name them.

import type {
  ActivitySpan,
  BreakSpan,
  Seconds,
  Span,
  WorkDay,
} from "./types.ts";
import { DAY_SECONDS } from "./types.ts";

export type EditContext = {
  id: () => string;
  updatedAt: string;
};

/** The three lists a span can live in. */
export type SpanKind = "session" | "break" | "activity";

/** The latest moment a span may end: the end of the day after this one, so
 *  an overnight shift fits and a typo of 99:00 does not. */
export const MAX_SECONDS: Seconds = 2 * DAY_SECONDS;

/** Whether a start/end pair is a span that can be stored. An open end is
 *  allowed; a closed one must come after the start. */
export function isValidSpan(start: Seconds, end: Seconds | null): boolean {
  if (!Number.isFinite(start) || start < 0 || start > MAX_SECONDS) return false;
  if (end === null) return true;
  return Number.isFinite(end) && end > start && end <= MAX_SECONDS;
}

function stamp(day: WorkDay, ctx: EditContext, patch: Partial<WorkDay>) {
  return { ...day, ...patch, updatedAt: ctx.updatedAt };
}

function closeOpen<S extends Span>(spans: readonly S[], at: Seconds): S[] {
  return spans.map((s) => {
    if (s.end !== null) return s;
    // A span closed before it started is dropped rather than stored inverted:
    // it is a tap and its undo in the same second.
    return { ...s, end: Math.max(s.start, at) };
  });
}

/** Close what is going on at `at`: a span with no end, and one written to
 *  end later than `at` — a break booked until 12:30 that you came back from
 *  at 12:12 ended at 12:12. A span that has not started yet is left alone. */
function closeCurrent<S extends Span>(spans: readonly S[], at: Seconds): S[] {
  return spans.map((s) => {
    if (s.start > at) return s;
    if (s.end !== null && s.end <= at) return s;
    return { ...s, end: Math.max(s.start, at) };
  });
}

/** The shortest break the app will keep. Under this, ending one is a mis-tap
 *  — the wrong pill, corrected a second later — rather than a minute of
 *  lunch, and the record is better off without it. */
const MIN_BREAK_SECONDS: Seconds = 60;

/** The shortest stretch of presence the app will keep, and the longest gap
 *  between two that is no gap at all. A press on the face and the press that
 *  undoes it are a mis-tap rather than a minute of work, so stopping inside
 *  the minute drops the session; and starting again inside the minute of
 *  having stopped picks the last one back up rather than opening a second,
 *  because a watch stopped and restarted in the same breath was never really
 *  stopped. */
const MIN_SESSION_SECONDS: Seconds = 60;

/** Close the break going on at `at`, dropping it when that leaves less than
 *  a minute of it. Breaks that had already ended, and any that have not
 *  started, are passed through untouched — a short break somebody typed into
 *  the Log on purpose is theirs to keep. */
function closeBreaks(breaks: readonly BreakSpan[], at: Seconds): BreakSpan[] {
  const out: BreakSpan[] = [];
  for (const b of breaks) {
    if (b.start > at || (b.end !== null && b.end <= at)) {
      out.push(b);
    } else if (at - b.start >= MIN_BREAK_SECONDS) {
      out.push({ ...b, end: at });
    }
  }
  return out;
}

function dropEmpty<S extends Span>(spans: readonly S[]): S[] {
  return spans.filter((s) => s.end === null || s.end > s.start);
}

/** The session `at` is close enough behind to be the same one: the last to
 *  have ended, less than a minute ago. Null when the nearest one is further
 *  back than that, or when the day has none. */
function resumable(sessions: readonly Span[], at: Seconds): Span | null {
  let best: Span | null = null;
  for (const s of sessions) {
    if (s.end === null || s.end > at || at - s.end >= MIN_SESSION_SECONDS) {
      continue;
    }
    if (!best || s.end! > best.end!) best = s;
  }
  return best;
}

/** Put back the kind of work the clock-out cut off at `at`, so a session
 *  picked back up carries on with what it was doing rather than turning into
 *  uncategorised time. Left alone if something is already running. */
function reopenActivity(
  activities: readonly ActivitySpan[],
  at: Seconds,
): ActivitySpan[] {
  const out = [...activities];
  if (out.some((a) => a.end === null)) return out;
  let index = -1;
  for (let i = 0; i < out.length; i++) if (out[i]!.end === at) index = i;
  if (index === -1) return out;
  out[index] = { ...out[index]!, end: null };
  return out;
}

/** Start working. A no-op while a session is already open.
 *
 *  Stopping and starting again inside a minute is the same stretch of the
 *  day, not two: the session that just ended is reopened — the gap with it —
 *  and the kind of work it was cut off in the middle of starts again. */
export function clockIn(day: WorkDay, at: Seconds, ctx: EditContext): WorkDay {
  if (day.sessions.some((s) => s.end === null)) return day;
  const again = resumable(day.sessions, at);
  if (again) {
    return stamp(day, ctx, {
      sessions: day.sessions.map((s) =>
        s.id === again.id ? { ...s, end: null } : s,
      ),
      activities: reopenActivity(day.activities, again.end!),
    });
  }
  return stamp(day, ctx, {
    sessions: [...day.sessions, { id: ctx.id(), start: at, end: null }],
  });
}

/** Stop working. Closes the running session, and with it whatever break
 *  or activity was running — nothing runs once the work has stopped.
 *
 *  A session stopped less than a minute after it started is dropped instead,
 *  along with whatever was begun inside it: that is a press on the face and
 *  the press that undoes it, and the day is better off without the minute. */
export function clockOut(day: WorkDay, at: Seconds, ctx: EditContext): WorkDay {
  const open = day.sessions.find((s) => s.end === null);
  if (!open) return day;
  if (at - open.start < MIN_SESSION_SECONDS) {
    const outside = (s: Span) => s.start < open.start;
    return stamp(day, ctx, {
      sessions: day.sessions.filter((s) => s.id !== open.id),
      breaks: closeBreaks(day.breaks.filter(outside), at),
      activities: dropEmpty(closeCurrent(day.activities.filter(outside), at)),
    });
  }
  return stamp(day, ctx, {
    sessions: dropEmpty(closeOpen(day.sessions, at)),
    breaks: closeBreaks(day.breaks, at),
    activities: dropEmpty(closeCurrent(day.activities, at)),
  });
}

/**
 * Take a break of a kind, now. It stays open until it is ended — the pill
 * pressed again, the face pressed, or another break taken — however long
 * that is. The length its kind usually takes is what the dial expects of it
 * (`breakDue`), and never a stop: a coffee that ran to twenty-five minutes
 * was twenty-five minutes of coffee, and a break that cut itself off at
 * fifteen would have booked the other ten as work nobody did.
 *
 * Requires an open session — a break is a pause inside presence. A break
 * already going on is ended here, so a coffee during lunch is two breaks.
 */
export function takeBreak(
  day: WorkDay,
  typeId: string,
  at: Seconds,
  ctx: EditContext,
): WorkDay {
  if (!day.sessions.some((s) => s.end === null)) return day;
  if (!isValidSpan(at, null)) return day;
  return stamp(day, ctx, {
    breaks: [
      ...closeBreaks(day.breaks, at),
      { id: ctx.id(), typeId, start: at, end: null },
    ],
  });
}

/** End the break going on at `at` — "I'm back". A break that ends less than
 *  a minute after it started is dropped: that is a tap and its undo, or the
 *  wrong pill. */
export function endBreak(day: WorkDay, at: Seconds, ctx: EditContext): WorkDay {
  if (
    !day.breaks.some((b) => b.start <= at && (b.end === null || at < b.end))
  ) {
    return day;
  }
  return stamp(day, ctx, { breaks: closeBreaks(day.breaks, at) });
}

/** Say what the work is from now on: close the running activity and start
 *  one of `categoryId`, or just close it when `categoryId` is null. Choosing
 *  the category already running changes nothing. Requires an open session. */
export function setCategory(
  day: WorkDay,
  categoryId: string | null,
  at: Seconds,
  ctx: EditContext,
): WorkDay {
  if (!day.sessions.some((s) => s.end === null)) return day;
  const open = day.activities.find((a) => a.end === null);
  if ((open?.categoryId ?? null) === categoryId) return day;
  const closed = dropEmpty(closeOpen(day.activities, at));
  return stamp(day, ctx, {
    activities:
      categoryId === null
        ? closed
        : [...closed, { id: ctx.id(), categoryId, start: at, end: null }],
  });
}

/** Add a break after the fact, with both ends known. Rejected when the pair
 *  is not a span. */
export function addBreak(
  day: WorkDay,
  typeId: string,
  start: Seconds,
  end: Seconds,
  ctx: EditContext,
): WorkDay {
  if (!isValidSpan(start, end)) return day;
  return stamp(day, ctx, {
    breaks: [...day.breaks, { id: ctx.id(), typeId, start, end }],
  });
}

/** Add a session after the fact — a morning you forgot to clock in for. */
export function addSession(
  day: WorkDay,
  start: Seconds,
  end: Seconds | null,
  ctx: EditContext,
): WorkDay {
  if (!isValidSpan(start, end)) return day;
  if (end === null && day.sessions.some((s) => s.end === null)) return day;
  return stamp(day, ctx, {
    sessions: [...day.sessions, { id: ctx.id(), start, end }],
  });
}

/** Add an activity after the fact. */
export function addActivity(
  day: WorkDay,
  categoryId: string,
  start: Seconds,
  end: Seconds | null,
  ctx: EditContext,
): WorkDay {
  if (!isValidSpan(start, end)) return day;
  if (end === null && day.activities.some((a) => a.end === null)) return day;
  return stamp(day, ctx, {
    activities: [...day.activities, { id: ctx.id(), categoryId, start, end }],
  });
}

/** Move a span's ends (and, for a break or activity, its type). An edit that
 *  would make the span invalid is refused and the day comes back unchanged,
 *  so a form never has to decide what a negative break means. */
export function updateSpan(
  day: WorkDay,
  kind: SpanKind,
  id: string,
  patch: { start?: Seconds; end?: Seconds | null; typeId?: string },
  ctx: EditContext,
): WorkDay {
  const apply = <S extends Span>(spans: readonly S[]): S[] | null => {
    const index = spans.findIndex((s) => s.id === id);
    if (index === -1) return null;
    const current = spans[index]!;
    const next: S = {
      ...current,
      start: patch.start ?? current.start,
      end: patch.end === undefined ? current.end : patch.end,
    };
    if (!isValidSpan(next.start, next.end)) return null;
    // Only one span of a kind may be open; reopening a second is refused.
    if (next.end === null && spans.some((s) => s.id !== id && s.end === null)) {
      return null;
    }
    const out = [...spans];
    out[index] = next;
    return out;
  };

  if (kind === "session") {
    const sessions = apply(day.sessions);
    return sessions ? stamp(day, ctx, { sessions }) : day;
  }
  if (kind === "break") {
    const breaks = apply(day.breaks);
    if (!breaks) return day;
    if (patch.typeId !== undefined) {
      const index = breaks.findIndex((b) => b.id === id);
      breaks[index] = { ...breaks[index]!, typeId: patch.typeId };
    }
    return stamp(day, ctx, { breaks });
  }
  const activities = apply(day.activities);
  if (!activities) return day;
  if (patch.typeId !== undefined) {
    const index = activities.findIndex((a) => a.id === id);
    activities[index] = { ...activities[index]!, categoryId: patch.typeId };
  }
  return stamp(day, ctx, { activities });
}

/** Remove a span. */
export function removeSpan(
  day: WorkDay,
  kind: SpanKind,
  id: string,
  ctx: EditContext,
): WorkDay {
  const without = <S extends Span>(spans: readonly S[]) =>
    spans.filter((s) => s.id !== id);
  if (kind === "session") {
    if (!day.sessions.some((s) => s.id === id)) return day;
    return stamp(day, ctx, { sessions: without(day.sessions) });
  }
  if (kind === "break") {
    if (!day.breaks.some((b) => b.id === id)) return day;
    return stamp(day, ctx, { breaks: without(day.breaks) as BreakSpan[] });
  }
  if (!day.activities.some((a) => a.id === id)) return day;
  return stamp(day, ctx, {
    activities: without(day.activities) as ActivitySpan[],
  });
}

/** The session the Today screen's timer is counting: the open one, or the
 *  last one to have started on a day already left. Null on an empty day. */
export function latestSession(day: WorkDay): Span | null {
  let latest: Span | null = null;
  for (const s of day.sessions) {
    if (!latest || s.start > latest.start) latest = s;
  }
  return latest;
}

/**
 * Move when a session began — "I actually got in at ten to eight", tapped on
 * the timer once the morning has run away. Refused when the new start would
 * reach back over an earlier session of the same day, or past this one's own
 * end: an arrival that swallows the session before it is a typo, not a
 * correction.
 */
export function setSessionStart(
  day: WorkDay,
  id: string,
  start: Seconds,
  ctx: EditContext,
): WorkDay {
  const session = day.sessions.find((s) => s.id === id);
  if (!session) return day;
  for (const other of day.sessions) {
    if (other.id === id) continue;
    const end = other.end ?? other.start;
    if (other.start < session.start && start < end) return day;
  }
  return updateSpan(day, "session", id, { start }, ctx);
}

/**
 * Move the moment two stretches of the day meet — the end of the break and
 * the start of the work after it are one edge, so pushing a lunch's end from
 * 12:10 to 12:20 starts the coding at 12:20 rather than leaving ten minutes
 * of nobody-knows-what between them.
 *
 * Everything that starts or ends at `at` moves to `to`. Moving the edge
 * forward also drags along anything that started inside the stretch it
 * swallows, and drops what it swallowed whole — that stretch did not happen.
 * The edit is refused outright if it would leave a session inverted; presence
 * is corrected on the Log, where both of its ends are visible.
 *
 * The time under a moved edge is an estimate, and says so: the work either
 * side of a break was never timed to the second anyway.
 */
export function moveBoundary(
  day: WorkDay,
  at: Seconds,
  to: Seconds,
  ctx: EditContext,
): WorkDay {
  if (!Number.isFinite(to) || to < 0 || to > MAX_SECONDS || to === at) {
    return day;
  }
  const touches = (spans: readonly Span[]) =>
    spans.some((s) => s.start === at || s.end === at);
  if (
    !touches(day.sessions) &&
    !touches(day.breaks) &&
    !touches(day.activities)
  ) {
    return day;
  }

  const moved = <S extends Span>(span: S): S => {
    let start = span.start === at ? to : span.start;
    let end = span.end === at ? to : span.end;
    if (to > at) {
      if (start > at && start < to) start = to;
      if (end !== null && end > at && end < to) end = to;
    }
    return { ...span, start, end };
  };
  const swallowed = (span: Span) => span.end !== null && span.end <= span.start;

  const sessions = day.sessions.map(moved);
  if (sessions.some(swallowed)) return day;
  return stamp(day, ctx, {
    sessions,
    breaks: day.breaks.map(moved).filter((b) => !swallowed(b)),
    activities: day.activities.map(moved).filter((a) => !swallowed(a)),
  });
}
