// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The geometry of the Today screen's clock: a twelve-hour dial, with the
// day's spans laid on it as arcs. Pure arithmetic over seconds and angles so
// the face can be tested without an SVG renderer.
//
// Twelve hours, not twenty-four, because that is the clock on the wall and
// the one a hand position is read from at a glance. A working day is rarely
// longer than twelve hours; one that is wraps, and a span longer than a full
// turn is drawn as the whole ring.

import {
  DIAL_FONT,
  DIAL_MARKERS,
  DIAL_SCALE,
  ROMAN_WIDTH,
  type DialConfig,
  type DialPlacement,
} from "./look.ts";
import type { Seconds } from "./types.ts";

/** One turn of the dial. */
export const DIAL_SECONDS: Seconds = 12 * 3600;

/** The face's radius in the 240-unit box `ClockFace` draws in, and the
 *  bezel round it. Here rather than in the component because what has to fit
 *  inside them is arithmetic, and arithmetic is testable. */
export const DIAL_R = 117;
export const BEZEL_R = 118.5;
export const BEZEL_WIDTH = 3;

/** The twelve hours of the dial, in the order a clock reads them, starting
 *  at the top. */
export const DIAL_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** The same twelve in Roman numerals, indexed by `hour % 12`. Subtractive at
 *  four and nine — IV and IX — which is how Rome wrote them; a dial that
 *  wears IIII is a clockmaker's habit, not a numeral. Here rather than in the
 *  component because `widthFactor` in `look.ts` is measured against the
 *  widest of them (VIII) and the two have to move together. */
export const ROMAN_HOURS = [
  "XII",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
] as const;

// ── The day's ring, and where the markers sit against it ──

/** The ring the day is drawn as: a band, and a thin line along its outer
 *  edge. Time at work is the accent on both; a kind of work colours the band
 *  and leaves the line the accent; a break is the flag colour on both. */
export const RING_BAND = 12;
export const RING_EDGE = 2.5;
/** The rim, between the ring's outer edge and the face's: where the minute
 *  track's ticks are. */
const RIM = 5;
/** The ticks' outer end. */
export const TRACK_R = 116;
/** Air between the ring and a marker beside it. */
const MARKER_GAP = 4;
/** How far a marker may extend either side of its own radius, per placement
 *  — outside, it has to fit between the ring and the rim; over the ring, it
 *  has to stay off the bezel; inside, it has to leave a dial for the hands.
 *  A numeral that would reach further is set smaller. */
const MAX_REACH: Record<DialPlacement, number> = {
  outside: 14,
  over: 20,
  inside: 24,
};

/** An applied marker's length as a share of the numeral size it stands in
 *  for. */
const MARKER_SHARE = 1;

/** The hands' widths, the second hand's tail past the centre, and the cap
 *  over the axle. Thin, the way a wrist watch's are. */
export const HANDS = {
  hour: 3.2,
  minute: 2.2,
  second: 1,
  tail: 16,
  cap: 3,
} as const;

export type DialLayout = {
  /** The band's centre line and its inner and outer edges, and the thin
   *  line's centre. */
  bandR: number;
  ringInner: number;
  ringOuter: number;
  edgeR: number;
  /** Where a marker or numeral is centred. */
  markerR: number;
  /** The numerals' font size, after the placement's clamp. */
  numeralSize: number;
  /** An applied marker's length along the radius, and its width across it. */
  markerLength: number;
  markerWidth: number;
  /** The hands' tips from the centre. */
  hands: { hour: number; minute: number; second: number };
};

/**
 * Where everything sits for one dial: the ring's radius follows the markers'
 * placement, and the markers' size follows what that placement can fit.
 *
 * Inside, the ring is at the rim and the markers are measured in from it;
 * outside, the markers take the rim and the ring is measured in from them;
 * over, the ring is at the rim until a marker centred on it would reach the
 * minute track, and then comes in just far enough. Either way the widest thing the style draws — two digits, VIII, or a
 * baton's length — is what has to clear, halved into a `reach` either side
 * of the marker's own radius, and clamped to what the placement leaves room
 * for. The hands stop at the ring: the minute hand on the band, the second
 * hand at its outer edge, the hour hand well short of both.
 */
