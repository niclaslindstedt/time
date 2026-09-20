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
  DIAL_RING,
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

// ── The day's track, the dial's ring, and where the markers sit ──

/**
 * The day's own track: a band just inside the bezel, with a thin line along
 * its outer edge. Time at work is the accent on both; a kind of work colours
 * the band and leaves the line the accent; a break is the flag colour on
 * both.
 *
 * It is the outermost thing on the face, immediately under the bezel that
 * draws the day's progress, because the day is the one thing on this dial
 * that is not the watch — and a dial reads as a watch for exactly as long as
 * its own furniture is left alone. Laid over the chapter ring it fought the
 * minutes printed on it and covered the very marks the hands are read
 * against; out here the ring keeps its print and the day keeps its own
 * track, and the two rings under the bezel are the day's target and the
 * day's shape, one outside the other.
 *
 * Fixed rather than laid out per dial, the way the printing is: the day sits
 * where the day sits on every face, and it is the markers and the ring that
 * move. What has to hold is that nothing else reaches it, which is what
 * `FACE_R` is for and what `tests/clock_test.ts` walks every dial to say.
 */
export const DAY_BAND = 3.2;
export const DAY_EDGE = 1.2;

/**
 * Where the day's track sits, as radii from the centre: the thin line
 * outside, the band under it, and no air either side of the pair.
 *
 * It runs from the case to whatever the dial puts under it, touching both,
 * because air between two rings on a watch is a gap rather than a margin —
 * there is nothing in it to see, and an empty band of face reads as a mistake
 * however narrow it is.
 */
export const DAY_TRACK = {
  outer: DIAL_R,
  edgeR: DIAL_R - DAY_EDGE / 2,
  bandR: DIAL_R - DAY_EDGE - DAY_BAND / 2,
  inner: DIAL_R - DAY_EDGE - DAY_BAND,
} as const;

/** How much of the face's outer edge the day has taken. */
export const DAY_RESERVE = DAY_EDGE + DAY_BAND;

/** The radius the watch itself is laid out inside — the face less the day's
 *  track. Every number below is measured from this rather than from `DIAL_R`,
 *  so the dial keeps its proportions and simply sits a little further in. */
export const FACE_R = DIAL_R - DAY_RESERVE;

/** The dial's own ring, which the markers are placed against and the hands
 *  are read to: a faint groove, or the printed chapter ring. The day used to
 *  be drawn on it and is not any more (see `DAY_TRACK`), so what it carries
 *  now is the minutes — or, on a groove, nothing but the track itself. */
export const RING_BAND = 12;
export const RING_EDGE = 2.5;
/**
 * The rim, between the ring's outer edge and the day's track: where the
 * minute track's ticks are — on the styles that print one.
 *
 * On a dial that prints nothing there *and* keeps its markers inside the
 * ring, there is no rim at all: the ring comes right out to meet the day. A
 * rim is room left for something, and a dial with nothing to put in it wore a
 * band of bare face between its ring and its day, which reads as a gap rather
 * than as a margin.
 *
 * Markers placed outside or over the ring are the exception, because then
 * they are the outermost thing on the watch and the rim is their margin off
 * the day's track — give it back and an hour marker ends up against the
 * case. So the rim a dial gets is the room whatever reaches furthest out
 * actually needs.
 */
const RIM = 5;
const RIM_BARE = 0;
/** The ticks' outer end. */
export const TRACK_R = FACE_R - 1;
/** Air between the ring and a marker beside it. */
const MARKER_GAP = 4;
/** The day's groove is painted a little wider than it measures, so no seam
 *  of bare face shows where it meets the ring under it. Inward only — the
 *  groove is the faintest thing on the dial and laps harmlessly onto the ring,
 *  where outward it would lap onto the case. The bands themselves are painted
 *  to the track exactly, since they are opaque and would eat the ring.
 *  `Dial.tsx` paints with this number. */
