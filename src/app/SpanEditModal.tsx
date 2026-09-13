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
import type { Employer, Seconds } from "./types.ts";

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
  employer: Employer;
  /** The span being edited, or null when adding one. */
  initial: SpanDraft | null;
  /** The moment "now", for a new span's default start. */
  now: Seconds;
  onSave: (draft: SpanDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export function SpanEditModal({
  kind,
  employer,
  initial,
  now,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const t = useT();
  const options =
    kind === "break"
      ? employer.breakTypes.map((b) => ({ value: b.id, label: b.name }))
      : kind === "activity"
        ? employer.categories.map((c) => ({ value: c.id, label: c.name }))
        : [];
  const [draft, setDraft] = useState<SpanDraft>(
    () =>
      initial ?? {
        id: null,
        typeId: options[0]?.value ?? null,
        // A new span defaults to the last hour: most retroactive entries are
        // the break that just ended.
        start: Math.max(0, now - 3600),
        end: now,
      },
  );
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
        <div className="flex flex-col gap-4 overflow-y-auto px-3 py-4">
          <h2
            id="span-editor-title"
            className="text-lg leading-tight font-bold text-fg-bright"
          >
            {initial
              ? t("log.edit", { kind: kindLabel })
              : t("log.add", { kind: kindLabel })}
          </h2>

          {options.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">
                {kind === "break" ? t("editor.type") : t("editor.category")}
              </span>
              <SegmentedControl
                value={draft.typeId ?? ""}
                options={options}
                onChange={(typeId) => setDraft((d) => ({ ...d, typeId }))}
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
                if (s !== null) setDraft((d) => ({ ...d, start: s }));
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
            onChange={(next) =>
              setDraft((d) => ({
                ...d,
                end: next ? null : Math.max(d.start + 60, now),
              }))
            }
          />
          {!valid && (
            <p className="text-xs text-danger">{t("editor.invalid")}</p>
          )}

          <div className="flex items-center justify-between gap-2">
            {initial && onDelete ? (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                {t("editor.delete")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button onClick={onClose}>{t("common.cancel")}</Button>
              <Button
                variant="primary"
                disabled={!valid}
                onClick={() => onSave(draft)}
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
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
