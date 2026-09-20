// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The report: many days → the totals, the balance and the breakdowns the
// Report screen draws. Everything here is a fold over `dayTotals` — a day is
// summarised once, against the project's target for that date, and a range
// is the sum of its days. Pure and clock-free: `today` and `now` are passed
// in so an open session today counts up to the moment asked about and a day
// in the past is read to its midnight.

import {
  addDays,
  startOfWeek,
  parseDayKey,
  toDayKey,
  type DayKey,
  type WeekStart,
} from "@niclaslindstedt/oss-framework/calendar";

import { END_OF_DAY, dayTotals } from "./day.ts";
import { isWorkDay, targetSeconds } from "./project.ts";
import {
  dayFor,
  type AppData,
  type Project,
  type Seconds,
  type WorkDay,
} from "./types.ts";

export type DaySummary = {
  date: DayKey;
  /** Whether the project expects a full day. */
  expected: boolean;
  /** The target for the day — the project's day length on a work day, zero
   *  otherwise. */
  target: Seconds;
  worked: Seconds;
  breakTotal: Seconds;
  breaks: Record<string, Seconds>;
  categories: Record<string, Seconds>;
  uncategorised: Seconds;
  /** Worked minus target. Negative on a short day, positive on a long one,
   *  and every second of a day off is positive. */
  balance: Seconds;
  /** Whether anything was logged at all. */
  logged: boolean;
};

export type RangeSummary = {
  from: DayKey;
  to: DayKey;
  days: DaySummary[];
  worked: Seconds;
  target: Seconds;
  balance: Seconds;
  breakTotal: Seconds;
  breaks: Record<string, Seconds>;
  categories: Record<string, Seconds>;
  uncategorised: Seconds;
  /** Days with any time worked. */
  workedDays: number;
  /** Days the project expected. */
  expectedDays: number;
};

/** The moment a day is read up to: `now` for today, midnight for a day in
 *  the past, and nothing for a day that has not come. */
export function readUpTo(date: DayKey, today: DayKey, now: Seconds): Seconds {
  if (date === today) return now;
  return date < today ? END_OF_DAY : 0;
}

/** One day against its project's expectations. */
export function summarizeDay(
  day: WorkDay | null,
  project: Project,
  date: DayKey,
  upTo: Seconds,
): DaySummary {
  const expected = isWorkDay(project, date);
  const target = expected ? targetSeconds(project) : 0;
  const totals = day ? dayTotals(day, project, upTo) : null;
  const worked = totals?.worked ?? 0;
  return {
    date,
    expected,
    target,
    worked,
    breakTotal: totals?.breakTotal ?? 0,
    breaks: totals?.breaks ?? {},
    categories: totals?.categories ?? {},
    uncategorised: totals?.uncategorised ?? 0,
    balance: worked - target,
    logged:
      totals !== null && (totals.presence > 0 || day!.sessions.length > 0),
  };
}

function addInto(into: Record<string, Seconds>, from: Record<string, Seconds>) {
  for (const [key, value] of Object.entries(from)) {
    into[key] = (into[key] ?? 0) + value;
  }
}

/** Every day from `from` to `to` inclusive, summarised and summed. Days after
 *  `today` are included with nothing in them, so a week's chart always has
 *  seven columns. A day's target only counts against the balance once it has
 *  come — a Friday not yet worked is not a shortfall on Wednesday. */
export function summarizeRange(
  data: AppData,
  project: Project,
  from: DayKey,
  to: DayKey,
  today: DayKey,
  now: Seconds,
): RangeSummary {
  const days: DaySummary[] = [];
  const breaks: Record<string, Seconds> = {};
  const categories: Record<string, Seconds> = {};
  let worked = 0;
  let target = 0;
  let balance = 0;
  let breakTotal = 0;
  let uncategorised = 0;
  let workedDays = 0;
  let expectedDays = 0;

  for (let date = from; date <= to; date = addDays(date, 1)) {
    const upTo = readUpTo(date, today, now);
    const summary = summarizeDay(
      dayFor(data, project.id, date),
      project,
      date,
      upTo,
    );
    days.push(summary);
    worked += summary.worked;
    breakTotal += summary.breakTotal;
    uncategorised += summary.uncategorised;
    addInto(breaks, summary.breaks);
    addInto(categories, summary.categories);
    if (summary.worked > 0) workedDays += 1;
    if (summary.expected) expectedDays += 1;
    if (date <= today) {
      target += summary.target;
      balance += summary.balance;
    }
    // Guard against a malformed key, which `addDays` would return unchanged
    // and loop on forever.
    if (addDays(date, 1) === date) break;
  }

  return {
    from,
    to,
    days,
    worked,
    target,
    balance,
    breakTotal,
    breaks,
    categories,
    uncategorised,
    workedDays,
    expectedDays,
  };
}

/** The week a day falls in. */
export function weekOf(
  date: DayKey,
  weekStartsOn: WeekStart,
): { from: DayKey; to: DayKey } {
  const from = startOfWeek(date, weekStartsOn);
  return { from, to: addDays(from, 6) };
}

/** The calendar month a day falls in. */
export function monthOf(date: DayKey): { from: DayKey; to: DayKey } {
  const parts = parseDayKey(date);
  if (!parts) return { from: date, to: date };
  const from = toDayKey({ year: parts.year, month: parts.month, day: 1 });
  const next =
    parts.month === 12
      ? { year: parts.year + 1, month: 1, day: 1 }
      : { year: parts.year, month: parts.month + 1, day: 1 };
  return { from, to: addDays(toDayKey(next), -1) };
}

/** The running balance over everything logged up to and including `today`:
 *  every expected day from the first logged one counts against the target,
 *  so a day skipped shows as the shortfall it is. */
export function runningBalance(
  data: AppData,
  project: Project,
  today: DayKey,
  now: Seconds,
): Seconds {
  const dates = Object.values(data.days)
    .filter((d) => d.projectId === project.id && d.date <= today)
    .map((d) => d.date)
    .sort();
  const first = dates[0];
  if (!first) return 0;
  return summarizeRange(data, project, first, today, today, now).balance;
}
