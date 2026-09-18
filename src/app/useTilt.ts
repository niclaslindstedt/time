// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useRef, useState } from "react";

import { AMBIENT, tiltLight, type Light } from "./sheen.ts";

// The light on the dial's metal, moved by the device holding it.
//
// `sheen.ts` draws every applied part from a light standing somewhere over
// the crystal, and with the phone in your hand that light is a real one in a
// real room: turn the phone and the reflection slides, because the metal has
// turned and the light has not. This is the one place the device's own
// orientation is read, turned into a `Light`, and handed to the dial.
//
// **Nothing about the readings leaves the frame they are drawn in.** They are
// not stored, not persisted, not put in the document and not sent anywhere —
// there is nowhere for them to go. The only thing that survives a reading is
// the angle the next paint uses.
//
// Three things make this quieter than a sensor at sixty hertz:
//
// - The readings are smoothed. A phone at rest on a desk still jitters a
//   degree or two, and a highlight that flickers with it reads as a fault
//   rather than as metal, so each reading is eased towards rather than taken.
// - The state only moves when the light does. A bearing that has shifted
//   less than a degree, or a throw less than a hundredth, is not a repaint —
//   which is what keeps a dial that is lying still on a table as cheap as it
//   was before any of this.
// - With reduced motion asked for, the light does not move at all. A
//   shimmering dial is exactly the kind of thing that setting is for.
//
// Permission is its own small dance. On iOS the sensor is behind
// `DeviceOrientationEvent.requestPermission()`, which only works from a real
// tap — so `requestTilt` is called from the Settings switch, and the answer
// decides whether the switch stays on. Everywhere else there is nothing to
// ask, and `requestTilt` says yes.

/** How much of the way to each new reading one event moves the light: a low
 *  pass, so the hand of a light shakes less than the hand holding it. */
const EASE = 0.18;

/** Under these, a reading has not moved the light enough to be worth a
 *  paint: a degree of bearing, a hundredth of the throw. */
const STEP = { angle: 1, throw: 0.01 };

type Orientation = { beta: number | null; gamma: number | null };

/** Whether this device has anything to read, and whether it will want asking
 *  first. */
export function tiltSupport(): { has: boolean; asks: boolean } {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return { has: false, asks: false };
  }
  return { has: true, asks: typeof request() === "function" };
}

/**
 * Ask for the sensor, from inside the tap that wants it. True when the light
 * may move: granted, or a device that never had anything to grant.
 *
 * iOS throws rather than resolves when this is called outside a gesture,
 * which is a no rather than a crash.
 */
export async function requestTilt(): Promise<boolean> {
  const ask = request();
  if (typeof ask !== "function") return tiltSupport().has;
  try {
    return (await ask()) === "granted";
  } catch {
    return false;
  }
}

/**
 * The light, as the device is holding it. `AMBIENT` — the light a drawn watch
 * is lit by, over the left shoulder — whenever the sensor is off, unasked,
 * unsupported, or motion is not wanted.
 */
export function useTilt(on: boolean): Light {
  const [light, setLight] = useState<Light>(AMBIENT);
  // What the readings have eased to, and what the last paint was told: both
  // outside React, because they change far more often than the dial does.
  const lean = useRef({ beta: 0, gamma: 0 });
  const shown = useRef<Light>(AMBIENT);

  useEffect(() => {
    if (!on || !tiltSupport().has || reducedMotion()) {
      lean.current = { beta: 0, gamma: 0 };
      shown.current = AMBIENT;
      setLight(AMBIENT);
      return;
    }

    const read = (event: Event) => {
      const { beta, gamma } = event as DeviceOrientationEvent & Orientation;
      if (beta === null || gamma === null) return;
      lean.current = {
        beta: ease(lean.current.beta, beta),
        gamma: ease(lean.current.gamma, gamma),
      };
      const next = tiltLight(lean.current.beta, lean.current.gamma);
      if (!moved(shown.current, next)) return;
      shown.current = next;
      setLight(next);
    };

    window.addEventListener("deviceorientation", read);
    return () => window.removeEventListener("deviceorientation", read);
  }, [on]);

  return light;
}

/** One reading, eased towards rather than taken. */
function ease(from: number, to: number): number {
  return from + (to - from) * EASE;
}

/** Whether the light has moved enough to be worth a paint. */
function moved(from: Light, to: Light): boolean {
  const turn = Math.abs(((to.angle - from.angle + 540) % 360) - 180);
  return turn >= STEP.angle || Math.abs(to.throw - from.throw) >= STEP.throw;
}

/** iOS's gate, when there is one. */
function request():
  (() => Promise<"granted" | "denied" | "prompt">) | undefined {
  const type = window.DeviceOrientationEvent as
    | (typeof window.DeviceOrientationEvent & {
        requestPermission?: () => Promise<"granted" | "denied" | "prompt">;
      })
    | undefined;
  return type?.requestPermission?.bind(type);
}

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
