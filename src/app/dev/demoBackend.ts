// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The developer demo-data storage backend. Instead of a special case inside
// the store, an in-memory backend *takes over* document storage while the
// toggle is on — the same seam a test uses. Edits made during the session
// round-trip through it, so clocking in, adding a break and watching the
// report move all behave exactly as they do against the real backend.
// Nothing is ever written to localStorage.

import { dayKeyOf } from "@niclaslindstedt/oss-framework/calendar";

import type { AppData } from "../types.ts";
import type { DocBackend } from "../useDocStore.ts";
import { buildDemoData } from "./demoData.ts";

/** A fresh in-memory demo backend, seeded on first load with the day it was
 *  seeded on — so a session that runs past midnight keeps the days the user
 *  has been looking at instead of rebuilding under them. */
export function createDemoBackend(): DocBackend {
  let doc: AppData | null = null;
  return {
    id: "demo",
    load() {
      doc ??= buildDemoData(dayKeyOf(new Date()));
      return doc;
    },
    save(next) {
      doc = next;
      return true;
    },
  };
}
