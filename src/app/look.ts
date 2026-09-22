// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import {
  DEFAULT_THEME_APPEARANCE,
  type ThemeAppearance,
} from "@niclaslindstedt/oss-framework/theme";

import type { ThemeChoice } from "./useAppSettings.ts";

// The app's look. The framework ships a dozen palettes and a full appearance
// picker; this app exposes exactly two — one light, one dark — plus "follow
// the device". A tool that gets a few taps a day earns
// nothing from a theme gallery, and every extra palette is another surface to
// keep legible.
//
// Everything else (font family, scale, density, elevation) stays at the
// framework defaults, except two: the sans font, because the screens are
// prose and numbers rather than code, and the corner radius.
//
// The radius is the framework's largest preset. It is projected onto
// `--radius-sm` / `--radius-md` / `--radius-lg` on <html> at paint time, which
// is what every `rounded-*` utility in this app *and* in the framework's own
// components resolves against — so one line here rounds the buttons, the
// cards, the modals and the segmented controls together, and nothing can drift
// apart later by being styled one corner at a time. The two ends of the scale
// the engine does not write (`rounded` and `rounded-xl` upwards) are matched to
// it in `styles.css`, so the ramp stays in order.

/** The framework preset behind each of the three choices. */
const PRESET = {
  light: "githubLight",
  dark: "githubDark",
  system: "system",
} as const;

/** Project the user's theme choice onto the framework's appearance shape. */
export function appearanceFor(choice: ThemeChoice): ThemeAppearance {
  return {
    ...DEFAULT_THEME_APPEARANCE,
    theme: PRESET[choice],
    fontFamily: "sans",
    ui: { ...DEFAULT_THEME_APPEARANCE.ui, radius: "lg" },
  };
}

/** The look the app boots in before the persisted settings have been read —
 *  the same "follow the device" default `DEFAULT_SETTINGS` carries, so the
 *  first paint never flashes the wrong side. */
export const APP_LOOK: ThemeAppearance = appearanceFor("system");

// ── The clock ───────────────────────────────────────────────────────────────
// The Today screen's clock is drawn as a wrist watch: a face in a colour of
// its own, applied hour markers, thin hands, and the day laid over it as one
// ring. What it looks like is chosen in Settings, either as one of nine
// presets — each a combination a real dial is often seen in — or piece by
// piece under "Custom".
//
// The face colour is the one deliberate exception to the two-themes rule
// above. A watch face is an object with a colour of its own, not a surface of
// the UI: a black dial is black on the light theme and a white one white on
// the dark, the way a watch on a wrist is. Nothing on the face is the theme's
// but the day itself — time at work in the accent, breaks in the flag colour,
// a kind of work in the hue the report gave it — so the dial can be any of the
// eight below without a second palette leaking into the app around it.
//
// Every option is an id and a spec here, so the settings store can validate
// what it reads back, the dial can look each one up, and the tests can walk
// them all.

// ── The face ──
// The eight colours a dial is most often seen in, by how often they sell:
// black first, then silver, blue, white, green, and the warmer ones a dress
// watch wears. The ink is what the markers and hands are printed in — dark on
// a light face, white on a dark one — because the print has to read against
// the face under it, and one ink for all eight would vanish on half of them.
// The applied markers and the hands are not printed at all: they are steel,
// and what they look like is the light on them (`STEEL`, and `sheen.ts`).

export type DialFace =
  | "white"
  | "silver"
  | "slate"
  | "black"
  | "blue"
  | "green"
  | "burgundy"
  | "champagne";

export type DialFaceSpec = {
  /** The dial's colour at its centre, and towards its edge — a sunburst
   *  finish is a gradient, and a flat one is the same colour twice. */
  dial: string;
  edge: string;
  /** What the *printing* on the face is in: the numerals, the minute track,
   *  the name and the movement's word, and the second hand. The applied
   *  markers and the hands are steel instead (see `STEEL`). */
  ink: string;
  /** The bezel round the face. */
  bezel: string;
  /** Whether the ink is light on dark — what the break-end chips read. */
  dark: boolean;
};

export const DIAL_FACES: DialFace[] = [
  "white",
  "silver",
  "slate",
  "black",
  "blue",
  "green",
  "burgundy",
  "champagne",
];

