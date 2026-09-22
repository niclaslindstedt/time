// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  INVOICE_LINES_FORMAT,
  INVOICE_LINES_VERSION,
  clampGrain,
  invoiceFilename,
  invoiceLines,
  invoiceLinesFile,
  invoiceLinesTotal,
  type InvoiceNames,
} from "../src/app/invoiceExport.ts";
import { specification } from "../src/app/spec.ts";
import { dayKey, type AppData } from "../src/app/types.ts";
import { day, h, project } from "./fixtures/helpers.ts";

// The export is a reading of the specification: the hours on the file are
// the specification's billed decimal hours, at whatever grain, so the
// invoice can never bill hours the specification sent with it does not show.

const acme = project({
  categories: [
    { id: "meet", name: "Meetings" },
    { id: "code", name: "Coding" },
  ],
});

function docWith(...days: ReturnType<typeof day>[]): AppData {
  const data: AppData = { version: 2, projects: { acme }, days: {} };
  for (const d of days) data.days[dayKey("acme", d.date)] = d;
  return data;
}

/** 08:00–16:30 with half an hour of lunch: eight hours, two of them meetings. */
function worked(date: string) {
  return day(date, {
    sessions: [{ id: `s-${date}`, start: h(8), end: h(16, 30) }],
    breaks: [
      { id: `b-${date}`, typeId: "lunch", start: h(12), end: h(12, 30) },
    ],
    activities: [
      { id: `a-${date}`, categoryId: "meet", start: h(9), end: h(11) },
    ],
  });
}

const names: InvoiceNames = {
  day: (date) => `Day ${date}`,
  kind: (id) => (id === "meet" ? "Meetings" : id === "code" ? "Coding" : id),
  unlabelled: "Other work",
  rounding: "Rounding added",
};

const data = docWith(worked("2026-09-01"), worked("2026-09-02"));
const spec = specification(
  data,
  acme,
  "2026-09-01",
  "2026-09-30",
  "2026-10-05",
  h(9),
);

describe("invoiceLines", () => {
  it("is one line for the period, at the specification's total", () => {
    const lines = invoiceLines(spec, "period", names);
    expect(lines).toEqual([
      {
        description: "Acme — 2026-09-01 – 2026-09-30",
        quantity: 16,
        unit: "hour",
      },
    ]);
  });

  it("is a line a day, dated, at the day's billed hours", () => {
    const lines = invoiceLines(spec, "day", names);
    expect(lines).toEqual([
      {
        description: "Day 2026-09-01",
        quantity: 8,
        unit: "hour",
        date: "2026-09-01",
      },
      {
        description: "Day 2026-09-02",
        quantity: 8,
        unit: "hour",
        date: "2026-09-02",
      },
    ]);
  });

  it("is a line a kind of work, the unlabelled rest named", () => {
    const lines = invoiceLines(spec, "kind", names);
    expect(lines).toEqual([
      { description: "Meetings", quantity: 4, unit: "hour" },
      { description: "Other work", quantity: 12, unit: "hour" },
    ]);
  });

  it("adds up the same at every grain", () => {
    for (const grain of ["period", "day", "kind"] as const) {
      expect(invoiceLinesTotal(invoiceLines(spec, grain, names))).toBe(
        spec.totals.hours,
      );
    }
  });

  it("carries the rounding as its own line when the days were rounded", () => {
    const rounded = specification(
      docWith(
        day("2026-09-01", {
          sessions: [{ id: "s", start: h(8), end: h(16, 5) }],
        }),
      ),
      acme,
      "2026-09-01",
      "2026-09-30",
      "2026-10-05",
      h(9),
      { rounding: 15 },
    );
    expect(invoiceLines(rounded, "kind", names)).toEqual([
      { description: "Other work", quantity: 8.08, unit: "hour" },
      { description: "Rounding added", quantity: 0.17, unit: "hour" },
    ]);
    expect(invoiceLines(rounded, "period", names)[0]?.quantity).toBe(8.25);
  });

  it("is nothing when nothing was worked", () => {
    const empty = specification(
      docWith(),
      acme,
      "2026-09-01",
      "2026-09-30",
      "2026-10-05",
      h(9),
    );
    expect(invoiceLines(empty, "period", names)).toEqual([]);
    expect(invoiceLines(empty, "day", names)).toEqual([]);
  });
});

describe("invoiceLinesFile", () => {
  it("wraps the lines in the envelope the Invoice app reads", () => {
    const file = invoiceLinesFile(spec, "period", names, {
      period: "September 2026",
      exportedAt: "2026-10-05T09:00:00.000Z",
      appVersion: "0.1.0",
    });
    expect(file.format).toBe(INVOICE_LINES_FORMAT);
    expect(file.version).toBe(INVOICE_LINES_VERSION);
    expect(file.source).toEqual({ app: "time", version: "0.1.0" });
    expect(file.exportedAt).toBe("2026-10-05T09:00:00.000Z");
    expect(file.project).toEqual({ name: "Acme" });
    expect(file.period).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
      label: "September 2026",
    });
    // The period's own name goes on the one line too.
    expect(file.lines[0]?.description).toBe("Acme — September 2026");
  });

  it("falls back to the dates when the range has no name", () => {
    const file = invoiceLinesFile(spec, "period", names, {
      period: "",
      exportedAt: "2026-10-05T09:00:00.000Z",
      appVersion: "0.1.0",
    });
    expect(file.period.label).toBe("2026-09-01 – 2026-09-30");
  });
});

describe("the file's name and the grain", () => {
  it("files beside the specification", () => {
    expect(invoiceFilename("Acme AB", "September 2026")).toBe(
      "acme_ab_september_2026_invoice.json",
    );
  });

  it("clamps a stored grain", () => {
    expect(clampGrain("day")).toBe("day");
    expect(clampGrain("hour")).toBe("period");
    expect(clampGrain(undefined)).toBe("period");
  });
});
