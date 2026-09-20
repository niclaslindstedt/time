# Themes

Two, plus "follow the device": **Light**, **Dark**, **Device**, under
**Settings → Appearance**. The default follows the device.

The framework the app is built on ships a dozen palettes and a full
appearance picker; this app deliberately exposes none of them. A tool that
gets a few taps a day earns nothing from a theme gallery, and every extra
palette is another surface to keep legible.

## The clock

**Settings → The clock** is the other thing about the look that is worth
choosing, and it is the one place a colour of its own is allowed: the dial on
Today is drawn as a wrist watch, and a watch face has a colour the way an
object does, not the way a theme does. A black dial is black on the light
theme and a white one white on the dark. Nothing else on the face is the
theme's but the day itself — time worked in the accent, breaks in the flag
colour, a kind of work in the hue the report gave it — so the dial can be any
of its eight faces without a second palette leaking into the app around it.

### The presets

Nine, each a combination a real dial is often seen in, named for what it
looks like. Every card in Settings is a drawing of the dial it picks, with an
invented morning on it and lit by its own backlight, so the choice previews
itself — the light as much as the dial. A card's light is held steady rather
than beating: ten cards beating at ten rates would be a fairground, and what
a card is showing is the colour and the reach.

| Preset        | The dial                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Snowfield** | Textured silver, applied batons, a second hand that glides. The default.                                                                                       |
| **Abyss**     | The diver: black, dots with a triangle at twelve and batons at the quarters.                                                                                   |
| **Trailhead** | The field watch: every hour numbered in a tall condensed sans, outside the ring.                                                                               |
| **Summit**    | The expedition dial: 3, 6 and 9 in an engineered sans, batons between.                                                                                         |
| **Boulevard** | The dress watch: white, Roman numerals in a high-contrast serif, quartz.                                                                                       |
| **Studio**    | Small geometric numerals at the rim, and nothing else.                                                                                                         |
| **Tidewater** | A blue sunburst with tapered wedges.                                                                                                                           |
| **Harvest**   | Champagne, numerals at the quarters in a serif.                                                                                                                |
| **Uptown**    | The sixties dress watch: silver, long applied blocks out to the ring with a lumed plot on it at each hour, tapered steel hands, the day on a blue minute ring. |

### Custom

The tenth card opens the dial up piece by piece. It starts from the dial you
were looking at — and from its light — so changing one thing about a preset
is two taps. It is also the only place the backlight can be changed: a preset
is lit by the light its face comes with.

- **Face.** Eight colours, in about the order dials sell in: white, silver,
  slate, black, blue, green, burgundy, champagne. The face's ink — dark on a
  light face, white on a dark one — is what the dial's _printing_ is in: the
  numerals, the minute track, the name and the movement's word, and the
  second hand. The applied markers and the hands are not printed at all; they
  are polished steel, and what they look like is the light on them.
- **Hour markers.** Nine styles: applied **batons** (a double at twelve);
  **blocks**, the same baton the whole way out with one wide one at twelve
  and no track on the rim; the **dots** of a diver (a triangle at twelve,
  batons at the quarters);
  Arabic **numerals** at every hour; **Roman** numerals; numerals at the
  **quarters** with batons between; the **3 · 6 · 9** layout with a triangle
  at twelve; tapered **wedges**; and bare **ticks** on a minute track.

  The blocks are the one style drawn broader than a baton — half as wide
  again, which is the whole of what the two words mean on a dial — the one
  that marks twelve with _two_ blocks side by side rather than one broad one,
  and the one whose hours run the whole way _out to the ring_ rather than
  stopping short of it: the block ends on the ring's inner edge, crossing the face's
  track on the way. That edge is where the ring is painted to on its inner
  side, so the two meet rather than the hour lapping onto the blue. It does
  not fill the whole run out from where a baton of the same size would have
  started, either — it gives a fifth of that back at the inner end, because
  an applied hour reaches nothing like that far into the dial. What finishes
  it is a lumed plot — a small rounded block in the
  ring's own ink — printed on the ring at the hour, standing on the minutes'
  own track a shade shorter than one of them and more than twice as wide, so
  an hour reads as a block of lume where a minute is a line. The twelve hours
  are the twelve places a minute ring prints a numeral rather than a tick, so
  the plots land in room the minutes are not using, and like the minutes they stay printed
  over whatever colour the day has painted under them. On a dial whose
  markers sit over or outside the ring there is no gap to close, and the
  blocks are batons like any other.

  Every one of them but the ticks and the numerals is a part _applied_ to the
  dial rather than printed on it, and is drawn as the metal it is. A block, a
  wedge and a triangle are **roofs** — two flat faces put together at an
  angle, tipping up to the ridge where they meet — so each face is one tone
  and which of the two is the bright one is where the light is. A dot is a
  **dome**, turned rather than folded, so the light comes back off it as a
  band across its middle. Both catch the light per marker rather than per
  dial: at any moment the block at eight is bright where the one at two is
  in shade, the way a real dial is never evenly lit.

