// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DIAL_SECONDS,
  angleOf,
  arcPath,
  framePath,
  handAngles,
  polar,
} from "../src/app/clock.ts";
import { h } from "./fixtures/helpers.ts";

describe("angleOf", () => {
  it("puts three o'clock at 90° and wraps at twelve", () => {
    expect(angleOf(h(3))).toBe(90);
    expect(angleOf(h(15))).toBe(90);
    expect(angleOf(0)).toBe(0);
    expect(angleOf(h(12))).toBe(0);
  });
});

describe("handAngles", () => {
  it("places the hands for 09:30:15", () => {
    const a = handAngles(h(9, 30) + 15);
    expect(a.hour).toBeCloseTo(285.125, 3);
    expect(a.minute).toBeCloseTo(181.5, 3);
    expect(a.second).toBeCloseTo(90);
  });
});

describe("polar", () => {
  it("measures clockwise from twelve", () => {
    const [x, y] = polar(50, 50, 10, 90);
    expect(x).toBeCloseTo(60);
    expect(y).toBeCloseTo(50);
    const [tx, ty] = polar(50, 50, 10, 0);
    expect(tx).toBeCloseTo(50);
    expect(ty).toBeCloseTo(40);
  });
});

describe("arcPath", () => {
  it("is null for an empty span", () => {
    expect(arcPath(50, 50, 40, h(9), h(9))).toBeNull();
  });

  it("draws a short arc with the small-arc flag", () => {
    const d = arcPath(50, 50, 40, h(12), h(15))!;
    expect(d.startsWith("M 50 10 A 40 40 0 0 1 ")).toBe(true);
  });

  it("draws a long arc with the large-arc flag", () => {
    const d = arcPath(50, 50, 40, h(8), h(17))!;
    expect(d).toContain("A 40 40 0 1 1");
  });

  it("draws a whole ring for a span of a full turn or more", () => {
    const d = arcPath(50, 50, 40, 0, DIAL_SECONDS)!;
    expect(d.split("A")).toHaveLength(3);
  });
});

describe("framePath", () => {
  it("starts at the top edge's middle and closes back there", () => {
    const d = framePath(200, 100, 20)!;
    expect(d.startsWith("M 100 0 ")).toBe(true);
    expect(d.endsWith("L 100 0")).toBe(true);
    // Clockwise: the first move is along the top, to the right.
    expect(d).toContain("L 180 0");
  });

  it("insets the box so a stroke of that width sits inside it", () => {
    const d = framePath(200, 100, 20, 2)!;
    expect(d.startsWith("M 100 2 ")).toBe(true);
    expect(d).toContain("L 198 78");
  });

  it("clamps the radius to the box and refuses an empty one", () => {
    // A radius larger than half the short side is a stadium, not a bad path.
    expect(framePath(200, 100, 999)).toContain("A 50 50");
    expect(framePath(0, 100, 20)).toBeNull();
    expect(framePath(200, 4, 20, 2)).toBeNull();
  });
});
