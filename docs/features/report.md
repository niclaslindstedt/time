# Report

What the days add up to, for the project in use.

## The range

**Week** or **Month**, with arrows to step back and forward and the title to
jump to the current one. The week follows the **Week starts on** setting. The
**…** beside the title is what else can be done with the range: today that is
[**Export to PDF**](#export-to-pdf).

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
  day behind is a ring a sixteenth red. The middle prints the balance, set as
  large as the hole it goes in has room for: a balance carries a sign and, over
  a month, three digits of hours, and it comes down a size rather than out over
  the band. Under it:
  - **This week** / **This month** — worked against what the range has _come
    due_ for.
  - **All time** — the same quantity over everything ever logged, up to
    today. It does not change as you step between ranges, because it is not
    about the range: it is the balance you are actually carrying.

  The day you are standing in is where due parts company with target. Today
  asks for its whole day — that is what the share is read against — but it
  does not _owe_ it until you have had the chance to work it, so the balance
  counts only the hours behind you. Nobody is eight hours behind at nine in
  the morning. The moment you clock out for the day, the whole of it comes
  due and a day stopped short says so; a break does not, and neither does
  stepping out and clocking back in.

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

## Export to PDF

The **…** beside the range opens **Export to PDF**: the same hours, as a
document to send with an invoice or file against a contract. It is written on
the device — no service renders it and nothing about the range leaves the
machine — and it comes out either as a file or straight at the printer.

### The style

Six styles come with the app, each drawn on a card as the **first page of your
own specification** rather than as a picture of somebody else's:

| Style         | What it looks like                                            |
| ------------- | ------------------------------------------------------------- |
| **Ledger**    | Serif, centred, every row ruled                               |
| **Studio**    | A band of colour across the top and a zebra under the figures |
| **Editorial** | Serif headings over a sans body, air between everything       |
| **Plain**     | Nothing but the hours, in decimals                            |
| **Technical** | Every stretch of every day, monospaced and boxed in           |
| **Executive** | The totals only, set large, and a line to sign on             |

**Save these as my custom style** copies whichever is selected into **Custom**,
where the pieces come apart: typeface, heading, colour, table, density, paper,
detail and figures, plus what else the document carries. Editing any of them is
editing Custom — a preset never quietly differs from what its own settings say.
Both are kept, so going back to Custom finds it as it was left.

The **typefaces** are the ones every PDF reader already has (Helvetica, Times
and Courier, under this app's own names), which is why a specification is a few
tens of kilobytes and why no font is ever fetched to make one.

### Detail

One choice decides how long the document is, and all three are the same hours:

- **The period's totals** — no day-by-day table at all.
- **A row per day** — when it started, when it ended, the break, the hours.
- **Every stretch of every day** — each spell of work and each break under its
  day, with the times they ran between. A break's length is in brackets,
  because it is not time the document bills for.

### Rounding

Optional, and **not part of a style** — a document that billed different hours
depending on the typeface it was set in would be a document nobody could trust.
Each day's hours are rounded **up** to the next 5, 6, 10, 15, 30 or 60 minutes:
a day of 5h 17m is billed as 5h 30m at a quarter of an hour, because the
convention is that a quarter begun is a quarter billed.

The range is the **sum of its rounded days**, never the range rounded once, and
what the rounding added appears as its own line in **Hours by kind of work** so
the table still adds up to the total under it. The document says in a line what
it rounded to, so whoever receives it can reconcile the figures against the
times beside them.

### What is on it

Always the project, the period and the date; then, as the style says, the
totals, hours by kind of work, break time, the day-by-day table, target and
balance, and a line to sign. **Prepared by**, **Client** and **Reference** are
typed into the form and remembered per device; a field left empty is a line the
document simply does not print.

Hours are given as **hours and minutes**, as **decimal hours** to the hundredth,
or both. The decimal column is the one an invoice line is a rate times, and it
adds up by construction: each row is rounded to the hundredth and the total is
the sum of the rows.

Target and balance are off by default. They are your figures rather than the
client's — they say how the hours stand against your own contract, not what was
worked.

### Out

- **Download PDF** saves the file as
  `<project>_<period>_specification.pdf`, lowercase and without a space in it —
  `demo_ab_september_2026_specification.pdf`.
- **Print** hands the printer the same pages the file is written from, rather
  than a picture of the preview.

The preview beside the form is the document: the pages are laid out once
(`specLayout.ts`) and drawn twice, as a PDF and as SVG, off the same
measurements. What is on screen, what comes out of the printer and what the
client opens are the same page.

### The notice

A specification exported from the **free web edition** carries a band on every
page saying what made it and where to buy the app without it. It is a build
parameter (`VITE_EDITION`, see [`../configuration.md`](../configuration.md)) —
there is no server to ask and no account to check, so the edition is the build
that was shipped. The App Store build carries no notice.

## Export for Invoice

The same **…** also exports the range as a file for the
[Invoice](https://github.com/niclaslindstedt/invoice) app: drop it on a draft
invoice there and the hours arrive as lines at the customer's price. The
form asks how the hours are cut into lines — one line for the period, a line
a day, or a line a kind of work — and shares the specification's rounding, so
the invoice bills the hours the specification sent with it shows. The file
(`<project>_<period>_invoice.json`) is a reading of the specification and
says nothing about money; the format is documented in the Invoice app's
`docs/interchange.md`.
