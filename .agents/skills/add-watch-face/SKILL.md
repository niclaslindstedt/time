---
name: add-watch-face
description: "Use when asked for a new watch face, dial, preset, marker style, typeface, ring or other look for the Today screen's clock — often from a photograph of a real watch. Walks the dial's vocabulary in look.ts, the geometry in clock.ts and the paint in Dial.tsx, keeps the name and the design free of any watchmaker's trademarks, and photographs the result."
---

# Add a watch face

The Today screen's clock is drawn as a wrist watch, and what it looks like is a
_vocabulary_: every face, typeface, marker style, ring, placement, movement and
preset is an id and a spec in `src/app/look.ts`, laid out by the pure geometry
in `src/app/clock.ts`, painted once in `src/app/Dial.tsx` and offered piece by
piece under Custom in `src/app/DialPicker.tsx`. A new look is an entry in each
of those, in that order — never a special case in a screen. This skill is the
procedure, and the things a real watch taught us that are not obvious from the
code.

## When to run

- Someone asks for a new dial, face, preset, marker style, typeface, ring or
  hands — with or without a photograph of a watch to work from.
- A dial option is to be offered under Custom that today only a preset has.
- Not for the backlight, the size, or the two themes: those are settings with
  their own tables, and the light and the size are not part of a dial.

## Tracking mechanism

`.agents/skills/add-watch-face/.last-updated` holds the commit this skill last
ran against. It is a per-change playbook rather than a periodic sync, so the
marker is a record of the last face added; the diff since it is what to read
first, because that is where the vocabulary last grew.

## Discovery process

1. Read the vocabulary as it stands, and what the last face added to it:

   ```sh
   BASELINE=$(cat .agents/skills/add-watch-face/.last-updated 2>/dev/null)
   git log --oneline "${BASELINE:-$(git rev-list --max-parents=0 HEAD)}"..HEAD -- src/app/look.ts src/app/clock.ts src/app/Dial.tsx
   grep -n "^export const DIAL_\|^export type Dial" src/app/look.ts
   grep -n "^export const SIGNATURE\|^export function dialLayout\|MAX_REACH" src/app/clock.ts
   ```

2. Read the watch, not its name. From a photograph, write down what the dial
   _is made of_ before touching code — each of these is one dimension of
   `DialConfig`, and a face that needs a dimension the vocabulary lacks is the
   moment to add one, as a table, rather than to special-case a preset:

   | On the watch                                                           | Dimension   | Table                    |
   | ---------------------------------------------------------------------- | ----------- | ------------------------ |
   | The dial's colour, its ink, its bezel                                  | `face`      | `DIAL_FACE`              |
   | How the hours are marked, and what sits at 12                          | `markers`   | `DIAL_MARKERS`, `Marker` |
   | The typeface of any numeral or printed minute                          | `font`      | `DIAL_FONT`              |
   | How big the hours are                                                  | `scale`     | `DIAL_SCALE`             |
   | Where the day's ring sits against the markers                          | `placement` | `DIAL_PLACEMENTS`        |
   | What the day is drawn on: a groove, or a ring printed with the minutes | `ring`      | `DIAL_RING`              |
   | How the second hand moves                                              | `movement`  | `DIAL_MOVEMENT`          |

   Things every dial already carries and a new face does not choose: the
   app's mark and name under twelve, the movement's word under them, and the
   Settings cog in a window above six (`SIGNATURE` in `clock.ts`). A new face
   has to leave room for them — see the geometry note below.

3. Decide what is new. Most faces are a new _preset_ over existing options.
   Some need one new option in one table (a marker style, a ring). Rarely one
   needs a new table. Add the smallest thing.

## Brand names and trademarked features

A face is named for what it looks like — a place, a landscape, a time of day —
**never for the watch or the maker it was drawn from**, and neither name goes
anywhere: not the preset id, not the strings in `en.ts`, not a comment, not
the commit message, not the PR title or body, not the changelog fragment.
The people who own those names defend them, and a reader of the changelog
does not need them to know what the dial looks like. Presets so far:
snowfield, abyss, trailhead, summit, boulevard, studio, tidewater, harvest,
uptown. Say "the sixties dress watch", "the diver", "the field watch" —
the _kind_ of watch, which nobody owns.

