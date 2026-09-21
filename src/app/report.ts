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
   *  otherwise. What the day was *asked* for, which is what the charts draw
   *  a day's track at whether or not it has been worked yet. */
  target: Seconds;
  /** How much of that target has come due, which is what the balance is
   *  measured against. The whole of it on any day that is over. On the day
   *  being worked it is only what there has been the chance to work — see
   *  `summarizeDay`. */
  due: Seconds;
  worked: Seconds;
  breakTotal: Seconds;
  breaks: Record<string, Seconds>;
  categories: Record<string, Seconds>;
  uncategorised: Seconds;
  /** Worked minus what has come due. Negative on a short day that is over,
   *  positive on a long one, and every second of a day off is positive. */
  balance: Seconds;
  /** Whether anything was logged at all. */
  logged: boolean;
};

export type RangeSummary = {
  from: DayKey;
  to: DayKey;
  days: DaySummary[];
  worked: Seconds;
  /** What the range asked for: the whole target of every day that has come.
   *  A day still ahead asks for nothing yet — it is not a shortfall — but
   *  today asks for its whole day, because that is what the day is for and
   *  what the share under the ring is read against. */
  target: Seconds;
  /** The part of that which has come *due*, which is what the balance is
   *  measured against: the rest of today is not owed until the day is
   *  worked or put away (see `summarizeDay`). The two differ only while the
   *  day is being worked, and `balance` is `worked - due`. */
  due: Seconds;
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

/**
 * One day against its project's expectations.
 *
 * `live` says the day is the one being worked — today, read up to now — and
 * it changes one thing: how much of the target has come due. A day that is
 * over owes the whole of it, worked or not, which is what makes an unlogged
 * Tuesday a full shortfall. The day you are standing in owes only what there
 * has been the *chance* to work, which is what has been worked: at nine in
 * the morning nobody is eight hours behind, and a balance that says so is a
 * number you have to do arithmetic on before it means anything. So while the
 * day is running its shortfall is nothing at all, and its overtime is real
 * the moment the target is passed.
 *
 * Until the day is put away. Closing the last session is the moment the day
 * stops being one that could still be worked and becomes one that was — so
 * the whole target comes due then, and a day stopped four hours short says
 * four hours short. A break is not that moment, and neither is a session
 * closed and another opened: what counts is being clocked out.
 */
export function summarizeDay(
  day: WorkDay | null,
  project: Project,
  date: DayKey,
  upTo: Seconds,
  live = false,
): DaySummary {
  const expected = isWorkDay(project, date);
  const target = expected ? targetSeconds(project) : 0;
  const totals = day ? dayTotals(day, project, upTo) : null;
  const worked = totals?.worked ?? 0;
  const away =
    totals !== null && totals.state === "out" && totals.lastOut !== null;
  const due = live && !away ? Math.min(target, worked) : target;
  return {
    date,
    expected,
    target,
    due,
    worked,
    breakTotal: totals?.breakTotal ?? 0,
    breaks: totals?.breaks ?? {},
    categories: totals?.categories ?? {},
    uncategorised: totals?.uncategorised ?? 0,
    balance: worked - due,
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
 *  come — a Friday not yet worked is not a shortfall on Wednesday, and
 *  neither is the part of today nobody has had the chance to work yet
 *  (`summarizeDay`, `due`). */
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
  let due = 0;
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
      date === today,
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
      due += summary.due;
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
    due,
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
