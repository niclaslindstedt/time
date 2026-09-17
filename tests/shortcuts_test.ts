// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  CATEGORY_KEYS,
  commandFor,
  KEY_HINT,
  type Modifiers,
} from "../src/app/shortcuts.ts";

const bare: Modifiers = { alt: false, ctrl: false, meta: false, shift: false };

describe("commandFor", () => {
  it("maps S to start / stop, in either case", () => {
    expect(commandFor("s", bare)).toEqual({ kind: "toggleWork" });
    expect(commandFor("S", bare)).toEqual({ kind: "toggleWork" });
  });

  it("maps the digits to the kinds of work, counted from zero", () => {
    expect(commandFor("1", bare)).toEqual({ kind: "category", index: 0 });
    expect(commandFor("9", bare)).toEqual({ kind: "category", index: 8 });
    expect(commandFor("0", bare)).toBeNull();
  });

  it("maps the comma to settings and P to projects", () => {
    expect(commandFor(",", bare)).toEqual({ kind: "settings" });
    expect(commandFor("p", bare)).toEqual({ kind: "projects" });
  });

  it("stands down under any modifier — those keys are the browser's", () => {
    expect(commandFor("s", { ...bare, meta: true })).toBeNull();
    expect(commandFor("s", { ...bare, ctrl: true })).toBeNull();
    expect(commandFor("s", { ...bare, alt: true })).toBeNull();
    expect(commandFor("S", { ...bare, shift: true })).toBeNull();
    expect(commandFor("1", { ...bare, shift: true })).toBeNull();
  });

  it("ignores every other key, including the named ones", () => {
    expect(commandFor("Enter", bare)).toBeNull();
    expect(commandFor(" ", bare)).toBeNull();
    expect(commandFor("Escape", bare)).toBeNull();
    expect(commandFor("x", bare)).toBeNull();
  });
});

describe("KEY_HINT", () => {
  it("prints the key that commandFor reads", () => {
    expect(commandFor(KEY_HINT.toggleWork, bare)).toEqual({
      kind: "toggleWork",
    });
    expect(commandFor(KEY_HINT.settings, bare)).toEqual({ kind: "settings" });
    expect(commandFor(KEY_HINT.projects, bare)).toEqual({ kind: "projects" });
    for (let i = 0; i < CATEGORY_KEYS; i++) {
      const hint = KEY_HINT.category(i);
      expect(hint).not.toBeNull();
      expect(commandFor(hint!, bare)).toEqual({ kind: "category", index: i });
    }
  });

  it("has no key for a tenth kind of work", () => {
    expect(KEY_HINT.category(CATEGORY_KEYS)).toBeNull();
  });
});
