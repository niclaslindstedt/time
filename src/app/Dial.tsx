// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { ReactNode } from "react";

import {
  BEZEL_R,
  BEZEL_WIDTH,
  DIAL_HOURS,
  DIAL_R,
  HANDS,
  RING_BAND,
  RING_EDGE,
  ROMAN_HOURS,
  TRACK_R,
  arcPath,
  dialLayout,
  handTurns,
  polar,
} from "./clock.ts";
import {
  DIAL_FACE,
  DIAL_FONT,
  DIAL_MARKERS,
  isNumeral,
  type DialConfig,
} from "./look.ts";
import type { Seconds } from "./types.ts";

// The dial, drawn: a wrist watch's face with the day laid over it.
//
// This is the paint and nothing else. What the day is made of comes in as
// `bands` — already resolved to colours by whoever draws it, so the same
// picture serves the Today screen (a live day, a ticking `now`) and the
// settings' preset cards (an invented morning, hands stopped at ten past
// ten). The vocabulary — that a break is the flag colour, that a kind of work
// is the hue the report gave it — stays in `ClockFace`; the geometry is in
// `clock.ts`, where it is tested.
//
// From the back forward: the bezel, the face (a radial gradient, because a
// sunburst finish is one), the minute track on the rim, the groove the day's
// ring sits in, the day itself, the hour markers, and the hands over
// everything with a shadow under them — the one thing that makes a flat
// drawing read as a watch rather than a chart. The markers are drawn once at
// twelve o'clock and rotated into place, which is how they are made too.
//
// The hands do not move here. Each is a group with a CSS rotation, and the
// *transition* on that rotation — a step, eight steps, or a glide — is the
// movement, set in `styles.css` against the `data-movement` attribute. A
// dial that is not `live` sets none and its hands simply are where they are.

export const DIAL_BOX = 240;
const C = DIAL_BOX / 2;

/** A stretch of the day on the ring, in the colours it is drawn in. `edge`
 *  is the thin line along the outside; a band without one leaves the line
 *  under it alone, which is how a kind of work colours the band and leaves
 *  the line the accent. */
export type Band = {
  start: Seconds;
  end: Seconds;
  fill: string;
  edge?: string;
  opacity?: number;
};

type Props = {
  dial: DialConfig;
  now: Seconds;
  bands: Band[];
  /** The hands move between renders — the Today screen's clock. A preview
   *  leaves it off and gets a still. */
  live?: boolean;
  /** True when the time jumped rather than ticked — the tab woke up, or
   *  midnight — so the hands go straight there instead of spinning round. */
  jump?: boolean;
  /** Distinct per dial on the page, because the gradient is referenced by
   *  id and two dials with one id would share one face. */
  id: string;
  className?: string;
  /** The accessible name and description, as `<title>` / `<desc>` children,
   *  or nothing for a dial that is decoration. */
  children?: ReactNode;
  ariaHidden?: boolean;
};

