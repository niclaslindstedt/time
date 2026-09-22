// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The range's days, painted: the bars `dayBars.ts` lays out in seconds,
// scaled into the plot the screen has. Nothing is derived here — this file
// only decides how many pixels an hour is worth.
//
// One column a day. The track is the target, standing at the height the day
// was asked for; the hours worked fill it from the floor and keep going past
// the top when the day ran long, and the part above the target wears the flag
// colour — the same overshoot the Today screen's bezel draws, so a long day
// looks the same wherever the app shows one.
//
// The other way a day goes is the gap left in the track, and once the day is
// over that gap is a shortfall: it wears the red the ring beside it already
// puts a negative balance in (`dayBars.ts`'s `missed`), so red means the same
// thing everywhere on the screen. It goes *over* the track rather than
// tinting it — a grey track showing through a red is a brown, and the hours
// you did not work are not a third colour. Not on the day being worked and
// not on a day still ahead: those hours are still to come, and a red column
// standing over this afternoon would be the chart telling you off for a day
// you are in the middle of.

import { useLayoutEffect, useRef, useState } from "react";

import {
  bandScale,
  barPath,
  linearTicks,
} from "@niclaslindstedt/oss-framework/charts";

import type { DayBar, DayBarChart } from "./dayBars.ts";
import {
  formatBalance,
  formatDayNamed,
  formatDuration,
  formatHours,
  formatWeekday,
} from "./format.ts";
import { useT, type TFn } from "./i18n/index.ts";

/** Room down the left for the hour labels. */
const GUTTER = 38;
const MARGIN = { top: 10, right: 6, bottom: 22 };
const PLOT_HEIGHT = 196;
const TICK = 10;
/** A little air over the tallest bar, so a record day does not touch the top
 *  of the plot and read as clipped. */
const HEADROOM = 1.06;
/** The corner a bar's top is cut with. A bar shorter than this is drawn
 *  square by `barPath`, which collapses the radius as the bar shrinks. */
const RADIUS = 4;
/** How much of each column is left as the gap between neighbours. */
const GAP = 0.42;

type Props = {
  chart: DayBarChart;
  today: string;
  className?: string;
};

