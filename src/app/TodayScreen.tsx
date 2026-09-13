// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import { Button, PlusIcon } from "@niclaslindstedt/oss-framework/components";

import {
  addBreak,
  addBreakEndingAt,
  clockIn,
  clockOut,
  endBreak,
  setCategory,
  startBreak,
  type EditContext,
} from "./actions.ts";
import { ClockFace } from "./ClockFace.tsx";
import { dayTotals, progress } from "./day.ts";
import { isWorkDay, targetSeconds } from "./employer.ts";
import {
  formatBalance,
  formatDuration,
  formatPercent,
  formatTimeOfDay,
  formatTimer,
} from "./format.ts";
import { CupIcon, EnterIcon, LeaveIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import { breakName, categoryColor } from "./labels.ts";
import { runningBalance } from "./report.ts";
import { SpanEditModal } from "./SpanEditModal.tsx";
import { blankDay, dayFor, type Employer, type WorkDay } from "./types.ts";
import type { DocStore } from "./useDocStore.ts";
import { useNow } from "./useNow.ts";

// The first screen: the timer, the clock, and the buttons that move the day
// along. It is the whole app for most of a day — enter, a break or two, a
// category when it changes, leave — so everything is one tap from here and
// nothing needs a second screen.
//
// The screen owns no state beyond the modal it opens. Every number is
// derived from the day's spans up to `now`, once a second, through `day.ts`;
// every button is one of the pure edits in `actions.ts` applied to the day
// and handed back to the store.

type Props = {
  store: DocStore;
  employer: Employer | null;
  weekStartsOn: number;
  onAddEmployer: () => void;
  onNotice: (message: string) => void;
};

export function TodayScreen({
  store,
  employer,
  onAddEmployer,
  onNotice,
}: Props) {
  const t = useT();
  const now = useNow(1000);
  const [adding, setAdding] = useState(false);

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

  const target = targetSeconds(employer);
  const expected = isWorkDay(employer, now.today);
  const state = totals.state;
  const openBreakName = totals.openBreak
    ? breakName(t, employer, totals.openBreak.typeId)
    : null;

  const stateLine =
    state === "working" && totals.openSession
      ? `${t("today.state.working")} · ${t("today.since", { time: formatTimeOfDay(totals.openSession.start) })}`
      : state === "break" && totals.openBreak
        ? `${t("today.state.break")} · ${t("today.breakSince", { name: openBreakName ?? "", time: formatTimeOfDay(totals.openBreak.start) })}`
        : totals.lastOut !== null
          ? `${t("today.state.out")} · ${t("today.doneAt", { time: formatTimeOfDay(totals.lastOut) })}`
          : t("today.state.out");

  return (
    <div className="flex flex-1 flex-col gap-3 px-3 py-3">
      {/* The readout: the timer, the share of the day it is, and the state
          the day is in. Tabular digits so the timer does not jitter. */}
      <div className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-center">
        <p className="text-xs font-bold tracking-wide text-accent uppercase">
          {stateLine}
        </p>
        <div className="mt-1 flex items-baseline justify-center gap-3">
          <span
            className="text-4xl font-bold text-fg-bright tabular-nums"
            aria-live="off"
          >
            {formatTimer(totals.worked)}
          </span>
          <span className="text-2xl font-semibold text-accent tabular-nums">
            {formatPercent(progress(totals.worked, employer))}
          </span>
        </div>
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
      </div>

      <ClockFace day={day} employer={employer} now={now.seconds} />

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
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
            {t("today.breaks")}
          </h2>
          <button
            type="button"
            className="text-xs text-accent hover:underline"
            onClick={() => setAdding(true)}
          >
            {t("today.addBreak")}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {employer.breakTypes.map((b) => {
            const running = totals.openBreak?.typeId === b.id;
            const disabled = state === "out";
            return (
              <button
                key={b.id}
                type="button"
                disabled={disabled}
                aria-pressed={running}
                onClick={() =>
                  apply(
                    running
                      ? endBreak(day, now.seconds, ctx())
                      : startBreak(day, b.id, now.seconds, ctx()),
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
        </div>
        <p className="text-xs text-muted">
          {state === "out" ? t("today.breaksOutHint") : t("today.breaksHint")}
        </p>
      </section>

      {employer.categories.length > 0 && (
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
                    apply(
                      setCategory(day, on ? null : c.id, now.seconds, ctx()),
                    )
                  }
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors disabled:opacity-40 ${
                    on
                      ? "border-accent bg-accent/15 text-fg-bright"
                      : "border-line bg-surface-3 text-fg hover:bg-surface-2"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: categoryColor(employer, c.id) }}
                  />
                  {c.name}
                  {totals.categories[c.id] ? (
                    <span className="text-xs text-muted tabular-nums">
                      {formatDuration(totals.categories[c.id]!)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">{t("today.categoriesHint")}</p>
        </section>
      )}

      {adding && (
        <SpanEditModal
          kind="break"
          employer={employer}
          initial={null}
          now={now.seconds}
          quick={employer.breakTypes.map((b) => ({
            typeId: b.id,
            label: t("today.justHad", {
              name: b.name,
              minutes: String(b.defaultMinutes),
            }),
            seconds: b.defaultMinutes * 60,
          }))}
          onQuick={(typeId, seconds) => {
            apply(addBreakEndingAt(day, typeId, seconds, now.seconds, ctx()));
            onNotice(t("log.saved"));
            setAdding(false);
          }}
          onSave={(draft) => {
            if (draft.end === null || !draft.typeId) return;
            apply(addBreak(day, draft.typeId, draft.start, draft.end, ctx()));
            onNotice(t("log.saved"));
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
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
