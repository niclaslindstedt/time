// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { dayTotals } from "../src/app/day.ts";
import { DEMO_EMPLOYER_ID, buildDemoData } from "../src/app/dev/demoData.ts";
import { parseDoc, serializeDoc } from "../src/app/migrations.ts";
import { sortedDays } from "../src/app/types.ts";

const TODAY = "2026-03-04"; // a Wednesday

describe("buildDemoData", () => {
  it("is deterministic and anchored on the day it is built for", () => {
    const a = buildDemoData(TODAY);
    const b = buildDemoData(TODAY);
    expect(serializeDoc(a)).toBe(serializeDoc(b));
    const days = sortedDays(a, DEMO_EMPLOYER_ID);
    expect(days[days.length - 1]!.date).toBe(TODAY);
    expect(days[0]!.date < TODAY).toBe(true);
  });

  it("survives the document pipeline unchanged", () => {
    const doc = buildDemoData(TODAY);
    expect(parseDoc(serializeDoc(doc))).toEqual(doc);
  });

  it("holds plausible working days, and leaves today open", () => {
    const doc = buildDemoData(TODAY);
    const days = sortedDays(doc, DEMO_EMPLOYER_ID);
    for (const day of days.slice(0, -1)) {
      const t = dayTotals(day, 86_400);
      expect(t.worked).toBeGreaterThan(6 * 3600);
      expect(t.worked).toBeLessThan(11 * 3600);
      expect(t.breaks["demo-lunch"]).toBeGreaterThan(0);
      expect(t.state).toBe("out");
    }
    const today = days[days.length - 1]!;
    expect(dayTotals(today, 12 * 3600).state).toBe("working");
  });

  it("skips weekends and the odd weekday", () => {
    const doc = buildDemoData(TODAY);
    const dates = sortedDays(doc, DEMO_EMPLOYER_ID).map((d) => d.date);
    expect(dates).not.toContain("2026-03-01"); // Sunday
    expect(dates.length).toBeLessThan(45);
    expect(dates.length).toBeGreaterThan(35);
  });
});
