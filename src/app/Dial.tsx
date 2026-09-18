// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { ReactNode } from "react";

import {
  BEZEL_R,
  BEZEL_WIDTH,
  DIAL_HOURS,
  DIAL_R,
  DIAL_SECONDS,
  HANDS,
  RING_BAND,
  RING_EDGE,
  ROMAN_HOURS,
  SIGNATURE,
  TRACK_R,
  arcPath,
  chapterMarks,
  dialLayout,
  polar,
} from "./clock.ts";
import { useT } from "./i18n/index.ts";
import {
  DIAL_FACE,
  DIAL_FONT,
  DIAL_HANDS,
  DIAL_MARKERS,
  DIAL_MOVEMENT,
  DIAL_RING,
  isNumeral,
  type DialConfig,
  type DialHandsSpec,
} from "./look.ts";
import type { Seconds } from "./types.ts";
import { useHands } from "./useHands.ts";

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
// sunburst finish is one), the minute track on the rim, the ring the day is
// drawn on — a faint groove, or the printed chapter ring the day fills, with
// its minutes printed back over the day — the day itself, the hour markers,
// the printing, and the hands over everything with a shadow under them — the
// one thing that makes a flat drawing read as a watch rather than a chart.
// The markers are drawn once at twelve o'clock and rotated into place, which
// is how they are made too.
//
// The printing is what a dial carries besides its hours: the maker's name
// under twelve, with the mark beside it, the movement's word in small
// capitals under that, and a window above six. Here the name is the app's,
// the word is the movement the settings chose — a watch that beats says
// AUTOMATIC on its face, one that steps says QUARTZ — and the window holds
// the Settings cog where a date would be. It is paint: `ClockFace` lays the
// button over the window, the way it lays the switch over the face.
//
// The bezel is also the day's progress. From twelve, clockwise, it fills in
// the accent as the target is worked and closes the loop when the day is
// done; past that a second lap goes round over it in the flag colour, so
// overtime is the bezel overshooting rather than a number. A dial handed no
// `progress` — the previews in Settings — keeps a plain bezel.
//
// The hands do not move here. Each is a group whose rotation `useHands` owns
// — a frame loop rather than a CSS transition, because a movement is a rate
// (one beat a second, or eight, or none at all) and a rate wants a clock, not
// a render. This component only gives the loop somewhere to write, and draws
// the moment it was handed for the first paint. A dial that is not `live` —
// the previews in Settings — has no loop and simply is where it is.
//
// What they are *shaped* like is the set the settings chose: a bar printed in
// the face's ink with a facet down it, or the tapered hand of a dress watch,
// drawn as a shape rather than a stroke and split down its ridge into a lit
// half and a shaded one, so a polished hand carries its own light round the
// dial as it sweeps.

export const DIAL_BOX = 240;
const C = DIAL_BOX / 2;

/** How far a hand's tail reaches past the axle, under the cap: enough that
 *  the hand is pivoted rather than hinged at the centre. */
