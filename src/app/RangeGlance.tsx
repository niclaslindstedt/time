// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The Report's header, where the range's four figures are drawn rather than
// printed — the Log's two rings, one screen up.
//
// The four numbers are two pairs, and each pair is a shape. Worked and target
// are a *share*: how much of what the range asked for has been done, which is
// a ring filled from twelve round to the hour it got to, and past it in the
// flag colour when the range ran long — the very bezel the Today screen draws
// a day's progress on, so a week ahead of itself looks the way a day ahead of
// itself does. Balance is a *distance from nothing*: an arc that grows out of
// twelve in the red of a shortfall or the green of time in hand, against the
// range's own target, so a week half a day behind is a ring a sixteenth red.
//
// The balance card's two figures are the same quantity at two scopes — the
// range, and everything ever logged — so they are labelled by scope ("This
// week" / "All time") rather than by name. Calling one of them "Balance" and
// the other "Overall" read as two different quantities and wanted a footnote
// to say they were not; a label that says which span it covers does not.
//
// Paint only: every figure here is the `summarizeRange` the charts below
// fold, and the ring's geometry is `clock.ts`'s. Nothing on this screen
// derives a number of its own.

import type { ReactNode } from "react";

import { DIAL_SECONDS, arcPath } from "./clock.ts";
import { formatBalance, formatDuration, formatPercent } from "./format.ts";
import { useT } from "./i18n/index.ts";
import type { Seconds } from "./types.ts";

/** The rings' diameter in CSS pixels. A shade wider than the Log's, because
 *  what goes in the middle of one is a balance rather than a duration, and a
 *  balance carries a sign and, over a month, three digits of hours. */
const RING_PX = 92;

// The ring's own 100-unit box: the centre, the band's radius and its weight.
const C = 50;
const R = 39;
const BAND = 11;

/** A figure longer than this has to come down a size to stay inside the hole.
 *  "+8h 00m" fits; "−131h 59m" does not. */
const ROOMY = 7;

type Props = {
  worked: Seconds;
  target: Seconds;
  balance: Seconds;
  overall: Seconds;
  /** Which range the left-hand balance is for — the word it is labelled with.
   *  Named rather than dated: the dates are in the header directly above. */
  range: "week" | "month";
};

export function RangeGlance({
  worked,
  target,
  balance,
  overall,
  range,
}: Props) {
  const t = useT();
  const share = target > 0 ? worked / target : worked > 0 ? 1 : 0;
  // A range with no target to measure against — a week of days off — has no
  // share to print, so the ring is full and the hours themselves go in it.
  const done = Math.min(1, share);
  const over = Math.min(1, Math.max(0, share - 1));
  const short = balance < 0;
  // The balance against what the range asked for: a full ring is a whole
  // range's worth either way. With no target, any balance is the whole of it.
  const swing =
    target > 0
      ? Math.min(1, Math.abs(balance) / target)
      : balance === 0
        ? 0
        : 1;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Card>
        <Ring
          arcs={[
            { at: done, color: "var(--color-accent)" },
            { at: over, color: "var(--color-flag)" },
          ]}
          label={target > 0 ? formatPercent(share) : formatDuration(worked)}
          ariaLabel={t("report.shareLabel")}
          desc={t("report.shareDesc", {
            worked: formatDuration(worked),
            target: formatDuration(target),
          })}
        />
        <Figures>
          <Figure
            label={t("report.worked")}
            value={formatDuration(worked)}
            dot="var(--color-accent)"
          />
          <Figure
            label={t("report.target")}
            value={formatDuration(target)}
            dot="var(--color-muted)"
          />
        </Figures>
      </Card>

      <Card>
        <Ring
          arcs={[
            {
              at: swing,
              color: short ? "var(--color-danger)" : "var(--color-accent)",
            },
          ]}
          label={formatBalance(balance)}
          labelClass={short ? "text-danger" : "text-accent"}
          ariaLabel={t("report.balanceLabel")}
          desc={t("report.balanceDesc", {
            balance: formatBalance(balance),
            target: formatDuration(target),
          })}
        />
        <Figures>
          <Figure
            label={
              range === "week"
                ? t("report.balanceWeek")
                : t("report.balanceMonth")
            }
            value={formatBalance(balance)}
            dot={short ? "var(--color-danger)" : "var(--color-accent)"}
          />
          <Figure
            label={t("report.balanceAllTime")}
            value={formatBalance(overall)}
            dot={overall < 0 ? "var(--color-danger)" : "var(--color-accent)"}
          />
        </Figures>
      </Card>
    </div>
  );
}

/** One ring: an empty groove, and the arcs laid on it from twelve clockwise.
 *  A share is a length of the twelve-hour dial `clock.ts` measures in, which
 *  is why a fraction is handed to `arcPath` as seconds of one. */
function Ring({
  arcs,
  label,
  labelClass = "text-fg-bright",
  ariaLabel,
  desc,
}: {
  arcs: { at: number; color: string }[];
  label: string;
  labelClass?: string;
  ariaLabel: string;
  desc: string;
}) {
  return (
    <div className="relative" style={{ width: RING_PX, height: RING_PX }}>
      <svg
        viewBox="0 0 100 100"
        width={RING_PX}
        height={RING_PX}
        role="img"
        aria-label={ariaLabel}
      >
        <desc>{desc}</desc>
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={BAND}
        />
        {arcs.map((arc, i) => {
          const d = arcPath(C, C, R, 0, Math.max(0, arc.at) * DIAL_SECONDS);
          return (
            d && (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={arc.color}
                strokeWidth={BAND}
                strokeLinecap="round"
              />
            )
          );
        })}
      </svg>
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center font-bold tabular-nums ${
          label.length > ROOMY ? "text-xs" : "text-sm"
        } ${labelClass}`}
      >
        {label}
      </span>
    </div>
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

/** The card's two figures, under the ring. Capped rather than full width: on
 *  the desk a card is as wide as the screen, and two figures pinned to its far
 *  corners stop being a caption for the ring between them. */
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
