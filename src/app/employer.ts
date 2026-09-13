// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// What an employer is by default, and the two facts the report reads off one:
// whether a date is a working day, and how long a working day is meant to be.
//
// The default break types and categories are *names* the user can change, so
// they are stored in the document rather than looked up from the catalog at
// read time — which is why the template takes its labels as an argument: the
// screen that creates an employer passes the translated words, and this
// module stays free of the i18n runtime.

import {
  dayKeyToDate,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import type {
  BreakType,
  Employer,
  Seconds,
  Weekday,
  WorkCategory,
} from "./types.ts";

/** Monday to Friday. */
export const DEFAULT_WORK_DAYS: Weekday[] = [1, 2, 3, 4, 5];

/** An eight-hour day. */
export const DEFAULT_HOURS_PER_DAY = 8;

/** The lengths the two default break types are assumed to take when one is
 *  added after the fact: lunch half an hour, coffee a quarter. */
export const DEFAULT_LUNCH_MINUTES = 30;
export const DEFAULT_COFFEE_MINUTES = 15;

/** The bounds a working day may be set to, in hours. */
export const MIN_HOURS_PER_DAY = 0.5;
export const MAX_HOURS_PER_DAY = 16;

/** The bounds a break's default length may be set to, in minutes. */
export const MIN_BREAK_MINUTES = 1;
export const MAX_BREAK_MINUTES = 240;

/** The translated names the template stamps into a new employer. */
export type EmployerTemplateLabels = {
  lunch: string;
  coffee: string;
  meetings: string;
  coding: string;
  admin: string;
};

/** A new employer with the standard week and the two default breaks. `id`
 *  is called once per thing that needs one, so a test can hand out names. */
export function employerTemplate(
  name: string,
  labels: EmployerTemplateLabels,
  id: () => string,
  now: string,
): Employer {
  const breakTypes: BreakType[] = [
    { id: id(), name: labels.lunch, defaultMinutes: DEFAULT_LUNCH_MINUTES },
    { id: id(), name: labels.coffee, defaultMinutes: DEFAULT_COFFEE_MINUTES },
  ];
  const categories: WorkCategory[] = [
    { id: id(), name: labels.meetings },
    { id: id(), name: labels.coding },
    { id: id(), name: labels.admin },
  ];
  return {
    id: id(),
    name,
    workDays: [...DEFAULT_WORK_DAYS],
    hoursPerDay: DEFAULT_HOURS_PER_DAY,
    breakTypes,
    categories,
    updatedAt: now,
  };
}

/** The weekday of a calendar day, or Monday when the key is not a day. */
export function weekdayOf(date: DayKey): Weekday {
  return (dayKeyToDate(date)?.getDay() ?? 1) as Weekday;
}

/** Whether a full day of work is expected on a date. */
export function isWorkDay(employer: Employer, date: DayKey): boolean {
  return employer.workDays.includes(weekdayOf(date));
}

/** The target length of a working day, in seconds. */
export function targetSeconds(employer: Employer): Seconds {
  return Math.round(employer.hoursPerDay * 3600);
}

/** A break type by id, or null when the employer no longer has it — which
 *  happens when a type is deleted after breaks of it were logged. The break
 *  keeps its time; only its name is gone. */
export function breakTypeOf(
  employer: Employer,
  typeId: string,
): BreakType | null {
  return employer.breakTypes.find((b) => b.id === typeId) ?? null;
}

export function categoryOf(
  employer: Employer,
  categoryId: string,
): WorkCategory | null {
  return employer.categories.find((c) => c.id === categoryId) ?? null;
}

/** Clamp a working-day length into range, falling back when it isn't a
 *  number. Kept next to the bounds so the settings form and the document
 *  reader can't disagree about what is sane. */
export function clampHours(value: unknown, fallback = DEFAULT_HOURS_PER_DAY) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_HOURS_PER_DAY, Math.max(MIN_HOURS_PER_DAY, n));
}

export function clampBreakMinutes(value: unknown, fallback: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_BREAK_MINUTES, Math.max(MIN_BREAK_MINUTES, n));
}
