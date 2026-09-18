// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { normalizeDoc, parseDoc, serializeDoc } from "../src/app/migrations.ts";
import { DOC_VERSION, dayKey, emptyDoc } from "../src/app/types.ts";
import { day, project } from "./fixtures/helpers.ts";

describe("parseDoc", () => {
  it("round-trips a document", () => {
    const doc = emptyDoc();
    // Marked, because a kind with no mark of its own is given the app's on
    // the way back in — what this pins is that a *marked* document survives
    // the trip unchanged.
    doc.projects.acme = project({
      breakTypes: [
        { id: "lunch", name: "Lunch", defaultMinutes: 30, glyph: "meal" },
        { id: "coffee", name: "Coffee", defaultMinutes: 15, glyph: "coffee" },
      ],
      categories: [
        { id: "meet", name: "Meetings", glyph: "meeting" },
        { id: "code", name: "Coding", glyph: "coding" },
      ],
    });
    const d = day("2026-03-02", {
      sessions: [{ id: "s", start: 100, end: null }],
      breaks: [{ id: "b", typeId: "lunch", start: 200, end: 300 }],
      activities: [{ id: "a", categoryId: "code", start: 100, end: 400 }],
    });
    doc.days[dayKey("acme", "2026-03-02")] = d;
    expect(parseDoc(serializeDoc(doc))).toEqual(doc);
  });

  it("throws on bytes that are not JSON", () => {
    expect(() => parseDoc("{nope")).toThrow();
  });

  it("boots empty from a value that is not a document", () => {
    expect(normalizeDoc(null)).toEqual(emptyDoc());
    expect(normalizeDoc([1, 2])).toEqual(emptyDoc());
  });

  it("refuses a document from a newer build rather than emptying it", () => {
    // The store quarantines what it cannot read (see `useDocStore.ts`); a
    // blank document written over a newer one would be the real data loss.
    expect(() => normalizeDoc({ version: 99 })).toThrow();
  });

  it("stamps an unversioned document with the current version", () => {
    expect(normalizeDoc({ projects: {}, days: {} }).version).toBe(DOC_VERSION);
  });
});

describe("v1 → v2: employers became projects", () => {
  const v1 = {
    version: 1,
    employers: {
      acme: {
        id: "acme",
        name: "Acme",
        hoursPerDay: 8,
        workDays: [1, 2, 3, 4, 5],
        breakTypes: [{ id: "lunch", name: "Lunch", defaultMinutes: 30 }],
        categories: [{ id: "code", name: "Coding" }],
      },
    },
    days: {
      "2026-03-02:acme": {
        date: "2026-03-02",
        employerId: "acme",
        sessions: [{ id: "s", start: 100, end: 400 }],
        breaks: [],
        activities: [],
      },
    },
  };

  it("carries the employers over as projects, ids intact", () => {
    const doc = normalizeDoc(v1);
    expect(doc.version).toBe(DOC_VERSION);
    expect(Object.keys(doc.projects)).toEqual(["acme"]);
    expect(doc.projects.acme!.name).toBe("Acme");
    expect(doc.projects.acme!.categories).toEqual([
      { id: "code", name: "Coding" },
    ]);
  });

  it("points each day at its project, under the same key", () => {
    const doc = normalizeDoc(v1);
    // The key is `date:id` and the id did not change, so a day that was
    // already filed stays where it was — the rename moves no day.
    const d = doc.days[dayKey("acme", "2026-03-02")]!;
    expect(d.projectId).toBe("acme");
    expect(d.sessions).toEqual([{ id: "s", start: 100, end: 400 }]);
    expect(d).not.toHaveProperty("employerId");
  });
});

