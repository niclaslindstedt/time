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

// What the timer opens: the moment you got in, moved.
//
// It is the one time of day that is wrong most often, because the app tends
// to be opened after the fact — you are at the desk, the kettle has boiled
// and the clock says twenty past. So the nudges go backwards first, and the
// modal says what the correction makes of the day before it is saved.

/** The nudges offered, in minutes. Backwards first: the arrival is almost
 *  always earlier than the moment it was tapped, never later. */
const STEPS = [-30, -15, -5, 5];

type Props = {
  /** The arrival as it stands. */
  start: Seconds;
  /** The earliest the arrival may be moved to: the end of the stretch before
   *  it, or midnight. */
  min: Seconds;
  /** The latest: now, or a minute inside the stretch's own end. */
  max: Seconds;
  /** What the day would have worked had the arrival been at a moment — the
   *  real derivation, so the number under the field is the number the timer
   *  will show, breaks and all. */
  workedAt: (start: Seconds) => Seconds;
  onSave: (start: Seconds) => void;
  onClose: () => void;
};

export function ArrivalModal({
  start,
  min,
  max,
  workedAt,
  onSave,
  onClose,
}: Props) {
  const t = useT();
  const [at, setAt] = useState<Seconds>(start);
  const clamp = (next: Seconds) => Math.min(max, Math.max(min, next));

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="arrival-title"
      closeLabel={t("common.close")}
      centered
      size="max-w-sm"
    >
      <ModalHeader
        titleId="arrival-title"
        title={t("today.arrivalTitle")}
        onCancel={onClose}
        onSave={() => onSave(at)}
        saveDisabled={at === start}
      />

      <div className="flex flex-col gap-4 overflow-y-auto px-3 py-4">
        <p className="text-xs text-muted">{t("today.arrivalHint")}</p>

        <div className="flex items-baseline justify-center gap-3">
          <span className="text-3xl font-bold text-fg-bright tabular-nums">
            {formatTimeOfDay(at)}
          </span>
          <span className="text-sm text-muted">
            {t("today.arrivalWorked", {
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
          <span className="text-xs text-muted">{t("editor.start")}</span>
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
