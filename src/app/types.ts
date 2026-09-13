// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The app's data model: the employers you work for, and one work day per
// employer per calendar day. Everything the Today clock, the Log and the
// Report screens show is derived from these at read time — nothing about a
// total, a balance or a percentage is stored, so correcting a break from last
// Tuesday moves every number downstream (see `day.ts` and `report.ts`).
//
// A work day is three lists of spans. `sessions` is presence — the stretches
// between entering the office and leaving it. `breaks` are the pauses inside
// that presence, each of a type the employer defines (lunch, coffee, a walk).
// `activities` say what kind of work was going on — meetings, coding — and
// are optional: a session with no activity is simply uncategorised work.
// Breaks carve time out of presence; activities only label it.

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

/**
 * A moment in a day, as seconds since the local midnight the day started
 * on. A span that runs past midnight simply has an end past `DAY_SECONDS`;
 * it still belongs to the day it began on, which is the day it is reported
 * under. Local and offset-free on purpose: a time report is about the clock
 * on the office wall, and a document that changed meaning when a phone
 * changed timezone would sync wrong between two devices set differently.
 */
export type Seconds = number;

/** One day, in `Seconds`. */
export const DAY_SECONDS = 86_400;

/** A weekday, `Date.getDay()` numbering: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A kind of break the employer's day allows for, with the length it is
 *  assumed to take when one is added after the fact without a stated end. */
export type BreakType = {
  id: string;
  name: string;
  defaultMinutes: number;
};

/** A kind of work — meetings, coding, support — used to label an activity
 *  so the Report screen can say where the hours went. */
export type WorkCategory = {
  id: string;
  name: string;
};

export type Employer = {
  id: string;
  name: string;
  /** The days a full working day is expected — what the report measures a
   *  day against, and what makes a Saturday of work overtime rather than a
   *  short day. */
  workDays: Weekday[];
  /** The target length of a working day, in hours. Fractions allowed. */
  hoursPerDay: number;
  breakTypes: BreakType[];
  categories: WorkCategory[];
  /** ISO timestamp of the last edit — the tiebreak when two devices edited
   *  the same employer between syncs (see `merge.ts`). */
  updatedAt: string;
};

/** A stretch of time. `end` is null while it is still running — the one
 *  thing on the Today screen the clock ticks against. */
export type Span = {
  id: string;
  start: Seconds;
  end: Seconds | null;
};

export type BreakSpan = Span & { typeId: string };

export type ActivitySpan = Span & { categoryId: string };

export type WorkDay = {
  /** The local calendar day the day's spans are measured from. */
  date: DayKey;
  employerId: string;
  /** Presence: in the office (or at the desk). */
  sessions: Span[];
  /** Pauses inside presence. Subtracted from it. */
  breaks: BreakSpan[];
  /** What the work was, while it was going on. A label over presence, never
   *  a claim of presence on its own. */
  activities: ActivitySpan[];
  updatedAt: string;
};

/** The persisted document — the whole app state, one JSON blob. Days are
 *  keyed by `dayKey()` so a day is an upsert and a screen is a map lookup. */
export type AppData = {
  /** Schema version; bumped by a migration step in `migrations.ts`. */
  version: number;
  employers: Record<string, Employer>;
  days: Record<string, WorkDay>;
};

/** The current document schema version. */
export const DOC_VERSION = 1;

/** The document a first run starts from. */
export function emptyDoc(): AppData {
  return { version: DOC_VERSION, employers: {}, days: {} };
}

/** The key a work day is filed under: date first, so the keys sort
 *  chronologically, then the employer, so two employers on one day are two
 *  days. */
export function dayKey(employerId: string, date: DayKey): string {
  return `${date}:${employerId}`;
}

/** A work day, or null when nothing has been logged for that employer on
 *  that date. */
export function dayFor(
  data: AppData,
  employerId: string,
  date: DayKey,
): WorkDay | null {
  return data.days[dayKey(employerId, date)] ?? null;
}

/** An empty day — what the Today screen edits before the first clock-in. */
export function blankDay(
  employerId: string,
  date: DayKey,
  now: string,
): WorkDay {
  return {
    date,
    employerId,
    sessions: [],
    breaks: [],
    activities: [],
    updatedAt: now,
  };
}

/** Every logged day for an employer in ascending date order. `DayKey` is
 *  `YYYY-MM-DD`, so a plain string sort is a date sort. */
export function sortedDays(data: AppData, employerId: string): WorkDay[] {
  return Object.values(data.days)
    .filter((day) => day.employerId === employerId)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Every employer, by name. */
export function employerList(data: AppData): Employer[] {
  return Object.values(data.employers).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/** Whether a day holds anything at all — the test for "has this day been
 *  logged", which is not the same as "was time worked". */
export function isEmptyDay(day: WorkDay): boolean {
  return (
    day.sessions.length === 0 &&
    day.breaks.length === 0 &&
    day.activities.length === 0
  );
}