export const DIAL_FACE: Record<DialFace, DialFaceSpec> = {
  white: {
    dial: "#fbfbf9",
    edge: "#e9e8e3",
    ink: "#1d1d1f",
    bezel: "#b9b9b4",
    dark: false,
  },
  // A textured silver-white, the default: the dial that reads in every light.
  silver: {
    dial: "#e6e7e6",
    edge: "#c4c6c7",
    ink: "#1f2124",
    bezel: "#a4a6a8",
    dark: false,
  },
  slate: {
    dial: "#5c6168",
    edge: "#3a3e44",
    ink: "#f4f5f6",
    bezel: "#8a8f96",
    dark: true,
  },
  black: {
    dial: "#232426",
    edge: "#0c0c0d",
    ink: "#f2f2f0",
    bezel: "#6f7074",
    dark: true,
  },
  blue: {
    dial: "#1f4b8f",
    edge: "#0f2a55",
    ink: "#f4f6fa",
    bezel: "#8d9bb3",
    dark: true,
  },
  green: {
    dial: "#1f5a44",
    edge: "#0e3327",
    ink: "#f1f5f2",
    bezel: "#8fa79b",
    dark: true,
  },
  burgundy: {
    dial: "#6b1f2c",
    edge: "#3d0f18",
    ink: "#f6ece8",
    bezel: "#a88a8d",
    dark: true,
  },
  champagne: {
    dial: "#e6d3a3",
    edge: "#c9ae6c",
    ink: "#3a2c14",
    bezel: "#b39a5e",
    dark: false,
  },
};

// ── The numerals' typeface ──
// Nine faces, one for each family of dial typography a watch is likely to
// carry: the plain grotesque of a modern sports dial, the same grotesque at
// the light weight a sixties dress dial prints its minute ring in, the
// geometric sans of the Bauhaus school, the tall condensed sans of a field or
// pilot's watch, the engineered sans of an instrument, a text serif, the
// high-contrast didone of a dress watch, the inscriptional capitals a Roman
// dial is cut in, and a mono. Every one is bundled from `@fontsource` and
// served from this origin (see `main.tsx`) — a webfont host is the one
// request this app does not make.

export type DialFont =
  | "grotesque"
  | "light"
  | "geometric"
  | "condensed"
  | "engineered"
  | "serif"
  | "didone"
  | "inscribed"
  | "mono";

export type DialFontSpec = {
  family: string;
  /** The one weight the family is bundled in. */
  weight: number;
  /** Half the width of a two-digit numeral, as a share of the font size:
   *  what has to clear the ring (see `dialLayout`). A Roman VIII is about
   *  twice this, and `ROMAN_WIDTH` says so. */
  widthFactor: number;
  /** Size against the chosen step, because a condensed digit and a serif
   *  capital do not read the same at one size. */
  scale: number;
};

export const DIAL_FONTS: DialFont[] = [
  "grotesque",
  "light",
  "geometric",
  "condensed",
  "engineered",
  "serif",
  "didone",
  "inscribed",
  "mono",
];

export const DIAL_FONT: Record<DialFont, DialFontSpec> = {
  grotesque: {
    family: '"Inter", system-ui, sans-serif',
    weight: 700,
    widthFactor: 0.58,
    scale: 1,
  },
  // The light weight of the same family: the thin, even digits a chapter
  // ring is printed in, and the one weight that reads as print rather than
  // as an applied numeral.
  light: {
    family: '"Inter", system-ui, sans-serif',
    weight: 300,
    widthFactor: 0.56,
    scale: 1,
  },
  geometric: {
    family: '"Jost", "Futura", "Century Gothic", sans-serif',
    weight: 500,
    widthFactor: 0.55,
    scale: 1.05,
  },
  condensed: {
    family: '"Oswald", "Arial Narrow", sans-serif-condensed, sans-serif',
    weight: 500,
    widthFactor: 0.42,
    scale: 1.1,
  },
  engineered: {
    family: '"Barlow", "DIN", "Roboto", sans-serif',
    weight: 600,
    widthFactor: 0.52,
    scale: 1.05,
  },
  serif: {
    family: '"Source Serif 4", Georgia, "Times New Roman", serif',
    weight: 700,
    widthFactor: 0.55,
    scale: 1.05,
  },
  didone: {
    family: '"Playfair Display", "Didot", "Bodoni MT", Georgia, serif',
    weight: 700,
    widthFactor: 0.56,
    scale: 1.05,
  },
  inscribed: {
    family: '"Cinzel", "Trajan Pro", Georgia, serif',
    weight: 700,
    widthFactor: 0.66,
    scale: 0.95,
  },
  mono: {
    family:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    weight: 700,
    widthFactor: 0.6,
    scale: 0.95,
  },
};

/** How wide a Roman numeral is against an Arabic one: VIII is four capitals
 *  where 12 is two digits. */
export const ROMAN_WIDTH = 2;

// ── The metal ──
// What every applied part of the dial is made of: the markers screwed to the
// face, and the hands over them. Those are objects rather than colours — a
// block of steel has no shade of its own to print, only the light that is on
// it — so they are not drawn in the face's ink at all. The ink is for what is
// genuinely *printed*: the numerals, the minute track, the name and the
// movement's word, and the second hand, which is a hair too fine to be a
// polished thing.
//
// Steel is steel whatever the face under it, so one pair serves all eight —
// the tone a surface turned into the light has, and the one turned away from
// it. Which of the two any given surface wears is not a colour but a
// reckoning, and `sheen.ts` does it from where the light is.

