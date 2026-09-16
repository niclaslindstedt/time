// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The month as a calendar of boxes: a row per week, a box per day, laid end
// to end. A month has twenty-odd working days and a column per day leaves the
// axis a smear of numbers nobody reads — a week to a row says the same thing
// in five rows.
//
// Both axes are hours, and both are cumulative:
//
//   x — a box's width is the day's worked seconds, and the boxes butt up
//       against each other, so a box's right edge reads the hours the week
//       had put in by the end of that day. A day off takes no width at all,
//       which is why a normal week shows five boxes rather than seven.
//   y — a row's height is the week's worked seconds, and the rows stack, so a
//       row's bottom edge reads the hours the month had put in by the end of
//       that week. The last one is the month's total — the figure on the
//       Report's "Worked" tile.
//
// A month rarely starts on the week's first day. Those leading days (and the
// trailing ones at the other end) belong to the neighbouring month, so they
// count for nothing: they are laid out at the width a working day is *meant*
// to take, unfilled, which keeps the days after them at the hour they would
// sit at in a whole week, and they add nothing to the row's height, which
// keeps the hours down the side this month's and only this month's.
//
// Pure and clock-free, like `report.ts` it reads: `today` comes in as an
// argument, and nothing here measures a pixel. The view scales seconds to the
// plot it has.

import {
  addDays,
  startOfWeek,
  type DayKey,
  type WeekStart,
} from "@niclaslindstedt/oss-framework/calendar";

import { isWorkDay, targetSeconds } from "./employer.ts";
import type { RangeSummary } from "./report.ts";
import type { Employer, Seconds } from "./types.ts";

/** One day, as a box in its week's row. Every measure is seconds. */
export type DayBox = {
  date: DayKey;
  /** The box's left edge: what the week had worked before this day. */
  x: Seconds;
  /** The box's width — the seconds worked, or, on a spill day, the seconds a
   *  working day is meant to take. */
  width: Seconds;
  /** Seconds worked. Zero on a spill day, which is not this month's to
   *  count. */
  worked: Seconds;
  /** What the day was meant to take; zero on a day the employer expects
   *  nothing of. */
  target: Seconds;
  /** `worked / target`, or null when there is no target to fall short of —
   *  a day off, and a day that has not come yet. */
  ratio: number | null;
  /** A day of the neighbouring month: drawn as an empty placeholder, counted
   *  for nothing. */
  spill: boolean;
};

/** One week, as a row of boxes. */
export type WeekRow = {
  /** The row's first day — the week's start, spill included. */
  from: DayKey;
  /** The row's top edge: what the month had worked before this week. */
  y: Seconds;
  /** The row's height — the seconds this month's days of the week worked. */
  height: Seconds;
  /** The row's width — its boxes end to end, placeholders included. */
  width: Seconds;
  /** What this month's days of the week were meant to take, counting only
   *  the ones that have come. */
  target: Seconds;
  boxes: DayBox[];
};

/** A month laid out. */
export type MonthChart = {
  weeks: WeekRow[];
  /** The hours axis along the bottom: the widest row, but never less than a
   *  full week's target, so a barely-worked month reads as the barely-worked
   *  month it is rather than filling the width. */
  width: Seconds;
  /** The hours axis down the side: the month's worked total, or its target
   *  when that is further, so the dotted line always has somewhere to go. */
  height: Seconds;
  /** The month's worked total — the bottom of the last row. */
  total: Seconds;
  /** The month's target, through the days that have come — the one dotted
   *  line down the side. */
  target: Seconds;
  /** A full week of work, the employer's working days at its day length — the
   *  one dotted line across. */
  weekTarget: Seconds;
  /** A working day's length: the step the hour labels walk in. */
  dayTarget: Seconds;
};

/** The month's days as week rows of boxes. `summary` is `summarizeRange` over
 *  a whole calendar month; days outside it are the spill. */
