// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { framePath } from "./clock.ts";

// The timer's border, drawn as the day's progress.
//
// The card that holds the timer had a border and a percentage beside the
// figure; this is both of those at once. The stroke starts at the top edge's
// middle — twelve o'clock, where a dial starts — and runs clockwise, meeting
// itself back at the top when the day's target is reached. Past it, a second
// lap in the flag colour goes round over the first: overtime is not a bigger
// number here, it is the frame overshooting.
//
// The box is measured rather than guessed, so the stroke follows the card's
// own corners whatever the copy inside does to its height. `pathLength="1"`
// turns the dash array into a plain fraction of the way round, so nothing
// here has to know how long the curve is.

/** The card's corner radius (`rounded-2xl`, see `styles.css`) in pixels, and
 *  the two stroke weights: the groove the day has not reached yet, and the
 *  part of it that has been worked. */
const RADIUS = 28;
const TRACK_WIDTH = 1.5;
const FILL_WIDTH = 4;

type Props = {
  /** Worked over target. 1 is the day done; above 1 is overtime. */
  fraction: number;
  /** The frame's own colours, so a break can tint the card it wraps. */
  tone: "accent" | "flag";
  children: ReactNode;
};

export function ProgressFrame({ fraction, tone, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setBox({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const done = Math.max(0, Math.min(1, fraction));
  const over = Math.max(0, Math.min(1, fraction - 1));
  const d = framePath(box.w, box.h, RADIUS, FILL_WIDTH / 2);

  return (
    <div
      ref={ref}
      className={`relative rounded-2xl px-4 py-3 text-center ${
        tone === "flag" ? "bg-flag/10" : "bg-accent/10"
      }`}
    >
      {d && (
        <svg
          viewBox={`0 0 ${box.w} ${box.h}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d={d}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={TRACK_WIDTH}
          />
          {done > 0 && (
            <path
              d={d}
              fill="none"
              pathLength={1}
              strokeDasharray={`${done} 1`}
              stroke="var(--color-accent)"
              strokeWidth={FILL_WIDTH}
              strokeLinecap="round"
            />
          )}
          {/* The overshoot starts from the top again, over the lap below it. */}
          {over > 0 && (
            <path
              d={d}
              fill="none"
              pathLength={1}
              strokeDasharray={`${over} 1`}
              stroke="var(--color-flag)"
              strokeWidth={FILL_WIDTH}
              strokeLinecap="round"
            />
          )}
        </svg>
      )}
      {children}
    </div>
  );
}
