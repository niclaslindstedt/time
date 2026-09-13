# The day model

Everything the app shows is derived from three lists per day, and the
derivation is a handful of set operations. This page is the rule; the code is
`src/app/day.ts` and `src/app/report.ts`, and the tests in `tests/day_test.ts`
and `tests/report_test.ts` pin it to real times.

## Three lists

A `WorkDay` holds, for one employer on one calendar day:

- **Sessions** — presence. Between entering the office and leaving it. This
  is the only claim of time.
- **Breaks** — pauses inside presence, each of a type the employer defines
  (lunch, coffee, a walk).
- **Activities** — what kind of work was going on (meetings, coding). A label
  over presence, never a claim of presence on its own.

Every span is `[start, end)` in seconds since the day's local midnight, `end`
being null while it is still running.

## The derivation

Read up to a moment `now`:

```
presence  = union(sessions)                       clipped to now
breaks    = union(break spans) ∩ presence
worked    = presence − breaks
category  = its activity spans ∩ worked
```

So:

- **Breaks carve time out.** A 30-minute lunch inside a nine-hour session is
  eight and a half hours worked.
- **Activities only label.** A meeting from 09:00 to 10:00 makes an hour of
  the worked time "Meetings"; the rest is uncategorised. An activity that runs
  through a break loses the break's minutes, because they were not worked.
- **Anything outside a session counts for nothing.** A break logged after
  leaving, or an activity before arriving, changes no number. A break that
  straddles the clock-out is clipped to it.
- **A running span is read up to `now`.** The Today screen passes the current
  second; the Log and the Report pass midnight for a day in the past, so a
  session nobody closed still ends.

The **state** of a day at `now` follows what is _open_, not what the clipped
intervals say: a session opened this second covers zero seconds and is still
"working"; a running break makes it "on a break"; no open session is "not at
work".

`dayTotals` returns all of it at once — presence, worked, breaks by type, time
by category, uncategorised, the state, the open spans, first-in and last-out —
and the three screens read the same object. **Progress** is worked over the
employer's target for the day, unclamped: 112% is overtime, not an error.

## The edits

`actions.ts` is the set of edits a day can take, each a pure function from a
day to a new day:

| Edit                                    | Rule                                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `clockIn`                               | Opens a session; a no-op while one is open.                                            |
| `clockOut`                              | Closes the session, and the running break and activity with it.                        |
| `startBreak`                            | Needs an open session; ends a running break of another type first.                     |
| `endBreak`                              | Closes the running break.                                                              |
| `setCategory`                           | Needs an open session; closes the running activity, opens one of the new kind.         |
| `addBreak`, `addSession`, `addActivity` | After the fact, with both ends (or an open end, if none of that kind is open).         |
| `addBreakEndingAt`                      | "I just had lunch": a break of the type's default length ending now.                   |
| `updateSpan`, `removeSpan`              | Move a span's ends or kind, or drop it. An edit that would make it invalid is refused. |

A span closed in the second it opened is dropped rather than stored inverted.
Ids and the `updatedAt` stamp come in through a `ctx` argument, so the module
never touches chance or the clock.

## The report

`summarizeDay` measures one day against the employer:

- **expected** — whether the employer's working days include the date;
- **target** — the day's length on an expected day, zero otherwise;
- **balance** — worked minus target: negative on a short day, positive on a
  long one, and every second of a day off is positive.

`summarizeRange` folds a span of dates — a week or a month — into one summary:
worked, target, balance, breaks by type, time by category, and how many days
were worked out of how many were expected. Every date in the range gets a
column, so a week's chart always has seven; but a date after today counts
nothing against the balance, because a Friday not yet worked is not a
shortfall on Wednesday.

The **running balance** is `summarizeRange` from the first logged day to
today. It is honest about gaps: an expected day with nothing logged is a full
day short.
