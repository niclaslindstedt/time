# Today

The main screen, and the whole app for most of a day.

## What it shows

- **The clock.** A wrist watch's dial with the hands at now, and the day
  drawn on a track of its own just inside the bezel — the outermost thing on
  the face, so the two rings under the case are the day's target and the
  day's shape, one outside the other, and the watch's own minute ring keeps
  its printing. Time worked is the accent — a band with a thin
  line along its outer edge. A kind of work takes the band in its own hue
  (the same hue the chips and the report use) and leaves the thin line the
  accent; a break is the flag colour, band and line both. The legend under
  the clock names them on a phone — and names only the colours the day is
  actually wearing, so a kind of work appears in it once it has been worked
  and not before. Before the first clock-in that leaves nothing to key, and
  there is no legend at all. The part of a break that has not happened
  yet is drawn at half strength: it is a plan, not a record. Nothing on the
  track moves but the day itself. The watch itself
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
  The day goes round with them. The hours worked and the breaks taken while
  the tab slept are not on the ring waiting for the hands — the bands fill in
  under them as they sweep, so the colour is laid down by the hand that is
  passing over it, and a break that is running when you come back grows into
  its own half-strength tail rather than over it.
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
  On a phone held upright the face keeps that reach clear above the case, so
  the halo is whole rather than cut flat where the screen begins. Laid down
  or on a desk the dial has air round it already.
- **The line under the dial.** The day's state in words — "Working · since
  08:02", "On a break · Lunch until 12:30", "Not working · Stopped at 17:10"
  — and, on a day the project expects work on, when today's hours are done:
  a door with an arrow out of it and a time. That time is worked out from
  what the day already holds and what its breaks count for
  ([`projects.md`](projects.md)), on the assumption that the work carries on
  from here without another break — so it moves out every time a break is
  taken that the project does not count, and stays put for one it does. It is
  a projection rather than a promise, and once the day has run past it, it is
  simply the moment the hours were done.
- **And that same moment on the dial**, as a small green dot in the day's own
  track, at the hour it falls on. It stands in the empty part of the track,
  ahead of the hours already coloured in, so the day walks towards it: the
  bands grow, the gap closes, and when the dot is reached it goes — the track
  behind the day is the record of what happened, and a mark left on it would
  go on saying the hours were still to be done at a moment they were done at.
  It is only there while the day is being counted, on a day the project asks
  work of, and only for an end inside the twelve hours the dial can show.
- **The buttons.** A row of break buttons, one per break type the project
  defines, each showing its mark and the length it is assumed to take; tapping
  one takes it now — written down as the length its kind usually takes, to be
  corrected on the clock — and the button turns into **End lunch** for as long
  as you are on it. A row of chips, one per kind of work, each wearing its own mark in
  its own colour; tapping one says that is what you are doing from now, tapping
  it again stops labelling. Both rows end in a dashed **+**, which is Custom.
  Breaks and chips take
  no tap until you have started working, and say so by going pale — but they
  still answer a hold, because what a kind looks like has nothing to do with
  being clocked in.
  Given the width — a desk, or a phone laid on its side — the two rows stand
  either side of the dial instead, breaks to its left and kinds of work to
  its right, and a list longer than the window is tall scrolls in its own
  column.

There is no start button. **The face is the switch**: press it to start
working, press it again to stop — the way a watch has one crown. The light
comes up and the line under the dial says so.

The face is exactly that, though — what lies inside the dial's own minute
ring. Everything outside it is the watch carrying the day rather than the
switch, so a press on the ring, the rim or the day's track opens the day
stretch by stretch instead: at the stretch under your finger where the day has
one, and at the top of the list where it does not. A record is something you
correct, not something you press.

A press and the press that takes it back are not a minute of work. Stop within
a minute of having started and the session is dropped, along with any break or
kind of work begun inside it; start again within a minute of having stopped and
it is the same stretch picked back up — the same session, the gap counted as
presence, and the kind of work it was cut off in the middle of running again.
So a mis-tap on the face costs nothing, in either direction.

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

The last pill in each row is a dashed **+** — Custom, which is the name it
carries as a tooltip rather than beside the mark. Spelled out it was as wide
as a break, and on a phone that was a whole row of the screen spent on the
least-used control in it; as a square it sits at the end of the breaks with
room to spare. It names a kind of break (with the
minutes one is assumed to take) or a kind of work, gives it a mark from that
kind's own vocabulary — the day's pauses for a break, work's for a kind of
work, and the neutral marks to either — and a
kind of work a colour — adds it to the project, and starts it — so the walk nobody set up in advance is two taps rather than a trip
to the project form. It stays there afterwards as another pill.

