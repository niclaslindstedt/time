// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { DIAL_PRESET } from "../src/app/look.ts";
import { DEFAULT_SETTINGS, parseSettings } from "../src/app/useAppSettings.ts";

// The settings store's parser: what comes back from localStorage is clamped
// field by field, so a value from an older build, or a hand-edited one, can
// never pick a dial that does not exist.

describe("parseSettings", () => {
  it("falls back to the defaults for bytes that are not settings", () => {
    expect(parseSettings("null")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("[1]")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("{}")).toEqual(DEFAULT_SETTINGS);
  });

  it("boots on the default dial, large", () => {
    expect(DEFAULT_SETTINGS.clockPreset).toBe("snowfield");
    expect(DEFAULT_SETTINGS.clock).toEqual(DIAL_PRESET.snowfield);
    expect(DEFAULT_SETTINGS.clockSize).toBe("large");
  });

  it("keeps a preset choice and a custom dial", () => {
    const s = parseSettings(
      JSON.stringify({
        clockPreset: "abyss",
        clock: { ...DIAL_PRESET.harvest, movement: "sweep" },
        clockSize: "small",
      }),
    );
    expect(s.clockPreset).toBe("abyss");
    expect(s.clock).toEqual({ ...DIAL_PRESET.harvest, movement: "sweep" });
    expect(s.clockSize).toBe("small");
  });

  it("keeps Custom as a choice of its own", () => {
    expect(parseSettings('{"clockPreset":"custom"}').clockPreset).toBe(
      "custom",
    );
  });

  it("clamps an unknown preset, size or dial field to the default", () => {
    const s = parseSettings(
      JSON.stringify({
        clockPreset: "nautilus",
        clockSize: "huge",
        clock: {
          face: "purple",
          font: "comic",
          markers: "diamonds",
          scale: 12,
          placement: "under",
          movement: "steam",
        },
      }),
    );
    expect(s.clockPreset).toBe(DEFAULT_SETTINGS.clockPreset);
    expect(s.clockSize).toBe(DEFAULT_SETTINGS.clockSize);
    expect(s.clock).toEqual(DEFAULT_SETTINGS.clock);
  });

  it("clamps each dial field on its own, not all of them together", () => {
    const s = parseSettings(
      JSON.stringify({
        clock: { face: "blue", scale: "3", movement: "warp" },
      }),
    );
    expect(s.clock.face).toBe("blue");
    expect(s.clock.scale).toBe(3);
    expect(s.clock.movement).toBe(DEFAULT_SETTINGS.clock.movement);
  });

  it("drops the settings an older build kept for its dial", () => {
    const s = parseSettings(
      JSON.stringify({ clockLook: "bold", clockFont: "roman", theme: "dark" }),
    );
    expect(s).not.toHaveProperty("clockLook");
    expect(s).not.toHaveProperty("clockFont");
    expect(s.theme).toBe("dark");
    expect(s.clockPreset).toBe(DEFAULT_SETTINGS.clockPreset);
  });
});