export const STEEL = { light: "#f4f6f8", shade: "#7c838c" } as const;

// ── The hour markers ──
// The nine ways a dial marks its hours: applied batons (the commonest, with
// a double at twelve), the long solid blocks of a sixties dress dial — the
// same baton the whole way out to the ring, one wide one at twelve, a lumed
// plot on the ring at the end of each, and no track on the rim — the dots of
// a diver (a triangle at twelve, batons at the quarters),
// numerals at every hour, Roman numerals, numerals at the quarters only, the
// 3-6-9 layout of an expedition watch, the tapered wedges of a mid-century
// dress dial, and a bare minute track with the hours as longer ticks.

export type DialMarkers =
  | "batons"
  | "blocks"
  | "dots"
  | "numerals"
  | "roman"
  | "quarters"
  | "threeSixNine"
  | "wedges"
  | "ticks";

/** What sits at one hour position. */
export type Marker =
  | "baton"
  | "doubleBaton"
  | "twinBaton"
  | "dot"
  | "triangle"
  | "wedge"
  | "arabic"
  | "roman"
  | "tick";

export type DialMarkersSpec = {
  /** The marker at each hour, indexed by `hour % 12` (twelve first). */
  at: (hour: number) => Marker;
  /** Sixty minute ticks round the rim, or a bare rim. */
  minuteTrack: boolean;
  /** How wide the applied markers are drawn, as a share of the width the
   *  hour size gives them. One for a baton, which is a bar; more for a style
   *  whose hours are *blocks*, which are a good half as wide again — that
   *  breadth is the difference between the two words, and it is measured
   *  off the dial the blocks are drawn after. */
  width: number;
  /** Whether the hours run the whole way out to the day's ring rather than
   *  stopping short of it, and are finished with a lumed plot printed on the
   *  ring itself. The sixties dress dial's arrangement: the hour is one long
   *  block of steel from the middle of the dial to the ring, and the lume is
   *  a dot on the ring at the end of it — which is also what leaves the
   *  block plain metal, with nothing painted on it. Only where the markers
   *  are *inside* the ring is there anything to reach; see `dialLayout`. */
  reachesRing: boolean;
};

export const DIAL_MARKER_STYLES: DialMarkers[] = [
  "batons",
  "blocks",
  "dots",
  "numerals",
  "roman",
  "quarters",
  "threeSixNine",
  "wedges",
  "ticks",
];

const quarter = (h: number) => h % 3 === 0;

export const DIAL_MARKERS: Record<DialMarkers, DialMarkersSpec> = {
  batons: {
    at: (h) => (h % 12 === 0 ? "doubleBaton" : "baton"),
    minuteTrack: true,
    width: 1,
    reachesRing: false,
  },
  // No track on the rim: the dial this is drawn for prints its minutes on
  // the ring (see `DIAL_RING.chapter`). And no gap before the ring either —
  // the block runs out to it and the lume is a plot on the ring.
  blocks: {
    at: (h) => (h % 12 === 0 ? "twinBaton" : "baton"),
    minuteTrack: false,
    width: 1.5,
    reachesRing: true,
  },
  dots: {
    at: (h) => (h % 12 === 0 ? "triangle" : quarter(h) ? "baton" : "dot"),
    minuteTrack: true,
    width: 1,
    reachesRing: false,
  },
  numerals: {
    at: () => "arabic",
    minuteTrack: true,
    width: 1,
    reachesRing: false,
  },
  roman: {
    at: () => "roman",
    minuteTrack: false,
    width: 1,
    reachesRing: false,
  },
  quarters: {
    at: (h) => (quarter(h) ? "arabic" : "baton"),
    minuteTrack: true,
    width: 1,
    reachesRing: false,
  },
  threeSixNine: {
    at: (h) => (h % 12 === 0 ? "triangle" : quarter(h) ? "arabic" : "baton"),
    minuteTrack: true,
    width: 1,
    reachesRing: false,
  },
  wedges: {
    at: () => "wedge",
    minuteTrack: false,
    width: 1,
    reachesRing: false,
  },
  ticks: { at: () => "tick", minuteTrack: true, width: 1, reachesRing: false },
};

/** Whether a marker is set in the numerals' typeface. */
export function isNumeral(marker: Marker): marker is "arabic" | "roman" {
  return marker === "arabic" || marker === "roman";
}
/** How a marker's top is shaped, which is what decides how it is drawn.
 *
 *  A **roof** is a flat plate with a ridge down the middle — two faces put
 *  together at an angle, tipping up where they meet — which is what an
 *  applied block, wedge or triangle is: each face is flat, so each is one
 *  tone, and which of the two is the bright one is where the light is. A
 *  **dome** is turned rather than folded, the round plot of a diver's dial,
 *  so the light comes back off it as a band that slides across as the light
 *  moves. **Print** is not a part at all: a numeral or a tick, in the face's
 *  ink, the same from every angle.
 *
 *  This is the whole difference between a dial you read the metal of and one
 *  you read the print of, and it is the marker's own — a block is a block on
 *  whichever dial it is screwed to. */