export function DayBars({ chart, today, className = "" }: Props) {
  const t = useT();
  // The same measuring `MonthCalendar` does: the plot fills whatever the
  // Section gives it, and is redrawn when that changes.
  const ref = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setPlotWidth(el.offsetWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const body = (plotW: number) => {
    const right = plotW - MARGIN.right;
    const floor = PLOT_HEIGHT - MARGIN.bottom;
    const innerH = floor - MARGIN.top;
    const domain = Math.max(1, chart.top * HEADROOM);

    const band = bandScale(chart.bars.length, [GUTTER, right], {
      paddingInner: GAP,
      paddingOuter: GAP / 2,
    });
    /** A length in seconds, in pixels. */
    const px = (seconds: number) => (seconds / domain) * innerH;
    /** A height in seconds, as the y it sits at. */
    const y = (seconds: number) => floor - px(seconds);

    const hours = linearTicks([0, domain / 3600], 5).filter((v) => v > 0);

    return (
      <svg
        width={plotW}
        height={PLOT_HEIGHT}
        viewBox={`0 0 ${plotW} ${PLOT_HEIGHT}`}
        role="img"
        aria-label={t("report.perDay")}
        className="block"
      >
        <desc>{t("report.perDayDesc")}</desc>

        {hours.map((hour) => (
          <g key={`h-${hour}`}>
            <line
              x1={GUTTER}
              x2={right}
              y1={y(hour * 3600)}
              y2={y(hour * 3600)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={GUTTER - 6}
              y={y(hour * 3600)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={TICK}
              fill="var(--muted)"
            >
              {formatHours(hour * 3600)}
            </text>
          </g>
        ))}
        <line
          x1={GUTTER}
          x2={right}
          y1={floor}
          y2={floor}
          stroke="var(--line)"
          strokeWidth={1}
        />

        {chart.bars.map((bar, i) => {
          const x = band.position(i);
          const w = band.bandwidth;
          return (
            <g key={bar.date}>
              <title>{barTitle(t, bar)}</title>
              {/* The track: the height the day was asked for. It goes under
                  everything, so a day that overtook its target buries it. */}
              {bar.target > 0 && (
                <path
                  d={barPath(
                    x,
                    y(bar.target),
                    w,
                    px(bar.target),
                    RADIUS,
                    "top",
                  )}
                  fill="var(--muted)"
                  fillOpacity={bar.future ? 0.16 : 0.3}
                />
              )}
              {/* The shortfall of a day that is over, in the red of a
                  negative balance: the top of the track, from the hours
                  worked up to the hours asked for. Over the track, so the
                  red is the ring's red rather than a red over a grey. */}
              {bar.missed > 0 && (
                <path
                  d={barPath(
                    x,
                    y(bar.target),
                    w,
                    px(bar.missed),
                    RADIUS,
                    "top",
                  )}
                  fill="var(--color-danger)"
                />
              )}
              {/* The hours worked, up the track. Square-topped while there is
                  more of the bar above it, so the two pieces read as one
                  column divided at the target. */}
              {bar.inside > 0 &&
                (bar.over > 0 ? (
                  <rect
                    x={x}
                    y={y(bar.inside)}
                    width={w}
                    height={px(bar.inside)}
                    fill="var(--color-accent)"
                  />
                ) : (
                  <path
                    d={barPath(
                      x,
                      y(bar.inside),
                      w,
                      px(bar.inside),
                      RADIUS,
                      "top",
                    )}
                    fill="var(--color-accent)"
                  />
                ))}
              {/* Past the target, in the flag colour — the bezel's overshoot. */}
              {bar.over > 0 && (
                <path
                  d={barPath(x, y(bar.worked), w, px(bar.over), RADIUS, "top")}
                  fill="var(--color-flag)"
                />
              )}
              <text
                x={x + w / 2}
                y={PLOT_HEIGHT - 5}
                textAnchor="middle"
                fontSize={TICK}
                fill={bar.date === today ? "var(--fg-bright)" : "var(--muted)"}
                fontWeight={bar.date === today ? 700 : 400}
              >
                {formatWeekday(bar.date)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className={className}>
      <div ref={ref}>
        {plotWidth > GUTTER + MARGIN.right ? (
          body(plotWidth)
        ) : (
          <div style={{ height: PLOT_HEIGHT }} />
        )}
      </div>
      <Legend />
    </div>
  );
}

/** What the pointer is told about a bar: the day, its hours against its
 *  target, and the balance that leaves. */
function barTitle(t: TFn, bar: DayBar): string {
  const head = `${formatDayNamed(bar.date)}: ${formatDuration(bar.worked)}`;
  if (bar.target === 0) return `${head} — ${t("report.dayOff")}`;
  const of = t("report.ofTarget", { target: formatDuration(bar.target) });
  if (bar.future) return `${head} ${of}`;
  return `${head} ${of} (${formatBalance(bar.worked - bar.target)})`;
}

/** The four things a column can be made of. */
function Legend() {
  const t = useT();
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] text-muted">
      <Key color="var(--color-accent)" label={t("report.seriesWorked")} />
      <Key color="var(--color-flag)" label={t("report.seriesOver")} />
      <Key color="var(--color-danger)" label={t("report.seriesMissed")} />
      <Key
        color="var(--muted)"
        opacity={0.3}
        label={t("report.seriesTarget")}
      />
    </div>
  );
}

function Key({
  color,
  opacity = 1,
  label,
}: {
  color: string;
  opacity?: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 shrink-0 rounded-sm"
        style={{ background: color, opacity }}
      />
      {label}
    </span>
  );
}
