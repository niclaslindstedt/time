// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The month, painted: the rows and boxes `monthChart.ts` lays out in seconds,
// scaled into the plot the screen has. Nothing is derived here — the geometry
// is the module's, the colours are its scale, and this file only decides how
// many pixels an hour is worth.

import { useLayoutEffect, useRef, useState } from "react";

import {
  formatDay,
  formatDuration,
  formatHours,
  formatPercent,
} from "./format.ts";
import { useT, type TFn } from "./i18n/index.ts";
import {
  OVER_RATIO,
  boxColor,
  type DayBox,
  type MonthChart,
} from "./monthChart.ts";

const GUTTER = 42;
const MARGIN = { top: 8, right: 10, bottom: 20 };
const PLOT_HEIGHT = 210;
const TICK = 10;
/** A little air under the last line, so the month's target does not land on
 *  the axis and read as the axis. */
const HEADROOM = 1.05;
/** Two hour labels closer together than this would sit on each other, so the
 *  upper one is dropped. */
const LABEL_ROOM = 13;

type Props = {
  chart: MonthChart;
  className?: string;
};

export function MonthCalendar({ chart, className = "" }: Props) {
  const t = useT();
  // The same measuring the timer card's frame does: the plot fills whatever
  // the Section gives it, and is redrawn when that changes.
  const ref = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  const height = PLOT_HEIGHT;

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
    const bottom = height - MARGIN.bottom;
    const innerW = right - GUTTER;
    const innerH = bottom - MARGIN.top;
    // Both axes start at zero and count up, so a scale is one division.
    const sx = (s: number) =>
      GUTTER + (chart.width > 0 ? (s / chart.width) * innerW : 0);
    const domainY = chart.height * HEADROOM;
    const sy = (s: number) =>
      MARGIN.top + (domainY > 0 ? (s / domainY) * innerH : 0);

    // The hours along the bottom walk in working days, so a box that ends on
    // one ended the day on its target.
    const steps =
      chart.dayTarget > 0 ? Math.ceil(chart.width / chart.dayTarget) : 0;
    const every = Math.max(1, Math.ceil(steps / 8));
    const hourLines: number[] = [];
    for (let i = every; i <= steps; i += every)
      hourLines.push(i * chart.dayTarget);

    // The hours down the side are cumulative, so a label goes at every row's
    // bottom edge — unless the row was too short to have moved the axis.
    const marks: { at: number; label: string }[] = [
      { at: 0, label: formatHours(0) },
    ];
    for (const row of chart.weeks) {
      const at = row.y + row.height;
      const last = marks[marks.length - 1];
      if (last && sy(at) - sy(last.at) < LABEL_ROOM) marks.pop();
      marks.push({ at, label: formatHours(at) });
    }

    return (
      <svg
        width={plotW}
        height={height}
        viewBox={`0 0 ${plotW} ${height}`}
        role="img"
        aria-label={t("report.perWeek")}
        className="block"
      >
        <desc>{t("report.perWeekDesc")}</desc>

        {chart.weeks.map((row) => {
          const top = sy(row.y);
          const foot = sy(row.y + row.height);
          return (
            <g key={row.from}>
              {row.boxes.map((box) =>
                box.width <= 0 ? null : (
                  <Box
                    key={box.date}
                    box={box}
                    x={sx(box.x)}
                    w={sx(box.x + box.width) - sx(box.x)}
                    y={top}
                    h={foot - top}
                    t={t}
                  />
                ),
              )}
            </g>
          );
        })}

        {/* The two targets, and only those two: across, a full week of work,
            so a row that reaches it did the week; down, the month's, so the
            gap to the last row's foot is what the month is behind. They go
            over the boxes rather than under — a line you have to read against
            the block it crosses is no use behind it. */}
        <Target
          x1={sx(chart.weekTarget)}
          x2={sx(chart.weekTarget)}
          y1={MARGIN.top}
          y2={bottom}
        />
        <Target
          x1={GUTTER}
          x2={right}
          y1={sy(chart.target)}
          y2={sy(chart.target)}
        />

        {hourLines.map((at) => (
          <g key={`hl-${at}`}>
            <line
              x1={sx(at)}
              x2={sx(at)}
              y1={bottom}
              y2={bottom + 3}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={sx(at)}
              y={height - 4}
              textAnchor={right - sx(at) < 16 ? "end" : "middle"}
              fontSize={TICK}
              fill="var(--muted)"
            >
              {formatHours(at)}
            </text>
          </g>
        ))}

        {marks.map((mark) => (
          <g key={`y-${mark.at}`}>
            <line
              x1={GUTTER - 3}
              x2={GUTTER}
              y1={sy(mark.at)}
              y2={sy(mark.at)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={GUTTER - 6}
              y={sy(mark.at)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={TICK}
              fill="var(--muted)"
            >
              {mark.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className={className}>
      <div ref={ref}>
        {plotWidth > GUTTER + MARGIN.right ? (
          body(plotWidth)
        ) : (
          <div style={{ height }} />
        )}
      </div>
      <Legend />
    </div>
  );
}

function Box({
  box,
  x,
  y,
  w,
  h,
  t,
}: {
  box: DayBox;
  x: number;
  y: number;
  w: number;
  h: number;
  t: TFn;
}) {
  const day = formatDay(box.date);
  if (box.spill) {
    return (
      <rect
        x={x + 0.5}
        y={y + 0.5}
        width={Math.max(0, w - 1)}
        height={Math.max(0, h - 1)}
        fill="var(--muted)"
        fillOpacity={0.25}
        stroke="var(--surface-3)"
        strokeWidth={1}
      >
        <title>{t("report.boxSpill", { day })}</title>
      </rect>
    );
  }
  const worked = formatDuration(box.worked);
  const title =
    box.target > 0
      ? t("report.boxDay", {
          day,
          worked,
          target: formatDuration(box.target),
          percent: formatPercent(box.worked / box.target),
        })
      : t("report.boxOff", { day, worked });
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={boxColor(box.ratio)}>
        <title>{title}</title>
      </rect>
      {/* Neighbours of a similar colour would read as one long bar, so every
          box is closed off at its right edge. */}
      <line
        x1={x + w}
        x2={x + w}
        y1={y}
        y2={y + h}
        stroke="var(--surface-3)"
        strokeWidth={1}
      />
    </g>
  );
}

/** A target, dotted across whatever it crosses: an outline in the page's own
 *  colour under the line keeps it legible over a filled box as well as over
 *  the background. */
function Target(props: { x1: number; x2: number; y1: number; y2: number }) {
  return (
    <g>
      <line
        {...props}
        stroke="var(--page-bg)"
        strokeWidth={2.5}
        strokeDasharray="5 4"
        opacity={0.6}
      />
      <line
        {...props}
        stroke="var(--fg-bright)"
        strokeWidth={1}
        strokeDasharray="5 4"
        opacity={0.7}
      />
    </g>
  );
}

/** The scale, spelled out: a strip of the very ramp the boxes are filled
 *  from, with the two ratios that anchor it. */
function Legend() {
  const t = useT();
  const green = `${(100 / OVER_RATIO).toFixed(1)}%`;
  return (
    <div className="mt-2 flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-2 w-16 shrink-0 rounded-full"
        style={{
          background: `linear-gradient(to right, var(--danger), var(--success) ${green}, var(--link))`,
        }}
      />
      <span className="text-[0.65rem] text-muted">{t("report.scale")}</span>
    </div>
  );
}