export type MarkerProfile = "roof" | "dome" | "print";

export function markerProfile(marker: Marker): MarkerProfile {
  if (marker === "tick" || isNumeral(marker)) return "print";
  return marker === "dot" ? "dome" : "roof";
}

/** Whether a marker is a part *applied* to the dial — polished metal, drawn
 *  from the light on it (`sheen.ts`) — rather than something printed on it. */
export function isApplied(marker: Marker): boolean {
  return markerProfile(marker) !== "print";
}

// ── The hours' size ──
// Eight steps, in the dial's 240-unit box: from the small numerals a dress
// watch prints at the rim to the ones a pilot's watch is read by. Applied
// markers scale with the step too, so a face with numerals at the quarters
// and batons between keeps them in proportion.

export type DialScale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const DIAL_SCALES: DialScale[] = [1, 2, 3, 4, 5, 6, 7, 8];

/** The numeral's font size at each step. */
export const DIAL_SCALE: Record<DialScale, number> = {
  1: 8,
  2: 10,
  3: 12,
  4: 14,
  5: 16,
  6: 19,
  7: 22,
  8: 26,
};

// ── Where the markers sit ──
// Against the day's ring: outside it, between the ring and the bezel; over
// it, on the ring itself, the way a chapter ring lies over a dial; or inside
// it, with the ring round them.

export type DialPlacement = "outside" | "over" | "inside";

export const DIAL_PLACEMENTS: DialPlacement[] = ["outside", "over", "inside"];

// ── The day's ring ──
// What the day is drawn on. A groove is the faint track the day's bands lie
// in, and an empty morning shows where they will go. A chapter ring is the
// printed minute ring a sixties dress dial wears at its rim — sixty ticks
// and a numeral every five, 05 round to 60 — and the day *fills* it: a
// stretch at work paints the ring in the accent, a kind of work in its hue,
// a break in the flag colour, and the minutes stay printed over whatever the
// day put under them. Like the face, the ring's own colours are the object's
// rather than the theme's: a deep blue, printed in white, whatever the face
// under it.

export type DialRing = "groove" | "chapter";

export type DialRingSpec = {
  /** Whether the minutes are printed on the ring. */
  printed: boolean;
  /** The ring's own colour, and what the minutes are printed in — the
   *  chapter ring's. A groove has neither: it is the face's ink, faintly. */
  fill: string | null;
  ink: string | null;
};

export const DIAL_RINGS: DialRing[] = ["groove", "chapter"];

export const DIAL_RING: Record<DialRing, DialRingSpec> = {
  groove: { printed: false, fill: null, ink: null },
  chapter: { printed: true, fill: "#1d2a4b", ink: "#eef1f6" },
};

// ── The movement ──
// How the second hand moves. A quartz movement steps once a second. A
// mechanical one beats several times a second — eight, at the 28 800 vph most
// modern calibres run at (six is the older rate) — so the hand walks in small
// steps. A glide movement runs the hand round continuously, with no step at
// all. The hour and minute hands sweep either way; only the second hand shows
// the movement behind it.

export type DialMovement = "quartz" | "mechanical" | "sweep";

export const DIAL_MOVEMENTS: DialMovement[] = ["quartz", "mechanical", "sweep"];

/** Steps per second: one, eight, or none. */
export const DIAL_MOVEMENT: Record<DialMovement, { beats: number | null }> = {
  quartz: { beats: 1 },
  mechanical: { beats: 8 },
  sweep: { beats: null },
};

// ── The hands ──
// What the hands are *shaped* like; what they are made of is not a choice,
// because a hand is steel on every wrist watch there is (see `STEEL`). Two
// sets: the plain bar, the same width from the cap to its tip and domed
// across it, and the pointed hand of a sixties dress watch — sides dead
// straight for most of its length and then closing on its tip over the last
// of it, with a ridge down it that takes the light on one side and lies in
// shade on the other. Straight and then sharp, measured off the dial: not a
// wedge that narrows the whole way, which is the shape a drawn watch usually
// gets instead.
//
// The tip is an *angle*, not a share of the length, because that is what it
// is on the watch: the sides come off the hand at the bevel a hand is
// finished at, and what that costs in length depends on how wide the hand
// was — so an hour hand, being the broader of the two, carries a longer
// point than a minute hand and both are finished the same way. Taken as a
// share of the length instead, the minute hand — nearly three times as long
// as it is wide — closed over a sixth of itself, which is a spear rather
// than a watch hand. And the tip is not nothing: a hand ends on a small flat
// where the two bevels stop short of meeting (`tip`), which is the
// difference between a hand and a needle.
//
// The second hand is the exception either way: a hair that fine has no
// surface to catch anything, so it stays the face's ink, which is also what
// a dial with polished hands wears against the polish. What it does get is a
// tail, and the tail is where the two sets part: a sports hand balances
// itself with a disc on a stub, a dress watch's with a long blade that
// leaves the hub as the same hair and swells as it goes, so the weight is
// out at the end where it does the balancing rather than under the cap where
// it would do none.

