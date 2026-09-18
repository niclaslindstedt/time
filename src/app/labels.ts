// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Domain value → label, in one place, so every screen names a thing the
// same way.

import { addDays, type DayKey } from "@niclaslindstedt/oss-framework/calendar";

import {
  AUTO_CATEGORY_COLORS,
  CATEGORY_COLOR,
  glyphFor,
  type GlyphId,
} from "./kinds.ts";
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

/** The hues a kind of work falls back to when nobody has picked one — the
 *  first four of `kinds.ts`'s palette, taken by position in the project's
 *  list. Exported for the settings' dial previews, which draw an invented
 *  morning in the first of them. */
export const CATEGORY_COLORS = AUTO_CATEGORY_COLORS.map(
  (id) => CATEGORY_COLOR[id],
);

/** The hue a category's *place in the list* gives it — what it is drawn in
 *  when it has picked no colour of its own, and what "Automatic" stands for
 *  in the picker. A category the project has since deleted takes the slot
 *  after the last, which is also the slot the next one added will take. */
export function autoCategoryColor(
  project: Project,
  categoryId: string,
): string {
  const index = project.categories.findIndex((c) => c.id === categoryId);
  const slot = index === -1 ? project.categories.length : index;
  return CATEGORY_COLORS[slot % CATEGORY_COLORS.length] ?? "var(--link)";
}

/** The colour a category is drawn in, everywhere it is drawn: the clock's
 *  inner ring, the chips, its own glyph and the report's charts read this one
 *  table, so a kind of work is one hue across the app.
 *
 *  The project's own choice first; failing that, the hue its position in the
 *  list gives it, which is what every kind of work wore before one could be
 *  picked. */
export function categoryColor(project: Project, categoryId: string): string {
  const chosen = categoryOf(project, categoryId)?.color;
  if (chosen) return CATEGORY_COLOR[chosen];
  return autoCategoryColor(project, categoryId);
}

/** The mark a break type wears — its own, or the cup every break started
 *  out with. */
export function breakGlyph(project: Project, typeId: string): GlyphId {
  return glyphFor(breakTypeOf(project, typeId)?.glyph, "break");
}

/** The mark a kind of work wears — its own, or the label every kind of work
 *  started out with. */
export function categoryGlyph(project: Project, categoryId: string): GlyphId {
  return glyphFor(categoryOf(project, categoryId)?.glyph, "category");
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
