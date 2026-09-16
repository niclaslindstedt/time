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
// ring. What it looks like is chosen in Settings, either as one of eight
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
// a light face, white on a dark one — because a hand has to read against the
// face under it, and one ink for all eight would vanish on half of them.

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
  /** What the markers, numerals and hands are printed in. */
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
// Eight faces, one for each family of dial typography a watch is likely to
// carry: the plain grotesque of a modern sports dial, the geometric sans of
// the Bauhaus school, the tall condensed sans of a field or pilot's watch,
// the engineered sans of an instrument, a text serif, the high-contrast
// didone of a dress watch, the inscriptional capitals a Roman dial is cut
// in, and a mono. Every one is bundled from `@fontsource` and served from
// this origin (see `main.tsx`) — a webfont host is the one request this app
// does not make.

export type DialFont =
  | "grotesque"
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

// ── The hour markers ──
// The eight ways a dial marks its hours: applied batons (the commonest, with
// a double at twelve), the dots of a diver (a triangle at twelve, batons at
// the quarters), numerals at every hour, Roman numerals, numerals at the
// quarters only, the 3-6-9 layout of an expedition watch, the tapered wedges
// of a mid-century dress dial, and a bare minute track with the hours as
// longer ticks.

export type DialMarkers =
  | "batons"
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
};

export const DIAL_MARKER_STYLES: DialMarkers[] = [
  "batons",
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
  },
  dots: {
    at: (h) => (h % 12 === 0 ? "triangle" : quarter(h) ? "baton" : "dot"),
    minuteTrack: true,
  },
  numerals: { at: () => "arabic", minuteTrack: true },
  roman: { at: () => "roman", minuteTrack: false },
  quarters: {
    at: (h) => (quarter(h) ? "arabic" : "baton"),
    minuteTrack: true,
  },
  threeSixNine: {
    at: (h) => (h % 12 === 0 ? "triangle" : quarter(h) ? "arabic" : "baton"),
    minuteTrack: true,
  },
  wedges: { at: () => "wedge", minuteTrack: false },
  ticks: { at: () => "tick", minuteTrack: true },
};

/** Whether a marker is set in the numerals' typeface. */
export function isNumeral(marker: Marker): marker is "arabic" | "roman" {
  return marker === "arabic" || marker === "roman";
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

// ── The dial, put together ──

export type DialConfig = {
  face: DialFace;
  font: DialFont;
  markers: DialMarkers;
  scale: DialScale;
  placement: DialPlacement;
  movement: DialMovement;
};

/** The eight presets: combinations a real dial is often seen in, named for
 *  what they look like rather than for anyone who makes one. */
export type DialPreset =
  | "snowfield"
  | "abyss"
  | "trailhead"
  | "summit"
  | "boulevard"
  | "studio"
  | "tidewater"
  | "harvest";

export const DIAL_PRESETS: DialPreset[] = [
  "snowfield",
  "abyss",
  "trailhead",
  "summit",
  "boulevard",
  "studio",
  "tidewater",
  "harvest",
];

export const DIAL_PRESET: Record<DialPreset, DialConfig> = {
  // A silver-white textured face, applied batons, and a hand that glides:
  // the default.
  snowfield: {
    face: "silver",
    font: "grotesque",
    markers: "batons",
    scale: 4,
    placement: "inside",
    movement: "sweep",
  },
  // The diver: black, dots with a triangle at twelve, a mechanical beat.
  abyss: {
    face: "black",
    font: "grotesque",
    markers: "dots",
    scale: 5,
    placement: "inside",
    movement: "mechanical",
  },
  // The field watch: numerals at every hour in a tall condensed sans.
  trailhead: {
    face: "black",
    font: "condensed",
    markers: "numerals",
    scale: 6,
    placement: "outside",
    movement: "mechanical",
  },
  // The expedition dial: 3, 6 and 9, and batons between.
  summit: {
    face: "black",
    font: "engineered",
    markers: "threeSixNine",
    scale: 6,
    placement: "inside",
    movement: "mechanical",
  },
  // The dress watch: white, Roman numerals in a high-contrast serif, quartz.
  boulevard: {
    face: "white",
    font: "didone",
    markers: "roman",
    scale: 4,
    placement: "over",
    movement: "quartz",
  },
  // The Bauhaus dial: small geometric numerals at the rim, nothing else.
  studio: {
    face: "white",
    font: "geometric",
    markers: "numerals",
    scale: 3,
    placement: "outside",
    movement: "mechanical",
  },
  // A blue sunburst with wedges.
  tidewater: {
    face: "blue",
    font: "grotesque",
    markers: "wedges",
    scale: 4,
    placement: "inside",
    movement: "mechanical",
  },
  // Champagne, numerals at the quarters in a serif, quartz.
  harvest: {
    face: "champagne",
    font: "serif",
    markers: "quarters",
    scale: 4,
    placement: "inside",
    movement: "quartz",
  },
};

export const DEFAULT_DIAL_PRESET: DialPreset = "snowfield";

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
// How much of the screen the dial takes. Small is the dial as it was;
// large fills the width, to the same margins as the Enter office button.

export type ClockSize = "small" | "medium" | "large";

export const CLOCK_SIZES: ClockSize[] = ["small", "medium", "large"];

export type ClockSizeSpec = {
  /** The dial's width cap. The face is square, so this is its height too. */
  maxWidth: string;
  /** Two break-end chips closer together than this on the dial would overlap.
   *  A smaller dial needs a wider gap: the chips do not shrink with it. */
  labelGap: number;
};

export const CLOCK_SIZE: Record<ClockSize, ClockSizeSpec> = {
  small: { maxWidth: "max-w-[15rem]", labelGap: 22 },
  medium: { maxWidth: "max-w-[19rem]", labelGap: 16 },
  large: { maxWidth: "max-w-none", labelGap: 14 },
};
