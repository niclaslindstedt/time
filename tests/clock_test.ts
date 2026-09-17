// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DIAL_HOURS,
  DIAL_R,
  DIAL_SECONDS,
  ROMAN_HOURS,
  TRACK_R,
  angleOf,
  arcPath,
  dialLayout,
  handAngles,
  handTurns,
  polar,
  ringHit,
  timesAt,
} from "../src/app/clock.ts";
import {
  DIAL_FONT,
  DIAL_FONTS,
  DIAL_MARKERS,
  DIAL_MARKER_STYLES,
  DIAL_PLACEMENTS,
  DIAL_SCALE,
  DIAL_SCALES,
  ROMAN_WIDTH,
  isNumeral,
  type DialConfig,
} from "../src/app/look.ts";
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

describe("ROMAN_HOURS", () => {
  it("writes every hour the way Rome did", () => {
    expect([...ROMAN_HOURS]).toEqual([
      "XII",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
    ]);
  });

  it("is subtractive at four and nine, not IIII and VIIII", () => {
    expect(ROMAN_HOURS[4]).toBe("IV");
    expect(ROMAN_HOURS[9]).toBe("IX");
    expect(ROMAN_HOURS).not.toContain("IIII");
    expect(ROMAN_HOURS).not.toContain("VIIII");
  });

  it("has a numeral for each of the dial's hours", () => {
    expect(ROMAN_HOURS).toHaveLength(DIAL_HOURS.length);
    for (const hour of DIAL_HOURS) {
      expect(ROMAN_HOURS[hour % 12]).toMatch(/^[IVX]+$/);
    }
  });

  it("is at its widest at VIII, which is what widthFactor is set for", () => {
    const widest = [...ROMAN_HOURS].sort((a, b) => b.length - a.length)[0]!;
    expect(widest).toBe("VIII");
  });
});

describe("handTurns", () => {
  it("never wraps, so a transition always goes forward", () => {
    const a = handTurns(h(9, 30) + 15);
    expect(a.hour).toBeCloseTo(285.125, 3);
    expect(a.minute).toBeCloseTo(3421.5, 3);
    expect(a.second).toBeCloseTo(205_290);
    // 21:30:15 is the same dial position as 09:30:15, a full turn on.
    const b = handTurns(h(21, 30) + 15);
    expect(b.hour).toBeCloseTo(a.hour + 360, 3);
    expect(b.second).toBeGreaterThan(a.second);
  });

  it("agrees with handAngles once wrapped", () => {
    for (const at of [0, h(3), h(9, 30) + 15, h(23, 59) + 59]) {
      const turns = handTurns(at);
      const angles = handAngles(at);
      expect(turns.hour % 360).toBeCloseTo(angles.hour, 6);
      expect(turns.minute % 360).toBeCloseTo(angles.minute, 6);
      expect(turns.second % 360).toBeCloseTo(angles.second, 6);
    }
  });
});

