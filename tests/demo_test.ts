// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The demo document is what the App Store screenshots are taken of, so these
// hold it to three things: the app's own document format, dates that are all
// relative to the moment it opens, and each frame's premise — with every
// figure read through the app's own derivation (`day.ts`, `report.ts`), never
// stated by the data.
import { describe, expect, it } from "vitest";

import { addDays } from "@niclaslindstedt/oss-framework/calendar";

import { dayTotals, workdayEnd } from "../src/app/day.ts";
import {
  DEMO_BREAK,
  DEMO_KIND,
  DEMO_PROJECT_ID,
  buildDemoData,
  demoProject,
} from "../src/app/dev/demoData.ts";
import { parseDoc, serializeDoc } from "../src/app/migrations.ts";
import { isWorkDay, weekdayOf } from "../src/app/project.ts";
import { monthOf, runningBalance, summarizeRange } from "../src/app/report.ts";
import { dayFor, sortedDays } from "../src/app/types.ts";

const H = 3600;
const at = (h: number, m: number) => h * H + m * 60;

/** The moment the store frames are shot: 9:41 on a Thursday. */
const FRAME = new Date("2026-09-24T09:41:00");
const FRAME_DAY = "2026-09-24";
const NOW = at(9, 41);

const project = demoProject();

describe("the demo document", () => {
  it("is deterministic for a moment", () => {
    expect(serializeDoc(buildDemoData(FRAME))).toBe(
      serializeDoc(buildDemoData(new Date(FRAME))),
    );
  });

  it("survives the document pipeline unchanged", () => {
    const doc = buildDemoData(FRAME);
    expect(parseDoc(serializeDoc(doc))).toEqual(doc);
  });

  it("places every day relative to the moment it opens", () => {
    const a = sortedDays(buildDemoData(FRAME), DEMO_PROJECT_ID);
    const later = new Date("2027-03-11T09:41:00"); // also a Thursday
    const b = sortedDays(buildDemoData(later), DEMO_PROJECT_ID);
    expect(b.map((d) => d.date)).toEqual(a.map((d) => addDays(d.date, 168)));
    expect(a[a.length - 1]!.date).toBe(FRAME_DAY);
  });

  it("holds working days a person would have kept", () => {
    const doc = buildDemoData(FRAME);
    const days = sortedDays(doc, DEMO_PROJECT_ID).filter(
      (d) => d.date < FRAME_DAY,
    );
    for (const day of days) {
      const t = dayTotals(day, project, 86_400);
      expect(t.state).toBe("out");
      // Every worked minute has a kind of work: the report shows no
      // "Uncategorised", and no break is credited as work.
      expect(t.uncategorised).toBe(0);
      expect(t.breakCreditTotal).toBe(0);
      if (isWorkDay(project, day.date)) {
        expect(t.worked).toBeGreaterThan(5 * H);
        expect(t.worked).toBeLessThan(11 * H);
        expect(t.breaks[DEMO_BREAK.coffee]).toBeGreaterThan(0);
      } else {
        expect(t.worked).toBeLessThan(2 * H); // the Saturday page
      }
      // Minutes like real punches: the day never starts or stops on the hour.
      expect(t.firstIn! % 1800).not.toBe(0);
      expect(t.lastOut! % 1800).not.toBe(0);
      for (const span of [...day.sessions, ...day.breaks, ...day.activities]) {
        expect(span.end! > span.start).toBe(true);
      }
    }
  });

  it("works every weekday it covers, so the balance is never a warning", () => {
    for (let i = 0; i < 366; i++) {
      const date = addDays("2026-01-01", i);
      const doc = buildDemoData(new Date(`${date}T09:41:00`));
      const logged = sortedDays(doc, DEMO_PROJECT_ID);
      for (let d = logged[0]!.date; d < date; d = addDays(d, 1)) {
        if (isWorkDay(project, d))
          expect(dayFor(doc, DEMO_PROJECT_ID, d)).not.toBeNull();
      }
      const balance = runningBalance(doc, project, date, NOW);
      expect(balance).toBeGreaterThan(2 * H);
      expect(balance).toBeLessThan(8 * H);
    }
  });

  it("holds at every hour of every day it is opened", () => {
    // The walk above opens the demo at the frames' 9:41; a reader opens it at
    // any hour. So open it on every day of a year at hours from just after
    // midnight to just before the next one, and hold each opening to what
    // any frame of it assumes: nothing is written after the moment it opens,
    // every earlier day is closed, and every worked minute has a kind.
    // Some 2,500 builds: seconds on a CI runner, so it gets its own timeout.
    const HOURS = [
      at(0, 20),
      at(6, 30),
      at(9, 41),
      at(12, 10),
      at(15, 5),
      at(20, 0),
      at(23, 50),
    ];
    const hhmm = (s: number) =>
      `${String(Math.floor(s / H)).padStart(2, "0")}:${String((s % H) / 60).padStart(2, "0")}`;
    for (let i = 0; i < 365; i++) {
      const date = addDays("2026-01-01", i);
      for (const now of HOURS) {
        const doc = buildDemoData(new Date(`${date}T${hhmm(now)}:00`));
        const logged = sortedDays(doc, DEMO_PROJECT_ID);
        expect(logged[logged.length - 1]!.date <= date).toBe(true);
        for (const day of logged) {
          const clock = day.date === date ? now : 86_400;
          const t = dayTotals(day, project, clock);
          expect(t.uncategorised).toBe(0);
          if (day.date < date) {
            expect(t.state).toBe("out");
            continue;
          }
          for (const span of [...day.sessions, ...day.activities]) {
            expect(span.start).toBeLessThan(now);
            if (span.end !== null) expect(span.end).toBeLessThanOrEqual(now);
          }
          for (const span of day.breaks) expect(span.start).toBeLessThan(now);
        }
      }
    }
  }, 60_000);

  it("writes today only up to the moment it opens", () => {
    const early = buildDemoData(new Date("2026-09-24T06:30:00"));
    expect(dayFor(early, DEMO_PROJECT_ID, FRAME_DAY)).toBeNull();

    const evening = buildDemoData(new Date("2026-09-24T20:00:00"));
    const done = dayFor(evening, DEMO_PROJECT_ID, FRAME_DAY)!;
    expect(dayTotals(done, project, at(20, 0)).state).toBe("out");

    const lunch = buildDemoData(new Date("2026-09-24T12:10:00"));
    const onBreak = dayFor(lunch, DEMO_PROJECT_ID, FRAME_DAY)!;
    expect(dayTotals(onBreak, project, at(12, 10)).state).toBe("break");
  });
});

