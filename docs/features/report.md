# Report

What the days add up to, for the project in use.

## The range

**Week** or **Month**, with arrows to step back and forward and the title to
jump to the current one. The week follows the **Week starts on** setting.

## The two rings

The range's four figures are drawn rather than printed — the **Log**'s header,
one screen up. Two cards, a ring each, with the pair of figures the ring is
made of underneath.

- **The share** — how much of what the range asked for has been done, filled
  from twelve clockwise and, past the target, going round again in the flag
  colour: the very bezel the **Today** screen draws a day's progress on. The
  middle prints the percentage. Under it:
  - **Worked** — hours worked in the range.
  - **Target** — the hours expected: the project's day length for every
    working day in the range that has come. A day still ahead counts nothing
    yet.
- **The balance** — an arc growing out of twelve, in the red of a shortfall or
  the green of time in hand, against the range's own target, so a week half a
  day behind is a ring a sixteenth red. The middle prints the balance. Under
  it:
  - **Balance** — worked minus target for the range.
  - **Overall** — the same, from the first day ever logged to today.

## The charts

- **Hours per day** (a week) — a column per day of the range. See below.
- **Hours per week** (a month) — the month as a calendar of boxes. See below.
- **Where the hours went** — a donut of worked time by kind of work, with the
  uncategorised remainder, in the same colours as the Today screen's chips and
  clock. The list beside it names each kind with its own mark.
- **Breaks** — break time by kind.

## The week, as a bar a day

A day is two figures — what it was meant to take and what it took — and one
column says both. The **target is the track**: the height the day was asked
for, standing in place whether or not it was filled. The **hours worked fill
it from the floor up**, and when the day ran long they carry straight on past
the top of the track in the flag colour, so the target ends up _underneath_
the bar that overtook it.

That makes the two ways a day can go two shapes rather than two bars to
compare:

- **Short** — the rest of the track is left showing above the green. The gap
  is the shortfall, read as a gap.
- **Long** — the column rises past the top of the track, and the change of
  colour is exactly where the target was.

A **Saturday** has no track at all, because the project expects nothing of it:
every hour worked on one is above the target from the first minute, and the
whole column is drawn in the flag colour. A **day still ahead** shows its
track, fainter — the hours are coming, and the gap in it is not yet a
shortfall. Today's name under its column is the bold one.

Pointing at a column names the day, its hours, its target and its balance.

## The month, as a calendar of boxes

A month is twenty-odd working days, and a column each leaves the axis a smear
of date numbers. So the month is drawn a **row to the week** and a **box to the
day** — each week one rounded bar, divided into its days and held a few pixels
clear of the week above — and both axes are hours:

- **Across**, a box is as wide as the hours that day worked, and the boxes of a
  week butt up against each other — so a box's right edge is the hours the week
  had put in by the end of that day. A day nothing was worked takes no width at
  all, which is why a normal week shows five boxes rather than seven.
- **Down**, a row is as tall as the hours that week worked, and the rows stack —
  so a row's bottom edge, which is what the hours down the side are counting, is
  the hours the month had put in by the end of that week. The last one is the
  month's total, the same figure the **Worked** ring prints.

A box's **colour** is how the day went against its target: red at nothing
worked, green on the target, blue a fifth past it, and the mixes between. A day
the project expects nothing of — a Saturday — is green whatever was worked,
because there was no target to fall short of, and a day that has not come yet is
not coloured at all.

Two dotted lines, and only two: **across** at a full week of work (the
project's working days at its day length), so a row that reaches it did the
week; **down** at the month's target, so the gap between it and the last row's
foot is what the month is behind.

Pointing at the chart outlines what you are on and hangs a card over it. On a
**box** the card gives that day: the hours worked as the figure, then the target
and the balance under it, keyed by the day's own colour. On the **rest of a
row** — either side of its boxes, the margins included, so a week that fills the
width is still reachable from the left — it gives that week: the days it covers,
its hours, its target and its balance. On a touch screen, tap rather than hover.

The card is a convenience, not the only way to the numbers: the rings above hold
the month's, and the **Log** has every day as a list.

The **grey boxes** at either end are the neighbouring month's days. A month
rarely starts on a Monday, and those days are not this month's to count: they
are laid out at the width a working day is meant to take, which keeps the days
after them at the hour a whole week would put them at, and they add nothing to
any row's height, which keeps the hours down the side this month's alone.

The line at the foot says how many days were worked out of how many were
expected.

Every figure is `summarizeRange` over the same `dayTotals` the Today screen
ticks against — see [`../day-model.md`](../day-model.md) — so the report can
never disagree with the timer.
