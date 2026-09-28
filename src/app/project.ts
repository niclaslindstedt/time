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
 *  added after the fact: lunch half an hour, coffee a quarter, and an hour
 *  each for the two that take you out of the building — the gym and the
 *  appointment are both the hour you block out for them rather than the time
 *  you are actually under the barbell. */
export const DEFAULT_LUNCH_MINUTES = 30;
export const DEFAULT_COFFEE_MINUTES = 15;
export const DEFAULT_TRAINING_MINUTES = 60;
export const DEFAULT_HEALTHCARE_MINUTES = 60;

/** The bounds a working day may be set to, in hours. */
export const MIN_HOURS_PER_DAY = 0.5;
export const MAX_HOURS_PER_DAY = 16;

/** The bounds a working week may be set to, in hours: a working day's, over
 *  a week of seven of them. */
export const MIN_HOURS_PER_WEEK = MIN_HOURS_PER_DAY;
export const MAX_HOURS_PER_WEEK = MAX_HOURS_PER_DAY * 7;

/** Which figure a project's hours were entered as. */
export type HoursUnit = "day" | "week";

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

/**
 * Whether a kind of break or work gets a button of its own on the Today
 * screen, or waits in its row's "…".
 *
 * The one place a stored `pinned` is read, the way `creditSeconds` is the one
 * place a stored `BreakCredit` is — so no screen has to know what an absent
 * one means. Absent means pinned: every document written before there was a
 * "…" shows the buttons it always did, and a kind is hidden only because
 * somebody said to hide it.
 */
export function isPinned(kind: { pinned?: boolean }): boolean {
  return kind.pinned !== false;
}

/** The other half: pinned is stored as nothing at all, the way a break that
 *  counts for nothing and a kind of work's "automatic" colour are, so a
 *  project nobody has hidden anything in is byte for byte the project it
 *  always was. */
export function storedPinned(
  pinned: boolean,
): { pinned: false } | Record<string, never> {
  return pinned ? {} : { pinned: false };
}

/**
 * The translated names of the kinds the app itself knows.
 *
 * Not all of them are stamped into a new project any more — `toilet` is here
 * because a document written when it *was* still carries a break of that
 * name, and `suggestedGlyph` has to go on knowing which mark that is.
 */
export type ProjectTemplateLabels = {
  lunch: string;
  coffee: string;
  toilet: string;
  training: string;
  healthcare: string;
  meetings: string;
  planning: string;
  retro: string;
  admin: string;
};

/**
 * The kinds the app itself suggests — the four breaks and four kinds of work
 * a new project opens with, plus the toilet break it used to — and what each
 * one is: which of the two sorts it is, and the mark it wears.
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
  training: { sort: "break", glyph: "exercise" },
  healthcare: { sort: "break", glyph: "health" },
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
    // The two hours out of the building, and they arrive unpinned: an hour at
    // the gym and an hour at the doctor are what a working day is actually
    // interrupted by, so they are worth setting up in advance — but not
    // worth two of the four buttons a phone has room for, when most days
    // have neither in them. They wait in the row's "…", which is where a
    // project's fifth and sixth breaks belong.
    //
    // Nothing the template stamps counts as work. The toilet break used to,
    // and it was the only one: a trip down the corridor is paid nearly
    // everywhere there is a corridor. It is not put in a new project any
    // more — five minutes is shorter than the tap that logs it — and with it
    // gone, every break a project starts with is one people actually
    // disagree about. A wellness hour is a perk some employers grant and
    // plenty do not; a doctor's appointment is paid under some agreements
    // and deducted under others; lunch and coffee were always the argument.
    // So the app answers for none of them, and the project form does.
    {
      id: id(),
      name: labels.training,
      defaultMinutes: DEFAULT_TRAINING_MINUTES,
      glyph: DEFAULT_KINDS.training.glyph,
      pinned: false,
    },
    {
      id: id(),
      name: labels.healthcare,
      defaultMinutes: DEFAULT_HEALTHCARE_MINUTES,
      glyph: DEFAULT_KINDS.healthcare.glyph,
      pinned: false,
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
  return Math.round(dayHours(project) * 3600);
}

/** Whether the project's hours were given for the day or for the week. */
export function hoursUnit(project: Project): HoursUnit {
  return project.hoursPerWeek === undefined ? "day" : "week";
}

