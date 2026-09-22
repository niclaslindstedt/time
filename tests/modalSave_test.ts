// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { holdsEdit } from "../src/app/useModalSave.ts";

// Which fields keep a draft of their own until they are left. That is the
// whole of the bug the rule exists for: a name typed into one has not reached
// the form, so the form's "not savable yet" is stale and the Save button must
// not be painted dead over it.

describe("holdsEdit", () => {
  it("counts the fields a form is actually typed into", () => {
    expect(holdsEdit("INPUT", "text")).toBe(true);
    expect(holdsEdit("INPUT", "number")).toBe(true);
    expect(holdsEdit("INPUT", "time")).toBe(true);
    expect(holdsEdit("INPUT", "date")).toBe(true);
    expect(holdsEdit("TEXTAREA")).toBe(true);
  });

  it("takes an input with no type for the text field it is", () => {
    expect(holdsEdit("INPUT")).toBe(true);
  });

  it("does not count the inputs that commit as they are pressed", () => {
    expect(holdsEdit("INPUT", "checkbox")).toBe(false);
    expect(holdsEdit("INPUT", "radio")).toBe(false);
  });

  it("does not count the buttons wearing an input's tag", () => {
    expect(holdsEdit("INPUT", "button")).toBe(false);
    expect(holdsEdit("INPUT", "submit")).toBe(false);
    expect(holdsEdit("INPUT", "reset")).toBe(false);
  });

  it("does not count what is not a field at all", () => {
    expect(holdsEdit("BUTTON")).toBe(false);
    expect(holdsEdit("SELECT")).toBe(false);
    expect(holdsEdit("DIV")).toBe(false);
  });
});
