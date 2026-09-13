// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The geometry of the Today screen's clock: a twelve-hour dial, with the
// day's spans laid on it as arcs. Pure arithmetic over seconds and angles so
// the face can be tested without an SVG renderer.
//
// Twelve hours, not twenty-four, because that is the clock on the wall and
// the one a hand position is read from at a glance. A working day is rarely
// longer than twelve hours; one that is wraps, and a span longer than a full
// turn is drawn as the whole ring.

import type { Seconds } from "./types.ts";

/** One turn of the dial. */
export const DIAL_SECONDS: Seconds = 12 * 3600;

/** The two rings' centre lines, in the 240-unit box `ClockFace` draws in:
 *  presence and breaks on the outer one, the kind of work on the inner one.
 *  Here rather than in the component because what has to fit inside them is
 *  arithmetic, and arithmetic is testable. */
export const DIAL_OUTER_R = 100;
export const DIAL_INNER_R = 82;

/**
 * How far from the centre the hour numerals sit.
 *
 * Measured *down* from the inner ring's inner edge rather than set as a
 * number: a heavier look wears both a thicker ring and a bigger numeral, and
 * a fixed radius that cleared one of them ran the other into the arcs. The
 * half-extent that has to clear is half the width of a two-digit numeral —
 * 10, 11 and 12 are the wide ones — which is about `0.55` of the font size;
 * the eight units after it are air, so a numeral is never read against a
 * coloured arc.
 */
export function numeralRadius(
  innerRingWidth: number,
  numeralSize: number,
): number {
  return DIAL_INNER_R - innerRingWidth / 2 - numeralSize * 0.55 - 8;
}

/** The dial angle of a moment, in degrees clockwise from twelve o'clock. */
export function angleOf(at: Seconds): number {
  const turn = ((at % DIAL_SECONDS) + DIAL_SECONDS) % DIAL_SECONDS;
  return (turn / DIAL_SECONDS) * 360;
}

/** The angles of the three hands for a moment. */
export function handAngles(at: Seconds): {
  hour: number;
  minute: number;
  second: number;
} {
  const inDay = ((at % 86_400) + 86_400) % 86_400;
  const seconds = inDay % 60;
  const minutes = (inDay % 3600) / 60;
  const hours = (inDay % DIAL_SECONDS) / 3600;
  return {
    hour: (hours / 12) * 360,
    minute: (minutes / 60) * 360,
    second: (seconds / 60) * 360,
  };
}

/** The point at `angle` degrees clockwise from twelve, `r` from the centre. */
export function polar(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * An SVG path for the ring segment between two moments, `r` from the
 * centre, as a stroke-able arc. A span that covers a full turn or more is
 * the whole ring — drawn as two half-arcs, since an SVG arc cannot start
 * and end on the same point. Null when the span is empty.
 */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: Seconds,
  end: Seconds,
): string | null {
  if (end <= start) return null;
  if (end - start >= DIAL_SECONDS) {
    const [tx, ty] = polar(cx, cy, r, 0);
    const [bx, by] = polar(cx, cy, r, 180);
    return (
      `M ${round(tx)} ${round(ty)} A ${r} ${r} 0 1 1 ${round(bx)} ${round(by)} ` +
      `A ${r} ${r} 0 1 1 ${round(tx)} ${round(ty)}`
    );
  }
  const a0 = angleOf(start);
  const sweep = ((end - start) / DIAL_SECONDS) * 360;
  const a1 = a0 + sweep;
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = sweep > 180 ? 1 : 0;
  return `M ${round(x0)} ${round(y0)} A ${r} ${r} 0 ${large} 1 ${round(x1)} ${round(y1)}`;
}

/**
 * The path round a rounded rectangle, starting at the top edge's middle and
 * running clockwise — the Today screen's timer frame, where the day's
 * progress is drawn as a stroke along the card's own border.
 *
 * Twelve o'clock is where a dial starts, so the frame starts there too: the
 * stroke leaves the top centre, goes round the right, and meets itself back
 * at the top when the target is reached. `inset` pulls the path in from the
 * box's edge, so a stroke of that width sits inside the card rather than
 * half outside it.
 *
 * Pure geometry over a box the caller has measured. The caller sets
 * `pathLength="1"` on the path, which makes a dash array a plain fraction of
 * the way round — no measuring of the curve required.
 */
export function framePath(
  width: number,
  height: number,
  radius: number,
  inset = 0,
): string | null {
  const w = width - 2 * inset;
  const h = height - 2 * inset;
  if (!(w > 0) || !(h > 0)) return null;
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const x0 = inset;
  const y0 = inset;
  const x1 = inset + w;
  const y1 = inset + h;
  const midX = inset + w / 2;
  const arc = (x: number, y: number) =>
    `A ${round(r)} ${round(r)} 0 0 1 ${round(x)} ${round(y)}`;
  return [
    `M ${round(midX)} ${round(y0)}`,
    `L ${round(x1 - r)} ${round(y0)}`,
    arc(x1, y0 + r),
    `L ${round(x1)} ${round(y1 - r)}`,
    arc(x1 - r, y1),
    `L ${round(x0 + r)} ${round(y1)}`,
    arc(x0, y1 - r),
    `L ${round(x0)} ${round(y0 + r)}`,
    arc(x0 + r, y0),
    `L ${round(midX)} ${round(y0)}`,
  ].join(" ");
}
