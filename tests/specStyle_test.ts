// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { PAPERS } from "../src/app/pdf/page.ts";
import { PDF_FONT_NAME } from "../src/app/pdf/metrics.ts";
import {
  DEFAULT_SPEC_PRESET,
  SPEC_ACCENT,
  SPEC_ACCENTS,
  SPEC_DENSITIES,
  SPEC_DENSITY,
  SPEC_DETAILS,
  SPEC_FIGURE_STYLES,
  SPEC_HEADERS,
  SPEC_PALETTE,
  SPEC_PRESET,
  SPEC_PRESETS,
  SPEC_SECTIONS,
  SPEC_TABLES,
  SPEC_TYPEFACE,
  SPEC_TYPEFACES,
  clampSpecStyle,
  resolveSpecStyle,
} from "../src/app/specStyle.ts";

// The specification's vocabulary, walked the way the dial's is: every id has
// a spec, every preset is made of ids that exist, and anything that comes
// back from storage is clamped to one of them.

describe("the specification's vocabulary", () => {
  it("offers five typefaces, five headings, eight colours, four tables and six styles", () => {
    expect(SPEC_TYPEFACES).toHaveLength(5);
    expect(SPEC_HEADERS).toHaveLength(5);
    expect(SPEC_ACCENTS).toHaveLength(8);
    expect(SPEC_TABLES).toHaveLength(4);
    expect(SPEC_DENSITIES).toHaveLength(3);
    expect(SPEC_DETAILS).toHaveLength(3);
    expect(SPEC_FIGURE_STYLES).toHaveLength(3);
    expect(SPEC_PRESETS).toHaveLength(6);
  });

  it("has a spec behind every id, and no id without one", () => {
    expect(Object.keys(SPEC_TYPEFACE).sort()).toEqual(
      [...SPEC_TYPEFACES].sort(),
    );
    expect(Object.keys(SPEC_ACCENT).sort()).toEqual([...SPEC_ACCENTS].sort());
    expect(Object.keys(SPEC_DENSITY).sort()).toEqual(
      [...SPEC_DENSITIES].sort(),
    );
    expect(Object.keys(SPEC_PRESET).sort()).toEqual([...SPEC_PRESETS].sort());
  });

  it("names a real face in every role of every typeface", () => {
    for (const id of SPEC_TYPEFACES) {
      for (const font of Object.values(SPEC_TYPEFACE[id])) {
        expect(PDF_FONT_NAME[font]).toBeTruthy();
      }
    }
  });

  it("is paper and ink, not the theme's tokens", () => {
    // A printed document has a colour of its own; a `var(--…)` here would be
    // a specification that went dark with the app.
    for (const colour of [
      ...Object.values(SPEC_ACCENT),
      ...Object.values(SPEC_PALETTE),
    ]) {
      expect(colour).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("gets quieter and roomier in step", () => {
    let last = SPEC_DENSITY.compact;
    for (const id of ["normal", "roomy"] as const) {
      const next = SPEC_DENSITY[id];
      expect(next.body).toBeGreaterThan(last.body);
      expect(next.row).toBeGreaterThan(last.row);
      expect(next.margin).toBeGreaterThan(last.margin);
      last = next;
    }
  });

  it("builds every preset out of ids that exist", () => {
    for (const id of SPEC_PRESETS) {
      const style = SPEC_PRESET[id];
      expect(SPEC_TYPEFACES).toContain(style.typeface);
      expect(SPEC_HEADERS).toContain(style.header);
      expect(SPEC_ACCENTS).toContain(style.accent);
      expect(SPEC_TABLES).toContain(style.table);
      expect(SPEC_DENSITIES).toContain(style.density);
      expect(SPEC_DETAILS).toContain(style.detail);
      expect(SPEC_FIGURE_STYLES).toContain(style.figures);
      expect(PAPERS).toContain(style.paper);
      expect(Object.keys(style.sections).sort()).toEqual(
        [...SPEC_SECTIONS].sort(),
      );
    }
  });

  it("shows the three grains of detail between them", () => {
    const grains = new Set(SPEC_PRESETS.map((id) => SPEC_PRESET[id].detail));
    expect([...grains].sort()).toEqual(["day", "entries", "period"]);
  });

  it("keeps the balance to the styles that ask for it", () => {
    // Target and balance are the worker's figures, not the client's; a
    // specification does not carry them unless it was asked to.
    expect(SPEC_PRESET.studio.sections.balance).toBe(false);
    expect(SPEC_PRESET.technical.sections.balance).toBe(true);
  });
});

describe("resolving a choice", () => {
  it("is the preset, or the custom style kept beside it", () => {
    const custom = { ...SPEC_PRESET.plain, accent: "plum" as const };
    expect(resolveSpecStyle("ledger", custom)).toEqual(SPEC_PRESET.ledger);
    expect(resolveSpecStyle("custom", custom)).toEqual(custom);
  });
});

describe("clamping what comes back from storage", () => {
  it("falls back to the default style for bytes that are not one", () => {
    expect(clampSpecStyle(null)).toEqual(SPEC_PRESET[DEFAULT_SPEC_PRESET]);
    expect(clampSpecStyle("nonsense")).toEqual(
      SPEC_PRESET[DEFAULT_SPEC_PRESET],
    );
  });

  it("keeps what it recognises and replaces what it does not", () => {
    const style = clampSpecStyle({
      typeface: "typewriter",
      header: "nope",
      accent: "plum",
      paper: "foolscap",
      detail: "entries",
      blanks: true,
      sections: { breaks: false, signature: "yes" },
    });
    expect(style.typeface).toBe("typewriter");
    expect(style.accent).toBe("plum");
    expect(style.detail).toBe("entries");
    expect(style.blanks).toBe(true);
    expect(style.sections.breaks).toBe(false);
    // Unrecognised values fall back to the default style's.
    const base = SPEC_PRESET[DEFAULT_SPEC_PRESET];
    expect(style.header).toBe(base.header);
    expect(style.paper).toBe(base.paper);
    expect(style.sections.signature).toBe(base.sections.signature);
  });

  it("is a round trip for every preset", () => {
    for (const id of SPEC_PRESETS) {
      expect(
        clampSpecStyle(JSON.parse(JSON.stringify(SPEC_PRESET[id]))),
      ).toEqual(SPEC_PRESET[id]);
    }
  });
});
