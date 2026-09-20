// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { ReactNode } from "react";

import { DonutChart } from "@niclaslindstedt/oss-framework/charts";

import { angleOf, arcPath, polar } from "./clock.ts";
import { presenceIntervals, type DayTotals } from "./day.ts";
import { formatDuration, formatTimeOfDay } from "./format.ts";
import { useT } from "./i18n/index.ts";
import type { Seconds, WorkDay } from "./types.ts";

// The Log's header: the day's four figures, drawn rather than printed.
//
// Two rings side by side, because the four numbers are two pairs and each
// pair is a shape. Started and stopped are two *moments*, and the thing that
// makes them legible at a glance is where they sit on a clock — so they are
// two hands on a twelve-hour dial, with the day's presence drawn on the ring
// between them. Worked and breaks are two *lengths* that add up to that
// presence, and the shape of a pair that adds up is a ring split in two.
//
// Split in three where a kind of break counts as work (see `BreakCredit`):
// the ring still adds up to presence, and the slice between the two is the
// break time that counted — drawn between their colours, because that is
// what it is. The two figures under it go on being the day's two numbers:
// everything worked, and everything spent on breaks, whichever side of the
// ring a minute of it landed on.
//
// Paint only: every number here is the `dayTotals` the timer and the report
// read, and the ring's arcs are the same `presenceIntervals` the Today screen
// draws. Nothing on this screen derives a figure of its own.

/** The rings' diameter in CSS pixels. Both the same, so the two cards are
 *  one row rather than two boxes that happen to be adjacent. */
const RING_PX = 84;
/** The split ring's thickness, in pixels. The dial's band is thinner (see
 *  `BAND`): one of these is a chart and the other is a watch, and a ring of
 *  the same weight in both would say they were the same kind of thing. */
const RING_WIDTH = 10;

// The dial's own 100-unit box: the centre, the band's radius and weight, the
// minute track outside it, and how far a hand reaches.
const C = 50;
const R = 36;
const BAND = 7.5;
const TRACK_INNER = R + BAND / 2 + 2;
const TRACK_OUTER = 47;
const HAND = R - BAND / 2 - 5;

type Props = { day: WorkDay; totals: DayTotals; upTo: Seconds };

export function DayGlance({ day, totals, upTo }: Props) {
  const t = useT();
  const time = (at: Seconds | null) =>
    at === null ? "—" : formatTimeOfDay(at);
  // The split ring is presence divided up, so it has to add to presence: the
  // work, the break time the project counted as work, and the break time that
  // came off the day. The middle slice is both things at once and is drawn as
  // both — the accent mixed towards the flag — because a lunch that is half
  // paid is not a third kind of time, it is a break that counted.
  const credited = totals.breakCreditTotal;
  const unpaid = Math.max(0, totals.breakTotal - credited);
  const worked = Math.max(0, totals.worked - credited);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Card>
        <DayHands day={day} totals={totals} upTo={upTo} />
        <Figures>
          <Figure
            label={t("log.firstIn")}
            value={time(totals.firstIn)}
            dot="var(--color-accent)"
          />
          <Figure
            label={t("log.lastOut")}
            value={time(totals.lastOut)}
            dot="var(--color-muted)"
          />
        </Figures>
      </Card>

      <Card>
        <DonutChart
          size={RING_PX}
          thickness={RING_WIDTH}
          segments={
            totals.presence === 0
              ? // Nothing counted yet: an empty groove, so the card reads as
                // a ring waiting to be filled rather than as a missing chart.
                [{ value: 1, color: "var(--color-surface-2)" }]
              : [
                  { value: worked, color: "var(--color-accent)" },
                  {
                    value: credited,
                    color:
                      "color-mix(in oklab, var(--color-accent) 55%, var(--color-flag))",
                  },
                  { value: unpaid, color: "var(--color-flag)" },
                ]
          }
          formatValue={formatDuration}
          innerLabel={
            <span className="text-sm font-bold text-fg-bright tabular-nums">
              {formatDuration(totals.worked)}
            </span>
          }
          ariaLabel={t("log.splitLabel")}
          desc={
            credited > 0
              ? t("log.splitDescCredited", {
                  worked: formatDuration(totals.worked),
                  credited: formatDuration(credited),
                  breaks: formatDuration(totals.breakTotal),
                })
              : t("log.splitDesc", {
                  worked: formatDuration(totals.worked),
                  breaks: formatDuration(totals.breakTotal),
                })
          }
        />
        <Figures>
          <Figure
            label={t("log.worked")}
            value={formatDuration(totals.worked)}
            dot="var(--color-accent)"
          />
          <Figure
            label={t("log.breakTotal")}
            value={formatDuration(totals.breakTotal)}
            dot="var(--color-flag)"
          />
        </Figures>
      </Card>
    </div>
  );
}

