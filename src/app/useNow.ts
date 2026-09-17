// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useState } from "react";

import { dayKeyOf, type DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { secondsOfDay } from "./format.ts";
import type { Seconds } from "./types.ts";

// The one place the app reads the clock. Every derivation takes `today` and
// `now` as parameters (see `day.ts`, `report.ts`); this hook is where those
// parameters come from, ticking at whatever rate a screen needs — once a
// second for the timer, once a minute for a list — and re-read on focus so a
// phone that was asleep does not show the time it dozed off at.

export type Now = { today: DayKey; seconds: Seconds };

function read(): Now {
  const date = new Date();
  return { today: dayKeyOf(date), seconds: secondsOfDay(date) };
}

/**
 * The moment to the millisecond, for the one thing that needs it: the loop
 * that moves the clock's hands (see `useHands.ts`). A derivation must never
 * take this — it is not a parameter, it is a reading — but a second hand
 * beating eight times a second cannot be told the time in whole seconds.
 * Here rather than in the loop so the clock is still read in one file.
 */
export function nowExact(): Seconds {
  const date = new Date();
  return secondsOfDay(date) + date.getMilliseconds() / 1000;
}

export function useNow(intervalMs: number): Now {
  const [now, setNow] = useState<Now>(read);
  useEffect(() => {
    const refresh = () => setNow(read());
    const timer = setInterval(refresh, intervalMs);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intervalMs]);
  return now;
}