The same goes for the design. Take the _generic_ parts of a dial — a colour,
applied batons, a printed minute ring, lume plots, a date window, a sunburst,
a chapter ring — which are a century of common watchmaking. Do not copy the
parts that identify one maker:

- A maker's logo, monogram or mark, or any lettering of the maker's name.
  The app's own mark and name go where the maker's would.
- A model name printed on the dial ("intra-", "-master", "sub-" and the
  like). The dial prints the movement's word (AUTOMATIC / QUARTZ / GLIDE)
  under the name, and nothing else.
- A distinctive hand shape, bezel or case that _is_ the brand — the sword,
  snowflake or lollipop hands, a fluted bezel, a cushion case, a cyclops over
  the date. The hands here are plain batons with a facet, on every dial.
- A trademarked colour pairing or dial motif — a particular two-tone bezel,
  a textured pattern, a starburst of a named shape.
- Any wording from the maker's marketing in the preset's hint or the docs.

If the request is "make it look like this watch", the answer is the generic
dial underneath it: the face colour, the marker style, the ring, the
typeface family, the movement. That is what the vocabulary can say, and it
is all the app should.

## Mapping

| To add                                    | Change                                                                                                                                                                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A preset                                  | `DialPreset`, `DIAL_PRESETS`, `DIAL_PRESET` in `look.ts`; `settings.preset.<id>` and `settings.presetHint.<id>` in `en.ts`; the presets table in `docs/features/themes.md`; the count in `tests/look_test.ts` and the "eight/nine" wording in `CLAUDE.md`, the README and `look.ts`'s comments |
| A face colour                             | `DialFace`, `DIAL_FACES`, `DIAL_FACE` (dial, edge, ink, bezel, dark) in `look.ts`; `settings.face.<id>` in `en.ts`; `tests/look_test.ts` checks the ink reads against the dial                                                                                                                 |
| A marker style                            | `DialMarkers`, `DIAL_MARKER_STYLES`, `DIAL_MARKERS` (`at(hour)`, `minuteTrack`) in `look.ts`; a `Marker` kind if the shape is new, drawn at twelve in `Dial.tsx`'s `Marker` and rotated into place; `settings.markers.<id>` in `en.ts`; the layout test in `tests/clock_test.ts` walks it      |
| A typeface                                | `DialFont`, `DIAL_FONTS`, `DIAL_FONT` (family, weight, widthFactor, scale) in `look.ts`; the `@fontsource` import in `src/main.tsx` — one weight, the `latin` subset, never a font host; `settings.font.<id>` in `en.ts`; the fonts list in `CLAUDE.md`'s dependency rule and `themes.md`      |
| A ring the day is drawn on                | `DialRing`, `DIAL_RINGS`, `DIAL_RING` (printed, fill, ink) in `look.ts`; the ring's paint in `Dial.tsx` between the face and the bands, and its print _after_ the bands; `settings.ring.<id>`, `settings.ringHint.<id>` in `en.ts`; `parseDial` in `useAppSettings.ts` already clamps it       |
| A new dimension of `DialConfig`           | The type and its table in `look.ts`; `ring: "groove"`-style defaults on every preset; `parseDial` in `useAppSettings.ts` with a fallback for a dial stored before it existed; a picker under Custom in `DialPicker.tsx`; `tests/settings_test.ts` for the fallback; `themes.md`'s Custom list  |
| Printing on the dial (name, word, window) | `SIGNATURE` in `clock.ts` and its paint in `Dial.tsx`; `MAX_REACH.inside` is derived from it so the markers stay clear                                                                                                                                                                         |
| The picture on the preset card            | Nothing — the card is a `Dial` with `SAMPLE` bands at `SHOWROOM` (ten past ten) in `DialPicker.tsx`, so a preset previews itself                                                                                                                                                               |
| A user-visible change of any of the above | A fragment under `.changes/unreleased/` (see `write-changeset`)                                                                                                                                                                                                                                |

## What the geometry has to hold

`dialLayout` in `clock.ts` places the ring and the markers for one dial, and
`tests/clock_test.ts` walks _every_ combination of placement, markers, font
and scale to assert:

- a marker stays on the face inside the minute track;
- inside the ring, a marker never reaches the ring; outside, never the
  ring's outer edge; over, it is centred on the band;
- the ring is a ring (inner radius over 50) and the printing — the name
  under twelve and the window above six, `SIGNATURE_REACH` — stays inside
  the ring and clear of the marker at twelve on every dial.

