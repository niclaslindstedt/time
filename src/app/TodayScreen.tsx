// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActionMenuList,
  ContextMenu,
  FloatingPanel,
  PlusIcon,
  type FloatingPlacement,
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
import { dayKinds, dayTotals, progress, workdayEnd } from "./day.ts";
import {
  DEFAULT_HOURS_PER_DAY,
  DEFAULT_WORK_DAYS,
  breakTypeOf,
  categoryOf,
  isPinned,
  isWorkDay,
  storedCredit,
  storedPinned,
} from "./project.ts";
import {
  formatDuration,
  formatPercent,
  formatTimeOfDay,
  formatWallTime,
} from "./format.ts";
import {
  CLOCK_SIZE,
  type Backlight,
  type ClockSize,
  type DialConfig,
} from "./look.ts";
import { EnterIcon, KindGlyph, LeaveIcon, MoreIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import { glyphFor, type GlyphId } from "./kinds.ts";
import { autoCategoryColor, breakName, categoryColor } from "./labels.ts";
import { KindModal, type NewKind } from "./KindModal.tsx";
import { ProjectEditModal } from "./ProjectEditModal.tsx";
import { KEY_HINT, type Command } from "./shortcuts.ts";
import {
  DAY_SECONDS,
  DEFAULT_BREAK_CREDIT,
  blankDay,
  dayFor,
  type Project,
  type Seconds,
  type WorkDay,
} from "./types.ts";
import type { DocStore } from "./useDocStore.ts";
import { useLongPress } from "./useLongPress.ts";
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
// on the ring opens the day stretch by stretch, and the square marked "…" at
// the end of each row reaches the kinds that are not on the screen and
// invents the one nobody thought to set up in advance. None of them leave
// this screen. On a phone the square carries its name in a tooltip rather
// than beside the mark: spelled out it was as wide as a break, and that
// pushed it onto a row of its own. Where the controls stand in a column
// beside the dial the row is the column's width and there is nothing to
// save, so it spells it.
//
// **Not every kind is on the screen.** A row shows the ones the project has
// pinned (`isPinned`, `project.ts`) and the "…" holds the rest, because a
// project is allowed to have a dozen kinds of work and a phone has room for
// four buttons. The list in the "…" is the *same* list in the same order,
// just the part of it that was left out — never a second vocabulary, which
// is why the rows in it are built by the same two functions the right
// button's menu uses. Absent means pinned, so a project nobody has hidden
// anything in draws exactly the buttons it always did.
//
// The "…" answers whether or not the day has started, for the same reason a
// held pill does: naming a kind of break or work is a change to the
// *project*, and a project is edited whenever. What it cannot do before the
// work starts is start one — `takeBreak` and `setCategory` want an open
// session and hand the day straight back without one (`actions.ts`) — so
// before the day starts the menu holds "Custom" alone, which is the same
// guard the right button's menu has always had. Only the pills themselves
// dim, because those are the edits that really have nothing to act on.
//
// A pill held rather than tapped is the fourth: it opens the kind itself, in
// the same form the "+" fills in, so the mark a kind wears and the hue a
// kind of work is drawn in are changed where they are worn rather than in
// the project form. Under a mouse the right button does it. A pill answers a
// hold whether or not the day has started — a kind's look has nothing to do
// with being clocked in — which is why the pills are marked `aria-disabled`
// before the work starts rather than `disabled`: a disabled button is dead to
// the pointer, and a hold is a pointer.
//
// Given the width the same controls stand round the dial — breaks to its
// left, kinds of work to its right — and the dial takes the share of the
// window's height its size asks for (`styles.css`, `.app-today`). That is the
// desk, and it is also the phone laid on its side, which has the width and
// has no height at all to stack in: the two are the `wide:` variant and
// `useWide` (`shape.ts`). The keyboard reaches the controls too, wherever
// they stand: S for the face, the digits for the kinds of work
// (`shortcuts.ts`), and the right button on the dial opens the lot as a menu
// where the pointer is.
//
// Laid down, the columns are the whole screen and a list longer than the
// window is tall scrolls in its own column rather than pushing the watch off
// the middle — which is also why the kinds stop wrapping there. A wrap in a
// column is a second column, and it took the overflow off the edge of the
// screen instead of down.
//
// The dial carries the app's name and the Settings cog, printed where a
// watch prints its maker and its date, so on a phone this screen has no bar
// over it unless there is a project to switch or a cloud to show: the watch
// is the top of the screen — and, laid down, the middle of it.
//
// **Before there is a project, there is still a watch.** The first thing a
// new reader sees is the clock — an empty dial on an ordinary week, drawn
// against `NO_PROJECT` — rather than a card asking for a project in the
// place the clock goes. Pressing it is how the first project is made: the
// press opens the project form here, on this screen, and saving it puts the
// project in use and leaves the reader on the watch with the day ready to
// start. Out there the *whole* watch is that one button, ring and rim
// included — the rule that everything outside the face opens the day's
// stretches is about correcting a record, and there is no record to correct
// until there is a project to keep one for.
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
  /** Whether the light on the dial's metal follows the device. */
  reflect: boolean;
  /** A project made from the dial on the first run: it is saved here, and
   *  the shell is told to put it in use. */
  onProjectAdded: (id: string) => void;
  onNotice: (message: string) => void;
  /** The cog on the dial. Settings is a screen on the phone and a panel on
   *  the desk; the shell knows which. */
  onOpenSettings: () => void;
  settingsOpen?: boolean;
};