/**
 * The day on a twelve-hour dial: every stretch the day was present drawn on
 * the ring, and the first clock-in and last clock-out as hands pointing at
 * them. A day worked in two goes round as two arcs with the gap between them
 * showing — which is the thing a single band from the first hand to the
 * second would hide. A day still running has one hand and an arc that ends at
 * `upTo`, the moment the screen is reading, so it grows as the day does.
 *
 * Twelve hours is the clock on the wall, the same choice `clock.ts` makes for
 * the Today screen, and the geometry is that module's: nothing here turns a
 * second into an angle itself. The arcs are `presenceIntervals` — the Today
 * screen's own reading of the day, not a second one.
 */
function DayHands({
  day,
  totals,
  upTo,
}: {
  day: WorkDay;
  totals: DayTotals;
  upTo: Seconds;
}) {
  const t = useT();
  const { firstIn, lastOut } = totals;
  const present = presenceIntervals(day, upTo);

  return (
    <svg
      viewBox="0 0 100 100"
      width={RING_PX}
      height={RING_PX}
      role="img"
      aria-label={t("log.dialLabel")}
    >
      <desc>
        {t("log.dialDesc", {
          start: firstIn === null ? "—" : formatTimeOfDay(firstIn),
          end: lastOut === null ? t("log.running") : formatTimeOfDay(lastOut),
        })}
      </desc>
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke="var(--color-surface-2)"
        strokeWidth={BAND}
      />
      {Array.from({ length: 12 }, (_, hour) => {
        const quarter = hour % 3 === 0;
        const angle = (hour / 12) * 360;
        const [x1, y1] = polar(C, C, TRACK_INNER + (quarter ? 0 : 1.6), angle);
        const [x2, y2] = polar(C, C, TRACK_OUTER, angle);
        return (
          <line
            key={hour}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-muted)"
            strokeOpacity={quarter ? 0.8 : 0.4}
            strokeWidth={quarter ? 2 : 1.2}
            strokeLinecap="round"
          />
        );
      })}
      {present.map((i) => {
        const d = arcPath(C, C, R, i.start, i.end);
        return (
          d && (
            <path
              key={i.start}
              d={d}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={BAND}
            />
          )
        );
      })}
      {firstIn !== null && (
        <Hand at={firstIn} color="var(--color-accent)" width={2.6} />
      )}
      {lastOut !== null && (
        <Hand at={lastOut} color="var(--color-muted)" width={2.2} />
      )}
      <circle
        cx={C}
        cy={C}
        r={2.4}
        fill={firstIn === null ? "var(--color-line)" : "var(--color-fg-bright)"}
      />
    </svg>
  );
}

/** One hand, from the centre to the moment it points at. A moment past the
 *  dial's twelve hours — a night shift's end — points at the same place on
 *  the face it would on a wall clock, because `angleOf` wraps. */
function Hand({
  at,
  color,
  width,
}: {
  at: Seconds;
  color: string;
  width: number;
}) {
  const [x, y] = polar(C, C, HAND, angleOf(at));
  return (
    <line
      x1={C}
      y1={C}
      x2={x}
      y2={y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

/** One of the two cards: the ring on top, its two figures beneath. */
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface-3 px-2 py-3">
      {children}
    </div>
  );
}

/** The card's two figures, under the ring. Capped rather than full width:
 *  on the desk a card is as wide as the screen, and two figures pinned to its
 *  far corners stop being a caption for the ring between them. */
function Figures({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-52 grid-cols-2 gap-1">
      {children}
    </div>
  );
}

function Figure({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="flex items-center justify-center gap-1 text-[0.6rem] tracking-wide text-muted uppercase">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: dot }}
        />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-0.5 text-sm font-bold text-fg-bright tabular-nums">
        {value}
      </p>
    </div>
  );
}
