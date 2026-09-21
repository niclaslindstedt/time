// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The other renderer: a page of `page.ts` primitives as SVG attributes.
//
// The preview in the export modal and the sheet that goes to the printer are
// the same pages as the file, drawn by the browser instead of by a reader.
// This module is the map between the two — one place that says what a text
// item, a rectangle and a rule become, so the two renderings cannot drift.
//
// Both coordinate systems have their origin at the top left and both place
// type by its baseline, so there is nothing to flip: the SVG's viewBox is the
// page in points and every number goes across unchanged.
//
// `textLength` is the one thing here that is not a straight copy. The faces
// are the base-14 ones and the browser draws them with whatever metric-
// compatible cut it has — Arial for Helvetica, Liberation Serif for Times —
// but a machine with neither would set the line at some other width and the
// preview would stop being the document. Handing the browser the width this
// app measured (see `metrics.ts`) pins it: a substituted face is stretched to
// the width the PDF will use rather than allowed to run long.

import { CSS_FAMILY, CSS_STYLE } from "./metrics.ts";
import {
  alignOffset,
  itemWidth,
  type LineItem,
  type RectItem,
  type TextItem,
} from "./page.ts";

export function textAttrs(item: TextItem) {
  const style = CSS_STYLE[item.font];
  return {
    x: item.x + alignOffset(item),
    y: item.y,
    fill: item.color,
    fontFamily: CSS_FAMILY[item.font],
    fontSize: item.size,
    fontWeight: style.weight,
    fontStyle: style.italic ? "italic" : "normal",
    textLength: itemWidth(item),
    lengthAdjust: "spacingAndGlyphs",
  } as const;
}

export function rectAttrs(item: RectItem) {
  return {
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    fill: item.color,
  } as const;
}

export function lineAttrs(item: LineItem) {
  return {
    x1: item.x1,
    y1: item.y1,
    x2: item.x2,
    y2: item.y2,
    stroke: item.color,
    strokeWidth: item.width,
  } as const;
}
