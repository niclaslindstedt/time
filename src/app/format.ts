// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Presentation. The domain speaks `Seconds` and `DayKey` everywhere; this is
// the one module that turns either into something readable, and the one that
// reads a typed time back.

import {
  dayKeyOf,
  formatDayKey,
  formatMonthLabel,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import { DAY_SECONDS, type Seconds } from "./types.ts";

const pad = (n: number) => String(n).padStart(2, "0");

/** "7h 32m" — a length of time, to the minute. Under an hour "32m", nothing
 *  "0m". Rounded down: a report never claims a minute that has not passed. */
export function formatDuration(seconds: Seconds): string {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
}

/** "7.5 h" — a length of time as decimal hours, for a chart tick. */
export function formatHours(seconds: Seconds): string {
  const hours = Math.max(0, seconds) / 3600;
  const text = hours >= 10 ? hours.toFixed(0) : hours.toFixed(1);
  return `${text.replace(/\.0$/, "")} h`;
}

/** "+1h 05m" / "−0h 20m" — a balance, with its sign. */
export function formatBalance(seconds: Seconds): string {
  const sign = seconds < 0 ? "−" : "+";
  const abs = Math.abs(seconds);
  const minutes = Math.floor(abs / 60);
  return `${sign}${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}

/** "7:32:15" — the running timer. The hour is not padded: a working day is
 *  one digit of hours almost every day, and a leading zero in a number that
 *  big on the screen reads as part of the figure rather than as nothing. */
export function formatTimer(seconds: Seconds): string {
  const s = Math.floor(Math.max(0, seconds));
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** "12:04" — a moment on the day's clock. Past midnight the hour keeps
 *  counting ("25:10"), because 01:10 would read as the morning of the same
 *  day, and the span it ends belongs to the day before. */
export function formatTimeOfDay(seconds: Seconds): string {
  const s = Math.floor(Math.max(0, seconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}`;
}

/** "HH:MM" as a `<input type="time">` wants it — the same as above, wrapped
 *  into the day, since the control cannot show a 25th hour. */
export function toTimeInput(seconds: Seconds): string {
  return formatTimeOfDay(((seconds % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS);
}

/** "12:04" (or "12:04:30") → seconds since midnight, or null when it is not
 *  a time. */
export function parseTimeOfDay(text: string): Seconds | null {
  const m = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/.exec(text);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const sec = m[3] ? Number(m[3]) : 0;
  if (h > 47 || min > 59 || sec > 59) return null;
  return h * 3600 + min * 60 + sec;
}

/** "112%" — a share, to the whole percent, floored. */
export function formatPercent(fraction: number): string {
  if (!(fraction > 0)) return "0%";
  return `${Math.floor(fraction * 100)}%`;
}

/** Seconds since local midnight of a moment. */
export function secondsOfDay(date: Date): Seconds {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

/** The day a moment falls on, as a `DayKey`. */
export const dayOf = dayKeyOf;

/** "5 Jul" — how this app names a date. */
export function formatDay(day: DayKey): string {
  return formatDayKey(day, { day: "numeric", month: "short" });
}

/** "Sun, 5 Jul 2026". */
export function formatFullDay(day: DayKey): string {
  return formatDayKey(day, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Mon". */
export function formatWeekday(day: DayKey): string {
  return formatDayKey(day, { weekday: "short" });
}

/** "July 2026". */
export function formatMonth(year: number, month: number): string {
  return formatMonthLabel(year, month);
}