So a new marker kind must fit the `reach` the layout gives it (its length
along the radius, `markerLength`, either side of `markerR`): draw a plot of
lume _within_ that length, not beyond it. A new typeface's `widthFactor` is
half the width of a two-digit numeral as a share of the font size — measure
it, because a numeral wider than the factor says runs into the ring. A
numeral that would not fit is set smaller by the layout, never let through.

A printed ring's numerals go on `bandR`, its ticks in the outer 3.5 units of
the ring, and both are painted _after_ the bands so the day fills the ring
and the print lies over it. Numerals lie along the ring, and the lower half
is turned the other way up (`chapterMarks`).

## Looking at it

A dial is judged by eye, and `scripts/dial-shots.mjs` is how: it serves the
production build headless, seeds a day in a state, pins the hands at ten past
ten and photographs the dial — and lays more than one picture out on a contact
sheet, `shots/sheet.png`, a row per dial and a column per state. `make shots
ARGS="…"` builds first and passes the options through. The ones that matter
here:

```sh
make shots ARGS="--preset <id> --state out,working,break,over"     # the new preset, every state
make shots ARGS="--preset all"                                     # every preset beside it
make shots ARGS="--preset <id> --shell phone,desk --theme dark,light"
make shots ARGS="--dial '{\"face\":\"black\",\"ring\":\"chapter\"}'"  # a custom combination
make shots ARGS="--preset <id> --settings"                         # the picker, with the new card
make shots ARGS="--preset <id> --state over --at 18:30"            # a long day, at a sane hour
```

Look at the sheet for: the day's bands reading on the face and on the ring in
both themes; the break-end chip on the rim; the name, the movement's word and
the cog clear of the markers and the ring; the light whole round the case; and
the preset card in Settings reading at card size. Playwright is not a
dependency of the app — the script says how to install it outside the
lockfile, and finds the Chromium a web session already has.

## Update checklist

- [ ] Name the preset for what it looks like; check the id, the strings, the
      comments, the fragment and the commit message for any maker's or
      model's name (see above) — `git diff | grep -i` for the names you
      were shown
- [ ] Add the ids and specs in `look.ts`, and every preset gets a value for
      any new dimension
- [ ] Paint it in `Dial.tsx` — the drawing only; colours come from the spec
- [ ] Offer it under Custom in `DialPicker.tsx`: a new option in an existing
      table appears by itself; a new dimension needs a picker
- [ ] Clamp it in `useAppSettings.ts` if it is a new dimension, with a
      fallback for a dial stored before it
- [ ] Strings in `en.ts` for every new id; a hint for a preset
- [ ] A bundled `@fontsource` import in `main.tsx` for a new typeface
- [ ] Tests: the counts and the walks in `tests/look_test.ts`; the layout
      walk in `tests/clock_test.ts` still passes; a fallback case in
      `tests/settings_test.ts` for a new dimension
- [ ] Docs: `docs/features/themes.md` (presets table, Custom list),
      `CLAUDE.md`'s `look.ts` line and the fonts rule, the README's Settings
      row
- [ ] A changelog fragment
- [ ] Look at it, per "Looking at it" above: every state, both themes, both
      shells, a custom combination, and the picker
- [ ] Record the marker:

      git rev-parse HEAD > .agents/skills/add-watch-face/.last-updated

## Verification

1. `make lint && make test && make fmt-check` pass; the layout walk in
   `tests/clock_test.ts` is the test that catches a marker or a numeral that
   reaches where it should not.
2. `make shots ARGS="--preset all"` — every preset card still reads, and the
   new one reads in both themes and on both shells: the day's bands, the
   break-end chip on the rim, the print, the light.
3. `grep -rniE "<the maker>|<the model>" src tests docs .changes README.md CLAUDE.md`
   finds nothing, and neither does the commit message or the PR.
4. Under Settings → The clock → Custom, the new option can be combined with
   every other one without a drawing that breaks — try the extremes: the
   largest hour size, Roman numerals inside the ring, the printed ring with
   numerals over it.

## Skill self-improvement

If a watch needed a dimension the table above does not name, add the row
and the table it became. If a geometric rule bit you that the section above
does not state, state it. If a brand feature slipped through review, add it
to the list. Commit the skill edit with the face.
