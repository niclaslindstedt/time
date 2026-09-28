// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { weekFrom } from "../src/app/labels.ts";
import {
  hourCycleOf,
  resolveHourCycle,
  resolveWeekStart,
  weekStartOf,
} from "../src/app/locale.ts";

// The clock and the week follow the reader's locale unless Settings chose.
// Walked with explicit tags, so the answers do not depend on the machine the
// tests run on.

describe("hourCycleOf", () => {
  it("tells the time on the twelve-hour clock in the US", () => {
    expect(hourCycleOf("en-US")).toBe("12");
    expect(hourCycleOf("en-CA")).toBe("12");
  });

  it("keeps the 24-hour clock where it is the custom", () => {
    expect(hourCycleOf("sv-SE")).toBe("24");
    expect(hourCycleOf("en-GB")).toBe("24");
    expect(hourCycleOf("de-DE")).toBe("24");
    expect(hourCycleOf("nb-NO")).toBe("24");
  });

  it("falls back to the 24-hour clock for a tag that is not one", () => {
    expect(hourCycleOf("not a tag!")).toBe("24");
  });
});

describe("weekStartOf", () => {
  it("starts the week on Sunday in the US", () => {
    expect(weekStartOf("en-US")).toBe(0);
    expect(weekStartOf("es-US")).toBe(0);
  });

  it("starts it on Monday in the Nordics and the UK", () => {
    for (const tag of ["sv-SE", "nb-NO", "da-DK", "fi-FI", "en-GB"]) {
      expect(weekStartOf(tag), tag).toBe(1);
    }
  });

  it("falls back to Monday for a tag that is not one", () => {
    expect(weekStartOf("not a tag!")).toBe(1);
  });
});

describe("the settings over the locale", () => {
  it("follows the locale on auto, and the choice otherwise", () => {
    expect(resolveHourCycle("auto", "en-US")).toBe("12");
    expect(resolveHourCycle("auto", "sv-SE")).toBe("24");
    expect(resolveHourCycle("24", "en-US")).toBe("24");
    expect(resolveHourCycle("12", "sv-SE")).toBe("12");
    expect(resolveWeekStart("auto", "en-US")).toBe(0);
    expect(resolveWeekStart("auto", "sv-SE")).toBe(1);
    expect(resolveWeekStart(1, "en-US")).toBe(1);
    expect(resolveWeekStart(0, "sv-SE")).toBe(0);
  });
});

describe("weekFrom", () => {
  it("lists the week from the day it starts on", () => {
    expect(weekFrom(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekFrom(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weekFrom(6)).toEqual([6, 0, 1, 2, 3, 4, 5]);
  });
});
