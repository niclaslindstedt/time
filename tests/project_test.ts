// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DEFAULT_KINDS,
  breakTypeOf,
  clampHours,
  projectTemplate,
  isWorkDay,
  suggestedGlyph,
  targetSeconds,
  weekdayOf,
} from "../src/app/project.ts";
import { allowsGlyph } from "../src/app/kinds.ts";
import { project } from "./fixtures/helpers.ts";

const labels = {
  lunch: "Lunch",
  coffee: "Coffee",
  toilet: "Toilet",
  meetings: "Meetings",
  planning: "Planning",
  retro: "Retro",
  admin: "Admin",
};

describe("projectTemplate", () => {
  it("gives every default break and kind of work a mark of its own", () => {
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    expect(e.breakTypes.map((b) => b.glyph)).toEqual([
      "meal",
      "coffee",
      "toilet",
    ]);
    expect(e.categories.map((c) => c.glyph)).toEqual([
      "meeting",
      "planning",
      "review",
      "admin",
    ]);
  });

  it("suggests a mark for a kind of its own that has none", () => {
    // A project written before there were marks: its kinds are the app's own
    // names, so they are given the app's own marks.
    expect(suggestedGlyph("Lunch", "break", labels)).toBe("meal");
    expect(suggestedGlyph("Toilet", "break", labels)).toBe("toilet");
    expect(suggestedGlyph("Retro", "category", labels)).toBe("review");
    // However it was cased, and whatever space is round it.
    expect(suggestedGlyph("  admin  ", "category", labels)).toBe("admin");
  });

  it("suggests nothing for a name it never suggested, or the wrong sort", () => {
    expect(suggestedGlyph("Coding", "category", labels)).toBeUndefined();
    expect(suggestedGlyph("", "break", labels)).toBeUndefined();
    // The two vocabularies stay apart: a break called "Meetings" is not given
    // the kind of work's mark, and a kind of work called "Lunch" is not given
    // the break's.
    expect(suggestedGlyph("Meetings", "break", labels)).toBeUndefined();
    expect(suggestedGlyph("Lunch", "category", labels)).toBeUndefined();
  });

  it("suggests the same mark the template stamps in", () => {
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    for (const b of e.breakTypes) {
      expect(suggestedGlyph(b.name, "break", labels), b.name).toBe(b.glyph);
    }
    for (const c of e.categories) {
      expect(suggestedGlyph(c.name, "category", labels), c.name).toBe(c.glyph);
    }
  });

  it("marks each of them from its own vocabulary", () => {
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    for (const b of e.breakTypes)
      expect(allowsGlyph("break", b.glyph)).toBe(true);
    for (const c of e.categories) {
      expect(allowsGlyph("category", c.glyph)).toBe(true);
    }
    // …and the table they come from says the same, entry by entry.
    for (const [key, kind] of Object.entries(DEFAULT_KINDS)) {
      expect(allowsGlyph(kind.sort, kind.glyph), key).toBe(true);
    }
  });

  it("picks no colours, so the four take the hues their order gives them", () => {
    // A new project looks exactly as one always did until someone chooses
    // otherwise — the colour is stored only when it is picked.
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    expect(e.categories.every((c) => c.color === undefined)).toBe(true);
  });

  it("builds a Monday-to-Friday, eight-hour project with the default breaks", () => {
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    expect(e.name).toBe("Acme");
    expect(e.workDays).toEqual([1, 2, 3, 4, 5]);
    expect(e.hoursPerDay).toBe(8);
    expect(e.breakTypes.map((b) => [b.name, b.defaultMinutes])).toEqual([
      ["Lunch", 30],
      ["Coffee", 15],
      ["Toilet", 5],
    ]);
    expect(e.categories.map((c) => c.name)).toEqual([
      "Meetings",
      "Planning",
      "Retro",
      "Admin",
    ]);
    // Every id is distinct.
    const ids = [
      e.id,
      ...e.breakTypes.map((b) => b.id),
      ...e.categories.map((c) => c.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("work days", () => {
  it("knows a weekday from a date", () => {
    expect(weekdayOf("2026-03-02")).toBe(1);
    expect(weekdayOf("2026-03-08")).toBe(0);
  });

  it("expects work on the project's days only", () => {
    expect(isWorkDay(project(), "2026-03-02")).toBe(true);
    expect(isWorkDay(project(), "2026-03-07")).toBe(false);
    expect(isWorkDay(project({ workDays: [6] }), "2026-03-07")).toBe(true);
  });

  it("targets the day length in seconds", () => {
    expect(targetSeconds(project())).toBe(8 * 3600);
    expect(targetSeconds(project({ hoursPerDay: 7.5 }))).toBe(27_000);
  });
});

describe("lookups and clamps", () => {
  it("finds a break type or answers null", () => {
    expect(breakTypeOf(project(), "lunch")?.name).toBe("Lunch");
    expect(breakTypeOf(project(), "gone")).toBeNull();
  });

  it("clamps hours into range", () => {
    expect(clampHours("abc")).toBe(8);
    expect(clampHours(0)).toBe(0.5);
    expect(clampHours(40)).toBe(16);
    expect(clampHours(7.5)).toBe(7.5);
  });
});