/** The kind form on screen: one being invented (`id` null), or the one being
 *  corrected. */
type Asking = { kind: "break" | "activity"; id: string | null };

/**
 * The project an empty dial is drawn against, before there is a real one.
 *
 * The dial is drawn against a project — that is where a break's name and a
 * kind of work's hue come from — so a screen with no project would have no
 * clock to show. A day with no spans asks this one nothing, so none of it is
 * ever read: it is never stored, never edited and never merged. The ordinary
 * week is here so the bezel has a target to stand at rather than divide by
 * nothing; with nothing worked it draws the same empty ring either way.
 */
const NO_PROJECT: Project = {
  id: "",
  name: "",
  workDays: DEFAULT_WORK_DAYS,
  hoursPerDay: DEFAULT_HOURS_PER_DAY,
  breakTypes: [],
  categories: [],
  updatedAt: "",
};

/** Where a row's "…" hangs its menu. Left-anchored and at least as wide as
 *  the longest thing in it, because what is in it is a list of names. */
const MORE_MENU: FloatingPlacement = {
  width: { kind: "min", minPx: 200 },
  anchor: "left",
  gap: 4,
  coordinateSpace: "viewport",
};

/**
 * The button at the end of a row: the kinds the project has that are not
 * pinned, and "Custom".
 *
 * Shaped like the pills it stands among rather than like the framework's
 * `IconButton`, because it is the last thing in a row of twelve-high buttons
 * and a nine-high square at the end of them reads as a different kind of
 * control. Dashed like the "+" it replaced — it is still the way to the
 * things not on the screen. On a phone it is a square with its name in a
 * tooltip; given the width, where the row is a column, it spells it.
 */
const MoreButton = forwardRef<
  HTMLButtonElement,
  { label: string; open: boolean; onToggle: () => void; className: string }
>(function MoreButton({ label, open, onToggle, className }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onToggle}
      className={`flex min-h-12 w-12 shrink-0 items-center justify-center gap-1.5 border border-dashed text-sm font-semibold transition-colors wide:w-auto wide:justify-start wide:px-3 ${className} ${
        open
          ? "border-accent bg-accent/15 text-fg-bright"
          : "border-line bg-transparent text-muted hover:bg-surface-2"
      }`}
    >
      <MoreIcon className="h-4 w-4 shrink-0" />
      <span className="hidden truncate wide:inline">{label}</span>
    </button>
  );
});

