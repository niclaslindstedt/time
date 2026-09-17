// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Button,
  LABELED_FIELD_CLASS,
  Modal,
} from "@niclaslindstedt/oss-framework/components";

import { clampBreakMinutes } from "./project.ts";
import { useT } from "./i18n/index.ts";

// The "Custom" pill on the Today screen: a kind of break, or a kind of work,
// named on the spot and used immediately.
//
// A new kind is a change to the *project*, not to the day — which is why it
// sticks around afterwards as another pill next to the rest, and why the
// minutes are asked for here: a break type without a length would have
// nothing to assume when it is tapped tomorrow. Editing or removing one is
// still the project form's job; this is only the way in.

/** What a break invented on the spot is assumed to take, before anyone says
 *  otherwise. */
const DEFAULT_MINUTES = 15;

type Props = {
  kind: "break" | "activity";
  onSave: (name: string, minutes: number) => void;
  onClose: () => void;
};

export function NewKindModal({ kind, onSave, onClose }: Props) {
  const t = useT();
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const trimmed = name.trim();

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="new-kind-title"
      closeLabel={t("common.close")}
      centered
      size="max-w-sm"
    >
      <div className="flex flex-col gap-4 overflow-y-auto px-3 py-4">
        <div>
          <h2
            id="new-kind-title"
            className="text-lg leading-tight font-bold text-fg-bright"
          >
            {kind === "break" ? t("today.newBreak") : t("today.newCategory")}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {kind === "break"
              ? t("today.newBreakHint")
              : t("today.newCategoryHint")}
          </p>
        </div>

        {/* Controlled on every keystroke rather than committed on blur: the
            Save button is disabled until there is a name, and a field that
            only commits on blur would have the first tap spent enabling the
            button it was aimed at. */}
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted">{t("today.kindName")}</span>
          <input
            type="text"
            value={name}
            placeholder={t("today.kindNamePlaceholder")}
            autoFocus
            onInput={(e) => setName(e.currentTarget.value)}
            className={LABELED_FIELD_CLASS}
          />
        </label>
        {kind === "break" && (
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-muted">{t("today.kindMinutes")}</span>
            <input
              type="number"
              inputMode="numeric"
              value={String(minutes)}
              onInput={(e) =>
                setMinutes(clampBreakMinutes(e.currentTarget.value, minutes))
              }
              className={LABELED_FIELD_CLASS}
            />
          </label>
        )}

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="primary"
            disabled={trimmed === ""}
            onClick={() => onSave(trimmed, minutes)}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
