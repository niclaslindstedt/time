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
invented morning on it, so the choice previews itself.

| Preset        | The dial                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| **Snowfield** | Textured silver, applied batons, a second hand that glides. The default.                                  |
| **Abyss**     | The diver: black, dots with a triangle at twelve and batons at the quarters.                              |
| **Trailhead** | The field watch: every hour numbered in a tall condensed sans, outside the ring.                          |
| **Summit**    | The expedition dial: 3, 6 and 9 in an engineered sans, batons between.                                    |
| **Boulevard** | The dress watch: white, Roman numerals in a high-contrast serif, quartz.                                  |
| **Studio**    | Small geometric numerals at the rim, and nothing else.                                                    |
| **Tidewater** | A blue sunburst with tapered wedges.                                                                      |
| **Harvest**   | Champagne, numerals at the quarters in a serif.                                                           |
| **Uptown**    | The sixties dress watch: silver, long applied blocks, tapered steel hands, the day on a blue minute ring. |

### Custom

The tenth card opens the dial up piece by piece. It starts from the dial you
were looking at, so changing one thing about a preset is two taps.

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
- **Markers sit.** Outside the ring, between it and the bezel; over it, the
  way a chapter ring lies on a dial; or inside it, with the ring round them.
  The ring moves in to make room when it has to.
- **The day's ring.** What the day is drawn on. **A groove** is the faint
  track the bands lie in, so an empty morning shows where they will go. The
  **minute ring** is the chapter ring a sixties dress dial wears at its rim —
  a deep blue, printed in white with a numeral every five, 05 round to 60,
  and a tick a minute standing on the ring's _inner_ edge with the numerals
  in the room that leaves, the way a dial of this kind is printed. Under it,
  on the face itself, is the finer track the minute hand is actually read
  against. The day _fills_ the ring: a stretch at work paints it
  the accent, a kind of work its hue, a break the flag colour, and the
  minutes stay printed over whatever the day put under them. The numerals
  are set in the Numerals face, whatever the hours wear.
- **Hands.** Two shapes — what they are made of is not a choice, because a
  hand is steel on every wrist watch there is. **Bars** are the same width
  from the cap to the tip, a half-round bar with the light landing along it.
  **Tapered** are the hands of a dress watch: broad where they leave the cap
  and narrowing to a point, with a ridge down each that takes the light on
  one side and lies in shade on the other — so a hand keeps catching and
  losing the light as it sweeps, which is the one thing a drawn watch usually
  gets wrong. Its second hand is a plain hairline, its tail a stub of the
  same hair rather than a counterweight, which is what a dress watch carries.
  The second hand stays the face's ink either way: a hair that fine has no
  surface to catch anything, and a dial with polished hands wears a dark one
  against the polish.
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

- **Colour.** The theme's accent — the colour the ring already uses — or
  white, amber, green, teal, blue, violet or rose.
- **Beat.** How often it breathes, from steady to twice a second. With
  reduced motion on it never beats.
- **Brightness.** From off to full. Off is a way to turn the whole thing off.
- **Spread.** How far the light reaches past the case — a rim on the bezel at
  one end, a halo half the dial again at the other. It is not the same knob as
  brightness: a wide dim glow and a tight bright one are quiet in different
  ways. Turn it down when the dial is large and the glow runs into the bars
  around it, since the space around the watch is the only room the light has.
