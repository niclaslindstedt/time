// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { DEFAULT_BACKLIGHT, DIAL_PRESET } from "../src/app/look.ts";
import { DEFAULT_SPEC_PRESET, SPEC_PRESET } from "../src/app/specStyle.ts";
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
    expect(DEFAULT_SETTINGS.clockPreset).toBe("uptown");
    expect(DEFAULT_SETTINGS.clock).toEqual(DIAL_PRESET.uptown);
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
          ring: "halo",
          movement: "steam",
          hands: "feathers",
        },
      }),
    );
    expect(s.clockPreset).toBe(DEFAULT_SETTINGS.clockPreset);
    expect(s.clockSize).toBe(DEFAULT_SETTINGS.clockSize);
    expect(s.clock).toEqual(DEFAULT_SETTINGS.clock);
  });

  it("gives a dial stored before the ring was a choice the groove", () => {
    const s = parseSettings(
      JSON.stringify({
        clockPreset: "custom",
        clock: { ...DIAL_PRESET.abyss, ring: undefined },
      }),
    );
    expect(s.clock.ring).toBe("groove");
    expect(parseSettings('{"clock":{"ring":"chapter"}}').clock.ring).toBe(
      "chapter",
    );
  });

  it("gives a dial stored before the hands were a choice the bar", () => {
    const s = parseSettings(
      JSON.stringify({
        clockPreset: "custom",
        clock: { ...DIAL_PRESET.abyss, hands: undefined },
      }),
    );
    expect(s.clock.hands).toBe("bar");
    expect(parseSettings('{"clock":{"hands":"tapered"}}').clock.hands).toBe(
      "tapered",
    );
  });

  it("keeps the markers of a dial stored when the blocks were lumed", () => {
    const s = parseSettings('{"clock":{"markers":"plots"}}');
    expect(s.clock.markers).toBe("blocks");
  });

  it("keeps the light on the metal still until it is asked for", () => {
    expect(DEFAULT_SETTINGS.reflect).toBe(false);
    // A device that stored its settings before there was anything to move
    // the light with, and one that stored an answer that is not an answer.
    expect(parseSettings("{}").reflect).toBe(false);
    expect(parseSettings('{"reflect":"yes"}').reflect).toBe(false);
    expect(parseSettings('{"reflect":true}').reflect).toBe(true);
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

  it("keeps the project on screen across the employer → project rename", () => {
    const s = parseSettings(JSON.stringify({ activeEmployerId: "acme" }));
    expect(s.activeProjectId).toBe("acme");
    expect(s).not.toHaveProperty("activeEmployerId");
  });

  it("prefers the current key when both are stored", () => {
    const s = parseSettings(
      JSON.stringify({ activeEmployerId: "old", activeProjectId: "new" }),
    );
    expect(s.activeProjectId).toBe("new");
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

describe("parseSettings – the backlight", () => {
  it("boots on the theme's accent, a slow beat, and a mid light", () => {
    expect(DEFAULT_SETTINGS.backlight).toEqual(DEFAULT_BACKLIGHT);
    expect(parseSettings("{}").backlight).toEqual(DEFAULT_BACKLIGHT);
  });

  it("keeps a choice within range", () => {
    const s = parseSettings(
      JSON.stringify({
        backlight: { color: "violet", hz: 1, intensity: 35, spread: 20 },
      }),
    );
    expect(s.backlight).toEqual({
      color: "violet",
      hz: 1,
      intensity: 35,
      spread: 20,
    });
  });

  it("clamps a beat, a brightness and a spread that are out of range", () => {
    const s = parseSettings(
      JSON.stringify({
        backlight: { color: "amber", hz: 9, intensity: -4, spread: 300 },
      }),
    );
    expect(s.backlight).toEqual({
      color: "amber",
      hz: 2,
      intensity: 0,
      spread: 100,
    });
  });

  it("falls back field by field on a colour or a number that is not one", () => {
    const s = parseSettings(
      JSON.stringify({
        backlight: {
          color: "plaid",
          hz: "fast",
          intensity: "bright",
          spread: "wide",
        },
      }),
    );
    expect(s.backlight).toEqual(DEFAULT_BACKLIGHT);
    expect(parseSettings('{"backlight":7}').backlight).toEqual(
      DEFAULT_BACKLIGHT,
    );
  });

  it("gives a device that stored a backlight before the spread the default", () => {
    const s = parseSettings(
      JSON.stringify({ backlight: { color: "teal", hz: 0, intensity: 80 } }),
    );
    expect(s.backlight.spread).toBe(DEFAULT_BACKLIGHT.spread);
  });
});

describe("the specification's style and details", () => {
  it("boots on the default style with an empty form", () => {
    expect(DEFAULT_SETTINGS.specPreset).toBe(DEFAULT_SPEC_PRESET);
    expect(DEFAULT_SETTINGS.spec).toEqual(SPEC_PRESET[DEFAULT_SPEC_PRESET]);
    expect(DEFAULT_SETTINGS.specDetails).toEqual({
      preparedBy: "",
      client: "",
      reference: "",
      note: "",
    });
  });

  it("keeps a style choice and the custom style beside it", () => {
    const custom = { ...SPEC_PRESET.plain, accent: "plum" };
    const s = parseSettings(
      JSON.stringify({ specPreset: "custom", spec: custom }),
    );
    expect(s.specPreset).toBe("custom");
    expect(s.spec.accent).toBe("plum");
    expect(parseSettings('{"specPreset":"ledger"}').specPreset).toBe("ledger");
    expect(parseSettings('{"specPreset":"gothic"}').specPreset).toBe(
      DEFAULT_SPEC_PRESET,
    );
  });

  it("clamps the style field by field", () => {
    const s = parseSettings(JSON.stringify({ spec: { paper: "foolscap" } }));
    expect(s.spec.paper).toBe(SPEC_PRESET[DEFAULT_SPEC_PRESET].paper);
  });

  it("keeps the details as typed, to a length", () => {
    const s = parseSettings(
      JSON.stringify({
        specDetails: {
          preparedBy: "Alex Karlsson",
          client: 7,
          note: "x".repeat(900),
        },
      }),
    );
    expect(s.specDetails.preparedBy).toBe("Alex Karlsson");
    expect(s.specDetails.client).toBe("");
    expect(s.specDetails.note).toHaveLength(500);
  });

  it("gives a device that stored its settings before the export the defaults", () => {
    const s = parseSettings('{"theme":"dark"}');
    expect(s.specPreset).toBe(DEFAULT_SPEC_PRESET);
    expect(s.specDetails).toEqual(DEFAULT_SETTINGS.specDetails);
  });
});
