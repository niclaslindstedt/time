// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { ReactNode } from "react";

import { CogIcon } from "@niclaslindstedt/oss-framework/components";

import { AppMarkIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import type { Tab } from "./BottomNav.tsx";

// The bar across the top: the app's mark and name, the project switcher when
// there is something to switch between, the sync glyph, and the cog.
//
// It is the sibling cycle bar's geometry — a bordered row at `px-4 py-3` with
// the action cluster on the right — because these are the same app family and
// a header that lands at a different height on each of them reads as three
// unrelated apps rather than one set. The top-up of `padding-top` comes from
// the stylesheet (`.app-header`), which takes the larger of the row's own
// padding and the status-bar inset.

type Props = {
  active: Tab;
  onOpenSettings: () => void;
  /** The cloud glyph, when there is a cloud. */
  syncSlot?: ReactNode;
  /** The project picker, when there is more than one project. With a
   *  single project there is nothing to choose, and the slot stays empty
   *  rather than showing a control with one option. */
  projectSlot?: ReactNode;
};

export function TopBar({
  active,
  onOpenSettings,
  syncSlot,
  projectSlot,
}: Props) {
  const t = useT();
  const onSettings = active === "settings";
  return (
    <header className="app-header flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-3 px-4 pb-3">
      <h1 className="app-wordmark flex min-w-0 items-center gap-2 text-accent">
        <AppMarkIcon className="h-6 w-6 shrink-0" />
        <span className="truncate">{t("app.name")}</span>
      </h1>
      <div className="flex min-w-0 shrink items-center gap-2">
        {projectSlot}
        {syncSlot}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t("nav.settings")}
          aria-current={onSettings ? "page" : undefined}
          title={t("nav.settings")}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-accent transition-colors ${
            onSettings ? "bg-accent/15" : "hover:bg-surface-2"
          }`}
        >
          <CogIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