export const RING_BLEED = 0.5;
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

/**
 * How far a marker may extend either side of its own radius, per placement.
 * A numeral that would reach further is set smaller.
 *
 * Inside and outside answer to the same number, from the two ends: inside,
 * the marker sits under the ring and has to stop short of the printing;
 * outside, it takes the rim and pushes the ring down onto the printing
 * instead. Either way what is left after the rim, the ring and the air
 * beside it has to hold twice the reach and still clear the app's name —
 * which is the arithmetic below, and the reason the day's own track coming
 * out of `FACE_R` sets the largest hours a step smaller rather than running
 * the ring over the printing. Over the ring a marker is centred on the band
 * itself and starts far enough in that only the bezel is in its way.
 * `SIGNATURE_CLEAR` is the air left over either way, a unit at each end, so
 * the two cases are the one number rather than two that nearly agree.
 */
const SIGNATURE_CLEAR = 2;
// Reckoned on the full rim, which is the tighter case: a style that gives its
// rim back moves its ring and its markers outward, away from the printing.

const PLACEMENT_REACH =
  (FACE_R -
    RIM -
    RING_EDGE -
    RING_BAND -
    MARKER_GAP -
    SIGNATURE_REACH -
    SIGNATURE_CLEAR) /
  2;

const MAX_REACH: Record<DialPlacement, number> = {
  outside: PLACEMENT_REACH,
  over: 20,
  inside: PLACEMENT_REACH,
};

/** An applied marker's length as a share of the numeral size it stands in
 *  for, and its width across the radius as a share of that length — before
 *  the style's own `width`, which is what tells a block from a baton. */
const MARKER_SHARE = 1;
const MARKER_WIDTH = 0.22;

/** How much of the run from a block's own inner end out to the ring the
 *  block actually takes. One would have it filling the whole run, which
 *  reaches further into the dial than an applied hour does on the watch this
 *  is drawn after. What it gives back comes off the *inner* end, because the
 *  outer end is the one that has to meet the ring. */
const BLOCK_LENGTH = 0.8;

/** How far a hand's tip goes past the mark it is read against, where there
 *  is one. A tip that stops exactly on a tick reads as short of it; a tip
 *  that crosses it reads as pointing at it. */
const HAND_PAST = 1;
/** The second hand takes half of that, because what it is read on is the
 *  ring's own ticks: a hair that ran along one would cover the mark it is
 *  pointing at instead of marking it. */
const SECOND_PAST = HAND_PAST / 2;

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
  /** The dial's ring: the band's centre line, its inner and outer edges, and
   *  the thin line's centre. The day is not drawn here any more — that is
   *  `DAY_TRACK`, out under the bezel — but the markers are still placed
   *  against this ring and the hands are still read to it. */
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
  /** The lumed plot at the end of an hour that runs out to the ring: where
   *  its centre sits, how far it reaches along the radius and how wide it is
   *  across — a block of lume rather than a dot, which is why it has two
   *  numbers. Null on every other dial, which is most of them — an hour that
   *  stops short of the ring has nothing on the ring to finish it with. */
  pip: { r: number; length: number; width: number } | null;
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
 * for.
 *
 * The hands stop at whatever the dial gives them to be read against. On a
 * groove that is the ring itself: the minute hand on the band, the second
 * hand at its outer edge, the hour hand well short of both. On a printed
 * ring it is the print — the minute hand crosses the tips of the track under
 * the ring and stops there, and the second hand goes on to the ring itself
 * and stops the width of a print onto the near end of its ticks, where a
 * dark hair over a white one is the contrast that makes it readable. Onto
 * them and barely: a second hand running the length of the marks it is read
 * against would cover the very thing it is pointing at.
 *
 * A style that `reachesRing` is the exception, and only inside the ring,
 * where there is a gap to close: the block's outer end is taken out to the
 * ring's inner edge, so the hour runs into the day's track rather than
 * stopping short of it behind a stray tick. It does not fill the whole run
 * out from where a baton of the same size would have started — it gives a
 * fifth of it back at the inner end (`BLOCK_LENGTH`), because an applied
 * hour reaches nothing like that far into the dial. The ring is painted to
 * exactly the radius the block ends at on its inner side (`RING_BLEED`), so
 * the hour and the ring meet rather than the hour lapping onto it. What finishes it is a
 * lumed plot on the ring, centred on the ring's own ticks — the hours are the twelve places a chapter ring prints a
 * numeral rather than a tick, so the plot lands in room the minutes are not
 * using — standing on the same track as the ticks, a shade shorter than one
 * and more than twice as wide.
 */
