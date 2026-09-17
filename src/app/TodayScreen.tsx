// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  ContextMenu,
  PlusIcon,
  type RowAction,
} from "@niclaslindstedt/oss-framework/components";

import {
  clockIn,
  clockOut,
  endBreak,
  latestSession,
  moveBoundary,
  setCategory,
  setSessionStart,
  takeBreak,
  type EditContext,
} from "./actions.ts";
import { ArrivalModal } from "./ArrivalModal.tsx";
import { ClockFace } from "./ClockFace.tsx";
import { DayTimelineModal } from "./DayTimelineModal.tsx";
import { dayTotals, progress } from "./day.ts";
import { isWorkDay } from "./project.ts";
import { formatDuration, formatPercent, formatTimeOfDay } from "./format.ts";
import type { Backlight, ClockSize, DialConfig } from "./look.ts";
import { EnterIcon, KindGlyph, LeaveIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import {
  DEFAULT_BREAK_GLYPH,
  DEFAULT_CATEGORY_GLYPH,
  glyphOr,
  type GlyphId,
} from "./kinds.ts";
import { breakName, categoryColor } from "./labels.ts";
import { NewKindModal } from "./NewKindModal.tsx";
import { KEY_HINT, type Command } from "./shortcuts.ts";
import {
  blankDay,
  dayFor,
  type Project,
  type Seconds,
  type WorkDay,
} from "./types.ts";
import type { DocStore } from "./useDocStore.ts";
import { useNow } from "./useNow.ts";
import { useShortcuts } from "./useShortcuts.ts";

// The first screen: the clock, and the buttons that move the day along. It
// is the whole app for most of a day — press the face to start, a break or
// two, a kind of work when it changes, press the face to stop — so
// everything is one press from here and nothing needs a second screen.
//
// There is no timer. The day's progress is the bezel of the watch, and
// whether the day is being counted is the light behind it (see
// `ClockFace.tsx`); the one line of words under the dial says the state and
// since when. A number ticking up was a second way of saying what the ring
// already draws, and it was the loudest thing on the screen.
//
// Three corrections live here rather than on the Log, because they are the
// three noticed here: the line under the dial opens the arrival, a stretch
// on the ring opens the day stretch by stretch, and "Custom" invents the kind
// of break or work that nobody thought to set up in advance. None of them
// leave this screen.
//
// On a desk the same controls stand round the dial — breaks to its left,
// kinds of work to its right — and the dial takes the height of the window
// (`styles.css`, `.app-today`). The keyboard reaches them too: S for the
// face, the digits for the kinds of work (`shortcuts.ts`), and the right
// button on the dial opens the lot as a menu where the pointer is.
//
// The screen owns no state beyond the modals it opens. Every band is derived
// from the day's spans up to `now`, once a second, through `day.ts`; every
// button is one of the pure edits in `actions.ts` applied to the day and
// handed back to the store.

type Props = {
  store: DocStore;
  project: Project | null;
  weekStartsOn: number;
  /** The dial the settings resolved to, how big, and the light behind it. */
  dial: DialConfig;
  clockSize: ClockSize;
  backlight: Backlight;
  onAddProject: () => void;
  onNotice: (message: string) => void;
};

type Asking = { kind: "break" | "activity" };

export function TodayScreen({
  store,
  project,
  dial,
  clockSize,
  backlight,
  onAddProject,
  onNotice,
}: Props) {
  const t = useT();
  const now = useNow(1000);
  const [arriving, setArriving] = useState(false);
  const [timeline, setTimeline] = useState<{ at: Seconds | null } | null>(null);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const day = useMemo<WorkDay | null>(() => {
    if (!project) return null;
    return (
      dayFor(store.data, project.id, now.today) ??
      blankDay(project.id, now.today, new Date().toISOString())
    );
  }, [store.data, project, now.today]);

  const totals = useMemo(
    () => (day ? dayTotals(day, now.seconds) : null),
    [day, now.seconds],
  );

  const ctx = (): EditContext => ({
    id: makeId,
    updatedAt: new Date().toISOString(),
  });
  const apply = (next: WorkDay) => {
    if (day && next !== day) store.saveDay(next);
  };

  // The edits, as the buttons and the keys and the menu all reach them.
  const state = totals?.state ?? "out";
  const toggleWork = () => {
    if (!day) return;
    apply(
      state === "out"
        ? clockIn(day, now.seconds, ctx())
        : clockOut(day, now.seconds, ctx()),
    );
  };
  const pickCategory = (id: string) => {
    if (!day || !totals || state === "out") return;
    const on = totals.currentCategoryId === id;
    apply(setCategory(day, on ? null : id, now.seconds, ctx()));
  };
  const pickBreak = (id: string, minutes: number) => {
    if (!day || !totals || state === "out") return;
    const running = totals.currentBreak?.typeId === id;
    apply(
      running
        ? endBreak(day, now.seconds, ctx())
        : takeBreak(day, id, now.seconds, minutes * 60, ctx()),
    );
  };

  // The keys read the latest edits through a ref, so the window's listener
  // is bound once rather than once a second.
  const keys = useRef<(command: Command) => boolean>(() => false);
  keys.current = (command) => {
    if (!project) return false;
    if (command.kind === "toggleWork") {
      toggleWork();
      return true;
    }
    if (command.kind === "category") {
      const c = project.categories[command.index];
      if (!c || state === "out") return false;
      pickCategory(c.id);
      return true;
    }
    return false;
  };
  useShortcuts(useCallback((command: Command) => keys.current(command), []));

  // The browser tab, while the app is open in one: the time worked and the
  // state where the page's name would be, so the tab strip is a glance at
  // the day. Once a minute rather than once a second, because a tab title
  // that flickers is a tab you close.
  const current = totals?.currentBreak;
  const currentName =
    project && current ? breakName(t, project, current.typeId) : null;
  const tabState =
    state === "working"
      ? t("today.state.working")
      : state === "break" && current && current.end !== null
        ? t("today.tabBreak", {
            name: currentName ?? "",
            time: formatTimeOfDay(current.end),
          })
        : state === "break"
          ? t("today.state.break")
          : null;
  const tabWorked = totals ? formatDuration(totals.worked) : "";
  useEffect(() => {
    if (!tabState) return;
    return setWindowTitle(
      t("today.tabTitle", {
        timer: tabWorked,
        state: tabState,
        app: t("app.name"),
      }),
    );
  }, [tabState, tabWorked, t]);

  if (!project || !day || !totals) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-3 py-3">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-line bg-surface-3 p-6 text-center">
          <p className="text-sm text-muted">{t("today.noProject")}</p>
          <Button variant="primary" className="mt-4" onClick={onAddProject}>
            <span className="inline-flex items-center gap-1.5">
              <PlusIcon className="h-4 w-4" />
              {t("today.addProject")}
            </span>
          </Button>
        </div>
      </div>
    );
  }

  const stampProject = (patch: Partial<Project>) =>
    store.saveProject({
      ...project,
      ...patch,
      updatedAt: new Date().toISOString(),
    });

  const expected = isWorkDay(project, now.today);
  const onBreak = state === "break";
  const session = latestSession(day);
  const fraction = progress(totals.worked, project);

  const stateLine =
    state === "working" && totals.openSession
      ? `${t("today.state.working")} · ${t("today.since", { time: formatTimeOfDay(totals.openSession.start) })}`
      : state === "break" && current
        ? `${t("today.state.break")} · ${
            current.end === null
              ? t("today.breakSince", {
                  name: currentName ?? "",
                  time: formatTimeOfDay(current.start),
                })
              : t("today.breakUntil", {
                  name: currentName ?? "",
                  time: formatTimeOfDay(current.end),
                })
          }`
        : totals.lastOut !== null
          ? `${t("today.state.out")} · ${t("today.doneAt", { time: formatTimeOfDay(totals.lastOut) })}`
          : expected
            ? t("today.state.out")
            : `${t("today.state.out")} · ${t("today.dayOff")}`;

  /** The kinds of work are labels over worked time, so a break stops every
   *  one of them counting (see `day.ts`). The chip says so in the break's own
   *  colour rather than going on looking like the thing being counted. */
  const categoryTone = (on: boolean) =>
    on && onBreak
      ? "border-flag bg-flag/15 text-fg-bright"
      : on
        ? "border-accent bg-accent/15 text-fg-bright"
        : "border-line bg-surface-3 text-fg hover:bg-surface-2";

  // The right button's menu: everything the screen can do, where the
  // pointer is.
  const menuActions: RowAction[] = [
    {
      label: state === "out" ? t("today.clockIn") : t("today.clockOut"),
      icon:
        state === "out" ? (
          <EnterIcon className="h-4 w-4" />
        ) : (
          <LeaveIcon className="h-4 w-4" />
        ),
      onSelect: toggleWork,
    },
    ...(state !== "out"
      ? project.breakTypes.map<RowAction>((b) => ({
          label:
            current?.typeId === b.id
              ? t("today.endBreak", { name: b.name })
              : t("today.menuBreak", {
                  name: b.name,
                  minutes: String(b.defaultMinutes),
                }),
          icon: (
            <KindGlyph
              id={glyphOr(b.glyph, DEFAULT_BREAK_GLYPH)}
              className="h-4 w-4 text-flag"
            />
          ),
          onSelect: () => pickBreak(b.id, b.defaultMinutes),
        }))
      : []),
    ...(state !== "out"
      ? project.categories.map<RowAction>((c) => {
          const on = totals.currentCategoryId === c.id;
          return {
            label: on ? t("today.stopLabelling", { name: c.name }) : c.name,
            icon: (
              <KindGlyph
                id={glyphOr(c.glyph, DEFAULT_CATEGORY_GLYPH)}
                className="h-4 w-4"
                style={{ color: categoryColor(project, c.id) }}
              />
            ),
            onSelect: () => pickCategory(c.id),
          };
        })
      : []),
    ...(session
      ? [
          {
            label: t("today.arrival"),
            onSelect: () => setArriving(true),
          } satisfies RowAction,
        ]
      : []),
    {
      label: t("today.openTimeline"),
      onSelect: () => setTimeline({ at: null }),
    },
  ];

  return (
    <div className="app-today flex flex-1 flex-col gap-3 px-3 py-3">
      {/* The dial, and under it the one line of words: what the day is doing
          and since when. The line is a button — the arrival is the time of
          day that is wrong most often, and this is where you see it. */}
      <div data-area="dial" className="flex flex-col items-center gap-2">
        <div className="app-dial-slot w-full">
          <ClockFace
            day={day}
            project={project}
            now={now.seconds}
            state={state}
            dial={dial}
            size={clockSize}
            backlight={backlight}
            progress={fraction}
            onToggle={toggleWork}
            onOpen={(at) => setTimeline({ at: at ?? null })}
            onMenu={(x, y) => setMenu({ x, y })}
          />
        </div>
        <button
          type="button"
          disabled={!session}
          onClick={() => setArriving(true)}
          title={session ? t("today.arrival") : undefined}
          className={`rounded-md px-2 py-1 text-xs font-bold tracking-wide uppercase transition-colors enabled:hover:bg-surface-2 disabled:cursor-default ${
            onBreak
              ? "text-flag"
              : state === "working"
                ? "text-accent"
                : "text-muted"
          }`}
        >
          {stateLine}
          <span className="sr-only">
            {" · "}
            {t("today.percentOfTarget", { percent: formatPercent(fraction) })}
          </span>
        </button>
        {/* The first press of the day is the one nobody has been told about. */}
        {state === "out" && totals.lastOut === null && (
          <p className="text-xs text-muted">{t("today.outHint")}</p>
        )}
      </div>

      <ul
        data-area="legend"
        className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted"
      >
        <Swatch color="var(--color-accent)" label={t("today.legend.work")} />
        <Swatch color="var(--color-flag)" label={t("today.legend.break")} />
        {project.categories.map((c) => (
          <Swatch
            key={c.id}
            color={categoryColor(project, c.id)}
            glyph={glyphOr(c.glyph, DEFAULT_CATEGORY_GLYPH)}
            label={c.name}
          />
        ))}
      </ul>

      <section data-area="breaks" className="flex flex-col gap-1.5">
        <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
          {t("today.breaks")}
        </h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {project.breakTypes.map((b) => {
            const running = current?.typeId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                disabled={state === "out"}
                aria-pressed={running}
                onClick={() => pickBreak(b.id, b.defaultMinutes)}
                title={
                  state === "out"
                    ? undefined
                    : running
                      ? t("today.endBreak", { name: b.name })
                      : t("today.menuBreak", {
                          name: b.name,
                          minutes: String(b.defaultMinutes),
                        })
                }
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors disabled:opacity-40 lg:justify-start ${
                  running
                    ? "border-flag bg-flag/20 text-fg-bright"
                    : "border-line bg-surface-3 text-fg hover:bg-surface-2"
                }`}
              >
                <KindGlyph
                  id={glyphOr(b.glyph, DEFAULT_BREAK_GLYPH)}
                  className="h-4 w-4 shrink-0 text-flag"
                />
                <span className="truncate">
                  {running ? t("today.endBreak", { name: b.name }) : b.name}
                </span>
                {!running && (
                  <span className="text-xs font-normal text-muted lg:ml-auto">
                    {b.defaultMinutes}m
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            disabled={state === "out"}
            onClick={() => setAsking({ kind: "break" })}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-transparent px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 disabled:opacity-40 lg:justify-start"
          >
            <PlusIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("today.custom")}</span>
          </button>
        </div>
        {state !== "out" && (
          <p className="app-hint text-xs text-muted">{t("today.breaksHint")}</p>
        )}
      </section>

      <section data-area="kinds" className="flex flex-col gap-1.5">
        <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
          {t("today.categories")}
        </h2>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {project.categories.map((c, i) => {
            const on = totals.currentCategoryId === c.id;
            const key = KEY_HINT.category(i);
            return (
              <button
                key={c.id}
                type="button"
                disabled={state === "out"}
                aria-pressed={on}
                onClick={() => pickCategory(c.id)}
                title={
                  key && state !== "out" ? `${c.name} (${key})` : undefined
                }
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors disabled:opacity-40 lg:min-h-12 lg:rounded-xl lg:font-semibold ${categoryTone(on)}`}
              >
                <KindGlyph
                  id={glyphOr(c.glyph, DEFAULT_CATEGORY_GLYPH)}
                  className="h-4 w-4 shrink-0"
                  style={{
                    color:
                      on && onBreak
                        ? "var(--color-flag)"
                        : categoryColor(project, c.id),
                  }}
                />
                <span className="truncate">{c.name}</span>
                {on && onBreak && (
                  <span className="text-xs font-normal text-flag">
                    {t("today.paused")}
                  </span>
                )}
                {totals.categories[c.id] ? (
                  <span className="text-xs font-normal text-muted tabular-nums lg:ml-auto">
                    {formatDuration(totals.categories[c.id]!)}
                  </span>
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            disabled={state === "out"}
            onClick={() => setAsking({ kind: "activity" })}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-line px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 disabled:opacity-40 lg:min-h-12 lg:rounded-xl lg:font-semibold"
          >
            <PlusIcon className="h-4 w-4 shrink-0" />
            {t("today.custom")}
          </button>
        </div>
        {onBreak && (
          <p className="app-hint text-xs text-muted">{t("today.pausedHint")}</p>
        )}
      </section>

      <ContextMenu
        position={menu}
        actions={menuActions}
        onClose={() => setMenu(null)}
        ariaLabel={t("today.menuLabel")}
      />

      {arriving && session && (
        <ArrivalModal
          start={session.start}
          min={earliestArrival(day, session.start)}
          max={Math.min(now.seconds, (session.end ?? Infinity) - 60)}
          workedAt={(start) =>
            dayTotals(
              setSessionStart(day, session.id, start, ctx()),
              now.seconds,
            ).worked
          }
          onSave={(start) => {
            const next = setSessionStart(day, session.id, start, ctx());
            if (next === day) {
              onNotice(t("editor.invalid"));
              return;
            }
            apply(next);
            onNotice(t("log.saved"));
            setArriving(false);
          }}
          onClose={() => setArriving(false)}
        />
      )}

      {timeline && (
        <DayTimelineModal
          day={day}
          project={project}
          now={now.seconds}
          highlight={timeline.at}
          onMove={(at, to) => {
            const next = moveBoundary(day, at, to, ctx());
            if (next === day) {
              onNotice(t("timeline.stuck"));
              return;
            }
            apply(next);
            setTimeline({ at: to });
          }}
          onClose={() => setTimeline(null)}
        />
      )}

      {asking && (
        <NewKindModal
          kind={asking.kind}
          // A kind of work added now takes the next slot of the positional
          // ramp if no colour is picked — which is what `categoryColor` gives
          // an id the project does not have yet.
          autoColor={categoryColor(project, "")}
          onSave={({ name, minutes, glyph, color }) => {
            const id = makeId();
            if (asking.kind === "break") {
              stampProject({
                breakTypes: [
                  ...project.breakTypes,
                  { id, name, defaultMinutes: minutes, glyph },
                ],
              });
              apply(takeBreak(day, id, now.seconds, minutes * 60, ctx()));
            } else {
              stampProject({
                categories: [
                  ...project.categories,
                  { id, name, glyph, ...(color ? { color } : {}) },
                ],
              });
              apply(setCategory(day, id, now.seconds, ctx()));
            }
            onNotice(t("log.saved"));
            setAsking(null);
          }}
          onClose={() => setAsking(null)}
        />
      )}
    </div>
  );
}

/** The window's title, and the way to put it back. */
function setWindowTitle(title: string): () => void {
  const original = document.title;
  document.title = title;
  return () => {
    document.title = original;
  };
}

/** The earliest a session may have started: the end of the one before it, or
 *  midnight. Keeps an arrival nudged backwards from swallowing the morning
 *  session on a day with two. */
function earliestArrival(day: WorkDay, start: Seconds): Seconds {
  let min = 0;
  for (const s of day.sessions) {
    const end = s.end ?? s.start;
    if (s.start < start && end > min) min = end;
  }
  return min;
}

/** One entry of the legend under the dial: work, break, or a kind of work.
 *  The first two are bands of the ring and stay dots; a kind of work wears
 *  the mark it wears everywhere else, in its own colour. */
function Swatch({
  color,
  glyph,
  label,
}: {
  color: string;
  glyph?: GlyphId;
  label: string;
}) {
  return (
    <li className="inline-flex items-center gap-1.5">
      {glyph ? (
        <KindGlyph
          id={glyph}
          className="h-3.5 w-3.5 shrink-0"
          style={{ color }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </li>
  );
}