describe("the store frames' premises (Thursday 24 September 2026, 9:41)", () => {
  const doc = buildDemoData(FRAME);

  it("watch: today is running, and the dial already holds a morning", () => {
    const today = dayFor(doc, DEMO_PROJECT_ID, FRAME_DAY)!;
    const t = dayTotals(today, project, NOW);
    expect(t.state).toBe("working");
    expect(t.firstIn).toBe(at(7, 26));
    expect(t.currentCategoryId).toBe(DEMO_KIND.code);
    expect(Object.keys(t.categories).sort()).toEqual(
      [DEMO_KIND.code, DEMO_KIND.meet, DEMO_KIND.review].sort(),
    );
    expect(Object.keys(t.breaks)).toEqual([DEMO_BREAK.coffee]);
    // A quarter of the day's target, and an end in the afternoon.
    expect(t.worked).toBeGreaterThan(2 * H);
    const end = workdayEnd(today, project, NOW)!;
    expect(end).toBeGreaterThan(at(15, 0));
    expect(end).toBeLessThan(at(16, 0));
  });

  it("meetings: the month has every kind, and meetings are a real share", () => {
    const { from, to } = monthOf(FRAME_DAY);
    const month = summarizeRange(doc, project, from, to, FRAME_DAY, NOW);
    expect(Object.keys(month.categories).sort()).toEqual(
      Object.values(DEMO_KIND).sort(),
    );
    expect(month.uncategorised).toBe(0);
    const meetings = month.categories[DEMO_KIND.meet]! / month.worked;
    expect(meetings).toBeGreaterThan(0.1);
    expect(meetings).toBeLessThan(0.25);
  });

  it("yours: last Tuesday is the release night, and its Log fits a phone", () => {
    const tuesday = dayFor(doc, DEMO_PROJECT_ID, "2026-09-15")!;
    expect(weekdayOf(tuesday.date)).toBe(2);
    expect(tuesday.sessions).toHaveLength(2);
    expect(tuesday.activities.at(-1)!.categoryId).toBe(DEMO_KIND.release);
    const rows =
      tuesday.sessions.length +
      tuesday.breaks.length +
      tuesday.activities.length;
    expect(rows).toBeLessThanOrEqual(8);
    expect(dayTotals(tuesday, project, 86_400).worked).toBeGreaterThan(9 * H);
  });

  it("flex: last week is a long Tuesday paying for a short Friday", () => {
    const week = summarizeRange(
      doc,
      project,
      "2026-09-14",
      "2026-09-20",
      FRAME_DAY,
      NOW,
    );
    const [mon, tue, , , fri] = week.days;
    expect(mon!.worked).toBeGreaterThan(8 * H);
    expect(tue!.worked).toBeGreaterThan(9.5 * H);
    expect(fri!.worked).toBeLessThan(6 * H);
    expect(Math.abs(week.balance)).toBeLessThan(0.5 * H);
    expect(runningBalance(doc, project, FRAME_DAY, NOW)).toBeGreaterThan(3 * H);
  });
});
