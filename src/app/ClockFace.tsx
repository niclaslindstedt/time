// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import {
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";

import { daySegments, type DaySegment } from "./day.ts";
import {
  SIGNATURE,
  angleOf,
  dialLayout,
  polar,
  ringHit,
  timesAt,
} from "./clock.ts";
import { DIAL_BOX, Dial, type Band } from "./Dial.tsx";
import { formatTimeOfDay } from "./format.ts";
import { useT } from "./i18n/index.ts";
import { breakName, categoryColor, categoryName } from "./labels.ts";
import {
  BACKLIGHT_COLOR,
  CLOCK_SIZE,
  glowGeometry,
  type Backlight,
  type ClockSize,
  type DialConfig,
} from "./look.ts";
import { useTilt } from "./useTilt.ts";
import type { DayState } from "./day.ts";
import type { Project, Seconds, WorkDay } from "./types.ts";

// The Today screen's clock: a wrist watch's dial with the day drawn on it,
// and the switch the day is started and stopped with.
//
// The day is one ring. Time at work is the accent — a band, and a thin line
// along its outer edge. A kind of work takes the band in its own hue (the
// one the chips and the report's charts use, see `labels.ts`) and leaves the
// thin line the accent, so "at work" and "at what" are read from one ring
// rather than two. A break is the flag colour, band and line both. The hands
// are the watch's, so the arc ending under the minute hand is the stretch
// you are in. The bezel is the day's progress against its target (see
// `Dial.tsx`), and the light behind the case says whether the day is being
// counted: it beats while you work, holds low on a break, and is off when
// you are not working. Its colour, its beat, how bright it is and how far it
// reaches are the backlight settings (`look.ts`).
//
// The face is the button. Pressing it starts the day, and pressing it again
// stops it — there is no other switch, the way a watch has no other crown.
// The ring is the exception: a press on one of the day's stretches opens the
// day stretch by stretch at that moment, because a stretch is a thing you
// correct rather than a thing you switch. The break-end chips on the rim do
// the same for the end they print, since a break is written down with the
// end its kind is assumed to have (see `takeBreak`) and that end is a guess.
//
// Everything is derived from the day's spans (see `day.ts`); the face holds
// no state of its own and re-renders as the second ticks. The part of a
// break that has not happened yet — the tail between now and its assumed
// end — is drawn at half strength, because it is a plan rather than a record.
//
// Come back to a tab that has been asleep and the day is not on the ring
// before the hands get there: the watch is wound, and the bands are filled in
// under the hands as they sweep round to now (`Dial.tsx`, `windMoment`). The
// tail of a break is marked `ahead` so it starts where the hands have reached
// rather than at a now they are still winding towards.
//
// Under a mouse the ring answers the pointer too. Resting on a stretch says
// what it was and when — the name a legend would have given the colour, and
// the times the Log would have listed — so the dial reads without either.
// The right button opens the day's actions where the pointer is (`onMenu`,
// the Today screen's menu). A finger cannot rest on anything, so the phone
// keeps the legend.
//
// The dial carries the app's name and the Settings cog too, printed where a
// watch prints its maker and its date (see `Dial.tsx`), so the Today screen
// needs no bar over it for either: the cog's button is laid over the window
// here, above the switch, the way the chips are.
//
// The light needs room. It is a disc inflated past the case by the spread,
// and on a phone the case sits near the top of a screen that clips at its
// edge — so the face keeps that much clear above the dial, as a share of
// its own width, and the halo is whole rather than cut flat where the
// screen begins. A desk centres the dial in a row with air round it and
// keeps the room for the row.
//
// What the watch looks like — its face, its markers, its numerals, how its
// second hand moves — is the dial the settings resolved (see `look.ts`); the
// drawing itself is `Dial.tsx`, shared with the settings' previews.

/** Where the break-end chips sit: on the bezel, as a percentage of the box,
 *  so they are HTML buttons over the SVG rather than text inside it — a chip
 *  is a tap target and wants a real button under the finger. */
const LABEL_R = 118;

/** How far off the ring's edge a pointer may rest and still be on it, in
 *  dial units. A stroke is easier to point at than to hit. */
const RING_SLACK = 3;

