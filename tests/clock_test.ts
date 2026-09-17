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
  beatTurns,
  easeInOutSine,
  easeOutBack,
  onBeat,
  secondGap,
  windDistance,
  windPlan,
  windTurns,
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

// ── Setting the watch ──

describe("windDistance", () => {
  it("is the way forward round the dial, never back", () => {
    expect(windDistance(h(9), h(10))).toBe(3600);
    // Left at eleven at night, read again at ten past midnight: the crown
    // only turns one way, so it is the long way round.
    expect(windDistance(h(23), h(0, 10))).toBe(h(1, 10));
    expect(windDistance(h(9), h(9))).toBe(0);
  });
});

describe("secondGap", () => {
  it("is at most one turn, because a second hand is synced not wound", () => {
    expect(secondGap(h(9) + 10, h(9) + 25)).toBe(90);
    expect(secondGap(h(9) + 50, h(9) + 5)).toBe(90);
    expect(secondGap(h(9), h(14))).toBe(0);
    for (const to of [h(9) + 1, h(12), h(23) + 59, h(3) + 17]) {
      const gap = secondGap(h(9) + 30, to);
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThan(360);
    }
  });
});

describe("windPlan", () => {
  it("is nothing at all when the time merely ticked", () => {
    expect(windPlan(h(9), h(9) + 1)).toBeNull();
    expect(windPlan(h(9), h(9) + 2)).toBeNull();
    expect(windPlan(h(9), h(9) + 3)).not.toBeNull();
  });

  it("turns the minute hand once an hour", () => {
    expect(windPlan(h(9), h(10))?.turns).toBe(1);
    expect(windPlan(h(9), h(17))?.turns).toBe(8);
    expect(windPlan(h(9), h(9, 30))?.turns).toBe(0.5);
  });

  it("winds longer for a longer sleep, but not without end", () => {
    const short = windPlan(h(9), h(10))!;
    const long = windPlan(h(9), h(13))!;
    const forever = windPlan(h(9), h(9) - 60)!; // very nearly a whole day
    expect(long.hands).toBeGreaterThan(short.hands);
    expect(forever.hands).toBe(3000);
    expect(short.hands).toBeGreaterThanOrEqual(900);
  });

  it("lets the second hand go for its share of a turn, after the rest", () => {
    const half = windPlan(h(9), h(10) + 30)!;
    expect(half.second).toBe(320);
    expect(half.total).toBe(half.hands + half.second);
    // Even a wind that starts and ends on the same second of the minute gets
    // a sync: the winding took a second or three and the hacked hand sat
    // through them.
    const whole = windPlan(h(9), h(10))!;
    expect(whole.second).toBe(240);
  });
});

describe("easeInOutSine", () => {
  it("starts and ends at rest, fastest in the middle", () => {
    expect(easeInOutSine(0)).toBe(0);
    expect(easeInOutSine(1)).toBe(1);
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10);
    // The speed is half a sine wave: nothing at either end, most in the
    // middle. Sampled as differences over the same small step.
    const step = 0.01;
    const speed = (t: number) => easeInOutSine(t + step) - easeInOutSine(t);
    expect(speed(0.5)).toBeGreaterThan(speed(0.2));
    expect(speed(0.2)).toBeGreaterThan(speed(0.02));
    expect(speed(0.5)).toBeGreaterThan(speed(0.8));
  });

  it("is clamped outside the run, so a late frame does not overshoot", () => {
    expect(easeInOutSine(-3)).toBe(0);
    expect(easeInOutSine(4)).toBe(1);
  });
});

/** Small enough to be a rounding error in the last digit of a rotation. */
const STILL = 1e-6;

describe("easeOutBack", () => {
  it("lands on the mark, having gone a little past it", () => {
    expect(easeOutBack(0)).toBe(0);
    expect(easeOutBack(1)).toBe(1);
    expect(easeOutBack(-1)).toBe(0);
    expect(easeOutBack(2)).toBe(1);
    const most = Math.max(
      ...Array.from({ length: 101 }, (_, i) => easeOutBack(i / 100)),
    );
    expect(most).toBeGreaterThan(1);
    expect(most).toBeLessThan(1.2);
  });
});

