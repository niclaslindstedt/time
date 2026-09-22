// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The one thing about the Report's two rings that is not paint: how big the
// figure in the middle of a ring is set. The hole is a circle, so a figure
// that fits at one size need not fit at the next one up, and a balance pays
// for a sign and for however many digits of hours the range ran to.
import { describe, expect, it } from "vitest";

import { ringLabelClass } from "../src/app/RangeGlance.tsx";
import {
  formatBalance,
  formatDuration,
  formatPercent,
} from "../src/app/format.ts";

const h = (hours: number, minutes = 0) => hours * 3600 + minutes * 60;

describe("ringLabelClass", () => {
  it("leaves a share at full size", () => {
    expect(ringLabelClass(formatPercent(0.13))).toBe("text-sm");
    expect(ringLabelClass(formatPercent(1))).toBe("text-sm");
    expect(ringLabelClass(formatPercent(0))).toBe("text-sm");
  });

  it("brings a signed balance down off full size", () => {
    // The figure that sat with its minus on the band: seven characters, the
    // same count as "13% ok", and wider than the hole at full size.
    expect(ringLabelClass(formatBalance(-h(5, 52)))).not.toBe("text-sm");
    expect(ringLabelClass(formatBalance(-h(5, 52)))).toBe("text-[0.65rem]");
  });

  it("sets a balance the same size whichever way the range went", () => {
    expect(ringLabelClass(formatBalance(h(7, 9)))).toBe(
      ringLabelClass(formatBalance(-h(5, 52))),
    );
  });

  it("pays for the sign: an hour of shortfall is wider than the same hours worked", () => {
    // "−5h 52m" and "5h 52m" differ by one glyph, and that glyph is a whole
    // tabular slot — which is the difference the old character count missed.
    expect(ringLabelClass("5h 52m")).toBe("text-xs");
    expect(ringLabelClass(formatBalance(-h(5, 52)))).toBe("text-[0.65rem]");
  });

  it("comes down again for two digits of hours", () => {
    const week = ringLabelClass(formatBalance(-h(5)));
    const month = ringLabelClass(formatBalance(-h(40)));
    expect(month).not.toBe(week);
    expect(month).toBe("text-[0.6rem]");
  });

  it("has a floor rather than vanishing", () => {
    expect(ringLabelClass(formatBalance(-h(131, 59)))).toBe("text-[0.6rem]");
    expect(ringLabelClass(formatBalance(-h(9999)))).toBe("text-[0.6rem]");
  });

  it("keeps every figure either card can print inside the hole", () => {
    // The widths the sizes are chosen from, restated: whatever the two cards
    // can put in a ring has to come out narrower than the hole it goes in.
    const hole = (92 * (39 - 11 / 2)) / 100;
    const px: Record<string, number> = {
      "text-sm": 14,
      "text-xs": 12,
      "text-[0.65rem]": 10.4,
      "text-[0.6rem]": 9.6,
    };
    const em = (label: string) =>
      [...label].reduce(
        (a, c) =>
          a +
          (c === " "
            ? 0.269
            : c === "h"
              ? 0.623
              : c === "m"
                ? 0.913
                : c === "%"
                  ? 1.016
                  : 0.648),
        0,
      );
    const figures = [
      ...[0, 0.13, 0.61, 1, 3.75].map(formatPercent),
      ...[0, h(2, 7), h(9, 51), h(60)].map(formatDuration),
      ...[0, h(7, 9), -h(5, 52), -h(40), -h(131, 59)].map(formatBalance),
    ];
    for (const figure of figures) {
      const size = px[ringLabelClass(figure)]!;
      const chord = 2 * Math.sqrt(hole ** 2 - (0.365 * size) ** 2);
      expect({ figure, over: em(figure) * size > chord }).toEqual({
        figure,
        over: false,
      });
    }
  });
});
