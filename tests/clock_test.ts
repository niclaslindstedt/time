// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DAY_TRACK,
  DIAL_HOURS,
  DIAL_R,
  DIAL_SECONDS,
  ROMAN_HOURS,
  SIGNATURE,
  SIGNATURE_REACH,
  TRACK_R,
  angleOf,
  arcPath,
  chapterMarks,
  chapterTracks,
  dialLayout,
  faceMarks,
  MINUTE_INK,
  RING_BLEED,
  HANDS,
  handAngles,
  handPoint,
  handTurns,
  placementOf,
  polar,
  ringHit,
  timesAt,
  beatTurns,
  easeInOutSine,
  easeOutBack,
  onBeat,
  secondGap,
  windDistance,
  windMoment,
  windPlan,
  windTurns,
} from "../src/app/clock.ts";
import {
  DIAL_FONT,
  DIAL_FONTS,
  DIAL_MARKERS,
  DIAL_MARKER_STYLES,
  DIAL_PLACEMENTS,
  DIAL_HANDS,
  DIAL_HAND_SETS,
  DIAL_RING,
  DIAL_RINGS,
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

describe("handPoint", () => {
  const tapered = DIAL_HANDS.tapered;
  /** The hands of the dial the tapered set is on, at the lengths
   *  `dialLayout` gives them there. */
  const uptown = dialLayout({
    markers: "blocks",
    font: "light",
    scale: 7,
    placement: "inside",
    ring: "chapter",
  });

  it("closes the sides at the set's own bevel, whatever the hand", () => {
    for (const hand of ["hour", "minute"] as const) {
      const width = HANDS[hand];
      const run = handPoint(tapered, width, uptown.hands[hand]);
      // The angle off the axis is what was measured, so it is what has to
      // come back out: the sides drop from half the base to half the tip
      // over the run, and the arctangent of that is the bevel.
      const drop = (width * (tapered.base - tapered.tip)) / 2;
      expect((Math.atan(drop / run) * 180) / Math.PI, hand).toBeCloseTo(
        tapered.bevel,
        6,
      );
    }
  });

  it("gives the broader hand the longer point, and neither a spear", () => {
    const hour = handPoint(tapered, HANDS.hour, uptown.hands.hour);
    const minute = handPoint(tapered, HANDS.minute, uptown.hands.minute);
    // The hour hand is the broader of the two and the shorter, so it carries
    // the longer point and much the greater share of itself.
    expect(hour).toBeGreaterThan(minute);
    expect(hour / uptown.hands.hour).toBeGreaterThan(
      minute / uptown.hands.minute,
    );
    // And neither is the needle a share of the length gave them: the point
    // that reads as a spear is the one that runs back a tenth of the hand.
    expect(minute / uptown.hands.minute).toBeLessThan(0.1);
    expect(hour / uptown.hands.hour).toBeLessThan(0.1);
  });

  it("leaves a flat at the tip rather than a needle", () => {
    expect(tapered.tip).toBeGreaterThan(0);
    expect(tapered.tip).toBeLessThan(tapered.base);
  });

  it("is nothing at all for a set with no bevel, and never past the hand", () => {
    expect(handPoint(DIAL_HANDS.bar, HANDS.minute, 90)).toBe(0);
    for (const id of DIAL_HAND_SETS) {
      const set = DIAL_HANDS[id];
      // A hand as wide as it is long, or a bevel laid nearly flat, cannot
      // put the shoulder behind the axle.
      expect(handPoint(set, 40, 6), id).toBeLessThanOrEqual(6);
      expect(handPoint({ ...set, bevel: 1 }, 40, 6), id).toBeLessThanOrEqual(6);
    }
  });
});

describe("dialLayout", () => {
  type Dial = Pick<
    DialConfig,
    "placement" | "markers" | "font" | "scale" | "ring"
  >;
  const every: Dial[] = [];
  for (const placement of DIAL_PLACEMENTS)
    for (const markers of DIAL_MARKER_STYLES)
      for (const font of DIAL_FONTS)
        for (const scale of DIAL_SCALES)
          for (const ring of DIAL_RINGS)
            every.push({ placement, markers, font, scale, ring });

  /** How far the widest thing a style draws reaches either side of the
   *  marker's own radius, the way the layout measures it — half a numeral's
   *  width, or half the applied marker's length, which is what a style that
   *  runs its hours out to the ring stretches. */
  const reachOf = (
    dial: Pick<DialConfig, "markers" | "font">,
    l: ReturnType<typeof dialLayout>,
  ) => {
    const kinds = DIAL_HOURS.map((hour) =>
      DIAL_MARKERS[dial.markers].at(hour % 12),
    );
    const roman = kinds.includes("roman");
    const numerals = kinds.some(isNumeral);
    return numerals
      ? l.numeralSize *
          DIAL_FONT[dial.font].widthFactor *
          (roman ? ROMAN_WIDTH : 1)
      : l.markerLength / 2;
  };

  it("keeps every marker clear of the ring and on the face, whatever the dial", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const reach = reachOf(dial, l);
      const where = JSON.stringify(dial);
      const outer = l.markerR + reach;
      const inner = l.markerR - reach;
      // On the face: inside the minute track where the style prints one on
      // the rim, and inside the day's own track where it does not — a style
      // with nothing to put in its rim has its ring out at the day's edge,
      // and its markers out with it.
      expect(outer, `${where} runs off the face`).toBeLessThanOrEqual(
        DIAL_MARKERS[dial.markers].minuteTrack ? TRACK_R - 4 : DAY_TRACK.inner,
      );
      if (placementOf(dial) === "inside") {
        if (DIAL_MARKERS[dial.markers].reachesRing) {
          // These hours are meant to meet the ring: on its inner edge, not
          // short of it and not over it.
          expect(outer, `${where} does not reach the ring`).toBeCloseTo(
            l.ringInner,
            6,
          );
        } else {
          expect(outer, `${where} runs into the ring`).toBeLessThanOrEqual(
            l.ringInner,
          );
        }
        expect(inner, `${where} leaves no dial`).toBeGreaterThan(40);
      } else if (placementOf(dial) === "outside") {
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

  it("keeps the printing — the name, the word and the window — inside the ring on every dial", () => {
    // The reach is the further of the two ends: the top of the name under
    // twelve, and the foot of the window above six.
    expect(SIGNATURE_REACH).toBe(
      Math.max(
        SIGNATURE.name + SIGNATURE.nameSize / 2,
        SIGNATURE.window + SIGNATURE.windowHeight / 2,
      ),
    );
    for (const dial of every) {
      const l = dialLayout(dial);
      const where = JSON.stringify(dial);
      expect(l.ringInner, `${where} prints over the ring`).toBeGreaterThan(
        SIGNATURE_REACH,
      );
      // Inside the ring the markers hang under it at twelve; the name has
      // to clear them too, on every size.
      if (placementOf(dial) === "inside") {
        const reach = reachOf(dial, l);
        expect(
          l.markerR - reach,
          `${where} prints over twelve`,
        ).toBeGreaterThan(SIGNATURE.name + SIGNATURE.nameSize / 2);
      }
    }
    // The word sits between the name and the centre, the window below it.
    expect(SIGNATURE.line + SIGNATURE.lineSize / 2).toBeLessThan(
      SIGNATURE.name - SIGNATURE.nameSize / 2,
    );
    expect(SIGNATURE.window - SIGNATURE.windowHeight / 2).toBeGreaterThan(20);
  });

  it("prints a chapter ring's ticks inside it, and the face's under it", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const tracks = chapterTracks(l.ringInner);
      const where = JSON.stringify(dial);
      // The ring's own ticks stand on its inner edge and stay on the ring.
      expect(
        tracks.ring.inner,
        `${where}: the ring's ticks start inside the ring`,
      ).toBeGreaterThanOrEqual(l.ringInner);
      expect(
        tracks.ring.outer,
        `${where}: the ring's ticks run off the ring`,
      ).toBeLessThan(l.ringOuter);
      // The face's hang under it, on the face, and never touch it.
      expect(
        tracks.face.outer,
        `${where}: the face's track is on the ring`,
      ).toBeLessThan(l.ringInner);
      expect(tracks.face.inner).toBeLessThan(tracks.face.outer);
      // The two halves of the one track are the same length, so the ring's
      // edge runs through the middle of a minute rather than between two.
      expect(
        tracks.face.outer - tracks.face.inner,
        `${where}: the face's minutes are not the ring's length`,
      ).toBeCloseTo(tracks.ring.outer - tracks.ring.inner, 6);
      // And the thirds of a minute hang from the same edge, not half as far.
      expect(tracks.fine.outer).toBeCloseTo(tracks.face.outer, 6);
      expect(tracks.fine.inner).toBeGreaterThan(tracks.face.inner);
      expect(tracks.fine.outer - tracks.fine.inner).toBeLessThan(
        (tracks.face.outer - tracks.face.inner) / 2,
      );
      // And where the markers are inside the ring and stop short of it, the
      // track stops short of them too: a tick that reached a marker would
      // foul the largest hour size. The hours that run out to the ring are
      // the exception — they cross the track, which is what puts them
      // against the ring rather than against a row of stray ticks.
      if (
        placementOf(dial) === "inside" &&
        !DIAL_MARKERS[dial.markers].reachesRing
      ) {
        expect(
          tracks.face.inner,
          `${where}: the face's track runs into the markers`,
        ).toBeGreaterThan(l.markerR + reachOf(dial, l));
      }
    }
  });

  it("stops the hands at whatever the dial is read against", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const tracks = chapterTracks(l.ringInner);
      const where = JSON.stringify(dial);
      if (DIAL_RING[dial.ring].printed) {
        // Read against the print: the minute hand crosses the tips of the
        // track under the ring and stops there, and the second hand goes on
        // to the ring and stops a hair onto the near end of its ticks —
        // touching the mark it points at without lying along it, and nowhere
        // near the ring's outer edge.
        expect(l.hands.minute, where).toBeGreaterThan(tracks.face.inner);
        expect(l.hands.minute, where).toBeLessThan(tracks.face.outer);
        expect(l.hands.second, where).toBeGreaterThan(tracks.ring.inner);
        expect(l.hands.second, where).toBeLessThan(
          tracks.ring.inner + (tracks.ring.outer - tracks.ring.inner) / 4,
        );
      } else {
        expect(l.hands.minute, where).toBeCloseTo(l.bandR, 6);
        expect(l.hands.second, where).toBeCloseTo(l.ringOuter, 6);
      }
      // Either way the second hand reaches past the minute hand, and the
      // hour hand is well short of both.
      expect(l.hands.second, where).toBeGreaterThan(l.hands.minute);
      expect(l.hands.hour, where).toBeLessThan(l.hands.minute);
      expect(l.hands.hour, where).toBeGreaterThan(30);
    }
  });

  it("puts the hours inside a printed ring, whatever the placement says", () => {
    // A chapter ring is the scale the hours are read against, and a scale is
    // read from the outside in: over it, every hour would land on one of the
    // numerals, and outside it the watch would read inside out.
    const base = {
      markers: "batons",
      font: "grotesque",
      scale: 4,
    } as const;
    const inside = dialLayout({
      ...base,
      placement: "inside",
      ring: "chapter",
    });
    for (const placement of DIAL_PLACEMENTS) {
      const dial = { ...base, placement, ring: "chapter" } as const;
      expect(placementOf(dial), placement).toBe("inside");
      // And the layout follows, rather than the override being cosmetic.
      expect(dialLayout(dial)).toEqual(inside);
    }
    // A groove is only a track, so it takes the hours where they were put.
    for (const placement of DIAL_PLACEMENTS) {
      expect(placementOf({ placement, ring: "groove" })).toBe(placement);
    }
  });

  it("keeps a placement it is not using, so a ring swapped back is the dial it was", () => {
    // The override is read at layout time and nothing rewrites the setting.
    const dial = {
      ...{ markers: "batons", font: "grotesque", scale: 4 },
      placement: "outside",
    } as const;
    expect(placementOf({ ...dial, ring: "chapter" })).toBe("inside");
    expect(placementOf({ ...dial, ring: "groove" })).toBe("outside");
  });

  it("pulls the ring in to make room for markers outside it", () => {
    const base = {
      markers: "numerals",
      font: "grotesque",
      scale: 4,
      ring: "groove",
    } as const;
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
        ring: "groove",
      });
      expect(l.numeralSize).toBeGreaterThan(last);
      last = l.numeralSize;
    }
    // The top of the scale asks for more than a dial with the day's own
    // track outside the markers has to give, so what is drawn there is what
    // the room allows — most of what was asked, and the same for every dial
    // that reaches it.
    const wanted = DIAL_SCALE[8] * DIAL_FONT.grotesque.scale;
    expect(last).toBeLessThanOrEqual(wanted);
    expect(last).toBeGreaterThan(wanted * 0.85);
  });

  it("sets a numeral smaller rather than let it run off the face", () => {
    // VIII in the widest face, at the biggest step, over the ring: the size
    // the step asks for cannot fit, and the one drawn is what does. Roman
    // prints no track on the rim, so what it has to stay clear of is the
    // day's own track.
    const l = dialLayout({
      placement: "over",
      markers: "roman",
      font: "inscribed",
      scale: 8,
      ring: "groove",
    });
    expect(l.numeralSize).toBeLessThan(DIAL_SCALE[8]);
    const reach = reachOf({ markers: "roman", font: "inscribed" }, l);
    expect(l.markerR + reach).toBeLessThanOrEqual(DAY_TRACK.inner);
  });

  it("runs a dress dial's blocks out to the ring, and finishes them with a plot on it", () => {
    for (const scale of DIAL_SCALES) {
      const dial = {
        placement: "inside",
        markers: "blocks",
        font: "light",
        scale,
        ring: "chapter",
      } as const;
      const l = dialLayout(dial);
      // A plain marker of the same size to measure against: wedges rather
      // than batons, because a style that prints a track on the rim is laid
      // out against a rim and this one is not — the two would be measured
      // from different rings.
      const plain = dialLayout({ ...dial, markers: "wedges" });
      // The block ends on the ring's inner edge — where the plain marker of
      // the same size stops short of it, by the air a marker is given. The
      // ring is painted to exactly that radius on its inner side, so the two
      // meet rather than the hour lapping onto the ring.
      expect(l.markerR + l.markerLength / 2).toBeCloseTo(l.ringInner, 6);
      expect(RING_BLEED).toBeGreaterThan(0);
      expect(plain.markerR + plain.markerLength / 2).toBeLessThan(
        l.ringInner - 1,
      );
      // What it gives back it gives back at the inner end: the outer end is
      // the one that has to meet the ring, so the hour starts further out
      // than the baton of the same size would have, not shorter of the ring.
      const run = l.ringInner - (plain.markerR - plain.markerLength / 2);
      expect(l.markerLength).toBeLessThan(run);
      expect(l.markerLength).toBeGreaterThan(run * 0.7);
      expect(l.markerR - l.markerLength / 2).toBeGreaterThan(
        plain.markerR - plain.markerLength / 2,
      );
      // And it is a block rather than a baton: half as wide again, which is
      // the whole of what the two words mean on a dial.
      expect(l.markerWidth).toBeCloseTo(
        plain.markerWidth * DIAL_MARKERS.blocks.width,
        6,
      );
      expect(DIAL_MARKERS.blocks.width).toBeGreaterThan(1);
      // And it crosses the face's track on the way, which is the stray tick
      // the arrangement is rid of.
      expect(l.markerR + l.markerLength / 2).toBeGreaterThan(
        chapterTracks(l.ringInner).face.outer,
      );
      // The plot sits on the ring, in the room the ring's own ticks take —
      // which at an hour is room the minutes are not using, because every
      // hour is a place the chapter ring prints a numeral.
      const track = chapterTracks(l.ringInner).ring;
      expect(l.pip).not.toBeNull();
      const pip = l.pip;
      if (!pip) throw new Error("no plot");
      // Centred on the ticks' own track, so the two read as one row.
      expect(pip.r).toBeCloseTo((track.inner + track.outer) / 2, 6);
      // A block rather than a dot: shorter along the radius than the tick it
      // stands in the place of, and well over twice as wide across it.
      const tick = track.outer - track.inner;
      expect(pip.length).toBeLessThan(tick);
      expect(pip.length).toBeGreaterThan(tick * 0.75);
      expect(pip.width).toBeGreaterThan(MINUTE_INK * 2);
      expect(pip.width).toBeLessThan(pip.length);
      // And it stays on the ring, both ends.
      expect(pip.r - pip.length / 2).toBeGreaterThanOrEqual(l.ringInner);
      expect(pip.r + pip.length / 2).toBeLessThan(l.ringOuter);
      expect(
        chapterMarks().filter((m) => m.kind === "tick" && m.angle % 30 === 0),
      ).toHaveLength(0);
    }
  });

  it("leaves the hours where they were on every other dial, and outside the ring", () => {
    for (const dial of every) {
      const l = dialLayout(dial);
      const reaches =
        DIAL_MARKERS[dial.markers].reachesRing &&
        placementOf(dial) === "inside";
      // Only a reaching style inside the ring has a plot; nothing else grows
      // one, and a block placed over or outside the ring has no gap to close.
      expect(l.pip === null, JSON.stringify(dial)).toBe(!reaches);
      if (DIAL_MARKERS[dial.markers].reachesRing && !reaches) {
        expect(l.markerLength).toBeCloseTo(
          dialLayout({ ...dial, markers: "batons" }).markerLength,
          6,
        );
      }
    }
  });

  it("scales the applied markers with the step", () => {
    const small = dialLayout({
      placement: "inside",
      markers: "batons",
      font: "grotesque",
      scale: 1,
      ring: "groove",
    });
    const large = dialLayout({
      placement: "inside",
      markers: "batons",
      font: "grotesque",
      scale: 8,
      ring: "groove",
    });
    expect(large.markerLength).toBeGreaterThan(small.markerLength);
    expect(large.markerWidth).toBeGreaterThan(small.markerWidth);
  });
});