describe("shape validation", () => {
  it("drops spans that are not spans, and duplicate ids", () => {
    const doc = normalizeDoc({
      version: 2,
      projects: {},
      days: {
        "2026-03-02:acme": {
          sessions: [
            { id: "ok", start: 10, end: 20 },
            { id: "inverted", start: 30, end: 20 },
            { id: "ok", start: 40, end: 50 },
            { start: 1, end: 2 },
            "junk",
          ],
          breaks: [{ id: "b", start: 1, end: 2 }],
          activities: [{ id: "a", categoryId: "x", start: 1, end: 2 }],
        },
      },
    });
    const d = doc.days["2026-03-02:acme"]!;
    expect(d.date).toBe("2026-03-02");
    expect(d.projectId).toBe("acme");
    expect(d.sessions).toEqual([{ id: "ok", start: 10, end: 20 }]);
    // A break with no type is meaningless and dropped.
    expect(d.breaks).toEqual([]);
    expect(d.activities).toEqual([
      { id: "a", categoryId: "x", start: 1, end: 2 },
    ]);
  });

  it("drops a day without a real date and a project without a name", () => {
    const doc = normalizeDoc({
      version: 2,
      projects: { e1: { id: "e1", name: "  " }, e2: { id: "e2", name: "E2" } },
      days: { "nope:acme": { sessions: [] } },
    });
    expect(Object.keys(doc.days)).toEqual([]);
    expect(Object.keys(doc.projects)).toEqual(["e2"]);
  });

  it("keeps the mark and colour a kind was given", () => {
    const doc = normalizeDoc({
      version: 2,
      projects: {
        e: {
          id: "e",
          name: "E",
          breakTypes: [
            { id: "l", name: "Lunch", defaultMinutes: 30, glyph: "meal" },
          ],
          categories: [
            { id: "c", name: "Coding", glyph: "coding", color: "red" },
          ],
        },
      },
      days: {},
    });
    expect(doc.projects.e!.breakTypes[0]!.glyph).toBe("meal");
    expect(doc.projects.e!.categories[0]).toEqual({
      id: "c",
      name: "Coding",
      glyph: "coding",
      color: "red",
    });
  });

  it("drops a mark or a colour this version cannot draw", () => {
    // A document written by a later version can name a glyph or a hue this
    // build has no entry for. Dropping it leaves the kind looking like one
    // that never had either, rather than like nothing at all.
    const doc = normalizeDoc({
      version: 2,
      projects: {
        e: {
          id: "e",
          name: "E",
          breakTypes: [
            { id: "l", name: "Nap", defaultMinutes: 30, glyph: "teleport" },
          ],
          categories: [
            { id: "c", name: "Coding", glyph: 7, color: "chartreuse" },
          ],
        },
      },
      days: {},
    });
    expect(doc.projects.e!.breakTypes[0]).toEqual({
      id: "l",
      name: "Nap",
      defaultMinutes: 30,
    });
    expect(doc.projects.e!.categories[0]).toEqual({ id: "c", name: "Coding" });
  });

  it("drops a mark from the other vocabulary", () => {
    // A break wearing a pair of angle brackets and a kind of work wearing a
    // cup: both storable before the two lists were kept apart, and neither
    // kept. Named things the app never suggested, so nothing is put back in
    // their place.
    const doc = normalizeDoc({
      version: 2,
      projects: {
        e: {
          id: "e",
          name: "E",
          breakTypes: [
            { id: "l", name: "Nap", defaultMinutes: 30, glyph: "coding" },
          ],
          categories: [{ id: "c", name: "Coding", glyph: "coffee" }],
        },
      },
      days: {},
    });
    expect(doc.projects.e!.breakTypes[0]!.glyph).toBeUndefined();
    expect(doc.projects.e!.categories[0]!.glyph).toBeUndefined();
    // The neutral marks pass either way.
    const marks = normalizeDoc({
      version: 2,
      projects: {
        e: {
          id: "e",
          name: "E",
          breakTypes: [
            { id: "l", name: "Nap", defaultMinutes: 30, glyph: "dot" },
          ],
          categories: [{ id: "c", name: "Coding", glyph: "tag" }],
        },
      },
      days: {},
    });
    expect(marks.projects.e!.breakTypes[0]!.glyph).toBe("dot");
    expect(marks.projects.e!.categories[0]!.glyph).toBe("tag");
  });

  it("marks a kind the app itself suggested, whatever wrote it", () => {
    // A document from before there were marks: its Lunch, Coffee, Toilet,
    // Meetings, Planning, Retro and Admin are the app's own suggestions, and
    // are given the marks a project made today would have. The name is
    // matched however it was cased.
    const doc = normalizeDoc({
      version: 2,
      projects: {
        e: {
          id: "e",
          name: "E",
          breakTypes: [
            { id: "l", name: "Lunch", defaultMinutes: 30 },
            { id: "t", name: "  toilet ", defaultMinutes: 5 },
          ],
          categories: [
            { id: "m", name: "Meetings" },
            { id: "a", name: "Admin" },
          ],
        },
      },
      days: {},
    });
    expect(doc.projects.e!.breakTypes[0]!.glyph).toBe("meal");
    expect(doc.projects.e!.breakTypes[1]!.glyph).toBe("toilet");
    expect(doc.projects.e!.categories[0]!.glyph).toBe("meeting");
    expect(doc.projects.e!.categories[1]!.glyph).toBe("admin");
    // Nothing else is invented: no colour, and no mark for a name the app
    // never suggested.
    expect(doc.projects.e!.categories[0]!.color).toBeUndefined();
  });

  it("leaves a kind the app never suggested unmarked", () => {
    const doc = normalizeDoc({
      version: 2,
      projects: {
        e: {
          id: "e",
          name: "E",
          // "Meetings" as a *break*: the app suggests it as a kind of work,
          // so its mark is not handed across the two vocabularies.
          breakTypes: [{ id: "l", name: "Meetings", defaultMinutes: 30 }],
          categories: [{ id: "c", name: "Coding" }],
        },
      },
      days: {},
    });
    expect(doc.projects.e!.breakTypes[0]!.glyph).toBeUndefined();
    expect(doc.projects.e!.categories[0]!.glyph).toBeUndefined();
  });

  it("clamps a project's numbers and fills in the defaults", () => {
    const doc = normalizeDoc({
      version: 2,
      projects: {
        e: {
          id: "e",
          name: "E",
          hoursPerDay: 400,
          workDays: [1, 9, "3", 3],
          breakTypes: [{ id: "l", name: "Lunch", defaultMinutes: -5 }],
        },
      },
      days: {},
    });
    const e = doc.projects.e!;
    expect(e.hoursPerDay).toBe(16);
    expect(e.workDays).toEqual([1, 3]);
    expect(e.breakTypes[0]!.defaultMinutes).toBe(1);
    expect(e.categories).toEqual([]);
  });
});

describe("serializeDoc", () => {
  it("emits keys in sorted order so equal documents are equal bytes", () => {
    const a = emptyDoc();
    a.days["2026-03-02:acme"] = day("2026-03-02");
    a.days["2026-03-01:acme"] = day("2026-03-01");
    const b = emptyDoc();
    b.days["2026-03-01:acme"] = day("2026-03-01");
    b.days["2026-03-02:acme"] = day("2026-03-02");
    expect(serializeDoc(a)).toBe(serializeDoc(b));
  });
});
