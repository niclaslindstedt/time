// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useId, useMemo, useRef, useState, type ReactNode } from "react";

import { addDays, type DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  ActionMenuList,
  ChevronLeftIcon,
  ChevronRightIcon,
  ConfirmDialog,
  FloatingPanel,
  IconButton,
  PlusIcon,
  TrashIcon,
  type FloatingPlacement,
  type RowAction,
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
import { formatFullDay, formatTimeOfDay } from "./format.ts";
import { DayGlance } from "./DayGlance.tsx";
import { CupIcon, EnterIcon, KindGlyph, MoreIcon, TagIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import type { GlyphId } from "./kinds.ts";
import {
  breakGlyph,
  breakName,
  categoryColor,
  categoryGlyph,
  categoryName,
  dayHeadline,
} from "./labels.ts";
import { SpanEditModal, type SpanDraft } from "./SpanEditModal.tsx";
import {
  blankDay,
  dayFor,
  type Project,
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
  project: Project | null;
  onNotice: (message: string) => void;
};

type Editing = { kind: SpanKind; draft: SpanDraft | null };

export function LogScreen({ store, project, onNotice }: Props) {
  const t = useT();
  const now = useNow(60_000);
  const [date, setDate] = useState<DayKey>(now.today);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dayMenu, setDayMenu] = useState(false);
  const dayMenuRef = useRef<HTMLButtonElement>(null);

  const stored = project ? dayFor(store.data, project.id, date) : null;
  const day = useMemo<WorkDay | null>(
    () =>
      project
        ? (stored ?? blankDay(project.id, date, new Date().toISOString()))
        : null,
    [project, stored, date],
  );
  const upTo = date === now.today ? now.seconds : END_OF_DAY;
  const totals = useMemo(
    () => (day ? dayTotals(day, upTo) : null),
    [day, upTo],
  );

  if (!project || !day || !totals) {
    return (
      <div className="px-3 py-3">
        <div className="rounded-2xl border border-line bg-surface-3 p-6 text-center">
          <p className="text-sm text-muted">{t("log.noProject")}</p>
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

  // A row's mark is the kind's own, in the kind's own colour — a break in the
  // flag colour, a kind of work in its hue — so the list is scanned the same
  // way the Today screen's buttons are. A session has neither: it is presence,
  // not a kind of anything.
  const spanRow = (
    kind: SpanKind,
    span: Span,
    label: string,
    color: string | null,
    typeId: string | null,
    glyph: GlyphId | null = null,
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
        {color &&
          (glyph ? (
            <KindGlyph
              id={glyph}
              className="h-4 w-4 shrink-0"
              style={{ color }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: color }}
            />
          ))}
        <span className="min-w-0 flex-1 truncate text-fg-bright">{label}</span>
        <span className="flex shrink-0 items-center gap-1">
          <TimePill>{formatTimeOfDay(span.start)}</TimePill>
          <span aria-hidden="true" className="text-muted">
            –
          </span>
          {span.end === null ? (
            <TimePill running>{t("log.running")}</TimePill>
          ) : (
            <TimePill>{formatTimeOfDay(span.end)}</TimePill>
          )}
        </span>
      </button>
    </li>
  );

  const empty =
    day.sessions.length + day.breaks.length + day.activities.length === 0;

  const dayActions: RowAction[] = [
    {
      label: t("common.delete"),
      icon: <TrashIcon className="h-4 w-4" />,
      danger: true,
      onSelect: () => setConfirmDelete(true),
    },
  ];

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <IconButton
          label={t("common.previous")}
          onClick={() => setDate((d) => addDays(d, -1))}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setDate(now.today)}
            className="min-w-0 rounded-md px-2 py-0.5 text-center hover:bg-surface-2"
          >
            <span className="block truncate text-lg font-bold text-fg-bright">
              {dayHeadline(t, date, now.today)}
            </span>
            <span className="block truncate text-xs text-muted">
              {formatFullDay(date)}
            </span>
          </button>
          <IconButton
            ref={dayMenuRef}
            label={t("log.dayMenu")}
            expanded={dayMenu}
            disabled={!stored}
            className="h-8 w-8 border-transparent"
            onClick={() => setDayMenu((open) => !open)}
          >
            <MoreIcon className="h-5 w-5" />
          </IconButton>
        </div>
        <IconButton
          label={t("common.next")}
          onClick={() => setDate((d) => addDays(d, 1))}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </IconButton>
      </div>

      <DayGlance day={day} totals={totals} upTo={upTo} />

      {empty && <p className="px-1 text-xs text-muted">{t("log.empty")}</p>}

      <LogSection
        title={t("log.sessions")}
        icon={<EnterIcon className="h-3.5 w-3.5" />}
        addLabel={t("log.addSession")}
        onAdd={() => setEditing({ kind: "session", draft: null })}
      >
        {[...day.sessions]
          .sort((a, b) => a.start - b.start)
          .map((x) => spanRow("session", x, t("log.sessions"), null, null))}
      </LogSection>

      <LogSection
        title={t("log.breaks")}
        icon={<CupIcon className="h-3.5 w-3.5" />}
        addLabel={t("log.addBreak")}
        onAdd={
          project.breakTypes.length === 0
            ? null
            : () => setEditing({ kind: "break", draft: null })
        }
      >
        {[...day.breaks]
          .sort((a, b) => a.start - b.start)
          .map((x) =>
            spanRow(
              "break",
              x,
              breakName(t, project, x.typeId),
              "var(--color-flag)",
              x.typeId,
              breakGlyph(project, x.typeId),
            ),
          )}
      </LogSection>

      <LogSection
        title={t("log.activities")}
        icon={<TagIcon className="h-3.5 w-3.5" />}
        addLabel={t("log.addActivity")}
        onAdd={
          project.categories.length === 0
            ? null
            : () => setEditing({ kind: "activity", draft: null })
        }
      >
        {[...day.activities]
          .sort((a, b) => a.start - b.start)
          .map((x) =>
            spanRow(
              "activity",
              x,
              categoryName(t, project, x.categoryId),
              categoryColor(project, x.categoryId),
              x.categoryId,
              categoryGlyph(project, x.categoryId),
            ),
          )}
      </LogSection>

      <FloatingPanel
        open={dayMenu && stored !== null}
        onClose={() => setDayMenu(false)}
        triggerRef={dayMenuRef}
        placement={DAY_MENU}
        className="py-1"
      >
        <ActionMenuList
          actions={dayActions}
          ariaLabel={t("log.dayMenu")}
          onActivate={(action) => {
            setDayMenu(false);
            action.onSelect();
          }}
        />
      </FloatingPanel>

      {editing && (
        <SpanEditModal
          kind={editing.kind}
          project={project}
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
          store.deleteDay(project.id, date);
          setConfirmDelete(false);
          onNotice(t("log.deleted"));
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/** Where the day's menu hangs: off the right edge of the button, so a menu
 *  opened from the middle of the header falls back under the date rather than
 *  off the side of a phone. */
const DAY_MENU: FloatingPlacement = {
  width: { kind: "min", minPx: 168 },
  anchor: "right",
  gap: 4,
  coordinateSpace: "viewport",
};

/**
 * One of the three lists, as a card: the framework's `Section` chrome with an
 * add button in the corner.
 *
 * The framework's own `Section` is a title and a body, and the button that
 * adds a row used to sit under the rows as a full-width bar — which read as
 * part of the list, and put three of the screen's loudest elements down its
 * middle. Adding a span after the fact is a corner affordance: the title says
 * what the card holds and the `+` beside it adds one. `onAdd` of `null` is a
 * card with nothing to add yet — a project with no kinds of break — and the
 * button is disabled rather than missing, so the row of cards keeps its shape.
 */
function LogSection({
  title,
  icon,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  icon: ReactNode;
  addLabel: string;
  onAdd: (() => void) | null;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="rounded border border-line bg-surface-3 p-3"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span
          id={titleId}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-bold tracking-wide text-muted uppercase"
        >
          <span aria-hidden="true" className="shrink-0">
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </span>
        <button
          type="button"
          aria-label={addLabel}
          title={addLabel}
          disabled={onAdd === null}
          onClick={() => onAdd?.()}
          className="-my-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      <ul className="-mx-2 flex flex-col">{children}</ul>
    </div>
  );
}

/** A time of day, as a chip. A row is two of them either side of a dash, and
 *  the pair is what the eye lands on — the label beside it is the kind, and
 *  the kind is rarely what a wrong row is wrong about. */
function TimePill({
  children,
  running = false,
}: {
  children: ReactNode;
  running?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
        running ? "bg-accent/15 text-accent" : "bg-surface-2 text-fg-bright"
      }`}
    >
      {children}
    </span>
  );
}
