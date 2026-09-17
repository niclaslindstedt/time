// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback } from "react";

import { useLocalStorageState } from "@niclaslindstedt/oss-framework/hooks";
import type { WeekStart } from "@niclaslindstedt/oss-framework/calendar";

import {
  CLOCK_SIZE,
  DEFAULT_DIAL_PRESET,
  DIAL_FACE,
  DIAL_FONT,
  DIAL_MARKERS,
  DIAL_MOVEMENT,
  DIAL_PLACEMENTS,
  DIAL_PRESET,
  DIAL_SCALE,
  type ClockSize,
  type DialConfig,
  type DialPreset,
} from "./look.ts";

// The app's own (non-document) settings: which of the two themes is active,
// which day the week starts on, which project the screens are showing, and
// the developer knobs. Per device on purpose — the project you have on
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
  /** Which dial the Today screen draws: one of the presets, or the custom
   *  one below, piece by piece. Both are kept, so going back to a preset and
   *  then to "Custom" again finds the custom dial as it was left. See
   *  `look.ts`. */
  clockPreset: DialPreset | "custom";
  clock: DialConfig;
  /** How much of the screen the dial takes. Per device rather than part of
   *  a preset: a size suits a screen, not a dial. */
  clockSize: ClockSize;
  /** The project the Today, Log and Report screens show. Null until one is
   *  chosen; `App` falls back to the first project by name. */
  activeProjectId: string | null;
  /** Surface the developer affordances in Settings. */
  devMode: boolean;
  /** Mirror console output into the in-app log buffer. */
  captureLogs: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  weekStartsOn: 1,
  clockPreset: DEFAULT_DIAL_PRESET,
  clock: DIAL_PRESET[DEFAULT_DIAL_PRESET],
  clockSize: "large",
  activeProjectId: null,
  devMode: false,
  captureLogs: false,
};

const STORAGE_KEY = "time:settings";

/** One of a table's keys, or the fallback: what every stored choice is
 *  clamped to, so a value from an older build (or a hand-edited one) can
 *  never pick a dial that does not exist. */
function oneOf<K extends string>(
  table: Record<K, unknown>,
  value: unknown,
  fallback: K,
): K {
  return typeof value === "string" && value in table ? (value as K) : fallback;
}

/** A custom dial, field by field, against the default preset. */
function parseDial(value: unknown): DialConfig {
  const base = DIAL_PRESET[DEFAULT_DIAL_PRESET];
  const raw = (
    typeof value === "object" && value !== null ? value : {}
  ) as Partial<Record<keyof DialConfig, unknown>>;
  const scale = Math.round(Number(raw.scale));
  return {
    face: oneOf(DIAL_FACE, raw.face, base.face),
    font: oneOf(DIAL_FONT, raw.font, base.font),
    markers: oneOf(DIAL_MARKERS, raw.markers, base.markers),
    scale: (scale in DIAL_SCALE ? scale : base.scale) as DialConfig["scale"],
    placement: DIAL_PLACEMENTS.includes(
      raw.placement as DialConfig["placement"],
    )
      ? (raw.placement as DialConfig["placement"])
      : base.placement,
    movement: oneOf(DIAL_MOVEMENT, raw.movement, base.movement),
  };
}

/** Stored bytes → settings, every field clamped. Exported for the tests;
 *  the app reads it through `useAppSettings`. */
export function parseSettings(raw: string): AppSettings {
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return DEFAULT_SETTINGS;
  }
  const merged = { ...DEFAULT_SETTINGS, ...(parsed as object) } as AppSettings;
  const week = Math.round(Number(merged.weekStartsOn));
  // Settings written before the rename called this key `activeEmployerId`.
  // Read it once so an existing device keeps the project it had on screen
  // rather than falling back to the first one by name.
  const legacyActiveId = (parsed as { activeEmployerId?: unknown })
    .activeEmployerId;
  const activeProjectId =
    typeof merged.activeProjectId === "string"
      ? merged.activeProjectId
      : typeof legacyActiveId === "string"
        ? legacyActiveId
        : null;
  return {
    theme:
      merged.theme === "light" || merged.theme === "dark"
        ? merged.theme
        : "system",
    weekStartsOn: (week >= 0 && week <= 6 ? week : 1) as WeekStart,
    clockPreset:
      merged.clockPreset === "custom"
        ? "custom"
        : oneOf(DIAL_PRESET, merged.clockPreset, DEFAULT_DIAL_PRESET),
    clock: parseDial(merged.clock),
    clockSize: oneOf(CLOCK_SIZE, merged.clockSize, DEFAULT_SETTINGS.clockSize),
    activeProjectId,
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
