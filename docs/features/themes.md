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

Eight, each a combination a real dial is often seen in, named for what it
looks like. Every card in Settings is a drawing of the dial it picks, with an
invented morning on it, so the choice previews itself.

| Preset        | The dial                                                                         |
| ------------- | -------------------------------------------------------------------------------- |
| **Snowfield** | Textured silver, applied batons, a second hand that glides. The default.         |
| **Abyss**     | The diver: black, dots with a triangle at twelve and batons at the quarters.     |
| **Trailhead** | The field watch: every hour numbered in a tall condensed sans, outside the ring. |
| **Summit**    | The expedition dial: 3, 6 and 9 in an engineered sans, batons between.           |
| **Boulevard** | The dress watch: white, Roman numerals in a high-contrast serif, quartz.         |
| **Studio**    | Small geometric numerals at the rim, and nothing else.                           |
| **Tidewater** | A blue sunburst with tapered wedges.                                             |
| **Harvest**   | Champagne, numerals at the quarters in a serif.                                  |

### Custom

The ninth card opens the dial up piece by piece. It starts from the dial you
were looking at, so changing one thing about a preset is two taps.

- **Face.** Eight colours, in about the order dials sell in: white, silver,
  slate, black, blue, green, burgundy, champagne. The markers and hands are
  printed in dark ink on a light face and white on a dark one, so a hand
  always reads against the face under it.
- **Hour markers.** Eight styles: applied **batons** (a double at twelve);
  the **dots** of a diver (a triangle at twelve, batons at the quarters);
  Arabic **numerals** at every hour; **Roman** numerals; numerals at the
  **quarters** with batons between; the **3 · 6 · 9** layout with a triangle
  at twelve; tapered **wedges**; and bare **ticks** on a minute track.
- **Numerals.** The typeface the hours are set in, one for each family of
  dial typography a watch is likely to carry: **Grotesque** (the app's own,
  Inter), **Geometric** (Jost, the Bauhaus school), **Condensed** (Oswald,
  the field and pilot's watch), **Engineered** (Barlow, the instrument),
  **Serif** (Source Serif), **Didone** (Playfair Display, the dress watch),
  **Inscribed** (Cinzel, the capitals a Roman dial is cut in) and **Mono**
  (JetBrains Mono). Each option in Settings is written in the face it picks.
  All eight are bundled with the app and served from its own origin — no
  font host is called, here or anywhere else.
- **Hour size.** Eight steps. A numeral that would not fit where it is placed
  is set as large as does fit, so no step ever runs a numeral off the face or
  into the ring.
- **Markers sit.** Outside the ring, between it and the bezel; over it, the
  way a chapter ring lies on a dial; or inside it, with the ring round them.
  The ring moves in to make room when it has to.
- **Movement.** How the second hand moves. **Quartz** steps once a second,
  with the small overshoot a stepper motor gives it. **Mechanical** walks in
  eight small steps a second, the way a calibre at 28 800 vph beats. **Glide**
  runs the hand round continuously, with no step at all. The hour and minute
  hands sweep either way. With reduced motion on, every hand simply jumps.

### Size

Small, medium or large, separately from the dial, because a size suits a
screen rather than a watch. Small is the dial as it used to be; large fills
the width, to the same margins as the **Start working** button, and is the
default. The face is square, so this is its height as much as its width — a
large dial pushes the break buttons down, a small one keeps the whole screen
in one view.
