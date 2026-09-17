// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { normalizeDoc, parseDoc, serializeDoc } from "../src/app/migrations.ts";
import { DOC_VERSION, dayKey, emptyDoc } from "../src/app/types.ts";
import { day, project } from "./fixtures/helpers.ts";

describe("parseDoc", () => {
  it("round-trips a document", () => {
    const doc = emptyDoc();
    doc.projects.acme = project();
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
