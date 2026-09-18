// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { en } from "../src/app/i18n/en.ts";
import {
  AUTO_CATEGORY_COLORS,
  CATEGORY_COLOR,
  CATEGORY_PALETTE,
  DEFAULT_BREAK_GLYPH,
  DEFAULT_CATEGORY_GLYPH,
  GLYPH,
  GLYPH_GROUPS,
  GLYPH_GROUPS_FOR,
  GLYPH_IDS,
  allowsGlyph,
  glyphFor,
  glyphsFor,
  glyphsIn,
  isCategoryColor,
  isGlyphId,
} from "../src/app/kinds.ts";
import {
  CATEGORY_COLORS,
  breakGlyph,
  categoryColor,
  categoryGlyph,
} from "../src/app/labels.ts";
import { project } from "./fixtures/helpers.ts";

describe("the glyph catalogue", () => {
  it("has a spec behind every id, and no id without one", () => {
    expect([...GLYPH_IDS].sort()).toEqual(Object.keys(GLYPH).sort());
    expect(new Set(GLYPH_IDS).size).toBe(GLYPH_IDS.length);
  });

  it("splits into the three vocabularies, with none left over", () => {
    const grouped = GLYPH_GROUPS.flatMap((g) => glyphsIn(g));
    expect([...grouped].sort()).toEqual([...GLYPH_IDS].sort());
    for (const group of GLYPH_GROUPS) {
      expect(glyphsIn(group).length).toBeGreaterThan(0);
    }
  });

  it("draws the toilet as a toilet, and keeps the drop as a drop", () => {
    // The break vocabulary has a mark for the trip itself — a cistern, a bowl
    // and a pedestal — rather than a drop standing in for one.
    expect(GLYPH.toilet.group).toBe("break");
    expect(GLYPH.toilet.d.length).toBeGreaterThan(1);
    expect(GLYPH.drop.group).toBe("break");
    expect(GLYPH.drop.d).not.toEqual(GLYPH.toilet.d);
  });

  it("leans on work, because that is what the app is used for", () => {
    expect(glyphsIn("work").length).toBeGreaterThan(glyphsIn("break").length);
  });

  it("draws every glyph from paths that start at a point", () => {
    for (const id of GLYPH_IDS) {
      const spec = GLYPH[id];
      expect(spec.d.length, id).toBeGreaterThan(0);
      for (const d of spec.d) {
        expect(d, id).toMatch(/^[Mm]/);
        // Paths are keyed by their own `d` when drawn, so two identical
        // paths in one glyph would collide.
        expect(
          spec.d.filter((other) => other === d),
          id,
        ).toHaveLength(1);
      }
    }
  });

  it("names every glyph, every colour and every group in the catalog", () => {
    for (const id of GLYPH_IDS) expect(en.kinds.glyph[id], id).toBeTruthy();
    for (const id of CATEGORY_PALETTE) {
      expect(en.kinds.palette[id], id).toBeTruthy();
    }
    for (const group of GLYPH_GROUPS) {
      expect(en.kinds.group[group], group).toBeTruthy();
    }
    // …and names nothing the catalogue has dropped.
    expect(Object.keys(en.kinds.glyph).sort()).toEqual([...GLYPH_IDS].sort());
  });

  it("knows its own ids and nothing else", () => {
    expect(isGlyphId(DEFAULT_BREAK_GLYPH)).toBe(true);
    expect(isGlyphId(DEFAULT_CATEGORY_GLYPH)).toBe(true);
    expect(isGlyphId("a-glyph-from-a-later-version")).toBe(false);
    expect(isGlyphId(undefined)).toBe(false);
    expect(isGlyphId(7)).toBe(false);
  });

  it("falls back rather than drawing a mark it does not have", () => {
    expect(glyphFor("coding", "category")).toBe("coding");
    expect(glyphFor(undefined, "category")).toBe(DEFAULT_CATEGORY_GLYPH);
    expect(glyphFor("nonsense", "break")).toBe(DEFAULT_BREAK_GLYPH);
  });

  it("keeps the two vocabularies apart, and shares the neutral marks", () => {
    expect(GLYPH_GROUPS_FOR.break).toEqual(["break", "mark"]);
    expect(GLYPH_GROUPS_FOR.category).toEqual(["work", "mark"]);

    // A break wears breaks and marks, never work's.
    for (const id of glyphsFor("break")) {
      expect(GLYPH[id].group, id).not.toBe("work");
    }
    // A kind of work wears work's and marks, never a break's.
    for (const id of glyphsFor("category")) {
      expect(GLYPH[id].group, id).not.toBe("break");
    }
    // Between them they still offer the whole catalogue.
    expect(
      [...new Set([...glyphsFor("break"), ...glyphsFor("category")])].sort(),
    ).toEqual([...GLYPH_IDS].sort());
  });

  it("refuses a mark from the other vocabulary", () => {
    expect(allowsGlyph("break", "coffee")).toBe(true);
    expect(allowsGlyph("break", "coding")).toBe(false);
    expect(allowsGlyph("category", "coding")).toBe(true);
    expect(allowsGlyph("category", "coffee")).toBe(false);
    // The neutral marks are both vocabularies'.
    expect(allowsGlyph("break", "dot")).toBe(true);
    expect(allowsGlyph("category", "dot")).toBe(true);
    expect(allowsGlyph("break", "nonsense")).toBe(false);
    expect(allowsGlyph("category", undefined)).toBe(false);
  });

  it("puts a kind wearing the other vocabulary's mark back on its own", () => {
    // What an older version could store, before the lists were kept apart.
    expect(glyphFor("coding", "break")).toBe(DEFAULT_BREAK_GLYPH);
    expect(glyphFor("coffee", "category")).toBe(DEFAULT_CATEGORY_GLYPH);
  });

  it("starts both sorts on a mark that sort may wear", () => {
    expect(allowsGlyph("break", DEFAULT_BREAK_GLYPH)).toBe(true);
    expect(allowsGlyph("category", DEFAULT_CATEGORY_GLYPH)).toBe(true);
  });
});

