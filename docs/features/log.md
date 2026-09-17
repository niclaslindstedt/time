# Log

The day as a list — what the clock drew, row by row — and the place a wrong
time is corrected.

## Reading a day

The header names the day (Today, Yesterday, or the date) with arrows to page
through the days; tapping the name jumps back to today. A **…** button beside
the name holds what you can do to the whole day.

Under it, the day's four figures, drawn as two rings:

- **Started and stopped** on a twelve-hour dial. Every stretch the day was
  present is an arc on the ring, so a day worked in two goes round as two arcs
  with the gap between them showing; the first clock-in and the last clock-out
  are the two hands. A day still running has one hand and an arc that reaches
  the moment you are reading it at.
- **Worked and breaks** as a ring split between them — worked in the accent,
  breaks in the flag colour, the day's worked total in the middle.

Both are drawn from the same `dayTotals` and `presenceIntervals` the Today
screen and the Report read; neither counts anything of its own.

Then three sections:

- **Working** — the sessions, with their times.
- **Breaks** — each break with its kind and times.
- **Working on** — each activity with its kind and times.

Each row prints its two times as pills — `07:45` – `11:30` — so the pair is
what the eye lands on. A span still running shows "still running" in place of
an end. A day in the past is read up to midnight, so a session nobody closed
still ends.

This is the place for a wrong _span_ — one end of one row at a time. The
Today screen's clock face edits the day's _edges_ instead, moving both sides
of a moment at once; see [`today.md`](today.md).

Each break and activity row is headed by its kind's mark — a break in the
flag colour, a kind of work in its own — so the list is scanned the same way
the Today screen's buttons are. Sessions have no mark: they are presence, not
a kind of anything.

## Editing

Tap a row to open the editor: the kind (for a break or an activity), the
start, the end, and a **Still running** switch. **Cancel** and **Save** sit at
the top of the dialog, left and right of its title, well clear of the tabs at
the foot of the screen. An end earlier than the start is read as the next
day's — a night shift. **Delete** sits at the end of the form and removes the
row after a confirmation. The **+** in a section's corner adds a span of that
kind after the fact; it is greyed out when the project has no kind to add one
of yet.

The editor refuses an edit that would make the span invalid, or would open a
second running span of the same kind, and says so.

**… → Delete** removes everything logged for the day, after a confirmation.
The button is greyed out on a day with nothing logged.

Every edit goes through the same pure functions the Today screen uses (see
[`../day-model.md`](../day-model.md)), so the totals move at once.
