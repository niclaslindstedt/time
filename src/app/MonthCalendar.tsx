// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The month, painted: the rows and boxes `monthChart.ts` lays out in seconds,
// scaled into the plot the screen has. Nothing is derived here — the geometry
// is the module's, the colours are its scale, and this file only decides how
// many pixels an hour is worth.

import { useLayoutEffect, useRef, useState } from "react";

import {
  formatBalance,
  formatDay,
  formatDayNamed,
  formatDuration,
  formatHours,
  formatPercent,
} from "./format.ts";
import { useT, type TFn } from "./i18n/index.ts";
import {
  OVER_RATIO,
  boxColor,
  boxPath,
  type DayBox,
  type MonthChart,
  type WeekRow,
} from "./monthChart.ts";

const GUTTER = 42;
const MARGIN = { top: 8, right: 10, bottom: 20 };
const PLOT_HEIGHT = 210;
const TICK = 10;
/** A little air under the last line, so the month's target does not land on
 *  the axis and read as the axis. */
const HEADROOM = 1.05;
/** The pixels held between one week and the next, so each row reads as its
 *  own shape rather than as a column of colour. */
const ROW_GAP = 3;
/** The corner a row's two ends are cut with. */
const RADIUS = 4;
/** Two hour labels closer together than this would sit on each other, so the
 *  upper one is dropped. */
const LABEL_ROOM = 13;