export function Dial({
  dial,
  now,
  bands,
  live = false,
  jump = false,
  id,
  className,
  children,
  ariaHidden,
}: Props) {
  const face = DIAL_FACE[dial.face];
  const font = DIAL_FONT[dial.font];
  const style = DIAL_MARKERS[dial.markers];
  const layout = dialLayout(dial);
  const turns = handTurns(now);
  // The facet along an applied marker and a hand: a lighter line down a dark
  // one, a darker line down a light one, so they read as metal with an edge
  // rather than as print.
  const facet = face.dark ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.4)";
  const faceId = `${id}-face`;
  const sheenId = `${id}-sheen`;
  const shadowId = `${id}-shadow`;

  const ticks = style.minuteTrack
    ? Array.from({ length: 60 }, (_, i) => {
        const hour = i % 5 === 0;
        const length = hour ? 4.5 : 2.5;
        const [x1, y1] = polar(C, C, TRACK_R - length, i * 6);
        const [x2, y2] = polar(C, C, TRACK_R, i * 6);
        return { x1, y1, x2, y2, hour };
      })
    : [];

  const markers = DIAL_HOURS.map((hour) => ({
    hour,
    angle: (hour % 12) * 30,
    kind: style.at(hour % 12),
  }));

  return (
    <svg
      viewBox={`0 0 ${DIAL_BOX} ${DIAL_BOX}`}
      className={className}
      role={ariaHidden ? undefined : "img"}
      aria-hidden={ariaHidden ? "true" : undefined}
      data-movement={live ? dial.movement : undefined}
    >
      {children}
      <defs>
        <radialGradient id={faceId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={face.dial} />
          <stop offset="70%" stopColor={face.dial} />
          <stop offset="100%" stopColor={face.edge} />
        </radialGradient>
        <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1"
            floodColor="#000"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* The case: the bezel, and the step down onto the face. */}
      <circle
        cx={C}
        cy={C}
        r={BEZEL_R}
        fill="none"
        stroke={face.bezel}
        strokeWidth={BEZEL_WIDTH}
      />
      <circle cx={C} cy={C} r={DIAL_R} fill={`url(#${faceId})`} />
      <circle cx={C} cy={C} r={DIAL_R} fill={`url(#${sheenId})`} />
      <circle
        cx={C}
        cy={C}
        r={DIAL_R}
        fill="none"
        stroke={face.ink}
        strokeWidth={0.75}
        opacity={0.18}
      />

      {ticks.map((tick, i) => (
        <line
          key={`t${i}`}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={face.ink}
          strokeWidth={tick.hour ? 1.4 : 0.8}
          opacity={tick.hour ? 0.75 : 0.45}
        />
      ))}

      {/* The groove the day is drawn into, so an empty morning still shows
          where it will go. */}
      <circle
        cx={C}
        cy={C}
        r={layout.bandR}
        fill="none"
        stroke={face.ink}
        strokeWidth={RING_BAND}
        opacity={0.07}
      />
      <circle
        cx={C}
        cy={C}
        r={layout.edgeR}
        fill="none"
        stroke={face.ink}
        strokeWidth={RING_EDGE}
        opacity={0.14}
      />

      {bands.map((b, i) => {
        const band = arcPath(C, C, layout.bandR, b.start, b.end);
        const edge = b.edge
          ? arcPath(C, C, layout.edgeR, b.start, b.end)
          : null;
        return band ? (
          <g key={`b${i}`} opacity={b.opacity}>
            <path
              d={band}
              fill="none"
              stroke={b.fill}
              strokeWidth={RING_BAND}
              strokeLinecap="butt"
            />
            {edge && (
              <path
                d={edge}
                fill="none"
                stroke={b.edge}
                strokeWidth={RING_EDGE}
                strokeLinecap="butt"
              />
            )}
          </g>
        ) : null;
      })}

      {markers.map(({ hour, angle, kind }) => {
        if (isNumeral(kind)) {
          const [x, y] = polar(C, C, layout.markerR, angle);
          return (
            <text
              key={hour}
              x={x}
              y={y}
              dy="0.36em"
              textAnchor="middle"
              fill={face.ink}
              style={{
                fontSize: `${layout.numeralSize}px`,
                fontFamily: font.family,
                fontWeight: font.weight,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {kind === "roman" ? ROMAN_HOURS[hour % 12] : hour}
            </text>
          );
        }
        return (
          <g key={hour} transform={`rotate(${angle} ${C} ${C})`}>
            <Marker
              kind={kind}
              r={layout.markerR}
              length={layout.markerLength}
              width={layout.markerWidth}
              ink={face.ink}
              facet={facet}
            />
          </g>
        );
      })}

      <g filter={`url(#${shadowId})`} data-jump={jump ? "" : undefined}>
        <g data-hand="hour" style={hand(turns.hour)}>
          <line
            x1={C}
            y1={C + 5}
            x2={C}
            y2={C - layout.hands.hour}
            stroke={face.ink}
            strokeWidth={HANDS.hour}
            strokeLinecap="round"
          />
          <line
            x1={C}
            y1={C - 2}
            x2={C}
            y2={C - layout.hands.hour + 3}
            stroke={facet}
            strokeWidth={HANDS.hour * 0.3}
            strokeLinecap="round"
          />
        </g>
        <g data-hand="minute" style={hand(turns.minute)}>
          <line
            x1={C}
            y1={C + 5}
            x2={C}
            y2={C - layout.hands.minute}
            stroke={face.ink}
            strokeWidth={HANDS.minute}
            strokeLinecap="round"
          />
          <line
            x1={C}
            y1={C - 2}
            x2={C}
            y2={C - layout.hands.minute + 3}
            stroke={facet}
            strokeWidth={HANDS.minute * 0.3}
            strokeLinecap="round"
          />
        </g>
        <g data-hand="second" style={hand(turns.second)}>
          <line
            x1={C}
            y1={C + HANDS.tail}
            x2={C}
            y2={C - layout.hands.second}
            stroke={face.ink}
            strokeWidth={HANDS.second}
            strokeLinecap="round"
          />
          <circle cx={C} cy={C + HANDS.tail * 0.7} r={2.2} fill={face.ink} />
        </g>
        <circle cx={C} cy={C} r={HANDS.cap} fill={face.ink} />
        <circle cx={C} cy={C} r={1.1} fill={face.dial} />
      </g>
    </svg>
  );
}

/** A hand's rotation, about the dial's centre. The origin is in user units
 *  of the viewBox, which is what an SVG element's transform origin is
 *  measured in. */
function hand(degrees: number) {
  return {
    transform: `rotate(${degrees}deg)`,
    transformOrigin: `${C}px ${C}px`,
  };
}

/** One applied marker, drawn at twelve o'clock — the caller rotates it.
 *  `r` is the marker's centre, `length` its extent along the radius and
 *  `width` across it. */
function Marker({
  kind,
  r,
  length,
  width,
  ink,
  facet,
}: {
  kind: "baton" | "doubleBaton" | "dot" | "triangle" | "wedge" | "tick";
  r: number;
  length: number;
  width: number;
  ink: string;
  facet: string;
}) {
  const top = C - r - length / 2;
  const bottom = C - r + length / 2;
  switch (kind) {
    case "baton":
      return (
        <Baton
          x={C}
          top={top}
          bottom={bottom}
          w={width}
          ink={ink}
          facet={facet}
        />
      );
    case "doubleBaton":
      return (
        <>
          <Baton
            x={C - width * 0.9}
            top={top}
            bottom={bottom}
            w={width}
            ink={ink}
            facet={facet}
          />
          <Baton
            x={C + width * 0.9}
            top={top}
            bottom={bottom}
            w={width}
            ink={ink}
            facet={facet}
          />
        </>
      );
    case "tick":
      return (
        <rect
          x={C - width * 0.3}
          y={top}
          width={width * 0.6}
          height={length * 0.55}
          fill={ink}
        />
      );
    case "dot":
      return (
        <>
          <circle cx={C} cy={C - r} r={length * 0.32} fill={ink} />
          <circle
            cx={C}
            cy={C - r}
            r={length * 0.32 - width * 0.35}
            fill="none"
            stroke={facet}
            strokeWidth={width * 0.35}
          />
        </>
      );
    case "triangle":
      return (
        <polygon
          points={`${C - length * 0.48},${top} ${C + length * 0.48},${top} ${C},${bottom}`}
          fill={ink}
        />
      );
    case "wedge":
      return (
        <>
          <polygon
            points={`${C - width * 0.9},${top} ${C + width * 0.9},${top} ${C},${bottom}`}
            fill={ink}
          />
          <line
            x1={C}
            y1={top + 1}
            x2={C}
            y2={bottom - 1}
            stroke={facet}
            strokeWidth={width * 0.3}
          />
        </>
      );
  }
}

function Baton({
  x,
  top,
  bottom,
  w,
  ink,
  facet,
}: {
  x: number;
  top: number;
  bottom: number;
  w: number;
  ink: string;
  facet: string;
}) {
  return (
    <>
      <rect x={x - w / 2} y={top} width={w} height={bottom - top} fill={ink} />
      <line
        x1={x}
        y1={top + 0.5}
        x2={x}
        y2={bottom - 0.5}
        stroke={facet}
        strokeWidth={w * 0.3}
      />
    </>
  );
}
