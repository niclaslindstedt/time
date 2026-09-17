# Log

The day as a list — what the clock drew, row by row — and the place a wrong
time is corrected.

## Reading a day

The header names the day (Today, Yesterday, or the date) with arrows to page
through the days; tapping the name jumps back to today. Under it, four
figures: started, stopped, worked, and break time. Then three sections:

- **Working** — the sessions, with their times.
- **Breaks** — each break with its kind and times.
- **Working on** — each activity with its kind and times.

A span still running shows "still running" in place of an end. A day in the
past is read up to midnight, so a session nobody closed still ends.

This is the place for a wrong _span_ — one end of one row at a time. The
Today screen's clock face edits the day's _edges_ instead, moving both sides
of a moment at once; see [`today.md`](today.md).

## Editing

Tap a row to open the editor: the kind (for a break or an activity), the
start, the end, and a **Still running** switch. **Cancel** and **Save** sit at
the top of the dialog, left and right of its title, well clear of the tabs at
the foot of the screen. An end earlier than the start is read as the next
day's — a night shift. **Delete** sits at the end of the form and removes the
row after a confirmation. Each section has a button to add a span after the
fact.

The editor refuses an edit that would make the span invalid, or would open a
second running span of the same kind, and says so.

**Delete this day** removes everything logged for the day.

Every edit goes through the same pure functions the Today screen uses (see
[`../day-model.md`](../day-model.md)), so the totals move at once.
