// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

// The keyboard, on a desk. A phone is used with a thumb; a desktop has a
// keyboard under both hands, and an app that lives in a tab all day should
// answer it. The set is deliberately small — the things done several times a
// day — and every key is printed on the control it drives, so nothing has to
// be looked up.
//
//   S      start or stop working
//   1 – 9  the kinds of work, in the order the project lists them
//   ,      settings (the one every desktop app agrees on)
//   P      projects
//
// A bare key only. Anything held with it — ⌘, Ctrl, Alt — is the browser's
// or the OS's, and Shift is left out so a capital S is still the same S.
// Whether the press should be honoured at all (a field has focus, a dialog is
// open) is the caller's question: this module maps a key to a command and
// nothing else, which is what keeps it testable.

export type Command =
  | { kind: "toggleWork" }
  /** The n-th kind of work, counted from zero. Whether the project has that
   *  many is for the screen to check. */
  | { kind: "category"; index: number }
  | { kind: "settings" }
  | { kind: "projects" };

export type Modifiers = {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
};

/** The most kinds of work the digits can reach. */
export const CATEGORY_KEYS = 9;

/** The key printed on a control, for the hint beside its label. */
export const KEY_HINT = {
  toggleWork: "S",
  settings: ",",
  projects: "P",
  category: (index: number): string | null =>
    index < CATEGORY_KEYS ? String(index + 1) : null,
} as const;

/** What a key press asks for, or nothing. */
export function commandFor(key: string, mods: Modifiers): Command | null {
  if (mods.alt || mods.ctrl || mods.meta || mods.shift) return null;
  if (key.length !== 1) return null;
  const lower = key.toLowerCase();
  if (lower === "s") return { kind: "toggleWork" };
  if (lower === "p") return { kind: "projects" };
  if (lower === ",") return { kind: "settings" };
  if (lower >= "1" && lower <= "9") {
    return { kind: "category", index: Number(lower) - 1 };
  }
  return null;
}

// The two keys a modal answers.
//
// Escape is the framework's — every `Modal` closes on it already, and so does
// the desk's side panel. Enter is this app's half of the pair: the same press
// as the Save button in `ModalHeader`, so a name typed into the "Custom" pill
// is filed without reaching for the pointer.
//
// Enter is not free, though. It presses a focused button, types a newline
// into a textarea, and opens a select — in those it belongs to the control
// and the modal keeps out of it. Which control the keyboard is in is the
// caller's reading of the DOM; this module only says what the press means,
// which is what keeps it testable.

/** The kind of control a modal's key press landed on. */
export type Focused =
  /** A one-line field: a name, a number, a time. */
  | "field"
  /** Something Enter already does a job in: a button, a link, a textarea, a
   *  select, a contenteditable. */
  | "control"
  /** Nothing in particular — the modal's own card. */
  | "card";

/** Whether a key press inside a modal is asking for it to be saved. */
export function savesModal(key: string, mods: Modifiers, on: Focused): boolean {
  if (key !== "Enter") return false;
  if (mods.alt || mods.ctrl || mods.meta || mods.shift) return false;
  return on !== "control";
}
