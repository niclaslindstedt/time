// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  BACKLIGHT_SPREAD,
  CLOCK_SIZE,
  CLOCK_SIZES,
  DEFAULT_BACKLIGHT,
  DEFAULT_DIAL_PRESET,
  DIAL_FACE,
  DIAL_FACES,
  DIAL_FONT,
  DIAL_FONTS,
  DIAL_HANDS,
  DIAL_HAND_SETS,
  DIAL_MARKERS,
  DIAL_MARKER_STYLES,
  DIAL_MOVEMENT,
  DIAL_MOVEMENTS,
  DIAL_PLACEMENTS,
  DIAL_PRESET,
  DIAL_PRESETS,
  DIAL_RING,
  DIAL_RINGS,
  DIAL_SCALE,
  DIAL_SCALES,
  glowGeometry,
  isNumeral,
  resolveDial,
  type DialConfig,
} from "../src/app/look.ts";

const HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

describe("the dial's vocabulary", () => {
  it("offers eight faces and sizes, nine fonts, markers and presets, two rings and two sets of hands", () => {
    expect(DIAL_FACES).toHaveLength(8);
    expect(DIAL_FONTS).toHaveLength(9);
    expect(DIAL_MARKER_STYLES).toHaveLength(9);
    expect(DIAL_SCALES).toHaveLength(8);
    expect(DIAL_PRESETS).toHaveLength(9);
    expect(DIAL_RINGS).toHaveLength(2);
    expect(DIAL_HAND_SETS).toHaveLength(2);
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
    expect(Object.keys(DIAL_RING).sort()).toEqual([...DIAL_RINGS].sort());
    expect(Object.keys(DIAL_HANDS).sort()).toEqual([...DIAL_HAND_SETS].sort());
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

  it("prints the minutes on the chapter ring, in white on blue, and nothing on the groove", () => {
    expect(DIAL_RING.groove.printed).toBe(false);
    expect(DIAL_RING.groove.fill).toBeNull();
    expect(DIAL_RING.chapter.printed).toBe(true);
    // A blue, and a dark one: the day's bands and the white print both
    // have to read on it.
    const [r, g, b] = rgb(DIAL_RING.chapter.fill!);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
    expect(luminance(DIAL_RING.chapter.fill!)).toBeLessThan(0.05);
    expect(luminance(DIAL_RING.chapter.ink!)).toBeGreaterThan(0.8);
  });

  it("sizes the hours in steps that only grow", () => {
    let last = 0;
    for (const scale of DIAL_SCALES) {
      expect(DIAL_SCALE[scale]).toBeGreaterThan(last);
      last = DIAL_SCALE[scale];
    }
  });

  it("draws a bar in the ink and a tapered hand in steel, narrowing to its tip", () => {
    const bar = DIAL_HANDS.bar;
    expect(bar.taper).toBe(false);
    expect(bar.base).toBe(1);
    expect(bar.tip).toBe(1);
    expect(bar.steel).toBeNull();
    expect(bar.counterweight).toBe("disc");

    const tapered = DIAL_HANDS.tapered;
    expect(tapered.taper).toBe(true);
    // Broader at the boss than the width it is given, and finer at the tip:
    // a taper gives back at one end what it takes at the other.
    expect(tapered.base).toBeGreaterThan(1);
    expect(tapered.tip).toBeLessThan(1);
    expect(tapered.tip).toBeLessThan(tapered.base);
    // Two tones of steel, one lit and one in shade, and they are tones of
    // one metal rather than two colours: a cool cast is what steel has, a
    // hue is what it does not.
    const steel = tapered.steel!;
    expect(luminance(steel.light)).toBeGreaterThan(luminance(steel.shade));
    expect(saturation(steel.light)).toBeLessThan(0.15);
    expect(saturation(steel.shade)).toBeLessThan(0.15);
    // And it reads on every face, light or dark.
    for (const face of DIAL_FACES) {
      const dial = luminance(DIAL_FACE[face].dial);
      const best = Math.max(
        Math.abs(luminance(steel.light) - dial),
        Math.abs(luminance(steel.shade) - dial),
      );
      expect(best, `steel does not read on the ${face} face`).toBeGreaterThan(
        0.1,
      );
    }
    expect(tapered.counterweight).toBe("lozenge");
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

  it("are solid blocks, one wide at twelve, and print no track on the rim", () => {
    expect(DIAL_MARKERS.blocks.at(0)).toBe("wideBaton");
    for (const h of HOURS.slice(1))
      expect(DIAL_MARKERS.blocks.at(h)).toBe("baton");
    expect(DIAL_MARKERS.blocks.minuteTrack).toBe(false);
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
      expect(DIAL_RINGS).toContain(dial.ring);
      expect(DIAL_MOVEMENTS).toContain(dial.movement);
      expect(DIAL_HAND_SETS).toContain(dial.hands);
    }
  });

  it("are nine different dials", () => {
    const seen = new Set(
      DIAL_PRESETS.map((id) => JSON.stringify(DIAL_PRESET[id])),
    );
    expect(seen.size).toBe(9);
  });

  it("draw the sixties dress watch on a printed ring, and say it is an automatic", () => {
    const dial = DIAL_PRESET.uptown;
    expect(dial.ring).toBe("chapter");
    expect(dial.markers).toBe("blocks");
    expect(dial.font).toBe("light");
    expect(dial.movement).toBe("mechanical");
    // The ring is at the rim, where a chapter ring is.
    expect(dial.placement).toBe("inside");
    // Tapered steel hands, which is what a dial of this kind wears.
    expect(dial.hands).toBe("tapered");
    // And it is the only preset on either: the rest keep the groove and the
    // bar hands every dial had.
    for (const id of DIAL_PRESETS) {
      if (id !== "uptown") {
        expect(DIAL_PRESET[id].ring).toBe("groove");
        expect(DIAL_PRESET[id].hands).toBe("bar");
      }
    }
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
    ring: "groove",
    movement: "quartz",
    hands: "bar",
  };

  it("is the preset's own dial, looked up rather than copied", () => {
    expect(resolveDial("abyss", custom)).toBe(DIAL_PRESET.abyss);
  });

  it("is the custom dial under Custom", () => {
    expect(resolveDial("custom", custom)).toBe(custom);
  });
});

/** The three channels of a `#rrggbb` colour, 0 – 255. */
function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** Relative luminance of a `#rrggbb` colour, 0 black to 1 white. */
/** How far a colour is from grey, 0 – 1: what says steel is a metal rather
 *  than a tint. */
function saturation(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => c / 255);
  const max = Math.max(r!, g!, b!);
  const min = Math.min(r!, g!, b!);
  return max === 0 ? 0 : (max - min) / max;
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

describe("the sizes", () => {
  it("has a spec behind every size, and no size without one", () => {
    expect(Object.keys(CLOCK_SIZE).sort()).toEqual([...CLOCK_SIZES].sort());
  });

  it("ramps up the desk's share of the window, small to large", () => {
    const shares = CLOCK_SIZES.map((size) => CLOCK_SIZE[size].share);
    expect(shares).toEqual([0.5, 0.7, 0.85]);
    for (let i = 1; i < shares.length; i++) {
      expect(shares[i]!).toBeGreaterThan(shares[i - 1]!);
    }
  });

  it("never asks for more of the window than there is", () => {
    for (const size of CLOCK_SIZES) {
      expect(CLOCK_SIZE[size].share).toBeGreaterThan(0);
      expect(CLOCK_SIZE[size].share).toBeLessThanOrEqual(1);
    }
  });

  it("wants a wider gap between the chips on a smaller dial", () => {
    expect(CLOCK_SIZE.small.labelGap).toBeGreaterThan(
      CLOCK_SIZE.medium.labelGap,
    );
    expect(CLOCK_SIZE.medium.labelGap).toBeGreaterThan(
      CLOCK_SIZE.large.labelGap,
    );
  });
});

describe("glowGeometry", () => {
  const spreads = [
    BACKLIGHT_SPREAD.min,
    25,
    DEFAULT_BACKLIGHT.spread,
    75,
    BACKLIGHT_SPREAD.max,
  ];

  it("reaches further the wider the spread, and softens with it", () => {
    const halos = spreads.map(glowGeometry);
    for (let i = 1; i < halos.length; i++) {
      expect(halos[i]!.inset).toBeGreaterThan(halos[i - 1]!.inset);
      expect(halos[i]!.blur).toBeGreaterThan(halos[i - 1]!.blur);
    }
  });

  it("holds the light out to the dial's own edge, whatever the reach", () => {
    // The disc is the dial inflated by `inset` on each side and the gradient
    // is sized to its nearer side, so the dial's edge sits at half the dial's
    // width over half the disc's — which is what `hold` has to be, or the
    // halo stops short of the case or washes over it.
    for (const spread of spreads) {
      const { inset, hold, fade } = glowGeometry(spread);
      expect(hold).toBeCloseTo((50 / (50 + inset)) * 100, 1);
      // And the trace is halfway from there to the edge of the disc.
      expect(fade).toBeCloseTo(hold + (100 - hold) / 2, 1);
      expect(fade).toBeLessThan(100);
    }
  });

  it("is a rim of light at nothing and a halo at everything", () => {
    expect(glowGeometry(BACKLIGHT_SPREAD.min).inset).toBe(5);
    expect(glowGeometry(BACKLIGHT_SPREAD.max).inset).toBe(30);
  });

  it("clamps a spread from outside the range rather than inverting the disc", () => {
    expect(glowGeometry(-40)).toEqual(glowGeometry(BACKLIGHT_SPREAD.min));
    expect(glowGeometry(400)).toEqual(glowGeometry(BACKLIGHT_SPREAD.max));
  });
});