export function dialLayout(
  dial: Pick<DialConfig, "placement" | "markers" | "font" | "scale">,
): DialLayout {
  const style = DIAL_MARKERS[dial.markers];
  const font = DIAL_FONT[dial.font];
  const kinds = DIAL_HOURS.map((h) => style.at(h % 12));
  const roman = kinds.includes("roman");
  const numerals = roman || kinds.includes("arabic");
  // Half the widest thing on the dial, as a share of the size.
  const share = numerals
    ? font.widthFactor * (roman ? ROMAN_WIDTH : 1)
    : MARKER_SHARE / 2;
  const wanted = DIAL_SCALE[dial.scale] * font.scale;
  const size = Math.min(wanted, MAX_REACH[dial.placement] / share);
  const reach = size * share;

  const markerOuter = DIAL_R - RIM - 1;
  let ringOuter: number;
  let markerR: number;
  if (dial.placement === "outside") {
    markerR = markerOuter - reach;
    ringOuter = markerR - reach - MARKER_GAP;
  } else if (dial.placement === "over") {
    ringOuter = Math.min(
      DIAL_R - RIM,
      markerOuter - reach + RING_EDGE + RING_BAND / 2,
    );
    markerR = ringOuter - RING_EDGE - RING_BAND / 2;
  } else {
    ringOuter = DIAL_R - RIM;
    markerR = ringOuter - RING_EDGE - RING_BAND - MARKER_GAP - reach;
  }
  const edgeR = ringOuter - RING_EDGE / 2;
  const bandR = ringOuter - RING_EDGE - RING_BAND / 2;
  const ringInner = ringOuter - RING_EDGE - RING_BAND;
  return {
    bandR,
    ringInner,
    ringOuter,
    edgeR,
    markerR,
    numeralSize: size,
    markerLength: size * MARKER_SHARE,
    markerWidth: size * 0.22,
    hands: { hour: bandR * 0.62, minute: bandR, second: ringOuter },
  };
}

/** The dial angle of a moment, in degrees clockwise from twelve o'clock. */
export function angleOf(at: Seconds): number {
  const turn = ((at % DIAL_SECONDS) + DIAL_SECONDS) % DIAL_SECONDS;
  return (turn / DIAL_SECONDS) * 360;
}

/**
 * The dial read backwards: the moments of the day a point on the ring
 * stands for. A twelve-hour dial shows every angle twice — nine in the
 * morning and nine at night — and a third time for a shift that ran past
 * midnight, so the answer is a list, earliest first, and the caller picks
 * the one the day has something at. `angle` is degrees clockwise from
 * twelve, as `angleOf` gives it.
 */
export function timesAt(angle: number): Seconds[] {
  const turn = ((angle % 360) + 360) % 360;
  const at = Math.round((turn / 360) * DIAL_SECONDS);
  return [at, at + DIAL_SECONDS, at + 2 * DIAL_SECONDS];
}

/**
 * Whether a point, in the dial's own coordinates, is on the day's ring —
 * and if so, at what angle. `slack` widens the band a little either side,
 * because a pointer that is a pixel off the edge of a stroke is still
 * pointing at it. Null off the ring, including the centre and the bezel.
 */
export function ringHit(
  x: number,
  y: number,
  layout: Pick<DialLayout, "ringInner" | "ringOuter">,
  slack = 0,
): number | null {
  const dx = x - DIAL_R;
  const dy = y - DIAL_R;
  const r = Math.hypot(dx, dy);
  if (r < layout.ringInner - slack || r > layout.ringOuter + slack) {
    return null;
  }
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (angle + 360) % 360;
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

/**
 * The hands' rotations for a moment, in degrees clockwise from twelve and
 * *not* wrapped at 360: the second hand's angle at 09:30:15 is 34 215°, not
 * 90°. That is what a CSS transition needs — a hand told to go from 354° to
 * 0° would spin backwards round the dial, and one told to go to 360° steps
 * forward through the same six degrees it always does. `handAngles` is the
 * wrapped version, for arithmetic.
 */
export function handTurns(at: Seconds): {
  hour: number;
  minute: number;
  second: number;
} {
  const inDay = ((at % 86_400) + 86_400) % 86_400;
  return { hour: inDay / 120, minute: inDay / 10, second: inDay * 6 };
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