export function dialLayout(
  dial: Pick<DialConfig, "placement" | "markers" | "font" | "scale" | "ring">,
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

  // The rim this dial asks for. Room for the marks where the style prints a
  // track on it; a margin off the day's track where the markers themselves
  // are out here, which is every placement but `inside`; and nothing at all
  // where the ring is the outermost thing on the watch — there is then
  // nothing to leave room for, and an empty band of face is a gap rather
  // than a margin.
  const rim = style.minuteTrack || dial.placement !== "inside" ? RIM : RIM_BARE;
  const markerOuter = FACE_R - rim - 1;
  let ringOuter: number;
  let markerR: number;
  if (dial.placement === "outside") {
    markerR = markerOuter - reach;
    ringOuter = markerR - reach - MARKER_GAP;
  } else if (dial.placement === "over") {
    ringOuter = Math.min(
      FACE_R - rim,
      markerOuter - reach + RING_EDGE + RING_BAND / 2,
    );
    markerR = ringOuter - RING_EDGE - RING_BAND / 2;
  } else {
    ringOuter = FACE_R - rim;
    markerR = ringOuter - RING_EDGE - RING_BAND - MARKER_GAP - reach;
  }
  const edgeR = ringOuter - RING_EDGE / 2;
  const bandR = ringOuter - RING_EDGE - RING_BAND / 2;
  const ringInner = ringOuter - RING_EDGE - RING_BAND;

  const tracks = chapterTracks(ringInner);

  let markerLength = size * MARKER_SHARE;
  let pip: DialLayout["pip"] = null;
  if (style.reachesRing && dial.placement === "inside") {
    const innerEnd = markerR - markerLength / 2;
    markerLength = (ringInner - innerEnd) * BLOCK_LENGTH;
    markerR = ringInner - markerLength / 2;
    pip = {
      r: (tracks.ring.inner + tracks.ring.outer) / 2,
      length: (tracks.ring.outer - tracks.ring.inner) * PLOT_LENGTH,
      width: MINUTE_INK * PLOT_WIDTH,
    };
  }

  const printed = DIAL_RING[dial.ring].printed;

  return {
    bandR,
    ringInner,
    ringOuter,
    edgeR,
    markerR,
    numeralSize: size,
    markerLength,
    markerWidth: size * MARKER_WIDTH * style.width,
    pip,
    hands: {
      hour: bandR * 0.62,
      minute: printed ? tracks.face.inner + HAND_PAST : bandR,
      second: printed ? tracks.ring.inner + SECOND_PAST : ringOuter,
    },
  };
}

/**
 * The minute tracks a printed ring is read against, as radii from the centre,
 * for a ring whose inner edge is at `ringInner`.
 *
 * A chapter ring's own ticks stand on its *inner* edge and grow outward
 * across it, with the numerals in the room that leaves above them — which is
 * the way round a dial of this kind is printed, and the opposite of where a
 * rim track goes. Under the ring, on the face itself, the dial wears the
 * other half of the same track: a tick a minute of the ring's own length,
 * hanging just below the ring and growing inward, so the two read as one
 * minute track with the ring's edge running through it.
 *
 * Between one minute and the next the face's track carries two finer marks —
 * thirds of a minute, which is what a track this long is divided into on a
 * dial of this kind — reaching less than half as far in, so the minutes stay
 * the marks that are counted.
 *
 * The face's track has to fit in the air the markers are clamped to leave
 * (`MARKER_GAP`), because a tick that reached past it would run into the
 * marker at twelve on the largest hour size — so its length is the ring's,
 * clamped to what that air has room for. `tests/clock_test.ts` says so.
 * The one dial that crosses it does so on purpose: a style that `reachesRing`
 * takes its blocks out over the track, and the twelve ticks under them are
 * the twelve the hours stand on anyway.
 */
