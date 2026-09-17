// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import {
  addDays,
  addMonths,
  parseDayKey,
  type DayKey,
  type WeekStart,
} from "@niclaslindstedt/oss-framework/calendar";
import { BarChart, DonutChart } from "@niclaslindstedt/oss-framework/charts";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Section,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import { DayBars } from "./DayBars.tsx";
import { dayBars } from "./dayBars.ts";
import {
  formatDay,
  formatDuration,
  formatHours,
  formatMonth,
} from "./format.ts";
import {
  ChartIcon,
  CupIcon,
  HourglassIcon,
  KindGlyph,
  TagIcon,
} from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import {
  breakName,
  categoryColor,
  categoryGlyph,
  categoryName,
} from "./labels.ts";
import { MonthCalendar } from "./MonthCalendar.tsx";
import { monthChart } from "./monthChart.ts";
import { RangeGlance } from "./RangeGlance.tsx";
import { monthOf, runningBalance, summarizeRange, weekOf } from "./report.ts";
import type { AppData, Project } from "./types.ts";
import { useNow } from "./useNow.ts";

// What the days add up to: worked against target per day, where the hours
// went, what the breaks took, and the balance. Everything is a fold over the
// same `dayTotals` the Today screen ticks against (see `report.ts`), so the
// number here is the number there.

type Range = "week" | "month";

type Props = {
  data: AppData;
  project: Project | null;
  weekStartsOn: WeekStart;
};

