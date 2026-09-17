// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useRef } from "react";

import { blurActiveField } from "@niclaslindstedt/oss-framework/hooks";

import { savesModal, type Focused } from "./shortcuts.ts";

// Enter, inside a modal, is the Save button.
//
// The listener is on the document rather than on the header, because the
// header is a *sibling* of the form it saves — a press in a field never
// bubbles through it. What keeps one modal from answering another's keys is
// the card: each hook finds the `aria-modal` card it is drawn inside and
// stands down unless the press came from within it. A modal stacked over
// another is portalled to the body, so it is not inside the one underneath
// and only the top one ever answers.
//
// The save is deferred a tick, and that is not a flourish. A field that
// commits on blur — which is most of them — has not committed yet at the
// moment Enter is pressed: the value is still the input's own draft. So the
// field is blurred first, which commits it, and the save waits for the
// render that commit causes. By then `onSave` is the closure over the
// *committed* draft, which is why it is read back off a ref rather than
// captured here.

/** Reads a press's target as one of the three kinds `savesModal` knows. */
function focusedKind(target: Node, card: Element): Focused {
  if (target === card || !(target instanceof HTMLElement)) return "card";
  if (target.isContentEditable) return "control";
  if (target.getAttribute("role") === "button") return "control";
  switch (target.tagName) {
    case "BUTTON":
    case "A":
    case "TEXTAREA":
    case "SELECT":
      return "control";
    case "INPUT": {
      const type = (target as HTMLInputElement).type;
      const pressable =
        type === "button" || type === "submit" || type === "reset";
      return pressable ? "control" : "field";
    }
    default:
      return "card";
  }
}

type Params = {
  /** Anything drawn inside the modal's card — the card is found from it. */
  anchor: { current: HTMLElement | null };
  onSave: () => void;
  /** Whether the draft is savable. Read at the moment of the save, after the
   *  focused field has committed, never before. */
  saveDisabled: boolean;
};

export function useModalSave({ anchor, onSave, saveDisabled }: Params) {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const disabledRef = useRef(saveDisabled);
  disabledRef.current = saveDisabled;

  useEffect(() => {
    let alive = true;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.isComposing) return;
      const card = anchor.current?.closest('[aria-modal="true"]');
      if (!card || !(e.target instanceof Node) || !card.contains(e.target)) {
        return;
      }
      const on = focusedKind(e.target, card);
      const mods = {
        alt: e.altKey,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        shift: e.shiftKey,
      };
      if (!savesModal(e.key, mods, on)) return;
      e.preventDefault();
      blurActiveField();
      setTimeout(() => {
        if (alive && !disabledRef.current) onSaveRef.current();
      }, 0);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      document.removeEventListener("keydown", onKey);
    };
  }, [anchor]);
}
