# Projects

What the hours are for — a client, an employer, a side project, a course. One
or several; most people have one.

## What a project holds

- **Name.**
- **Working days** — the days a full day is expected. Any other day is extra:
  its hours are all balance, and it never counts as a shortfall.
- **Hours per working day** — the target, and what the Today screen's
  percentage measures against. Fractions allowed (7.5).
- **Break types** — one button each on the Today screen, with the minutes a
  break added afterwards is assumed to have taken, a mark, and how much of one
  still counts as work (below). A new project
  starts with Lunch (30 min), Coffee (15 min) and Toilet (5 min), none of them
  counting as work; rename them, change the minutes, remove them, add a walk.
- **Kinds of work** — optional labels for what you are doing, so the report
  can say where the hours went, each with a mark and a colour. A new project
  starts with Meetings, Planning, Retro and Admin.

Projects are data, not settings: they live in the document, so they sync and
back up with the days.

## The card

A card is the week at a glance: a pill for each working day, Monday first,
with a day that falls on a weekend drawn in the flag colour rather than the
accent — a Saturday worked is the exception, and it should look like one.
Beside them sits the day's length, "8 hour workday". What the project holds
beyond that is the editor's business: a card counts nothing.

Editing and deleting are two glyphs in the card's top right — a pen and a
bin. Deleting still asks first.

## What a break counts for

A break carves time out of the day — that is what a break is — but not every
employer counts every one of them. A trip down the corridor is usually still
paid; an hour's lunch usually is not; and the common middle case is a lunch of
which the first half hour counts and the rest is your own. So each break type
carries one of three answers, under its name in the project form and in the
form a break button opens when it is held:

| Answer                 | What a break of the kind counts for                        |
| ---------------------- | ---------------------------------------------------------- |
| **No** _(the default)_ | Nothing. The whole of it comes off the day.                |
| **All of it**          | All of it. The day is as long as if it had not been taken. |
| **The first…**         | The minutes you give, and no more.                         |

The minutes of a partial answer are counted **over the whole day, not per
break**: a project that counts half an hour of lunch counts half an hour of
lunch whether it was taken in one sitting or three.

What counts reaches every number the app draws — the bezel on Today, the
figures on the Log, the balance on the Report, and when today's hours are done
— but it changes nothing about the break itself: it is still a break in the
lists, still the flag colour on the clock, and the Log still shows the whole
of the time spent on breaks.

Every break starts out counting for nothing, which is what a break has always
counted for, so updating the app changes no day already logged. Turning one on
changes every day it has ever been taken on, because nothing about a total is
stored — see [`../day-model.md`](../day-model.md).

## Marks and colours

Every break type and kind of work wears a **mark**. The square at the head of
its row in the project form shows the one it has; tap it and the picker
unfolds under the row.

The picker offers the groups that kind may wear. **Work** is the largest
and leans towards work done at a computer — code, a terminal, a bug, a
design, a document, a spreadsheet, a deck, mail, chat, a call, a video call, a
meeting, planning, tasks, a review, research, learning, a database, servers,
the cloud, a release, tests, support, security, analytics, a branch, admin,
finance, ideas, focus, maintenance — and it stretches far enough that a
workshop, a bookkeeping afternoon or an on-call shift has something better
than a dot. **Breaks** is the day's pauses: coffee, a meal, the toilet, a
drop, a walk, outdoors, exercise, rest, an errand, travel, health, music, or
just a pause. **Marks** is the neutral handful — a label, a star, a flag, a place, an
urgent bolt, a plain ring — for anything the other two miss.

A kind wears its own vocabulary: a break type is offered the breaks, a kind of
work is offered work's, and both are offered the neutral marks — nineteen
marks for a break type, forty for a kind of work. The other group is not offered at
all, so a break cannot end up carrying a pair of angle brackets and a kind of
work cannot end up carrying a cup; the two lists sit next to each other on the
Today screen, where the mark is what tells them apart at a glance. A mark
stored the other way round by an older version is dropped when the document is
read, leaving that kind with the one its sort starts out with — the cup for a
break, the label for a kind of work.

A kind the app itself suggested is marked whether or not it was marked when it
was written. The three break types and four kinds of work a new project opens
with — Lunch, Coffee, Toilet, Meetings, Planning, Retro and Admin — each have
a mark of the app's choosing, and a kind of one of those names carrying none
of its own is given it when the document is read, so a project made before
there were marks shows a fork on its Lunch rather than the cup every unmarked
break would otherwise fall back to. Only those names, and only within the
kind's own vocabulary: a break someone called "Meetings" is left unmarked
rather than given a kind of work's mark, and so is anything the app never
suggested. Changing the mark afterwards is the picker's, and what is picked
stays picked.

A kind of work also has a **colour**, picked in the same place: blue, ocean,
violet, amber, red, mint, rose or slate, or **Automatic**, which is the hue
its position in the list gives it. The colour is one colour everywhere — the
band on the clock's ring, its chip on Today, its row in the Log, its slice of
the report's donut, and its own mark, which is drawn in it. The palette is
made of the theme's own colours, so a colour picked on the light theme is
still legible on the dark one; the accent and the flag are not in it, because
those two already mean "at work" and "break" on the clock.

Breaks have no colour to pick: a break is the flag colour wherever it is
drawn, and its mark with it.

A kind invented from the Today screen's **Custom** pill is given its mark, and
a kind of work its colour, in the same sheet that names it — it joins the
project as a kind like any other. A kind that already exists can be changed
from there too: hold its pill on the Today screen (or press the right button
on it) and the same sheet opens on it, with the picker already unfolded (see
[`today.md`](today.md)). Removing one is still this form's job.

## One or many

With one project the app never asks which. Add a second and the top bar
grows a switcher, the Projects tab shows which is **in use**, and each card
gains a **Use** button. The project in use is a per-device choice.

The Log and the Report show the project in use; Today writes to it. Two
projects on the same date are two separate days.

## Deleting

Deleting a project removes it and every day logged for it, after a
confirmation. Deleting a break type or a kind of work keeps the time already
logged under it; the Log and the Report show it as "Deleted type".
