// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Domain value → label, in one place, so every screen names a thing the
// same way.

import { addDays, type DayKey } from "@niclaslindstedt/oss-framework/calendar";
import { SERIES_COLOR_TOKENS } from "@niclaslindstedt/oss-framework/charts";

import { breakTypeOf, categoryOf } from "./project.ts";
import { formatDay, formatWeekday } from "./format.ts";
import type { TFn } from "./i18n/index.ts";
import type { Project, Weekday } from "./types.ts";

/** A day as a heading: "Today", "Yesterday", or the date. */
export function dayHeadline(t: TFn, day: DayKey, today: DayKey): string {
  if (day === today) return t("common.today");
  if (day === addDays(today, -1)) return t("common.yesterday");
  if (day === addDays(today, 1)) return t("common.tomorrow");
  return formatDay(day);
}

/** A break type's name, or a placeholder when the project deleted it. */
export function breakName(t: TFn, project: Project, typeId: string) {
  return breakTypeOf(project, typeId)?.name ?? t("log.unknownType");
}

/** A category's name, or a placeholder when the project deleted it. */
export function categoryName(t: TFn, project: Project, categoryId: string) {
  return categoryOf(project, categoryId)?.name ?? t("log.unknownType");
}

/** The hues a kind of work may wear: the framework's series order with the
 *  accent and the flag taken out, because those two already mean "at work"
 *  and "break" on the clock's ring, and a category in either would read as
 *  the ring's own colour. Exported for the settings' dial previews, which
 *  draw an invented morning in the first of them. */
export const CATEGORY_COLORS = SERIES_COLOR_TOKENS.filter(
  (token) => token !== "var(--accent)" && token !== "var(--flag)",
);

/** The colour a category is drawn in, everywhere it is drawn: the clock's
 *  inner ring, the chips and the report's charts read the same table, so a
 *  kind of work is one hue across the app. By position in the project's
 *  list; a category the project has since deleted takes the slot after the
 *  last. */
export function categoryColor(project: Project, categoryId: string): string {
  const index = project.categories.findIndex((c) => c.id === categoryId);
  const slot = index === -1 ? project.categories.length : index;
  return CATEGORY_COLORS[slot % CATEGORY_COLORS.length] ?? "var(--link)";
}

/** The week's day names, from the locale rather than the catalog: 1 March
 *  2026 is a Sunday, and the six days after it are the rest of the week. */
export function weekdayLabel(day: Weekday): string {
  return formatWeekday(addDays("2026-03-01", day));
}

/** The week as it is shown, Monday first — the order the day picker offers
 *  and the order a project's working days are listed in. */
export const WEEK: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/** Saturday and Sunday. A working day that falls on one is still a working
 *  day; it is only drawn in the flag colour so it reads as the exception it
 *  usually is. */
export function isWeekend(day: Weekday): boolean {
  return day === 0 || day === 6;
}
