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
/** The dial's printing, as radii from the centre: the name under twelve,
 *  the movement's word under the name, and the window above six — the
 *  Settings cog, where a date would be. Fixed rather than laid out per
 *  dial, because a signature sits where it sits on a watch and the markers
 *  are what move; what has to hold is that none of it reaches the ring on
 *  any dial, and `tests/clock_test.ts` walks every one to say so. */
export const SIGNATURE = {
  /** The lockup's centre line, and the letters' height. */
  name: 54,
  nameSize: 9,
  /** The movement's word, in small capitals under the name. */
  line: 43,
  lineSize: 4.2,
  /** The window's centre, and its width and height. */
  window: 52,
  windowWidth: 21,
  windowHeight: 14,
} as const;

/** How far the printing reaches from the centre: the top of the name, and
 *  the foot of the window. What a ring has to stay outside of. */
export const SIGNATURE_REACH = Math.max(
  SIGNATURE.name + SIGNATURE.nameSize / 2,
  SIGNATURE.window + SIGNATURE.windowHeight / 2,
);

/** How far a marker may extend either side of its own radius, per placement
 *  — outside, it has to fit between the ring and the rim; over the ring, it
 *  has to stay off the bezel; inside, it has to stop short of the printing,
 *  which is what leaves a dial for the hands. A numeral that would reach
 *  further is set smaller. */
