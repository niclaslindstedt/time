// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect } from "react";

import { keyboardIsClaimed } from "@niclaslindstedt/oss-framework/hooks";

import { commandFor, type Command } from "./shortcuts.ts";

// The window's keydown, turned into the commands `shortcuts.ts` names and
// handed to whoever is listening. Two screens listen at once — Today for the
// day's keys, the shell for its panels — and each ignores the commands that
// are not its own, so the table stays in one place.
//
// A press is refused when the keyboard is already someone's: a field being
// typed in, or anything inside an open dialog (the framework's modals and the
// desk's side panel both carry `role="dialog"`). That is what lets a comma in
// a project's name stay a comma.

export function useShortcuts(handle: (command: Command) => boolean) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      if (keyboardIsClaimed(e.target)) return;
      const command = commandFor(e.key, {
        alt: e.altKey,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        shift: e.shiftKey,
      });
      if (command && handle(command)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handle]);
}