describe("chapterMarks", () => {
  const marks = chapterMarks();

  it("prints sixty marks: a numeral every five minutes, a tick between", () => {
    expect(marks).toHaveLength(60);
    const numerals = marks.filter((m) => m.kind === "numeral");
    expect(numerals).toHaveLength(12);
    expect(numerals.map((m) => m.label)).toEqual([
      "60",
      "05",
      "10",
      "15",
      "20",
      "25",
      "30",
      "35",
      "40",
      "45",
      "50",
      "55",
    ]);
    expect(marks.filter((m) => m.kind === "tick")).toHaveLength(48);
  });

  it("lays a mark at every six degrees, clockwise from twelve", () => {
    marks.forEach((m, i) => expect(m.angle).toBe(i * 6));
  });

  it("turns a numeral along the ring, and the lower half the other way up", () => {
    const at = (minute: number) => {
      const m = marks.find((x) => x.kind === "numeral" && x.minute === minute);
      if (!m || m.kind !== "numeral")
        throw new Error(`no numeral at ${minute}`);
      return m.turn;
    };
    expect(at(60)).toBe(0);
    expect(at(5)).toBe(30);
    expect(at(15)).toBe(90);
    // Past three the numerals would hang upside down, so they are flipped.
    expect(at(20)).toBe(300);
    expect(at(30)).toBe(0);
    expect(at(40)).toBe(60);
    // And right again from nine.
    expect(at(45)).toBe(270);
    expect(at(55)).toBe(330);
  });
});

