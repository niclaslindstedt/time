// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Button,
  ConfirmDialog,
  LabeledInput,
  Modal,
  SegmentedControl,
  ToggleRow,
} from "@niclaslindstedt/oss-framework/components";

import { isValidSpan, type SpanKind } from "./actions.ts";
import { parseTimeOfDay, toTimeInput } from "./format.ts";
import { useT } from "./i18n/index.ts";
import { ModalHeader } from "./ModalHeader.tsx";
import { breakTypeOf } from "./project.ts";
import type { Project, Seconds } from "./types.ts";

// The one editor behind every row in the Log: a kind (for a break or an
// activity), a start, an end, and whether the span is still running. It edits
// a draft and hands the result back; the caller turns it into one of the pure
// edits in `actions.ts`.
//
// The Today screen has no way in here — a break is taken with its assumed
// length and corrected on the clock face, and the day's edges are moved in
// the stretch list. This is where a *span* is corrected, one end at a time,
// which is a different job and one the Log is the place for.

export type SpanDraft = {
  id: string | null;
  /** The break type or the category, depending on `kind`. */
  typeId: string | null;
  start: Seconds;
  end: Seconds | null;
};

type Props = {
  kind: SpanKind;
  project: Project;
  /** The span being edited, or null when adding one. */
  initial: SpanDraft | null;
  /** The moment "now", for a new span's default start. */
  now: Seconds;
  onSave: (draft: SpanDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
};

/** How long a new span is assumed to have taken, which is what puts its
 *  start where it does. A break has a length of its own — the project says
 *  how long one is assumed to take, and the Today screen already takes one
 *  that long — and a break is written down here on the way back from it, so
 *  a lunch added at ten past one is the lunch that started at half past
 *  twelve. Nothing else on the day has an assumed length, and an hour is
 *  what a stretch of work or a session gets. */
function assumed(
  kind: SpanKind,
  project: Project,
  typeId: string | null | undefined,
): Seconds {
  const type = kind === "break" && typeId ? breakTypeOf(project, typeId) : null;
  return type ? type.defaultMinutes * 60 : 3600;
}

export function SpanEditModal({
  kind,
  project,
  initial,
  now,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const t = useT();
  const options =
    kind === "break"
      ? project.breakTypes.map((b) => ({ value: b.id, label: b.name }))
      : kind === "activity"
        ? project.categories.map((c) => ({ value: c.id, label: c.name }))
        : [];
  const [draft, setDraft] = useState<SpanDraft>(
    () =>
      initial ?? {
        id: null,
        typeId: options[0]?.value ?? null,
        // A new span ends now and starts however long it is assumed to have
        // taken: most retroactive entries are the break that just ended.
        start: Math.max(0, now - assumed(kind, project, options[0]?.value)),
        end: now,
      },
  );
  /** Whether the times are still the ones the form put there. While they
   *  are, picking a different kind of break moves the start to that break's
   *  own length — the whole point of seeding it. Once a time has been typed
   *  it is the user's, and nothing moves it. */
  const [seeded, setSeeded] = useState(initial === null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const running = draft.end === null;
  const valid =
    isValidSpan(draft.start, draft.end) &&
    (kind === "session" || draft.typeId !== null);
  const kindLabel = t(`editor.kind.${kind}` as const);

  return (
    <>
      <Modal
        open
        onClose={onClose}
        labelledBy="span-editor-title"
        closeLabel={t("common.close")}
        centered
        size="max-w-sm"
      >
        <ModalHeader
          titleId="span-editor-title"
          title={
            initial
              ? t("log.edit", { kind: kindLabel })
              : t("log.add", { kind: kindLabel })
          }
          onCancel={onClose}
          onSave={() => onSave(draft)}
          saveDisabled={!valid}
        />

        <div className="flex flex-col gap-4 overflow-y-auto px-3 py-4">
          {options.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">
                {kind === "break" ? t("editor.type") : t("editor.category")}
              </span>
              <SegmentedControl
                value={draft.typeId ?? ""}
                options={options}
                onChange={(typeId) =>
                  setDraft((d) =>
                    seeded
                      ? {
                          ...d,
                          typeId,
                          start: Math.max(
                            0,
                            (d.end ?? now) - assumed(kind, project, typeId),
                          ),
                        }
                      : { ...d, typeId },
                  )
                }
                ariaLabel={
                  kind === "break" ? t("editor.type") : t("editor.category")
                }
                fullWidth
              />
            </div>
          )}

          {/* `min-w-0` on the columns and on the fields inside them: a
              native time input has an intrinsic width of its own, and
              without a zero minimum the pair pushes the modal's content
              wider than the card — which on a phone clips the right-hand
              field and everything under it. */}
          <div className="grid grid-cols-2 gap-2 [&>*]:min-w-0">
            <LabeledInput
              label={t("editor.start")}
              type="time"
              value={toTimeInput(draft.start)}
              onCommit={(text) => {
                const s = parseTimeOfDay(text);
                if (s === null) return;
                setSeeded(false);
                setDraft((d) => ({ ...d, start: s }));
              }}
            />
            <LabeledInput
              key={running ? "running" : "ended"}
              label={t("editor.end")}
              type="time"
              disabled={running}
              value={running ? "" : toTimeInput(draft.end ?? now)}
              onCommit={(text) => {
                const s = parseTimeOfDay(text);
                if (s === null) return;
                setSeeded(false);
                // An end typed before the start on the clock is the next
                // day's — a night shift, or a lunch that ran past midnight.
                setDraft((d) => ({
                  ...d,
                  end: s < d.start ? s + 86_400 : s,
                }));
              }}
            />
          </div>
          <ToggleRow
            label={t("editor.running")}
            checked={running}
            onChange={(next) => {
              setSeeded(false);
              setDraft((d) => ({
                ...d,
                end: next ? null : Math.max(d.start + 60, now),
              }));
            }}
          />
          {!valid && (
            <p className="text-xs text-danger">{t("editor.invalid")}</p>
          )}

          {/* The one thing left down here: deleting the span is neither
              saving nor abandoning the draft, and it wants to be away from
              the two buttons that are. */}
          {initial && onDelete && (
            <Button
              variant="danger"
              className="w-full"
              onClick={() => setConfirmDelete(true)}
            >
              {t("editor.delete")}
            </Button>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title={t("editor.deleteConfirm", { kind: kindLabel })}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete?.();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
