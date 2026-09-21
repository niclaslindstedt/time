// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { lineAttrs, rectAttrs, textAttrs } from "./pdf/svg.ts";
import { SPEC_PALETTE } from "./specStyle.ts";
import type { PdfDoc } from "./pdf/page.ts";

// The specification, on screen: the same pages the PDF is written from, drawn
// as SVG (see `pdf/svg.ts`). One `<svg>` per page, sized in points and scaled
// by whatever box it is put in, so the preview in the modal and the sheet the
// printer gets are the same drawing at two sizes.
//
// It is paper, so it is white — `SPEC_PALETTE.paper` and not a surface token.
// A preview that went dark with the app would be a preview of a document
// nobody is going to get.

type Props = {
  doc: PdfDoc;
  /** A class on each page — the shadow and the margin in the modal, nothing
   *  at all when printing. */
  className?: string;
};

export function SpecPages({ doc, className }: Props) {
  return (
    <>
      {doc.pages.map((page, index) => (
        <svg
          key={index}
          className={className}
          viewBox={`0 0 ${doc.width} ${doc.height}`}
          width="100%"
          role="img"
          aria-label={`${index + 1}`}
          style={{
            display: "block",
            backgroundColor: SPEC_PALETTE.paper,
            aspectRatio: `${doc.width} / ${doc.height}`,
          }}
        >
          {page.items.map((item, i) =>
            item.kind === "rect" ? (
              <rect key={i} {...rectAttrs(item)} />
            ) : item.kind === "line" ? (
              <line key={i} {...lineAttrs(item)} />
            ) : (
              <text key={i} {...textAttrs(item)}>
                {item.text}
              </text>
            ),
          )}
        </svg>
      ))}
    </>
  );
}
