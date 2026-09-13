# Today

The main screen, and the whole app for most of a day.

## What it shows

- **The readout.** The day's state ("Working since 08:02", "Lunch since
  12:04", "Not at work · Left at 17:10"), the running timer of hours worked,
  and beside it the share of the day's target that is — 94%, or 112% on a
  long day. Under it, the target, today's balance and the overall balance.
- **The clock.** A twelve-hour dial with the hands at now. The outer ring is
  time at work, with breaks marked on it in the flag colour; the inner ring is
  the kind of work, one hue per category — the same hue the chips and the
  report use. The legend under the clock names them.
- **The buttons.** One loud one, **Enter office** / **Leave office**. A row of
  break buttons, one per break type the employer defines, each showing its
  default length; tapping one starts it, and the button turns into **End
  lunch** until tapped again. A row of chips, one per kind of work; tapping one
  says that is what you are doing from now, tapping it again stops labelling.
  Breaks and chips are disabled until you have entered.

Everything on the screen is derived from the day's spans up to the current
second (see [`../day-model.md`](../day-model.md)); the screen holds no state
of its own.

## Adding a break afterwards

**Add a break…** opens the span editor with one-tap shortcuts at the top —
"I just had Lunch (30 min)", one per break type, using the type's default
length — and the full form under them for exact times.

## The first run

With no employer yet, the screen asks for one. **Add employer** opens the
editor (see [`employers.md`](employers.md)); saving makes it the employer in
use and the clock is ready.
