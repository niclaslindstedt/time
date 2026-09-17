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
// beat a drawer that has to be opened first.
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

const ICONS: Record<NavTab, (props: { className?: string }) => ReactNode> = {
  today: ClockIcon,
  log: LogIcon,
  report: ChartIcon,
  projects: FolderIcon,
};

export function BottomNav({
  active,
  onSelect,
}: {
  active: Tab;
  onSelect: (tab: NavTab) => void;
}) {
  const t = useT();
  const items = useMemo(
    () =>
      TABS.map((tab) => ({
        id: tab,
        label: t(`nav.${tab}` as const),
        icon: ICONS[tab],
      })),
    [t],
  );
  return (
    <NavBar
      items={items}
      active={active}
      onSelect={onSelect}
      label={t("app.name")}
      className="app-bottom-nav"
    />
  );
}
