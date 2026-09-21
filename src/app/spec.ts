// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The specification: a range of days, as the document that goes out with an
// invoice.
//
// It is a *reading* of the report and not a second one. Every figure here
// comes from `summarizeRange` and `daySegments` — the same fold the Report
// screen draws and the same stretches the Log lists — so a specification can
// never say seven and a half hours about a day the app says seven of. Nothing
// is stored: like every other total in this app the document is derived at the
// moment it is asked for (see "Derive, don't store" in the agent guide).
//
// What it adds is the shape an invoice wants, which the screens do not:
//
//   - Decimal hours beside the hours and minutes, because an invoice line is
//     a rate times a number and nobody multiplies by "7h 32m".
//   - Rounding, where the invoice is written in quarters of an hour rather
//     than in minutes. It is applied to the *day* and never to the range:
//     rounding a month up once is not the same arithmetic as rounding twenty
//     days up, and the day is the unit a timesheet is agreed in.
//   - A column that adds up. A decimal hour is rounded to the hundredth, and
//     a total that rounded the raw seconds would sometimes be a hundredth off
//     the column above it — which, on a document somebody is going to check
//     with a calculator, is the difference between a specification and an
//     argument. So the total is the sum of the rounded rows, and it agrees
//     with the column by construction.
//   - The day's stretches, for a specification that itemises rather than
//     summarises.
//
// Pure and clock-free: `today` and `now` are parameters, so a range that ends
// today reads up to this minute and the tests pin real times.

