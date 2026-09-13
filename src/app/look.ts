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
// The dial's look is a *shape* choice, not a palette one: how many numerals it
// carries, whether it counts minutes, how heavy its hands are, and how much of
// the screen it takes. The two-themes rule above is about colour and stays
// exactly as it was — a clock look never introduces a hue, it reads the same
// accent, flag and category colours whichever one is picked.
//
// Three looks, because a clock is either the wall clock it imitates, a quiet
// ring, or a loud one — and a fourth would be a variation on one of those.

/** Which dial the Today screen draws. */
export type ClockLook = "classic" | "minimal" | "bold";

/** The face the hours are set in — and, for `roman`, what they are set as.
 *  A dial reads as a clock or as a chart largely by this: the same twelve
 *  hours in the UI's own sans read as data, and in a serif as a wall. */
export type ClockFont = "sans" | "serif" | "mono" | "roman";

/** How much of the screen it takes. */
export type ClockSize = "small" | "medium" | "large";

export const CLOCK_LOOKS: ClockLook[] = ["classic", "minimal", "bold"];
export const CLOCK_FONTS: ClockFont[] = ["sans", "serif", "mono", "roman"];
export const CLOCK_SIZES: ClockSize[] = ["small", "medium", "large"];

export type ClockLookSpec = {
  /** Every hour, the quarters only, or none at all. */
  numerals: "all" | "quarters" | "none";
  numeralSize: number;
  /** Sixty ticks rather than twelve — the minutes of a real wall clock. */
  minuteTicks: boolean;
  /** Stroke widths: presence and breaks on the outer ring, the kind of work
   *  on the inner one. */
  ring: number;
  innerRing: number;
  /** The three hands. A dial without a second hand is a calmer object; the
   *  arcs still redraw every second either way. */
  hands: { hour: number; minute: number; second: number | null };
};

export const CLOCK_LOOK: Record<ClockLook, ClockLookSpec> = {
  // The wall clock: all twelve numerals and sixty ticks.
  classic: {
    numerals: "all",
    numeralSize: 12,
    minuteTicks: true,
    ring: 14,
    innerRing: 8,
    hands: { hour: 5, minute: 3.5, second: 1.5 },
  },
  // The ring, and enough of a clock to read a hand position off.
  minimal: {
    numerals: "none",
    numeralSize: 12,
    minuteTicks: false,
    ring: 10,
    innerRing: 6,
    hands: { hour: 4, minute: 2.5, second: null },
  },
  // Across the room, one-handed, in a hurry.
  bold: {
    numerals: "all",
    numeralSize: 15,
    minuteTicks: false,
    ring: 19,
    innerRing: 11,
    hands: { hour: 7, minute: 5, second: 2 },
  },
};

export type ClockFontSpec = {
  /** The stack the numerals are set in. Every family named here is bundled
   *  from `@fontsource` and served from this origin (see `main.tsx`) — a
   *  webfont host is the one request this app does not make. */
  family: string;
  /** Arabic digits, or the numerals a station clock wears. */
  numerals: "arabic" | "roman";
  /** Half the width of the widest numeral, as a share of the font size: what
   *  has to clear the inner ring (see `numeralRadius`). Two digits for
   *  Arabic; IIII and VIII are twice that. */
  widthFactor: number;
  /** Size against the look's own, because a serif digit, a mono digit and a
   *  four-letter numeral do not read the same at one size. */
  scale: number;
};

/** The one place the dial's faces are named. The weight is 700 throughout —
 *  it is the weight each of these families is bundled in, and a dial numeral
 *  is read at a glance from across a desk. */
export const CLOCK_FONT: Record<ClockFont, ClockFontSpec> = {
  sans: {
    family: '"Inter", system-ui, sans-serif',
    numerals: "arabic",
    widthFactor: 0.55,
    scale: 1,
  },
  serif: {
    family: '"Source Serif 4", Georgia, "Times New Roman", serif',
    numerals: "arabic",
    widthFactor: 0.55,
    scale: 1.05,
  },
  mono: {
    family:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    numerals: "arabic",
    widthFactor: 0.6,
    scale: 0.95,
  },
  // The station clock: serif, and IIII rather than IV at four o'clock, which
  // is what clock faces have worn for centuries whatever Rome did.
  roman: {
    family: '"Source Serif 4", Georgia, "Times New Roman", serif',
    numerals: "roman",
    widthFactor: 1.1,
    scale: 0.95,
  },
};

export type ClockSizeSpec = {
  /** The dial's width cap. The face is square, so this is its height too. */
  maxWidth: string;
  /** Two break-end chips closer together than this on the dial would overlap.
   *  A smaller dial needs a wider gap: the chips do not shrink with it. */
  labelGap: number;
};

export const CLOCK_SIZE: Record<ClockSize, ClockSizeSpec> = {
  small: { maxWidth: "max-w-[11rem]", labelGap: 34 },
  medium: { maxWidth: "max-w-[15rem]", labelGap: 22 },
  large: { maxWidth: "max-w-[19rem]", labelGap: 16 },
};
