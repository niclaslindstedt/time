// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useRef, useState } from "react";

// Focus mode: the phone laid down and left alone, where the app stops being
// an app and is a clock.
//
// The stand (`shape.ts`) is the one shape meant to be *left* — propped
// against something on the desk with the watch on it, glanced at across a
// room rather than held. A little while after the last touch nobody is
// reading the four tabs or the list of breaks; they are reading the time and
// the day on the ring. So everything but the watch fades out, and the first
// touch anywhere brings the lot back — for longer than the screen waited the
// first time, because a touch is somebody asking for the controls and asking
// for them is asking for time to use them (`FOCUS_AGAIN_MS`).
//
// Nothing is *removed* — the controls keep their room and the dial keeps its
// size and its place, because a watch that grew when the tabs went away would
// be a second thing moving on a screen whose whole argument is quiet. They
// fade to nothing, and the whole screen stops taking a press while they are
// gone (`[data-focus="on"]` in `styles.css`).
//
// The press that wakes it is spent on waking it, and that takes both halves:
// the stylesheet keeps the press itself off the controls, and the click it
// would turn into is eaten here. Without the second half the tap lands on
// whatever has come back between the finger going down and coming up — and
// on a screen showing nothing but a watch, the thing under the finger is the
// middle of the watch, which is the switch. Waking the screen to look at the
// day is not clocking out of it.
//
// It is not the keyboard's focus, and nothing here touches it. A key is one
// of the things that counts as being touched, so a Tab into a faded control
// has already brought it back before it gets there.

/** How long the screen stands untouched before the watch is left to itself.
 *  Long enough that reading the day's controls does not race a fade, short
 *  enough that a phone put down is a clock by the time you have looked up. */
export const FOCUS_AFTER_MS = 8000;

/** And how long once it has been woken out of it, which is longer. The first
 *  fade is the screen going quiet on a phone nobody has touched; every fade
 *  after it follows somebody asking to see the controls, and asking for them
 *  is asking for time to use them — a break to pick out of three, a kind of
 *  work to read the name of. It is the same dwell from then on, until the
 *  phone is picked up or the screen is left. */
export const FOCUS_AGAIN_MS = 15000;

/** What counts as someone being there: a press, a key or a scroll — the
 *  things a person does on purpose. A pointer merely moving over the screen
 *  is not one, because on this shape there is no pointer to move. */
const TOUCHES = [
  "pointerdown",
  "keydown",
  "wheel",
] as const satisfies readonly (keyof WindowEventMap)[];

/**
 * Whether the screen has been left alone long enough to be a clock.
 *
 * `enabled` is the shape and the screen together — the stand, on Today. Turn
 * it off and the answer is no, whatever the timer was doing, so a phone
 * stood back up arrives with everything on it.
 */
export function useFocus(enabled: boolean): boolean {
  const [quiet, setQuiet] = useState(false);
  /** The same answer as `quiet`, for the listeners — they are bound once and
   *  outlive the render that knows it. */
  const asleep = useRef(false);
  /** Whether the click on its way belongs to the press that woke the screen,
   *  and so is nobody's. */
  const waking = useRef(false);
  /** Whether the screen has been woken out of focus mode since it was
   *  arrived at, which is what buys the longer dwell. */
  const woken = useRef(false);

  useEffect(() => {
    if (!enabled) {
      asleep.current = false;
      waking.current = false;
      woken.current = false;
      setQuiet(false);
      return;
    }
    let timer = 0;
    const sleep = () => {
      asleep.current = true;
      setQuiet(true);
    };
    const touched = (event?: Event) => {
      // A press on a sleeping screen is the wake and nothing else; one on a
      // waking screen is somebody pressing something, so the eater stands
      // down again.
      if (event?.type === "pointerdown") waking.current = asleep.current;
      if (asleep.current) woken.current = true;
      asleep.current = false;
      setQuiet(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(
        sleep,
        woken.current ? FOCUS_AGAIN_MS : FOCUS_AFTER_MS,
      );
    };
    // Captured at the window, which is ahead of every handler in the page,
    // and only ever the one click.
    const eat = (event: MouseEvent) => {
      if (!waking.current) return;
      waking.current = false;
      event.stopPropagation();
      event.preventDefault();
    };
    // The phone has just been laid down, which is a touch in itself.
    touched();
    for (const event of TOUCHES) {
      window.addEventListener(event, touched, { passive: true });
    }
    window.addEventListener("click", eat, true);
    return () => {
      window.clearTimeout(timer);
      for (const event of TOUCHES) {
        window.removeEventListener(event, touched);
      }
      window.removeEventListener("click", eat, true);
    };
  }, [enabled]);

  return enabled && quiet;
}
