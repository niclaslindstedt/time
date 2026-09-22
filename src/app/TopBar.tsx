// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { ReactNode } from "react";

import { CogIcon } from "@niclaslindstedt/oss-framework/components";

import { NAV_ICONS, TABS, type NavTab, type Tab } from "./BottomNav.tsx";
import { AppMarkIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import { KEY_HINT } from "./shortcuts.ts";

// The bar across the top: the project's mark in the left corner when there is
// something to switch between, the app's mark and name, the sync glyph, and
// the cog.
//
// It is the sibling cycle bar's geometry — a bordered row at `px-4 py-3` with
// the action cluster on the right — because these are the same app family and
// a header that lands at a different height on each of them reads as three
// unrelated apps rather than one set. The top-up of `padding-top` comes from
// the stylesheet (`.app-header`), which takes the larger of the row's own
// padding and the status-bar inset.
//
// On a desk (`useDesk`, `shape.ts`) the four destinations sit here too, in
// the middle of the bar, in the bottom bar's order. That is where a desktop web app keeps
// its navigation — the top of the window, where the eye starts — and it
// leaves the whole height below for the screen. It is a row of tabs and not
// a menubar: the browser already has one of those, and File / Edit / View
// over an app with four places to be would be chrome pretending to be depth.
// The cog stays on the right, on both shells, because Settings is a thing you
// do and leave rather than a place you are.
//
// Except over the watch. The dial prints the app's name under twelve and
// carries the cog in a window above six, the way a watch face carries its
// maker and its date, so while Today is on screen the bar draws neither: on
// the desk it is the tabs and whatever the right-hand cluster has, and on
// the phone — where it would be a rule with nothing above it — `App` leaves
// it out altogether unless there is a project to switch or a cloud to show.

type Props = {
  active: Tab;
  onOpenSettings: () => void;
  /** The desk's tabs. On the phone the bottom bar carries them and this is
   *  left out. */
  onSelect?: (tab: NavTab) => void;
  /** Whether the desk's Settings panel is open, which lights the cog. */
  settingsOpen?: boolean;
  /** The cloud glyph, when there is a cloud. */
  syncSlot?: ReactNode;
  /** The project picker, when there is more than one project. With a
   *  single project there is nothing to choose, and the slot stays empty
   *  rather than showing a control with one option.
   *
   *  It sits in the *left* corner, before the wordmark — the corner an app
   *  puts the thing it is currently looking at in, and the one corner the
   *  watch leaves empty. It used to be a select on the right carrying the
   *  project's name, which on a phone over Today was the whole contents of
   *  the bar: a menu bar for one word. */
  projectSlot?: ReactNode;
  /** The watch is on screen, and carries the name and the cog itself. */
  watch?: boolean;
};

/** Whether the bar has anything to draw for a screen: on the phone over the
 *  watch, only the two slots — nothing, most days. */
export function topBarNeeded(props: {
  watch?: boolean;
  onSelect?: unknown;
  syncSlot?: ReactNode;
  projectSlot?: ReactNode;
}): boolean {
  if (!props.watch || props.onSelect) return true;
  return Boolean(props.syncSlot || props.projectSlot);
}

export function TopBar({
  active,
  onOpenSettings,
  onSelect,
  settingsOpen = false,
  syncSlot,
  projectSlot,
  watch = false,
}: Props) {
  const t = useT();
  const onSettings = active === "settings" || settingsOpen;
  return (
    <header className="app-header relative flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-3 px-4 pb-3">
      <div className="flex min-w-0 shrink items-center gap-2">
        {projectSlot}
        {watch ? (
          // The dial has the name. The bar keeps its height, so the tabs and
          // the slots land where they do on every other screen.
          <div aria-hidden="true" className="h-9 w-0 shrink-0" />
        ) : (
          <h1 className="app-wordmark flex min-w-0 items-center gap-2 text-accent">
            <AppMarkIcon className="h-6 w-6 shrink-0" />
            <span className="truncate">{t("app.name")}</span>
          </h1>
        )}
      </div>

      {/* Centred on the bar rather than between the two clusters, so the tabs
          stay put when the project switcher comes and goes. */}
      {onSelect && (
        <nav
          aria-label={t("app.name")}
          className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 lg:flex"
        >
          {TABS.map((tab) => {
            const Icon = NAV_ICONS[tab];
            const on = active === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onSelect(tab)}
                aria-current={on ? "page" : undefined}
                className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                  on
                    ? "bg-accent/15 text-fg-bright"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${on ? "text-accent" : "text-muted"}`}
                />
                {t(`nav.${tab}` as const)}
              </button>
            );
          })}
        </nav>
      )}

      <div className="flex shrink-0 items-center gap-2">
        {syncSlot}
        {!watch && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t("nav.settings")}
            aria-current={active === "settings" ? "page" : undefined}
            aria-expanded={onSelect ? settingsOpen : undefined}
            title={
              onSelect
                ? `${t("nav.settings")} (${KEY_HINT.settings})`
                : t("nav.settings")
            }
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-accent transition-colors ${
              onSettings ? "bg-accent/15" : "hover:bg-surface-2"
            }`}
          >
            <CogIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
