# The day model

Everything the app shows is derived from three lists per day, and the
derivation is a handful of set operations. This page is the rule; the code is
`src/app/day.ts` and `src/app/report.ts`, and the tests in `tests/day_test.ts`
and `tests/report_test.ts` pin it to real times.

## Three lists

A `WorkDay` holds, for one project on one calendar day:

- **Sessions** — presence. Between starting work and stopping. This
  is the only claim of time.
- **Breaks** — pauses inside presence, each of a type the project defines
  (lunch, coffee, a walk).
- **Activities** — what kind of work was going on (meetings, coding). A label
  over presence, never a claim of presence on its own.

Every span is `[start, end)` in seconds since the day's local midnight, `end`
being null while it is still running. A break is the exception in practice: it
is written down with an end from the moment it starts (see
[the break's assumed end](#the-breaks-assumed-end)), so its end is usually a
figure to correct rather than one to wait for.

## The derivation

Read up to a moment `now`:

```
presence  = union(sessions)                       clipped to now
breaks    = union(break spans) ∩ presence
credit    = the part of those breaks the project counts as work
worked    = presence − breaks + credit
category  = its activity spans ∩ worked
```

So:

- **Breaks carve time out.** A 30-minute lunch inside a nine-hour session is
  eight and a half hours worked.
- **Unless the project counts them.** A kind of break says how much of one
  still counts as work — none of it, all of it, or the first so many minutes
  of it in a day — and that much is handed back (see
  [What a break counts for](#what-a-break-counts-for)). Nothing else about it
  changes: it is still a break in the lists, still the flag colour on the
  clock, and `breakTotal` still reports the whole of the time spent on
  breaks.
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
"working"; a break `now` falls inside makes it "on a break"; no open session is
"not working".

### The break's assumed end

Nobody taps "I'm back" reliably, so a break is not left running until somebody
remembers it. `takeBreak` writes the end down with the start, the length the
project assumes that kind of break takes — lunch half an hour, coffee a
quarter — and the day is "on a break" until that end passes, whether or not
anything else is tapped.

That makes the end a **guess**, and the app treats it as one. `horizon` is how
far past `now` the shape of the day is known: normally not at all, but during
a break it reaches that break's end, which is what lets the clock draw the
break to 12:30 at 12:10 and print the time on the rim to be corrected. The
_totals_ never read past `now` — a minute not yet worked is not worked — so
the timer is unaffected by a break that has not finished.

Ending a break early is "I'm back": its end moves to now. A break with less
than a minute left of it after that is dropped rather than kept, because it is
the wrong pill corrected a second later, not a minute of lunch.

### What a break counts for

A break carves time out of presence — that is what a break is — but not every
employer counts every one of them. So each kind of break carries an answer:

| Answer                                       | What a break of the kind counts for                         |
| -------------------------------------------- | ----------------------------------------------------------- |
| none _(what an unanswered break counts for)_ | Nothing. The whole of it comes off the day.                 |
| all of it                                    | All of it. The day is as long as if it had not been taken.  |
| the first _n_ min                            | The first _n_ minutes of that kind in the day, and no more. |

The minutes of a partial answer are counted **over the whole day rather than
per break**, which is what makes them a rule rather than a loophole: a project
that counts half an hour of lunch counts half an hour of lunch whether it was
taken in one sitting or three.

The credit reaches the _totals_ and not the _intervals_. `workedIntervals` is
still the stretches actually spent working, so the clock still draws a counted
break as a break and the Log still lists it; what changes is only what it
counted for. `dayTotals` reports both — `breakTotal` is all the break time,
`breakCreditTotal` the part of it that counted — so nothing is counted twice,
and `worked` is longer than the stretches by exactly that much.

Absent means none, so a break counts for nothing until somebody says
otherwise, and no day already logged changes when the app is updated. A _new_
project is made with one answer of its own — the toilet break counts as work
(`DEFAULT_TOILET_CREDIT`) — and the rest are yours. Because
the answer belongs to the _project_, `dayTotals` takes the project as well as
the day.

### When the day is done

`workdayEnd` is the one figure the app draws about a moment that has not
happened: when the day's target will be met, if the work carries on from here
without another break. It is a projection, not a promise, and the assumption
under it is deliberately the plain one — guessing what the rest of the day
holds would make a leaving time worse than no leaving time.

It walks the day's stretches rather than dividing what is left by one, because
the rate the target is worked towards is not one all day: a break the project
counts as work counts while you are on it, and a break it does not counts for
nothing. Past the end of what the day already knows — a break written down
with an assumed end reaches into the future — the work simply goes on.

It says nothing at all on a day the project expects no work on, on a project
with no target, or before the day has started. A moment in the _past_ is a
real answer: it is when the hours were done, on a day that carried on past
them.

### The day as stretches

`daySegments` reads the same intervals as one ordered list of the stretches
the day is made of: working (at one kind of work, or at none), then lunch,
then working again. Consecutive stretches meet — the end of one _is_ the start
of the next — which is what makes an end movable. `boundaryRange` says how far
an edge may move: up to its neighbours, a minute clear of each, so no stretch
is squeezed out of existence.

This is the derivation behind the clock face's break times and the stretch
list they open, and it is derived from the spans like everything else: there
is no second copy of the day to keep in step.

`dayTotals` returns all of it at once — presence, worked, breaks by type, what
those breaks counted as work, time by category, uncategorised, the state, the
open spans, the first start and the last stop — and the three screens read the
same object. **Progress** is worked over the
project's target for the day, unclamped: 112% is overtime, not an error.

## The edits

`actions.ts` is the set of edits a day can take, each a pure function from a
day to a new day:

| Edit                                    | Rule                                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clockIn`                               | Opens a session; a no-op while one is open. Inside a minute of the last one having ended, reopens that one instead — gap and kind of work and all.        |
| `clockOut`                              | Closes the session, and the running break and activity with it. Drops the session outright, with whatever began inside it, when it is under a minute old. |
| `takeBreak`                             | Needs an open session; writes a break of the kind's assumed length, ending a break already going on first.                                                |
| `endBreak`                              | "I'm back": ends the break `now` falls inside, dropping it if under a minute is left of it.                                                               |
| `setCategory`                           | Needs an open session; closes the running activity, opens one of the new kind.                                                                            |
| `addBreak`, `addSession`, `addActivity` | After the fact, with both ends (or an open end, if none of that kind is open).                                                                            |
| `setSessionStart`                       | Moves when a session began — the arrival, corrected from the timer. Refused if it reaches back over an earlier session.                                   |
| `moveBoundary`                          | Moves a moment two stretches meet at: everything that starts or ends there moves, so a later lunch end is a later start for the work after it.            |
| `updateSpan`, `removeSpan`              | Move a span's ends or kind, or drop it. An edit that would make it invalid is refused.                                                                    |

A span closed in the second it opened is dropped rather than stored inverted.
The face is held to a minute either side: a session stopped less than a minute
after it started never happened, and a session started less than a minute after
one stopped is that same one picked back up rather than a second stretch — the
two presses cancel out, so a mis-tap leaves the day exactly as it was. Breaks
are held to the same minute by `endBreak`. A short span typed into the Log on
purpose is untouched by either rule; the threshold is about the face, not about
the document.
Pushing a boundary forward drags along anything that started inside the stretch
it swallows and drops what it swallowed whole; a move that would invert a
session is refused outright, because presence has two ends and both of them are
the Log's to correct.

Ids and the `updatedAt` stamp come in through a `ctx` argument, so the module
never touches chance or the clock.

## The report

`summarizeDay` measures one day against the project:

- **expected** — whether the project's working days include the date;
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

Two modules lay a `RangeSummary` out for drawing, and neither reads a day
again: `dayBars.ts` splits each day's hours at its target — the part inside
it, the part past it, and the part of the target left unworked — so the week
is one column a day rather than two bars to compare; `monthChart.ts` packs a
month into week rows of day boxes. Both are pure and clock-free, and both take
`today` as an argument, so a day that has not come is a track waiting rather
than a shortfall.