describe("faceMarks", () => {
  const marks = faceMarks();
  const minutes = marks.filter((m) => m.minute);
  const thirds = marks.filter((m) => !m.minute);
  /** The finer marks in the gap that runs from `minute` to the next. */
  const between = (minute: number) =>
    thirds
      .map((m) => m.angle)
      .filter((a) => a > minute * 6 && a < minute * 6 + 6)
      .map((a) => a - minute * 6);

  it("divides a minute into thirds, and counts only the minutes", () => {
    expect(minutes).toHaveLength(60);
    expect(minutes.map((m) => m.angle)).toEqual(
      chapterMarks().map((m) => m.angle),
    );
    // Two thirds in a gap between two plain minutes, all the way round.
    for (const minute of [1, 2, 3, 16, 17, 43, 57]) {
      expect(between(minute), `minute ${minute}`).toEqual([2, 4]);
    }
  });

  it("drops the third an hour's marker stands over", () => {
    // Beside an hour, one mark rather than two — and it is the far one, so
    // the rhythm of thirds carries on through the gap rather than shifting.
    expect(between(4)).toEqual([2]);
    expect(between(5)).toEqual([4]);
    expect(between(29)).toEqual([2]);
    expect(between(30)).toEqual([4]);
  });

  it("leaves the gaps either side of twelve bare", () => {
    // Twelve carries the widest hour of every marker style, and stands over
    // both thirds rather than one.
    expect(between(0)).toEqual([]);
    expect(between(59)).toEqual([]);
    // The minute at twelve itself stays: the track meets it squarely.
    expect(minutes.map((m) => m.angle)).toContain(0);
  });

  it("lays them in order, clockwise from twelve, within one turn", () => {
    const angles = marks.map((m) => m.angle);
    expect(angles).toEqual([...angles].sort((a, b) => a - b));
    expect(Math.min(...angles)).toBe(0);
    expect(Math.max(...angles)).toBeLessThan(360);
    // 120 thirds, less the one each of the eleven plain hours stands over on
    // either side, less both of twelve's two gaps.
    expect(thirds).toHaveLength(120 - 11 * 2 - 4);
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
  const track = { inner: 90, outer: 110 };

  it("finds the angle of a point on the band", () => {
    // Three o'clock: due right of the centre, on the band's centre line.
    expect(ringHit(DIAL_R + 100, DIAL_R, track)).toBeCloseTo(90, 6);
    // Six o'clock, and nine.
    expect(ringHit(DIAL_R, DIAL_R + 100, track)).toBeCloseTo(180, 6);
    expect(ringHit(DIAL_R - 100, DIAL_R, track)).toBeCloseTo(270, 6);
    // Twelve is zero, not 360.
    expect(ringHit(DIAL_R, DIAL_R - 100, track)).toBeCloseTo(0, 6);
  });

  it("agrees with polar about where a moment is drawn", () => {
    const at = h(14) + 20 * 60;
    const [x, y] = polar(DIAL_R, DIAL_R, 100, angleOf(at));
    expect(ringHit(x, y, track)).toBeCloseTo(angleOf(at), 6);
  });

  it("is null at the centre, inside the ring and out on the bezel", () => {
    expect(ringHit(DIAL_R, DIAL_R, track)).toBeNull();
    expect(ringHit(DIAL_R + 80, DIAL_R, track)).toBeNull();
    expect(ringHit(DIAL_R + 116, DIAL_R, track)).toBeNull();
  });

  it("gives a stroke's edge the slack it is asked for", () => {
    expect(ringHit(DIAL_R + 112, DIAL_R, track)).toBeNull();
    expect(ringHit(DIAL_R + 112, DIAL_R, track, 4)).toBeCloseTo(90, 6);
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

/** How far apart two rotations are on the dial, in degrees: a hand does not
 *  care how many turns it has taken to get where it is. */
const apart = (a: number, b: number): number => {
  const d = (((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
};

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

describe("windMoment", () => {
  const from = h(9, 30) + 15;
  const to = h(11, 47) + 5;
  const plan = windPlan(from, to)!;
  /** The wind as it really runs: the clock moves on while the crown turns,
   *  so a frame `elapsed` into it is that much later in the day too. */
  const at = (elapsed: number) =>
    windMoment(from, to + elapsed / 1000, elapsed, plan);

  it("starts at the moment the dial was left at", () => {
    expect(windMoment(from, to, 0, plan)).toBeCloseTo(from, 6);
  });

  it("ends on the live moment, so the day is whole when the hands stop", () => {
    expect(at(plan.total)).toBeCloseTo(to + plan.total / 1000, 6);
  });

  it("is on the time already while the second hand catches up", () => {
    // The hour and minute are set at `plan.hands`; everything after that is
    // the second hand, and the dial is simply keeping time.
    expect(at(plan.hands)).toBeCloseTo(to + plan.hands / 1000, 6);
    const later = plan.hands + plan.second / 2;
    expect(at(later)).toBeCloseTo(to + later / 1000, 6);
  });

  it("only ever goes forward — the day fills in, it does not un-fill", () => {
    let last = at(0);
    for (let elapsed = 0; elapsed <= plan.total; elapsed += 16) {
      const moment = at(elapsed);
      expect(moment).toBeGreaterThanOrEqual(last);
      last = moment;
    }
  });

  it("eases like the crown: slow at both ends, fastest in the middle", () => {
    // Half way through the winding is exactly half the distance made up —
    // the distance being to where the dial will be when the crown stops,
    // which is the second or two the winding itself costs further on...
    const half = from + windDistance(from, to + plan.hands / 1000) / 2;
    expect(at(plan.hands / 2)).toBeCloseTo(half, 6);
    // ...but the first tenth of the wind is nothing like a tenth of it.
    expect(at(plan.hands * 0.1) - at(0)).toBeLessThan(
      at(plan.hands * 0.6) - at(plan.hands * 0.5),
    );
  });

  it("is what the hour and the minute hand are drawn at", () => {
    // The two are one thing: the hands are this moment, and so is the day on
    // the ring — which is what keeps the colour under the hand that is
    // laying it down.
    for (const elapsed of [0, 120, plan.hands / 2, plan.hands, plan.total]) {
      const hands = windTurns(from, to + elapsed / 1000, elapsed, plan);
      const drawn = handTurns(at(elapsed));
      expect(apart(hands.hour, drawn.hour)).toBeCloseTo(0, 6);
      expect(apart(hands.minute, drawn.minute)).toBeCloseTo(0, 6);
    }
  });

  it("goes the long way round past midnight, the way the crown does", () => {
    // Left at eleven at night, read again at ten past twelve: the dial winds
    // forward through midnight rather than back over the evening, so every
    // moment it passes is later than the one before it.
    const night = h(23);
    const morning = h(0, 10);
    const over = windPlan(night, morning)!;
    let last = windMoment(night, morning, 0, over);
    expect(last).toBeCloseTo(night - 86_400, 6);
    for (let elapsed = 0; elapsed <= over.total; elapsed += 16) {
      const moment = windMoment(night, morning + elapsed / 1000, elapsed, over);
      expect(moment).toBeGreaterThanOrEqual(last);
      last = moment;
    }
    const landed = windMoment(
      night,
      morning + over.total / 1000,
      over.total,
      over,
    );
    expect(landed).toBeGreaterThanOrEqual(last);
    expect(landed).toBeCloseTo(morning + over.total / 1000, 6);
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
