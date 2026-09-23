// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
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
import {
  ProjectMarkButton,
  ProjectPickerModal,
} from "./app/ProjectPickerModal.tsx";
import { ProjectsScreen } from "./app/ProjectsScreen.tsx";
import { useT } from "./app/i18n/index.ts";
import { LogScreen } from "./app/LogScreen.tsx";
import { appearanceFor, resolveBacklight, resolveDial } from "./app/look.ts";
import { logStore } from "./app/log.ts";
import { cacheIdForBase } from "./app/pwa.ts";
import { ReportScreen } from "./app/ReportScreen.tsx";
import { SettingsScreen } from "./app/SettingsScreen.tsx";
import { SidePanel } from "./app/SidePanel.tsx";
import { TodayScreen } from "./app/TodayScreen.tsx";
import { TopBar, topBarNeeded } from "./app/TopBar.tsx";
import { projectList } from "./app/types.ts";
import { useAppSettings } from "./app/useAppSettings.ts";
import { useFocus } from "./app/useFocus.ts";
import { useDesk, useStand, useWide } from "./app/useShape.ts";
import { localDocBackend, useDocStore } from "./app/useDocStore.ts";
import { useShortcuts } from "./app/useShortcuts.ts";
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
//
// Two shells over the same screens. On a phone the four destinations sit on
// the bottom bar; on a desk (`useDesk`) they sit on the top bar, Settings
// slides in over the right-hand edge (`SidePanel.tsx`) so the dial is still
// in view while a watch face is picked, and the keyboard reaches the lot
// (`shortcuts.ts`). The screens themselves know nothing of either shell.
//
// Three *shapes* of window, though, and the third is the phone laid on its
// side — the stand (`shape.ts`). It keeps the phone's shell down to the last
// habit, bottom bar and swipe included, and changes only the Today screen,
// which has no height to stack in and stands its controls beside the dial
// the way the desk does. `useWide` is that pair of shapes and nothing more;
// everything it guards here is layout.
//
// That shape is also the one meant to be left alone, so it has a mode of its
// own: propped up and untouched on the Today screen, everything but the watch
// fades out and the first touch brings it back (`useFocus.ts`, and
// `[data-focus="on"]` in `styles.css`). The shell says when; nothing under it
// knows, and nothing moves.

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

  // The project on screen: the chosen one if it still exists, else the
  // first by name, else none. Never persisted as a fallback — a deleted
  // project's id stays in settings until another is chosen, which is
  // harmless and keeps the choice if the deletion is undone by a restore.
  const projects = useMemo(() => projectList(store.data), [store.data]);
  const project =
    (settings.activeProjectId
      ? store.data.projects[settings.activeProjectId]
      : undefined) ??
    projects[0] ??
    null;

  const desk = useDesk();
  const stand = useStand();
  // Whether the Today screen stands its controls beside the dial: the desk,
  // and a phone laid on its side (see `shape.ts`). Layout only — the stand
  // keeps every one of the phone shell's habits, bottom bar and swipe
  // included.
  const wide = useWide();
  const [tab, setTab] = useState<Tab>("today");
  // Where the bottom nav was left, so closing Settings comes back to it.
  const [home, setHome] = useState<NavTab>("today");
  const [enter, setEnter] = useState<ScreenEnter>("none");
  // The desk's Settings panel. Kept apart from `tab` on purpose: on the
  // desk Settings is over the screen rather than in place of it, and a
  // window that narrows to the phone shell with the panel open simply drops
  // it and shows whatever tab was left.
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Focus mode: the phone laid down on the watch and left alone, where
  // everything but the dial fades out until the screen is touched again (see
  // `useFocus.ts`). The stand and the Today screen together, because the
  // thing left showing has to be worth leaving showing — the other three
  // screens are lists, and a list nobody is reading is nothing to look at.
  const focus = useFocus(stand && tab === "today");

  const show = useCallback(
    (next: Tab) => {
      setEnter(screenEnter(tab, next));
      if (isNavTab(next)) setHome(next);
      setTab(next);
    },
    [tab],
  );
  const toggleSettings = useCallback(() => {
    if (desk) {
      setSettingsOpen((open) => !open);
      return;
    }
    const target: Tab = tab === "settings" ? home : "settings";
    setEnter(screenEnter(tab, target));
    setTab(target);
  }, [desk, tab, home]);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  // A window widened into the desk while on the Settings tab: the desk has
  // no such tab, so the screen goes back to where the bar was and Settings
  // carries on as the panel.
  useEffect(() => {
    if (!desk || tab !== "settings") return;
    setTab(home);
    setSettingsOpen(true);
  }, [desk, tab, home]);

  // The desk's keys for the shell; the day's own keys are the Today
  // screen's (see `shortcuts.ts`).
  useShortcuts(
    useCallback(
      (command) => {
        if (!desk) return false;
        if (command.kind === "settings") toggleSettings();
        else if (command.kind === "projects") show("projects");
        else return false;
        return true;
      },
      [desk, toggleSettings, show],
    ),
  );

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
  // A mouse drag across the desk is a selection, not a page turn.
  useSwipeNav(main, swipe, { enabled: !desk });

  // The project switcher, opened from the mark in the corner of the top bar.
  // Never opened with one project: there is nothing to switch to, and the
  // corner has no mark in it to press.
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
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
    enabled: !import.meta.env.DEV && !__SHELL_BUILD__,
  });
  useEffect(() => {
    if (pwa.needRefresh) status(`Update ready: ${pwa.incomingVersion ?? "?"}`);
  }, [pwa.needRefresh, pwa.incomingVersion]);

  const todayScreen = (
    <TodayScreen
      store={store}
      project={project}
      weekStartsOn={settings.weekStartsOn}
      dial={resolveDial(settings.clockPreset, settings.clock)}
      clockSize={settings.clockSize}
      backlight={resolveBacklight(settings.clockPreset, settings.backlight)}
      reflect={settings.reflect}
      onProjectAdded={(id) => update("activeProjectId", id)}
      onNotice={notice}
      onOpenSettings={toggleSettings}
      settingsOpen={desk && settingsOpen}
    />
  );
  const logScreen = (
    <LogScreen
      store={store}
      project={project}
      onProjectAdded={(id) => update("activeProjectId", id)}
      onNotice={notice}
    />
  );
  const reportScreen = (
    <ReportScreen
      store={store}
      project={project}
      settings={settings}
      update={update}
      onProjectAdded={(id) => update("activeProjectId", id)}
      onNotice={notice}
    />
  );
  const projectsScreen = (
    <ProjectsScreen
      store={store}
      activeId={project?.id ?? null}
      onActivate={(id) => update("activeProjectId", id)}
      onNotice={notice}
    />
  );
  const settingsScreen = (
    <SettingsScreen
      settings={settings}
      update={update}
      store={store}
      sync={sync}
      demoData={demo}
      onNotice={notice}
    />
  );

  // The top bar, and whether there is one. The watch carries the app's name
  // and the cog itself (see `Dial.tsx`), so over Today the bar has neither;
  // on the phone that leaves it empty unless there is a project to switch
  // or a cloud to show, and an empty bar is not drawn — the watch is the
  // top of the screen, and the screen pads down from the status bar itself
  // (`.app-bare`).
  //
  // The project's mark is the one thing that will not keep the bar alive by
  // itself. A bordered row across the top of the window, with a rule under
  // it, for one glyph is the menu bar this app does not have — so over the
  // watch it floats in the corner instead, the way the tabs do where there
  // is no bar to sit above (`app-nav-floating`). Laid down there is no
  // corner to float in: the tabs are in all four of them, and the mark goes
  // back to the bar, which the stand draws anyway.
  const projectButton =
    projects.length > 1 && project ? (
      <ProjectMarkButton
        project={project}
        open={projectPickerOpen}
        onOpen={() => setProjectPickerOpen(true)}
      />
    ) : undefined;
  const bar = {
    watch: tab === "today",
    onSelect: desk ? show : undefined,
    syncSlot:
      sync.backend !== "local" ? (
        <SyncStatus
          providerName={sync.providerName}
          status={sync.status}
          dirty={sync.dirty}
          offline={sync.offline}
          onOpenDetails={() => setSyncDetailsOpen(true)}
          labels={{ syncedTo: (name) => t("sync.syncedTo", { name }) }}
        />
      ) : undefined,
  };
  // Whether the mark floats, which is wherever the bar would be drawn for it
  // alone — `bar` above is everything *else* that could keep one alive. Laid
  // down as much as upright: a strip across the top of a 393px-tall window
  // for one glyph costs the dial the same height a bar across the foot used
  // to, which is the whole reason the tabs went to the corners.
  const floatProject = !topBarNeeded(bar);
  const bare = floatProject;

  return (
    <div
      data-focus={focus ? "on" : undefined}
      className="flex h-full flex-col bg-page text-fg"
    >
      {!bare && (
        <TopBar
          active={tab}
          onOpenSettings={toggleSettings}
          settingsOpen={desk && settingsOpen}
          {...bar}
          projectSlot={floatProject ? undefined : projectButton}
        />
      )}

      {/* The content area. It is the frame rather than the scroller: the
          screen inside it scrolls, and so does the desk's settings panel,
          but the area itself never does. `relative` is what the panel and
          the `sr-only` inputs are positioned against, and `overflow-clip`
          rather than `hidden` on purpose — `clip` is not a scroll container,
          so this box has a height of its own for the panel to be measured
          against. Positioned inside a *scrolling* box the panel took the
          height of the settings page instead, and the page behind it grew by
          the whole of it. It also clips the arriving screen's slide and the
          backlight's spill. See the sibling cycle app for the long
          version. */}
      <main
        ref={main}
        className="app-main relative min-h-0 flex-1 overflow-clip"
      >
        {/* The one scrolling region — except on the desk's Today screen,
            which is laid out to the height of the window on purpose (see
            `.app-today` in `styles.css`). There the glow behind the dial
            reaches past the bottom of the screen, and a decoration is not
            something to scroll to: the screen holds still and the light is
            clipped at the edge of the content area. */}
        <div
          className={`h-full overflow-y-auto overflow-x-hidden ${
            wide && tab === "today" ? "wide:overflow-hidden" : ""
          }`}
        >
          <div
            key={tab}
            data-enter={enter}
            className={`app-screen mx-auto flex min-h-full max-w-2xl flex-col ${
              desk ? "lg:max-w-3xl" : ""
            } ${wide && tab === "today" ? "wide:h-full wide:max-w-none" : ""} ${
              bare ? "app-bare" : ""
            }`}
          >
            {tab === "today" && todayScreen}
            {tab === "log" && logScreen}
            {tab === "report" && reportScreen}
            {tab === "projects" && projectsScreen}
            {tab === "settings" && settingsScreen}
          </div>
        </div>

        {/* The floating mark, over the watch where no bar is drawn. Inside
            the content area so the light behind the dial is clipped the same
            way it is, and positioned rather than laid out, so the watch is
            centred in the whole window as if nothing were there. Which
            corner is the stylesheet's: upright the top left, and laid down
            the middle of the tabs' own strip, where the four corners are
            taken and the dial's column reserves the room anyway. */}
        {floatProject && projectButton && (
          // Above the nav's own z-30: laid down the tabs' strip is a fixed
          // row the full width of the window, and its empty middle — which
          // is where the mark stands — takes a press like any other box. It
          // is still the strip that is on top of the screen; only the mark
          // is on top of the strip.
          <div className="app-project-mark absolute z-40">{projectButton}</div>
        )}

        {desk && settingsOpen && (
          <SidePanel title={t("nav.settings")} onClose={closeSettings}>
            {settingsScreen}
          </SidePanel>
        )}
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

      {!desk && <BottomNav active={tab} onSelect={show} bare={bare} />}

      {projectPickerOpen && (
        <ProjectPickerModal
          projects={projects}
          activeId={project?.id ?? null}
          onSelect={(id) => update("activeProjectId", id)}
          onClose={() => setProjectPickerOpen(false)}
        />
      )}

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