export type DialHands = "bar" | "tapered";

export type DialHandsSpec = {
  /** The width the hour and minute hands are drawn at, and the width they
   *  end at, as shares of the width `HANDS` in `clock.ts` gives them. A bar
   *  is one and one. A pointed hand is a little broader than the width it is
   *  given, because it carries that width the whole way rather than starting
   *  wide and giving it back, and it ends on the flat its two bevels stop
   *  short of meeting at — small, and not nothing. */
  base: number;
  tip: number;
  /** How steeply the sides close on that flat, in degrees off the hand's own
   *  axis, which is the bevel the hand is finished at. Zero for a bar, which
   *  has no point at all; `clock.ts`'s `handPoint` is what turns it into a
   *  length for a hand of a given width. */
  bevel: number;
  /** How far the hand's tail reaches past the axle, in the dial's units. A
   *  bar gets a stub, which reads as a hand pivoted rather than hinged at the
   *  centre; a tapered hand gets none, because its widest point *is* the hub
   *  and a tail past it would flare out from under the cap. */
  boss: number;
  /** Whether the hand has a shape to it rather than being one even bar: a
   *  pointed hand is drawn as two facets either side of its ridge, a bar as
   *  one domed bar. */
  taper: boolean;
  /** What balances the second hand past the axle: the disc of a sports hand
   *  on a stub of the same hair, or the long widening blade of a dress
   *  watch — a wedge rather than a hair, which is the counterweight you see
   *  across a room. */
  counterweight: "disc" | "blade";
  /** How far that tail reaches past the axle, as a share of `HANDS.tail` in
   *  `clock.ts`, and how wide it is at its far end, as a share of the second
   *  hand's own width. A hair is one and one; a blade is longer than the stub
   *  it replaces and several times as wide by the end of it — it leaves the
   *  hub as the hair and swells from there, the way a counterweight has to
   *  if it is to weigh anything. */
  tail: number;
  tailWidth: number;
};

export const DIAL_HAND_SETS: DialHands[] = ["bar", "tapered"];

export const DIAL_HANDS: Record<DialHands, DialHandsSpec> = {
  bar: {
    base: 1,
    tip: 1,
    bevel: 0,
    boss: 5,
    taper: false,
    counterweight: "disc",
    tail: 1,
    tailWidth: 1,
  },
  // The bevel and the flat are measured off a photograph of a sixties dress
  // watch: its hour hand runs dead straight for five sixths of its length
  // and then closes at about 22° off the axis onto a flat a seventh of the
  // hand's width — which on a hand that broad is a long point, and on these
  // much finer ones is the short angled tip the same bevel gives.
  tapered: {
    base: 1.35,
    tip: 0.2,
    bevel: 22,
    boss: 0,
    taper: true,
    counterweight: "blade",
    tail: 1.9,
    tailWidth: 4,
  },
};

// ── The dial, put together ──

export type DialConfig = {
  face: DialFace;
  font: DialFont;
  markers: DialMarkers;
  scale: DialScale;
  placement: DialPlacement;
  ring: DialRing;
  movement: DialMovement;
  hands: DialHands;
};

/** The nine presets: combinations a real dial is often seen in, named for
 *  what they look like rather than for anyone who makes one. */
export type DialPreset =
  | "snowfield"
  | "abyss"
  | "trailhead"
  | "summit"
  | "boulevard"
  | "studio"
  | "tidewater"
  | "harvest"
  | "uptown";

export const DIAL_PRESETS: DialPreset[] = [
  "snowfield",
  "abyss",
  "trailhead",
  "summit",
  "boulevard",
  "studio",
  "tidewater",
  "harvest",
  "uptown",
];

