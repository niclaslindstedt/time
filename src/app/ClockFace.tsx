// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useRef } from "react";

import { activityIntervals, daySegments } from "./day.ts";
import { angleOf, polar } from "./clock.ts";
import { DIAL_BOX, Dial, type Band } from "./Dial.tsx";
import { formatTimeOfDay } from "./format.ts";
import { useT } from "./i18n/index.ts";
import { breakName, categoryColor } from "./labels.ts";
import { CLOCK_SIZE, type ClockSize, type DialConfig } from "./look.ts";
import type { Project, Seconds, WorkDay } from "./types.ts";

// The Today screen's clock: a wrist watch's dial with the day drawn on it.
//
// The day is one ring. Time at work is the accent — a band, and a thin line
// along its outer edge. A kind of work takes the band in its own hue (the
// one the chips and the report's charts use, see `labels.ts`) and leaves the
// thin line the accent, so "at work" and "at what" are read from one ring
// rather than two. A break is the flag colour, band and line both. The hands
// are the watch's, so the arc ending under the minute hand is the stretch
// you are in.
//
// The dial is also where a break gets corrected. A break is written down with
// the end its kind is assumed to have (see `takeBreak`), so its end is a
// guess — and the guess is printed on the rim, next to the arc it ends, where
// tapping it opens the stretch list at that moment. Tapping the dial itself
// opens the same list from the top.
//
// Everything is derived from the day's spans (see `day.ts`); the face holds no
// state of its own and re-renders as the second ticks. The part of a break
// that has not happened yet — the tail between now and its assumed end — is
// drawn at half strength, because it is a plan rather than a record.
//
// What the watch looks like — its face, its markers, its numerals, how its
// second hand moves — is the dial the settings resolved (see `look.ts`); the
// drawing itself is `Dial.tsx`, shared with the settings' previews.

/** Where the break-end chips sit: on the bezel, as a percentage of the box,
 *  so they are HTML buttons over the SVG rather than text inside it — a chip
 *  is a tap target and wants a real button under the finger. */
const LABEL_R = 118;

type Props = {
  day: WorkDay;
  project: Project;
  now: Seconds;
  dial: DialConfig;
  size: ClockSize;
  /** Open the day's stretches, optionally at the moment that was tapped. */
  onOpen: (at?: Seconds) => void;
};

export function ClockFace({ day, project, now, dial, size, onOpen }: Props) {
  const t = useT();
  const sizing = CLOCK_SIZE[size];
  const segments = useMemo(() => daySegments(day, now), [day, now]);
  const activities = useMemo(() => activityIntervals(day, now), [day, now]);

  // A second hand that is told the time an hour after it last heard it
  // would spend a second spinning to catch up. Remember what it was last
  // told, and when the difference is not a tick, let the hands jump. Read
  // and written during render on purpose: the answer is needed for this
  // paint, not the next one.
  const last = useRef<Seconds | null>(null);
  const jump =
    last.current === null || now - last.current > 2 || now < last.current;
  last.current = now;

  const bands = useMemo<Band[]>(() => {
    const out: Band[] = [];
    for (const s of segments) {
      const colour =
        s.kind === "break" ? "var(--color-flag)" : "var(--color-accent)";
      out.push({
        start: s.start,
        end: Math.min(s.end, now),
        fill: colour,
        edge: colour,
      });
    }
    for (const a of activities) {
      out.push({
        start: a.start,
        end: a.end,
        fill: categoryColor(project, a.categoryId),
      });
    }
    for (const s of segments) {
      // The tail of a break that has not been lived yet: assumed, so drawn
      // as half a claim.
      if (s.end > now) {
        out.push({
          start: now,
          end: s.end,
          fill: "var(--color-flag)",
          edge: "var(--color-flag)",
          opacity: 0.4,
        });
      }
    }
    return out;
  }, [segments, activities, project, now]);

  // One chip per break end, in the order of the dial, dropping any that would
  // land on top of the one before it.
  const labels = useMemo(() => {
    const out: { at: Seconds; angle: number; typeId: string | null }[] = [];
    for (const s of segments) {
      if (s.kind !== "break" || s.running) continue;
      const angle = angleOf(s.end);
      if (out.some((l) => gap(l.angle, angle) < sizing.labelGap)) continue;
      out.push({ at: s.end, angle, typeId: s.typeId });
    }
    return out.map((l) => {
      const [x, y] = polar(DIAL_BOX / 2, DIAL_BOX / 2, LABEL_R, l.angle);
      return { ...l, left: (x / DIAL_BOX) * 100, top: (y / DIAL_BOX) * 100 };
    });
  }, [segments, sizing.labelGap]);

  return (
    <div className={`relative mx-auto w-full ${sizing.maxWidth}`}>
      <Dial
        id="today"
        dial={dial}
        now={now}
        bands={bands}
        live
        jump={jump}
        className="app-clock block h-auto w-full"
      >
        <title>{t("today.clockLabel")}</title>
        <desc>{t("today.clockDesc")}</desc>
      </Dial>

      {/* The dial is the button. It sits over the drawing rather than around
          it so the chips below stay on top of it. */}
      <button
        type="button"
        aria-label={t("today.openTimeline")}
        onClick={() => onOpen()}
        className="absolute inset-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />

      {labels.map((l) => (
        <button
          key={l.at}
          type="button"
          onClick={() => onOpen(l.at)}
          style={{ left: `${l.left}%`, top: `${l.top}%` }}
          aria-label={t("today.breakEndLabel", {
            name: l.typeId ? breakName(t, project, l.typeId) : "",
            time: formatTimeOfDay(l.at),
          })}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-flag/50 bg-surface-2 px-1.5 py-0.5 text-[0.625rem] leading-none font-bold text-flag tabular-nums shadow-sm"
        >
          {formatTimeOfDay(l.at)}
        </button>
      ))}
    </div>
  );
}

/** The shorter way round the dial between two angles, in degrees. */
function gap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
