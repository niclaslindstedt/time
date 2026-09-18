// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { STEEL } from "../src/app/look.ts";
import {
  AMBIENT,
  domeSheen,
  facetTone,
  mix,
  sheenTurn,
  steelTone,
  wrap,
  type Light,
} from "../src/app/sheen.ts";

/** A light straight overhead: nothing is off to either side of anything. */
const OVERHEAD: Light = { angle: 0, throw: 0 };
/** A light right at the rim, over the left shoulder. */
const HARD: Light = { angle: 315, throw: 1 };

describe("the light a dial is drawn under", () => {
  it("stands over the left shoulder by default, part way off the crystal", () => {
    expect(AMBIENT.angle).toBe(315);
    expect(AMBIENT.throw).toBeGreaterThan(0);
    expect(AMBIENT.throw).toBeLessThan(1);
  });
});

describe("facetTone", () => {
  it("is the mid grey of steel under a light straight overhead", () => {
    for (const axis of [0, 30, 90, 217, 300]) {
      expect(facetTone(axis, -1, OVERHEAD)).toBeCloseTo(0.5, 6);
      expect(facetTone(axis, 1, OVERHEAD)).toBeCloseTo(0.5, 6);
    }
  });

  it("lights the side the light is on and shades the other", () => {
    // A marker at twelve under a light over the left shoulder: its left
    // facet faces the light, its right faces away.
    const left = facetTone(0, -1, AMBIENT);
    const right = facetTone(0, 1, AMBIENT);
    expect(left).toBeGreaterThan(0.5);
    expect(right).toBeLessThan(0.5);
    // And they are the same distance either side of the metal's mid grey:
    // one facet's gain is the other's loss.
    expect(left - 0.5).toBeCloseTo(0.5 - right, 6);
  });

  it("swaps the two sides when the light crosses the part's own axis", () => {
    const over = { angle: 315, throw: 0.6 };
    const under = { angle: 135, throw: 0.6 };
    expect(facetTone(0, -1, over)).toBeGreaterThan(facetTone(0, 1, over));
    expect(facetTone(0, -1, under)).toBeLessThan(facetTone(0, 1, under));
  });

  it("is mid grey when the light runs along the part, however hard", () => {
    // The light at twelve, the hand pointing at twelve: nothing is across
    // either facet, so neither is turned into it.
    expect(facetTone(0, -1, { angle: 0, throw: 1 })).toBeCloseTo(0.5, 6);
    expect(facetTone(0, 1, { angle: 180, throw: 1 })).toBeCloseTo(0.5, 6);
  });

  it("follows the part round the dial: one hand's bright half goes dark as it sweeps", () => {
    // The same facet of the same hand, pointing at twelve and then at six:
    // it was turned into the light and now it is turned away from it, which
    // is the whole of why a sweeping hand keeps catching and losing the
    // light rather than staying one shade of grey.
    expect(facetTone(0, -1, AMBIENT)).toBeGreaterThan(0.5);
    expect(facetTone(180, -1, AMBIENT)).toBeLessThan(0.5);
    // And at four it is neither: part way round, part way lit.
    const four = facetTone(120, -1, AMBIENT);
    expect(four).toBeGreaterThan(facetTone(180, -1, AMBIENT));
    expect(four).toBeLessThan(facetTone(0, -1, AMBIENT));
  });

  it("stays a tone, whatever is thrown at it", () => {
    for (const light of [OVERHEAD, AMBIENT, HARD, { angle: 1e6, throw: 9 }]) {
      for (const axis of [0, 45, 123, -400]) {
        for (const side of [-1, 1] as const) {
          const tone = facetTone(axis, side, light);
          expect(tone).toBeGreaterThanOrEqual(0);
          expect(tone).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe("domeSheen", () => {
  it("lays the band down the middle under a light straight overhead", () => {
    for (const axis of [0, 60, 180, 300]) {
      expect(domeSheen(axis, OVERHEAD).crest).toBeCloseTo(0.5, 6);
    }
  });

  it("slides the band towards the side the light is on", () => {
    // A block at twelve, the light over the left shoulder: the band sits
    // left of its middle.
    expect(domeSheen(0, AMBIENT).crest).toBeLessThan(0.5);
    // And over the right shoulder, right of it.
    expect(domeSheen(0, { angle: 45, throw: 0.55 }).crest).toBeGreaterThan(0.5);
  });

  it("slides it further the further off the crystal the light stands", () => {
    const soft = domeSheen(0, { angle: 270, throw: 0.3 });
    const hard = domeSheen(0, { angle: 270, throw: 0.9 });
    expect(hard.crest).toBeLessThan(soft.crest);
    // Right at the rim the band is at the edge itself, and no further.
    expect(domeSheen(0, { angle: 270, throw: 1 }).crest).toBeCloseTo(0, 6);
    expect(domeSheen(0, { angle: 90, throw: 1 }).crest).toBeCloseTo(1, 6);
  });

  it("keeps the band on the block, at any angle and any throw", () => {
    for (let angle = 0; angle < 360; angle += 7) {
      for (const t of [0, 0.25, 0.55, 1, 4]) {
        for (const axis of [0, 30, 150, 240]) {
          const dome = domeSheen(axis, { angle, throw: t });
          expect(dome.crest).toBeGreaterThanOrEqual(0);
          expect(dome.crest).toBeLessThanOrEqual(1);
          expect(dome.peak).toBeGreaterThan(0);
          expect(dome.peak).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("shoulders the block the way the two facets of a ridge are shouldered", () => {
    const dome = domeSheen(120, AMBIENT);
    expect(dome.left).toBeCloseTo(facetTone(120, -1, AMBIENT), 6);
    expect(dome.right).toBeCloseTo(facetTone(120, 1, AMBIENT), 6);
    // And the band is brighter than either of them.
    expect(dome.peak).toBeGreaterThan(dome.left);
    expect(dome.peak).toBeGreaterThan(dome.right);
  });

  it("catches more of a light that is off to one side than one overhead", () => {
    expect(domeSheen(0, HARD).peak).toBeGreaterThan(
      domeSheen(0, OVERHEAD).peak,
    );
  });
});

describe("steelTone", () => {
  it("is the shade at nothing and the light at one", () => {
    expect(steelTone(0)).toBe(mix(STEEL.shade, STEEL.shade, 0));
    expect(steelTone(1)).toBe(mix(STEEL.light, STEEL.light, 0));
  });

  it("only ever brightens between them", () => {
    let last = -1;
    for (const tone of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const grey = green(steelTone(tone));
      expect(grey).toBeGreaterThan(last);
      last = grey;
    }
  });

  it("clamps a tone off either end rather than leaving the metal", () => {
    expect(steelTone(-3)).toBe(steelTone(0));
    expect(steelTone(4)).toBe(steelTone(1));
  });
});

describe("mix", () => {
  it("is either end at either end, and the middle in between", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("rgb(0 0 0)");
    expect(mix("#000000", "#ffffff", 1)).toBe("rgb(255 255 255)");
    expect(mix("#000000", "#ffffff", 0.5)).toBe("rgb(128 128 128)");
  });

  it("mixes each channel on its own", () => {
    expect(mix("#ff0000", "#0000ff", 0.5)).toBe("rgb(128 0 128)");
  });
});

describe("the crystal's own glare", () => {
  it("does not turn at all under the light the drawing assumes", () => {
    expect(sheenTurn(AMBIENT)).toBe(0);
  });

  it("turns with the light, the short way round", () => {
    expect(sheenTurn({ angle: 345, throw: 0.5 })).toBe(30);
    expect(sheenTurn({ angle: 285, throw: 0.5 })).toBe(-30);
    // A light that has come the whole way round is back where it started.
    expect(sheenTurn({ angle: 315 + 360, throw: 0.5 })).toBe(0);
  });
});

describe("wrap", () => {
  it("folds an angle into one turn either side of nothing", () => {
    expect(wrap(0)).toBe(0);
    expect(wrap(190)).toBe(-170);
    expect(wrap(-190)).toBe(170);
    expect(wrap(720 + 45)).toBe(45);
  });
});

/** The green channel of an `rgb(r g b)` string: a stand-in for how light a
 *  grey is, which is all these tones are. */
function green(colour: string): number {
  return Number(
    colour
      .replace(/[^\d ]/g, "")
      .trim()
      .split(/\s+/)[1],
  );
}
