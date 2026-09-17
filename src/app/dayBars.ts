// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The range's days as one bar apiece.
//
// A day is two figures — what it was meant to take and what it took — and the
// honest shape for that pair is one column, not two. The target is the
// *track*: the height the day was asked for, drawn once and stood in place.
// The hours worked fill it from the floor up, and when the day ran long they
// carry on past the top of the track, so the target ends up *underneath* the
// bar that overtook it. A short day leaves the rest of its track showing, and
// the gap is the shortfall — read as a gap rather than worked out from two
// bars standing side by side.
//
// Pure and clock-free, like `report.ts` and `monthChart.ts`: `today` comes in
// as an argument, and nothing here measures a pixel. The view scales seconds
// into the plot it has.

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { targetSeconds } from "./project.ts";
import type { RangeSummary } from "./report.ts";
import type { Project, Seconds } from "./types.ts";

/** One day, as a bar. Every measure is seconds. */
export type DayBar = {
  date: DayKey;
  worked: Seconds;
  /** What the day was meant to take; zero on a day the project expects
   *  nothing of. */
  target: Seconds;
  /** The worked seconds that fall inside the target — the part of the bar
   *  that fills the track. */
  inside: Seconds;
  /** The worked seconds past the target — the part that rises above it. */
  over: Seconds;
  /** The target not worked — the empty track left showing above the bar. */
  short: Seconds;
  /** How tall the day stands: whichever of worked and target is further. */
  height: Seconds;
  /** `worked / target`, or null when there is nothing to fall short of — a
   *  day off, and a day that has not come yet. */
  ratio: number | null;
  /** A day still ahead. Its track is drawn, because the hours are coming,
   *  but the gap in it is not a shortfall — the same rule `summarizeRange`
   *  balances by. */
  future: boolean;
};

/** A range laid out as bars. */
export type DayBarChart = {
  bars: DayBar[];
  /** The top of the plot: the tallest day, but never under a full working
   *  day, so a range of short days reads short rather than being stretched to
   *  fill the height. */
  top: Seconds;
  /** A working day's length — the height a full track stands at. */
  dayTarget: Seconds;
};

/** The range's days as bars. `summary` is `summarizeRange` over the range the
 *  screen is showing. */
export function dayBars(
  summary: RangeSummary,
  project: Project,
  today: DayKey,
): DayBarChart {
  const dayTarget = targetSeconds(project);
  const bars = summary.days.map((day): DayBar => {
    const inside = Math.min(day.worked, day.target);
    const over = Math.max(0, day.worked - day.target);
    const future = day.date > today;
    return {
      date: day.date,
      worked: day.worked,
      target: day.target,
      inside,
      over,
      short: Math.max(0, day.target - day.worked),
      height: Math.max(day.worked, day.target),
      ratio: day.target === 0 || future ? null : day.worked / day.target,
      future,
    };
  });

  const tallest = bars.reduce((most, bar) => Math.max(most, bar.height), 0);
  return { bars, top: Math.max(tallest, dayTarget), dayTarget };
}