describe("onBeat", () => {
  it("rounds the moment down to the movement's beat", () => {
    // A quartz steps once a second, a calibre at 28 800 vph eight times, a
    // glide wheel not at all.
    expect(onBeat(10.9, 1)).toBe(10);
    expect(onBeat(10.9, 8)).toBe(10.875);
    expect(onBeat(10.9, null)).toBe(10.9);
    expect(onBeat(10.4, 8)).toBe(10.375);
  });

  it("is the clock rounded, not a count of beats, so it cannot drift", () => {
    // Whatever the loop's frame rate, the same moment is the same beat — a
    // late frame catches up rather than pushing the rate along.
    for (const beats of [1, 8]) {
      const gap = 1 / beats;
      for (const at of [0, 0.5, h(9) + 17.3, h(23, 59) + 59.99]) {
        const beat = onBeat(at, beats);
        expect(at - beat).toBeGreaterThanOrEqual(0);
        expect(at - beat).toBeLessThan(gap + 1e-9);
        // The beat sits on the rate's own grid.
        expect(Math.abs(beat * beats - Math.round(beat * beats))).toBeLessThan(
          1e-6,
        );
      }
    }
  });
});

describe("beatTurns", () => {
  it("steps the second hand and leaves the others exact", () => {
    const at = h(9, 30) + 15.9;
    for (const beats of [1, 8, null]) {
      const turns = beatTurns(at, beats);
      expect(turns.hour).toBe(handTurns(at).hour);
      expect(turns.minute).toBe(handTurns(at).minute);
    }
    // Well clear of the beat it just landed, the second hand is on it.
    expect(beatTurns(at, 1).second).toBe(handTurns(onBeat(at, 1)).second);
    expect(beatTurns(at, null).second).toBe(handTurns(at).second);
  });

  it("lands a step rather than arriving at it", () => {
    const beat = h(9) + 20;
    const step = beatTurns(beat - 0.001, 1).second;
    // Through the landing: past the beat before it, past the beat itself,
    // and settled on it after.
    const overshot = beatTurns(beat + 0.08, 1).second;
    expect(beatTurns(beat, 1).second).toBeCloseTo(step, 6);
    expect(overshot).toBeGreaterThan(handTurns(beat).second);
    expect(overshot - handTurns(beat).second).toBeLessThan(6 * 0.2);
    expect(beatTurns(beat + 0.2, 1).second).toBe(handTurns(beat).second);
    // A calibre's eighth of a second lands inside its own beat, so the hand
    // is still between beats rather than perpetually on its way to one.
    expect(beatTurns(beat + 0.1, 8).second).toBe(
      handTurns(onBeat(beat + 0.1, 8)).second,
    );
  });

  it("gives a mechanical eight beats a second, evenly", () => {
    // One second of the loop, sampled the way a screen would: eighty frames
    // over it, and eight places for the hand to be in.
    const start = h(9) + 20;
    const seen = new Set<number>();
    // Sampled just before each beat is due, so the hand is settled on the
    // one it is showing rather than mid-landing.
    for (let i = 0; i < 8; i++) {
      seen.add(beatTurns(start + (i + 0.95) / 8, 8).second);
    }
    expect(seen.size).toBe(8);
    const ordered = [...seen].sort((a, b) => a - b);
    for (let i = 1; i < ordered.length; i++) {
      // Six degrees a second over eight beats: three quarters of a degree.
      expect(ordered[i] - ordered[i - 1]).toBeCloseTo(0.75, 9);
    }
    // And a quartz stands still for most of its second, while a glide wheel
    // is somewhere new every frame.
    const quartz = new Set<number>();
    const glide = new Set<number>();
    for (let i = 0; i < 80; i++) {
      quartz.add(beatTurns(start + i / 80, 1).second);
      glide.add(beatTurns(start + i / 80, null).second);
    }
    // One place to rest in, plus the frames it spends landing there.
    expect(quartz.size).toBeLessThan(16);
    expect(glide.size).toBe(80);
  });
});

