// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Two months of invented working days for the developer "Demo data" switch —
// enough for the Report screen to have a week and a month worth looking at,
// and for the Log to have days to page through.
//
// Pure and clock-free: every date is an offset from the `today` it is built
// for, so the demo never ages, and the invention is seeded so two builds for
// the same day are the same document. Nothing here is a claim about anyone's
// real hours; it is what a plausible fortnight of them looks like.

import { addDays, type DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { weekdayOf } from "../project.ts";
import {
  DOC_VERSION,
  dayKey,
  type ActivitySpan,
  type AppData,
  type BreakSpan,
  type Project,
  type Span,
  type WorkDay,
} from "../types.ts";

/** How far back the demo reaches. */
export const DEMO_DAYS = 63;

export const DEMO_PROJECT_ID = "demo-project";

const STAMP = "2026-01-01T00:00:00.000Z";

/** A small deterministic generator — enough to vary the days, not enough to
 *  be a random source anyone should rely on. */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const h = (hours: number, minutes = 0) => hours * 3600 + minutes * 60;

function demoProject(): Project {
  return {
    id: DEMO_PROJECT_ID,
    name: "Demo AB",
    workDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    breakTypes: [
      { id: "demo-lunch", name: "Lunch", defaultMinutes: 30 },
      { id: "demo-coffee", name: "Coffee", defaultMinutes: 15 },
      { id: "demo-walk", name: "Walk", defaultMinutes: 20 },
    ],
    categories: [
      { id: "demo-meetings", name: "Meetings" },
      { id: "demo-coding", name: "Coding" },
      { id: "demo-admin", name: "Admin" },
    ],
    updatedAt: STAMP,
  };
}

/** One invented working day. */
function demoDay(date: DayKey, index: number, open: boolean): WorkDay {
  const rand = lcg(index * 7919 + 17);
  const minute = (r: number, from: number, to: number) =>
    Math.round(from + r * (to - from)) * 60;
  let n = 0;
  const id = () => `demo-${index}-${++n}`;

  const start = h(7) + minute(rand(), 40, 95);
  const end = open ? null : h(16) + minute(rand(), 15, 90);
  const sessions: Span[] = [{ id: id(), start, end }];

  const breaks: BreakSpan[] = [];
  const lunchStart = h(11) + minute(rand(), 45, 90);
  breaks.push({
    id: id(),
    typeId: "demo-lunch",
    start: lunchStart,
    end: lunchStart + minute(rand(), 28, 45),
  });
  if (rand() > 0.3) {
    const coffee = h(14) + minute(rand(), 30, 75);
    breaks.push({
      id: id(),
      typeId: "demo-coffee",
      start: coffee,
      end: coffee + minute(rand(), 10, 18),
    });
  }
  if (rand() > 0.75) {
    const walk = h(9) + minute(rand(), 45, 70);
    breaks.push({
      id: id(),
      typeId: "demo-walk",
      start: walk,
      end: walk + minute(rand(), 15, 25),
    });
  }

  // The morning is a stand-up and admin, the middle of the day is coding,
  // and some afternoons hold a longer meeting.
  const activities: ActivitySpan[] = [];
  const standupEnd = start + minute(rand(), 15, 40);
  activities.push({
    id: id(),
    categoryId: "demo-meetings",
    start,
    end: standupEnd,
  });
  const adminEnd = standupEnd + minute(rand(), 20, 50);
  activities.push({
    id: id(),
    categoryId: "demo-admin",
    start: standupEnd,
    end: adminEnd,
  });
  const meeting = rand() > 0.5;
  const meetingStart = h(13) + minute(rand(), 0, 60);
  activities.push({
    id: id(),
    categoryId: "demo-coding",
    start: adminEnd,
    end: meeting ? meetingStart : end,
  });
  if (meeting) {
    const meetingEnd = meetingStart + minute(rand(), 45, 90);
    activities.push({
      id: id(),
      categoryId: "demo-meetings",
      start: meetingStart,
      end: meetingEnd,
    });
    activities.push({
      id: id(),
      categoryId: "demo-coding",
      start: meetingEnd,
      end,
    });
  }

  return {
    date,
    projectId: DEMO_PROJECT_ID,
    sessions,
    breaks,
    activities,
    updatedAt: STAMP,
  };
}

/** The demo document, anchored on `today`. Weekdays only, with the odd day
 *  skipped so the report has a shortfall to show; today's day is left open
 *  (still at work) so the Today screen has something ticking. */
export function buildDemoData(today: DayKey): AppData {
  const project = demoProject();
  const days: AppData["days"] = {};
  for (let back = DEMO_DAYS; back >= 0; back--) {
    const date = addDays(today, -back);
    const weekday = weekdayOf(date);
    if (weekday === 0 || weekday === 6) continue;
    // Every ninth working day is missing — a sick day, a holiday.
    if (back > 0 && back % 9 === 4) continue;
    const day = demoDay(date, back, back === 0);
    days[dayKey(project.id, date)] = day;
  }
  return {
    version: DOC_VERSION,
    projects: { [project.id]: project },
    days,
  };
}
