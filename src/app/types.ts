// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The app's data model: the projects you work on, and one work day per
// project per calendar day. Everything the Today clock, the Log and the
// Report screens show is derived from these at read time — nothing about a
// total, a balance or a percentage is stored, so correcting a break from last
// Tuesday moves every number downstream (see `day.ts` and `report.ts`).
//
// A work day is three lists of spans. `sessions` is presence — the stretches
// between starting work and stopping. `breaks` are the pauses inside
// that presence, each of a type the project defines (lunch, coffee, a walk).
// `activities` say what kind of work was going on — meetings, coding — and
// are optional: a session with no activity is simply uncategorised work.
// Breaks carve time out of presence; activities only label it.

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import type { CategoryColor, GlyphId } from "./kinds.ts";

/**
 * A moment in a day, as seconds since the local midnight the day started
 * on. A span that runs past midnight simply has an end past `DAY_SECONDS`;
 * it still belongs to the day it began on, which is the day it is reported
 * under. Local and offset-free on purpose: a time report is about the clock
 * on the wall where the work happens, and a document that changed meaning
 * when a phone changed timezone would sync wrong between two devices set
 * differently.
 */
export type Seconds = number;

/** One day, in `Seconds`. */
export const DAY_SECONDS = 86_400;

/** A weekday, `Date.getDay()` numbering: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * How much of a kind of break still counts as work time.
 *
 * A break carves time out of presence — that is what a break is — but not
 * every employer counts every one of them. A trip down the corridor is
 * usually still paid; an hour's lunch usually is not; and the common middle
 * case is a lunch of which the first half hour is paid and the rest is your
 * own. So: none of it, all of it, or the first `minutes` of it.
 *
 * The minutes are counted over the whole day rather than per break, which is
 * what makes them a rule rather than a loophole: a project that pays half an
 * hour of lunch pays half an hour of lunch whether it was taken in one
 * sitting or three.
 */
export type BreakCredit =
  { mode: "none" } | { mode: "all" } | { mode: "partial"; minutes: number };

/** What a kind of break counts for when nobody has said: nothing. Every
 *  break the app has ever subtracted goes on being subtracted, so turning a
 *  project's history into something else is a choice rather than an
 *  upgrade. */
export const DEFAULT_BREAK_CREDIT: BreakCredit = { mode: "none" };

/** A kind of break the project's day allows for, with the length it is
 *  assumed to take when one is added after the fact without a stated end. */
export type BreakType = {
  id: string;
  name: string;
  defaultMinutes: number;
  /** The mark it wears on the buttons and in the lists (see `kinds.ts`).
   *  Absent on a type from before there were glyphs, and on one nobody has
   *  chosen a mark for — the cup stands in. */
  glyph?: GlyphId;
  /** How much of a break of this kind still counts as work time. Absent on
   *  every document written before there was an answer, and absent means
   *  `DEFAULT_BREAK_CREDIT` — none of it, which is what a break has always
   *  counted for. */
  credit?: BreakCredit;
  /** Whether it gets a button of its own on the Today screen, or waits in
   *  the row's "…" with the rest. Absent means pinned, so a document written
   *  before there was a "…" shows exactly the buttons it always did — and a
   *  project that pins everything is byte for byte the project it was. Only
   *  "not pinned" is worth storing (see `storedPinned`). */
  pinned?: boolean;
};

/** A kind of work — meetings, coding, support — used to label an activity
 *  so the Report screen can say where the hours went. */
export type WorkCategory = {
  id: string;
  name: string;
  /** The mark it wears (see `kinds.ts`); the label stands in when absent. */
  glyph?: GlyphId;
  /** The hue it is drawn in — on the clock's ring, on its chip, in the
   *  report, and on its own glyph. Absent means the colour its position in
   *  the project's list gives it, which is what every kind of work had
   *  before one could be picked. */
  color?: CategoryColor;
  /** Whether it gets a button of its own on the Today screen, or waits in
   *  the row's "…" with the rest. Absent means pinned, so a document written
   *  before there was a "…" shows exactly the buttons it always did — and a
   *  project that pins everything is byte for byte the project it was. Only
   *  "not pinned" is worth storing (see `storedPinned`). */
  pinned?: boolean;
};

export type Project = {
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
   *  the same project between syncs (see `merge.ts`). */
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
  projectId: string;
  /** Presence: at work on the project. */
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
  projects: Record<string, Project>;
  days: Record<string, WorkDay>;
};

/** The current document schema version. */
export const DOC_VERSION = 2;

/** The document a first run starts from. */
export function emptyDoc(): AppData {
  return { version: DOC_VERSION, projects: {}, days: {} };
}

/** The key a work day is filed under: date first, so the keys sort
 *  chronologically, then the project, so two projects on one day are two
 *  days. */
export function dayKey(projectId: string, date: DayKey): string {
  return `${date}:${projectId}`;
}

/** A work day, or null when nothing has been logged for that project on
 *  that date. */
export function dayFor(
  data: AppData,
  projectId: string,
  date: DayKey,
): WorkDay | null {
  return data.days[dayKey(projectId, date)] ?? null;
}

/** An empty day — what the Today screen edits before the first clock-in. */
export function blankDay(
  projectId: string,
  date: DayKey,
  now: string,
): WorkDay {
  return {
    date,
    projectId,
    sessions: [],
    breaks: [],
    activities: [],
    updatedAt: now,
  };
}

/** Every logged day for a project in ascending date order. `DayKey` is
 *  `YYYY-MM-DD`, so a plain string sort is a date sort. */
export function sortedDays(data: AppData, projectId: string): WorkDay[] {
  return Object.values(data.days)
    .filter((day) => day.projectId === projectId)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Every project, by name. */
export function projectList(data: AppData): Project[] {
  return Object.values(data.projects).sort((a, b) =>
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