export function TodayScreen({
  project: chosen,
  store,
  dial,
  clockSize,
  backlight,
  reflect,
  onProjectAdded,
  onNotice,
  onOpenSettings,
  settingsOpen,
}: Props) {
  const t = useT();
  const now = useNow(1000);
  /** The first run: no project yet, so the dial is empty and every press on
   *  the watch opens the form that makes one. */
  const first = chosen === null;
  /** What the screen is drawn against: the project in use, or the empty one
   *  the watch stands on until there is one (see `NO_PROJECT`). */
  const project = chosen ?? NO_PROJECT;
  const [adding, setAdding] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [timeline, setTimeline] = useState<{ at: Seconds | null } | null>(null);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  /** Which row's "…" is open, if either. */
  const [more, setMore] = useState<Asking["kind"] | null>(null);
  const breakMoreRef = useRef<HTMLButtonElement>(null);
  const kindMoreRef = useRef<HTMLButtonElement>(null);
  const press = useLongPress();

  const day = useMemo<WorkDay>(
    () =>
      dayFor(store.data, project.id, now.today) ??
      blankDay(project.id, now.today, new Date().toISOString()),
    [store.data, project, now.today],
  );

  const totals = useMemo(
    () => dayTotals(day, project, now.seconds),
    [day, project, now.seconds],
  );

  /** Which of the day's colours are on the ring, which is what the legend
   *  under it may name. The same fold of the same stretches the dial is
   *  drawn from, so the two cannot disagree. */
  const drawn = useMemo(() => dayKinds(day, now.seconds), [day, now.seconds]);

  const ctx = (): EditContext => ({
    id: makeId,
    updatedAt: new Date().toISOString(),
  });
  const apply = (next: WorkDay) => {
    if (first || next === day) return;
    store.saveDay(next);
  };

  // The edits, as the buttons and the keys and the menu all reach them.
  const state = totals.state;
  // The face. Before there is a project it is the way to one: a day cannot
  // be started until there is something to log it against, and the form is
  // the answer rather than a refusal.
  const toggleWork = () => {
    if (first) {
      setAdding(true);
      return;
    }
    apply(
      state === "out"
        ? clockIn(day, now.seconds, ctx())
        : clockOut(day, now.seconds, ctx()),
    );
  };
  const pickCategory = (id: string) => {
    if (state === "out") return;
    const on = totals.currentCategoryId === id;
    apply(setCategory(day, on ? null : id, now.seconds, ctx()));
  };
  const pickBreak = (id: string, minutes: number) => {
    if (state === "out") return;
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
    // S answers on the first run too, and opens the form the face opens.
    if (command.kind === "toggleWork") {
      toggleWork();
      return true;
    }
    if (first) return false;
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
  const current = totals.currentBreak;
  const currentName = current ? breakName(t, project, current.typeId) : null;
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
  const tabWorked = formatDuration(totals.worked);
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

  const stampProject = (patch: Partial<Project>) => {
    if (first) return;
    store.saveProject({
      ...project,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const expected = isWorkDay(project, now.today);
  const onBreak = state === "break";
  /** Before the day has started the pills take no tap — but they still take a
   *  hold, so they say so rather than being shut. */
  const out = state === "out";
  const session = latestSession(day);
  const fraction = progress(totals.worked, project);
  /** When today's hours are done, if the work goes on from here unbroken.
   *  Null on a day the project expects nothing of, before the day has
   *  started, and while a break is on — `workdayEnd` decides all three, so
   *  neither the line nor the dial has to. One figure, read twice: the line
   *  prints it and the clock marks it on the day's track, so a break takes
   *  it off both at once. */
  const endsAt = workdayEnd(day, project, now.seconds);
  /** A day begun late runs out after midnight. That end is still this day's —
   *  the record it closes goes on counting into the 25th hour — but the line
   *  prints a moment nobody has reached yet, and a moment you are waiting for
   *  is the one your own clock will show. So the figure is the wall clock's
   *  and the day it falls on is said rather than counted. A moment already
   *  passed is always this day's: `now` never reaches midnight. */
  const endsTomorrow = endsAt !== null && endsAt >= DAY_SECONDS;
  const endsLabel =
    endsAt === null
      ? null
      : t(
          endsAt <= now.seconds
            ? "today.endedAt"
            : endsTomorrow
              ? "today.endsAtTomorrow"
              : "today.endsAt",
          { time: formatWallTime(endsAt) },
        );

  /** The kinds of work the day has actually been labelled with, in the
   *  project's own order — which is where their hues come from, so the key
   *  is read in the order the pills are. */
  const drawnCategories = project.categories.filter((c) =>
    drawn.categoryIds.includes(c.id),
  );
  const hasLegend = drawn.work || drawn.break || drawnCategories.length > 0;

  /** Which kinds get a button of their own, and which wait in the row's "…".
   *  A project keeps its own order either way — the "…" is a shorter version
   *  of the same list, not a second one. */
  const pinnedBreaks = project.breakTypes.filter(isPinned);
  const restBreaks = project.breakTypes.filter((b) => !isPinned(b));
  const pinnedCategories = project.categories.filter(isPinned);
  const restCategories = project.categories.filter((c) => !isPinned(c));

  const stateLine = first
    ? t("today.state.noProject")
    : state === "working" && totals.openSession
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

  // A break and a kind of work as a row of a menu. One pair of builders
  // because there are three menus over them — the right button's, and the
  // "…" at the end of each row — and a row that said something different in
  // one of them would be a second vocabulary for the same button.
  const breakRow = (b: Project["breakTypes"][number]): RowAction => ({
    label:
      current?.typeId === b.id
        ? t("today.endBreak", { name: b.name })
        : t("today.menuBreak", {
            name: b.name,
            minutes: String(b.defaultMinutes),
          }),
    icon: (
      <KindGlyph
        id={glyphFor(b.glyph, "break")}
        className="h-4 w-4 text-flag"
      />
    ),
    onSelect: () => pickBreak(b.id, b.defaultMinutes),
  });
  const categoryRow = (c: Project["categories"][number]): RowAction => {
    const on = totals.currentCategoryId === c.id;
    return {
      label: on ? t("today.stopLabelling", { name: c.name }) : c.name,
      icon: (
        <KindGlyph
          id={glyphFor(c.glyph, "category")}
          className="h-4 w-4"
          style={{ color: categoryColor(project, c.id) }}
        />
      ),
      onSelect: () => pickCategory(c.id),
    };
  };
  /** The row that invents one, which is in every "…" whatever the day is
   *  doing — naming a kind is a change to the project. */
  const customRow = (kind: Asking["kind"]): RowAction => ({
    label: t("today.custom"),
    icon: <PlusIcon className="h-4 w-4" />,
    onSelect: () => setAsking({ kind, id: null }),
  });

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
    ...(state !== "out" ? project.breakTypes.map(breakRow) : []),
    ...(state !== "out" ? project.categories.map(categoryRow) : []),
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
    <div
      className={`app-today flex flex-1 flex-col gap-3 px-3 py-3 ${
        // Nothing under the watch on the first run, so on the phone's column
        // it stands in the middle of the screen rather than at the top of an
        // empty one. Layout only, and only while there is no project: where
        // the controls stand beside the dial the row is a grid that centres
        // it already (`.app-today`, `styles.css`).
        first ? "justify-center" : ""
      }`}
    >
      {/* The dial, and under it the one line of words: what the day is doing
          and since when. The line is a button — the arrival is the time of
          day that is wrong most often, and this is where you see it. */}
      <div data-area="dial" className="flex flex-col items-center gap-2">
        {/* On a desk the slot is sized by height rather than width, and the
            size is the share of the window it may take (`styles.css`). */}
        <div
          className="app-dial-slot w-full"
          style={
            { "--dial-share": CLOCK_SIZE[clockSize].share } as Record<
              string,
              number
            >
          }
        >
          <ClockFace
            day={day}
            project={project}
            now={now.seconds}
            state={state}
            dial={dial}
            size={clockSize}
            backlight={backlight}
            reflect={reflect}
            progress={fraction}
            endsAt={endsAt}
            onToggle={toggleWork}
            // On the first run the whole watch is the one button: there is
            // no record out on the ring to correct, so the press that would
            // open the day's stretches opens the form instead.
            onOpen={(at) =>
              first ? setAdding(true) : setTimeline({ at: at ?? null })
            }
            onMenu={(x, y) => {
              if (!first) setMenu({ x, y });
            }}
            onOpenSettings={onOpenSettings}
            settingsOpen={settingsOpen}
          />
        </div>
        {/* The words under the dial, in a block of their own with the room
            for both of them held whatever is on: the hint is a line on the
            screen before the first press and nothing at all after it, and
            where the dial is sized by the height left over — the desk and
            the stand — a sibling that comes and goes is a watch that changes
            size when the day starts. */}
        <div className="app-dial-note flex flex-col items-center gap-2">
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
            {/* And when the day is done. A word and a time rather than a
              sentence: the line is read at a glance, and "Ends 16:42" is
              the whole of what it has to say. The sentence is there for a
              screen reader and for whoever rests on it.

              It was the door with an arrow out of it the menu puts on
              stopping work, and a mark that has to be learnt is read as
              decoration until it is — between the dot before it and the
              two figures either side, it came out as punctuation. So the
              third thing on the line is divided from the second the way the
              second is divided from the first: a dot, and then a word. The
              word is the one the moment deserves — it says "Ended" once the
              hours are done, because a line that went on promising an end
              already passed would be the one thing this figure may not
              do. */}
            {endsAt !== null && endsLabel !== null && (
              <span className="whitespace-nowrap" title={endsLabel}>
                <span aria-hidden="true">
                  {" · "}
                  {t(endsAt <= now.seconds ? "today.ended" : "today.ends")}{" "}
                  <span className="tabular-nums">{formatWallTime(endsAt)}</span>
                  {/* The next day's, marked the way a timetable marks it.
                      The sentence in the tooltip and under the screen reader
                      says "tomorrow" in full; out here it is one mark,
                      because the line is read at a glance. */}
                  {endsTomorrow && (
                    <span className="align-super text-[0.7em]">
                      {t("today.nextDay")}
                    </span>
                  )}
                </span>
                {/* The words out here are the short form of this sentence,
                    so the reader is given the sentence and not both. */}
                <span className="sr-only">{` · ${endsLabel}`}</span>
              </span>
            )}
            <span className="sr-only">
              {" · "}
              {t("today.percentOfTarget", { percent: formatPercent(fraction) })}
            </span>
          </button>
          {/* The press nobody has been told about: the one that makes the
              first project, and after that the first of the day. */}
          {(first || (state === "out" && totals.lastOut === null)) && (
            <p className="text-xs text-muted">
              {t(first ? "today.noProjectHint" : "today.outHint")}
            </p>
          )}
        </div>
      </div>

      {/* The legend names the colours on the day's track, and only those. A
          hue the day is not wearing sends the reader hunting round the dial
          for a band that is not there, so each entry waits for its own: work
          for the accent, a break for the flag, a kind of work for its own
          hue. Before the first clock-in that leaves nothing, and there is no
          legend at all — the dial is empty and the line under it says to
          press the clock. */}
      {hasLegend && (
        <ul
          data-area="legend"
          className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted"
        >
          {drawn.work && (
            <Swatch
              color="var(--color-accent)"
              label={t("today.legend.work")}
            />
          )}
          {drawn.break && (
            <Swatch color="var(--color-flag)" label={t("today.legend.break")} />
          )}
          {drawnCategories.map((c) => (
            <Swatch
              key={c.id}
              color={categoryColor(project, c.id)}
              glyph={glyphFor(c.glyph, "category")}
              label={c.name}
            />
          ))}
        </ul>
      )}

      {/* The breaks and the kinds of work are the project's own vocabulary,
          so before there is a project there are none of them: the screen is
          the watch and the words under it, and the only thing to do is press
          it. */}
      {!first && (
        <>
          <section data-area="breaks" className="flex flex-col gap-1.5">
            <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
              {t("today.breaks")}
            </h2>
            {/* The breaks and the one square that invents another, on the
                same row: a grid of equal columns put "Custom" on a line of
                its own below two breaks, which is a whole row of a phone's
                screen spent on the least-used control there is. So the
                breaks share what is left after the square, wrapping when a
                project has more of them than the row holds. */}
            <div className="flex flex-wrap gap-2 wide:flex-col wide:flex-nowrap">
              {pinnedBreaks.map((b) => {
                const running = current?.typeId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    aria-disabled={out}
                    aria-pressed={running}
                    {...press({
                      press: () => pickBreak(b.id, b.defaultMinutes),
                      hold: () => setAsking({ kind: "break", id: b.id }),
                    })}
                    title={`${
                      running
                        ? t("today.endBreak", { name: b.name })
                        : t("today.menuBreak", {
                            name: b.name,
                            minutes: String(b.defaultMinutes),
                          })
                    } · ${t("today.holdToEdit")}`}
                    className={`flex min-h-12 grow basis-32 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors wide:basis-auto wide:justify-start ${
                      out ? "opacity-40" : ""
                    } ${
                      running
                        ? "border-flag bg-flag/20 text-fg-bright"
                        : "border-line bg-surface-3 text-fg hover:bg-surface-2"
                    }`}
                  >
                    <KindGlyph
                      id={glyphFor(b.glyph, "break")}
                      className="h-4 w-4 shrink-0 text-flag"
                    />
                    <span className="truncate">
                      {running ? t("today.endBreak", { name: b.name }) : b.name}
                    </span>
                    {!running && (
                      <span className="text-xs font-normal text-muted wide:ml-auto">
                        {b.defaultMinutes}m
                      </span>
                    )}
                  </button>
                );
              })}
              <MoreButton
                ref={breakMoreRef}
                label={t("today.moreBreaks")}
                open={more === "break"}
                onToggle={() =>
                  setMore((m) => (m === "break" ? null : "break"))
                }
                className="rounded-xl"
              />
            </div>
          </section>

          <section data-area="kinds" className="flex flex-col gap-1.5">
            <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
              {t("today.categories")}
            </h2>
            {/* Pills on a phone, a column beside the dial when the controls
                stand there. `flex-nowrap` with the column: wrapping is what
                makes the pills a paragraph on the phone, and the same
                wrapping in a column is a *second* column — a project with
                more kinds of work than the window is tall spilled them off
                the right-hand edge of the screen instead of scrolling the
                one it has (`styles.css`). */}
            <div className="flex flex-wrap gap-2 wide:flex-col wide:flex-nowrap">
              {pinnedCategories.map((c) => {
                const i = project.categories.indexOf(c);
                const on = totals.currentCategoryId === c.id;
                const key = KEY_HINT.category(i);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-disabled={out}
                    aria-pressed={on}
                    {...press({
                      press: () => pickCategory(c.id),
                      hold: () => setAsking({ kind: "activity", id: c.id }),
                    })}
                    title={`${c.name}${key ? ` (${key})` : ""} · ${t("today.holdToEdit")}`}
                    className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors wide:rounded-xl wide:font-semibold ${
                      out ? "opacity-40" : ""
                    } ${categoryTone(on)}`}
                  >
                    <KindGlyph
                      id={glyphFor(c.glyph, "category")}
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
                      <span className="text-xs font-normal text-muted tabular-nums wide:ml-auto">
                        {formatDuration(totals.categories[c.id]!)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              <MoreButton
                ref={kindMoreRef}
                label={t("today.moreKinds")}
                open={more === "activity"}
                onToggle={() =>
                  setMore((m) => (m === "activity" ? null : "activity"))
                }
                className="rounded-full wide:rounded-xl"
              />
            </div>
            {onBreak && (
              <p className="app-hint text-xs text-muted">
                {t("today.pausedHint")}
              </p>
            )}
          </section>
        </>
      )}

      {/* The rest of each row. The kinds themselves are only in it while
          there is a day to log them against — the same guard the right
          button's menu has always had, and the reason the pills beside it go
          pale rather than disappear. "Custom" is in it either way. */}
      <FloatingPanel
        open={more === "break"}
        onClose={() => setMore(null)}
        triggerRef={breakMoreRef}
        placement={MORE_MENU}
        className="py-1"
      >
        <ActionMenuList
          actions={[
            ...(state !== "out" ? restBreaks.map(breakRow) : []),
            customRow("break"),
          ]}
          ariaLabel={t("today.moreBreaks")}
          onActivate={(action) => {
            setMore(null);
            action.onSelect();
          }}
        />
      </FloatingPanel>

      <FloatingPanel
        open={more === "activity"}
        onClose={() => setMore(null)}
        triggerRef={kindMoreRef}
        placement={MORE_MENU}
        className="py-1"
      >
        <ActionMenuList
          actions={[
            ...(state !== "out" ? restCategories.map(categoryRow) : []),
            customRow("activity"),
          ]}
          ariaLabel={t("today.moreKinds")}
          onActivate={(action) => {
            setMore(null);
            action.onSelect();
          }}
        />
      </FloatingPanel>

      <ContextMenu
        position={menu}
        actions={menuActions}
        onClose={() => setMenu(null)}
        ariaLabel={t("today.menuLabel")}
      />

      {/* The first project, made from the dial. The same editor the
          Projects screen opens, so there is one project form; saving it puts
          it in use and the watch behind the sheet is ready for the day. */}
      {adding && (
        <ProjectEditModal
          project={null}
          onSave={(made) => {
            store.saveProject(made);
            onProjectAdded(made.id);
            onNotice(t("projects.saved"));
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      )}

      {arriving && session && (
        <ArrivalModal
          start={session.start}
          min={earliestArrival(day, session.start)}
          max={Math.min(now.seconds, (session.end ?? Infinity) - 60)}
          workedAt={(start) =>
            dayTotals(
              setSessionStart(day, session.id, start, ctx()),
              project,
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
              return false;
            }
            apply(next);
            return true;
          }}
          onClose={() => setTimeline(null)}
        />
      )}

      {asking && (
        <KindModal
          kind={asking.kind}
          existing={kindAsked(project, asking)}
          // A kind invented before the day has started only joins the
          // project: the edits below want an open session and hand the day
          // straight back without one.
          starts={state !== "out"}
          // "Automatic" is the hue the kind's place in the list gives it —
          // the slot after the last for one being invented, which is what an
          // id the project does not have yet asks for.
          autoColor={autoCategoryColor(project, asking.id ?? "")}
          onSave={({ name, minutes, glyph, color, credit, pinned }) => {
            // A kind that already exists keeps its id, so nothing logged
            // under it moves; only what it is called and what it wears
            // change, and every screen that reads `labels.ts` follows.
            const at = asking.id;
            if (at !== null) {
              if (asking.kind === "break") {
                stampProject({
                  breakTypes: project.breakTypes.map((b) => {
                    if (b.id !== at) return b;
                    // "No" is stored as no credit at all, and so is
                    // "shown", the way "automatic" is stored as no colour.
                    const rest = { ...b, name, defaultMinutes: minutes, glyph };
                    delete rest.credit;
                    delete rest.pinned;
                    return {
                      ...rest,
                      ...storedCredit(credit),
                      ...storedPinned(pinned),
                    };
                  }),
                });
              } else {
                stampProject({
                  categories: project.categories.map((c) => {
                    if (c.id !== at) return c;
                    // "Automatic" is stored as no colour at all, so the kind
                    // goes on taking its position's hue.
                    const rest = { ...c, name, glyph };
                    delete rest.color;
                    delete rest.pinned;
                    return {
                      ...rest,
                      ...(color ? { color } : {}),
                      ...storedPinned(pinned),
                    };
                  }),
                });
              }
              onNotice(t("log.saved"));
              setAsking(null);
              return;
            }
            const id = makeId();
            if (asking.kind === "break") {
              stampProject({
                breakTypes: [
                  ...project.breakTypes,
                  {
                    id,
                    name,
                    defaultMinutes: minutes,
                    glyph,
                    ...storedCredit(credit),
                    ...storedPinned(pinned),
                  },
                ],
              });
              apply(takeBreak(day, id, now.seconds, minutes * 60, ctx()));
            } else {
              stampProject({
                categories: [
                  ...project.categories,
                  {
                    id,
                    name,
                    glyph,
                    ...(color ? { color } : {}),
                    ...storedPinned(pinned),
                  },
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

/** The kind the form opens on, as the form takes it: what a held pill wears
 *  now, or null when the form is inventing one. A kind the project has since
 *  lost is nothing to correct, so that is null too. */
function kindAsked(project: Project, asking: Asking): NewKind | null {
  if (asking.id === null) return null;
  if (asking.kind === "break") {
    const b = breakTypeOf(project, asking.id);
    return b
      ? {
          name: b.name,
          minutes: b.defaultMinutes,
          glyph: glyphFor(b.glyph, "break"),
          color: null,
          credit: b.credit ?? DEFAULT_BREAK_CREDIT,
          pinned: isPinned(b),
        }
      : null;
  }
  const c = categoryOf(project, asking.id);
  return c
    ? {
        // A kind of work has no assumed length and nothing to count back;
        // the form asks for neither.
        name: c.name,
        minutes: 0,
        glyph: glyphFor(c.glyph, "category"),
        color: c.color ?? null,
        credit: DEFAULT_BREAK_CREDIT,
        pinned: isPinned(c),
      }
    : null;
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
