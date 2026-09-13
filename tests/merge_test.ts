// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { mergeDocs } from "../src/app/merge.ts";
import { dayKey, emptyDoc, type WorkDay } from "../src/app/types.ts";
import { day, employer } from "./fixtures/helpers.ts";

function docOf(...days: WorkDay[]) {
  const doc = emptyDoc();
  for (const d of days) doc.days[dayKey(d.employerId, d.date)] = d;
  return doc;
}

describe("mergeDocs", () => {
  it("keeps days only one side holds", () => {
    const merged = mergeDocs(
      docOf(day("2026-03-01")),
      docOf(day("2026-03-02")),
    );
    expect(Object.keys(merged.days).sort()).toEqual([
      "2026-03-01:acme",
      "2026-03-02:acme",
    ]);
  });

  it("takes the later edit of a day both hold", () => {
    const older = day("2026-03-01", { updatedAt: "2026-03-01T10:00:00.000Z" });
    const newer = day("2026-03-01", {
      updatedAt: "2026-03-01T11:00:00.000Z",
      sessions: [{ id: "s", start: 0, end: 10 }],
    });
    expect(mergeDocs(docOf(older), docOf(newer)).days["2026-03-01:acme"]).toBe(
      newer,
    );
    expect(mergeDocs(docOf(newer), docOf(older)).days["2026-03-01:acme"]).toBe(
      newer,
    );
  });

  it("keeps the local copy on a tie", () => {
    const a = day("2026-03-01");
    const b = day("2026-03-01");
    expect(mergeDocs(docOf(a), docOf(b)).days["2026-03-01:acme"]).toBe(a);
  });

  it("merges employers the same way", () => {
    const local = emptyDoc();
    local.employers.acme = employer({ updatedAt: "2026-01-01T00:00:00.000Z" });
    const remote = emptyDoc();
    remote.employers.acme = employer({
      name: "Acme Ltd",
      updatedAt: "2026-02-01T00:00:00.000Z",
    });
    remote.employers.other = employer({ id: "other", name: "Other" });
    const merged = mergeDocs(local, remote);
    expect(merged.employers.acme!.name).toBe("Acme Ltd");
    expect(Object.keys(merged.employers).sort()).toEqual(["acme", "other"]);
  });
});