export function ReportScreen({ data, project, weekStartsOn }: Props) {
  const t = useT();
  const now = useNow(60_000);
  const [range, setRange] = useState<Range>("week");
  // The anchor day the range is built around; stepping moves it a week or a
  // month.
  const [anchor, setAnchor] = useState<DayKey>(now.today);

  const span = useMemo(
    () => (range === "week" ? weekOf(anchor, weekStartsOn) : monthOf(anchor)),
    [range, anchor, weekStartsOn],
  );

  const summary = useMemo(
    () =>
      project
        ? summarizeRange(
            data,
            project,
            span.from,
            span.to,
            now.today,
            now.seconds,
          )
        : null,
    [data, project, span, now.today, now.seconds],
  );
  const overall = useMemo(
    () => (project ? runningBalance(data, project, now.today, now.seconds) : 0),
    [data, project, now.today, now.seconds],
  );
  // A month is twenty-odd working days, and a column per day leaves the axis
  // a smear of numbers: the month is laid out as a calendar of boxes instead,
  // a row per week. A week is seven columns and reads fine as bars.
  const calendar = useMemo(
    () =>
      project && summary && range === "month"
        ? monthChart(summary, project, weekStartsOn, now.today)
        : null,
    [project, summary, range, weekStartsOn, now.today],
  );
  const bars = useMemo(
    () =>
      project && summary && range === "week"
        ? dayBars(summary, project, now.today)
        : null,
    [project, summary, range, now.today],
  );

  if (!project || !summary) {
    return (
      <div className="px-3 py-3">
        <div className="rounded-2xl border border-line bg-surface-3 p-6 text-center">
          <p className="text-sm text-muted">{t("report.noProject")}</p>
        </div>
      </div>
    );
  }

  const step = (direction: 1 | -1) =>
    setAnchor((a) =>
      range === "week" ? addDays(a, 7 * direction) : addMonths(a, direction),
    );
  const parts = parseDayKey(span.from);
  const title =
    range === "week"
      ? `${formatDay(span.from)} – ${formatDay(span.to)}`
      : parts
        ? formatMonth(parts.year, parts.month)
        : span.from;
  const current =
    range === "week"
      ? weekOf(now.today, weekStartsOn).from === span.from
      : monthOf(now.today).from === span.from;

  const categoryEntries = project.categories
    .map((c) => ({ id: c.id, value: summary.categories[c.id] ?? 0 }))
    .filter((c) => c.value > 0);
  // Categories the project has since deleted still hold time; they are
  // shown under their placeholder name rather than dropped.
  for (const [id, value] of Object.entries(summary.categories)) {
    if (!project.categories.some((c) => c.id === id) && value > 0) {
      categoryEntries.push({ id, value });
    }
  }
  const breakEntries = Object.entries(summary.breaks)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <SegmentedControl<Range>
        value={range}
        options={[
          { value: "week", label: t("report.week") },
          { value: "month", label: t("report.month") },
        ]}
        onChange={(next) => {
          setRange(next);
          setAnchor(now.today);
        }}
        ariaLabel={t("report.title")}
        fullWidth
      />

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={t("common.previous")}
          onClick={() => step(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted hover:bg-surface-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setAnchor(now.today)}
          className="min-w-0 flex-1 text-center"
        >
          <span className="block text-lg font-bold text-fg-bright">
            {title}
          </span>
          <span className="block text-xs text-muted">
            {current
              ? range === "week"
                ? t("report.thisWeek")
                : t("report.thisMonth")
              : t("report.workedDays", {
                  count: String(summary.workedDays),
                  expected: String(summary.expectedDays),
                })}
          </span>
        </button>
        <button
          type="button"
          aria-label={t("common.next")}
          onClick={() => step(1)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted hover:bg-surface-2"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <RangeGlance
        worked={summary.worked}
        target={summary.target}
        balance={summary.balance}
        overall={overall}
      />

      <Section
        title={calendar ? t("report.perWeek") : t("report.perDay")}
        icon={<ChartIcon className="h-3.5 w-3.5" />}
      >
        {calendar ? (
          summary.worked === 0 ? (
            <p className="text-xs text-muted">{t("report.empty")}</p>
          ) : (
            <MonthCalendar chart={calendar} />
          )
        ) : (
          bars && <DayBars chart={bars} today={now.today} />
        )}
      </Section>

      {categoryEntries.length > 0 && (
        <Section
          title={t("report.categories")}
          icon={<TagIcon className="h-3.5 w-3.5" />}
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <DonutChart
              segments={[
                ...categoryEntries.map((c) => ({
                  value: c.value,
                  label: categoryName(t, project, c.id),
                  color: categoryColor(project, c.id),
                })),
                ...(summary.uncategorised > 0
                  ? [
                      {
                        value: summary.uncategorised,
                        label: t("common.uncategorised"),
                        color: "var(--color-muted)",
                      },
                    ]
                  : []),
              ]}
              size={150}
              formatValue={formatDuration}
              innerLabel={
                <span className="text-sm font-bold text-fg-bright tabular-nums">
                  {formatDuration(summary.worked)}
                </span>
              }
              ariaLabel={t("report.categories")}
              desc={t("report.categoriesDesc")}
            />
            <ul className="flex w-full flex-col gap-1 text-sm">
              {categoryEntries.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <KindGlyph
                    id={categoryGlyph(project, c.id)}
                    className="h-4 w-4 shrink-0"
                    style={{ color: categoryColor(project, c.id) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-fg">
                    {categoryName(t, project, c.id)}
                  </span>
                  <span className="text-muted tabular-nums">
                    {formatDuration(c.value)}
                  </span>
                </li>
              ))}
              {summary.uncategorised > 0 && (
                <li className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted"
                  />
                  <span className="min-w-0 flex-1 truncate text-fg">
                    {t("common.uncategorised")}
                  </span>
                  <span className="text-muted tabular-nums">
                    {formatDuration(summary.uncategorised)}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </Section>
      )}

      {breakEntries.length > 0 && (
        <Section
          title={t("report.breaks")}
          icon={<CupIcon className="h-3.5 w-3.5" />}
        >
          <BarChart
            series={[
              {
                values: breakEntries.map(([, v]) => v / 3600),
                color: "var(--color-flag)",
              },
            ]}
            labels={breakEntries.map(([id]) => breakName(t, project, id))}
            horizontal
            formatValue={(v) => formatHours(v * 3600)}
            ariaLabel={t("report.breaks")}
            desc={t("report.breaksDesc")}
          />
          <p className="text-xs text-muted">
            {t("report.total")}: {formatDuration(summary.breakTotal)}
          </p>
        </Section>
      )}

      <p className="flex items-center gap-1.5 px-1 text-xs text-muted">
        <HourglassIcon className="h-3.5 w-3.5 shrink-0" />
        {t("report.workedDays", {
          count: String(summary.workedDays),
          expected: String(summary.expectedDays),
        })}
      </p>
    </div>
  );
}