/** The target length of a working day, in hours: the day's own figure, or
 *  the week's spread evenly over the working days. A week with no working
 *  day in it has nothing to spread over, so the day's figure stands; and a
 *  week spread over too few days is held to the longest day there is. */
export function dayHours(project: Project): number {
  const week = project.hoursPerWeek;
  const days = project.workDays.length;
  if (week === undefined || days === 0) return project.hoursPerDay;
  return clampHours(week / days, project.hoursPerDay);
}

/** The target of a working week, in hours: the week's own figure, or the
 *  day's over every working day. */
export function weekHours(project: Project): number {
  return project.hoursPerWeek ?? project.hoursPerDay * project.workDays.length;
}

/** The project with its hours set to `hours` a day or a week. Either way
 *  `hoursPerDay` comes out as the day's target, so a reader that knows only
 *  that field reads the same day this one does; a day's figure drops the
 *  week's. Call it again with the same figure after the working days change,
 *  so a week goes on being spread over the days it now has. */
export function withHours(
  project: Project,
  unit: HoursUnit,
  hours: unknown,
): Project {
  const rest = { ...project };
  delete rest.hoursPerWeek;
  if (unit === "day") {
    return { ...rest, hoursPerDay: clampHours(hours, project.hoursPerDay) };
  }
  const week = clampWeekHours(hours, weekHours(project));
  const next = { ...rest, hoursPerWeek: week };
  return { ...next, hoursPerDay: dayHours(next) };
}

/** The project's hours given the other way round, standing for the same
 *  target: a day of 7.5 over five days is a week of 37.5, and back. */
export function switchHoursUnit(project: Project, unit: HoursUnit): Project {
  if (unit === hoursUnit(project)) return project;
  if (unit === "day") return withHours(project, "day", dayHours(project));
  // A week of no working days is nothing, so there is no week to carry over
  // — the day's hours are taken as the week's until the days are picked.
  const week = weekHours(project);
  return withHours(project, "week", week > 0 ? week : project.hoursPerDay);
}

/** A number of hours as it is typed: "7.5", "7,5" — the decimal comma the
 *  keyboard offers across most of Europe — or "7:30". Null when it is none of
 *  them, or nothing at all, rather than the nought an empty field reads as. */
export function parseHours(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s+/g, "");
  const clock = /^(\d+):([0-5]\d)$/.exec(text);
  if (clock) return Number(clock[1]) + Number(clock[2]) / 60;
  if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(text)) return null;
  return Number(text.replace(",", "."));
}

/** A number of hours for a field to show: at most two decimals, and none
 *  that are nought — "7.5", "37.5", "13.33". */
export function formatHoursField(hours: number): string {
  return String(Math.round(hours * 100) / 100);
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
  const n = parseHours(value);
  if (n === null) return fallback;
  return Math.min(MAX_HOURS_PER_DAY, Math.max(MIN_HOURS_PER_DAY, n));
}

/** The same for a working week. */
export function clampWeekHours(
  value: unknown,
  fallback = DEFAULT_HOURS_PER_DAY * DEFAULT_WORK_DAYS.length,
) {
  const n = parseHours(value);
  if (n === null) return fallback;
  return Math.min(MAX_HOURS_PER_WEEK, Math.max(MIN_HOURS_PER_WEEK, n));
}

export function clampBreakMinutes(value: unknown, fallback: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_BREAK_MINUTES, Math.max(MIN_BREAK_MINUTES, n));
}
