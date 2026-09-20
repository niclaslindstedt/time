// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DESK_QUERY,
  DESK_WIDTH,
  STAND_HEIGHT,
  STAND_QUERY,
  shapeOf,
} from "../src/app/shape.ts";

// The three shapes of window, walked at the sizes real devices actually
// report — the edges matter more here than anywhere else in the app, because
// getting one wrong means a screen that is laid out for room it has not got.

describe("shapeOf", () => {
  it("calls a phone held upright a phone", () => {
    expect(shapeOf(393, 852)).toBe("phone"); // a modern phone
    expect(shapeOf(320, 568)).toBe("phone"); // the smallest still in use
    expect(shapeOf(412, 915)).toBe("phone");
  });

  it("calls the same phone laid down a stand", () => {
    expect(shapeOf(852, 393)).toBe("stand");
    expect(shapeOf(915, 412)).toBe("stand");
    expect(shapeOf(568, 320)).toBe("stand");
  });

  it("calls a tablet held upright a phone, and laid down a desk", () => {
    // A tablet upright is a column with room to spare, which is the phone's
    // layout and not the desk's — 64rem is about the width, not the device.
    expect(shapeOf(744, 1133)).toBe("phone");
    expect(shapeOf(768, 1024)).toBe("phone");
    // Laid down it is past the desk's edge, and short has nothing to say.
    expect(shapeOf(1133, 744)).toBe("desk");
    expect(shapeOf(1024, 768)).toBe("desk");
  });

  it("calls a laptop a desk however short the window is", () => {
    expect(shapeOf(1440, 900)).toBe("desk");
    expect(shapeOf(1280, 400)).toBe("desk");
  });

  it("puts the desk's edge at 64rem exactly", () => {
    expect(shapeOf(DESK_WIDTH * 16, 400)).toBe("desk");
    expect(shapeOf(DESK_WIDTH * 16 - 1, 400)).toBe("stand");
  });

  it("puts the stand's floor at 44rem exactly", () => {
    expect(shapeOf(900, STAND_HEIGHT * 16)).toBe("stand");
    expect(shapeOf(900, STAND_HEIGHT * 16 + 1)).toBe("phone");
  });

  it("calls a square window landscape, the way CSS does", () => {
    expect(shapeOf(500, 500)).toBe("stand");
    expect(shapeOf(499, 500)).toBe("phone");
  });

  it("never calls a tall window a stand, however narrow", () => {
    for (let w = 280; w <= 1000; w += 40) {
      expect(shapeOf(w, w + 1)).not.toBe("stand");
    }
  });
});

describe("the queries", () => {
  it("say the same thing the function does", () => {
    expect(DESK_QUERY).toBe("(min-width: 64rem)");
    expect(STAND_QUERY).toBe(
      "(max-width: 63.9375rem) and (orientation: landscape) and (max-height: 44rem)",
    );
  });

  it("cannot both match, so a window is one shape", () => {
    // The stand's own guard: the desk starts where the stand stops.
    expect(STAND_QUERY).toContain(`max-width: ${DESK_WIDTH - 0.0625}rem`);
  });
});
