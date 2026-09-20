// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

// What shape the window is. The shell asks nothing else about the device —
// not what it is, not what is holding it, only how much room there is and
// which way round it lies. Three answers:
//
//   phone — a column. One screen at a time, the four destinations on the
//           bottom bar under the thumb, and the Today screen stacked: the
//           dial as wide as the column, the day's controls under it.
//   stand — the same phone laid on its side and propped against something.
//           Wide enough for three columns and far too short to stack them,
//           which is the one shape the column reads worst in: a dial as wide
//           as the window on a window half a dial tall arrives cropped at the
//           top of the screen, and everything that works the day is below the
//           fold. So the controls stand beside the dial the way the desk
//           stands them, and the dial is sized by the height rather than the
//           width. The bar stays at the bottom: this is still a phone, and
//           the thumb is still where it was.
//   desk  — wide enough for the desk shell: the destinations move to the top
//           bar, Settings slides in over the right-hand edge, and the Today
//           screen has room for air round all three columns.
//
// Two edges decide it, and both are shared with the stylesheet — `lg:` and
// `@media (min-width: 64rem)` are the first, the `wide:` variant and the
// landscape blocks in `styles.css` are the pair. Keep the numbers here and
// the numbers there the same.
//
// Pure, so `tests/shape_test.ts` can walk real windows — a phone stood up, a
// phone laid down, a tablet either way, a laptop — rather than a matcher
// nobody can read the edges out of.

/** The three shapes of window, in the order of how much room they have. */
export type Shape = "phone" | "stand" | "desk";

/** The desk's edge, in rem: Tailwind's `lg`. Below it the bottom bar is the
 *  navigation, whichever way the window lies. */
export const DESK_WIDTH = 64;

/** How short a landscape window has to be before stacking the Today screen
 *  stops working, in rem. Above it a landscape window is tall enough for the
 *  column — a tablet held sideways, a half-height browser window on a big
 *  screen — and the phone's own layout is still the right one. */
export const STAND_HEIGHT = 44;

/** CSS's own rem, for turning the two edges into pixels. Media queries in
 *  rem are measured against the root font size the *browser* was given
 *  rather than the one the page set, so this is a constant rather than a
 *  reading off `<html>`. */
const REM = 16;

export const DESK_QUERY = `(min-width: ${DESK_WIDTH}rem)`;

/** The stand, as a query: landscape, short, and not already the desk. The
 *  last clause is what keeps the two mutually exclusive, so a wide window
 *  that happens to be short is a desk rather than both. */
export const STAND_QUERY = [
  `(max-width: ${DESK_WIDTH - 1 / REM}rem)`,
  "(orientation: landscape)",
  `(max-height: ${STAND_HEIGHT}rem)`,
].join(" and ");

/**
 * The shape of a window of this size, in CSS pixels.
 *
 * `landscape` is CSS's own: a window as wide as it is tall counts, which is
 * what `orientation: landscape` resolves to for a square one.
 */
export function shapeOf(width: number, height: number): Shape {
  if (width >= DESK_WIDTH * REM) return "desk";
  if (width >= height && height <= STAND_HEIGHT * REM) return "stand";
  return "phone";
}
