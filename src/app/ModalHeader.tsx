// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { Button } from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";

// The top of every modal that is saved or abandoned: cancel on the left,
// the title between them, save on the right.
//
// They sit at the top because the bottom of the screen belongs to the nav —
// a row of buttons above it is a row of buttons next to the tabs, which on a
// phone is a mis-tap waiting to happen and a second bar's worth of height
// besides. Up here the title carries the row, so the modal spends no extra
// vertical space on it at all.
//
// It is a sibling of the modal's scrolling body rather than part of it, so
// it stays put while a long form scrolls underneath.

type Props = {
  /** The id the modal's `labelledBy` points at. */
  titleId: string;
  title: string;
  onCancel: () => void;
  onSave: () => void;
  /** Whether the draft is savable — the save button is disabled while not. */
  saveDisabled?: boolean;
};

export function ModalHeader({
  titleId,
  title,
  onCancel,
  onSave,
  saveDisabled = false,
}: Props) {
  const t = useT();

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface-3 px-2 py-2">
      <Button className="min-h-10 shrink-0" onClick={onCancel}>
        {t("common.cancel")}
      </Button>
      <h2
        id={titleId}
        className="min-w-0 flex-1 truncate text-center text-sm font-bold text-fg-bright"
      >
        {title}
      </h2>
      <Button
        variant="primary"
        className="min-h-10 shrink-0 font-bold"
        disabled={saveDisabled}
        onClick={onSave}
      >
        {t("common.save")}
      </Button>
    </div>
  );
}