import { addDays, type DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { daySegments, type DaySegment } from "./day.ts";
import { readUpTo, summarizeDay, summarizeRange } from "./report.ts";
import { dayFor, type AppData, type Project, type Seconds } from "./types.ts";

/** One stretch of a day, as the itemised table lists it: at work (of a kind,
 *  or of none) or on a break of a kind. `daySegments`' own shape, kept to
 *  what a printed line needs. */
export type SpecSegment = {
  kind: "work" | "break";
  start: Seconds;
  end: Seconds;
  /** The break type or the kind of work; null for work nothing labelled. */
  typeId: string | null;
};

/** One row of the daily table. */
export type SpecDay = {
  date: DayKey;
  /** Whether the project expects a full day here — what makes a Saturday of
   *  work read as the exception it is. */
  expected: boolean;
  /** Whether anything at all was logged. */
  logged: boolean;
  target: Seconds;
  /** What was actually worked, to the second. */
  worked: Seconds;
  /** What the day is billed at: `worked`, rounded up to the next whole
   *  `rounding` minutes. The same as `worked` when nothing is rounded. */
  billed: Seconds;
  breakTotal: Seconds;
  /** Billed hours to the hundredth — what the column adds up. */
  hours: number;
  /** First clock-in and last clock-out. Null on a day with no session, and
   *  `lastOut` null while one is still running. */
  firstIn: Seconds | null;
  lastOut: Seconds | null;
  categories: Record<string, Seconds>;
  uncategorised: Seconds;
  segments: SpecSegment[];
};

/** A line of one of the two breakdown tables: a kind of work, a kind of
 *  break, the worked time no activity named, or — when the days are rounded —
 *  what the rounding added, so the table still adds up to the hours the
 *  document bills for. */
export type SpecAmount = {
  id: string | null;
  kind: "kind" | "unlabelled" | "rounding";
  seconds: Seconds;
  hours: number;
  /** Of the billed total, as a fraction. Zero when there is no total. */
  share: number;
};

export type SpecTotals = {
  /** What was worked, to the second, before any rounding. */
  worked: Seconds;
  /** The sum of the days' billed time — what the document's figures are. */
  billed: Seconds;
  /** The sum of the rows' decimal hours — the figure the column adds up
   *  to, and the one an invoice line is worked out from. */
  hours: number;
  breakTotal: Seconds;
  target: Seconds;
  balance: Seconds;
  /** Days with time on them, and days the project expected. */
  workedDays: number;
  expectedDays: number;
};

export type Specification = {
  projectId: string;
  projectName: string;
  from: DayKey;
  to: DayKey;
  /** Every day of the range that has something to say, in date order. */
  days: SpecDay[];
  categories: SpecAmount[];
  breaks: SpecAmount[];
  totals: SpecTotals;
  /** The minutes each day was rounded up to, or zero. Printed on the
   *  document, because a client handed a figure they cannot reconcile
   *  against the times beside it will ask — and should. */
  rounding: SpecRounding;
};

/** The steps a day may be billed in: not at all, or up to the next so many
 *  minutes. A tenth of an hour (six minutes) and a quarter are the two most
 *  rate cards are written in; the hour is for whoever bills in whole ones. */
export type SpecRounding = 0 | 5 | 6 | 10 | 15 | 30 | 60;

export const SPEC_ROUNDINGS: SpecRounding[] = [0, 5, 6, 10, 15, 30, 60];

/** The default: none. A minute worked is a minute reported until somebody
 *  says their invoice is written otherwise. */
export const DEFAULT_ROUNDING: SpecRounding = 0;

/** A stored value as one of the steps. */
export function clampRounding(value: unknown): SpecRounding {
  const minutes = Math.round(Number(value));
  return SPEC_ROUNDINGS.includes(minutes as SpecRounding)
    ? (minutes as SpecRounding)
    : DEFAULT_ROUNDING;
}

/**
 * A day's time, rounded *up* to the next whole `minutes`.
 *
 * Up and never to the nearest: rounding is a billing convention rather than a
 * measurement, and the convention is that a quarter of an hour begun is a
 * quarter of an hour billed. Five hours and seventeen minutes at a quarter is
 * five and a half hours.
 *
 * Nothing is still nothing — a day nobody worked does not become a quarter of
 * an hour — and an exact multiple stays where it is.
 */
export function roundUpTo(seconds: Seconds, minutes: SpecRounding): Seconds {
  if (minutes <= 0 || seconds <= 0) return Math.max(0, seconds);
  const step = minutes * 60;
  return Math.ceil(seconds / step) * step;
}

/** Seconds as decimal hours, to the hundredth — six minutes of a tenth, which
 *  is the grain every consultancy rate card in the world is quoted in. */
export function decimalHours(seconds: Seconds): number {
  return Math.round((Math.max(0, seconds) / 3600) * 100) / 100;
}

/** A sum of decimal hours, kept to the hundredth so adding a column of them
 *  cannot drift into a fifteenth decimal place of binary floating point. */
export function sumHours(values: readonly number[]): number {
  return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
}

function segmentsOf(segments: readonly DaySegment[]): SpecSegment[] {
  return segments.map((s) => ({
    kind: s.kind,
    start: s.start,
    end: s.end,
    typeId: s.typeId,
  }));
}

function amounts(
  totals: Record<string, Seconds>,
  order: readonly string[],
  billed: Seconds,
  uncategorised: Seconds,
  rounded: Seconds = 0,
): SpecAmount[] {
  const share = (seconds: Seconds) => (billed > 0 ? seconds / billed : 0);
  const out: SpecAmount[] = [];
  // The project's own order first, so two specifications of the same project
  // list its kinds of work the same way round.
  for (const id of order) {
    const seconds = totals[id] ?? 0;
    if (seconds > 0) {
      out.push({
        id,
        kind: "kind",
        seconds,
        hours: decimalHours(seconds),
        share: share(seconds),
      });
    }
  }
  // A kind the project has since deleted still holds time, and a
  // specification that quietly dropped it would not add up.
  for (const [id, seconds] of Object.entries(totals)) {
    if (!order.includes(id) && seconds > 0) {
      out.push({
        id,
        kind: "kind",
        seconds,
        hours: decimalHours(seconds),
        share: share(seconds),
      });
    }
  }
  if (uncategorised > 0) {
    out.push({
      id: null,
      kind: "unlabelled",
      seconds: uncategorised,
      hours: decimalHours(uncategorised),
      share: share(uncategorised),
    });
  }
  // What the rounding added, as a line of its own. Without it the kinds of
  // work would add up to the hours worked while the table's total said the
  // hours billed, and the two would sit minutes apart with nothing on the
  // page to say why.
  if (rounded > 0) {
    out.push({
      id: null,
      kind: "rounding",
      seconds: rounded,
      hours: decimalHours(rounded),
      share: share(rounded),
    });
  }
  return out;
}

/** What a reading of the range is asked for beyond the range itself. */
export type SpecOptions = {
  /**
   * Whether a day the project expected but nobody worked is listed. Off, the
   * table is the days that happened; on, it is the calendar, and an absence
   * shows as the empty row it was — which is what a client paying for a month
   * of somebody's time usually wants to see.
   */
  blanks?: boolean;
  /** The minutes each day is billed up to. See `roundUpTo`. */
  rounding?: SpecRounding;
};

/** The specification for one project over one range. */
export function specification(
  data: AppData,
  project: Project,
  from: DayKey,
  to: DayKey,
  today: DayKey,
  now: Seconds,
  options: SpecOptions = {},
): Specification {
  const blanks = options.blanks ?? false;
  const rounding = options.rounding ?? DEFAULT_ROUNDING;
  const range = summarizeRange(data, project, from, to, today, now);
  const days: SpecDay[] = [];

  for (let date = from; date <= to; date = addDays(date, 1)) {
    const upTo = readUpTo(date, today, now);
    const stored = dayFor(data, project.id, date);
    const summary = summarizeDay(stored, project, date, upTo, date === today);
    const show =
      summary.worked > 0 || summary.logged || (blanks && summary.expected);
    if (show) {
      const totals = stored ? daySegments(stored, upTo) : [];
      const billed = roundUpTo(summary.worked, rounding);
      days.push({
        date,
        expected: summary.expected,
        logged: summary.logged,
        target: summary.target,
        worked: summary.worked,
        billed,
        breakTotal: summary.breakTotal,
        hours: decimalHours(billed),
        firstIn: firstInOf(stored, upTo),
        lastOut: lastOutOf(stored, upTo),
        categories: summary.categories,
        uncategorised: summary.uncategorised,
        segments: segmentsOf(totals),
      });
    }
    if (addDays(date, 1) === date) break;
  }

  // The billed total is the sum of the days, never the range rounded once:
  // twenty days rounded up to the quarter is not the same figure as a month
  // rounded up to the quarter, and the day is the unit the two sides agreed.
  const billed = days.reduce((a, d) => a + d.billed, 0);

  return {
    projectId: project.id,
    projectName: project.name,
    from,
    to,
    days,
    categories: amounts(
      range.categories,
      project.categories.map((c) => c.id),
      billed,
      range.uncategorised,
      billed - range.worked,
    ),
    breaks: amounts(
      range.breaks,
      project.breakTypes.map((b) => b.id),
      range.breakTotal,
      0,
    ),
    totals: {
      worked: range.worked,
      billed,
      hours: sumHours(days.map((d) => d.hours)),
      breakTotal: range.breakTotal,
      target: range.target,
      balance: range.balance,
      workedDays: range.workedDays,
      expectedDays: range.expectedDays,
    },
    rounding,
  };
}

/** The day's first clock-in, or null when there is no session. */
function firstInOf(
  day: ReturnType<typeof dayFor>,
  upTo: Seconds,
): Seconds | null {
  if (!day || day.sessions.length === 0 || upTo <= 0) return null;
  const starts = day.sessions.map((s) => s.start).filter((s) => s <= upTo);
  return starts.length ? Math.min(...starts) : null;
}

/** The day's last clock-out — null while a session is still open, which on a
 *  specification prints as a stretch with no end rather than as a guess. */
function lastOutOf(
  day: ReturnType<typeof dayFor>,
  upTo: Seconds,
): Seconds | null {
  if (!day || day.sessions.length === 0 || upTo <= 0) return null;
  const started = day.sessions.filter((s) => s.start <= upTo);
  if (started.length === 0) return null;
  if (started.some((s) => s.end === null)) return null;
  return Math.max(...started.map((s) => s.end ?? 0));
}
