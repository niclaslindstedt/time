// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Where the light is, and what it does to the polished parts of the dial.
//
// A printed marker is a colour: ink on a face, the same from every angle. An
// *applied* one is an object — a little block of steel screwed to the dial —
// and an object has no colour of its own to draw, only the light it is under.
// So the applied parts are drawn from a light: where it comes from, as a
// bearing on the dial, and how far off the crystal it stands.
//
// Two shapes take it. A **facet** is flat: it faces one way, so it is one
// tone, and that tone is how squarely it faces the light — which is what
// makes one face of a roof bright and the other dark, whether the roof is a
// block screwed to the dial or the ridge down a hand. A **dome** is turned:
// every angle across its width is somewhere on it, so the light comes back
// as a band that slides across as the light moves, with shoulders that shade
// like the facets they nearly are.
//
// All of it is arithmetic over two angles, so the tests can pin what a
// marker at four o'clock looks like under a light over the left shoulder
// without a renderer. Pure, and no clock: `useTilt.ts` supplies the light.

import { STEEL } from "./look.ts";

export type Light = {
  /** Where the light comes from, in degrees clockwise from twelve. The
   *  dial's own bearing, so it compares straight with a marker's hour angle
   *  and a hand's rotation. */
  angle: number;
  /** How far off the crystal the light stands, 0 – 1. Nothing is a light
   *  straight overhead — it lands down the middle of everything and both
   *  sides of a ridge are equal — and one is a light at the rim, which
   *  slides the band right off the edge and leaves one shoulder black. */
  throw: number;
};

/** The light a dial is drawn under when nothing is moving it: over the left
 *  shoulder, where a watch is photographed from and where the face's own
 *  sheen already comes from. */
export const AMBIENT: Light = { angle: 315, throw: 0.55 };

/** How bright the band along a dome's ridge is, at the near and far ends of
 *  the throw: the polish always catches something, and catches more of a
 *  light that is off to one side than one straight above. */
const CREST = { min: 0.78, max: 1 };

// ── The light, and the device under it ──
// A watch in your hand is under a real light in a real room, and the light
// does not move when you turn your wrist: the metal does. So the reflection
// slides, and that is the whole of what tilting the phone has to do to the
// dial — swing the light the other way round it.
//
// The tilt comes in as the two angles a device reports: `beta`, its
// front-to-back lean, and `gamma`, its side-to-side roll. Which way the
// light then lies is the *opposite* of where the device has leaned — a
// screen tipped towards you shows you what is above it, so the light comes
// up towards twelve — and how far off the crystal it stands is how far the
// device has gone from flat. `useTilt.ts` supplies the readings; this says
// what they mean.

/** The tilt that puts the light right at the rim: about the angle a phone
 *  sits at when you are reading it, so a normal grip is the full sweep
 *  rather than the first tenth of one. */
export const TILT_FULL = 40;

/** How far off the crystal the light stands with the device dead flat.
 *  Not nothing: a dial under a light straight overhead has both faces of
 *  every ridge the same grey, which reads as a drawing rather than as
 *  metal. */
const TILT_FLOOR = 0.3;

/** Under this much of a lean there is no direction to speak of, and the
 *  bearing an `atan2` of two jittering readings returns is noise. */
const TILT_DEAD = 0.02;

/**
 * The light a device at this lean is under. Both angles in degrees, as
 * `DeviceOrientationEvent` gives them.
 *
 * Flat, the light is where the drawing assumes it and barely off the
 * crystal. Leaned, it swings opposite the lean and stands further off the
 * further the device has gone — so turning the phone sweeps the band across
 * the markers and flips which face of each is the bright one, which is what
 * the metal does when you turn it.
 */
