// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  breakTypeOf,
  clampHours,
  employerTemplate,
  isWorkDay,
  targetSeconds,
  weekdayOf,
} from "../src/app/employer.ts";
import { employer } from "./fixtures/helpers.ts";

const labels = {
  lunch: "Lunch",
  coffee: "Coffee",
  meetings: "Meetings",
  coding: "Coding",
  admin: "Admin",
};

describe("employerTemplate", () => {
  it("builds a Monday-to-Friday, eight-hour employer with the two breaks", () => {
    let n = 0;
    const e = employerTemplate("Acme", labels, () => `id${++n}`, "now");
    expect(e.name).toBe("Acme");
    expect(e.workDays).toEqual([1, 2, 3, 4, 5]);
    expect(e.hoursPerDay).toBe(8);
    expect(e.breakTypes.map((b) => [b.name, b.defaultMinutes])).toEqual([
      ["Lunch", 30],
      ["Coffee", 15],
    ]);
    expect(e.categories.map((c) => c.name)).toEqual([
      "Meetings",
      "Coding",
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

  it("expects work on the employer's days only", () => {
    expect(isWorkDay(employer(), "2026-03-02")).toBe(true);
    expect(isWorkDay(employer(), "2026-03-07")).toBe(false);
    expect(isWorkDay(employer({ workDays: [6] }), "2026-03-07")).toBe(true);
  });

  it("targets the day length in seconds", () => {
    expect(targetSeconds(employer())).toBe(8 * 3600);
    expect(targetSeconds(employer({ hoursPerDay: 7.5 }))).toBe(27_000);
  });
});

describe("lookups and clamps", () => {
  it("finds a break type or answers null", () => {
    expect(breakTypeOf(employer(), "lunch")?.name).toBe("Lunch");
    expect(breakTypeOf(employer(), "gone")).toBeNull();
  });

  it("clamps hours into range", () => {
    expect(clampHours("abc")).toBe(8);
    expect(clampHours(0)).toBe(0.5);
    expect(clampHours(40)).toBe(16);
    expect(clampHours(7.5)).toBe(7.5);
  });
});