- **Numerals.** The typeface the hours are set in, one for each family of
  dial typography a watch is likely to carry: **Grotesque** (the app's own,
  Inter), **Light** (the same face at its light weight, the print on a minute
  ring), **Geometric** (Jost, the Bauhaus school), **Condensed** (Oswald,
  the field and pilot's watch), **Engineered** (Barlow, the instrument),
  **Serif** (Source Serif), **Didone** (Playfair Display, the dress watch),
  **Inscribed** (Cinzel, the capitals a Roman dial is cut in) and **Mono**
  (JetBrains Mono). Each option in Settings is written in the face it picks.
  All nine are bundled with the app and served from its own origin — no
  font host is called, here or anywhere else.
- **Hour size.** Eight steps. A numeral that would not fit where it is placed
  is set as large as does fit, so no step ever runs a numeral off the face or
  into the ring.
- **Markers sit.** Outside the ring, between it and the day's track; over it,
  the way applied hours lie on a dial; or inside it, with the ring round them.
  The ring moves in to make room when it has to. Not offered with the minute
  ring: printed minutes are the scale the hours are read against, and a scale
  is read from the outside in, so the hours go inside it. Put them over it and
  every hour lands on one of the numerals; put them outside it and the watch
  reads inside out. The setting is kept rather than cleared, so a dial that
  goes to the minute ring and back is the dial it was.
- **The dial's ring.** The track the hours are placed against and the hands
  are read to. The day is not on it — the day has a track of its own, just
  inside the bezel (see [`today.md`](today.md)). **A groove** is a faint
  sunken track, and little more than that. The
  **minute ring** is the chapter ring a sixties dress dial wears at its rim —
  a deep blue, printed in white with a numeral every five, 05 round to 60,
  and a tick a minute standing on the ring's _inner_ edge with the numerals
  in the room that leaves, the way a dial of this kind is printed. The other
  half of that track is on the face itself, just under the ring: a tick a
  minute of the ring's own length, in the ring's own colour, with two finer
  marks between each pair — thirds of a minute — so the two halves read as
  one minute track with the ring's edge running through it. Except where an
  hour is in the way: an applied hour is a block of steel standing across the
  track, so the third beside it is not drawn, and beside an hour you see one
  mark rather than two. Twelve takes both, because twelve carries the widest
  hour of every marker style, and beside twelve you see none. That is the track
  the hands are read against on this ring: the minute hand crosses the tips
  of the face's ticks and stops there, and the second hand goes on to the
  ring itself and stops the width of a print onto the near end of its ticks,
  where a dark hair over a white one is the contrast that makes it readable.
  Onto them and barely: a second hand running the length of the marks it is
  read against would cover the very thing it is pointing at. The numerals
  are set in the Numerals face, whatever the hours wear.
- **Hands.** Two shapes — what they are made of is not a choice, because a
  hand is steel on every wrist watch there is. **Bars** are the same width
  from the cap to the tip, a half-round bar with the light landing along it.
  **Tapered** are the hands of a dress watch: sides dead straight for the
  bulk of their length and then closing on a point over the last of it — not
  a wedge that narrows the whole way, which is the shape a drawn watch
  usually gets instead — with a ridge down each that takes the light on one
  side and lies in shade on the other, so a hand keeps catching and losing
  the light as it sweeps. The two sets part again past the axle: a bar's
  second hand balances itself with the disc of a sports hand on a stub of the
  same hair, a tapered set with the long blade of a dress watch — a wedge that leaves
  the hub as the same hair and swells as it goes, so the weight is out at the
  end of it where it does the balancing rather than under the cap where it
  would do none. The second hand stays the face's ink either way: a
  hair that fine has no surface to catch anything, and a dial with polished
  hands wears a dark one against the polish.
- **Movement.** How the second hand moves. **Quartz** steps once a second,
  with the small overshoot a stepper motor gives it. **Mechanical** walks in
  eight small steps a second, the way a calibre at 28 800 vph beats. **Glide**
  runs the hand round continuously, with no step at all. The hour and minute
  hands sweep either way. Whichever you pick, the rate is the rate: the hands
  are drawn from the clock every frame rather than nudged once a second, so a
  beat does not hesitate when the app is busy. With reduced motion on the
  hands still keep time; what they skip is the wind after the tab has been
  asleep (see [`today.md`](today.md)). The dial says which it is, under the
  name: AUTOMATIC, QUARTZ or GLIDE.

### Reflections

The dial's metal is drawn from a light standing somewhere over the crystal,
and **Settings → The clock → Reflections** hands that light to the device: turn
the phone and the reflection slides across the markers and the hands, because
the metal has turned and the light has not. Each marker answers for itself —
the block at eight brightens as the one at two goes into shade — and both
faces of every ridge swap as the light crosses it.

It is off until you ask for it, for two reasons: on iOS the motion sensors
need your permission, and the tap that turns this on is what asks for it, so
the answer can decide whether the switch stays on. The row is not shown at all
on a device with nothing to read. With reduced motion asked for, the light
stays where it is.

The readings are used for the next frame and for nothing else. They are not
stored, not put in the document, and not sent anywhere — there is nowhere for
them to go: the app makes no request it was not asked to make, the tilt
included.

### Size

Small, medium or large, separately from the dial, because a size suits a
screen rather than a watch. Large is the default.

Which way round the size is measured depends on the screen it is on, because
that is what runs out first. A phone is a column, so a size is a share of the
width: small is the dial as it used to be, and large fills the column. The
face is square, so that is its height as much as its width — a large dial
pushes the break buttons down, a small one keeps the whole screen in one
view.

A desk gives the dial a row of its own with room either side, so a size is a
share of the window's **height** instead: about half of it for small, most of
it for medium, and nearly all of it for large. A window with less than that
to spare gives the dial the height there is, so a short window gets a smaller
watch rather than a screen that scrolls.

### Backlight

The light behind the case, the way a television lights the wall behind it.
It is how the app says you are working without a word: it comes up when you
press the face to start, beats while the day is being counted, holds low and
steady in the break colour on a break, and goes out when you stop. Like the
face, it is the watch's own light rather than the theme's, which is why it
may have a colour of its own.

Which is also why the light belongs to the **face** rather than to the app.
Every face comes with one, and a preset is lit by the light of the face it
wears — so the three black dials all glow alike however differently they are
printed, and picking a dial is one choice rather than two.

| Face          | Its light                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------- |
| **White**     | White, and the closest and quietest of the eight: any hue behind it reads as a stain.       |
| **Silver**    | White, carrying further than the white face's: steel has no colour of its own. The default. |
| **Slate**     | Teal, and the quickest beat: the cold face is the one that should look like it runs.        |
| **Black**     | Amber, the strongest and widest. The instrument dial, lit the way instruments are.          |
| **Blue**      | Blue, quick and bright: the dial's own colour spilling past the case.                       |
| **Green**     | Green, and the middle of every range — the same watch as blue, quieter.                     |
| **Burgundy**  | Rose, slow. Not red: red already means _on a break_ on the ring.                            |
| **Champagne** | Amber, low and slow. The one pale face that takes a tint without looking soiled.            |

Three rules run through the table. The colour is the face's character rather
than a match of its paint — a glow sampled off the dial would be a bigger
version of the watch instead of a light. A dark face is lit at least as
strongly and as widely as a pale one: a dark dial is largely a silhouette the
light is what shows of, while a halo blazing round a white dress dial would
be the only thing in the room. And no face wears the day's own two colours:
the accent means _at work_ on the ring and the flag means _on a break_, so a
watch lit in either would be saying the day's word back at it — which is why
burgundy is lit rose rather than red, and why the two silver dials are lit
white.

Under Custom the four knobs are opened up, starting from the face's own
light. Picking a face there brings its light with it, so the way back to
where a light started is to pick its face again.

- **Colour.** The theme's accent — the colour the ring already uses — or
  white, amber, green, teal, blue, violet or rose. (The accent and violet are
  Custom's alone; no face is lit by either.)
- **Beat.** How often it breathes, from steady to twice a second. With
  reduced motion on it never beats.
- **Brightness.** From off to full. Off is a way to turn the whole thing off.
- **Spread.** How far the light reaches past the case — a rim on the bezel at
  one end, a halo half the dial again at the other. It is not the same knob as
  brightness: a wide dim glow and a tight bright one are quiet in different
  ways. Turn it down when the dial is large and the glow runs into the bars
  around it, since the space around the watch is the only room the light has.
