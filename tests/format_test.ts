// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  formatBalance,
  formatDuration,
  formatHours,
  formatPercent,
  formatTimeOfDay,
  formatTimer,
  parseTimeOfDay,
  secondsOfDay,
  toTimeInput,
} from "../src/app/format.ts";
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
    expect(formatTimer(h(7, 32) + 15)).toBe("07:32:15");
    expect(formatTimer(0)).toBe("00:00:00");
  });
});

describe("times of day", () => {
  it("formats and keeps counting past midnight", () => {
    expect(formatTimeOfDay(h(12, 4))).toBe("12:04");
    expect(formatTimeOfDay(h(25, 10))).toBe("25:10");
    expect(toTimeInput(h(25, 10))).toBe("01:10");
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
