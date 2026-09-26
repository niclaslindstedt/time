// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The demo document: one developer's working weeks. It is the live demo
// (`make demo`), what the App Store screenshots are taken of (`VITE_SEED=demo`),
// and what Settings → Developer → Demo data swaps in — so it is written to
// those pictures rather than to exercise every field.
//
// A platform developer on flextime — an eight-hour day, Monday to Friday — who
// starts early on a good day to get an hour of code in before the 9:30
// standup, reviews in the gaps, has planning on Mondays and a 1:1 midweek,
// walks on Tuesday afternoons, gets paged now and then, and ships a release in
// the evening once in a while. Last week was one of those: a long Tuesday and
// a short Friday that it paid for.
//
// Pure and clock-free: every day is placed as (weeks from this week, weekday)
// from the moment it is built for, over `DEMO_WEEKS` back, so whatever day it
// is the month on the report is full and nothing ages; today is written only
// up to that moment, so the Today screen is live on any weekday. Nothing here
// states a total — every figure the app shows is derived from these spans by
// its own code (`day.ts`, `report.ts`), the same as for anyone's real hours.

import {
  addDays,
  dayKeyOf,
  startOfWeek,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import {
  DOC_VERSION,
  dayKey,
  type ActivitySpan,
  type AppData,
  type BreakSpan,
  type Project,
  type Seconds,
  type Span,
  type WorkDay,
} from "../types.ts";

/** How many whole weeks before this one the demo reaches back. */
export const DEMO_WEEKS = 8;

export const DEMO_PROJECT_ID = "demo-project";

const STAMP = "2026-01-01T00:00:00.000Z";

// ── The project ─────────────────────────────────────────────────────────────

export const DEMO_BREAK = {
  lunch: "demo-lunch",
  coffee: "demo-coffee",
  walk: "demo-walk",
  errand: "demo-errand",
} as const;

export const DEMO_KIND = {
  code: "demo-code",
  review: "demo-review",
  meet: "demo-meetings",
  release: "demo-release",
  oncall: "demo-oncall",
} as const;

type BreakName = keyof typeof DEMO_BREAK;
type KindName = keyof typeof DEMO_KIND;

/** The day job. No break counts as work — a credited break is worked time
 *  with no kind of work, and the report would show it as Uncategorised. */
export function demoProject(): Project {
  return {
    id: DEMO_PROJECT_ID,
    name: "Platform",
    glyph: "server",
    color: "blue",
    workDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    breakTypes: [
      {
        id: DEMO_BREAK.lunch,
        name: "Lunch",
        defaultMinutes: 30,
        glyph: "meal",
      },
      {
        id: DEMO_BREAK.coffee,
        name: "Coffee",
        defaultMinutes: 10,
        glyph: "coffee",
      },
      {
        id: DEMO_BREAK.walk,
        name: "Walk",
        defaultMinutes: 20,
        glyph: "walk",
        pinned: false,
      },
      {
        id: DEMO_BREAK.errand,
        name: "Errand",
        defaultMinutes: 45,
        glyph: "errand",
        pinned: false,
      },
    ],
    categories: [
      { id: DEMO_KIND.code, name: "Code", glyph: "coding", color: "blue" },
      {
        id: DEMO_KIND.review,
        name: "Review",
        glyph: "review",
        color: "violet",
      },
      {
        id: DEMO_KIND.meet,
        name: "Meetings",
        glyph: "meeting",
        color: "amber",
      },
      {
        id: DEMO_KIND.release,
        name: "Release",
        glyph: "deploy",
        color: "mint",
        pinned: false,
      },
      {
        id: DEMO_KIND.oncall,
        name: "On-call",
        glyph: "bolt",
        color: "red",
        pinned: false,
      },
    ],
    updatedAt: STAMP,
  };
}

// ── The days, as they were written down ─────────────────────────────────────

/** One day as a person would read it off the Log: when they were at work,
 *  the breaks inside that, and what they were doing — back to back, from the
 *  first start to the last stop, the way tapping the kinds leaves it. */
type Plan = {
  work: [string, string][];
  breaks?: [BreakName, string, string][];
  kinds: [KindName, string, string][];
};

/** A week of plans, Monday first; index 5 and 6 are the weekend. */
type Week = (Plan | null)[];

// Last week, always: the release week. Tuesday's release went out in the
// evening (four kinds of work, so the day's Log fits a phone), Wednesday started late for it, and Friday was an early finish the
// Tuesday had paid for.
const RELEASE_WEEK: Week = [
  {
    work: [["08:17", "17:14"]],
    breaks: [
      ["coffee", "10:06", "10:15"],
      ["lunch", "11:52", "12:29"],
    ],
    kinds: [
      ["code", "08:17", "09:30"],
      ["meet", "09:30", "09:47"],
      ["code", "09:47", "13:00"],
      ["meet", "13:00", "14:12"],
      ["review", "14:12", "15:03"],
      ["code", "15:03", "17:14"],
    ],
  },
  {
    work: [
      ["08:41", "17:09"],
      ["19:34", "21:52"],
    ],
    breaks: [
      ["coffee", "10:21", "10:32"],
      ["lunch", "12:04", "12:38"],
    ],
    kinds: [
      ["review", "08:41", "09:30"],
      ["meet", "09:30", "09:44"],
      ["code", "09:44", "16:05"],
      ["release", "16:05", "21:52"],
    ],
  },
  {
    work: [["09:12", "17:58"]],
    breaks: [
      ["coffee", "10:48", "10:56"],
      ["lunch", "12:15", "12:58"],
      ["walk", "15:02", "15:21"],
    ],
    kinds: [
      ["code", "09:12", "09:30"],
      ["meet", "09:30", "09:45"],
      ["code", "09:45", "14:00"],
      ["meet", "14:00", "14:31"],
      ["review", "14:31", "17:58"],
    ],
  },
  {
    work: [["08:03", "17:22"]],
    breaks: [
      ["coffee", "09:58", "10:07"],
      ["lunch", "11:46", "12:20"],
    ],
    kinds: [
      ["code", "08:03", "09:30"],
      ["meet", "09:30", "09:46"],
      ["code", "09:46", "13:30"],
      ["meet", "13:30", "14:30"],
      ["code", "14:30", "15:00"],
      ["review", "15:00", "17:22"],
    ],
  },
  {
    work: [["07:49", "13:36"]],
    breaks: [["coffee", "09:51", "09:59"]],
    kinds: [
      ["code", "07:49", "09:30"],
      ["meet", "09:30", "10:12"],
      ["review", "10:12", "11:40"],
      ["code", "11:40", "13:36"],
    ],
  },
  null,
  null,
];

// This week: an ordinary one. Wednesday morning was a page; Thursday started
// early, which is what the Today screen shows at 9:41 on a Thursday — an hour
// of code, a coffee, review, the standup, code again.
const THIS_WEEK: Week = [
  {
    work: [["08:09", "17:03"]],
    breaks: [
      ["coffee", "10:12", "10:21"],
      ["lunch", "11:57", "12:36"],
    ],
    kinds: [
      ["code", "08:09", "09:30"],
      ["meet", "09:30", "09:46"],
      ["code", "09:46", "13:00"],
      ["meet", "13:00", "14:05"],
      ["code", "14:05", "17:03"],
    ],
  },
  {
    work: [["08:32", "17:27"]],
    breaks: [
      ["coffee", "10:35", "10:44"],
      ["lunch", "12:09", "12:41"],
      ["walk", "14:48", "15:10"],
    ],
    kinds: [
      ["review", "08:32", "09:30"],
      ["meet", "09:30", "09:44"],
      ["code", "09:44", "13:30"],
      ["meet", "13:30", "14:20"],
      ["code", "14:20", "17:27"],
    ],
  },
  {
    work: [["07:58", "16:51"]],
    breaks: [
      ["coffee", "09:55", "10:03"],
      ["lunch", "11:48", "12:22"],
    ],
    kinds: [
      ["code", "07:58", "09:30"],
      ["meet", "09:30", "09:47"],
      ["oncall", "09:47", "11:05"],
      ["code", "11:05", "14:00"],
      ["meet", "14:00", "14:30"],
      ["code", "14:30", "16:51"],
    ],
  },
  {
    work: [["07:26", "16:58"]],
    breaks: [
      ["coffee", "08:34", "08:43"],
      ["lunch", "12:02", "12:35"],
    ],
    kinds: [
      ["code", "07:26", "08:34"],
      ["review", "08:34", "09:30"],
      ["meet", "09:30", "09:38"],
      ["code", "09:38", "14:00"],
      ["review", "14:00", "15:10"],
      ["code", "15:10", "16:58"],
    ],
  },
  {
    work: [["08:14", "16:05"]],
    breaks: [
      ["coffee", "10:02", "10:10"],
      ["lunch", "11:55", "12:24"],
    ],
    kinds: [
      ["code", "08:14", "09:30"],
      ["meet", "09:30", "10:15"],
      ["code", "10:15", "16:05"],
    ],
  },
  null,
  null,
];

// The weeks before, three of them in turn, each day's first start and last
// stop nudged by a few minutes per week (`jitter`) so no two weeks match.
const OLDER_WEEKS: Week[] = [
  [
    {
      work: [["08:22", "17:32"]],
      breaks: [
        ["coffee", "10:08", "10:17"],
        ["lunch", "12:01", "12:33"],
      ],
      kinds: [
        ["code", "08:22", "09:30"],
        ["meet", "09:30", "09:45"],
        ["review", "09:45", "10:50"],
        ["code", "10:50", "13:00"],
        ["meet", "13:00", "14:10"],
        ["code", "14:10", "17:32"],
      ],
    },
    {
      work: [["08:05", "17:15"]],
      breaks: [
        ["coffee", "09:57", "10:05"],
        ["lunch", "11:50", "12:26"],
        ["walk", "14:40", "15:02"],
      ],
      kinds: [
        ["code", "08:05", "09:30"],
        ["meet", "09:30", "09:43"],
        ["code", "09:43", "13:30"],
        ["meet", "13:30", "14:20"],
        ["code", "14:20", "17:15"],
      ],
    },
    {
      work: [["08:47", "17:57"]],
      breaks: [
        ["coffee", "10:30", "10:38"],
        ["lunch", "12:12", "12:49"],
      ],
      kinds: [
        ["review", "08:47", "09:30"],
        ["meet", "09:30", "09:46"],
        ["code", "09:46", "14:00"],
        ["meet", "14:00", "14:33"],
        ["code", "14:33", "17:57"],
      ],
    },
    {
      work: [["07:54", "17:06"]],
      breaks: [
        ["coffee", "09:49", "09:58"],
        ["lunch", "11:44", "12:18"],
      ],
      kinds: [
        ["code", "07:54", "09:30"],
        ["meet", "09:30", "09:47"],
        ["code", "09:47", "14:30"],
        ["release", "14:30", "17:06"],
      ],
    },
    {
      work: [["08:11", "16:02"]],
      breaks: [
        ["coffee", "10:04", "10:12"],
        ["lunch", "11:58", "12:27"],
      ],
      kinds: [
        ["code", "08:11", "09:30"],
        ["meet", "09:30", "10:20"],
        ["review", "10:20", "11:58"],
        ["code", "11:58", "16:02"],
      ],
    },
    null,
    null,
  ],
  [
    {
      work: [["08:36", "17:29"]],
      breaks: [
        ["coffee", "10:19", "10:27"],
        ["lunch", "12:06", "12:44"],
      ],
      kinds: [
        ["code", "08:36", "09:30"],
        ["meet", "09:30", "09:46"],
        ["code", "09:46", "13:00"],
        ["meet", "13:00", "14:15"],
        ["review", "14:15", "17:29"],
      ],
    },
    {
      work: [["07:41", "16:43"]],
      breaks: [
        ["coffee", "09:44", "09:53"],
        ["lunch", "11:39", "12:11"],
        ["walk", "14:52", "15:13"],
      ],
      kinds: [
        ["code", "07:41", "09:30"],
        ["meet", "09:30", "09:44"],
        ["review", "09:44", "10:40"],
        ["code", "10:40", "13:30"],
        ["meet", "13:30", "14:20"],
        ["code", "14:20", "16:43"],
      ],
    },
    {
      work: [["08:18", "17:22"]],
      breaks: [
        ["coffee", "10:01", "10:09"],
        ["lunch", "11:56", "12:30"],
        ["errand", "15:05", "15:51"],
      ],
      kinds: [
        ["code", "08:18", "09:30"],
        ["meet", "09:30", "09:45"],
        ["code", "09:45", "14:00"],
        ["meet", "14:00", "14:32"],
        ["code", "14:32", "17:22"],
      ],
    },
    {
      work: [["08:02", "17:07"]],
      breaks: [
        ["coffee", "09:53", "10:02"],
        ["lunch", "11:47", "12:23"],
      ],
      kinds: [
        ["oncall", "08:02", "09:30"],
        ["meet", "09:30", "09:46"],
        ["oncall", "09:46", "10:25"],
        ["code", "10:25", "13:30"],
        ["meet", "13:30", "14:30"],
        ["code", "14:30", "17:07"],
      ],
    },
    {
      work: [["08:26", "16:18"]],
      breaks: [
        ["coffee", "10:14", "10:22"],
        ["lunch", "12:03", "12:31"],
      ],
      kinds: [
        ["code", "08:26", "09:30"],
        ["meet", "09:30", "10:10"],
        ["code", "10:10", "16:18"],
      ],
    },
    // The Saturday page: an hour on the laptop, which the report counts as
    // the overtime it is.
    {
      work: [["10:12", "11:03"]],
      kinds: [["oncall", "10:12", "11:03"]],
    },
    null,
  ],
  [
    {
      work: [["08:13", "17:24"]],
      breaks: [
        ["coffee", "10:11", "10:19"],
        ["lunch", "11:59", "12:35"],
      ],
      kinds: [
        ["code", "08:13", "09:30"],
        ["meet", "09:30", "09:48"],
        ["code", "09:48", "13:00"],
        ["meet", "13:00", "14:08"],
        ["code", "14:08", "17:24"],
      ],
    },
    {
      work: [["08:29", "17:30"]],
      breaks: [
        ["coffee", "10:25", "10:34"],
        ["lunch", "12:07", "12:40"],
        ["walk", "14:45", "15:06"],
      ],
      kinds: [
        ["review", "08:29", "09:30"],
        ["meet", "09:30", "09:44"],
        ["code", "09:44", "13:30"],
        ["meet", "13:30", "14:20"],
        ["code", "14:20", "17:30"],
      ],
    },
    {
      work: [
        ["07:52", "16:31"],
        ["20:05", "21:33"],
      ],
      breaks: [
        ["coffee", "09:50", "09:58"],
        ["lunch", "11:41", "12:16"],
      ],
      kinds: [
        ["code", "07:52", "09:30"],
        ["meet", "09:30", "09:45"],
        ["code", "09:45", "14:00"],
        ["meet", "14:00", "14:30"],
        ["review", "14:30", "16:31"],
        ["release", "20:05", "21:33"],
      ],
    },
    {
      work: [["08:57", "17:17"]],
      breaks: [
        ["coffee", "10:33", "10:41"],
        ["lunch", "12:14", "12:47"],
      ],
      kinds: [
        ["code", "08:57", "09:30"],
        ["meet", "09:30", "09:46"],
        ["code", "09:46", "13:30"],
        ["meet", "13:30", "14:30"],
        ["code", "14:30", "17:17"],
      ],
    },
    {
      work: [["08:07", "15:44"]],
      breaks: [
        ["coffee", "09:59", "10:07"],
        ["lunch", "11:53", "12:19"],
      ],
      kinds: [
        ["code", "08:07", "09:30"],
        ["meet", "09:30", "10:14"],
        ["review", "10:14", "11:53"],
        ["code", "11:53", "15:44"],
      ],
    },
    null,
    null,
  ],
];

/** The week `weeksBack` weeks before this one. */
function weekFor(weeksBack: number): Week {
  if (weeksBack === 0) return THIS_WEEK;
  if (weeksBack === 1) return RELEASE_WEEK;
  return OLDER_WEEKS[(weeksBack - 2) % OLDER_WEEKS.length]!;
}

/** A few irregular minutes, fixed per (week, weekday): how much earlier or
 *  later the day started, and how much earlier or later it stopped. Zero for
 *  this week and last, which are written minute by minute for the frames. */
function jitter(weeksBack: number, weekday: number): [Seconds, Seconds] {
  if (weeksBack < 2) return [0, 0];
  const n = Math.imul(weeksBack * 7 + weekday + 1, 2_654_435_761) >>> 0;
  const start = ((n >>> 7) % 13) - 6; // −6 … +6
  const stop = ((n >>> 13) % 17) - 8; // −8 … +8
  return [start * 60, stop * 60];
}

const at = (hhmm: string): Seconds => {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 3600 + m! * 60;
};

/** A plan as the day's spans: its first start moved by `early` and its last
 *  stop by `late`, and written only up to `upTo` — a stretch under way at
 *  that moment is left open (a break keeps the end it was written with, the
 *  way the app writes one), and anything after it is not written yet. */
function writeDay(
  plan: Plan,
  date: DayKey,
  [early, late]: [Seconds, Seconds],
  upTo: Seconds,
): WorkDay | null {
  let n = 0;
  const id = () => `demo-${date}-${++n}`;
  const first = Math.min(...plan.work.map(([start]) => at(start)));
  const last = Math.max(...plan.work.map(([, end]) => at(end)));
  // Nobody's punch lands on the half hour: a nudge that would put it there
  // goes two minutes further.
  const punch = (t: Seconds) => (t % 1800 === 0 ? t + 120 : t);
  const from = (hhmm: string) =>
    at(hhmm) === first ? punch(at(hhmm) + early) : at(hhmm);
  const to = (hhmm: string) =>
    at(hhmm) === last ? punch(at(hhmm) + late) : at(hhmm);

  const written = <T extends Span>(span: T): T | null => {
    if (span.start >= upTo) return null;
    if (span.end !== null && span.end > upTo) return { ...span, end: null };
    return span;
  };

  const sessions: Span[] = [];
  for (const [start, end] of plan.work) {
    const s = written({ id: id(), start: from(start), end: to(end) });
    if (s) sessions.push(s);
  }
  if (sessions.length === 0) return null;

  const breaks: BreakSpan[] = [];
  for (const [type, start, end] of plan.breaks ?? []) {
    if (at(start) >= upTo) continue;
    breaks.push({
      id: id(),
      typeId: DEMO_BREAK[type],
      start: at(start),
      end: at(end),
    });
  }

  const activities: ActivitySpan[] = [];
  for (const [kind, start, end] of plan.kinds) {
    const a = written({
      id: id(),
      categoryId: DEMO_KIND[kind],
      start: from(start),
      end: to(end),
    });
    if (a) activities.push(a);
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

/** Seconds since local midnight of a moment. */
function secondsOf(now: Date): Seconds {
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

/**
 * The demo document for the moment `now`: `DEMO_WEEKS` whole weeks before
 * this one, and this week up to and including today — today written only up
 * to `now`. Weeks are Monday-first, the project's own working week, whatever
 * the report's week start is set to.
 */
export function buildDemoData(now: Date): AppData {
  const project = demoProject();
  const today = dayKeyOf(now);
  const monday = startOfWeek(today, 1);
  const days: AppData["days"] = {};

  for (let back = DEMO_WEEKS; back >= 0; back--) {
    const week = weekFor(back);
    for (let weekday = 0; weekday < 7; weekday++) {
      const plan = week[weekday];
      if (!plan) continue;
      const date = addDays(monday, weekday - back * 7);
      if (date > today) continue;
      const upTo = date === today ? secondsOf(now) : Infinity;
      const day = writeDay(plan, date, jitter(back, weekday), upTo);
      if (day) days[dayKey(project.id, date)] = day;
    }
  }

  return {
    version: DOC_VERSION,
    projects: { [project.id]: project },
    days,
  };
}
