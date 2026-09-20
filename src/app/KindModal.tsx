// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useRef, useState } from "react";

import {
  LABELED_FIELD_CLASS,
  Modal,
} from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import {
  CATEGORY_COLOR,
  glyphFor,
  type CategoryColor,
  type GlyphId,
  type KindSort,
} from "./kinds.ts";
import { KindPicker, MarkButton } from "./KindPicker.tsx";
import { clampBreakMinutes } from "./project.ts";
import { ModalHeader } from "./ModalHeader.tsx";
import { BreakCreditField } from "./BreakCreditField.tsx";
import { DEFAULT_BREAK_CREDIT, type BreakCredit } from "./types.ts";

// The Today screen's kind form: a kind of break, or a kind of work — invented
// on the spot from the "Custom" pill, or corrected in place by holding the
// pill it already has.
//
// A kind is a change to the *project*, not to the day — which is why an
// invented one sticks around afterwards as another pill next to the rest, and
// why the minutes are asked for here: a break type without a length would
// have nothing to assume when it is tapped tomorrow. The same goes for the
// mark and, for a kind of work, the colour: a kind invented here is a kind
// like any other, so it is given its look here rather than being sent to the
// project form to be finished.
//
// A kind of break is asked one thing more: how much of one still counts as
// work (see `BreakCreditField`). It belongs here rather than in the project
// form alone because it is the answer that decides when the day is done, and
// the day being done is what this screen is about.
//
// One form for both, because they are the same few questions. Held open on a
// kind that exists, it starts on the grid rather than the name: the mark and
// the hue are what you are looking at when you hold a pill, and the name is
// already right. Removing a kind is still the project form's job — this is
// the way in, and the way to correct what a kind looks like where it is worn.

/** What a break invented on the spot is assumed to take, before anyone says
 *  otherwise. */
const DEFAULT_MINUTES = 15;

/** A kind as this form holds it. `color` is null for "automatic" — the hue
 *  the kind's place in the list gives it — and is always null for a break,
 *  which is the flag colour like every break. `minutes` is a break's assumed
 *  length and `credit` how much of one still counts as work; neither is read
 *  for a kind of work. */
export type NewKind = {
  name: string;
  minutes: number;
  glyph: GlyphId;
  color: CategoryColor | null;
  credit: BreakCredit;
};

type Props = {
  kind: "break" | "activity";
  /** The kind as it stands, when the form was opened on one the project
   *  already has; null when it is being invented. */
  existing?: NewKind | null;
  /** The hue a kind of work would be drawn in if no colour is picked — the
   *  slot of the positional ramp its place in the list gives it. */
  autoColor: string;
  onSave: (kind: NewKind) => void;
  onClose: () => void;
};

export function KindModal({
  kind,
  existing = null,
  autoColor,
  onSave,
  onClose,
}: Props) {
  const t = useT();
  const field = useRef<HTMLInputElement>(null);
  const isBreak = kind === "break";
  const [name, setName] = useState(existing?.name ?? "");
  const [minutes, setMinutes] = useState(existing?.minutes ?? DEFAULT_MINUTES);
  /** Which vocabulary this kind picks from — and, held open on one whose
   *  mark came from the other, what puts it back on its own. */
  const sort: KindSort = isBreak ? "break" : "category";
  const [glyph, setGlyph] = useState<GlyphId>(glyphFor(existing?.glyph, sort));
  const [color, setColor] = useState<CategoryColor | null>(
    existing?.color ?? null,
  );
  const [credit, setCredit] = useState<BreakCredit>(
    existing?.credit ?? DEFAULT_BREAK_CREDIT,
  );
  /** A kind opened by holding its pill was opened to be looked at, so the
   *  grid is already unfolded; an invented one is a name first. */
  const [picking, setPicking] = useState(existing !== null);
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
      labelledBy="kind-modal-title"
      closeLabel={t("common.close")}
      // The keyboard is handed to the name only when there is a name to
      // type. Holding a pill on a phone to change its mark should not also
      // put the keyboard over the grid.
      {...(existing ? {} : { initialFocusRef: field })}
      centered
      size="max-w-sm"
    >
      <ModalHeader
        titleId="kind-modal-title"
        title={
          existing
            ? t("today.editKind", { name: existing.name })
            : isBreak
              ? t("today.newBreak")
              : t("today.newCategory")
        }
        onCancel={onClose}
        onSave={() => onSave({ name: trimmed, minutes, glyph, color, credit })}
        saveDisabled={trimmed === ""}
      />

      <div className="flex flex-col gap-4 overflow-y-auto px-3 py-4">
        <p className="text-xs text-muted">
          {existing
            ? isBreak
              ? t("today.editBreakHint")
              : t("today.editCategoryHint")
            : isBreak
              ? t("today.newBreakHint")
              : t("today.newCategoryHint")}
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
            {/* The keyboard is handed to the field rather than left on the
                card: the name is what an invented kind is for, so it should
                be typed into straight away — and then Enter is Save.
                `autoFocus` will not do it, because the modal claims focus
                for its card after the field has mounted; the ref is what it
                honours. */}
            <input
              ref={field}
              type="text"
              value={name}
              placeholder={t("today.kindNamePlaceholder")}
              onInput={(e) => setName(e.currentTarget.value)}
              className={LABELED_FIELD_CLASS}
            />
          </label>
        </div>
        {picking && (
          <KindPicker
            kind={sort}
            glyph={glyph}
            onGlyph={setGlyph}
            tint={tint}
            {...(isBreak
              ? {}
              : { color, onColor: setColor, autoTint: autoColor })}
          />
        )}
        {isBreak && (
          <>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs text-muted">
                {t("today.kindMinutes")}
              </span>
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
            <BreakCreditField
              credit={credit}
              defaultMinutes={minutes}
              onChange={setCredit}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
