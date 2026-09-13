// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Fixtures the domain tests share. Not a test file itself — no `_test` suffix
// — so Vitest never tries to run it.

import type { EditContext } from "../../src/app/actions.ts";
import type { Employer, WorkDay } from "../../src/app/types.ts";

export const STAMP = "2026-03-02T09:00:00.000Z";

/** Named, predictable ids: `s1`, `s2`, … */
export function ctx(prefix = "id"): EditContext {
  let n = 0;
  return { id: () => `${prefix}${++n}`, updatedAt: STAMP };
}

export const h = (hours: number, minutes = 0) => hours * 3600 + minutes * 60;

export function employer(patch: Partial<Employer> = {}): Employer {
  return {
    id: "acme",
    name: "Acme",
    workDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    breakTypes: [
      { id: "lunch", name: "Lunch", defaultMinutes: 30 },
      { id: "coffee", name: "Coffee", defaultMinutes: 15 },
    ],
    categories: [
      { id: "meet", name: "Meetings" },
      { id: "code", name: "Coding" },
    ],
    updatedAt: STAMP,
    ...patch,
  };
}

export function day(date: string, patch: Partial<WorkDay> = {}): WorkDay {
  return {
    date,
    employerId: "acme",
    sessions: [],
    breaks: [],
    activities: [],
    updatedAt: STAMP,
    ...patch,
  };
}
