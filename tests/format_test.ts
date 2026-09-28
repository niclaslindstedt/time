// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  formatBalance,
  formatDialTime,
  formatDuration,
  formatHours,
  formatPercent,
  formatTimeOfDay,
  formatTimer,
  formatWallTime,
  parseTimeOfDay,
  secondsOfDay,
  toTimeInput,
} from "../src/app/format.ts";
import { hourCycleOf, setLocalePrefs, weekStartOf } from "../src/app/locale.ts";
import { h } from "./fixtures/helpers.ts";

describe("durations", () => {
  it("formats to the minute, floored", () => {
    expect(formatDuration(h(7, 32) + 59)).toBe("7h 32m");
    expect(formatDuration(h(0, 5))).toBe("5m");
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(-5)).toBe("0m");
  });

  it("formats decimal hours for a tick", () => {
    expect(formatHours(h(7, 30))).toBe("7.5 h");
    expect(formatHours(h(8))).toBe("8 h");
    expect(formatHours(h(12, 30))).toBe("13 h");
  });

  it("formats a balance with its sign", () => {
    expect(formatBalance(h(1, 5))).toBe("+1h 05m");
    expect(formatBalance(-h(0, 20))).toBe("−0h 20m");
    expect(formatBalance(0)).toBe("+0h 00m");
  });

  it("formats the timer", () => {
    expect(formatTimer(h(7, 32) + 15)).toBe("7:32:15");
    expect(formatTimer(0)).toBe("0:00:00");
    // Past ten hours it grows a digit rather than padding to one.
    expect(formatTimer(h(11, 5))).toBe("11:05:00");
  });
});

describe("times of day", () => {
  it("formats and keeps counting past midnight", () => {
    expect(formatTimeOfDay(h(12, 4), "24")).toBe("12:04");
    expect(formatTimeOfDay(h(25, 10), "24")).toBe("25:10");
    expect(toTimeInput(h(25, 10))).toBe("01:10");
  });

  it("tells a time on the twelve-hour clock the way an American reads it", () => {
    expect(formatTimeOfDay(h(7, 26), "12")).toBe("7:26\u00a0AM");
    expect(formatTimeOfDay(h(19, 26), "12")).toBe("7:26\u00a0PM");
    expect(formatTimeOfDay(h(0, 5), "12")).toBe("12:05\u00a0AM");
    expect(formatTimeOfDay(h(12, 0), "12")).toBe("12:00\u00a0PM");
    // Past midnight there is no 25th hour to count on: the record's next
    // morning says which day it is instead.
    expect(formatTimeOfDay(h(25, 10), "12")).toBe("1:10\u00a0AM\u00a0+1");
    expect(formatWallTime(h(25, 14), "12")).toBe("1:14\u00a0AM");
  });

  it("keeps a time input's value on the 24-hour clock either way", () => {
    // The control's value format is HH:MM; it shows it the device's way.
    expect(toTimeInput(h(19, 26))).toBe("19:26");
    expect(parseTimeOfDay(toTimeInput(h(7, 5)))).toBe(h(7, 5));
  });

  it("follows the clock the app was set to when none is named", () => {
    try {
      setLocalePrefs({ hourCycle: "12", weekStart: 0 });
      expect(formatTimeOfDay(h(7, 26))).toBe("7:26\u00a0AM");
      expect(formatDialTime(h(13, 30))).toBe("1:30");
      setLocalePrefs({ hourCycle: "24", weekStart: 1 });
      expect(formatTimeOfDay(h(7, 26))).toBe("07:26");
      expect(formatDialTime(h(13, 30))).toBe("13:30");
    } finally {
      setLocalePrefs({ hourCycle: hourCycleOf(), weekStart: weekStartOf() });
    }
  });

  it("prints a dial chip without the AM or PM a twelve-hour dial implies", () => {
    expect(formatDialTime(h(12, 30), "12")).toBe("12:30");
    expect(formatDialTime(h(25, 10), "12")).toBe("1:10");
    expect(formatDialTime(h(25, 10), "24")).toBe("25:10");
  });

  it("reads a moment off the wall clock instead, for one not yet reached", () => {
    // The same second, told the two ways: the record's 25th hour, and the
    // hour a clock in the room shows. Whoever prints the second says which
    // day it falls on.
    expect(formatWallTime(h(12, 4), "24")).toBe("12:04");
    expect(formatWallTime(h(25, 14), "24")).toBe("01:14");
    expect(formatWallTime(h(24), "24")).toBe("00:00");
    expect(formatWallTime(h(48, 30), "24")).toBe("00:30");
  });

  it("parses HH:MM and HH:MM:SS, rejecting the rest", () => {
    expect(parseTimeOfDay("12:04")).toBe(h(12, 4));
    expect(parseTimeOfDay("9:05:30")).toBe(h(9, 5) + 30);
    expect(parseTimeOfDay("25:00")).toBe(h(25));
    expect(parseTimeOfDay("12:60")).toBeNull();
    expect(parseTimeOfDay("noon")).toBeNull();
    expect(parseTimeOfDay("")).toBeNull();
  });

  it("reads seconds since local midnight off a Date", () => {
    expect(secondsOfDay(new Date(2026, 2, 2, 9, 30, 15))).toBe(h(9, 30) + 15);
  });
});

describe("formatPercent", () => {
  it("floors to a whole percent and runs past 100", () => {
    expect(formatPercent(0.5)).toBe("50%");
    expect(formatPercent(1.129)).toBe("112%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(Number.NaN)).toBe("0%");
  });
});
