// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useRef, useState, type MutableRefObject } from "react";

import {
  beatTurns,
  handAngles,
  windMoment,
  windPlan,
  windTurns,
  type Turns,
  type WindPlan,
} from "./clock.ts";
import type { Seconds } from "./types.ts";
import { nowExact } from "./useNow.ts";

// The hands of a live dial, driven frame by frame.
//
// Everything else on the Today screen redraws once a second, which is the
// rate the day changes at. The hands are not that. A mechanical calibre beats
// eight times a second and a glide wheel does not stop at all, and neither
// rate survives being chased by a CSS transition off a `setInterval`: the
// interval drifts, a render lands late, and the transition it was meant to
// start in time for starts late too — which the eye reads as the second hand
// hesitating and then hurrying. So the hands come off the render loop
// entirely. This is a `requestAnimationFrame` loop that reads the clock,
// works out where each hand belongs (`beatTurns`), and writes the three
// rotations straight onto the elements. Rounding the clock down to the beat
// rather than counting beats from a start is what keeps the rate exact:
// there is nothing for a late frame to accumulate into.
//
// Two things follow. The dial keeps rendering the rotations it had at mount,
// so React never writes a transform again and never fights the loop. And a
// hand that has not moved is not written, so a quartz dial touches the DOM
// once a second and a mechanical one eight times, however often the loop
// runs.
//
// Rotations go out wrapped into a single turn and rounded to a thousandth of
// a degree, which is not tidiness: a browser keeps six significant figures of
// a CSS number, so an angle counted on from midnight — a second hand is past
// five hundred thousand degrees by the evening — comes back rounded to the
// whole degree, and eight beats of three quarters of a degree land on four of
// them. A hand that only ever has to be somewhere on its own dial does not
// need the turns it has already taken, and nothing here interpolates between
// two rotations, so it does not need them to be continuous either.
//
// The loop also notices the gaps. `requestAnimationFrame` does not run in a
// background tab, so the first frame after one comes back is an hour after
// the frame before it — which is precisely when a watch wants setting. It
// winds (see `clock.ts`), and while it does, the dial is told: the shadow
// under the hands comes off for the duration, because an SVG filter over a
// moving group is re-rastered every frame.
//
// The day is told as well. A wind is not only the hands moving — it is the
// whole dial standing at a moment that is not yet now (`windMoment`), and the
// day drawn on the ring belongs to that moment too. So the loop hands out the
// moment it is winding through, frame by frame, and `shown` holds it for a
// render that lands mid-wind; `null` is the plain answer, the dial at the
// time. Whoever is given it draws the day up to there off the render loop,
// the same way and for the same reason the hands are drawn.
//
// A dial that is not `live` — the previews in Settings — runs none of this
// and simply draws the moment it was handed.

export type Hands = {
  /** The rotations to render. Frozen at mount for a live dial; the loop has
   *  the hands from the first frame. */
  turns: Turns;
  /** True while the watch is being set: no transitions, no shadow. */
  winding: boolean;
  /** The moment the dial stands at while it is being wound, for a render
   *  that lands in the middle of one; `null` when it is at the time. */
  shown: MutableRefObject<Seconds | null>;
  /** Put these on the three hand groups. */
  hour: HandRef;
  minute: HandRef;
  second: HandRef;
};

type HandRef = MutableRefObject<SVGGElement | null>;

export function useHands(
  now: Seconds,
  live: boolean,
  beats: number | null,
  /** Called with the moment the dial has reached, every frame of a wind and
   *  once with `null` when it ends. */
  show?: (at: Seconds | null) => void,
): Hands {
  const hour = useRef<SVGGElement | null>(null);
  const minute = useRef<SVGGElement | null>(null);
  const second = useRef<SVGGElement | null>(null);

  /** What the dial paints, and what the loop last wrote. They start as the
   *  same thing — the moment the dial mounted — and then part company, the
   *  first never changing again so that React has nothing to write. */
  const painted = useRef<Turns>(handAngles(now));
  const written = useRef<Turns>({ ...painted.current });

  const [winding, setWinding] = useState(false);

  /** The moment the dial is standing at, and who to tell when it moves. The
   *  callback comes in fresh on every render and the loop outlives them all,
   *  so it is read through a ref rather than closed over. */
  const shown = useRef<Seconds | null>(null);
  const showing = useRef(show);
  showing.current = show;

  useEffect(() => {
    if (!live) return;
    const hands = { hour, minute, second };
    const reveal = (at: Seconds | null) => {
      shown.current = at;
      showing.current?.(at);
    };
    /** The moment the hands last kept time at — not during a wind, when the
     *  hands are somewhere between two times rather than at one. */
    let kept: Seconds | null = null;
    let wind: { from: Seconds; plan: WindPlan; started: number } | null = null;
    let frame = 0;

    const step = () => {
      frame = requestAnimationFrame(step);
      const at = nowExact();

      if (wind) {
        const elapsed = performance.now() - wind.started;
        put(
          hands,
          written,
          windTurns(wind.from, at, elapsed, wind.plan, beats),
        );
        if (elapsed < wind.plan.total) {
          reveal(windMoment(wind.from, at, elapsed, wind.plan));
          return;
        }
        wind = null;
        kept = at;
        reveal(null);
        setWinding(false);
        return;
      }

      // A frame an hour after the last one: the tab was asleep. Wind, unless
      // motion has been asked to stay out of it.
      if (kept !== null && !reducedMotion()) {
        const plan = windPlan(kept, at);
        if (plan) {
          wind = { from: kept, plan, started: performance.now() };
          setWinding(true);
          put(hands, written, windTurns(kept, at, 0, plan, beats));
          reveal(windMoment(kept, at, 0, plan));
          return;
        }
      }

      kept = at;
      put(hands, written, beatTurns(at, beats));
    };

    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      // A dial taken off mid-wind is a dial at the time again: whatever is
      // drawing the day has to be told, or it keeps the moment the wind was
      // interrupted at.
      if (shown.current !== null) reveal(null);
    };
  }, [live, beats]);

  return {
    turns: live ? painted.current : handAngles(now),
    winding,
    shown,
    hour,
    minute,
    second,
  };
}

/** Write the hands, skipping any that are where they already were. */
function put(
  hands: { hour: HandRef; minute: HandRef; second: HandRef },
  written: MutableRefObject<Turns>,
  to: Turns,
) {
  for (const hand of ["hour", "minute", "second"] as const) {
    const at = onDial(to[hand]);
    if (at === written.current[hand]) continue;
    written.current[hand] = at;
    const el = hands[hand].current;
    if (el) el.style.transform = `rotate(${at}deg)`;
  }
}

/** A rotation as it goes to the DOM: one turn, three decimals. See the note
 *  above on what a browser keeps of a CSS number. Three decimals is a
 *  thousandth of a degree, which on the longest hand here is a thousandth of
 *  a pixel — and rounding to it is also what makes "has it moved?" a question
 *  with an answer, rather than one the last digit of a float decides. */
function onDial(degrees: number): number {
  const turn = ((degrees % 360) + 360) % 360;
  return Math.round(turn * 1000) / 1000;
}

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
