# Today

The main screen, and the whole app for most of a day.

## What it shows

- **The readout.** The day's state ("Working since 08:02", "Lunch until
  12:30", "Not working · Stopped at 17:10"), the running timer of hours worked,
  and under it the target, today's balance and the overall balance. The whole
  card turns the break colour while a break is on, because the timer has
  stopped moving and that should be visible from across the room.
- **The card's border is the percentage.** It starts at the top edge's middle
  and fills clockwise as the day is worked, closing the loop at 100% of the
  target — and past it, goes round again in the flag colour, so overtime is
  the frame overshooting rather than a number to read. There is no percentage
  printed beside the timer: the frame is it. (A screen reader still gets the
  figure, from the timer's own label.)
- **The clock.** A wrist watch's dial with the hands at now, and the day
  drawn on it as one ring. Time worked is the accent — a band with a thin
  line along its outer edge. A kind of work takes the band in its own hue
  (the same hue the chips and the report use) and leaves the thin line the
  accent; a break is the flag colour, band and line both. The legend under
  the clock names them. The part of a break that has not happened yet is
  drawn at half strength: it is a plan, not a record. The watch itself — its
  face, its markers, its numerals, how its second hand moves, and how much of
  the screen it takes — is yours to pick under **Settings → The clock** (see
  [`themes.md`](themes.md)).
- **The buttons.** One loud one, **Start working** / **Stop working**. A row of
  break buttons, one per break type the project defines, each showing the
  length it is assumed to take; tapping one takes it now, and the button turns
  into **End lunch** for as long as you are on it. A row of chips, one per kind
  of work; tapping one says that is what you are doing from now, tapping it
  again stops labelling. Both rows end in **Custom**. Breaks and chips are
  disabled until you have started working.

Everything on the screen is derived from the day's spans up to the current
second (see [`../day-model.md`](../day-model.md)); the screen holds no state
of its own.

## Taking a break

Tapping a break writes it down there and then, ending at the length its kind
is assumed to take — half an hour of lunch, a quarter of coffee. You do not
have to come back and tell the app you are back: the day is on a break until
that end passes and then goes on counting by itself.

That end is a guess, so the clock face prints it on the rim next to the arc it
ends. Tapping the time — or anywhere on the rings — opens the day's stretches,
where it is corrected. Back earlier than assumed? Tap **End lunch** and the
break ends now instead.

While a break is on, the kind of work you are doing turns the break's colour
and says **paused**: a break carves time out of the day, so nothing is being
counted towards planning while the coffee is on. It is still the kind of work
you go back to when the break ends.

## Correcting the day

Two corrections live on this screen, because they are the two that are noticed
here:

- **The timer** opens the arrival. The app tends to be opened after the fact —
  you are at the desk, the kettle has boiled, and it is twenty past — so the
  nudges go backwards first (−30, −15, −5) and the modal says what the change
  makes of the day before you save it.
- **The clock** opens the day stretch by stretch: working, lunch, working. Each
  end can be moved, by typing a time or nudging it five minutes either way, and
  moving one moves both sides of it — a lunch that ended at 12:20 rather than
  12:10 is a coding session that started at 12:20. An edge cannot be pushed
  over its neighbour.

None of this was timed to the second, and the screen says so: it is the shape
of the day, not a stopwatch.

## Custom

The last pill in each row is **Custom**. It names a kind of break (with the
minutes one is assumed to take) or a kind of work, adds it to the project, and
starts it — so the walk nobody set up in advance is two taps rather than a trip
to the project form. It stays there afterwards as another pill; renaming or
removing it is the project form's job (see [`projects.md`](projects.md)).

## The first run

With no project yet, the screen asks for one. **Add project** opens the
editor (see [`projects.md`](projects.md)); saving makes it the project in
use and the clock is ready.