export type ChapterTracks = {
  /** Where each track begins and ends: `inner` nearer the centre. */
  ring: { inner: number; outer: number };
  face: { inner: number; outer: number };
  /** The finer marks that divide a minute: the same outer edge as the
   *  minutes, and not nearly as far in. */
  fine: { inner: number; outer: number };
};

/** Air between the ring's inner edge and the track hanging under it, and
 *  between that track's tips and the markers inside them. */
const FACE_TRACK_GAP = 0.4;
const FACE_TRACK_CLEAR = 0.2;
/** A minute's tick, on either side of the ring's edge: the one length the
 *  two halves of the track share, which is all the air the markers leave. */
const MINUTE_TICK = MARKER_GAP - FACE_TRACK_GAP - FACE_TRACK_CLEAR;
/** How much of that a third of a minute gets. */
const FINE_TICK_SHARE = 0.44;
/** How thick the ring's own minute ticks are printed. The plot at an hour is
 *  measured against this, so the two move together. */
export const MINUTE_INK = 0.7;
/** The plot an hour is finished with, against the minute tick it stands in
 *  the place of: a little shorter along the radius, and well over twice as
 *  thick across it. A minute is a line; an hour's lume is a block, and that
 *  difference is most of what makes the twelve hours findable on a ring of
 *  sixty marks. Measured off a photograph of the dial this one is drawn
 *  after, where the plot runs about seven-eighths of a tick's length at
 *  nearly two and a half times its width. */
const PLOT_LENGTH = 0.86;
const PLOT_WIDTH = 2.4;

export function chapterTracks(ringInner: number): ChapterTracks {
  const outer = ringInner - FACE_TRACK_GAP;
  return {
    ring: { inner: ringInner + 0.5, outer: ringInner + 0.5 + MINUTE_TICK },
    face: { inner: outer - MINUTE_TICK, outer },
    fine: { inner: outer - MINUTE_TICK * FINE_TICK_SHARE, outer },
  };
}

/** One mark of the track under a printed ring: a minute, or one of the two
 *  finer marks that divide it. */
export type FaceMark = { angle: number; minute: boolean };

/** Whether a minute is one of the twelve an hour stands at. */
const isHour = (minute: number) => minute % 5 === 0;

/**
 * The marks that track carries: a minute every six degrees, and the gap
 * after it in thirds. `angle` is clockwise from twelve, as `chapterMarks`
 * gives it.
 *
 * Except where an hour is in the way, which is the whole of the difference
 * between a track that is printed and a track that is read. An applied hour
 * is a block of steel standing across the track, and the third of a minute
 * beside it is under that block: on a real dial it is printed and hidden, so
 * what you see beside an hour is one mark rather than two. Here it is simply
 * not drawn — a mark half under a marker reads as a burr on the marker
 * rather than as a mark. Twelve takes both, because twelve is where every
 * style puts its widest hour, and what you see beside twelve is nothing.
 */