const MAX_REACH: Record<DialPlacement, number> = {
  outside: 14,
  over: 20,
  inside:
    (DIAL_R - RIM - RING_EDGE - RING_BAND - MARKER_GAP - SIGNATURE_REACH - 1) /
    2,
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

/**
 * The two minute tracks a printed ring is read against, as radii from the
 * centre, for a ring whose inner edge is at `ringInner`.
 *
 * A chapter ring's own ticks stand on its *inner* edge and grow outward
 * across it, with the numerals in the room that leaves above them — which is
 * the way round a dial of this kind is printed, and the opposite of where a
 * rim track goes. Under the ring, on the face itself, the dial wears a second
 * finer track: the one the minute hand is actually read against, hanging just
 * below the ring and growing inward.
 *
 * The face's track has to fit in the air the markers are clamped to leave
 * (`MARKER_GAP`), because a tick that reached past it would run into the
 * marker at twelve on the largest hour size. `tests/clock_test.ts` says so.
 */
export type ChapterTracks = {
  /** Where each track begins and ends: `inner` nearer the centre. */
  ring: { inner: number; outer: number };
  face: { inner: number; outer: number };
};

export function chapterTracks(ringInner: number): ChapterTracks {
  return {
    ring: { inner: ringInner + 0.5, outer: ringInner + 4 },
    face: { inner: ringInner - MARKER_GAP + 0.8, outer: ringInner - 0.6 },
  };
}

/** One mark of a chapter ring: a minute tick, or a numeral every five. The
 *  numeral is turned to lie along the ring — and in the lower half turned
 *  the other way, so a 30 at six o'clock is not read upside down. */
export type ChapterMark =
  | { minute: number; angle: number; kind: "tick" }
  | {
      minute: number;
      angle: number;
      kind: "numeral";
      label: string;
      turn: number;
    };

/**
 * The sixty marks a printed minute ring carries: a numeral at every five
 * minutes, 05 round to 60 at the top, and a tick at each minute between.
 * `angle` is clockwise from twelve; `turn` is what the numeral is rotated
 * by to sit along the ring.
 */
export function chapterMarks(): ChapterMark[] {
  return Array.from({ length: 60 }, (_, i) => {
    const angle = i * 6;
    if (i % 5 !== 0) return { minute: i, angle, kind: "tick" as const };
    const minute = i === 0 ? 60 : i;
    const lower = angle > 90 && angle < 270;
    return {
      minute,
      angle,
      kind: "numeral" as const,
      label: String(minute).padStart(2, "0"),
      turn: lower ? (angle + 180) % 360 : angle,
    };
  });
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

// ── How the hands move ──
//
// Two things happen to a live dial, and both are arithmetic over a moment
// and a beat rate. `useHands.ts` runs the frames; this is the shape of them.
//
// The first is ordinary time-keeping. The hour and minute hands are simply
// where the moment says, to the millisecond. The second hand is where its
// *movement* says: a quartz steps once a second, a mechanical calibre beats
// eight times (28 800 vph), a glide wheel does not step at all. That is one
// idea — round the moment down to the beat — and `beatTurns` is it. Rounding
// the clock rather than counting from a start is what keeps a beat on rate:
// there is nothing to accumulate drift in.
//
// A step is not instant, either. A stepper drives the hand at the mark, a
// little past it, and back — which is most of what tells a quartz apart from
// a dial that simply redraws once a second. So a beat is landed rather than
// arrived at, over a fraction of the beat's own length, and `easeOutBack` is
// the overshoot. A calibre's eighth of a second is too short and too small a
// step for anyone to see the landing in; a quartz's whole one is not.
//
// The second is setting the watch. A tab that has been in the background for
// an hour comes back with its hands an hour behind, and they are not
// teleported to the right time — the watch is *set*, the way a watch is set.
// The crown is wound forward: the minute hand goes round once for every hour
// there is to make up and the hour hand creeps after it at a twelfth of the
// rate, both of them moving on rather than jumping across. The second hand
// does not move at all while that happens, because a crown does not move it.
// Only once the hour and the minute are right is it let go, forward to the
// second the clock is actually on.
//
// Winding forward always, never back: a dial left at eleven at night and read
// again at ten past midnight goes the long way round, which is the only way a
// crown turns.

/** Past this many seconds behind, the hands are wound rather than ticked.
 *  Two, so a frame the browser skipped is still a tick. */
export const WIND_AFTER: Seconds = 2;

/** Getting the crown going, and what one turn of the minute hand costs on
 *  top — a longer sleep is a longer wind, but only up to a point, because
 *  nobody watches a dial spin for twelve seconds. */
const WIND_BASE_MS = 520;
const WIND_TURN_MS = 420;
const WIND_MIN_MS = 900;
const WIND_MAX_MS = 3000;

/** Letting the second hand go, for a full turn of catching up; a shorter gap
 *  takes proportionally less, down to a floor that is still a movement rather
 *  than a jump. There is always a sync, even when the second hand started out
 *  on the right second: the winding itself takes a second or three, and those
 *  are seconds the hacked hand did not tick. */
const WIND_SECOND_MS = 640;
const WIND_SECOND_MIN_MS = 240;

export type Turns = { hour: number; minute: number; second: number };

export type WindPlan = {
  /** How far the dial travels, in seconds of the day. */
  distance: Seconds;
  /** Turns of the minute hand — one an hour, which is what makes a long
   *  sleep look like a long wind. */
  turns: number;
  /** Winding the hour and minute hands, then letting the second hand go. */
  hands: number;
  second: number;
  total: number;
};

/** How long a stepper takes to land a beat, and how much of the beat's own
 *  length it may take — a calibre beating eight times a second cannot spend
 *  a seventh of a second doing it. */
const LANDING_MS = 140;
const LANDING_SHARE = 0.45;

/**
 * The moment, rounded down to the movement's beat: a quartz to the second, a
 * mechanical to an eighth of one, a glide wheel not at all (`null`).
 */
export function onBeat(at: Seconds, beats: number | null): Seconds {
  return beats === null ? at : Math.floor(at * beats) / beats;
}

/**
 * Ease out with a little past the mark: what a stepper does to a hand, and
 * what the eye reads as a hand being driven rather than redrawn. Zero at the
 * start, one at the end, about a tenth of a step beyond it in between.
 */
export function easeOutBack(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const back = 1.70158;
  const rest = t - 1;
  return 1 + (back + 1) * rest ** 3 + back * rest ** 2;
}

/**
 * The hands at a moment, for a movement that beats `beats` times a second.
 * The hour and minute hands are exact; only the second hand steps, and it is
 * still landing its step for the first few milliseconds after one.
 */
export function beatTurns(at: Seconds, beats: number | null): Turns {
  const exact = handTurns(at);
  if (beats === null) return exact;
  const beat = onBeat(at, beats);
  const landing = Math.min(LANDING_MS, (LANDING_SHARE / beats) * 1000);
  const landed = easeOutBack(((at - beat) * 1000) / landing);
  return {
    ...exact,
    second: handTurns(beat).second - (6 / beats) * (1 - landed),
  };
}

/** How far forward the dial has to travel between two moments of the day. */
export function windDistance(from: Seconds, to: Seconds): Seconds {
  return (((to - from) % 86_400) + 86_400) % 86_400;
}

/** How far forward the second hand has to travel, in degrees: at most one
 *  turn, because a second hand is synced rather than wound. */
export function secondGap(
  from: Seconds,
  to: Seconds,
  beats: number | null = null,
): number {
  const travel = onBeat(to, beats) - onBeat(from, beats);
  return ((((travel % 60) + 60) % 60) * 6) % 360;
}

/**
 * The wind from one moment to another, or null when the difference is a tick
 * and the hands should simply carry on.
 */
export function windPlan(from: Seconds, to: Seconds): WindPlan | null {
  const distance = windDistance(from, to);
  if (distance <= WIND_AFTER) return null;
  const turns = distance / 3600;
  const hands = clampMs(
    WIND_BASE_MS + turns * WIND_TURN_MS,
    WIND_MIN_MS,
    WIND_MAX_MS,
  );
  const second = clampMs(
    (secondGap(from, to) / 360) * WIND_SECOND_MS,
    WIND_SECOND_MIN_MS,
    WIND_SECOND_MS,
  );
  return { distance, turns, hands, second, total: hands + second };
}

/**
 * Sinusoidal ease in and out over `[0, 1]`: the speed is half a sine wave,
 * nothing at either end and fastest in the middle. A crown does not start at
 * full tilt and does not stop dead, and the eye reads a hand that accelerates
 * as a hand being turned rather than a number being replaced.
 */
export function easeInOutSine(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return (1 - Math.cos(Math.PI * t)) / 2;
}

/**
 * The hands, part way through a wind: `elapsed` milliseconds into `plan`, on
 * the way from `from` to the live moment `to`.
 *
 * The clock goes on turning while the crown does, so each phase aims at where
 * its hands *will be* when it arrives rather than where they are now —
 * `to` plus whatever is left to run. That target does not move (the moment
 * advances exactly as fast as the time left shrinks), which is what holds the
 * second hand dead still through the winding, and it is the live moment by
 * the last frame, so the wind ends on the true time and the ordinary frame
 * after it does not move.
 */
export function windTurns(
  from: Seconds,
  to: Seconds,
  elapsed: number,
  plan: WindPlan,
  beats: number | null = null,
): Turns {
  const windingAt = to + Math.max(0, plan.hands - elapsed) / 1000;
  const syncAt = to + Math.max(0, plan.total - elapsed) / 1000;
  const wound = 1 - easeInOutSine(elapsed / plan.hands);
  const synced = easeInOutSine((elapsed - plan.hands) / plan.second);
  const set = handTurns(windingAt);
  const distance = windDistance(from, windingAt);
  return {
    hour: set.hour - (distance / 120) * wound,
    minute: set.minute - (distance / 10) * wound,
    second:
      beatTurns(syncAt, beats).second -
      secondGap(from, syncAt, beats) * (1 - synced),
  };
}

function clampMs(ms: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, ms)));
}
