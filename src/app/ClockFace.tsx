// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo } from "react";

import { activityIntervals, breakIntervals, presenceIntervals } from "./day.ts";
import { arcPath, handAngles, polar } from "./clock.ts";
import { useT } from "./i18n/index.ts";
import { categoryColor } from "./labels.ts";
import type { Employer, Seconds, WorkDay } from "./types.ts";

// The Today screen's clock: a twelve-hour dial with the day drawn on it.
//
// The outer ring is presence — the stretches between entering and leaving,
// in the accent — with the breaks marked over it in the flag colour, so the
// ring reads "at work, except here". The inner, thinner ring is the kind of
// work, one hue per category (the same hue the report's charts use, see
// `labels.ts`), drawn only where time was actually worked. The hands are the
// wall clock's, so the arc ending under the minute hand is the stretch you
// are in.
//
// Everything is derived from the day's spans up to `now` (see `day.ts`); the
// face holds no state of its own and re-renders as the second ticks.

const SIZE = 240;
const C = SIZE / 2;
const OUTER_R = 100;
const OUTER_W = 14;
const INNER_R = 82;
const INNER_W = 8;
const TICK_OUTER = 116;
const NUMERAL_R = 60;

type Props = {
  day: WorkDay;
  employer: Employer;
  now: Seconds;
};

export function ClockFace({ day, employer, now }: Props) {
  const t = useT();
  const presence = useMemo(() => presenceIntervals(day, now), [day, now]);
  const breaks = useMemo(() => breakIntervals(day, now), [day, now]);
  const activities = useMemo(() => activityIntervals(day, now), [day, now]);
  const hands = handAngles(now);

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const [x1, y1] = polar(C, C, TICK_OUTER - 6, i * 30);
    const [x2, y2] = polar(C, C, TICK_OUTER, i * 30);
    return { x1, y1, x2, y2 };
  });
  const numerals = [12, 3, 6, 9].map((n) => {
    const [x, y] = polar(C, C, NUMERAL_R, (n % 12) * 30);
    return { n, x, y };
  });

  const [hx, hy] = polar(C, C, 34, hands.hour);
  const [mx, my] = polar(C, C, 50, hands.minute);
  const [sx, sy] = polar(C, C, 56, hands.second);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="app-clock mx-auto block h-auto w-full max-w-[15rem]"
      role="img"
      aria-label={t("today.clockLabel")}
    >
      <desc>{t("today.clockDesc")}</desc>

      {/* The dial's two tracks, recessive, so an empty morning still reads
          as a clock and the arcs have a groove to sit in. */}
      <circle
        cx={C}
        cy={C}
        r={OUTER_R}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={OUTER_W}
        opacity={0.45}
      />
      <circle
        cx={C}
        cy={C}
        r={INNER_R}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={INNER_W}
        opacity={0.3}
      />

      {presence.map((i, index) => {
        const d = arcPath(C, C, OUTER_R, i.start, i.end);
        return d ? (
          <path
            key={`p${index}`}
            d={d}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={OUTER_W}
            strokeLinecap="butt"
          />
        ) : null;
      })}
      {breaks.map((i, index) => {
        const d = arcPath(C, C, OUTER_R, i.start, i.end);
        return d ? (
          <path
            key={`b${index}`}
            d={d}
            fill="none"
            stroke="var(--color-flag)"
            strokeWidth={OUTER_W}
            strokeLinecap="butt"
          />
        ) : null;
      })}
      {activities.map((i, index) => {
        const d = arcPath(C, C, INNER_R, i.start, i.end);
        return d ? (
          <path
            key={`a${index}`}
            d={d}
            fill="none"
            stroke={categoryColor(employer, i.categoryId)}
            strokeWidth={INNER_W}
            strokeLinecap="butt"
          />
        ) : null;
      })}

      {ticks.map((tick, i) => (
        <line
          key={`t${i}`}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke="var(--color-muted)"
          strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
          strokeLinecap="round"
        />
      ))}
      {numerals.map(({ n, x, y }) => (
        <text
          key={n}
          x={x}
          y={y}
          dy="0.35em"
          textAnchor="middle"
          className="fill-muted text-[13px] font-semibold tabular-nums"
        >
          {n}
        </text>
      ))}

      <line
        x1={C}
        y1={C}
        x2={hx}
        y2={hy}
        stroke="var(--color-fg-bright)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <line
        x1={C}
        y1={C}
        x2={mx}
        y2={my}
        stroke="var(--color-fg-bright)"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <line
        x1={C}
        y1={C}
        x2={sx}
        y2={sy}
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={C} cy={C} r={4} fill="var(--color-accent)" />
    </svg>
  );
}
