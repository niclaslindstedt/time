// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo } from "react";

import { activityIntervals, daySegments } from "./day.ts";
import {
  DIAL_HOURS,
  DIAL_INNER_R,
  DIAL_OUTER_R,
  ROMAN_HOURS,
  angleOf,
  arcPath,
  handAngles,
  numeralRadius,
  polar,
} from "./clock.ts";
import { formatTimeOfDay } from "./format.ts";
import { useT } from "./i18n/index.ts";
import { breakName, categoryColor } from "./labels.ts";
import {
  CLOCK_FONT,
  CLOCK_LOOK,
  CLOCK_SIZE,
  type ClockFont,
  type ClockLook,
  type ClockSize,
} from "./look.ts";
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
// The dial is also where a break gets corrected. A break is written down with
// the end its kind is assumed to have (see `takeBreak`), so its end is a
// guess — and the guess is printed on the rim, next to the arc it ends, where
// tapping it opens the stretch list at that moment. Tapping the rings
// themselves opens the same list from the top.
//
// Everything is derived from the day's spans (see `day.ts`); the face holds no
// state of its own and re-renders as the second ticks. The part of a break
// that has not happened yet — the tail between now and its assumed end — is
// drawn at half strength, because it is a plan rather than a record.
//
// The look, the face and the size come from the settings (see `look.ts`): how
// many numerals the dial carries, what they are set in, whether it counts
// minutes, how heavy the hands are, how wide it is. None of them touch colour
// — the accent, the flag and the category hues are the app's, whichever dial
// is on.

const SIZE = 240;
const C = SIZE / 2;
const OUTER_R = DIAL_OUTER_R;
const INNER_R = DIAL_INNER_R;
const TICK_OUTER = 116;
/** The hands, as a share of the numeral ring: they stop short of it and
 *  sweep inside the numerals rather than across them — the one place this
 *  dial is not the wall clock it imitates, because the wall clock has no day
 *  drawn round its rim. A share rather than three numbers, so a face that
 *  pulls the numerals in (VIII is wide) brings the hands in with them. */
const HAND_SHARE = { hour: 0.55, minute: 0.82, second: 0.92 };
/** Where the break-end chips sit: outside the ticks, as a percentage of the
 *  box, so they are HTML buttons over the SVG rather than text inside it —
 *  a chip is a tap target and wants a real button under the finger. */
const LABEL_R = 122;

type Props = {
  day: WorkDay;
  employer: Employer;
  now: Seconds;
  look: ClockLook;
  font: ClockFont;
  size: ClockSize;
  /** Open the day's stretches, optionally at the moment that was tapped. */
  onOpen: (at?: Seconds) => void;
};