const HAND_BOSS = 5;

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
  /** Distinct per dial on the page, because the gradient is referenced by
   *  id and two dials with one id would share one face. */
  id: string;
  /** Worked over target, drawn on the bezel: 1 is the day done, above 1
   *  overtime. Left out, the bezel is only a bezel. */
  progress?: number;
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
  id,
  progress,
  className,
  children,
  ariaHidden,
}: Props) {
  const t = useT();
  const face = DIAL_FACE[dial.face];
  const font = DIAL_FONT[dial.font];
  const style = DIAL_MARKERS[dial.markers];
  const ring = DIAL_RING[dial.ring];
  const handSet = DIAL_HANDS[dial.hands];
  const layout = dialLayout(dial);
  const hands = useHands(now, live, DIAL_MOVEMENT[dial.movement].beats);
  const turns = hands.turns;
  // The facet along an applied marker and a hand: a lighter line down a dark
  // one, a darker line down a light one, so they read as metal with an edge
  // rather than as print.
  const facet = face.dark ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.4)";
  // The window's recess: a shade off the face, the way a date disc sits a
  // step below the dial.
  const recess = face.dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
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

  const done = progress === undefined ? 0 : Math.max(0, Math.min(1, progress));
  const over =
    progress === undefined ? 0 : Math.max(0, Math.min(1, progress - 1));
  const doneArc = arcPath(C, C, BEZEL_R, 0, done * DIAL_SECONDS);
  const overArc = arcPath(C, C, BEZEL_R, 0, over * DIAL_SECONDS);

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
      {doneArc && (
        <path
          d={doneArc}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={BEZEL_WIDTH}
          strokeLinecap="round"
        />
      )}
      {overArc && (
        <path
          d={overArc}
          fill="none"
          stroke="var(--color-flag)"
          strokeWidth={BEZEL_WIDTH}
          strokeLinecap="round"
        />
      )}
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

      {/* The ring the day is drawn on: the printed chapter ring in its own
          colour, or the groove the bands lie in, so an empty morning still
          shows where they will go. */}
      {ring.printed ? (
        <circle
          cx={C}
          cy={C}
          r={(layout.ringInner + layout.ringOuter) / 2}
          fill="none"
          stroke={ring.fill ?? face.ink}
          strokeWidth={layout.ringOuter - layout.ringInner + 1}
        />
      ) : (
        <>
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
        </>
      )}

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

      {/* The minutes, printed over the day: a chapter ring keeps its
          numerals whatever the day has painted under them. Turned to lie
          along the ring, and the lower half turned the other way so a 30
          at six is not read upside down. */}
      {ring.printed &&
        chapterMarks().map((m) => {
          if (m.kind === "tick") {
            const [x1, y1] = polar(C, C, layout.ringOuter - 3.5, m.angle);
            const [x2, y2] = polar(C, C, layout.ringOuter - 0.5, m.angle);
            return (
              <line
                key={`m${m.minute}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={ring.ink ?? face.ink}
                strokeWidth={0.7}
                opacity={0.85}
              />
            );
          }
          const [x, y] = polar(C, C, layout.bandR - 0.6, m.angle);
          return (
            <text
              key={`m${m.minute}`}
              x={x}
              y={y}
              dy="0.36em"
              textAnchor="middle"
              transform={`rotate(${m.turn} ${x} ${y})`}
              fill={ring.ink ?? face.ink}
              style={{
                fontSize: "7.4px",
                fontFamily: font.family,
                fontWeight: font.weight,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {m.label}
            </text>
          );
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

      {/* The printing: the mark and the name under twelve, the movement's
          word under them, and the window above six with the cog in it. The
          name is set in the geometric face — wide, spaced capitals, the way
          a maker's name is — and the word in the light one, whatever the
          hours are set in. */}
      <g aria-hidden="true">
        <g
          transform={`translate(${C - 18.4} ${C - SIGNATURE.name - 4}) scale(0.08)`}
          fill="none"
          stroke={face.ink}
          strokeWidth={12}
          strokeLinecap="round"
        >
          <circle cx="50" cy="50" r="34" />
          <path d="M50 50 V28 M50 50 L66 60" />
        </g>
        <text
          x={C - 8.2}
          y={C - SIGNATURE.name}
          dy="0.36em"
          fill={face.ink}
          style={{
            fontSize: `${SIGNATURE.nameSize}px`,
            fontFamily: DIAL_FONT.geometric.family,
            fontWeight: DIAL_FONT.geometric.weight,
            letterSpacing: "0.2em",
          }}
        >
          {t("app.name").toLocaleUpperCase()}
        </text>
        <text
          x={C}
          y={C - SIGNATURE.line}
          dy="0.36em"
          textAnchor="middle"
          fill={face.ink}
          opacity={0.85}
          style={{
            fontSize: `${SIGNATURE.lineSize}px`,
            fontFamily: DIAL_FONT.light.family,
            fontWeight: 400,
            letterSpacing: "0.24em",
          }}
        >
          {t(`today.calibre.${dial.movement}` as const).toLocaleUpperCase()}
        </text>
        <rect
          x={C - SIGNATURE.windowWidth / 2}
          y={C + SIGNATURE.window - SIGNATURE.windowHeight / 2}
          width={SIGNATURE.windowWidth}
          height={SIGNATURE.windowHeight}
          rx={1.4}
          fill={recess}
          stroke={face.ink}
          strokeWidth={0.9}
        />
        <rect
          x={C - SIGNATURE.windowWidth / 2 + 1.1}
          y={C + SIGNATURE.window - SIGNATURE.windowHeight / 2 + 1.1}
          width={SIGNATURE.windowWidth - 2.2}
          height={SIGNATURE.windowHeight - 2.2}
          rx={0.8}
          fill="none"
          stroke={facet}
          strokeWidth={0.6}
        />
        {/* The framework's cog, on its 24-unit grid, at ten units. */}
        <g
          transform={`translate(${C - 5} ${C + SIGNATURE.window - 5}) scale(${10 / 24})`}
          fill="none"
          stroke={face.ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </g>
      </g>

      <g
        filter={`url(#${shadowId})`}
        data-winding={hands.winding ? "" : undefined}
      >
        <g data-hand="hour" ref={hands.hour} style={hand(turns.hour)}>
          <Hand
            set={handSet}
            length={layout.hands.hour}
            width={HANDS.hour}
            ink={face.ink}
            facet={facet}
          />
        </g>
        <g data-hand="minute" ref={hands.minute} style={hand(turns.minute)}>
          <Hand
            set={handSet}
            length={layout.hands.minute}
            width={HANDS.minute}
            ink={face.ink}
            facet={facet}
          />
        </g>
        <g data-hand="second" ref={hands.second} style={hand(turns.second)}>
          <SecondHand
            set={handSet}
            length={layout.hands.second}
            width={HANDS.second}
            ink={face.ink}
          />
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
  kind:
    | "baton"
    | "doubleBaton"
    | "wideBaton"
    | "dot"
    | "triangle"
    | "wedge"
    | "tick";
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
    case "wideBaton":
      return (
        <Baton
          x={C}
          top={top}
          bottom={bottom}
          w={width * 1.9}
          ink={ink}
          facet={facet}
        />
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

/** The hour or minute hand, drawn at twelve o'clock — the caller's group
 *  rotates it. `length` is its tip from the centre, `width` the width the
 *  geometry gives it, and the set what it is shaped like and made of.
 *
 *  A bar is a stroke the same width all the way out with a facet down it. A
 *  tapered hand is a shape: broad where it leaves the cap, narrowing to its
 *  tip, and split down the ridge into the half that catches the light and the
 *  half in shade — which is what makes it read as polished steel rather than
 *  as print. Steel takes a hairline of the ink round it too, because a bright
 *  hand over a pale face needs an edge to be a hand. */
function Hand({
  set,
  length,
  width,
  ink,
  facet,
}: {
  set: DialHandsSpec;
  length: number;
  width: number;
  ink: string;
  facet: string;
}) {
  const top = C - length;
  const bottom = C + HAND_BOSS;
  if (!set.taper) {
    return (
      <>
        <line
          x1={C}
          y1={bottom}
          x2={C}
          y2={top}
          stroke={ink}
          strokeWidth={width}
          strokeLinecap="round"
        />
        <line
          x1={C}
          y1={C - 2}
          x2={C}
          y2={top + 3}
          stroke={facet}
          strokeWidth={width * 0.3}
          strokeLinecap="round"
        />
      </>
    );
  }
  const base = (width * set.base) / 2;
  const tip = (width * set.tip) / 2;
  const left = `${C - base},${bottom} ${C - tip},${top}`;
  const right = `${C + tip},${top} ${C + base},${bottom}`;
  return (
    <>
      <polygon
        points={`${left} ${C},${top} ${C},${bottom}`}
        fill={set.steel?.light ?? ink}
      />
      <polygon
        points={`${C},${bottom} ${C},${top} ${right}`}
        fill={set.steel?.shade ?? ink}
      />
      <polygon
        points={`${left} ${right}`}
        fill="none"
        stroke={set.steel ? ink : facet}
        strokeWidth={0.5}
        strokeLinejoin="round"
        opacity={set.steel ? 0.45 : 1}
      />
    </>
  );
}

/** The second hand: a hair from its tip to its tail, and whatever balances it
 *  past the axle — the disc of a sports hand, or the slim lozenge of a dress
 *  one. Printed in the face's ink whatever the rest of the set is made of: at
 *  a unit wide there is no room for a facet, and a dial with polished hands
 *  wears a dark second hand against the polish. */
function SecondHand({
  set,
  length,
  width,
  ink,
}: {
  set: DialHandsSpec;
  length: number;
  width: number;
  ink: string;
}) {
  const tail = C + HANDS.tail;
  if (set.counterweight === "disc") {
    return (
      <>
        <line
          x1={C}
          y1={tail}
          x2={C}
          y2={C - length}
          stroke={ink}
          strokeWidth={width}
          strokeLinecap="round"
        />
        <circle cx={C} cy={C + HANDS.tail * 0.7} r={2.2} fill={ink} />
      </>
    );
  }
  // The needle, a touch finer at the tip than at the axle, and the lozenge:
  // a long thin diamond down the tail, ending where the tail does.
  const hair = width * 0.45;
  const spread = width * 1.6;
  return (
    <>
      <polygon
        points={
          `${C - hair},${tail} ${C - hair * 0.6},${C - length} ` +
          `${C + hair * 0.6},${C - length} ${C + hair},${tail}`
        }
        fill={ink}
      />
      <polygon
        points={
          `${C},${C + HANDS.tail * 0.3} ${C + spread},${C + HANDS.tail * 0.68} ` +
          `${C},${tail} ${C - spread},${C + HANDS.tail * 0.68}`
        }
        fill={ink}
      />
    </>
  );
}
