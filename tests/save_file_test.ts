// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Every file the app hands over — the specification, the invoice file, the
// backup — leaves through the framework's `saveFile`: a download on the web,
// the share sheet in the phone app. A download link clicked by hand goes
// nowhere inside the app's WebView, so the last test keeps one from coming
// back.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { SAVE_FILE_RESULT_EVENT } from "@niclaslindstedt/oss-framework/files";

import { backupFileName, saveBackup } from "../src/app/backup.ts";
import {
  INVOICE_LINES_FORMAT,
  INVOICE_LINES_VERSION,
  saveInvoiceLines,
  type InvoiceLinesFile,
} from "../src/app/invoiceExport.ts";
import type { PdfDoc } from "../src/app/pdf/page.ts";
import { savePdf } from "../src/app/specExport.ts";
import { emptyDoc } from "../src/app/types.ts";
import { project } from "./fixtures/helpers.ts";
import {
  decodeBase64,
  stubBrowser,
  stubWebView,
  type WebViewWindow,
} from "./fixtures/shell.ts";

const doc: PdfDoc = {
  width: 200,
  height: 100,
  pages: [{ items: [] }],
  meta: {
    title: "Acme, September 2026",
    author: "",
    subject: "",
    createdAt: "2026-10-05T09:00:00.000Z",
  },
};

const lines: InvoiceLinesFile = {
  format: INVOICE_LINES_FORMAT,
  version: INVOICE_LINES_VERSION,
  source: { app: "time", version: "0.1.0" },
  exportedAt: "2026-10-05T09:00:00.000Z",
  project: { name: "Acme" },
  period: { from: "2026-09-01", to: "2026-09-30", label: "September 2026" },
  lines: [],
};

/** A shell that shares every file it is sent. */
const shares = (message: { id: string }, win: WebViewWindow) =>
  win.dispatchEvent(
    new CustomEvent(SAVE_FILE_RESULT_EVENT, {
      detail: { id: message.id, ok: true },
    }),
  );

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("on the web", () => {
  it("downloads the specification as a PDF", async () => {
    const downloads = stubBrowser();
    await expect(savePdf(doc, "acme_specification.pdf")).resolves.toBe(
      "downloaded",
    );
    expect(downloads).toHaveLength(1);
    expect(downloads[0]!.filename).toBe("acme_specification.pdf");
    expect(downloads[0]!.blob.type).toBe("application/pdf");
    expect(await downloads[0]!.blob.text()).toMatch(/^%PDF-/);
  });

  it("downloads the invoice file and the backup as JSON", async () => {
    const downloads = stubBrowser();
    await saveInvoiceLines(lines, "acme_invoice.json");
    const acme = project();
    await saveBackup({ ...emptyDoc(), projects: { [acme.id]: acme } });
    expect(downloads.map((d) => d.filename)).toEqual([
      "acme_invoice.json",
      backupFileName(),
    ]);
    const [invoice, backup] = downloads;
    expect(invoice!.blob.type).toBe("application/json;charset=utf-8");
    expect(JSON.parse(await invoice!.blob.text())).toEqual(lines);
    const restored = JSON.parse(await backup!.blob.text()) as {
      projects: Record<string, unknown>;
    };
    expect(Object.keys(restored.projects)).toEqual([acme.id]);
  });

  it("stays a download in a WebView whose shell cannot save a file", async () => {
    const downloads = stubBrowser();
    const { posted } = stubWebView(shares, []);
    await expect(saveBackup(emptyDoc())).resolves.toBe("downloaded");
    expect(posted).toHaveLength(0);
    expect(downloads).toHaveLength(1);
  });
});

describe("in the phone app", () => {
  it("hands the specification to the shell, which answers once the sheet closes", async () => {
    const downloads = stubBrowser();
    const { posted } = stubWebView(shares, ["save-file"]);
    await expect(savePdf(doc, "acme_specification.pdf")).resolves.toBe(
      "shared",
    );
    expect(downloads).toHaveLength(0);
    expect(posted).toHaveLength(1);
    expect(posted[0]!.filename).toBe("acme_specification.pdf");
    expect(posted[0]!.mimeType).toBe("application/pdf");
    const text = new TextDecoder("latin1").decode(
      decodeBase64(posted[0]!.base64),
    );
    expect(text).toMatch(/^%PDF-/);
  });

  it("hands over the JSON files as plain application/json", async () => {
    stubBrowser();
    const { posted } = stubWebView(shares, ["save-file"]);
    await saveInvoiceLines(lines, "acme_invoice.json");
    await saveBackup(emptyDoc());
    expect(posted.map((m) => [m.filename, m.mimeType])).toEqual([
      ["acme_invoice.json", "application/json"],
      [backupFileName(), "application/json"],
    ]);
    const invoice = new TextDecoder().decode(decodeBase64(posted[0]!.base64));
    expect(JSON.parse(invoice)).toEqual(lines);
  });

  it("rejects with the shell's error, so the screen can say so", async () => {
    stubBrowser();
    stubWebView(
      (message, win) =>
        win.dispatchEvent(
          new CustomEvent(SAVE_FILE_RESULT_EVENT, {
            detail: { id: message.id, ok: false, error: "disk full" },
          }),
        ),
      ["save-file"],
    );
    await expect(saveBackup(emptyDoc())).rejects.toThrow("disk full");
  });
});

describe("the exports", () => {
  it("never click a download link of their own", () => {
    // `downloadBlob` / `downloadText` / an anchor's `download` are the web's
    // download and nothing else: in the phone app they save nothing.
    const offenders = sources(join(import.meta.dirname, "..", "src")).filter(
      (file) =>
        /\b(downloadBlob|downloadText|saveDataUrl)\b|\.download\s*=/.test(
          readFileSync(file, "utf8"),
        ),
    );
    expect(offenders).toEqual([]);
  });
});

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}