/** What the readout under the chart is naming. */
type Hover =
  { kind: "day"; box: DayBox } | { kind: "week"; row: WeekRow } | null;

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
  const [hover, setHover] = useState<Hover>(null);
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

    // The gaps between the rows are pixels the hours do not get, and every
    // position down the plot carries the ones above it — which is what keeps
    // a row's foot and the month's target line comparable now that the rows
    // no longer touch. A week with nothing in it is not a row you can see, so
    // it is not a gap either.
    let drawnRows = 0;
    const rows = chart.weeks.map((row) => {
      const gapIndex = drawnRows;
      if (row.height > 0) drawnRows += 1;
      return { row, gapIndex };
    });
    const lastGap = Math.max(0, drawnRows - 1);
    const hoursH = Math.max(1, innerH - lastGap * ROW_GAP);
    const domainY = chart.height * HEADROOM;

    // Both axes start at zero and count up, so a scale is one division.
    const sx = (s: number) =>
      GUTTER + (chart.width > 0 ? (s / chart.width) * innerW : 0);
    const sy = (s: number) =>
      MARGIN.top + (domainY > 0 ? (s / domainY) * hoursH : 0);
    const yAt = (s: number, gapIndex: number) => sy(s) + gapIndex * ROW_GAP;

    // The month's target belongs in the band of whichever week it falls in,
    // so it is held down the plot by the same gaps that week's row is.
    const targetGap =
      rows.find(
        ({ row }) => row.height > 0 && chart.target <= row.y + row.height,
      )?.gapIndex ?? lastGap;
    const targetY = yAt(chart.target, targetGap);

    // The hours along the bottom walk in working days, so a box that ends on
    // one ended the day on its target.
    const steps =
      chart.dayTarget > 0 ? Math.ceil(chart.width / chart.dayTarget) : 0;
    const every = Math.max(1, Math.ceil(steps / 8));
    const hourLines: number[] = [];
    for (let i = every; i <= steps; i += every)
      hourLines.push(i * chart.dayTarget);

    // The hours down the side are cumulative, so a label goes at every row's
    // foot — unless the row was too short to have moved the axis.
    const marks: { at: number; y: number }[] = [{ at: 0, y: sy(0) }];
    for (const { row, gapIndex } of rows) {
      if (row.height <= 0) continue;
      const at = row.y + row.height;
      const y = yAt(at, gapIndex);
      const last = marks[marks.length - 1];
      if (last && y - last.y < LABEL_ROOM) marks.pop();
      marks.push({ at, y });
    }

    return (
      <svg
        width={plotW}
        height={height}
        viewBox={`0 0 ${plotW} ${height}`}
        role="img"
        aria-label={t("report.perWeek")}
        className="block"
        onPointerLeave={() => setHover(null)}
      >
        <desc>{t("report.perWeekDesc")}</desc>

        {/* Behind the boxes, so a box always wins the pointer: the rest of a
            row's band, the margins to either side included, answers for the
            week. */}
        {rows.map(({ row, gapIndex }) =>
          row.height <= 0 ? null : (
            <rect
              key={`row-${row.from}`}
              x={0}
              y={yAt(row.y, gapIndex)}
              width={plotW}
              height={yAt(row.y + row.height, gapIndex) - yAt(row.y, gapIndex)}
              fill="transparent"
              onPointerEnter={() => setHover({ kind: "week", row })}
              onPointerDown={() => setHover({ kind: "week", row })}
            />
          ),
        )}

        {rows.map(({ row, gapIndex }) => {
          const top = yAt(row.y, gapIndex);
          const foot = yAt(row.y + row.height, gapIndex);
          // Only the row's two ends are cut; the joins inside it stay square,
          // so a week reads as one shape divided into its days.
          const drawn = row.boxes.filter((box) => box.width > 0);
          return (
            <g key={row.from}>
              {drawn.map((box, i) => (
                <Box
                  key={box.date}
                  box={box}
                  x={sx(box.x)}
                  w={sx(box.x + box.width) - sx(box.x)}
                  y={top}
                  h={foot - top}
                  leftRadius={i === 0 ? RADIUS : 0}
                  rightRadius={i === drawn.length - 1 ? RADIUS : 0}
                  divided={i < drawn.length - 1}
                  t={t}
                  onEnter={() => setHover({ kind: "day", box })}
                />
              ))}
            </g>
          );
        })}

        <g pointerEvents="none">
          {/* The two targets, and only those two: across, a full week of work,
              so a row that reaches it did the week; down, the month's, so the
              gap to the last row's foot is what the month is behind. They go
              over the boxes rather than under — a line you have to read
              against the block it crosses is no use behind it. */}
          <Target
            x1={sx(chart.weekTarget)}
            x2={sx(chart.weekTarget)}
            y1={MARGIN.top}
            y2={bottom}
          />
          <Target x1={GUTTER} x2={right} y1={targetY} y2={targetY} />

          {hourLines.map((at) => (
            <g key={`h-${at}`}>
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
                y1={mark.y}
                y2={mark.y}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text
                x={GUTTER - 6}
                y={mark.y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={TICK}
                fill="var(--muted)"
              >
                {formatHours(mark.at)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    );
  };

  const readout =
    hover === null
      ? null
      : hover.kind === "day"
        ? dayLabel(t, hover.box)
        : weekLabel(t, hover.row);

  return (
    <div className={className}>
      <div ref={ref}>
        {plotWidth > GUTTER + MARGIN.right ? (
          body(plotWidth)
        ) : (
          <div style={{ height }} />
        )}
      </div>
      {/* One line, whatever is in it: the scale when nothing is under the
          pointer, and what is under it when something is. Swapping in place
          rather than appearing keeps the chart from jumping. */}
      <div
        className="mt-2 flex min-h-5 items-center gap-2 text-[0.65rem] text-muted"
        aria-live="polite"
      >
        {readout ? (
          <span className="text-fg tabular-nums">{readout}</span>
        ) : (
          <Legend />
        )}
      </div>
    </div>
  );
}

/** What a day's box says about itself, in its tooltip and in the readout. */
function dayLabel(t: TFn, box: DayBox): string {
  const day = formatDayNamed(box.date);
  if (box.spill) return t("report.boxSpill", { day });
  const worked = formatDuration(box.worked);
  if (box.target === 0) return t("report.boxOff", { day, worked });
  return t("report.boxDay", {
    day,
    worked,
    target: formatDuration(box.target),
    percent: formatPercent(box.worked / box.target),
  });
}

/** What a week's row says about itself. It is named by this month's days, not
 *  by the neighbouring month's the row is padded out with. */
function weekLabel(t: TFn, row: WeekRow): string {
  const own = row.boxes.filter((box) => !box.spill);
  const first = own[0];
  const last = own[own.length - 1];
  if (!first || !last) return "";
  const named = {
    from: formatDay(first.date),
    to: formatDay(last.date),
    worked: formatDuration(row.height),
  };
  if (row.target === 0) return t("report.hoverWeekOff", named);
  return t("report.hoverWeek", {
    ...named,
    target: formatDuration(row.target),
    balance: formatBalance(row.height - row.target),
  });
}

function Box({
  box,
  x,
  y,
  w,
  h,
  leftRadius,
  rightRadius,
  divided,
  t,
  onEnter,
}: {
  box: DayBox;
  x: number;
  y: number;
  w: number;
  h: number;
  leftRadius: number;
  rightRadius: number;
  divided: boolean;
  t: TFn;
  onEnter: () => void;
}) {
  return (
    <g onPointerEnter={onEnter} onPointerDown={onEnter}>
      <path
        d={boxPath(x, y, w, h, leftRadius, rightRadius)}
        fill={box.spill ? "var(--muted)" : boxColor(box.ratio)}
        fillOpacity={box.spill ? 0.25 : 1}
        stroke={box.spill ? "var(--surface-3)" : "none"}
        strokeWidth={box.spill ? 1 : 0}
      >
        <title>{dayLabel(t, box)}</title>
      </path>
      {/* Neighbours of a similar colour would read as one long bar, so every
          box but the row's last is closed off at its right edge. */}
      {divided && (
        <line
          x1={x + w}
          x2={x + w}
          y1={y}
          y2={y + h}
          stroke="var(--surface-3)"
          strokeWidth={1}
          pointerEvents="none"
        />
      )}
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
    <>
      <span
        aria-hidden="true"
        className="h-2 w-16 shrink-0 rounded-full"
        style={{
          background: `linear-gradient(to right, var(--danger), var(--success) ${green}, var(--link))`,
        }}
      />
      <span>{t("report.scale")}</span>
    </>
  );
}
