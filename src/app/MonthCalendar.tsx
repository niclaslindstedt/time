// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The month, painted: the rows and boxes `monthChart.ts` lays out in seconds,
// scaled into the plot the screen has. Nothing is derived here — the geometry
// is the module's, the colours are its scale, and this file only decides how
// many pixels an hour is worth and what the pointer is told.

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import {
  formatBalance,
  formatDay,
  formatDayNamed,
  formatDuration,
  formatHours,
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
/** The page showing between one day and the next. Taken out of the box's own
 *  width rather than added after it, so a box still *starts* at the hour it
 *  means and the row still ends at the hours the week worked. */
const DAY_GAP = 2;
/** The corner a row's two ends are cut with. */
const RADIUS = 4;
/** Two hour labels closer together than this would sit on each other, so the
 *  upper one is dropped. */
const LABEL_ROOM = 13;
/** The pointer has to be able to leave the plot without the card following it
 *  off the edge. */
const EDGE = 6;

/** Where a tooltip hangs from, and the outline that shows what it is about. */
type Anchor = { x: number; y: number; w: number; h: number; outline: string };

/** What the pointer is on. */
type Hover =
  | { kind: "day"; box: DayBox; at: Anchor }
  | { kind: "week"; row: WeekRow; at: Anchor }
  | null;

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
        {rows.map(({ row, gapIndex }) => {
          if (row.height <= 0) return null;
          const top = yAt(row.y, gapIndex);
          const foot = yAt(row.y + row.height, gapIndex);
          const drawn = row.boxes.filter((box) => box.width > 0);
          const first = drawn[0];
          const last = drawn[drawn.length - 1];
          if (!first || !last) return null;
          const from = sx(first.x);
          const to = sx(last.x + last.width);
          const at: Anchor = {
            x: from,
            y: top,
            w: to - from,
            h: foot - top,
            outline: boxPath(from, top, to - from, foot - top, RADIUS, RADIUS),
          };
          return (
            <rect
              key={`row-${row.from}`}
              x={0}
              y={top}
              width={plotW}
              height={foot - top}
              fill="transparent"
              onPointerEnter={() => setHover({ kind: "week", row, at })}
              onPointerDown={() => setHover({ kind: "week", row, at })}
            />
          );
        })}

        {rows.map(({ row, gapIndex }) => {
          const top = yAt(row.y, gapIndex);
          const foot = yAt(row.y + row.height, gapIndex);
          // Only the row's two ends are cut; the joins inside it stay square,
          // so a week reads as one shape divided into its days.
          const drawn = row.boxes.filter((box) => box.width > 0);
          return (
            <g key={row.from}>
              {drawn.map((box, i) => {
                const x = sx(box.x);
                const full = sx(box.x + box.width) - x;
                const isLast = i === drawn.length - 1;
                // Nothing follows the last box, so nothing has to show past
                // it — and its right edge stays the week's true total.
                const w = isLast
                  ? full
                  : full - Math.min(DAY_GAP, Math.max(0, full - 1));
                const d = boxPath(
                  x,
                  top,
                  w,
                  foot - top,
                  i === 0 ? RADIUS : 0,
                  isLast ? RADIUS : 0,
                );
                const at: Anchor = { x, y: top, w, h: foot - top, outline: d };
                const enter = () => setHover({ kind: "day", box, at });
                return (
                  <g key={box.date}>
                    <path
                      d={d}
                      fill={box.spill ? "var(--muted)" : boxColor(box.ratio)}
                      fillOpacity={box.spill ? 0.25 : 1}
                    />
                    {/* The day's hit area keeps the width the gap was taken
                        out of, so the page showing between two boxes is not a
                        seam the week answers through. */}
                    <rect
                      x={x}
                      y={top}
                      width={full}
                      height={foot - top}
                      fill="transparent"
                      onPointerEnter={enter}
                      onPointerDown={enter}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        <g pointerEvents="none">
          {/* What the card is about, ringed so the eye can see the pointer
              land. */}
          {hover && (
            <path
              d={hover.at.outline}
              fill="none"
              stroke="var(--fg-bright)"
              strokeWidth={hover.at.h < 8 ? 1 : 2}
              strokeLinejoin="round"
              opacity={0.85}
            />
          )}

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

  return (
    <div className={className}>
      <div ref={ref} className="relative">
        {plotWidth > GUTTER + MARGIN.right ? (
          body(plotWidth)
        ) : (
          <div style={{ height }} />
        )}
        {hover && plotWidth > 0 && (
          <Tooltip card={cardFor(t, hover)} at={hover.at} width={plotWidth} />
        )}
      </div>
      <Legend />
    </div>
  );
}

/** What the card says. The figure leads and the naming follows it: whoever is
 *  pointing at a box already knows which day they are on. */
type Card = {
  /** The day's own colour, as a key back to the box. A week has no one
   *  colour, so it has no key. */
  key: string | null;
  title: string;
  value: string | null;
  /** What it was measured against, when there was anything. */
  of: string | null;
  balance: number | null;
  note: string | null;
};

function cardFor(t: TFn, hover: NonNullable<Hover>): Card {
  if (hover.kind === "week") return weekCard(t, hover.row);
  return dayCard(t, hover.box);
}

function dayCard(t: TFn, box: DayBox): Card {
  const title = formatDayNamed(box.date);
  const blank = { key: null, value: null, of: null, balance: null, note: null };
  if (box.spill) return { ...blank, title, note: t("report.notThisMonth") };
  const value = formatDuration(box.worked);
  // A day the employer expects nothing of has no target to be measured
  // against: every minute of it is balance.
  if (box.target === 0) {
    return {
      ...blank,
      key: boxColor(null),
      title,
      value,
      balance: box.worked,
      note: t("report.dayOff"),
    };
  }
  return {
    key: boxColor(box.ratio),
    title,
    value,
    of: t("report.ofTarget", { target: formatDuration(box.target) }),
    balance: box.worked - box.target,
    note: null,
  };
}

/** A week is named by this month's days, not by the neighbouring month's the
 *  row is padded out with. */
function weekCard(t: TFn, row: WeekRow): Card {
  const own = row.boxes.filter((box) => !box.spill);
  const first = own[0];
  const last = own[own.length - 1];
  const title =
    first && last
      ? t("report.weekRange", {
          from: formatDay(first.date),
          to: formatDay(last.date),
        })
      : "";
  return {
    key: null,
    title,
    value: formatDuration(row.height),
    of:
      row.target > 0
        ? t("report.ofTarget", { target: formatDuration(row.target) })
        : null,
    balance: row.target > 0 ? row.height - row.target : null,
    note: null,
  };
}

/**
 * The card itself: hung over the thing it names, flipped under it near the top
 * of the plot, and anchored by whichever edge is nearer when the thing sits
 * out at one side — which is how it stays inside the chart without having to
 * be measured first.
 */
function Tooltip({
  card,
  at,
  width,
}: {
  card: Card;
  at: Anchor;
  width: number;
}) {
  const centre = at.x + at.w / 2;
  const below = at.y < 76;
  const style: CSSProperties = below
    ? { top: at.y + at.h + 8 }
    : { top: at.y - 8 };
  const lift = below ? "0" : "-100%";
  if (centre < width / 3) {
    style.left = Math.max(EDGE, at.x);
    style.transform = `translate(0, ${lift})`;
  } else if (centre > (width * 2) / 3) {
    style.right = Math.max(EDGE, width - (at.x + at.w));
    style.transform = `translate(0, ${lift})`;
  } else {
    style.left = centre;
    style.transform = `translate(-50%, ${lift})`;
  }

  return (
    <div
      aria-hidden="true"
      style={style}
      className="pointer-events-none absolute z-10 rounded-xl border border-line bg-surface px-2.5 py-1.5 shadow-lg"
    >
      <div className="flex items-center gap-1.5">
        {card.key && (
          <span
            aria-hidden="true"
            className="h-0.5 w-3 shrink-0 rounded-full"
            style={{ background: card.key }}
          />
        )}
        <span className="text-[0.7rem] whitespace-nowrap text-muted">
          {card.title}
        </span>
      </div>
      {card.value && (
        <p className="text-base leading-tight font-bold text-fg-bright tabular-nums">
          {card.value}
        </p>
      )}
      <p className="flex items-center gap-1.5 text-[0.7rem] whitespace-nowrap text-muted tabular-nums">
        {card.note && <span>{card.note}</span>}
        {card.of && <span>{card.of}</span>}
        {card.balance !== null && (
          <span
            className={`font-bold ${card.balance < 0 ? "text-danger" : "text-accent"}`}
          >
            {formatBalance(card.balance)}
          </span>
        )}
      </p>
    </div>
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
    <div className="mt-2 flex items-center gap-2 text-[0.65rem] text-muted">
      <span
        aria-hidden="true"
        className="h-2 w-16 shrink-0 rounded-full"
        style={{
          background: `linear-gradient(to right, var(--danger), var(--success) ${green}, var(--link))`,
        }}
      />
      <span>{t("report.scale")}</span>
    </div>
  );
}