export const DIAL_PRESET: Record<DialPreset, DialConfig> = {
  // A silver-white textured face, applied batons, and a hand that glides.
  snowfield: {
    face: "silver",
    font: "grotesque",
    markers: "batons",
    scale: 4,
    placement: "inside",
    ring: "groove",
    movement: "sweep",
    hands: "bar",
  },
  // The diver: black, dots with a triangle at twelve, a mechanical beat.
  abyss: {
    face: "black",
    font: "grotesque",
    markers: "dots",
    scale: 5,
    placement: "inside",
    ring: "groove",
    movement: "mechanical",
    hands: "bar",
  },
  // The field watch: numerals at every hour in a tall condensed sans.
  trailhead: {
    face: "black",
    font: "condensed",
    markers: "numerals",
    scale: 6,
    placement: "outside",
    ring: "groove",
    movement: "mechanical",
    hands: "bar",
  },
  // The expedition dial: 3, 6 and 9, and batons between.
  summit: {
    face: "black",
    font: "engineered",
    markers: "threeSixNine",
    scale: 6,
    placement: "inside",
    ring: "groove",
    movement: "mechanical",
    hands: "bar",
  },
  // The dress watch: white, Roman numerals in a high-contrast serif, quartz.
  boulevard: {
    face: "white",
    font: "didone",
    markers: "roman",
    scale: 4,
    placement: "over",
    ring: "groove",
    movement: "quartz",
    hands: "bar",
  },
  // The Bauhaus dial: small geometric numerals at the rim, nothing else.
  studio: {
    face: "white",
    font: "geometric",
    markers: "numerals",
    scale: 3,
    placement: "outside",
    ring: "groove",
    movement: "mechanical",
    hands: "bar",
  },
  // A blue sunburst with wedges.
  tidewater: {
    face: "blue",
    font: "grotesque",
    markers: "wedges",
    scale: 4,
    placement: "inside",
    ring: "groove",
    movement: "mechanical",
    hands: "bar",
  },
  // Champagne, numerals at the quarters in a serif, quartz.
  harvest: {
    face: "champagne",
    font: "serif",
    markers: "quarters",
    scale: 4,
    placement: "inside",
    ring: "groove",
    movement: "quartz",
    hands: "bar",
  },
  // The sixties dress watch: a silver dial, long applied blocks, tapered
  // steel hands, and the day drawn on a deep blue minute ring printed in a
  // light grotesque. An automatic, so the dial says so under the name. The
  // default: it is the dial with the most on it, and the first thing a new
  // reader sees is a watch worth looking at.
  uptown: {
    face: "silver",
    font: "light",
    markers: "blocks",
    scale: 7,
    placement: "inside",
    ring: "chapter",
    movement: "mechanical",
    hands: "tapered",
  },
};

export const DEFAULT_DIAL_PRESET: DialPreset = "uptown";

/** The dial a preset choice resolves to: the preset's own, or the custom
 *  configuration when "custom" is picked. A preset is looked up rather than
 *  copied, so a preset that changes in an update changes on every device
 *  that chose it. */
export function resolveDial(
  preset: DialPreset | "custom",
  custom: DialConfig,
): DialConfig {
  return preset === "custom" ? custom : DIAL_PRESET[preset];
}

// ── The size ──
// How much of the screen the dial takes. Which way round that is measured
// depends on the screen: a phone is a column, so the width runs out first
// and a size is a cap on it; a desk gives the dial a whole row of the Today
// grid, so the *height* runs out first and a size is a share of the window's
// height (`share`, read by `.app-dial-slot` in `styles.css` as
// `--dial-share`).
//
// Both are needed. A width cap alone made small and medium near enough the
// same watch on a desk — 15rem against 19rem, both lost in a tall window —
// while large, capped by nothing, came out two or three times either. A
// share of the height ramps properly: half the window, most of it, nearly
// all of it.

export type ClockSize = "small" | "medium" | "large";

export const CLOCK_SIZES: ClockSize[] = ["small", "medium", "large"];

export type ClockSizeSpec = {
  /** The dial's width cap on a phone held upright, where the screen is a
   *  column and the dial is as wide as it is allowed to be. The face is
   *  square, so this is its height too. Lifted wherever the dial stands in a
   *  row instead — the desk, and the phone laid on its side — where `share`
   *  sizes it. */
  maxWidth: string;
  /** The share of the window's height the dial takes in a row, 0 – 1. The row
   *  it stands in may have less to spare than that in a short window, in
   *  which case it gets what there is — which laid down is most of the time,
   *  and is why the two larger sizes look alike there. */
  share: number;
  /** Two break-end chips closer together than this on the dial would overlap.
   *  A smaller dial needs a wider gap: the chips do not shrink with it. */
  labelGap: number;
};

export const CLOCK_SIZE: Record<ClockSize, ClockSizeSpec> = {
  small: { maxWidth: "max-w-[15rem]", share: 0.5, labelGap: 22 },
  medium: { maxWidth: "max-w-[19rem]", share: 0.7, labelGap: 16 },
  large: { maxWidth: "max-w-none", share: 0.85, labelGap: 14 },
};