## Holding a pill

A pill held rather than tapped opens the kind it stands for, in the same form
**Custom** fills in: its mark, its name, the minutes a break is assumed to
take, and the colour a kind of work is drawn in. It opens on the grid rather
than the name, because the mark and the hue are what you are looking at when
you hold a pill — and the tap that ends the hold is swallowed, so holding
**Lunch** opens it rather than also taking one. Under a mouse the right
button does the same thing.

The change is to the project, so it is kept: the kind keeps its id and
everything already logged under it follows the new name, mark and colour,
on the clock, in the Log and in the report. Breaks already written down keep
the times they have — the minutes are only what the _next_ one is assumed to
take. Removing a kind is still the project form's job (see
[`projects.md`](projects.md)).

Nothing in the app is selectable, which is what makes a hold a hold: a press
held on a label used to be read as the start of a selection, and a drag to page
between tabs as a drag across a paragraph. It is the whole app and not only the
screens — the bars, the toasts and the modals too, since a drag that starts on
a nav label and ends on the screen is one selection.

On iOS that is also what keeps the glass lens away. A press held on the page
raises the magnifier the phone places a text caret with, and in an installed
app that lens is the system's own, filling the screen; there is no property
that switches it off, so the only thing that reaches it is leaving it nothing
to select. Fields and the log viewer's text stay selectable and still get the
lens, which is what it is for — but the pickers do not count as fields for
this: a time, a date, a file or a slider opens the phone's own control and has
no text under it to magnify.

## Laid on its side

A phone turned sideways is not a shorter phone. The screen is a third of the
height and twice the width, which is the one shape the upright layout cannot
be folded into: the dial is as wide as the window, the window is half a dial
tall, and everything that works the day ends up under a fold nobody scrolls
past on a screen they only meant to glance at.

So from there the app lays the Today screen out the way the desk does — the
dial in the middle, sized by the height there is, breaks down the left and
kinds of work down the right, the state of the day in a line under the watch.
Everything else stays the phone's: the same four places, the same order, a
swipe still moving along them, Settings still a screen. What changes is where
they sit. The bar goes to the top and splits — Today and Log into the left
corner, Report and Projects into the right, each label beside its glyph — and
over the watch, where there is no bar above it, the four float rather than
taking a row: the middle of that strip is empty, which is where the dial
stands, so the watch is centred on the whole window instead of on what a bar
across the foot of the screen left over. The thumb has further to go than it
does upright; a phone propped against something is not being held by the
thumb. Both bars keep clear of the notch, which sideways is down one edge of
the screen.

It is meant to be left like that — propped against something on the desk, a
clock that is also the day's record, with every break and every kind of work
one press away and nothing to scroll.

### Left alone, it is only a clock

Which is what happens by itself. Leave that screen untouched for a few
seconds and everything but the watch fades away: the four tabs in the
corners, the breaks down the left, the kinds of work down the right, the line
of words under the dial and the break ends printed on the rim. What is left
is the watch — the hands, the day on its track, the bezel filling, the green
dot where the hours come out, and the light behind the case saying the day is
being counted. It is the same screen from across a room as it is from a foot
away, and from across a room a list of buttons is not what you are reading.

Touch the app anywhere and it all comes back, for another few seconds of
quiet after the last thing you do. That first touch is spent on bringing it
back and nothing else — it does not start a break, or open the Log, or stop
the day, whatever it happens to land on. A tap on a screen showing nothing
but a watch lands in the middle of the watch, and the middle of the watch is
the switch; waking the screen to look at the day is not clocking out of it.
Press again, now that you can see what you are pressing, and it does what it
says.

Nothing moves while this happens and nothing changes size. The controls keep
their room and fade in place, so the dial is exactly as big and exactly where
it was — a watch that grew when the tabs went away would be the one thing
this layout exists to prevent. Nothing is hidden from a screen reader either,
and a key counts as a touch, so tabbing towards a faded control has already
brought it back before you get there.

Only here. A phone held upright is a phone being held; a desk has room for
everything at once. This is the shape that gets left standing somewhere.

The switch is over from 44rem of height, so a browser window dragged short
and wide gets the same layout for the same reason.

## On a desk

From 1024px wide the app is a desk rather than a phone: the four places move
to the top bar as tabs, the bottom bar goes, and Settings slides in over the
right-hand edge so the dial is still in view while a watch face is picked. A
settings page longer than the window scrolls inside that panel; the desk
behind it holds still.

The dial takes the share of the window's height its size asks for (see
[`themes.md`](themes.md)), with the breaks to its left and the kinds of work
to its right, and more room round all three than a phone on its side has. The
screen is laid out to the window and does not scroll — the
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