describe("the category palette", () => {
  it("has a token behind every colour, and no colour without one", () => {
    expect([...CATEGORY_PALETTE].sort()).toEqual(
      Object.keys(CATEGORY_COLOR).sort(),
    );
    expect(new Set(Object.values(CATEGORY_COLOR)).size).toBe(
      CATEGORY_PALETTE.length,
    );
  });

  it("is the theme's own tokens, never a fixed hue", () => {
    for (const id of CATEGORY_PALETTE) {
      expect(CATEGORY_COLOR[id], id).toMatch(/^var\(--[a-z]+\)$/);
    }
  });

  it("leaves the accent and the flag to the ring", () => {
    // Those two already mean "at work" and "break" on the clock; a kind of
    // work wearing either would read as the ring's own colour.
    const taken = Object.values(CATEGORY_COLOR);
    expect(taken).not.toContain("var(--accent)");
    expect(taken).not.toContain("var(--flag)");
  });

  it("opens with the four hues categories were always drawn in", () => {
    expect(AUTO_CATEGORY_COLORS).toEqual(["blue", "ocean", "violet", "amber"]);
  });

  it("knows its own ids and nothing else", () => {
    expect(isCategoryColor("violet")).toBe(true);
    expect(isCategoryColor("chartreuse")).toBe(false);
    expect(isCategoryColor(undefined)).toBe(false);
  });
});

describe("what a kind is drawn in", () => {
  it("gives a kind of work its own colour when it has one", () => {
    const p = project({
      categories: [
        { id: "meet", name: "Meetings", color: "rose" },
        { id: "code", name: "Coding" },
      ],
    });
    expect(categoryColor(p, "meet")).toBe(CATEGORY_COLOR.rose);
  });

  it("falls back to the hue the list's order gives it", () => {
    const p = project();
    expect(categoryColor(p, "meet")).toBe(CATEGORY_COLORS[0]);
    expect(categoryColor(p, "code")).toBe(CATEGORY_COLORS[1]);
  });

  it("keeps a chosen colour where the list's order would give another", () => {
    // The point of picking one: the second kind of work is not the second
    // hue any more, and reordering the list does not move it.
    const p = project({
      categories: [
        { id: "meet", name: "Meetings" },
        { id: "code", name: "Coding", color: "red" },
      ],
    });
    expect(categoryColor(p, "code")).toBe(CATEGORY_COLOR.red);
  });

  it("gives a deleted kind of work the slot after the last", () => {
    const p = project();
    expect(categoryColor(p, "gone")).toBe(CATEGORY_COLORS[2]);
  });

  it("gives a kind the mark it chose, or the one its sort starts with", () => {
    const p = project({
      breakTypes: [
        { id: "lunch", name: "Lunch", defaultMinutes: 30, glyph: "meal" },
        { id: "coffee", name: "Coffee", defaultMinutes: 15 },
      ],
      categories: [
        { id: "meet", name: "Meetings", glyph: "meeting" },
        { id: "code", name: "Coding" },
      ],
    });
    expect(breakGlyph(p, "lunch")).toBe("meal");
    expect(breakGlyph(p, "coffee")).toBe(DEFAULT_BREAK_GLYPH);
    expect(breakGlyph(p, "gone")).toBe(DEFAULT_BREAK_GLYPH);
    expect(categoryGlyph(p, "meet")).toBe("meeting");
    expect(categoryGlyph(p, "code")).toBe(DEFAULT_CATEGORY_GLYPH);
    expect(categoryGlyph(p, "gone")).toBe(DEFAULT_CATEGORY_GLYPH);
  });

  it("does not draw a kind in the other vocabulary's mark", () => {
    // A document written before the two lists were kept apart.
    const p = project({
      breakTypes: [
        { id: "lunch", name: "Lunch", defaultMinutes: 30, glyph: "coding" },
      ],
      categories: [{ id: "meet", name: "Meetings", glyph: "coffee" }],
    });
    expect(breakGlyph(p, "lunch")).toBe(DEFAULT_BREAK_GLYPH);
    expect(categoryGlyph(p, "meet")).toBe(DEFAULT_CATEGORY_GLYPH);
  });
});