// ── The backlight ───────────────────────────────────────────────────────────
// Whether you are working is said with light rather than a word: a glow
// behind the dial, the way a television lights the wall behind it, that
// beats while the day is being counted, holds steady and dimmer on a break,
// and is off when you are not working. Like the face, it is the watch's own
// light rather than the theme's — a colour an object has — so it may be any
// of these without being a palette.
//
// Which is also why the light belongs to the *face* rather than to the app.
// A black instrument dial is lit by a warm lamp and a white dress dial by a
// quiet one; a dial that kept the last face's light would read as two
// watches at once. So every face has a light of its own (`FACE_BACKLIGHT`),
// a preset is lit by its face's, and the four knobs are opened up under
// Custom — the same place the rest of the dial is taken apart. The default
// is silver's, the light behind the default dial.
//
// One colour is missing from the table on purpose: the theme's accent. The
// backlight was the accent before it belonged to the faces, and silver
// inherited it — but the accent is the day's own colour, the band that means
// *at work* on the ring, the way the flag colour means *on a break*. Neither
// is a dial's to wear, which is why `kinds.ts` refuses both and why burgundy
// is lit rose rather than red. It stays on offer under Custom; no face is
// lit by it.
//
// Four knobs: the colour, the beat, how strong the light is, and how far it
// reaches. The last two are not the same thing — a dim wide halo and a
// bright tight one are both quiet in their own way — and the reach matters
// because the space around the dial is not the app's to spend: a halo wider
// than it runs into the bars and is cut off at them.

export type BacklightColor =
  "accent" | "white" | "amber" | "green" | "teal" | "blue" | "violet" | "rose";

export const BACKLIGHT_COLORS: BacklightColor[] = [
  "accent",
  "white",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "rose",
];

/** The CSS colour each light is, for the glow and for its swatch. */
export const BACKLIGHT_COLOR: Record<BacklightColor, string> = {
  accent: "var(--color-accent)",
  white: "#f4f4f5",
  amber: "#f59e0b",
  green: "#22c55e",
  teal: "#14b8a6",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  rose: "#f43f5e",
};

export type Backlight = {
  color: BacklightColor;
  /** How often it beats, in hertz. Zero is a steady light. */
  hz: number;
  /** How bright, 0 – 100. Zero is no light at all. */
  intensity: number;
  /** How far it reaches past the case, 0 – 100. Zero is a rim of light on
   *  the bezel; a hundred is a halo half the dial again. Brightness says how
   *  strong the light is, this says how much of the screen it lands on —
   *  which is the knob a dial that fills a desk window needs, because a halo
   *  wider than the space around the watch runs into the bars and is cut
   *  off there. */
  spread: number;
};

/** The beat's range: from steady to twice a second, which is as fast as a
 *  glow can go before it is a strobe. */
export const BACKLIGHT_HZ = { min: 0, max: 2, step: 0.05 };
export const BACKLIGHT_INTENSITY = { min: 0, max: 100, step: 5 };
export const BACKLIGHT_SPREAD = { min: 0, max: 100, step: 5 };

/**
 * How much of the colour the brightest setting is actually worth.
 *
 * A strength is a share of *this* rather than of full opacity, so the whole
 * scale sits under it: the loudest light the app can make is now about what
 * the quietest of the eight faces used to be, and the faintest step of the
 * slider is a suggestion of a colour behind the case rather than a light.
 *
 * The light is the thing that says the day is being counted, and it only has
 * to be noticed once. A halo that announces itself is a halo you end up
 * turning off, which loses the one thing it was for — so the ceiling is low
 * and the faces keep their differences under it. `FACE_BACKLIGHT`'s numbers
 * are what a face is worth *relative to the others*; what any of them comes
 * to on the screen is this.
 */
export const BACKLIGHT_CEILING = 0.45;

/** What a strength comes to on the screen: its share of the ceiling, as the
 *  alpha the halo is mixed at. The one place a strength becomes a colour, so
 *  the dial on Today and the cards in Settings cannot drift apart. */
export function glowAlpha(intensity: number): number {
  return (intensity / 100) * BACKLIGHT_CEILING;
}

/** The light each face is lit by: a colour that belongs with the dial, and a
 *  beat, a brightness and a reach in the same spirit. Two rules run through
 *  it. The colour is the face's own character rather than a match of its
 *  paint — a warm lamp behind the instrument dials, a cool one behind the
 *  cold faces, the theme's accent behind the neutral silver, which is where
 *  the app's default light comes from. And a dark face is lit more strongly
 *  and more widely than a light one: a dark dial is a shape the light is all
 *  that shows of, while a halo that blazed round a white dress dial would be
 *  the only thing in the room. */
