// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DIAL_SECONDS,
  angleOf,
  arcPath,
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
