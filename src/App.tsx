// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  SelectPicker,
  SpinnerIcon,
  ToastViewport,
  createToastStore,
} from "@niclaslindstedt/oss-framework/components";
import { useSwipeNav } from "@niclaslindstedt/oss-framework/hooks";
import { LogViewer } from "@niclaslindstedt/oss-framework/logging";
import { UpdateToast, usePwaUpdate } from "@niclaslindstedt/oss-framework/pwa";
import {
  SyncDetailsModal,
  SyncStatus,
} from "@niclaslindstedt/oss-framework/sync";
import { useApplyTheme } from "@niclaslindstedt/oss-framework/theme";

import {
  BottomNav,
  isNavTab,
  screenEnter,
  TABS,
  type NavTab,
  type ScreenEnter,
  type Tab,
} from "./app/BottomNav.tsx";
import { demoBackendModule, useDemoData } from "./app/dev/useDemoData.ts";
import { EmployersScreen } from "./app/EmployersScreen.tsx";
import { useT } from "./app/i18n/index.ts";
import { LogScreen } from "./app/LogScreen.tsx";
import { appearanceFor } from "./app/look.ts";
import { logStore } from "./app/log.ts";
import { cacheIdForBase } from "./app/pwa.ts";
import { ReportScreen } from "./app/ReportScreen.tsx";
import { SettingsScreen } from "./app/SettingsScreen.tsx";
import { TodayScreen } from "./app/TodayScreen.tsx";
import { TopBar } from "./app/TopBar.tsx";
import { employerList } from "./app/types.ts";
import { useAppSettings } from "./app/useAppSettings.ts";
import { localDocBackend, useDocStore } from "./app/useDocStore.ts";
import { useSyncEngine } from "./app/useSyncEngine.ts";
import { status } from "./output.ts";

// A local-first time report built from the framework's shared surface. The
// app owns the document store, the day derivation and the five screens; the
// framework supplies the theme engine, the storage adapters behind sync, the
// charts, the bottom bar, and the PWA update lifecycle.
//
// Everything hangs off one document in localStorage. There is no server:
// cloud sync, when connected, is a copy of that same document in the user's
// own Dropbox or Drive.

// Module-scoped so the identity stays stable across renders (the framework's
// `useToasts` keys its subscription on the store object).
const toasts = createToastStore();

