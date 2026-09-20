// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { dayTotals } from "../src/app/day.ts";
import { DEMO_PROJECT_ID, buildDemoData } from "../src/app/dev/demoData.ts";
import { parseDoc, serializeDoc } from "../src/app/migrations.ts";
import { sortedDays, type AppData, type Project } from "../src/app/types.ts";

const TODAY = "2026-03-04"; // a Wednesday

/** The demo's own project — what its days are read against, so a break of
 *  it counts for whatever the demo says it counts for. */
const demoProject = (doc: AppData): Project => doc.projects[DEMO_PROJECT_ID]!;

describe("buildDemoData", () => {
  it("is deterministic and anchored on the day it is built for", () => {
    const a = buildDemoData(TODAY);
    const b = buildDemoData(TODAY);
    expect(serializeDoc(a)).toBe(serializeDoc(b));
    const days = sortedDays(a, DEMO_PROJECT_ID);
    expect(days[days.length - 1]!.date).toBe(TODAY);
    expect(days[0]!.date < TODAY).toBe(true);
  });

  it("survives the document pipeline unchanged", () => {
    const doc = buildDemoData(TODAY);
    expect(parseDoc(serializeDoc(doc))).toEqual(doc);
  });

  it("holds plausible working days, and leaves today open", () => {
    const doc = buildDemoData(TODAY);
    const days = sortedDays(doc, DEMO_PROJECT_ID);
    for (const day of days.slice(0, -1)) {
      const t = dayTotals(day, demoProject(doc), 86_400);
      expect(t.worked).toBeGreaterThan(6 * 3600);
      expect(t.worked).toBeLessThan(11 * 3600);
      expect(t.breaks["demo-lunch"]).toBeGreaterThan(0);
      expect(t.state).toBe("out");
    }
    const today = days[days.length - 1]!;
    expect(dayTotals(today, demoProject(doc), 12 * 3600).state).toBe("working");
  });

  it("skips weekends and the odd weekday", () => {
    const doc = buildDemoData(TODAY);
    const dates = sortedDays(doc, DEMO_PROJECT_ID).map((d) => d.date);
    expect(dates).not.toContain("2026-03-01"); // Sunday
    expect(dates.length).toBeLessThan(45);
    expect(dates.length).toBeGreaterThan(35);
  });
});
