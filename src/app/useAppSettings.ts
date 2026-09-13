// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback } from "react";

import { useLocalStorageState } from "@niclaslindstedt/oss-framework/hooks";
import type { WeekStart } from "@niclaslindstedt/oss-framework/calendar";

import {
  CLOCK_LOOK,
  CLOCK_SIZE,
  type ClockLook,
  type ClockSize,
} from "./look.ts";

// The app's own (non-document) settings: which of the two themes is active,
// which day the week starts on, which employer the screens are showing, and
// the developer knobs. Per device on purpose — the employer you have on
// screen is not a fact about your working hours, so it does not sync — and
// persisted to localStorage so a reload keeps your choices.

/** The theme choice. Deliberately three values and no more — one light, one
 *  dark, and "follow the device". */
export type ThemeChoice = "light" | "dark" | "system";

export type AppSettings = {
  theme: ThemeChoice;
  /** First day of the week (`Date.getDay()` numbering: 0 = Sunday,
   *  1 = Monday) — decides what the weekly report covers. */
  weekStartsOn: WeekStart;
  /** Which dial the Today screen draws, and how big. A shape choice, not a
   *  palette one — see `look.ts`. */
  clockLook: ClockLook;
  clockSize: ClockSize;
  /** The employer the Today, Log and Report screens show. Null until one is
   *  chosen; `App` falls back to the first employer by name. */
  activeEmployerId: string | null;
  /** Surface the developer affordances in Settings. */
  devMode: boolean;
  /** Mirror console output into the in-app log buffer. */
  captureLogs: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  weekStartsOn: 1,
  clockLook: "classic",
  clockSize: "medium",
  activeEmployerId: null,
  devMode: false,
  captureLogs: false,
};

const STORAGE_KEY = "time:settings";

function parseSettings(raw: string): AppSettings {
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return DEFAULT_SETTINGS;
  }
  const merged = { ...DEFAULT_SETTINGS, ...(parsed as object) } as AppSettings;
  const week = Math.round(Number(merged.weekStartsOn));
  return {
    ...merged,
    theme:
      merged.theme === "light" || merged.theme === "dark"
        ? merged.theme
        : "system",
    weekStartsOn: (week >= 0 && week <= 6 ? week : 1) as WeekStart,
    clockLook:
      merged.clockLook in CLOCK_LOOK
        ? merged.clockLook
        : DEFAULT_SETTINGS.clockLook,
    clockSize:
      merged.clockSize in CLOCK_SIZE
        ? merged.clockSize
        : DEFAULT_SETTINGS.clockSize,
    activeEmployerId:
      typeof merged.activeEmployerId === "string"
        ? merged.activeEmployerId
        : null,
    devMode: merged.devMode === true,
    captureLogs: merged.captureLogs === true,
  };
}

export function useAppSettings() {
  // The framework hook owns the persistence mechanics (safe parse,
  // write-through); this store owns the key, the shape, and the clamping.
  const [settings, setSettings] = useLocalStorageState<AppSettings>(
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    { parse: parseSettings },
  );

  const update = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
      setSettings((prev) => ({ ...prev, [key]: value })),
    [setSettings],
  );

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [setSettings]);

  return { settings, update, reset, setSettings };
}
