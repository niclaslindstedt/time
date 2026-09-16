// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  CLOCK_SIZES,
  DEFAULT_DIAL_PRESET,
  DIAL_FACE,
  DIAL_FACES,
  DIAL_FONT,
  DIAL_FONTS,
  DIAL_MARKERS,
  DIAL_MARKER_STYLES,
  DIAL_MOVEMENT,
  DIAL_MOVEMENTS,
  DIAL_PLACEMENTS,
  DIAL_PRESET,
  DIAL_PRESETS,
  DIAL_SCALE,
  DIAL_SCALES,
  isNumeral,
  resolveDial,
  type DialConfig,
} from "../src/app/look.ts";

const HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

describe("the dial's vocabulary", () => {
  it("offers eight of each, and three placements, movements and sizes", () => {
    expect(DIAL_FACES).toHaveLength(8);
    expect(DIAL_FONTS).toHaveLength(8);
    expect(DIAL_MARKER_STYLES).toHaveLength(8);
    expect(DIAL_SCALES).toHaveLength(8);
    expect(DIAL_PRESETS).toHaveLength(8);
    expect(DIAL_PLACEMENTS).toHaveLength(3);
    expect(DIAL_MOVEMENTS).toHaveLength(3);
    expect(CLOCK_SIZES).toHaveLength(3);
  });

  it("has a spec behind every id, and no id without one", () => {
    expect(Object.keys(DIAL_FACE).sort()).toEqual([...DIAL_FACES].sort());
    expect(Object.keys(DIAL_FONT).sort()).toEqual([...DIAL_FONTS].sort());
    expect(Object.keys(DIAL_MARKERS).sort()).toEqual(
      [...DIAL_MARKER_STYLES].sort(),
    );
    expect(Object.keys(DIAL_SCALE).map(Number).sort()).toEqual(
      [...DIAL_SCALES].sort(),
    );
    expect(Object.keys(DIAL_PRESET).sort()).toEqual([...DIAL_PRESETS].sort());
  });

  it("names the six faces asked for, and two more", () => {
    for (const face of [
      "white",
      "blue",
      "burgundy",
      "champagne",
      "black",
      "silver",
    ]) {
      expect(DIAL_FACES).toContain(face);
    }
  });

  it("prints dark ink on a light face and light ink on a dark one", () => {
    for (const face of DIAL_FACES) {
      const spec = DIAL_FACE[face];
      const ink = luminance(spec.ink);
      const dial = luminance(spec.dial);
      expect(spec.dark, `${face} says dark=${spec.dark}`).toBe(dial < 0.4);
      expect(
        Math.abs(ink - dial),
        `${face}'s ink does not read against its dial`,
      ).toBeGreaterThan(0.5);
    }
  });

  it("sizes the hours in steps that only grow", () => {
    let last = 0;
    for (const scale of DIAL_SCALES) {
      expect(DIAL_SCALE[scale]).toBeGreaterThan(last);
      last = DIAL_SCALE[scale];
    }
  });

  it("beats once, eight times, or not at all", () => {
    expect(DIAL_MOVEMENT.quartz.beats).toBe(1);
    expect(DIAL_MOVEMENT.mechanical.beats).toBe(8);
    expect(DIAL_MOVEMENT.sweep.beats).toBeNull();
  });
});

