// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Reconciling two copies of the document — the phone's and the cloud's.
//
// Employers are keyed by id and days by `dayKey`, and each carries the
// timestamp of its last edit, so two copies merge record by record with the
// later edit winning. Nobody is asked which side to keep: a day logged on the
// phone and a break corrected on the laptop both survive.
//
// The known cost: a *deleted* record is an absence, not a tombstone, so a day
// deleted on one device comes back from the other until that device syncs —
// which it never can, because it has nothing to say. Days are added far more
// often than deleted, so the trade is worth it, and `docs/sync.md` says so.
//
// Pure and total: same inputs, same output, no clock, no storage.

import { DOC_VERSION, type AppData } from "./types.ts";

function newer<T extends { updatedAt: string }>(a: T, b: T): T {
  return b.updatedAt > a.updatedAt ? b : a;
}

function mergeRecords<T extends { updatedAt: string }>(
  local: Record<string, T>,
  remote: Record<string, T>,
): Record<string, T> {
  const out: Record<string, T> = { ...local };
  for (const [key, value] of Object.entries(remote)) {
    const mine = out[key];
    out[key] = mine ? newer(mine, value) : value;
  }
  return out;
}

/** Merge two documents record by record, last edit winning. */
export function mergeDocs(local: AppData, remote: AppData): AppData {
  return {
    version: DOC_VERSION,
    employers: mergeRecords(local.employers, remote.employers),
    days: mergeRecords(local.days, remote.days),
  };
}
