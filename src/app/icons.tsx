// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// App-owned glyphs — the marks the framework's set has no vocabulary for
// because they are this app's domain: a clock, a coffee cup, a bar chart.
// Everything else (cog, cloud, chevrons, folder, plus, trash) comes from
// `@niclaslindstedt/oss-framework/components`, so the two sets only ever
// differ where the domain does.
//
// Traced on the same Lucide 24×24 grid at the same 2px stroke weight as the
// framework glyphs, and stroked with `currentColor`, so a mark from either
// set sits on the same line without retuning.

import type { CSSProperties, ReactNode } from "react";

import { GLYPH, type GlyphId } from "./kinds.ts";

export type IconProps = { className?: string };

function Glyph({
  className,
  style,
  children,
}: IconProps & { style?: CSSProperties; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * The app mark — a clock face with its two hands, the same shape as the
 * favicon and the install icon, drawn in `currentColor` on nothing.
 *
 * The difference from `public/icons/icon.svg` is the point of it: that file
 * paints the mark green on the dark install surface, because an icon's job is
 * to be found on a home screen next to its sibling apps. This one drops the
 * background and swaps the inks for `currentColor`, so inside the app the mark
 * is whatever the element around it is. Geometry is mirrored by hand into
 * `public/icons/icon.svg` and `scripts/generate-icons.mjs`.
 */
export function AppMarkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="12" />
      <path
        d="M50 50 V28 M50 50 L66 60"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Today — a clock. */
export function ClockIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Glyph>
  );
}

/** The log — a list. */
export function LogIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </Glyph>
  );
}

/** The report — a bar chart. */
export function ChartIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M3 21h18" />
      <path d="M7 21V10" />
      <path d="M12 21V4" />
      <path d="M17 21v-7" />
    </Glyph>
  );
}

/** A break — a cup. */
export function CupIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v2" />
      <path d="M10 2v2" />
      <path d="M14 2v2" />
    </Glyph>
  );
}

/** Entering — an arrow into a doorway. */
export function EnterIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </Glyph>
  );
}

/** Leaving — an arrow out of a doorway. */
export function LeaveIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Glyph>
  );
}

/** A tag — a kind of work. */
export function TagIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M12.6 2.6 21 11l-9.4 9.4a2 2 0 0 1-2.8 0L2.6 14.2a2 2 0 0 1 0-2.8L11 3a1.4 1.4 0 0 1 1-.4Z" />
      <path d="M7.5 7.5h.01" />
    </Glyph>
  );
}

/** A kind of time — a small hourglass, for the balance tiles. */
export function HourglassIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22" />
      <path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2" />
    </Glyph>
  );
}

/**
 * The mark a break type or a kind of work wears — one entry of `kinds.ts`'s
 * catalogue, drawn.
 *
 * `currentColor` is the whole trick: the element around it sets the colour, so
 * the same glyph is the flag colour on a break button and its own kind of
 * work's hue on a category chip, without this component knowing either.
 */
export function KindGlyph({
  id,
  className,
  style,
}: IconProps & { id: GlyphId; style?: CSSProperties }) {
  return (
    <Glyph className={className} style={style}>
      {GLYPH[id].d.map((d) => (
        <path key={d} d={d} />
      ))}
    </Glyph>
  );
}
