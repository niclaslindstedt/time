// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The range as the file the Invoice app fills an invoice from: lines of what
// was done and how much of it, in hours, over a period, for a named project.
// No money — the exporter says what was delivered, and the invoice says what
// it costs.
//
// A reading of `spec.ts`'s specification and never a second fold of the
// days, so the hours on an invoice can never disagree with the hours on the
// specification sent with it: the same rounding, the same billed figure. What
// this adds is the grain — one line for the period, a line a day, or a line
// a kind of work — and the envelope the other app reads
// (`format: "invoice-lines"`, versioned).
//
// Pure and clock-free: the moment of export comes in as a parameter.

import { MIME_JSON, downloadText } from "@niclaslindstedt/oss-framework/files";

import type { SpecAmount, SpecDay, Specification } from "./spec.ts";
import { decimalHours, sumHours } from "./spec.ts";
import { slug } from "./specExport.ts";

export const INVOICE_LINES_FORMAT = "invoice-lines";
export const INVOICE_LINES_VERSION = 1;

/** How the hours are cut into lines. */
export type InvoiceGrain = "period" | "day" | "kind";

export const INVOICE_GRAINS: InvoiceGrain[] = ["period", "day", "kind"];

export function clampGrain(value: unknown): InvoiceGrain {
  return INVOICE_GRAINS.includes(value as InvoiceGrain)
    ? (value as InvoiceGrain)
    : "period";
}

export type InvoiceLine = {
  description: string;
  quantity: number;
  unit: "hour";
  date?: string;
};

export type InvoiceLinesFile = {
  format: typeof INVOICE_LINES_FORMAT;
  version: typeof INVOICE_LINES_VERSION;
  source: { app: "time"; version: string };
  exportedAt: string;
  project: { name: string };
  period: { from: string; to: string; label: string };
  lines: InvoiceLine[];
};

/** The words a line is described with — the app's, passed in so this module
 *  stays free of the catalog. */
export type InvoiceNames = {
  /** A day's line: the date as the reader would write it. */
  day: (date: string) => string;
  /** A kind of work's name, by id. */
  kind: (id: string) => string;
  /** The line for worked time no kind of work labelled. */
  unlabelled: string;
  /** The line for what the rounding added, when the days were rounded. */
  rounding: string;
};

/** The lines a specification comes to at a grain. Hours are the billed
 *  decimal hours the specification prints, so the column adds up the same
 *  on both documents. Empty days — a blank the calendar shows — carry no
 *  line. */
export function invoiceLines(
  spec: Specification,
  grain: InvoiceGrain,
  names: InvoiceNames,
): InvoiceLine[] {
  if (grain === "day") {
    return spec.days
      .filter((d: SpecDay) => d.hours > 0)
      .map((d) => ({
        description: names.day(d.date),
        quantity: d.hours,
        unit: "hour",
        date: d.date,
      }));
  }
  if (grain === "kind") {
    return spec.categories
      .filter((a: SpecAmount) => a.hours > 0)
      .map((a) => ({
        description:
          a.kind === "kind" && a.id !== null
            ? names.kind(a.id)
            : a.kind === "rounding"
              ? names.rounding
              : names.unlabelled,
        quantity: a.hours,
        unit: "hour",
      }));
  }
  const hours = spec.totals.hours;
  if (hours <= 0) return [];
  return [
    {
      description: `${spec.projectName} — ${periodLabelOf(spec)}`,
      quantity: hours,
      unit: "hour",
    },
  ];
}

/** The range as the specification names it, kept on the file so the invoice
 *  can print it under its title. Set by the caller from the Report screen's
 *  own heading; this is the fallback when none is given. */
function periodLabelOf(spec: Specification): string {
  return `${spec.from} – ${spec.to}`;
}

/** The whole file. */
export function invoiceLinesFile(
  spec: Specification,
  grain: InvoiceGrain,
  names: InvoiceNames,
  options: { period: string; exportedAt: string; appVersion: string },
): InvoiceLinesFile {
  const label = options.period || periodLabelOf(spec);
  const lines = invoiceLines(spec, grain, names).map((line) =>
    grain === "period"
      ? { ...line, description: `${spec.projectName} — ${label}` }
      : line,
  );
  return {
    format: INVOICE_LINES_FORMAT,
    version: INVOICE_LINES_VERSION,
    source: { app: "time", version: options.appVersion },
    exportedAt: options.exportedAt,
    project: { name: spec.projectName },
    period: { from: spec.from, to: spec.to, label },
    lines,
  };
}

/** The hours the lines add up to — what the form shows before the download,
 *  and what the invoice will bill. */
export function invoiceLinesTotal(lines: readonly InvoiceLine[]): number {
  return sumHours(lines.map((l) => l.quantity));
}

/** What the file is called: `<project>_<period>_invoice.json`, the way the
 *  specification is `…_specification.pdf`, so the two file together. */
export function invoiceFilename(projectName: string, period: string): string {
  const parts = [slug(projectName), slug(period)].filter(Boolean);
  return `${[...parts, "invoice"].join("_")}.json`;
}

/** Save the file. Pretty-printed: it is a file a person may well open. */
export function downloadInvoiceLines(
  file: InvoiceLinesFile,
  filename: string,
): void {
  downloadText(filename, `${JSON.stringify(file, null, 2)}\n`, MIME_JSON);
}

// `decimalHours` is re-exported for the form, which prints a day's hours
// the way the specification does.
export { decimalHours };
