// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Getting the specification out of the app: the name the file takes, the
// download, and the print.
//
// Both ways out are local. The download is a blob the browser saves; the
// print is the same pages handed to the printer through the browser's own
// dialog. Nothing is uploaded, nothing is rendered by a service — the
// document is written on the device it was logged on, which is the whole
// premise this app is built to (see the agent guide).

import { writePdf } from "./pdf/write.ts";
import type { PdfDoc } from "./pdf/page.ts";

/** A piece of a filename: folded to lowercase ASCII, spaces to underscores,
 *  and anything a file system might object to dropped. Accents come off
 *  rather than being dropped, so "Malmö Stad" files as `malmo_stad` and not
 *  as `malm_stad`. */
export function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");
}

/** What the file is called: the project, the range, and what it is.
 *  `<project>_<period>_specification.pdf`, all of it lowercase and not a
 *  space in it — a name that survives being emailed, zipped and filed. */
export function specFilename(projectName: string, period: string): string {
  const parts = [slug(projectName), slug(period)].filter(Boolean);
  return `${[...parts, "specification"].join("_")}.pdf`;
}

/** Save the document as a file. The blob URL is revoked on the next turn of
 *  the event loop rather than immediately: Safari reads the href after the
 *  click returns, and a URL revoked too early is a download that never
 *  starts. */
export function downloadPdf(doc: PdfDoc, filename: string): void {
  const blob = new Blob([writePdf(doc) as BlobPart], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** The attribute that tells the stylesheet a specification is on its way to
 *  the printer, and that everything else on the page is to stand down. */
export const PRINTING_ATTR = "data-printing";

/**
 * Print the pages that are already in the document.
 *
 * The sheet is drawn as SVG by `SpecPages` inside a container the stylesheet
 * shows only while printing (`.spec-print`, `styles.css`), so what goes to
 * the printer is the same layout the file is written from rather than a
 * screenshot of the preview. `beforeprint` is not waited for: the container
 * is in the DOM before this is called.
 */
export function printSpec(): void {
  const root = document.documentElement;
  root.setAttribute(PRINTING_ATTR, "spec");
  const done = () => {
    root.removeAttribute(PRINTING_ATTR);
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
  // Safari never fires `afterprint` from a blocked dialog; the attribute is
  // taken off on the next frame there instead, which is after the printed
  // snapshot has been taken.
  setTimeout(done, 1000);
}

/** The `@page` rule the printer needs for this document — the paper size in
 *  points and no margin of its own, because the layout already carries one. */
export function pageRule(doc: PdfDoc): string {
  return `@page { size: ${doc.width}pt ${doc.height}pt; margin: 0; }`;
}
