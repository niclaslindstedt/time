// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  LABELED_FIELD_CLASS,
  Modal,
} from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import {
  CATEGORY_COLOR,
  DEFAULT_BREAK_GLYPH,
  DEFAULT_CATEGORY_GLYPH,
  type CategoryColor,
  type GlyphId,
} from "./kinds.ts";
import { KindPicker, MarkButton } from "./KindPicker.tsx";
import { clampBreakMinutes } from "./project.ts";
import { ModalHeader } from "./ModalHeader.tsx";

// The "Custom" pill on the Today screen: a kind of break, or a kind of work,
// named on the spot and used immediately.
//
// A new kind is a change to the *project*, not to the day — which is why it
// sticks around afterwards as another pill next to the rest, and why the
// minutes are asked for here: a break type without a length would have
// nothing to assume when it is tapped tomorrow. The same goes for the mark
// and, for a kind of work, the colour: a kind invented here is a kind like
// any other, so it is given its look here rather than being sent to the
// project form to be finished. Editing or removing one is still that form's
// job; this is only the way in.

/** What a break invented on the spot is assumed to take, before anyone says
 *  otherwise. */
const DEFAULT_MINUTES = 15;

/** The kind being added, as the Today screen needs it. `color` is null for
 *  "automatic" — the hue the new kind's place in the list gives it — and is
 *  always null for a break, which is the flag colour like every break. */
export type NewKind = {
  name: string;
  minutes: number;
  glyph: GlyphId;
  color: CategoryColor | null;
};

type Props = {
  kind: "break" | "activity";
  /** The hue a kind of work added now would be drawn in if no colour is
   *  picked — the next slot of the positional ramp. */
  autoColor: string;
  onSave: (kind: NewKind) => void;
  onClose: () => void;
};

export function NewKindModal({ kind, autoColor, onSave, onClose }: Props) {
  const t = useT();
  const isBreak = kind === "break";
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [glyph, setGlyph] = useState<GlyphId>(
    isBreak ? DEFAULT_BREAK_GLYPH : DEFAULT_CATEGORY_GLYPH,
  );
  const [color, setColor] = useState<CategoryColor | null>(null);
  const [picking, setPicking] = useState(false);
  const trimmed = name.trim();
  const tint = isBreak
    ? "var(--color-flag)"
    : color
      ? CATEGORY_COLOR[color]
      : autoColor;

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="new-kind-title"
      closeLabel={t("common.close")}
      centered
      size="max-w-sm"
    >
      <ModalHeader
        titleId="new-kind-title"
        title={isBreak ? t("today.newBreak") : t("today.newCategory")}
        onCancel={onClose}
        onSave={() => onSave({ name: trimmed, minutes, glyph, color })}
        saveDisabled={trimmed === ""}
      />

      <div className="flex flex-col gap-4 overflow-y-auto px-3 py-4">
        <p className="text-xs text-muted">
          {isBreak ? t("today.newBreakHint") : t("today.newCategoryHint")}
        </p>

        {/* Controlled on every keystroke rather than committed on blur: the
            Save button is disabled until there is a name, and a field that
            only commits on blur would have the first tap spent enabling the
            button it was aimed at. */}
        <div className="flex items-end gap-2">
          <MarkButton
            glyph={glyph}
            tint={tint}
            label={t("kinds.markOf", { name: trimmed || t("today.custom") })}
            open={picking}
            onToggle={() => setPicking((p) => !p)}
          />
          <label className="flex min-w-0 flex-1 flex-col gap-1">
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
        </div>
        {picking && (
          <KindPicker
            kind={isBreak ? "break" : "category"}
            glyph={glyph}
            onGlyph={setGlyph}
            tint={tint}
            {...(isBreak
              ? {}
              : { color, onColor: setColor, autoTint: autoColor })}
          />
        )}
        {isBreak && (
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
      </div>
    </Modal>
  );
}