type Props = {
  day: WorkDay;
  project: Project;
  now: Seconds;
  state: DayState;
  dial: DialConfig;
  size: ClockSize;
  backlight: Backlight;
  /** Whether the light on the metal follows the device: the dial the app is
   *  actually held in front of, rather than the still one in Settings. */
  reflect: boolean;
  /** Worked over target, for the bezel. */
  progress: number;
  /** The face pressed: start the day, or stop it. */
  onToggle: () => void;
  /** Open the day's stretches, optionally at the moment that was pressed. */
  onOpen: (at?: Seconds) => void;
  /** The right button, at a point in the window. Left out, the browser's
   *  own menu opens instead. */
  onMenu?: (x: number, y: number) => void;
  /** The cog in the window above six. */
  onOpenSettings: () => void;
  /** Whether Settings is open — the desk's panel — which lights the cog. */
  settingsOpen?: boolean;
};

/** What the pointer is resting on: the stretch, and where the card hangs. */
type Reading = { segment: DaySegment; left: number; top: number };

export function ClockFace({
  day,
  project,
  now,
  state,
  dial,
  size,
  backlight,
  reflect,
  progress,
  onToggle,
  onOpen,
  onMenu,
  onOpenSettings,
  settingsOpen = false,
}: Props) {
  const t = useT();
  const sizing = CLOCK_SIZE[size];
  const segments = useMemo(() => daySegments(day, now), [day, now]);
  const layout = useMemo(() => dialLayout(dial), [dial]);
  const box = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState<Reading | null>(null);

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
    for (const s of segments) {
      if (s.kind === "work" && s.typeId) {
        out.push({
          start: s.start,
          end: Math.min(s.end, now),
          fill: categoryColor(project, s.typeId),
        });
      }
    }
    for (const s of segments) {
      // The tail of a break that has not been lived yet: assumed, so drawn
      // as half a claim. The whole stretch goes over as `ahead` and the dial
      // cuts it at the moment it stands at — now, or wherever a wind has got
      // to, so the record grows into the plan instead of over it.
      if (s.end > now) {
        out.push({
          start: s.start,
          end: s.end,
          fill: "var(--color-flag)",
          edge: "var(--color-flag)",
          opacity: 0.4,
          ahead: true,
        });
      }
    }
    return out;
  }, [segments, project, now]);

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

  // A point in the window, to the stretch of the day drawn under it: into
  // the dial's own coordinates, to the angle it is at on the ring, to the
  // stretch the day has at one of the times that angle stands for. Nothing
  // over the face or the bezel.
  const stretchAt = (
    clientX: number,
    clientY: number,
  ): { segment: DaySegment; left: number; top: number } | null => {
    const el = box.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return null;
    const left = clientX - rect.left;
    const top = clientY - rect.top;
    const scale = DIAL_BOX / rect.width;
    const angle = ringHit(left * scale, top * scale, layout, RING_SLACK);
    if (angle === null) return null;
    const segment = segments.find((s) =>
      timesAt(angle).some((at) => at >= s.start && at < s.end),
    );
    return segment ? { segment, left, top } : null;
  };

  const read = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const hit = stretchAt(e.clientX, e.clientY);
    if (hit) setReading(hit);
    else if (reading) setReading(null);
  };

  // The face, or a stretch on the ring. A keyboard's press has no point on
  // the dial, and is the face.
  const press = (e: MouseEvent<HTMLButtonElement>) => {
    const hit = e.detail > 0 ? stretchAt(e.clientX, e.clientY) : null;
    if (hit) {
      onOpen(hit.segment.running ? hit.segment.start : hit.segment.end);
      return;
    }
    onToggle();
  };

  const readingLabel = (s: DaySegment) =>
    s.kind === "break"
      ? s.typeId
        ? breakName(t, project, s.typeId)
        : t("today.legend.break")
      : s.typeId
        ? categoryName(t, project, s.typeId)
        : t("today.legend.work");

  const glow =
    state === "break" ? "var(--color-flag)" : BACKLIGHT_COLOR[backlight.color];
  const halo = glowGeometry(backlight.spread);
  // The light the metal is drawn under: the room's, read off the device, or
  // the still one a drawn watch is lit by when that is switched off.
  const light = useTilt(reflect);
  const switchLabel =
    state === "out" ? t("today.clockIn") : t("today.clockOut");

  return (
    <div className={`mx-auto w-full ${sizing.maxWidth} lg:max-w-none`}>
      {/* The light's room above the case: the same share of the dial's
          width the disc is inflated by, so however far the spread reaches
          the halo is not cut flat at the top of the screen. A percentage
          of the width, which is what a padding in percent is measured
          against. The desk has the row's own air. */}
      <div
        aria-hidden="true"
        className="lg:hidden"
        style={{ paddingTop: `${halo.inset}%` }}
      />
      <div
        ref={box}
        onPointerMove={read}
        onPointerLeave={() => setReading(null)}
        onContextMenu={(e) => {
          if (!onMenu) return;
          e.preventDefault();
          onMenu(e.clientX, e.clientY);
        }}
        className="relative w-full"
      >
        {/* The light behind the case. Drawn first so everything else sits
          over it; its colour, beat, strength and reach are the settings' —
          the reach as the four numbers `glowGeometry` makes of the spread,
          because where the gradient holds and fades depends on how far it
          is inflated (see `look.ts`). */}
        <div
          aria-hidden="true"
          data-state={state}
          data-beat={backlight.hz > 0 ? "on" : "off"}
          className="app-glow"
          style={
            {
              "--glow-color": glow,
              "--glow-alpha": backlight.intensity / 100,
              "--glow-period": backlight.hz > 0 ? `${1 / backlight.hz}s` : "1s",
              "--glow-inset": `${halo.inset}%`,
              "--glow-hold": `${halo.hold}%`,
              "--glow-fade": `${halo.fade}%`,
              "--glow-blur": `${halo.blur}px`,
            } as Record<string, string | number>
          }
        />

        <Dial
          id="today"
          dial={dial}
          now={now}
          bands={bands}
          progress={progress}
          light={light}
          live
          className="app-clock relative block h-auto w-full"
        >
          <title>{t("today.clockLabel")}</title>
          <desc>{t("today.clockDesc")}</desc>
        </Dial>

        {/* The dial is the button. It sits over the drawing rather than around
          it so the chips below stay on top of it. */}
        <button
          type="button"
          aria-label={switchLabel}
          aria-pressed={state !== "out"}
          title={switchLabel}
          onClick={press}
          className="absolute inset-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />

        {/* The cog, over the window the dial paints it in. A real button in
          rem rather than a hit area scaled with the drawing, so it is a
          thumb's target on a small dial too. */}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t("nav.settings")}
          aria-expanded={settingsOpen}
          title={t("nav.settings")}
          style={{
            left: "50%",
            top: `${((DIAL_BOX / 2 + SIGNATURE.window) / DIAL_BOX) * 100}%`,
          }}
          className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />

        {reading && (
          <div
            role="tooltip"
            style={{ left: reading.left, top: reading.top }}
            className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] items-center gap-2 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-xs whitespace-nowrap text-fg shadow-md"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                background:
                  reading.segment.kind === "break"
                    ? "var(--color-flag)"
                    : reading.segment.typeId
                      ? categoryColor(project, reading.segment.typeId)
                      : "var(--color-accent)",
              }}
            />
            <span className="font-semibold text-fg-bright">
              {readingLabel(reading.segment)}
            </span>
            <span className="text-muted tabular-nums">
              {t("log.span", {
                start: formatTimeOfDay(reading.segment.start),
                end: formatTimeOfDay(
                  reading.segment.running ? now : reading.segment.end,
                ),
              })}
            </span>
          </div>
        )}

        {labels.map((l) => {
          const label = t("today.breakEndLabel", {
            name: l.typeId ? breakName(t, project, l.typeId) : "",
            time: formatTimeOfDay(l.at),
          });
          return (
            <button
              key={l.at}
              type="button"
              onClick={() => onOpen(l.at)}
              style={{ left: `${l.left}%`, top: `${l.top}%` }}
              aria-label={label}
              title={label}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-flag/50 bg-surface-2 px-1.5 py-0.5 text-[0.625rem] leading-none font-bold text-flag tabular-nums shadow-sm"
            >
              {formatTimeOfDay(l.at)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The shorter way round the dial between two angles, in degrees. */
function gap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