export function App() {
  const t = useT();
  const { settings, update } = useAppSettings();
  useApplyTheme(useMemo(() => appearanceFor(settings.theme), [settings.theme]));

  // Developer "Demo data" takeover: while the toggle is on, an in-memory
  // backend seeded with two months of invented days replaces the real
  // localStorage one for the session (see `useDemoData`).
  const demo = useDemoData();
  const backend = useMemo(() => {
    const module = demoBackendModule();
    if (demo.on && module) return module.createDemoBackend();
    return localDocBackend;
  }, [demo.on]);
  const store = useDocStore(backend);
  const sync = useSyncEngine(store, demo.on);

  // The employer on screen: the chosen one if it still exists, else the
  // first by name, else none. Never persisted as a fallback — a deleted
  // employer's id stays in settings until another is chosen, which is
  // harmless and keeps the choice if the deletion is undone by a restore.
  const employers = useMemo(() => employerList(store.data), [store.data]);
  const employer =
    (settings.activeEmployerId
      ? store.data.employers[settings.activeEmployerId]
      : undefined) ??
    employers[0] ??
    null;

  const [tab, setTab] = useState<Tab>("today");
  // Where the bottom nav was left, so closing Settings comes back to it.
  const [home, setHome] = useState<NavTab>("today");
  const [enter, setEnter] = useState<ScreenEnter>("none");
  // The Today screen's onboarding button lands on Employers with the editor
  // already open.
  const [openNewEmployer, setOpenNewEmployer] = useState(false);

  const show = useCallback(
    (next: Tab) => {
      setEnter(screenEnter(tab, next));
      if (isNavTab(next)) setHome(next);
      setTab(next);
    },
    [tab],
  );
  const toggleSettings = useCallback(() => {
    const target: Tab = tab === "settings" ? home : "settings";
    setEnter(screenEnter(tab, target));
    setTab(target);
  }, [tab, home]);

  // A swipe moves one tab along the bar and stops at its ends; from Settings
  // it goes back to the tab it was opened from.
  const main = useRef<HTMLElement>(null);
  const swipe = useCallback(
    (direction: 1 | -1) => {
      if (!isNavTab(tab)) {
        setEnter(screenEnter(tab, home));
        setTab(home);
        return;
      }
      const next = TABS[TABS.indexOf(tab) + direction];
      if (next !== undefined) show(next);
    },
    [tab, home, show],
  );
  useSwipeNav(main, swipe);

  const [syncDetailsOpen, setSyncDetailsOpen] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    logStore.setCaptureEnabled(settings.captureLogs);
  }, [settings.captureLogs]);

  const notice = useCallback((message: string) => {
    toasts.clear();
    toasts.push({ message, kind: "success", durationMs: 2500 });
  }, []);

  // A refused write: the document did not reach the disk, and nothing on the
  // screen would show it otherwise.
  useEffect(() => {
    if (store.writeFailures === 0) return;
    toasts.clear();
    toasts.push({
      message: t("settings.importFailed"),
      kind: "danger",
      durationMs: 8000,
    });
  }, [store.writeFailures, t]);

  const pwa = usePwaUpdate({
    base: import.meta.env.BASE_URL,
    cacheId: cacheIdForBase(import.meta.env.BASE_URL),
    enabled: !import.meta.env.DEV,
  });
  useEffect(() => {
    if (pwa.needRefresh) status(`Update ready: ${pwa.incomingVersion ?? "?"}`);
  }, [pwa.needRefresh, pwa.incomingVersion]);

  return (
    <div className="flex h-full flex-col bg-page text-fg">
      <TopBar
        active={tab}
        onOpenSettings={toggleSettings}
        employerSlot={
          employers.length > 1 && employer ? (
            <SelectPicker<string>
              value={employer.id}
              options={employers.map((e) => ({ value: e.id, label: e.name }))}
              onChange={(id) => update("activeEmployerId", id)}
              ariaLabel={t("common.employer")}
              triggerClassName="max-w-[9rem] truncate"
            />
          ) : undefined
        }
        syncSlot={
          sync.backend !== "local" ? (
            <SyncStatus
              providerName={sync.providerName}
              status={sync.status}
              dirty={sync.dirty}
              offline={sync.offline}
              onOpenDetails={() => setSyncDetailsOpen(true)}
              labels={{ syncedTo: (name) => t("sync.syncedTo", { name }) }}
            />
          ) : undefined
        }
      />

      {/* `relative` keeps absolutely-positioned descendants (the `sr-only`
          inputs) inside the scroller; `overflow-x-hidden` clips the arriving
          screen's slide. See the sibling cycle app for the long version. */}
      <main
        ref={main}
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div
          key={tab}
          data-enter={enter}
          className="app-screen mx-auto flex min-h-full max-w-2xl flex-col"
        >
          {tab === "today" && (
            <TodayScreen
              store={store}
              employer={employer}
              weekStartsOn={settings.weekStartsOn}
              onAddEmployer={() => {
                setOpenNewEmployer(true);
                show("employers");
              }}
              onNotice={notice}
            />
          )}
          {tab === "log" && (
            <LogScreen store={store} employer={employer} onNotice={notice} />
          )}
          {tab === "report" && (
            <ReportScreen
              data={store.data}
              employer={employer}
              weekStartsOn={settings.weekStartsOn}
            />
          )}
          {tab === "employers" && (
            <EmployersScreen
              store={store}
              activeId={employer?.id ?? null}
              onActivate={(id) => update("activeEmployerId", id)}
              openNew={openNewEmployer}
              onOpenedNew={() => setOpenNewEmployer(false)}
              onNotice={notice}
            />
          )}
          {tab === "settings" && (
            <SettingsScreen
              settings={settings}
              update={update}
              store={store}
              sync={sync}
              demoData={demo}
              onNotice={notice}
            />
          )}
        </div>
      </main>

      {/* The update prompt, anchored above the bar rather than over it — the
          bottom of the screen is the navigation here. */}
      <div className="app-update-slot relative z-[60]">
        {pwa.needRefresh && reloading ? (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-x-3 bottom-3 mx-auto flex max-w-md items-center gap-3 rounded-sm border border-line bg-surface px-3 py-2.5 text-fg shadow-md"
          >
            <SpinnerIcon className="h-5 w-5 animate-spin text-accent" />
            <span className="text-sm font-medium">{t("update.reload")}</span>
          </div>
        ) : (
          <UpdateToast
            needRefresh={pwa.needRefresh}
            incomingVersion={pwa.incomingVersion}
            onReload={() => {
              setReloading(true);
              pwa.reload();
            }}
            onDismiss={() => pwa.dismiss()}
            labels={{
              ready: t("update.available"),
              action: t("update.reload"),
              dismiss: t("common.close"),
            }}
          />
        )}
      </div>

      <BottomNav active={tab} onSelect={show} />

      <SyncDetailsModal
        open={syncDetailsOpen}
        providerName={sync.providerName}
        backendKind="cloud"
        location={sync.location}
        status={sync.status}
        statusDetail={sync.statusDetail}
        dirty={sync.dirty}
        offline={sync.offline}
        onSaveNow={sync.saveNow}
        onReload={() => void sync.reload()}
        onReconnect={sync.reconnect}
        onCheckConnection={sync.checkConnection}
        logPanel={settings.devMode ? <LogViewer store={logStore} /> : undefined}
        onClose={() => setSyncDetailsOpen(false)}
      />

      {/* Top, not the framework's default bottom: a toast at the bottom
          lands on the bar under the thumb. */}
      <ToastViewport
        store={toasts}
        labels={{ dismiss: t("common.close") }}
        className="app-toasts pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      />
    </div>
  );
}
