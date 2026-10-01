// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import { Modal } from "@niclaslindstedt/oss-framework/components";

import {
  formatDuration,
  formatTimeOfDay,
  parseTimeOfDay,
  toTimeInput,
} from "./format.ts";
import { useT } from "./i18n/index.ts";
import { ModalHeader } from "./ModalHeader.tsx";
import type { Seconds } from "./types.ts";

// What the line under the dial opens: the moment you got in, moved — or,
// once the day is stopped, the moment you left.
//
// The arrival is the one time of day that is wrong most often, because the
// app tends to be opened after the fact — you are at the desk, the kettle
// has boiled and the clock says twenty past. The departure is the other end
// of the same habit: the watch stopped on the sofa rather than at the door.
// Both are almost always earlier than the moment they were tapped, so the
// nudges go backwards first, and the modal says what the correction makes of
// the day before it is saved.

/** The nudges offered, in minutes. Backwards first: the moment is almost
 *  always earlier than the one it was tapped at, never later. */
const STEPS = [-30, -15, -5, 5];

/** Which end of the stretch is being moved. */
export type Edge = "start" | "end";

type Props = {
  edge: Edge;
  /** The moment as it stands. */
  value: Seconds;
  /** The earliest it may be moved to: for an arrival the end of the stretch
   *  before it, or midnight; for a departure a minute into the stretch. */
  min: Seconds;
  /** The latest: for an arrival now, or a minute inside the stretch's own
   *  end; for a departure now, or the start of the stretch after it. */
  max: Seconds;
  /** What the day would have worked had the moment been another — the real
   *  derivation, so the number under the field is the number the day will
   *  show, breaks and all. */
  workedAt: (at: Seconds) => Seconds;
  onSave: (at: Seconds) => void;
  onClose: () => void;
};

const COPY = {
  start: {
    title: "today.arrivalTitle",
    hint: "today.arrivalHint",
    worked: "today.arrivalWorked",
    field: "editor.start",
  },
  end: {
    title: "today.departureTitle",
    hint: "today.departureHint",
    worked: "today.departureWorked",
    field: "editor.end",
  },
} as const;

export function ArrivalModal({
  edge,
  value,
  min,
  max,
  workedAt,
  onSave,
  onClose,
}: Props) {
  const t = useT();
  const copy = COPY[edge];
  const [at, setAt] = useState<Seconds>(value);
  const clamp = (next: Seconds) => Math.min(max, Math.max(min, next));

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={`${edge}-moment-title`}
      closeLabel={t("common.close")}
      centered
      size="max-w-sm"
    >
      <ModalHeader
        titleId={`${edge}-moment-title`}
        title={t(copy.title)}
        onCancel={onClose}
        onSave={() => onSave(at)}
        saveDisabled={at === value}
      />

      <div className="flex flex-col gap-4 overflow-y-auto px-3 py-4">
        <p className="text-xs text-muted">{t(copy.hint)}</p>

        <div className="flex items-baseline justify-center gap-3">
          <span className="text-3xl font-bold text-fg-bright tabular-nums">
            {formatTimeOfDay(at)}
          </span>
          <span className="text-sm text-muted">
            {t(copy.worked, {
              duration: formatDuration(workedAt(at)),
            })}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-label={
                minutes < 0
                  ? t("today.arrivalEarlier", { minutes: String(-minutes) })
                  : t("today.arrivalLater", { minutes: String(minutes) })
              }
              onClick={() => setAt((current) => clamp(current + minutes * 60))}
              className="min-h-11 rounded-xl border border-line bg-surface-3 text-sm font-bold text-fg tabular-nums hover:bg-surface-2"
            >
              {minutes > 0 ? `+${minutes}` : `\u2212${-minutes}`}
            </button>
          ))}
        </div>

        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted">{t(copy.field)}</span>
          {/* Uncontrolled and keyed on the draft, so the nudges above reseed
              it without React re-assigning the value under iOS's picker. */}
          <input
            key={at}
            type="time"
            defaultValue={toTimeInput(at)}
            onBlur={(e) => {
              const next = parseTimeOfDay(e.currentTarget.value);
              if (next !== null) setAt(clamp(next));
            }}
            className="w-full min-w-0 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-sm text-fg tabular-nums outline-none focus:border-accent"
          />
        </label>
      </div>
    </Modal>
  );
}