export function faceMarks(): FaceMark[] {
  const marks: FaceMark[] = [];
  for (let minute = 0; minute < 60; minute += 1) {
    marks.push({ angle: minute * 6, minute: true });
    const next = (minute + 1) % 60;
    const twelve = minute === 0 || next === 0;
    if (!twelve && !isHour(minute)) {
      marks.push({ angle: minute * 6 + 2, minute: false });
    }
    if (!twelve && !isHour(next)) {
      marks.push({ angle: minute * 6 + 4, minute: false });
    }
  }
  return marks;
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
 * Whether a point, in the dial's own coordinates, is on the day's track —
 * and if so, at what angle. `slack` widens the track a little either side,
 * because a pointer that is a pixel off the edge of a stroke is still
 * pointing at it, and this track is a thin one. Null off it, including the
 * centre, the rest of the face and the bezel.
 *
 * The track comes in rather than being read off `DAY_TRACK` directly so a
 * test can point at one it chose; every caller hands it the day's.
 */
export function ringHit(
  x: number,
  y: number,
  track: { inner: number; outer: number },
  slack = 0,
): number | null {
  const dx = x - DIAL_R;
  const dy = y - DIAL_R;
  const r = Math.hypot(dx, dy);
  if (r < track.inner - slack || r > track.outer + slack) {
    return null;
  }
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (angle + 360) % 360;
}

/**
 * Whether a point, in the dial's own coordinates, is on the face itself —
 * inside the dial's own ring — rather than out on the ring, the rim, the
 * day's track or the bezel.
 *
 * This is the switch's edge. The face is what starts and stops the day, and
 * everything the day is *drawn* on opens the day instead: the ring is a
 * record, and a record is a thing you correct rather than a thing you press.
 */
export function faceHit(
  x: number,
  y: number,
  layout: Pick<DialLayout, "ringInner">,
): boolean {
  return Math.hypot(x - DIAL_R, y - DIAL_R) < layout.ringInner;
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
//
// And the day goes round with them. `windMoment` is where the whole dial
// stands part way through a wind — the moment the hour and minute hands are
// drawn at — so the bands on the ring are cut off there too: the hours worked
// while the tab slept fill in under the hands that are setting the watch,
// instead of being on the ring before they have reached them.

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
 * The moment the dial is standing at, part way through a wind: `from` on the
 * first frame, the live moment `to` by the last, and the crown's own ease in
 * between.
 *
 * The clock goes on turning while the crown does, so the wind aims at where
 * the hands *will be* when it arrives rather than where they are now — `to`
 * plus whatever is left to run — and works back from there by however much
 * of the distance is still to make up. That target does not move (the moment
 * advances exactly as fast as the time left shrinks), which is what holds the
 * second hand dead still through the winding, and it is the live moment by
 * the last frame, so the wind ends on the true time and the ordinary frame
 * after it does not move.
 *
 * This is the whole dial's moment, not only the hands': the day drawn on the
 * ring is filled in up to here too, so the hours that went by while the tab
 * slept are laid down under the hands that are setting the watch rather than
 * arriving all at once before they move.
 */
export function windMoment(
  from: Seconds,
  to: Seconds,
  elapsed: number,
  plan: WindPlan,
): Seconds {
  const windingAt = to + Math.max(0, plan.hands - elapsed) / 1000;
  const wound = 1 - easeInOutSine(elapsed / plan.hands);
  return windingAt - windDistance(from, windingAt) * wound;
}

/**
 * The hands, part way through a wind: `elapsed` milliseconds into `plan`, on
 * the way from `from` to the live moment `to`.
 *
 * The hour and the minute hand are simply `windMoment` drawn. The second hand
 * is not on that moment at all — it is hacked where it stood until the other
 * two are right, and then let go.
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
  /** The travel the crown has still to make up: how far behind the moment it
   *  is winding towards the hands are being held. */
  const behind = windingAt - windMoment(from, to, elapsed, plan);
  const synced = easeInOutSine((elapsed - plan.hands) / plan.second);
  const set = handTurns(windingAt);
  return {
    hour: set.hour - behind / 120,
    minute: set.minute - behind / 10,
    second:
      beatTurns(syncAt, beats).second -
      secondGap(from, syncAt, beats) * (1 - synced),
  };
}

function clampMs(ms: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, ms)));
}
