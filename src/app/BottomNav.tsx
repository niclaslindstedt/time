// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, type ReactNode } from "react";

import {
  BottomNav as NavBar,
  FolderIcon,
  stepDirection,
} from "@niclaslindstedt/oss-framework/components";

import { ChartIcon, ClockIcon, LogIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";

// The app's navigation: four tabs pinned to the bottom of the screen, the
// same shell the sibling cycle app uses. This app is used one-handed, on the
// way into a room or out of one, for a few seconds — thumb-reachable targets
// beat a drawer that has to be opened first. On a desk the same four move to
// the top bar (`TopBar.tsx`), in this order, and the bottom bar is not drawn.
//
// Laid down, the bar goes to the top as well — two tabs into the left corner
// and two into the right, in the same order (`styles.css`, the shell laid
// down). A phone on its side has width going spare and no height at all, and
// a bar across the foot of a 393px window is the one thing on that screen
// taking height from the watch. In the corners the tabs take none: the
// middle of that strip is empty, which is where the dial stands. It is the
// same four in the same order, still one press away — the thumb has further
// to go, and on a phone being propped against something rather than held
// that is the better trade.
//
// Over the watch, where there is no bar above it, the strip *floats*: the
// screen runs the whole height of the window under it and the dial is
// centred on the window rather than on what is left over. That is `bare` —
// the shell already works out whether the top bar has anything to draw
// (`topBarNeeded`), and where it has, the strip takes its own row above it
// instead of lying over it.
//
// The order is the order of the questions: what is happening *now* (Today),
// what happened today and on other days (Log), what it adds up to (Report),
// and what it is for (Projects). Settings is not a place you are but a thing
// you do, so it lives on the top bar.

/** Every screen the shell can show. */
export type Tab = "today" | "log" | "report" | "projects" | "settings";

/** The screens that are *destinations* — the ones the bottom bar carries and
 *  a swipe moves between. */
export type NavTab = "today" | "log" | "report" | "projects";

export const TABS: NavTab[] = ["today", "log", "report", "projects"];

export function isNavTab(tab: Tab): tab is NavTab {
  return (TABS as Tab[]).includes(tab);
}

export type ScreenEnter = "forward" | "back" | "none";

/** How a move from one screen to another should animate: in from the side
 *  the bar's order puts it on, or a fade for Settings, which is off the bar. */
export function screenEnter(from: Tab, to: Tab): ScreenEnter {
  return stepDirection(TABS, from as NavTab, to as NavTab);
}

/** The glyph for each destination — the bottom bar's, and the desk's top
 *  tabs', so a place is one shape on both shells. */
export const NAV_ICONS: Record<
  NavTab,
  (props: { className?: string }) => ReactNode
> = {
  today: ClockIcon,
  log: LogIcon,
  report: ChartIcon,
  projects: FolderIcon,
};

export function BottomNav({
  active,
  onSelect,
  bare = false,
}: {
  active: Tab;
  onSelect: (tab: NavTab) => void;
  /** Whether the screen under it has no bar of its own — over the watch,
   *  which is where the strip may float rather than take a row. */
  bare?: boolean;
}) {
  const t = useT();
  const items = useMemo(
    () =>
      TABS.map((tab) => ({
        id: tab,
        label: t(`nav.${tab}` as const),
        icon: NAV_ICONS[tab],
      })),
    [t],
  );
  return (
    <NavBar
      items={items}
      active={active}
      onSelect={onSelect}
      label={t("app.name")}
      className={`app-bottom-nav${bare ? " app-nav-floating" : ""}`}
    />
  );
}
