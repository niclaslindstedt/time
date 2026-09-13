# Report

What the days add up to, for the employer in use.

## The range

**Week** or **Month**, with arrows to step back and forward and the title to
jump to the current one. The week follows the **Week starts on** setting.

## The tiles

- **Worked** — hours worked in the range.
- **Target** — the hours expected: the employer's day length for every working
  day in the range that has come. A day still ahead counts nothing yet.
- **Balance** — worked minus target for the range.
- **Overall balance** — the same, from the first day ever logged to today.

## The charts

- **Hours per day** — a column per day of the range, worked against target.
  A Saturday has no target column; hours on it are all balance.
- **Where the hours went** — a donut of worked time by kind of work, with the
  uncategorised remainder, in the same colours as the Today screen's chips and
  clock.
- **Breaks** — break time by kind.

The line at the foot says how many days were worked out of how many were
expected.

Every figure is `summarizeRange` over the same `dayTotals` the Today screen
ticks against — see [`../day-model.md`](../day-model.md) — so the report can
never disagree with the timer.
