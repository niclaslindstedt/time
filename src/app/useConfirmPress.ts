// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useRef, useState } from "react";

// A button that asks before it acts, without raising a card in front of it.
// The first press arms the button — its label says what the next press will
// do — and the second press does it. A dialog over a sheet to ask one
// question is a second card the eye has to find; armed, it is the same two
// presses on the same button, and the thing being deleted stays on the
// screen behind them.
//
// What keeps it from being an accident is that it does not stay armed: the
// wait below disarms it, and so does looking away from it, so the press that
// lands on the button a minute later is a first press again.

/** How long an armed button waits for the second press. Long enough to read
 *  the label it changed to, short enough that a button left alone is safe. */
const DISARM_MS = 3000;

export type ConfirmPress = {
  /** Whether the next press is the one that does it. */
  armed: boolean;
  /** The button's `onClick`. */
  press: () => void;
  /** The button's `onBlur`, and anything else that should call it off. */
  disarm: () => void;
};

export function useConfirmPress(onConfirm: () => void): ConfirmPress {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const disarm = () => {
    clear();
    setArmed(false);
  };
  // A screen left with the button armed leaves no timer behind.
  useEffect(() => clear, []);

  return {
    armed,
    press: () => {
      if (armed) {
        disarm();
        onConfirm();
        return;
      }
      clear();
      setArmed(true);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setArmed(false);
      }, DISARM_MS);
    },
    disarm,
  };
}