export const FACE_BACKLIGHT: Record<DialFace, Backlight> = {
  // A crisp white dial: a white light, close in and quiet.
  white: { color: "white", hz: 0.2, intensity: 45, spread: 35 },
  // Steel has no colour of its own, so neither has its light: the same white
  // as the white face, carrying further because a sunburst silver has more
  // presence than a flat white one. It is the light behind the default dial,
  // and behind the sixties dress watch, whose own colour is the navy chapter
  // ring rather than anything the face does.
  silver: { color: "white", hz: 0.25, intensity: 60, spread: 50 },
  // Cool grey, so a cool light, and a quicker beat: this is the technical one.
  slate: { color: "teal", hz: 0.3, intensity: 60, spread: 50 },
  // The instrument dial, lit the way an instrument is: a warm lamp, the
  // strongest and widest of the eight, beating slowly.
  black: { color: "amber", hz: 0.2, intensity: 70, spread: 60 },
  blue: { color: "blue", hz: 0.3, intensity: 65, spread: 55 },
  green: { color: "green", hz: 0.25, intensity: 60, spread: 50 },
  // The two dress faces breathe slowest: a formal watch does not blink at you.
  burgundy: { color: "rose", hz: 0.15, intensity: 60, spread: 50 },
  champagne: { color: "amber", hz: 0.15, intensity: 50, spread: 40 },
};

/** The light a fresh install glows with: the default dial's face's own, so
 *  the default watch and its light are one choice rather than two. */
export const DEFAULT_BACKLIGHT: Backlight =
  FACE_BACKLIGHT[DIAL_PRESET[DEFAULT_DIAL_PRESET].face];

/** The light a dial choice resolves to, the way `resolveDial` resolves the
 *  dial: a preset is lit by its face's own light, and Custom by the one the
 *  settings hold. Stored per device like the rest of the look. */
export function resolveBacklight(
  preset: DialPreset | "custom",
  custom: Backlight,
): Backlight {
  return preset === "custom"
    ? custom
    : FACE_BACKLIGHT[DIAL_PRESET[preset].face];
}

/** The glow's geometry, in the numbers `.app-glow` is drawn from: how far
 *  the disc is inflated past the dial, where along its radius the light
 *  holds and where it has faded, and how soft its edge is. All of it in one
 *  place because the stops are not independent of the reach — the disc is a
 *  `closest-side` circle, so a wider reach moves the dial's own edge inward
 *  along the gradient, and the light has to hold out to *there* whatever the
 *  reach is or the halo either stops short of the case or washes over it. */
export type GlowGeometry = {
  /** How far past the dial the disc is inflated, as a percentage of the
   *  dial's width on each side. */
  inset: number;
  /** Where the light is still at full strength: the dial's own edge, as a
   *  percentage of the disc's radius. Everything inside it is behind the
   *  watch and never seen. */
  hold: number;
  /** Where it has fallen to a trace, as a percentage of the radius. */
  fade: number;
  /** How soft the edge is, in pixels. A wider halo is a softer one. */
  blur: number;
};

/** The spread, 0 – 100, to the glow's geometry. Pure, and the one place the
 *  arithmetic lives: `ClockFace.tsx` hands the result to CSS as custom
 *  properties. */
export function glowGeometry(spread: number): GlowGeometry {
  const t = Math.min(1, Math.max(0, spread / 100));
  // The reach, as a fraction of the dial's width on each side: a rim at
  // nothing, a halo half the dial again at everything.
  const reach = 0.05 + 0.25 * t;
  const hold = 0.5 / (0.5 + reach);
  return {
    inset: twoPlaces(reach * 100),
    hold: twoPlaces(hold * 100),
    fade: twoPlaces((hold + (1 - hold) / 2) * 100),
    blur: twoPlaces(8 + 16 * t),
  };
}

/** Two decimals: enough for a gradient stop, and short enough that the
 *  inline style the dial carries stays readable. */
function twoPlaces(n: number): number {
  return Math.round(n * 100) / 100;
}

/** A stored backlight, field by field, clamped into range. */
export function clampBacklight(value: unknown): Backlight {
  const raw = (
    typeof value === "object" && value !== null ? value : {}
  ) as Partial<Record<keyof Backlight, unknown>>;
  const hz = Number(raw.hz);
  const intensity = Number(raw.intensity);
  const spread = Number(raw.spread);
  return {
    color:
      typeof raw.color === "string" && raw.color in BACKLIGHT_COLOR
        ? (raw.color as BacklightColor)
        : DEFAULT_BACKLIGHT.color,
    hz: Number.isFinite(hz)
      ? Math.min(BACKLIGHT_HZ.max, Math.max(BACKLIGHT_HZ.min, hz))
      : DEFAULT_BACKLIGHT.hz,
    intensity: Number.isFinite(intensity)
      ? Math.round(
          Math.min(
            BACKLIGHT_INTENSITY.max,
            Math.max(BACKLIGHT_INTENSITY.min, intensity),
          ),
        )
      : DEFAULT_BACKLIGHT.intensity,
    // A device that stored a backlight before the spread was a setting gets
    // the default, which is the reach the glow always had.
    spread: Number.isFinite(spread)
      ? Math.round(
          Math.min(
            BACKLIGHT_SPREAD.max,
            Math.max(BACKLIGHT_SPREAD.min, spread),
          ),
        )
      : DEFAULT_BACKLIGHT.spread,
  };
}