export function tiltLight(beta: number, gamma: number): Light {
  const lean = Math.hypot(clamp(beta, 90), clamp(gamma, 90));
  const off = Math.min(1, lean / TILT_FULL);
  const light = { throw: TILT_FLOOR + (1 - TILT_FLOOR) * off };
  if (off < TILT_DEAD) return { ...light, angle: AMBIENT.angle };
  // The bearing of the light in the dial's own frame: against the lean, and
  // clockwise from twelve the way every other angle here is.
  const angle = Math.atan2(-clamp(gamma, 90), clamp(beta, 90));
  return { ...light, angle: wrap((angle * 180) / Math.PI) };
}

/**
 * A flat facet's tone, 0 – 1, from the mid grey of steel seen edge-on:
 * `axis` is the bearing the part points along — a marker's hour angle, a
 * hand's rotation — and `side` which side of its ridge this is, -1 for the
 * one to its left and 1 for the one to its right.
 *
 * The facet faces square out from the axis, so it is brightest when the
 * light is straight across it and mid when the light runs along the part,
 * which is why a hand sweeping the dial keeps changing which of its two
 * halves is the bright one.
 */
export function facetTone(axis: number, side: -1 | 1, light: Light): number {
  const normal = axis + side * 90;
  const face = Math.cos(radians(light.angle - normal));
  return clamp01(0.5 + 0.5 * light.throw * face);
}

/** What the light makes of a domed block: the band and the two shoulders. */
export type Dome = {
  /** Where the band sits across the block's width, 0 at the left edge and 1
   *  at the right. */
  crest: number;
  /** The band's tone, and the two shoulders', all 0 – 1. */
  peak: number;
  left: number;
  right: number;
};

/**
 * A domed block under a light. `axis` is the bearing the block points along
 * — its hour angle — and the width it is measured across is the one at right
 * angles to that, left edge to right.
 *
 * The band sits where the curve turns the light back at you: down the middle
 * under a light straight overhead, and further towards whichever side the
 * light is on the further off the crystal that light stands. The shoulders
 * are the flat facets they nearly are, so a block always reads as one thing
 * lit from one side rather than as a stripe.
 */
export function domeSheen(axis: number, light: Light): Dome {
  // The light's reach across the block, -1 at its left edge and 1 at its
  // right: full when the light is broadside, nothing when it runs along the
  // block and the band stays down the middle.
  const across = Math.cos(radians(light.angle - (axis - 90)));
  const throw_ = clamp01(light.throw);
  return {
    crest: clamp01(0.5 - 0.5 * throw_ * across),
    peak: CREST.min + (CREST.max - CREST.min) * throw_ * Math.abs(across),
    left: facetTone(axis, -1, light),
    right: facetTone(axis, 1, light),
  };
}

/** A tone, 0 – 1, as the colour it makes of steel: the shade at nothing, the
 *  light at one, and the metal in between. */
export function steelTone(tone: number): string {
  return mix(STEEL.shade, STEEL.light, clamp01(tone));
}

/** Two colours mixed, `t` of the way from the first to the second. Both are
 *  six-digit hex, which is what the specs hold. */
export function mix(from: string, to: string, t: number): string {
  const a = rgb(from);
  const b = rgb(to);
  const at = (i: number) => Math.round(a[i]! + (b[i]! - a[i]!) * clamp01(t));
  return `rgb(${at(0)} ${at(1)} ${at(2)})`;
}

/**
 * How the crystal's own sheen is turned: the glare across a watch's glass
 * comes from the same light, so it swings with it. Degrees, to be handed
 * straight to the gradient's transform — zero when the light is where the
 * drawing assumes it.
 */
export function sheenTurn(light: Light): number {
  return wrap(light.angle - AMBIENT.angle);
}

/** An angle folded into a single turn, -180 to 180: what a transform wants,
 *  rather than the bearing a tilt may have counted past. */
export function wrap(degrees: number): number {
  const turn = ((degrees % 360) + 540) % 360;
  return round(turn - 180);
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** An angle held within `limit` either side of nothing, and never NaN: a
 *  sensor that has not read yet is a zero rather than a hole. */
function clamp(n: number, limit: number): number {
  return Number.isFinite(n) ? Math.min(limit, Math.max(-limit, n)) : 0;
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

const round = (n: number) => Math.round(n * 100) / 100;