export function ClockFace({
  day,
  employer,
  now,
  look,
  font,
  size,
  onOpen,
}: Props) {
  const t = useT();
  const spec = CLOCK_LOOK[look];
  const face = CLOCK_FONT[font];
  const sizing = CLOCK_SIZE[size];
  const numeralSize = spec.numeralSize * face.scale;
  // With no numerals to clear, the face is not a thing anyone can see, so the
  // hands keep the length they would have had under the app's own.
  const numeralR = numeralRadius(
    spec.innerRing,
    numeralSize,
    spec.numerals === "none" ? 0.55 : face.widthFactor,
  );
  const segments = useMemo(() => daySegments(day, now), [day, now]);
  const activities = useMemo(() => activityIntervals(day, now), [day, now]);
  const hands = handAngles(now);

  // One chip per break end, in the order of the dial, dropping any that would
  // land on top of the one before it.
  const labels = useMemo(() => {
    const out: { at: Seconds; angle: number; typeId: string | null }[] = [];
    for (const s of segments) {
      if (s.kind !== "break" || s.running) continue;
      const angle = angleOf(s.end);
      if (out.some((l) => gap(l.angle, angle) < sizing.labelGap)) continue;
      out.push({ at: s.end, angle, typeId: s.typeId });
    }
    return out.map((l) => {
      const [x, y] = polar(C, C, LABEL_R, l.angle);
      return { ...l, left: (x / SIZE) * 100, top: (y / SIZE) * 100 };
    });
  }, [segments, sizing.labelGap]);

  // A real wall clock counts minutes, and every fifth one is the hour.
  const count = spec.minuteTicks ? 60 : 12;
  const ticks = Array.from({ length: count }, (_, i) => {
    const angle = (i * 360) / count;
    const hour = spec.minuteTicks ? i % 5 === 0 : true;
    const length = hour ? 6 : 3;
    const [x1, y1] = polar(C, C, TICK_OUTER - length, angle);
    const [x2, y2] = polar(C, C, TICK_OUTER, angle);
    return { x1, y1, x2, y2, hour };
  });
  const shown =
    spec.numerals === "all"
      ? DIAL_HOURS
      : spec.numerals === "quarters"
        ? [12, 3, 6, 9]
        : [];
  const numerals = shown.map((n) => {
    const [x, y] = polar(C, C, numeralR, (n % 12) * 30);
    return {
      n,
      x,
      y,
      text: face.numerals === "roman" ? ROMAN_HOURS[n % 12]! : n,
    };
  });

  const [hx, hy] = polar(C, C, numeralR * HAND_SHARE.hour, hands.hour);
  const [mx, my] = polar(C, C, numeralR * HAND_SHARE.minute, hands.minute);
  const [sx, sy] = polar(C, C, numeralR * HAND_SHARE.second, hands.second);

  return (
    <div className={`relative mx-auto w-full ${sizing.maxWidth}`}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="app-clock block h-auto w-full"
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
          strokeWidth={spec.ring}
          opacity={0.45}
        />
        <circle
          cx={C}
          cy={C}
          r={INNER_R}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={spec.innerRing}
          opacity={0.3}
        />

        {segments.map((s, index) => {
          const d = arcPath(C, C, OUTER_R, s.start, Math.min(s.end, now));
          return d ? (
            <path
              key={`s${index}`}
              d={d}
              fill="none"
              stroke={
                s.kind === "break" ? "var(--color-flag)" : "var(--color-accent)"
              }
              strokeWidth={spec.ring}
              strokeLinecap="butt"
            />
          ) : null;
        })}
        {segments.map((s, index) => {
          // The tail of a break that has not been lived yet: assumed, so
          // drawn as half a claim.
          const d = s.end > now ? arcPath(C, C, OUTER_R, now, s.end) : null;
          return d ? (
            <path
              key={`t${index}`}
              d={d}
              fill="none"
              stroke="var(--color-flag)"
              strokeWidth={spec.ring}
              strokeLinecap="butt"
              opacity={0.4}
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
              strokeWidth={spec.innerRing}
              strokeLinecap="butt"
            />
          ) : null;
        })}

        {ticks.map((tick, i) => (
          <line
            key={`k${i}`}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="var(--color-muted)"
            strokeWidth={tick.hour ? 2.5 : 1}
            strokeLinecap="round"
            opacity={tick.hour ? 1 : 0.6}
          />
        ))}
        {numerals.map(({ n, x, y, text }) => (
          <text
            key={n}
            x={x}
            y={y}
            dy="0.35em"
            textAnchor="middle"
            className="fill-muted tabular-nums"
            style={{
              fontSize: `${numeralSize}px`,
              fontFamily: face.family,
              fontWeight: 700,
            }}
          >
            {text}
          </text>
        ))}

        <line
          x1={C}
          y1={C}
          x2={hx}
          y2={hy}
          stroke="var(--color-fg-bright)"
          strokeWidth={spec.hands.hour}
          strokeLinecap="round"
        />
        <line
          x1={C}
          y1={C}
          x2={mx}
          y2={my}
          stroke="var(--color-fg-bright)"
          strokeWidth={spec.hands.minute}
          strokeLinecap="round"
        />
        {spec.hands.second !== null && (
          <line
            x1={C}
            y1={C}
            x2={sx}
            y2={sy}
            stroke="var(--color-accent)"
            strokeWidth={spec.hands.second}
            strokeLinecap="round"
          />
        )}
        <circle
          cx={C}
          cy={C}
          r={spec.hands.hour * 0.8}
          fill="var(--color-accent)"
        />
      </svg>

      {/* The dial is the button. It sits over the drawing rather than around
          it so the chips below stay on top of it. */}
      <button
        type="button"
        aria-label={t("today.openTimeline")}
        onClick={() => onOpen()}
        className="absolute inset-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />

      {labels.map((l) => (
        <button
          key={l.at}
          type="button"
          onClick={() => onOpen(l.at)}
          style={{ left: `${l.left}%`, top: `${l.top}%` }}
          aria-label={t("today.breakEndLabel", {
            name: l.typeId ? breakName(t, employer, l.typeId) : "",
            time: formatTimeOfDay(l.at),
          })}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-flag/50 bg-surface-2 px-1.5 py-0.5 text-[0.625rem] leading-none font-bold text-flag tabular-nums shadow-sm"
        >
          {formatTimeOfDay(l.at)}
        </button>
      ))}
    </div>
  );
}

/** The shorter way round the dial between two angles, in degrees. */
function gap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
