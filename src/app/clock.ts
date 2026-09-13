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