describe("the hour markers", () => {
  it("put a double baton at twelve and a baton elsewhere", () => {
    expect(DIAL_MARKERS.batons.at(0)).toBe("doubleBaton");
    for (const h of HOURS.slice(1))
      expect(DIAL_MARKERS.batons.at(h)).toBe("baton");
  });

  it("are a diver's: a triangle at twelve, batons at the quarters, dots between", () => {
    expect(DIAL_MARKERS.dots.at(0)).toBe("triangle");
    for (const h of [3, 6, 9]) expect(DIAL_MARKERS.dots.at(h)).toBe("baton");
    for (const h of [1, 2, 4, 5, 7, 8, 10, 11])
      expect(DIAL_MARKERS.dots.at(h)).toBe("dot");
  });

  it("number only three, six and nine on the expedition dial", () => {
    for (const h of HOURS) {
      const marker = DIAL_MARKERS.threeSixNine.at(h);
      if (h === 3 || h === 6 || h === 9) expect(marker).toBe("arabic");
      else if (h === 0) expect(marker).toBe("triangle");
      else expect(marker).toBe("baton");
    }
  });

  it("number the quarters, twelve included", () => {
    for (const h of HOURS) {
      expect(DIAL_MARKERS.quarters.at(h)).toBe(
        h % 3 === 0 ? "arabic" : "baton",
      );
    }
  });

  it("set every hour in Roman, or in Arabic, or in none", () => {
    for (const h of HOURS) {
      expect(DIAL_MARKERS.roman.at(h)).toBe("roman");
      expect(DIAL_MARKERS.numerals.at(h)).toBe("arabic");
      expect(DIAL_MARKERS.wedges.at(h)).toBe("wedge");
      expect(DIAL_MARKERS.ticks.at(h)).toBe("tick");
    }
  });

  it("knows which markers are set in the typeface", () => {
    expect(isNumeral("arabic")).toBe(true);
    expect(isNumeral("roman")).toBe(true);
    expect(isNumeral("baton")).toBe(false);
    expect(isNumeral("dot")).toBe(false);
  });

  it("wear a minute track on the styles a watch prints one with", () => {
    expect(DIAL_MARKERS.batons.minuteTrack).toBe(true);
    expect(DIAL_MARKERS.dots.minuteTrack).toBe(true);
    expect(DIAL_MARKERS.ticks.minuteTrack).toBe(true);
    expect(DIAL_MARKERS.roman.minuteTrack).toBe(false);
    expect(DIAL_MARKERS.wedges.minuteTrack).toBe(false);
  });
});

describe("the presets", () => {
  it("default to a silver face whose second hand glides", () => {
    expect(DEFAULT_DIAL_PRESET).toBe("snowfield");
    const dial = DIAL_PRESET[DEFAULT_DIAL_PRESET];
    expect(dial.face).toBe("silver");
    expect(dial.movement).toBe("sweep");
    expect(dial.markers).toBe("batons");
  });

  it("are all made of the options on offer", () => {
    for (const id of DIAL_PRESETS) {
      const dial = DIAL_PRESET[id];
      expect(DIAL_FACES).toContain(dial.face);
      expect(DIAL_FONTS).toContain(dial.font);
      expect(DIAL_MARKER_STYLES).toContain(dial.markers);
      expect(DIAL_SCALES).toContain(dial.scale);
      expect(DIAL_PLACEMENTS).toContain(dial.placement);
      expect(DIAL_MOVEMENTS).toContain(dial.movement);
    }
  });

  it("are eight different dials", () => {
    const seen = new Set(
      DIAL_PRESETS.map((id) => JSON.stringify(DIAL_PRESET[id])),
    );
    expect(seen.size).toBe(8);
  });

  it("cover every movement and every placement between them", () => {
    const movements = new Set(
      DIAL_PRESETS.map((id) => DIAL_PRESET[id].movement),
    );
    const placements = new Set(
      DIAL_PRESETS.map((id) => DIAL_PRESET[id].placement),
    );
    expect([...movements].sort()).toEqual([...DIAL_MOVEMENTS].sort());
    expect([...placements].sort()).toEqual([...DIAL_PLACEMENTS].sort());
  });
});

describe("resolveDial", () => {
  const custom: DialConfig = {
    face: "green",
    font: "mono",
    markers: "ticks",
    scale: 2,
    placement: "over",
    movement: "quartz",
  };

  it("is the preset's own dial, looked up rather than copied", () => {
    expect(resolveDial("abyss", custom)).toBe(DIAL_PRESET.abyss);
  });

  it("is the custom dial under Custom", () => {
    expect(resolveDial("custom", custom)).toBe(custom);
  });
});

/** Relative luminance of a `#rrggbb` colour, 0 black to 1 white. */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}
