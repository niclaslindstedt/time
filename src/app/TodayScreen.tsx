// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import { Button, PlusIcon } from "@niclaslindstedt/oss-framework/components";

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
import { isWorkDay, targetSeconds } from "./employer.ts";
import {
  formatBalance,
  formatDuration,
  formatPercent,
  formatTimeOfDay,
  formatTimer,
} from "./format.ts";
import type { ClockSize, DialConfig } from "./look.ts";
import { CupIcon, EnterIcon, LeaveIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import { breakName, categoryColor } from "./labels.ts";
import { NewKindModal } from "./NewKindModal.tsx";
import { ProgressFrame } from "./ProgressFrame.tsx";
import { runningBalance } from "./report.ts";
import {
  blankDay,
  dayFor,
  type Employer,
  type Seconds,
  type WorkDay,
} from "./types.ts";
import type { DocStore } from "./useDocStore.ts";
import { useNow } from "./useNow.ts";

// The first screen: the timer, the clock, and the buttons that move the day
// along. It is the whole app for most of a day — enter, a break or two, a
// category when it changes, leave — so everything is one tap from here and
// nothing needs a second screen.
//
// Three of those taps are corrections rather than records, because a time
// report is written by someone who was busy doing the work: the timer opens
// the arrival, the clock face opens the day's stretches, and "Custom" invents
// the kind of break or work that nobody thought to set up in advance. None of
// them leave this screen.
//
// The screen owns no state beyond the modals it opens. Every number is
// derived from the day's spans up to `now`, once a second, through `day.ts`;
// every button is one of the pure edits in `actions.ts` applied to the day
// and handed back to the store.

type Props = {
  store: DocStore;
  employer: Employer | null;
  weekStartsOn: number;
  /** The dial the settings resolved to, and how big. */
  dial: DialConfig;
  clockSize: ClockSize;
  onAddEmployer: () => void;
  onNotice: (message: string) => void;
};

type Asking = { kind: "break" | "activity" };

export function TodayScreen({
  store,
  employer,
  dial,
  clockSize,
  onAddEmployer,
  onNotice,
}: Props) {
  const t = useT();
  const now = useNow(1000);
  const [arriving, setArriving] = useState(false);
  const [timeline, setTimeline] = useState<{ at: Seconds | null } | null>(null);
  const [asking, setAsking] = useState<Asking | null>(null);

  const day = useMemo<WorkDay | null>(() => {
    if (!employer) return null;
    return (
      dayFor(store.data, employer.id, now.today) ??
      blankDay(employer.id, now.today, new Date().toISOString())
    );
  }, [store.data, employer, now.today]);

  const totals = useMemo(
    () => (day ? dayTotals(day, now.seconds) : null),
    [day, now.seconds],
  );
  const overall = useMemo(
    () =>
      employer
        ? runningBalance(store.data, employer, now.today, now.seconds)
        : 0,
    [store.data, employer, now.today, now.seconds],
  );

  if (!employer || !day || !totals) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-3 py-3">
        <div className="rounded-2xl border border-line bg-surface-3 p-6 text-center">
          <p className="text-sm text-muted">{t("today.noEmployer")}</p>
          <Button variant="primary" className="mt-4" onClick={onAddEmployer}>
            <span className="inline-flex items-center gap-1.5">
              <PlusIcon className="h-4 w-4" />
              {t("today.addEmployer")}
            </span>
          </Button>
        </div>
      </div>
    );
  }

  const ctx = (): EditContext => ({
    id: makeId,
    updatedAt: new Date().toISOString(),
  });
  const apply = (next: WorkDay) => {
    if (next !== day) store.saveDay(next);
  };
  const stampEmployer = (patch: Partial<Employer>) =>
    store.saveEmployer({
      ...employer,
      ...patch,
      updatedAt: new Date().toISOString(),
    });

  const target = targetSeconds(employer);
  const expected = isWorkDay(employer, now.today);
  const state = totals.state;
  const onBreak = state === "break";
  const current = totals.currentBreak;
  const currentName = current ? breakName(t, employer, current.typeId) : null;
  const session = latestSession(day);

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
          : t("today.state.out");

  /** The kinds of work are labels over worked time, so a break stops every
   *  one of them counting (see `day.ts`). The chip says so in the break's own
   *  colour rather than going on looking like the thing being counted. */
  const categoryTone = (on: boolean) =>
    on && onBreak
      ? "border-flag bg-flag/15 text-fg-bright"
      : on
        ? "border-accent bg-accent/15 text-fg-bright"
        : "border-line bg-surface-3 text-fg hover:bg-surface-2";

  return (
    <div className="flex flex-1 flex-col gap-3 px-3 py-3">
      {/* The readout: the timer, the state the day is in, and — as the card's
          own border — how much of the day's target that is. The border starts
          at the top edge's middle and runs clockwise, closing the loop at
          100% and going round again in the flag colour past it, which is why
          there is no percentage printed beside the figure any more: the frame
          is the percentage, and a number saying the same thing twice is one
          of them too many. Tabular digits so the timer does not jitter. The
          timer is a button — the arrival is the time of day that is wrong
          most often, and this is where you are looking when you notice. */}
      <ProgressFrame
        fraction={progress(totals.worked, employer)}
        tone={onBreak ? "flag" : "accent"}
      >
        <p
          className={`text-xs font-bold tracking-wide uppercase ${
            onBreak ? "text-flag" : "text-accent"
          }`}
        >
          {stateLine}
        </p>
        <button
          type="button"
          disabled={!session}
          onClick={() => setArriving(true)}
          aria-label={t("today.arrival")}
          className="mt-1 flex w-full items-baseline justify-center rounded-xl px-2 py-0.5 disabled:cursor-default"
        >
          <span
            className="text-4xl font-bold text-fg-bright tabular-nums"
            aria-live="off"
          >
            {formatTimer(totals.worked)}
          </span>
          <span className="sr-only">
            {t("today.percentOfTarget", {
              percent: formatPercent(progress(totals.worked, employer)),
            })}
          </span>
        </button>
        <p className="mt-0.5 text-xs text-muted">
          {expected
            ? t("today.ofTarget", { target: formatDuration(target) })
            : t("today.dayOff")}
          {" · "}
          {t("today.balanceToday", {
            balance: formatBalance(totals.worked - (expected ? target : 0)),
          })}
          {" · "}
          {t("today.balanceOverall", { balance: formatBalance(overall) })}
        </p>
      </ProgressFrame>

      <ClockFace
        day={day}
        employer={employer}
        now={now.seconds}
        dial={dial}
        size={clockSize}
        onOpen={(at) => setTimeline({ at: at ?? null })}
      />

      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
        <Swatch color="var(--color-accent)" label={t("today.legend.work")} />
        <Swatch color="var(--color-flag)" label={t("today.legend.break")} />
        {employer.categories.map((c) => (
          <Swatch
            key={c.id}
            color={categoryColor(employer, c.id)}
            label={c.name}
          />
        ))}
      </ul>

      {/* The one loud button: in or out. */}
      <button
        type="button"
        onClick={() =>
          apply(
            state === "out"
              ? clockIn(day, now.seconds, ctx())
              : clockOut(day, now.seconds, ctx()),
          )
        }
        className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border text-lg font-bold transition-colors ${
          state === "out"
            ? "border-accent bg-accent text-page-bg hover:bg-accent/90"
            : "border-accent bg-transparent text-accent hover:bg-accent/10"
        }`}
      >
        {state === "out" ? (
          <EnterIcon className="h-6 w-6" />
        ) : (
          <LeaveIcon className="h-6 w-6" />
        )}
        {state === "out" ? t("today.clockIn") : t("today.clockOut")}
      </button>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
          {t("today.breaks")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {employer.breakTypes.map((b) => {
            const running = current?.typeId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                disabled={state === "out"}
                aria-pressed={running}
                onClick={() =>
                  apply(
                    running
                      ? endBreak(day, now.seconds, ctx())
                      : takeBreak(
                          day,
                          b.id,
                          now.seconds,
                          b.defaultMinutes * 60,
                          ctx(),
                        ),
                  )
                }
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
                  running
                    ? "border-flag bg-flag/20 text-fg-bright"
                    : "border-line bg-surface-3 text-fg hover:bg-surface-2"
                }`}
              >
                <CupIcon className="h-4 w-4 shrink-0 text-muted" />
                <span className="truncate">
                  {running ? t("today.endBreak", { name: b.name }) : b.name}
                </span>
                {!running && (
                  <span className="text-xs font-normal text-muted">
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
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-transparent px-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("today.custom")}</span>
          </button>
        </div>
        <p className="text-xs text-muted">
          {state === "out" ? t("today.breaksOutHint") : t("today.breaksHint")}
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
          {t("today.categories")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {employer.categories.map((c) => {
            const on = totals.currentCategoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={state === "out"}
                aria-pressed={on}
                onClick={() =>
                  apply(setCategory(day, on ? null : c.id, now.seconds, ctx()))
                }
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors disabled:opacity-40 ${categoryTone(on)}`}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      on && onBreak
                        ? "var(--color-flag)"
                        : categoryColor(employer, c.id),
                  }}
                />
                {c.name}
                {on && onBreak && (
                  <span className="text-xs font-normal text-flag">
                    {t("today.paused")}
                  </span>
                )}
                {totals.categories[c.id] ? (
                  <span className="text-xs text-muted tabular-nums">
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
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-line px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4" />
            {t("today.custom")}
          </button>
        </div>
        <p className="text-xs text-muted">
          {onBreak ? t("today.pausedHint") : t("today.categoriesHint")}
        </p>
      </section>

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
          employer={employer}
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
          onSave={(name, minutes) => {
            const id = makeId();
            if (asking.kind === "break") {
              stampEmployer({
                breakTypes: [
                  ...employer.breakTypes,
                  { id, name, defaultMinutes: minutes },
                ],
              });
              apply(takeBreak(day, id, now.seconds, minutes * 60, ctx()));
            } else {
              stampEmployer({
                categories: [...employer.categories, { id, name }],
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

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </li>
  );
}
