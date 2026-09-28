// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The two conventions a time report is read by that are the reader's rather
// than the app's: which clock a time of day is told on, and which day a week
// starts on. An American reads "7:26 AM" and a week that starts on Sunday; a
// Swede reads "07:26" and a week that starts on Monday — and neither should
// have to go looking for a setting to be shown their own.
//
// So both follow the device's locale unless Settings says otherwise
// (`useAppSettings.ts`'s `hourClock` and `weekStart`, "auto" by default). The
// readings here are pure over a locale tag, so the tests can walk "en-US" and
// "sv-SE" on a machine set to either; `App.tsx` resolves the two once per
// render and hands them to `setLocalePrefs` below, which is what the
// formatters in `format.ts` and the week's order in `labels.ts` read.

import type { WeekStart } from "@niclaslindstedt/oss-framework/calendar";

/** Which clock a time of day is told on. */
export type HourCycle = "12" | "24";

/** A setting that may follow the device instead of naming a value. */
export type Auto<T> = T | "auto";

/**
 * The clock a locale tells the time on: "12" where a time reads "7:26 AM",
 * "24" where it reads "07:26". Read off `Intl` rather than a table of
 * countries, so it is the browser's own answer for the tag; `undefined` is
 * the device's locale.
 */
export function hourCycleOf(locale?: string): HourCycle {
  try {
    const cycle = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
    }).resolvedOptions().hourCycle;
    return cycle === "h11" || cycle === "h12" ? "12" : "24";
  } catch {
    return "24";
  }
}

/** The regions whose calendars start the week on Sunday, for an engine that
 *  cannot say (`Intl.Locale`'s week info is not everywhere yet). The largest
 *  of them; a region not listed starts on Monday, as ISO 8601 does. */
const SUNDAY_REGIONS = new Set([
  "US",
  "CA",
  "MX",
  "BR",
  "JP",
  "KR",
  "TW",
  "HK",
  "PH",
  "IL",
  "IN",
  "ZA",
]);

type WeekInfo = { firstDay?: number };
type LocaleWithWeek = Intl.Locale & {
  getWeekInfo?: () => WeekInfo;
  weekInfo?: WeekInfo;
};

/**
 * The day a locale's week starts on (`Date.getDay()` numbering: 0 = Sunday,
 * 1 = Monday). `Intl.Locale`'s week info where the engine has it — as a
 * method in current engines, as a property in the first ones to ship it —
 * and the region otherwise. `undefined` is the device's locale.
 */
export function weekStartOf(locale?: string): WeekStart {
  try {
    const tag = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
    const loc = new Intl.Locale(tag) as LocaleWithWeek;
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info?.firstDay !== undefined && info.firstDay >= 1) {
      return (info.firstDay % 7) as WeekStart;
    }
    const region = loc.maximize().region;
    return region && SUNDAY_REGIONS.has(region) ? 0 : 1;
  } catch {
    return 1;
  }
}

/** A clock setting, resolved against a locale. */
export function resolveHourCycle(
  setting: Auto<HourCycle>,
  locale?: string,
): HourCycle {
  return setting === "auto" ? hourCycleOf(locale) : setting;
}

/** A week-start setting, resolved against a locale. */
export function resolveWeekStart(
  setting: Auto<WeekStart>,
  locale?: string,
): WeekStart {
  return setting === "auto" ? weekStartOf(locale) : setting;
}

// ── What the app is showing now ─────────────────────────────────────────────
// The two resolved values, for the presentation code that is called from
// everywhere and would otherwise need them threaded through every screen.
// Only `App.tsx` writes them, before it renders a screen; nothing in the
// derivation reads them.

let current: { hourCycle: HourCycle; weekStart: WeekStart } = {
  hourCycle: hourCycleOf(),
  weekStart: weekStartOf(),
};

/** Set the clock and the week the screens are shown in. */
export function setLocalePrefs(next: {
  hourCycle: HourCycle;
  weekStart: WeekStart;
}): void {
  current = next;
}

/** The clock the screens tell the time on. */
export function currentHourCycle(): HourCycle {
  return current.hourCycle;
}

/** The day the screens start a week on. */
export function currentWeekStart(): WeekStart {
  return current.weekStart;
}