export function monthChart(
  summary: RangeSummary,
  employer: Employer,
  weekStartsOn: WeekStart,
  today: DayKey,
): MonthChart {
  const dayTarget = targetSeconds(employer);
  const inMonth = new Map(summary.days.map((d) => [d.date, d]));
  const weeks: WeekRow[] = [];
  let y = 0;
  let monthTarget = 0;
  let widest = 0;

  for (
    let start = startOfWeek(summary.from, weekStartsOn);
    start <= summary.to;
    start = addDays(start, 7)
  ) {
    const boxes: DayBox[] = [];
    let x = 0;
    let height = 0;
    let target = 0;

    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      const day = inMonth.get(date) ?? null;
      const spill = day === null;
      // A spill day stands in for the day it is: a working one takes the
      // width it was meant to take, a weekend takes none.
      const dayTargetHere = day
        ? day.target
        : isWorkDay(employer, date)
          ? dayTarget
          : 0;
      const worked = day?.worked ?? 0;
      const width = spill ? dayTargetHere : worked;
      // A day still ahead is not a shortfall, so it has no ratio to colour by
      // — the same rule `summarizeRange` balances by.
      const ratio =
        spill || dayTargetHere === 0 || date > today
          ? null
          : worked / dayTargetHere;
      boxes.push({
        date,
        x,
        width,
        worked,
        target: dayTargetHere,
        ratio,
        spill,
      });
      x += width;
      if (!spill) {
        height += worked;
        if (date <= today) target += dayTargetHere;
      }
    }

    monthTarget += target;
    weeks.push({
      from: start,
      y,
      height,
      width: x,
      target,
      boxes,
    });
    y += height;
    widest = Math.max(widest, x);
    if (addDays(start, 7) === start) break; // a malformed key would loop
  }

  const weekTarget = dayTarget * employer.workDays.length;
  return {
    weeks,
    width: Math.max(widest, weekTarget),
    height: Math.max(y, monthTarget),
    total: y,
    target: monthTarget,
    weekTarget,
    dayTarget,
  };
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * The `d` for one day's box, with its two ends rounded independently.
 *
 * A week's boxes butt up against each other, so the row wants to read as one
 * shape: only the first box's left end and the last box's right end are
 * rounded, and the joins between them stay square. Each radius collapses as
 * the box shrinks — a week of two hours is a sliver, and a corner bigger than
 * the box it is cut from would turn it inside out.
 */
export function boxPath(
  x: number,
  y: number,
  width: number,
  height: number,
  leftRadius: number,
  rightRadius: number,
): string {
  const cap = Math.min(width / 2, height / 2);
  const l = Math.max(0, Math.min(leftRadius, cap));
  const r = Math.max(0, Math.min(rightRadius, cap));
  const x1 = x + width;
  const y1 = y + height;
  const arc = (radius: number, toX: number, toY: number) =>
    `A ${round(radius)} ${round(radius)} 0 0 1 ${round(toX)} ${round(toY)}`;
  return [
    `M ${round(x + l)} ${round(y)}`,
    `L ${round(x1 - r)} ${round(y)}`,
    arc(r, x1, y + r),
    `L ${round(x1)} ${round(y1 - r)}`,
    arc(r, x1 - r, y1),
    `L ${round(x + l)} ${round(y1)}`,
    arc(l, x, y1 - l),
    `L ${round(x)} ${round(y + l)}`,
    arc(l, x + l, y),
    "Z",
  ].join(" ");
}

/** How far past the target a day has to go to read as fully blue. */
export const OVER_RATIO = 1.2;

/** The fill a day's box wears: the theme's red at nothing worked, its green
 *  at the target, its blue a fifth past it, and the mixes between.
 *
 *  This is a *scale* rather than a table — which is why it lives here and not
 *  in `labels.ts`, where a kind of work is pinned to one hue for good. It
 *  mixes the theme's own three tokens rather than naming colours of its own,
 *  so it follows the light and the dark theme the way everything else does.
 *
 *  A day the employer expects nothing of is green whatever was worked: there
 *  was no target to fall short of, and every second of it is balance. */
export function boxColor(ratio: number | null): string {
  if (ratio === null || ratio >= OVER_RATIO) {
    return ratio === null ? "var(--success)" : "var(--link)";
  }
  if (ratio <= 0) return "var(--danger)";
  if (ratio < 1) {
    return mix("var(--danger)", "var(--success)", ratio);
  }
  return mix("var(--success)", "var(--link)", (ratio - 1) / (OVER_RATIO - 1));
}

/** `from` and `to` mixed in a perceptual space, so the halfway point between
 *  red and green is the muddy olive the eye expects rather than a bright
 *  yellow. */
function mix(from: string, to: string, at: number): string {
  const percent = Math.round(Math.min(1, Math.max(0, at)) * 100);
  if (percent === 0) return from;
  if (percent === 100) return to;
  return `color-mix(in oklab, ${from}, ${to} ${percent}%)`;
}