describe("windTurns", () => {
  const from = h(9, 30) + 15;
  const to = h(11, 47) + 5;
  const plan = windPlan(from, to)!;
  /** The wind as it really runs: the clock moves on while the crown turns,
   *  so a frame `elapsed` into it is that much later in the day too. */
  const at = (elapsed: number, beats: number | null = null) =>
    windTurns(from, to + elapsed / 1000, elapsed, plan, beats);

  it("starts where the hands already are", () => {
    const at = windTurns(from, to, 0, plan);
    const was = handTurns(from);
    expect(at.hour % 360).toBeCloseTo(was.hour % 360, 6);
    expect(at.minute % 360).toBeCloseTo(was.minute % 360, 6);
    expect(at.second % 360).toBeCloseTo(was.second % 360, 6);
  });

  it("ends on the time exactly, so the next ordinary frame does not move", () => {
    const landed = to + plan.total / 1000;
    for (const beats of [1, 8, null]) {
      expect(at(plan.total, beats)).toEqual(beatTurns(landed, beats));
    }
  });

  it("leaves the second hand alone until the hour and minute are set", () => {
    const stopped = handTurns(from).second % 360;
    for (const elapsed of [
      0,
      plan.hands * 0.3,
      plan.hands * 0.99,
      plan.hands,
    ]) {
      const at = windTurns(from, to, elapsed, plan);
      expect(at.second % 360).toBeCloseTo(stopped, 6);
    }
    // And only then does it go.
    const after = windTurns(from, to, plan.hands + plan.second / 2, plan);
    expect(after.second % 360).not.toBeCloseTo(stopped, 3);
  });

  it("keeps the hour and minute on time once set, while the second catches up", () => {
    const set = at(plan.hands);
    const later = at(plan.hands + plan.second / 2);
    // Set, and then simply keeping time: half a second of it, no more.
    expect(later.minute - set.minute).toBeCloseTo(
      plan.second / 2 / 1000 / 10,
      6,
    );
  });

  it("only ever goes forward, and the hour keeps a twelfth of the minute", () => {
    let last = at(0);
    for (let elapsed = 0; elapsed <= plan.total; elapsed += 16) {
      const frame = at(elapsed);
      // To the last digit of a rotation — `handStep` is what turns that
      // last digit into a hand that has not moved.
      expect(frame.hour).toBeGreaterThan(last.hour - STILL);
      expect(frame.minute).toBeGreaterThan(last.minute - STILL);
      expect(frame.second).toBeGreaterThan(last.second - STILL);
      last = frame;
    }
    const end = at(plan.total);
    expect(end.minute - at(0).minute).toBeCloseTo(
      (end.hour - at(0).hour) * 12,
      6,
    );
  });

  it("winds the minute hand a whole turn for every hour of it", () => {
    for (const [hours, turns] of [
      [1, 1],
      [4, 4],
      [8, 8],
    ] as const) {
      const start = h(9);
      const woke = start + h(hours);
      const one = windPlan(start, woke)!;
      const wound =
        windTurns(start, woke + one.hands / 1000, one.hands, one).minute -
        windTurns(start, woke, 0, one).minute;
      // A turn for each hour made up, plus the seconds the winding itself
      // took, which are seconds the hand has to make up as well.
      expect(wound).toBeCloseTo(turns * 360 + one.hands / 1000 / 10, 6);
    }
  });

  it("keeps the second hand hacked even over a whole number of minutes", () => {
    // Eight hours to the second: the gap between the two second hands is
    // nothing at all, and a hand that simply followed the live time would
    // tick round through the whole wind. It is the hands being set, not it.
    const start = h(9, 30) + 15;
    const woke = start + h(8);
    const eight = windPlan(start, woke)!;
    const held = windTurns(start, woke, 0, eight, 8).second;
    for (const elapsed of [1, eight.hands * 0.5, eight.hands]) {
      const frame = windTurns(start, woke + elapsed / 1000, elapsed, eight, 8);
      expect(frame.second).toBe(held);
    }
  });

  it("lands on the live time, not the time the wind was planned for", () => {
    // A wind that started at 11:47:05 and ran for a second and a bit ends on
    // 11:47:06-and-a-bit — the seconds it took are seconds it made up.
    const landed = to + plan.total / 1000;
    expect(at(plan.total).minute).toBeCloseTo(handTurns(landed).minute, 9);
  });
});
