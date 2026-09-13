// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import { addDays, type DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  ConfirmDialog,
  Section,
} from "@niclaslindstedt/oss-framework/components";

import {
  addActivity,
  addBreak,
  addSession,
  removeSpan,
  updateSpan,
  type EditContext,
  type SpanKind,
} from "./actions.ts";
import { END_OF_DAY, dayTotals } from "./day.ts";
import { formatDuration, formatFullDay, formatTimeOfDay } from "./format.ts";
import { CupIcon, EnterIcon, TagIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import {
  breakName,
  categoryColor,
  categoryName,
  dayHeadline,
} from "./labels.ts";
import { SpanEditModal, type SpanDraft } from "./SpanEditModal.tsx";
import {
  blankDay,
  dayFor,
  type Employer,
  type Span,
  type WorkDay,
} from "./types.ts";
import type { DocStore } from "./useDocStore.ts";
import { useNow } from "./useNow.ts";

// The day as a list: what the clock drew, row by row, and the place a wrong
// one is corrected. Today is where a report is *filed*; the Log is where it
// is *fixed*, because a list is where a wrong time is visible.

type Props = {
  store: DocStore;
  employer: Employer | null;
  onNotice: (message: string) => void;
};

type Editing = { kind: SpanKind; draft: SpanDraft | null };

export function LogScreen({ store, employer, onNotice }: Props) {
  const t = useT();
  const now = useNow(60_000);
  const [date, setDate] = useState<DayKey>(now.today);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stored = employer ? dayFor(store.data, employer.id, date) : null;
  const day = useMemo<WorkDay | null>(
    () =>
      employer
        ? (stored ?? blankDay(employer.id, date, new Date().toISOString()))
        : null,
    [employer, stored, date],
  );
  const upTo = date === now.today ? now.seconds : END_OF_DAY;
  const totals = useMemo(
    () => (day ? dayTotals(day, upTo) : null),
    [day, upTo],
  );

  if (!employer || !day || !totals) {
    return (
      <div className="px-3 py-3">
        <div className="rounded-2xl border border-line bg-surface-3 p-6 text-center">
          <p className="text-sm text-muted">{t("log.noEmployer")}</p>
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

  const save = (draft: SpanDraft) => {
    if (!editing) return;
    const { kind } = editing;
    let next = day;
    if (draft.id) {
      next = updateSpan(
        day,
        kind,
        draft.id,
        {
          start: draft.start,
          end: draft.end,
          typeId: draft.typeId ?? undefined,
        },
        ctx(),
      );
    } else if (kind === "session") {
      next = addSession(day, draft.start, draft.end, ctx());
    } else if (kind === "break" && draft.typeId) {
      next =
        draft.end === null
          ? day
          : addBreak(day, draft.typeId, draft.start, draft.end, ctx());
    } else if (kind === "activity" && draft.typeId) {
      next = addActivity(day, draft.typeId, draft.start, draft.end, ctx());
    }
    if (next === day) {
      onNotice(t("editor.tooManyOpen"));
      return;
    }
    apply(next);
    onNotice(t("log.saved"));
    setEditing(null);
  };

  const remove = () => {
    if (!editing?.draft?.id) return;
    apply(removeSpan(day, editing.kind, editing.draft.id, ctx()));
    onNotice(t("log.deleted"));
    setEditing(null);
  };

  const spanRow = (
    kind: SpanKind,
    span: Span,
    label: string,
    color: string | null,
    typeId: string | null,
  ) => (
    <li key={span.id}>
      <button
        type="button"
        onClick={() =>
          setEditing({
            kind,
            draft: { id: span.id, typeId, start: span.start, end: span.end },
          })
        }
        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-surface-2"
      >
        {color && (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
        )}
        <span className="min-w-0 flex-1 truncate text-fg-bright">{label}</span>
        <span className="shrink-0 text-muted tabular-nums">
          {span.end === null
            ? `${formatTimeOfDay(span.start)} – ${t("log.running")}`
            : t("log.span", {
                start: formatTimeOfDay(span.start),
                end: formatTimeOfDay(span.end),
              })}
        </span>
      </button>
    </li>
  );

  const empty =
    day.sessions.length + day.breaks.length + day.activities.length === 0;

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={t("common.previous")}
          onClick={() => setDate((d) => addDays(d, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted hover:bg-surface-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setDate(now.today)}
          className="min-w-0 flex-1 text-center"
        >
          <span className="block text-lg font-bold text-fg-bright">
            {dayHeadline(t, date, now.today)}
          </span>
          <span className="block text-xs text-muted">
            {formatFullDay(date)}
          </span>
        </button>
        <button
          type="button"
          aria-label={t("common.next")}
          onClick={() => setDate((d) => addDays(d, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted hover:bg-surface-2"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat
          label={t("log.firstIn")}
          value={
            totals.firstIn === null ? "—" : formatTimeOfDay(totals.firstIn)
          }
        />
        <Stat
          label={t("log.lastOut")}
          value={
            totals.lastOut === null ? "—" : formatTimeOfDay(totals.lastOut)
          }
        />
        <Stat label={t("log.worked")} value={formatDuration(totals.worked)} />
        <Stat
          label={t("log.breakTotal")}
          value={formatDuration(totals.breakTotal)}
        />
      </div>

      {empty && <p className="px-1 text-xs text-muted">{t("log.empty")}</p>}

      <Section
        title={t("log.sessions")}
        icon={<EnterIcon className="h-3.5 w-3.5" />}
      >
        <ul className="-mx-2 flex flex-col">
          {[...day.sessions]
            .sort((a, b) => a.start - b.start)
            .map((s) => spanRow("session", s, t("log.sessions"), null, null))}
        </ul>
        <Button onClick={() => setEditing({ kind: "session", draft: null })}>
          {t("log.addSession")}
        </Button>
      </Section>

      <Section
        title={t("log.breaks")}
        icon={<CupIcon className="h-3.5 w-3.5" />}
      >
        <ul className="-mx-2 flex flex-col">
          {[...day.breaks]
            .sort((a, b) => a.start - b.start)
            .map((b) =>
              spanRow(
                "break",
                b,
                breakName(t, employer, b.typeId),
                "var(--color-flag)",
                b.typeId,
              ),
            )}
        </ul>
        <Button
          disabled={employer.breakTypes.length === 0}
          onClick={() => setEditing({ kind: "break", draft: null })}
        >
          {t("log.addBreak")}
        </Button>
      </Section>

      <Section
        title={t("log.activities")}
        icon={<TagIcon className="h-3.5 w-3.5" />}
      >
        <ul className="-mx-2 flex flex-col">
          {[...day.activities]
            .sort((a, b) => a.start - b.start)
            .map((a) =>
              spanRow(
                "activity",
                a,
                categoryName(t, employer, a.categoryId),
                categoryColor(employer, a.categoryId),
                a.categoryId,
              ),
            )}
        </ul>
        <Button
          disabled={employer.categories.length === 0}
          onClick={() => setEditing({ kind: "activity", draft: null })}
        >
          {t("log.addActivity")}
        </Button>
      </Section>

      {stored && (
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          {t("log.deleteDay")}
        </Button>
      )}

      {editing && (
        <SpanEditModal
          kind={editing.kind}
          employer={employer}
          initial={editing.draft}
          now={upTo === END_OF_DAY ? 17 * 3600 : now.seconds}
          onSave={save}
          onDelete={editing.draft ? remove : undefined}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t("log.deleteDayConfirm")}
        description={t("log.deleteDayHint", { day: formatFullDay(date) })}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          store.deleteDay(employer.id, date);
          setConfirmDelete(false);
          onNotice(t("log.deleted"));
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-3 px-2 py-2 text-center">
      <p className="text-[0.65rem] tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-fg-bright tabular-nums">
        {value}
      </p>
    </div>
  );
}
