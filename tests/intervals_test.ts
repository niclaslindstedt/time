// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  contains,
  intersect,
  subtract,
  total,
  union,
} from "../src/app/intervals.ts";

describe("union", () => {
  it("merges overlapping and touching intervals", () => {
    expect(
      union([
        { start: 10, end: 20 },
        { start: 15, end: 30 },
        { start: 30, end: 40 },
        { start: 50, end: 60 },
      ]),
    ).toEqual([
      { start: 10, end: 40 },
      { start: 50, end: 60 },
    ]);
  });

  it("drops empty and inverted intervals", () => {
    expect(
      union([
        { start: 5, end: 5 },
        { start: 9, end: 2 },
      ]),
    ).toEqual([]);
  });
});

describe("intersect", () => {
  it("keeps only the overlap", () => {
    expect(
      intersect(
        [{ start: 0, end: 100 }],
        [
          { start: 10, end: 20 },
          { start: 90, end: 120 },
        ],
      ),
    ).toEqual([
      { start: 10, end: 20 },
      { start: 90, end: 100 },
    ]);
  });
});

describe("subtract", () => {
  it("carves holes out of a stretch", () => {
    expect(
      subtract(
        [{ start: 0, end: 100 }],
        [
          { start: 10, end: 20 },
          { start: 50, end: 60 },
        ],
      ),
    ).toEqual([
      { start: 0, end: 10 },
      { start: 20, end: 50 },
      { start: 60, end: 100 },
    ]);
  });

  it("ignores holes outside the stretch", () => {
    expect(
      subtract([{ start: 10, end: 20 }], [{ start: 30, end: 40 }]),
    ).toEqual([{ start: 10, end: 20 }]);
  });

  it("removes everything when the hole covers it", () => {
    expect(subtract([{ start: 10, end: 20 }], [{ start: 0, end: 50 }])).toEqual(
      [],
    );
  });
});

describe("total and contains", () => {
  it("adds lengths and finds a moment", () => {
    const set = [
      { start: 0, end: 10 },
      { start: 20, end: 25 },
    ];
    expect(total(set)).toBe(15);
    expect(contains(set, 22)).toBe(true);
    expect(contains(set, 10)).toBe(false);
  });
});
