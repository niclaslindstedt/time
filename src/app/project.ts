// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// What a project is by default, and the two facts the report reads off one:
// whether a date is a working day, and how long a working day is meant to be.
//
// The default break types and categories are *names* the user can change, so
// they are stored in the document rather than looked up from the catalog at
// read time — which is why the template takes its labels as an argument: the
// screen that creates a project passes the translated words, and this
// module stays free of the i18n runtime.

import {
  dayKeyToDate,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import type { GlyphId, KindSort } from "./kinds.ts";
import {
  DEFAULT_BREAK_CREDIT,
  type BreakCredit,
  type BreakType,
  type Project,
  type Seconds,
  type Weekday,
  type WorkCategory,
} from "./types.ts";

/** Monday to Friday. */
export const DEFAULT_WORK_DAYS: Weekday[] = [1, 2, 3, 4, 5];

/** An eight-hour day. */
export const DEFAULT_HOURS_PER_DAY = 8;

/** The lengths the default break types are assumed to take when one is
 *  added after the fact: lunch half an hour, coffee a quarter, a toilet trip
 *  five minutes. */
export const DEFAULT_LUNCH_MINUTES = 30;
export const DEFAULT_COFFEE_MINUTES = 15;
export const DEFAULT_TOILET_MINUTES = 5;

/** What a new project counts a toilet break as: work, all of it. The only
 *  break the template answers for — see `projectTemplate`. It is a default
 *  and not a rule: every project's answer is its own, and changing this
 *  changes nothing about a project already made. */
export const DEFAULT_TOILET_CREDIT: BreakCredit = { mode: "all" };

/** The bounds a working day may be set to, in hours. */
export const MIN_HOURS_PER_DAY = 0.5;
export const MAX_HOURS_PER_DAY = 16;

/** The bounds a break's default length may be set to, in minutes. */
export const MIN_BREAK_MINUTES = 1;
export const MAX_BREAK_MINUTES = 240;

/** How much of a break of this kind counts as work time, in seconds:
 *  nothing, all of it — `Infinity`, because a break of any length is
 *  counted whole — or the stated minutes. A kind the project has since
 *  deleted counts for nothing, the way a break of it always did.
 *
 *  The one place the stored `credit` is read, so no screen and no derivation
 *  has to know what an absent one means. */
export function creditSeconds(project: Project, typeId: string): Seconds {
  return creditAllowance(breakTypeOf(project, typeId)?.credit);
}

/** The same, for a credit in the hand rather than one looked up — what a
 *  form previews while it is being edited. */
export function creditAllowance(credit: BreakCredit | undefined): Seconds {
  const c = credit ?? DEFAULT_BREAK_CREDIT;
  if (c.mode === "none") return 0;
  if (c.mode === "all") return Infinity;
  return c.minutes * 60;
}

/** Clamp the minutes of a partial credit. A credit longer than a break is
 *  allowed to be is only a slower way of saying "all of it", and the bounds
 *  are a break's own so the two fields on the form read alike. */
export function clampCreditMinutes(value: unknown, fallback: number): number {
  return clampBreakMinutes(value, fallback);
}

/** A credit as a break type carries it: spread into the kind, and nothing at
 *  all when it counts for nothing. Absent is what every document written
 *  before there was an answer says, so a project that counts no break stays
 *  byte for byte the document it was — the discipline a kind of work's
 *  "automatic" colour is stored under. */
export function storedCredit(
  credit: BreakCredit,
): { credit: BreakCredit } | Record<string, never> {
  return credit.mode === "none" ? {} : { credit };
}

/** The translated names the template stamps into a new project. */
export type ProjectTemplateLabels = {
  lunch: string;
  coffee: string;
  toilet: string;
  meetings: string;
  planning: string;
  retro: string;
  admin: string;
};

/**
 * The kinds the app itself suggests — the three breaks and four kinds of work
 * a new project opens with — and what each one is: which of the two sorts it
 * is, and the mark it wears.
 *
 * The names beside them are the catalog's (`projects.defaults`) and the
 * user's to change; the marks are the user's too, in the project form. These
 * are only what the app puts there to begin with — and what `suggestedGlyph`
 * hands a kind of one of these names that has no mark of its own, so a
 * project made before there were marks shows a fork on its Lunch rather than
 * the cup every unmarked break falls back to.
 */
export const DEFAULT_KINDS = {
  lunch: { sort: "break", glyph: "meal" },
  coffee: { sort: "break", glyph: "coffee" },
  toilet: { sort: "break", glyph: "toilet" },
  meetings: { sort: "category", glyph: "meeting" },
  planning: { sort: "category", glyph: "planning" },
  retro: { sort: "category", glyph: "review" },
  admin: { sort: "category", glyph: "admin" },
} satisfies Record<
  keyof ProjectTemplateLabels,
  { sort: KindSort; glyph: GlyphId }
>;

/** The keys of `DEFAULT_KINDS`, in the order the template lists them. */
const DEFAULT_KEYS = Object.keys(
  DEFAULT_KINDS,
) as (keyof ProjectTemplateLabels)[];

/**
 * The mark the app's own suggested kind of this name wears, or undefined for
 * a name it never suggested.
 *
 * The labels come in rather than out of the catalog, the way the template's
 * do — this module stays free of the i18n runtime — and only the sort's own
 * suggestions are considered, so a break someone called "Meetings" is still
 * not given a work mark. Matched on the name ignoring case and the space
 * either side, which is how the template wrote it.
 */
export function suggestedGlyph(
  name: string,
  sort: KindSort,
  labels: ProjectTemplateLabels,
): GlyphId | undefined {
  const wanted = name.trim().toLowerCase();
  if (!wanted) return undefined;
  const key = DEFAULT_KEYS.find(
    (k) =>
      DEFAULT_KINDS[k].sort === sort &&
      labels[k].trim().toLowerCase() === wanted,
  );
  return key && DEFAULT_KINDS[key].glyph;
}

/** A new project with the standard week and the default breaks. `id`
 *  is called once per thing that needs one, so a test can hand out names. */
export function projectTemplate(
  name: string,
  labels: ProjectTemplateLabels,
  id: () => string,
  now: string,
): Project {
  const breakTypes: BreakType[] = [
    {
      id: id(),
      name: labels.lunch,
      defaultMinutes: DEFAULT_LUNCH_MINUTES,
      glyph: DEFAULT_KINDS.lunch.glyph,
    },
    {
      id: id(),
      name: labels.coffee,
      defaultMinutes: DEFAULT_COFFEE_MINUTES,
      glyph: DEFAULT_KINDS.coffee.glyph,
    },
    {
      id: id(),
      name: labels.toilet,
      defaultMinutes: DEFAULT_TOILET_MINUTES,
      glyph: DEFAULT_KINDS.toilet.glyph,
      // The one break a new project counts as work. A trip down the corridor
      // is paid nearly everywhere there is a corridor, and a project that
      // docked you five minutes for it would be wrong more often than right.
      // Lunch and coffee are the ones people actually disagree about, so the
      // app leaves those to you.
      credit: DEFAULT_TOILET_CREDIT,
    },
  ];
  // No colour on the kinds of work: a new project's four take the hues their
  // positions give them, the same four they have always been drawn in. A
  // colour is set only when someone picks one.
  const categories: WorkCategory[] = [
    { id: id(), name: labels.meetings, glyph: DEFAULT_KINDS.meetings.glyph },
    { id: id(), name: labels.planning, glyph: DEFAULT_KINDS.planning.glyph },
    { id: id(), name: labels.retro, glyph: DEFAULT_KINDS.retro.glyph },
    { id: id(), name: labels.admin, glyph: DEFAULT_KINDS.admin.glyph },
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
export function isWorkDay(project: Project, date: DayKey): boolean {
  return project.workDays.includes(weekdayOf(date));
}

/** The target length of a working day, in seconds. */
export function targetSeconds(project: Project): Seconds {
  return Math.round(project.hoursPerDay * 3600);
}

/** A break type by id, or null when the project no longer has it — which
 *  happens when a type is deleted after breaks of it were logged. The break
 *  keeps its time; only its name is gone. */
export function breakTypeOf(
  project: Project,
  typeId: string,
): BreakType | null {
  return project.breakTypes.find((b) => b.id === typeId) ?? null;
}

export function categoryOf(
  project: Project,
  categoryId: string,
): WorkCategory | null {
  return project.categories.find((c) => c.id === categoryId) ?? null;
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
