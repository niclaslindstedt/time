// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { Modal } from "@niclaslindstedt/oss-framework/components";

import { boundaryRange, daySegments, type DaySegment } from "./day.ts";
import {
  formatDuration,
  formatTimeOfDay,
  parseTimeOfDay,
  toTimeInput,
} from "./format.ts";
import { useT } from "./i18n/index.ts";
import { breakName, categoryColor, categoryName } from "./labels.ts";
import type { Project, Seconds, WorkDay } from "./types.ts";

// What the clock face opens: the day as the stretches it is made of, in
// order, with the moment each one ended up for correction.
//
// The list is derived, not stored — the same `daySegments` the dial draws —
// so the only edit this screen can make is to move an edge, and moving one
// moves both sides of it: a lunch that ended at 12:20 rather than 12:10 is a
// coding session that started at 12:20 (see `moveBoundary`). That is the
// whole point of editing here rather than in the Log, where the two spans
// would have to be corrected one at a time and could disagree in between.
//
// The times either side of a break were never measured to the second, so the
// hint says so: this is the shape of the day, not a stopwatch.

/** How far the two nudge buttons move an edge. */
const STEP: Seconds = 5 * 60;

type Props = {
  day: WorkDay;
  project: Project;
  now: Seconds;
  /** The edge the clock face was tapped on, drawn as the one in question. */
  highlight?: Seconds | null;
  /** Move an edge of the day. Refused moves come back as an unchanged day. */
  onMove: (at: Seconds, to: Seconds) => void;
  onClose: () => void;
};

export function DayTimelineModal({
  day,
  project,
  now,
  highlight,
  onMove,
  onClose,
}: Props) {
  const t = useT();
  const segments = daySegments(day, now);

  const move = (at: Seconds, to: Seconds) => {
    const range = boundaryRange(day, at, now);
    if (!range) return;
    const clamped = Math.min(range.max, Math.max(range.min, to));
    if (clamped !== at) onMove(at, clamped);
  };

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="timeline-title"
      closeLabel={t("common.close")}
      centered
      size="max-w-sm"
    >
      <div className="flex flex-col gap-3 overflow-y-auto px-3 py-4">
        <div>
          <h2
            id="timeline-title"
            className="text-lg leading-tight font-bold text-fg-bright"
          >
            {t("timeline.title")}
          </h2>
          <p className="mt-1 text-xs text-muted">{t("timeline.hint")}</p>
        </div>

        {segments.length === 0 ? (
          <p className="text-sm text-muted">{t("timeline.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {segments.map((s) => (
              <Row
                key={`${s.kind}:${s.start}`}
                segment={s}
                project={project}
                label={label(s)}
                highlighted={highlight != null && s.end === highlight}
                onMove={move}
              />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );

  function label(s: DaySegment): string {
    if (s.kind === "break") {
      return s.typeId ? breakName(t, project, s.typeId) : t("log.breaks");
    }
    return s.typeId ? categoryName(t, project, s.typeId) : t("timeline.work");
  }
}

function Row({
  segment,
  project,
  label,
  highlighted,
  onMove,
}: {
  segment: DaySegment;
  project: Project;
  label: string;
  highlighted: boolean;
  onMove: (at: Seconds, to: Seconds) => void;
}) {
  const t = useT();
  const colour =
    segment.kind === "break"
      ? "var(--color-flag)"
      : segment.typeId
        ? categoryColor(project, segment.typeId)
        : "var(--color-accent)";

  return (
    <li
      className={`rounded-xl border px-3 py-2 ${
        highlighted ? "border-accent bg-accent/10" : "border-line bg-surface-3"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: colour }}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg-bright">
          {label}
        </span>
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {formatDuration(segment.end - segment.start)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="shrink-0 text-sm text-muted tabular-nums">
          {formatTimeOfDay(segment.start)} –
        </span>
        {segment.running ? (
          <span className="text-sm text-muted">{t("timeline.running")}</span>
        ) : (
          <>
            {/* Uncontrolled, committed on blur, and re-seeded by its key
                when the move lands: re-assigning the value of a native time
                input mid-interaction dismisses iOS's wheel picker. */}
            <input
              key={segment.end}
              type="time"
              aria-label={t("timeline.endOf", { name: label })}
              defaultValue={toTimeInput(segment.end)}
              onBlur={(e) => {
                const next = parseTimeOfDay(e.currentTarget.value);
                if (next === null) return;
                // An end typed before the stretch began is the next day's —
                // a night shift, or a lunch that ran past midnight.
                onMove(
                  segment.end,
                  next < segment.start ? next + 86_400 : next,
                );
              }}
              className="w-[7.5rem] min-w-0 shrink rounded-md border border-line bg-surface-2 px-2 py-1 text-sm text-fg tabular-nums outline-none focus:border-accent"
            />
            <div className="ml-auto flex shrink-0 gap-1">
              <Nudge
                label={t("timeline.earlier")}
                onClick={() => onMove(segment.end, segment.end - STEP)}
              >
                −5
              </Nudge>
              <Nudge
                label={t("timeline.later")}
                onClick={() => onMove(segment.end, segment.end + STEP)}
              >
                +5
              </Nudge>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function Nudge({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="min-h-8 rounded-md border border-line bg-surface-2 px-2 text-xs font-bold text-fg tabular-nums hover:bg-surface-2/70"
    >
      {children}
    </button>
  );
}
