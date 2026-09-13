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

function dropEmpty<S extends Span>(spans: readonly S[]): S[] {
  return spans.filter((s) => s.end === null || s.end > s.start);
}

/** Enter the office. A no-op while a session is already open. */
export function clockIn(day: WorkDay, at: Seconds, ctx: EditContext): WorkDay {
  if (day.sessions.some((s) => s.end === null)) return day;
  return stamp(day, ctx, {
    sessions: [...day.sessions, { id: ctx.id(), start: at, end: null }],
  });
}

/** Leave the office. Closes the running session, and with it whatever break
 *  or activity was running — nothing runs while nobody is there. */
export function clockOut(day: WorkDay, at: Seconds, ctx: EditContext): WorkDay {
  if (!day.sessions.some((s) => s.end === null)) return day;
  return stamp(day, ctx, {
    sessions: dropEmpty(closeOpen(day.sessions, at)),
    breaks: dropEmpty(closeOpen(day.breaks, at)),
    activities: dropEmpty(closeOpen(day.activities, at)),
  });
}

/** Start a break of a type. Requires an open session; a running break of
 *  another type is ended first, so a coffee after lunch is two breaks. */
export function startBreak(
  day: WorkDay,
  typeId: string,
  at: Seconds,
  ctx: EditContext,
): WorkDay {
  if (!day.sessions.some((s) => s.end === null)) return day;
  const open = day.breaks.find((b) => b.end === null);
  if (open?.typeId === typeId) return day;
  return stamp(day, ctx, {
    breaks: [
      ...dropEmpty(closeOpen(day.breaks, at)),
      { id: ctx.id(), typeId, start: at, end: null },
    ],
  });
}

/** End the running break. */
export function endBreak(day: WorkDay, at: Seconds, ctx: EditContext): WorkDay {
  if (!day.breaks.some((b) => b.end === null)) return day;
  return stamp(day, ctx, { breaks: dropEmpty(closeOpen(day.breaks, at)) });
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

/** "I just took a 30-minute lunch": a break of `seconds` ending at `at`. */
export function addBreakEndingAt(
  day: WorkDay,
  typeId: string,
  seconds: Seconds,
  at: Seconds,
  ctx: EditContext,
): WorkDay {
  return addBreak(day, typeId, Math.max(0, at - seconds), at, ctx);
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