describe("dialLayout", () => {
  const every: Pick<DialConfig, "placement" | "markers" | "font" | "scale">[] =
    [];
  for (const placement of DIAL_PLACEMENTS)
    for (const markers of DIAL_MARKER_STYLES)
      for (const font of DIAL_FONTS)
        for (const scale of DIAL_SCALES)
          every.push({ placement, markers, font, scale });

  /** Half the widest thing a style draws at a size, the way the layout
   *  measures it. */
  const reachOf = (
    dial: Pick<DialConfig, "markers" | "font">,
    size: number,
  ) => {
    const kinds = DIAL_HOURS.map((hour) =>
      DIAL_MARKERS[dial.markers].at(hour % 12),
    );
    const roman = kinds.includes("roman");
    const numerals = kinds.some(isNumeral);
    const share = numerals
      ? DIAL_FONT[dial.font].widthFactor * (roman ? ROMAN_WIDTH : 1)
      : 0.5;
    return size * share;
  };

  it("keeps every marker clear of the ring and on the face, whatever the dial", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const reach = reachOf(dial, l.numeralSize);
      const where = JSON.stringify(dial);
      const outer = l.markerR + reach;
      const inner = l.markerR - reach;
      // On the face, inside the minute track.
      expect(outer, `${where} runs off the face`).toBeLessThanOrEqual(
        TRACK_R - 4,
      );
      if (dial.placement === "inside") {
        expect(outer, `${where} runs into the ring`).toBeLessThanOrEqual(
          l.ringInner,
        );
        expect(inner, `${where} leaves no dial`).toBeGreaterThan(40);
      } else if (dial.placement === "outside") {
        expect(inner, `${where} runs into the ring`).toBeGreaterThanOrEqual(
          l.ringOuter,
        );
      } else {
        // Over the ring: centred on the band.
        expect(l.markerR).toBeCloseTo(l.bandR, 6);
      }
      // The ring itself is a ring, not a dot.
      expect(l.ringInner, `${where} has no ring`).toBeGreaterThan(50);
      expect(l.ringOuter).toBeLessThan(DIAL_R);
    }
  });

  it("stops the hands at the ring: minute on the band, second at its edge", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      expect(l.hands.minute).toBeCloseTo(l.bandR, 6);
      expect(l.hands.second).toBeCloseTo(l.ringOuter, 6);
      expect(l.hands.hour).toBeLessThan(l.hands.minute);
      expect(l.hands.hour).toBeGreaterThan(30);
    }
  });

  it("pulls the ring in to make room for markers outside it", () => {
    const base = { markers: "numerals", font: "grotesque", scale: 4 } as const;
    const inside = dialLayout({ ...base, placement: "inside" });
    const over = dialLayout({ ...base, placement: "over" });
    const outside = dialLayout({ ...base, placement: "outside" });
    // Over the ring, a marker this size wants a little room too — but far
    // less than a marker beside it.
    expect(over.ringOuter).toBeLessThanOrEqual(inside.ringOuter);
    expect(outside.ringOuter).toBeLessThan(over.ringOuter);
    expect(outside.markerR).toBeGreaterThan(outside.ringOuter);
    expect(inside.markerR).toBeLessThan(inside.ringInner);
  });

  it("grows the numerals step by step where there is room", () => {
    let last = 0;
    for (const scale of DIAL_SCALES) {
      const l = dialLayout({
        placement: "inside",
        markers: "numerals",
        font: "grotesque",
        scale,
      });
      expect(l.numeralSize).toBeGreaterThan(last);
      last = l.numeralSize;
    }
    expect(last).toBe(DIAL_SCALE[8] * DIAL_FONT.grotesque.scale);
  });

  it("sets a numeral smaller rather than let it run off the rim", () => {
    // VIII in the widest face, at the biggest step, over the ring: the size
    // the step asks for cannot fit, and the one drawn is what does.
    const l = dialLayout({
      placement: "over",
      markers: "roman",
      font: "inscribed",
      scale: 8,
    });
    expect(l.numeralSize).toBeLessThan(DIAL_SCALE[8]);
    const reach = reachOf(
      { markers: "roman", font: "inscribed" },
      l.numeralSize,
    );
    expect(l.markerR + reach).toBeLessThanOrEqual(TRACK_R - 4);
  });

  it("scales the applied markers with the step", () => {
    const small = dialLayout({
      placement: "inside",
      markers: "batons",
      font: "grotesque",
      scale: 1,
    });
    const large = dialLayout({
      placement: "inside",
      markers: "batons",
      font: "grotesque",
      scale: 8,
    });
    expect(large.markerLength).toBeGreaterThan(small.markerLength);
    expect(large.markerWidth).toBeGreaterThan(small.markerWidth);
  });
});

describe("timesAt", () => {
  it("is the inverse of angleOf, for the morning, the afternoon and the night", () => {
    const at = h(9) + 30 * 60;
    const times = timesAt(angleOf(at));
    expect(times).toEqual([at, at + DIAL_SECONDS, at + 2 * DIAL_SECONDS]);
    for (const t of times) expect(angleOf(t)).toBeCloseTo(angleOf(at), 6);
  });

  it("reads twelve o'clock as midnight, noon and the midnight after", () => {
    expect(timesAt(0)).toEqual([0, DIAL_SECONDS, 2 * DIAL_SECONDS]);
    expect(timesAt(360)).toEqual([0, DIAL_SECONDS, 2 * DIAL_SECONDS]);
  });

  it("wraps an angle from either side round the dial", () => {
    expect(timesAt(-90)).toEqual(timesAt(270));
    expect(timesAt(450)).toEqual(timesAt(90));
  });
});

describe("ringHit", () => {
  const layout = { ringInner: 90, ringOuter: 110 };

  it("finds the angle of a point on the band", () => {
    // Three o'clock: due right of the centre, on the band's centre line.
    expect(ringHit(DIAL_R + 100, DIAL_R, layout)).toBeCloseTo(90, 6);
    // Six o'clock, and nine.
    expect(ringHit(DIAL_R, DIAL_R + 100, layout)).toBeCloseTo(180, 6);
    expect(ringHit(DIAL_R - 100, DIAL_R, layout)).toBeCloseTo(270, 6);
    // Twelve is zero, not 360.
    expect(ringHit(DIAL_R, DIAL_R - 100, layout)).toBeCloseTo(0, 6);
  });

  it("agrees with polar about where a moment is drawn", () => {
    const at = h(14) + 20 * 60;
    const [x, y] = polar(DIAL_R, DIAL_R, 100, angleOf(at));
    expect(ringHit(x, y, layout)).toBeCloseTo(angleOf(at), 6);
  });

  it("is null at the centre, inside the ring and out on the bezel", () => {
    expect(ringHit(DIAL_R, DIAL_R, layout)).toBeNull();
    expect(ringHit(DIAL_R + 80, DIAL_R, layout)).toBeNull();
    expect(ringHit(DIAL_R + 116, DIAL_R, layout)).toBeNull();
  });

  it("gives a stroke's edge the slack it is asked for", () => {
    expect(ringHit(DIAL_R + 112, DIAL_R, layout)).toBeNull();
    expect(ringHit(DIAL_R + 112, DIAL_R, layout, 4)).toBeCloseTo(90, 6);
  });
});
