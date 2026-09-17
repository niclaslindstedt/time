// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMediaQuery } from "@niclaslindstedt/oss-framework/hooks";

// Whether the window is wide enough for the desk — the one-screen layout
// that lays the Log, Today and the Report side by side (see `Desk.tsx`) in
// place of the phone's four tabs.
//
// One number, shared with the stylesheet: Tailwind's `lg` is 64rem, and
// every `lg:` utility and `@media (min-width: 64rem)` rule in this app is
// this same edge. Below it the phone shell is what a tablet held upright
// gets too, because a column at 42rem still reads as the phone screen it is,
// and the desk needs the width for three.

export const DESK_QUERY = "(min-width: 64rem)";

export function useDesk(): boolean {
  return useMediaQuery(DESK_QUERY);
}
