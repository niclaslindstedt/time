# Today

The main screen, and the whole app for most of a day.

## What it shows

- **The clock.** A wrist watch's dial with the hands at now, and the day
  drawn on it as one ring. Time worked is the accent — a band with a thin
  line along its outer edge. A kind of work takes the band in its own hue
  (the same hue the chips and the report use) and leaves the thin line the
  accent; a break is the flag colour, band and line both. The legend under
  the clock names them on a phone. The part of a break that has not happened
  yet is drawn at half strength: it is a plan, not a record. The watch itself
  — its face, its markers, its numerals, how its second hand moves, and how
  much of the screen it takes — is yours to pick under **Settings → The
  clock** (see [`themes.md`](themes.md)).
- **The printing.** The dial is printed the way a watch is: the app's mark
  and name under twelve, in wide spaced capitals; under them the movement's
  word — AUTOMATIC for a mechanical, QUARTZ for a quartz, GLIDE for a glide
  wheel — and above six a window where a date would be, with the Settings
  cog in it. That cog is Settings; over the watch the top bar carries
  neither the name nor a cog, and on a phone, with nothing else to show on
  it, there is no bar at all: the watch is the top of the screen.
- **Coming back to it.** Leave the tab for an hour and the hands are an hour
  behind. They are not swapped for the right time — the watch is _set_. The
  crown winds forward: the minute hand goes round once for every hour there
  is to make up and the hour hand creeps after it at a twelfth of the rate,
  easing in and easing out, and the second hand is held still throughout,
  because a crown does not move it. Only once the hour and the minute are
  right is it let go, forward to the second it is actually on. A longer sleep
  is a longer wind, up to about three seconds; a gap of a couple of seconds
  is not one at all, and simply ticks. With reduced motion asked for there is
  no wind: the hands are at the time.
- **The bezel is the percentage.** It fills clockwise from twelve as the day
  is worked, closing the loop at 100% of the target — and past it, goes round
  again in the flag colour, so overtime is the bezel overshooting rather than
  a number to read. There is no timer: a figure ticking up said what the ring
  already draws, and it was the loudest thing on the screen. (A screen reader
  still gets the percentage, from the line under the dial.)
- **The light behind the case** says whether the day is being counted. It
  beats while you are working, holds low and steady in the break colour on a
  break, and is off when you are not working. Its colour, its beat, how bright
  it is and how far it reaches are under **Settings → The clock → Backlight**.
  On a phone the face keeps that reach clear above the case, so the halo is
  whole rather than cut flat where the screen begins.
- **The line under the dial.** The day's state in words — "Working · since
  08:02", "On a break · Lunch until 12:30", "Not working · Stopped at 17:10".
- **The buttons.** A row of break buttons, one per break type the project
  defines, each showing its mark and the length it is assumed to take; tapping
  one takes it now — written down as the length its kind usually takes, to be
  corrected on the clock — and the button turns into **End lunch** for as long
  as you are on it. A row of chips, one per kind of work, each wearing its own mark in
  its own colour; tapping one says that is what you are doing from now, tapping
  it again stops labelling. Both rows end in **Custom**. Breaks and chips are disabled until you have started working.
  On a desk the two rows stand either side of the dial, breaks to its left
  and kinds of work to its right.

There is no start button. **The face is the switch**: press it to start
working, press it again to stop — the way a watch has one crown. The light
comes up and the line under the dial says so.

Everything on the screen is derived from the day's spans up to the current
second (see [`../day-model.md`](../day-model.md)); the screen holds no state
of its own.

## Taking a break

Tapping a break writes it down there and then, ending at the length its kind
is assumed to take — half an hour of lunch, a quarter of coffee. You do not
have to come back and tell the app you are back: the day is on a break until
that end passes and then goes on counting by itself.

That end is a guess, so the clock face prints it on the rim next to the arc it
ends. Tapping the time — or the stretch itself on the ring — opens the day's
stretches, where it is corrected. Back earlier than assumed? Tap **End
lunch** and the break ends now instead.

While a break is on, the kind of work you are doing turns the break's colour
and says **paused**: a break carves time out of the day, so nothing is being
counted towards planning while the coffee is on. It is still the kind of work
you go back to when the break ends.

## Correcting the day

Two corrections live on this screen, because they are the two that are noticed
here:

- **The line under the dial** opens the arrival. The app tends to be opened
  after the fact — you are at the desk, the kettle has boiled, and it is
  twenty past — so the nudges go backwards first (−30, −15, −5) and the modal
  says what the change makes of the day before you save it.
- **A stretch on the ring** opens the day stretch by stretch: working, lunch,
  working. Each
  end can be moved, by typing a time or nudging it five minutes either way, and
  moving one moves both sides of it — a lunch that ended at 12:20 rather than
  12:10 is a coding session that started at 12:20. An edge cannot be pushed
  over its neighbour.

None of this was timed to the second, and the screen says so: it is the shape
of the day, not a stopwatch.

## Custom

The last pill in each row is **Custom**. It names a kind of break (with the
minutes one is assumed to take) or a kind of work, gives it a mark — and a
kind of work a colour — adds it to the project, and starts it — so the walk nobody set up in advance is two taps rather than a trip
to the project form. It stays there afterwards as another pill; renaming or
removing it is the project form's job (see [`projects.md`](projects.md)).

## On a desk

From 1024px wide the app is a desk rather than a phone: the four places move
to the top bar as tabs, the bottom bar goes, and Settings slides in over the
right-hand edge so the dial is still in view while a watch face is picked. A
settings page longer than the window scrolls inside that panel; the desk
behind it holds still.

The dial takes the share of the window's height its size asks for (see
[`themes.md`](themes.md)), with the breaks to its left and the kinds of work
to its right. The screen is laid out to the window and does not scroll — the
light behind the dial reaches past the edge of it on purpose, and a
decoration is not something to scroll to.

Under a mouse the ring answers the pointer. Rest on a stretch and it says
what the stretch was and when; press the right button anywhere on the dial
and a menu opens where the pointer is with everything the day can do — start
or stop, each break, each kind of work, the arrival, the stretches. The cog
in the window above six opens the Settings panel, as `,` does. The
keyboard reaches the same things: `S` starts or stops working, `1`–`9` pick
the kinds of work in the order the project lists them, `,` opens Settings and
`P` the projects. A key held with ⌘, Ctrl or Alt is left to the browser, and
nothing fires while you are typing in a field or a dialog is open.

A dialog has two keys of its own. **Enter** is its Save button — so the
"Custom" pill is a name typed and filed without the pointer ever moving, and
the field has the keyboard the moment the dialog opens. **Escape** is its
Cancel. Enter is left alone wherever it already does a job: on a focused
button it presses that button, and it saves nothing while Save is greyed
out.

While the day is being counted the browser tab's title carries the time
worked and the state, so the tab strip is a glance at the day.

## The first run

With no project yet, the screen asks for one. **Add project** opens the
editor (see [`projects.md`](projects.md)); saving makes it the project in
use and the clock is ready.
