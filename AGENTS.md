# Agent guidance for time

This file is the canonical source of truth for AI coding agents working in this
repo. `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `GEMINI.md`, and
`.github/copilot-instructions.md` are symlinks to this file.

## OSS Spec conformance

This repository adheres to [`OSS_SPEC.md`](OSS_SPEC.md), a prescriptive
specification for open source project layout, documentation, automation, and
governance. A copy of the spec lives at the repository root so contributors and
AI agents can consult it without leaving the repo; its version is recorded in
the YAML front matter at the top of the file.

Run `oss-spec validate .` (or the standalone
[`validate.sh`](https://github.com/niclaslindstedt/oss-spec/blob/main/scripts/validate.sh))
to verify conformance. When in doubt about a layout, naming, or workflow
decision, consult the relevant section of `OSS_SPEC.md` — it is the source of
truth for the conventions this repo follows.

## What this app is, and the one rule that follows from it

A time report is a record of when a named person was working, on what, and
what they were doing. The whole design premise is that the record never leaves
the device unless its owner explicitly connects their own cloud account.

**So: never add a network call that isn't the user's own cloud backend.** No
analytics, no error reporting service, no font CDN, no "anonymous" telemetry,
no third-party script — not behind a flag, not in dev only. If a change would
send a byte of the document, or a byte _about_ the document, anywhere the user
did not choose, it is the wrong change however useful the feature is. This is
the constraint the README and the privacy copy promise; it outranks
convenience.

## Build and test commands

```sh
make install       # npm install (needs GitHub Packages auth — see below)
make build         # production build (vite build)
make test          # full test suite (vitest)
make lint          # eslint + tsc --noEmit
make fmt           # prettier --write
make fmt-check     # verify formatting (CI)
make check-seo     # build + assert the structural SEO/PWA signals
make icons         # regenerate the PWA icons, favicon, and og image
make shots         # build + photograph the dial in a few states into shots/, with a contact sheet (ARGS="…" for options)

make native-install    # install the native wrapper's own dependencies
make native-bundle     # build the web app into native/assets/webroot.zip
make native-typecheck  # tsc over native/
make native-prebuild   # regenerate native/ios + native/android from the config
```

The `@niclaslindstedt/oss-framework` dependency comes from the **GitHub
Packages** npm registry (see `.npmrc`). GitHub Packages requires auth even for
public packages, so local installs need a `read:packages` token in `~/.npmrc`
(`//npm.pkg.github.com/:_authToken=<token>`); CI authenticates with the
workflow's `GITHUB_TOKEN`.

### Dependency install in web sessions

Claude Code on the web runs `.claude/hooks/session-start.sh` on `SessionStart`
(wired up in `.claude/settings.json`), so **dependencies install automatically
in the background** — an agent shouldn't run `make install` by hand first. The
hook resolves a GitHub Packages token from the environment
(`NODE_AUTH_TOKEN` / `GITHUB_PAT` / `GH_TOKEN` / `GITHUB_TOKEN`, first wins),
writes it to `~/.npmrc`, and runs `npm install` — the committed project
`.npmrc` stays token-free. It runs in **async** mode, so `node_modules` may
still be populating for a moment after the session opens; if a `make` target
fails on a missing dependency, wait and retry. The hook is a no-op outside the
web environment (`CLAUDE_CODE_REMOTE`), so it never touches a local developer's
npm config.

## Commit and PR conventions

- All commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- PRs are squash-merged; the **PR title** becomes the single commit on `main`,
  so it must follow conventional-commit format.
- Breaking changes use `<type>!:` or a `BREAKING CHANGE:` footer.

### Watching a PR after you open it

Don't babysit a PR with polling. **Do not** schedule `send_later`, cron jobs,
`ScheduleWakeup`, or timed self-check-ins to re-check CI or merge state — those
just burn turns. Open the PR, confirm the checks you can see are green, then
stop. CI failures and review comments are delivered to the session as webhook
events, so you'll be woken when there's actually something to act on.

## Architecture summary

This is a **frontend-only, local-first PWA** — there is no server. It is built
on [`oss-framework`](https://github.com/niclaslindstedt/oss-framework), the
same shared surface behind the sibling `contacts` and `period` apps.

The framework owns the UI kit and the generic mechanics: modals, form
primitives, the theme engine, the charts, the bottom bar and the tab-paging
swipe, the storage adapters (localStorage / Dropbox / Google Drive), the i18n
runtime, logging, the toast store, and the PWA update state machine. What
stays here is the vocabulary — what a day is made of, what a button on the
Today screen does, and what a report adds up.

### The renderer is Preact

`preact` is the only renderer dependency — **never add `react` or `react-dom`
back.** `@preact/preset-vite` compiles JSX against `preact/jsx-runtime` and
aliases `react` / `react-dom` (and their `/jsx-runtime` + `/client` subpaths)
onto `preact/compat`; `tsconfig.json` `paths` and `package.json` `overrides`
mirror that for `tsc` and npm, so the framework — which is built against React
— resolves to Preact too. App code keeps importing hooks and types from
`"react"`, which is the supported compat path; only `src/main.tsx` uses
Preact's own `render`. Two differences bite in new code: use `e.currentTarget`
rather than `e.target` in event handlers, and spell string-valued attributes
like SVG's `focusable` as `"false"` rather than a JSX boolean.

### The app owns the domain ("store stays in the app")

- `src/app/types.ts` — the model. A `Project` (name, working days, hours per
  day, break types with default lengths and how much of one still counts as
  work, kinds of work) and a `WorkDay` per
  project per calendar day: three lists of spans — `sessions` (presence),
  `breaks` (pauses inside presence, each of a type), `activities` (a kind of
  work over presence). Times are **seconds since the day's local midnight**,
  so the document means the same on every device and a night shift is an end
  past 86 400.
- `src/app/intervals.ts` — union / intersect / subtract over `[start, end)`
  stretches. Pure.
- `src/app/day.ts` — the derivation: presence = the sessions; worked =
  presence − breaks + the part of those breaks the project counts as work; a
  category's time = its activities ∩ worked. Breaks carve
  time out, activities only label it, and anything outside a session counts
  for nothing. The credit reaches the _totals_ and not the intervals — a break
  is a break wherever it is drawn — which is why `dayTotals` takes the project
  and why `worked` is longer than `workedIntervals` by exactly
  `breakCreditTotal`, and why `breakTotal` goes on reporting the whole of the
  break time. `workdayEnd` is the one figure here about a moment that has not
  happened: when the target is met if the work carries on unbroken, walked
  stretch by stretch rather than divided, because a counted break counts while
  you are on it and an uncounted one counts for nothing. **Pure and
  clock-free** — `now` is a parameter.
- `src/app/actions.ts` — the edits, as pure functions from a day to a new
  day: clock in / out, start / end a break, set the category, add a span after
  the fact, edit or remove one. The invariants (one open session, one open
  break, one open activity, a break only inside a session) live here, with a
  test, rather than in a screen. Ids and the `updatedAt` stamp come in through
  a `ctx` argument so nothing here touches chance or the clock.
- `src/app/report.ts` — many days → the totals, the balance and the
  breakdowns: a day is summarised against the project's target for that
  date, a range is the sum. A day that has not come yet is not a shortfall,
  and neither is the part of today nobody has had the chance to work: a
  summary carries both what the day was asked for (`target`, which is what
  a chart's track is drawn at and what the share is read against) and how
  much of that has come _due_ (`due`, which the balance is measured
  against). They differ only on the day being worked, and only until it is
  put away — see `summarizeDay`. Pure and clock-free.
- `src/app/dayBars.ts` — a range laid out as a bar a day, and the one rule
  that makes it one bar rather than two: the target is the _track_, standing
  at the height the day was asked for, and the hours worked fill it from the
  floor up and carry on past the top when the day ran long — so the target
  ends up underneath the bar that overtook it, and a short day's shortfall is
  the rest of the track left showing. Splits each day at its target (`inside`,
  `over`, `short`) and says how tall the plot stands. Pure and clock-free.
- `src/app/monthChart.ts` — the month laid out as a calendar of boxes: a row
  per week, a box per day, both axes hours and both cumulative — a box is as
  wide as the day worked and the boxes butt up, a row is as tall as the week
  worked and the rows stack, so the last row's foot is the month's total. The
  neighbouring month's days take the width a working day is meant to take and
  add nothing to a row's height. Its `boxColor` is the red-green-blue ramp a
  day's box is filled from — a _scale_ rather than `labels.ts`'s table, mixed
  from the theme's own tokens. Pure and clock-free.
- `src/app/project.ts` — the project template (Mon–Fri, 8 h, lunch 30 min,
  coffee 15 min, toilet 5 min — and of the three only the toilet counts as
  work, because that one is paid nearly everywhere and the other two are what
  people actually disagree about), whether a date
  is a working day, the day's target, the clamps, and `creditSeconds` — the
  one place a stored `BreakCredit` is read, so no screen and no derivation has
  to know what an absent one means. `storedCredit` is the other half: an
  answer of "none" is stored as nothing at all, the way a kind of work's
  "automatic" colour is, so a project that counts no break is byte for byte
  the document it always was.
- `src/app/clock.ts` — the twelve-hour dial's geometry: angles, hand
  rotations, arc paths, `DAY_TRACK` — the day's own track, fixed just inside
  the bezel on every dial the way the printing is fixed, so the two rings
  under the case are the day's target and the day's shape — `FACE_R`, the
  radius the watch itself is laid out inside once the day has taken that
  much, `placementOf` — where a dial's hours _actually_ sit, which is inside
  a printed ring whatever the setting says, because a scale is read from the
  outside in — `dialLayout` — where the dial's ring, the hour markers
  and the hands sit for a given placement and marker size — `chapterTracks`,
  the two halves of the minute track a printed ring is read against (its own
  ticks on its inner edge, and the same length again on the face under it,
  with two finer marks between each minute) — and `ringHit` /
  `timesAt`, which read a point on the day's track back as a moment,
  `faceHit`, which says whether a point is on the face — the switch's edge —
  and the day's own mark: `DAY_MARK` and `dayMark`, the dot a moment is
  marked with on that track and where its centre sits, with `aheadOnDial`
  for whether a moment has a place there at all (passed, or more than a turn
  of the dial away, and it has not).
  `handPoint` is the point at the end of a hand, which is an _angle_ rather
  than a share of the length — a hand is finished at the bevel it is
  finished at, so the broader hour hand carries the longer point and a fine
  minute hand does not grow a spear. Also how the
  hands _move_: `beatTurns`, the movement's beat and the little overshoot a
  stepper lands it with; and the **wind**, `windPlan` / `windMoment` /
  `windTurns`, the motion that sets the watch after the tab has been asleep —
  the minute hand a turn an hour, the hour hand a twelfth of it, the second
  hand hacked until the two are right, all on a sine's ease. `windMoment` is
  where the _dial_ stands part way through that, which is the day's as much as
  the hands': the track is filled in up to there, so the hours slept through
  arrive under the hands rather than before them. Pure.
- `src/app/look.ts` — the app's two themes, and the dial's vocabulary: the
  eight faces, nine typefaces, nine marker styles, eight hour sizes, the
  three placements against the ring, the two rings the markers are placed
  against (a faint groove, or the printed chapter ring — the day is not on
  either of them any more, see `DAY_TRACK`; and a printed ring takes the
  hours inside it whatever the placement says, see `placementOf`, so the
  picker drops the control for it), the two shapes of hand
  (a half-round bar, or the ridged taper of a dress watch, both of them
  steel), the three movements, and the nine presets they combine into. Also
  `STEEL`, the one metal every applied part is made of, and `markerProfile`,
  which says whether a marker is a roof, a dome or print — the difference
  between a part screwed to the dial and something written on it. And the
  backlight: `BACKLIGHT_CEILING` and `glowAlpha`, which is what a strength
  actually comes to on the screen — a share of the ceiling rather than of
  full opacity, so the loudest the light can go is about what the quietest
  face used to be, and `FACE_BACKLIGHT`'s numbers are what a face is worth
  relative to the others rather than an opacity; `FACE_BACKLIGHT` itself, the
  light each of the eight faces is lit by —
  warm behind the dark dials, quiet behind the pale ones, the theme's accent
  behind the neutral silver — which `resolveBacklight` looks a preset's light
  up in the way `resolveDial` looks its dial up, so a dial is one choice
  rather than two and only Custom takes the four knobs apart. Every option is an id and a spec, so the
  settings can validate and the tests can walk them.
- `src/app/sheen.ts` — where the light is, and what it does to the dial's
  metal. A `Light` is a bearing on the dial and how far off the crystal it
  stands; `facetTone` is how bright one flat face of a roof is under it (a
  hand's two halves, a block's two faces), `domeSheen` is the band and
  shoulders of a turned plot, `steelTone` mixes `STEEL` to a tone and
  `sheenTurn` swings the crystal's own glare. Pure and clock-free, so a test
  can pin what a marker at four o'clock looks like without a renderer.
  `useTilt.ts` is what moves the light.
- `src/app/format.ts` — durations, timers, times of day, and the parse of a
  typed time. A time of day is told two ways, and which one depends on
  whether the moment has happened: `formatTimeOfDay` keeps counting past
  midnight ("25:14"), because the span it ends belongs to the day before, and
  `formatWallTime` wraps into the day ("01:14"), because a moment being
  _pointed at_ rather than recorded — `workdayEnd` is the only one — is read
  off a clock, and whoever prints one says which day it falls on.
- `src/app/spec.ts` — the **specification**: a range read as the document an
  invoice is sent with. A reading of `report.ts` and `daySegments` and never a
  second fold of the days, so a specification can never say seven and a half
  hours about a day the app says seven of. What it adds is the shape an invoice
  wants: decimal hours to the hundredth, a total that is the sum of the
  _rounded_ rows so the column adds up under a calculator, the day's stretches
  for the itemised version, and `roundUpTo` — the billing convention that a
  quarter of an hour begun is a quarter billed, applied to the **day** and
  never to the range, with what it added carried as a line of its own so the
  breakdown still totals the hours billed. Pure and clock-free.
- `src/app/specStyle.ts` — how a specification _looks_: five typefaces (four
  roles each), five headings, eight accents, four tables, three densities, two
  papers, and the six styles they combine into — id and spec, the way
  `look.ts` holds the dial's. The colours are fixed hex rather than theme
  tokens, which is the one place besides the watch face where that is right: a
  printed document has a colour of its own, and it is going to be opened by
  somebody who has never seen the app. Rounding is deliberately **not** in
  here — a document that billed different hours depending on the typeface it
  was set in is the one thing a specification may not do.
- `src/app/specLayout.ts` — the whole design of the document: blocks that ask
  the sheet for room and flow onto a new page when there is not enough, a
  table that reprints its head on every page it runs onto, and the free
  edition's notice on every page of a build that carries one. It knows no
  words — every string arrives in `labels` and `names` — and no clock. One
  layout because there are **two** renderers over it (see `pdf/`), and a
  layout living in one of them is a second layout waiting to disagree.
- `src/app/pdf/` — the two renderers. `metrics.ts` is Adobe's own widths for
  the base-14 faces and the WinAnsi encoding: nothing is embedded and nothing
  is fetched, which is why a specification is tens of kilobytes and why it
  opens the same in a reader that has never seen this app — and the price is
  that whoever writes the file has to know how wide a string comes out, since
  a PDF places a string at a point and does not centre one. `page.ts` is the
  three primitives a page is made of, in points from the top left; `write.ts`
  turns them into bytes; `svg.ts` turns the same page into SVG attributes for
  the modal's preview and for the printer, pinned to this module's widths with
  `textLength` so a substituted face cannot change the layout.
- `src/app/invoiceExport.ts` — the range as the file the sibling Invoice app
  fills an invoice from (`invoice-lines`, versioned): a reading of `spec.ts`
  at one of three grains — a line for the period, a line a day, a line a kind
  of work — with the specification's rounding, so the invoice bills the hours
  the specification shows, and nothing about money. The format lives in the
  Invoice app's `docs/interchange.md`; a change here is a change there.
  `InvoiceExportModal.tsx` is the form, opened from the Report's **…**.
- `src/app/specExport.ts` — the way out: `specFilename`
  (`<project>_<period>_specification.pdf`, lowercase and not a space in it),
  the blob download, and the print, which shows the `.spec-print` copy of the
  pages and hands the printer the document rather than a picture of the
  preview.
- `src/app/edition.ts` — which build this is (`VITE_EDITION`). The one thing
  that differs is the notice on an exported specification, and it is a build
  parameter because there is no server to ask and no account to check.
- `src/app/merge.ts` — the per-record, last-edit-wins document merge that
  both cloud sync and backup restore run through.
- `src/app/migrations.ts` — parse / normalise / serialize; the only module
  that trusts stored bytes.
- `src/app/useDocStore.ts` — the document store, over a `DocBackend` seam
  rather than `localStorage` directly (which is what demo data swaps).
- `src/app/cloudHost.ts` — the seam a **host** fills to offer the app a
  document store of its own, which today means iCloud. A browser has none, so
  on the website the backend is simply absent; the native wrapper installs one
  (`native/src/icloudBridge.ts`) and it appears. The question it asks is about
  **capability, not identity** — never "am I native?", only "did something
  offer a store?" — which is why `AVAILABLE_BACKENDS` stops being the whole
  answer and the engine returns `available` instead. Also
  `createCloudHostAdapter`, which turns a host into an ordinary
  `StorageAdapter` through the framework's `createFileStoreAdapter`, so
  everything downstream is the code path Dropbox and Drive already take, and
  the mapping of a host's three failure kinds onto the errors the engine
  routes on (`auth` → Reconnect, `offline` → keep the local copy, anything
  else → stop). Validates every host before trusting it: the value arrives
  from code outside this bundle.
- `src/app/useSyncEngine.ts` — the sync engine over the framework's storage
  adapters (debounced push, conflict / auth / throttle handling). Suspended
  wholesale while demo data has taken over storage.
- `src/app/useTilt.ts` — the one place the device's orientation is read: the
  `deviceorientation` readings, eased so a hand's shake is not a flicker,
  turned into `sheen.ts`'s light and handed to the dial, so the reflection on
  the metal slides as the phone is turned. Behind a setting, because on iOS
  the sensor needs permission and the tap that switches it on is what asks.
  Still when reduced motion is asked for. **The readings never leave the
  frame they are drawn in** — nothing is stored, nothing is sent; the light
  is the only thing that survives a reading.
- `src/app/useNow.ts` — the one place the clock is read: `today` and
  `seconds`, ticking at the rate a screen asks for and re-read on focus.
- `src/app/useHands.ts` — the frames behind `clock.ts`'s hands. A
  `requestAnimationFrame` loop reads the clock (`nowExact`), works out where
  each hand belongs, and writes the three rotations straight onto the
  elements. The hands are off the render loop entirely: a movement is a rate —
  eight beats a second for a calibre, none at all for a glide wheel — and a
  rate chased by a CSS transition off a drifting interval is a rate that
  hesitates. The dial keeps rendering the rotations it had at mount, so React
  never writes a transform again; a hand that has not moved is not written, so
  a quartz touches the DOM once a second. Rotations go out wrapped into one
  turn and rounded: a browser keeps six significant figures of a CSS number,
  and an angle counted on from midnight spends them by mid-morning. The loop
  also notices the gaps — `requestAnimationFrame` does not run in a background
  tab, so the first frame after one comes back is an hour after the last, and
  that is when the watch gets wound. A wind is the whole dial at a moment that
  is not yet now, so the loop hands that moment out as it goes (`shown`, and
  the `show` callback): `Dial.tsx` cuts the day's bands off there and writes
  them frame by frame the same way, so the ring fills in under the hands
  rather than being ahead of them.
- `src/app/dev/` — the developer "Demo data" switch: two months of invented
  days (`demoData.ts`, pure and clock-free, every date an offset from
  `today`), the in-memory `DocBackend` that serves them, and the
  never-persisted flag. Behind `import()`, so a production user never
  downloads it.
- `src/app/TodayScreen.tsx`, `LogScreen.tsx`, `ReportScreen.tsx`,
  `ProjectsScreen.tsx`, `SettingsScreen.tsx` — the five screens. Four are
  bottom-nav tabs; Settings is reached from the cog — on the dial over Today,
  where a watch keeps its date, and on the top bar everywhere else — because
  it is a thing you do and leave rather than a place you are. Today is where the day
  is _filed_; Log is where it is _corrected_, because a list is where a wrong
  time is visible.
- `src/app/Dial.tsx` — the watch face, drawn: bezel, face, minute track,
  the dial's own ring (a groove, or a chapter ring printed with the minutes),
  the day's track just inside the bezel and the day on it as the coloured
  bands it is handed, the marks over them — a moment the day is heading for,
  as a dot the width of the track, outlined in the face's own ink so it reads
  on a black dial and on a white one — markers, the printing and hands. The bezel is
  also the day's progress: clockwise from twelve, closing at the target and
  going round again in the flag colour past it — the one number the Today
  screen draws rather than prints. The printing is what a dial carries
  besides its hours: the app's mark and name under twelve, the movement's
  word under them (AUTOMATIC, QUARTZ, GLIDE), and a window above six with
  the Settings cog where a date would be — geometry in `clock.ts`
  (`SIGNATURE`), which the markers are clamped to clear. Paint only, no
  vocabulary, so the same drawing serves Today and the preset cards in
  Settings. Every applied part — the markers and the hands — is steel rather
  than ink, drawn from the light `sheen.ts` reckons on it: a roof as its two
  flat faces either side of the ridge, a dome through a gradient, and a
  hairline of shadow round both where the metal meets the face. The hands are
  `useHands.ts`'s, off the render loop; the light on them is read from the
  moment the dial was handed, because a rotation the loop owns is not React's
  to read and the light turns as slowly as the hand does. So is the day while
  the watch is being set: each band is cut at the moment the wind has reached
  (`reached`) and its arcs written from the same loop, so the ring fills in
  under the hands instead of the whole day being on it before they arrive. A
  band marked `ahead` is the other side of that cut — the assumed tail of a
  break, drawn from the moment rather than up to it. Nothing moves on the
  day's track but the day: a light was run round it twice, as a travelling
  dash and then as a specular glint, and neither earned its place — the
  backlight behind the case already says the day is being counted, and a
  second thing saying it on the ring was one animation too many for a screen
  whose whole argument is quiet. Do not put it back.
- `src/app/ClockFace.tsx` — the day on the dial, and the switch. One track,
  just inside the bezel: presence as the accent band and its thin outer line,
  a kind of work in its
  hue on the band with the line left the accent, a break the flag colour on
  both — and, in the empty part of the track ahead of all that, one green dot
  where the day's hours come out (`workdayEnd`, handed down from the screen
  that prints it, so the ring and the line are one figure). It is a
  projection rather than a record, so it stands there only while the day has
  still to reach it and is gone the moment it is passed. Its green is the
  theme's `positive` rather than its `success`, which in both of this app's
  themes is the accent to the byte — and the accent on this ring already
  means "at work". Reads `day.ts` only. The face — what `faceHit` calls the face, inside the
  dial's own ring — is the button that starts and stops the day; every press
  outside it opens the day's stretches, at the stretch under the finger when
  it lands on the day's track, and so do the break ends printed on the rim;
  the window above six is the cog. On a
  phone it keeps the light's own reach clear above the case, so the halo is
  whole rather than cut flat where the screen begins. Behind the case is the backlight — the
  glow that says the day is being counted, in the colour, beat and strength
  the settings chose. Under a mouse the ring reads on hover and the right
  button opens the day's menu.
- `src/app/shortcuts.ts` — key → command, pure and tested: `S` for the face,
  the digits for the kinds of work, `,` and `P` for the two panels.
  `useShortcuts.ts` binds it to the window and stands down while a field or
  a dialog has the keyboard. It also holds `savesModal` — whether Enter in a
  dialog is asking for its Save — which `useModalSave.ts` binds for
  `ModalHeader`: a document listener, because the header is a _sibling_ of
  the form it saves, scoped to its own `aria-modal` card so only the top
  dialog answers, and deferred a tick so a field that commits on blur has
  committed before the save reads the draft. Escape is the framework's.
- `src/app/shape.ts` — what shape the window is, which is the only thing the
  shell asks about a device: a `phone` (a column), a `stand` (the same phone
  laid on its side — wide enough for three columns and far too short to stack
  them) or a `desk` (64rem and wider). The two edges live here as numbers, as
  the media queries the stylesheet uses, and as a pure `shapeOf` the tests
  walk real windows through. `useShape.ts` is the live reading:
  `useDesk` for the shell — the top bar's tabs, the side panel, no swipe —
  and `useWide` for the pair of shapes that stand the day's controls beside
  the dial, which is the stylesheet's `wide:` variant read from JavaScript.
  Keep the numbers here and the numbers in `styles.css` the same.
- `src/app/useFocus.ts` — focus mode, which is the stand's alone: the phone
  propped up on the Today screen and left untouched, where everything but the
  watch fades out and the first press brings it back. Two dwells, because
  they answer different questions: `FOCUS_AFTER_MS` is how long a screen
  nobody has touched waits, and `FOCUS_AGAIN_MS` — longer — is how long it
  waits once somebody has asked for the controls back, since asking for them
  is asking for time to use them. The second is the one in force from the
  first wake until the screen or the shape is left. The hook only says
  _when_; what goes is `[data-focus="on"]` in `styles.css`, which fades the
  tabs, the two columns, the line under the dial and the break-end chips and
  takes the press off the whole screen — so the press that wakes it is spent
  on waking it, and the click it would have turned into is eaten here. A
  watch that grew when the tabs went away would be the one thing this screen
  is built not to do, so nothing is removed and nothing moves.
- `src/app/SidePanel.tsx` — Settings on the desk: a panel over the
  right-hand edge of the content area, so the dial changes live as a face is
  picked. A dialog to assistive tech and to the shortcuts.
- `src/app/DialPicker.tsx` — Settings' dial picker: the nine preset cards,
  each a `Dial` of its own, and the eight pickers under Custom.
- `src/app/MonthCalendar.tsx` — the Report's month chart: the rows and boxes
  `monthChart.ts` lays out in seconds, scaled into the plot the screen has.
  Decides how many pixels an hour is worth, the pixels held between one week
  and the next, and nothing else. The gaps are pixels the hours do not get, so
  every position down the plot carries the ones above it — which is what keeps
  a row's foot and the month's target line comparable. It also owns the hover:
  what the pointer is on is outlined, and a card is hung over it — a box's day
  or a row's week — anchored by whichever edge is nearer so it stays inside the
  chart without being measured first. A day's box is painted two pixels narrower
  than its hit area, so the page showing between two days is not a seam the week
  answers through.
- `src/app/DayBars.tsx` — the Report's week chart: the columns `dayBars.ts`
  splits in seconds, scaled into the plot the screen has. Decides how many
  pixels an hour is worth and nothing else. The part of a bar past the target
  wears the flag colour — the Today screen's bezel overshoot, so a long day
  looks the same wherever the app draws one.
- `src/app/RangeGlance.tsx` — the Report's header: `DayGlance`'s two rings,
  one screen up. The range's share of its target, filled from twelve and going
  round again in the flag colour past it, and its balance as an arc out of
  twelve in the red of a shortfall or the green of time in hand. Paint only;
  the geometry is `clock.ts`'s and the figures are `summarizeRange`'s.
- `src/app/DayGlance.tsx` — the Log's header, where the day's four figures
  are drawn rather than printed. Two rings: the day on a twelve-hour dial —
  every stretch it was present as an arc, so a day worked in two shows the gap,
  with the first clock-in and last clock-out as hands — and beside it the
  framework's `DonutChart` split between worked and breaks. Paint only: the
  arcs are `presenceIntervals` and the figures are `dayTotals`, the same
  readings the Today screen and the Report use.
- `src/app/DayTimelineModal.tsx` — the day as the stretches `daySegments`
  makes of it, each end movable. The only edit it can make is `moveBoundary`,
  which moves both sides of a moment at once.
- `src/app/ArrivalModal.tsx`, `KindModal.tsx` — the Today screen's two
  small forms: when you started (opened by the timer), and a kind of break or
  work — named on the spot from the "Custom" pill, or held open on one the
  project already has to change what it is called and what it wears. One form
  for both, because they are the same four questions; held open it starts on
  the grid rather than the name. Removing a kind is still the project form's.
- `src/app/useLongPress.ts` — a control held rather than tapped: the handlers
  a button spreads, one factory for a screen because the pills are a list and
  a hook may not be called in a loop. It swallows the click the hold ends
  with, calls a wandering pointer a scroll, and takes the right button as the
  same gesture. What makes it possible is that nothing in the app is
  selectable (`html` in `styles.css`, with text fields and code blocks put
  back) — a press held on a label is otherwise the start of a selection, and
  on iOS the start of the glass lens a caret is placed with.
- `src/app/ModalHeader.tsx` — the top bar of every modal that is saved or
  abandoned: cancel on the left, the title between, save on the right. It is
  a sibling of the modal's scrolling body, so it stays put over a long form —
  and it keeps the buttons off the bottom edge, where the nav is.
- `src/app/SpanEditModal.tsx`, `ProjectEditModal.tsx` — the two editors.
  The span editor is the one form behind every row in the Log; the project
  editor edits a draft and saves whole.
- `src/app/TopBar.tsx`, `BottomNav.tsx` — the shell's two bars. The top bar
  grows a project switcher only once there are two projects, and on the desk
  carries the four destinations as tabs; the bottom bar is the phone's. Over
  Today the dial carries the wordmark and the cog, so the bar draws neither,
  and on the phone — where that leaves it empty unless there is a project to
  switch or a cloud to show — `App.tsx` leaves it out (`topBarNeeded`) and
  the screen pads down from the status bar itself (`.app-bare`).
- `src/app/kinds.ts` — what a kind of break or work _looks_ like: the
  fifty-two glyphs one may wear (work, breaks, and the neutral marks), and the
  eight hues a kind of work may be drawn in. Id and spec, the way `look.ts`
  holds the dial's, so the form offers the ids, the document stores one, the
  reader validates it and a test walks the table. Imports nothing — it sits
  under the model. Pure.
- `src/app/labels.ts` — domain value → label, glyph and colour, in one place,
  so a kind of work is one hue and one mark on the clock, in the lists and in
  the charts. A kind of work's own colour first, then the hue its position in
  the project's list gives it.
- `src/app/KindPicker.tsx` — the mark a kind wears and, for a kind of work,
  its colour: the grid unfolds under the row that opened it — in the project
  form and in `KindModal` — rather than over it, and the marks in it are
  drawn in the hue being chosen, so the grid is the preview.
- `src/app/i18n/en.ts` — every user-facing string.
- `src/output.ts` — the §19.4 central output module (semantic log helpers
  over the in-app log store).
- `pwa-plugin.ts` — emits the service worker + version/precache manifests the
  framework's `usePwaUpdate` consumes.

Dependency direction: screens → stores → framework. Nothing imports from the
framework's internals — only its published subpaths.

### Derive, don't store

Nothing about a total is persisted — not the hours worked, not the balance,
not the percentage on the Today screen's bezel. The document holds projects and the
spans of each day and only those; everything else is recomputed on render
from `day.ts` and `report.ts`. This is why correcting a break from last
Tuesday immediately fixes every downstream number, and why there is no cache
to invalidate. **Adding a derived field to `AppData` is almost always the
wrong fix** — the right one is a function in `day.ts` or `report.ts`.

### One derivation, three screens

The timer on Today, the numbers on the Log's day header and the columns on
the Report are three renderings of the _same_ `dayTotals`. Do not add a
second estimator for any of it — a report that says eight hours over a day
whose timer said seven and a half is the one failure this arrangement exists
to make impossible. If a screen needs a new figure, add it to `DayTotals` or
`DaySummary` and let every screen read it.

### Keep the derivation clock-free

`day.ts`, `report.ts`, `actions.ts` and `clock.ts` never call `new Date()`.
`now` and `today` are parameters, supplied by `useNow` (which refreshes on
focus, so a phone that slept does not show the time it dozed off at). Keep it
that way: it is what lets the tests pin real times without fake timers.

### A project is data, not a setting

Which project the screens show is a per-device setting
(`useAppSettings.ts`); the projects themselves are in the document, so they
sync and back up with the days. With one project the app never asks which;
the switcher on the top bar and the "In use" badge appear only once there are
two. A change that shows a project picker to someone with one project is a
regression.

## The native wrapper (`native/`)

`native/` is a **thin** Expo / React Native shell that ships this web app to
the App Store and Google Play. It is a **separate npm project** with its own
`package.json`, its own lockfile and its own `node_modules` — `npm ci` at the
root does not touch it, and neither does `make install`. Reach it with
`--prefix native` (or the `make native-*` targets).

**Thin is a constraint, not an aspiration.** The wrapper does four things:

1. packs the built web app into `assets/webroot.zip` and serves it from a
   loopback HTTP server (`src/local-server.ts`);
2. points a `WebView` at that origin and otherwise gets out of the way;
3. injects two scripts into the page — `src/injected.ts`, which reports the
   resolved theme colours so the native chrome follows them and unregisters
   the service worker, and `src/icloudBridge.ts`, which offers the page a
   document store;
4. answers those store requests against the app's own iCloud container
   (`src/icloud.ts` → `modules/icloud-store`).

### The two native-only features, and why there have to be two

**Being self-contained and iCloud are the only features the wrapper adds.**
Everything else a reader sees is the web app, unchanged.

They are also the reason the wrapper is shippable at all. **App Store
guideline 4.2 (minimum functionality) rejects a build that is only a viewer
for a website**, so this app has to do things the browser cannot, and be seen
to: it serves the time report from inside the download (no network at all,
ever), and it keeps the document in the reader's own iCloud container, which
no browser can reach. A change that removes a native-only feature does not
just lose the feature — it weakens the 4.2 case for the whole listing. A
change that _adds_ one is not forbidden, but it has to clear both rules below
and it has to be worth its own row here.

- **Nothing in `src/` may learn that the wrapper exists.** No `window.__native`
  feature detection, no native-only branch, no build flag. The wrapper reads
  the shipped app from the outside, the way a second reader would.

  A native-only feature that the web app has to _offer_ — iCloud is the first
  — is done as a **capability the host may offer**, never as a check for this
  wrapper. `src/app/cloudHost.ts` asks whether a document store is present on
  `window`; it never asks what it is running inside. A browser offers none, so
  the backend is simply absent there, and a second host offering the same five
  methods would light it up with no change to `src/`. If a change seems to need
  the web app to know it is native, the change is wrong; if it needs a
  capability the host can offer, name the capability.

- **The wrapper may not reimplement the domain.** It moves bytes: a file in, a
  file out. What a day adds up to, what a break counts for, and how two
  devices' copies reconcile are `day.ts`, `report.ts` and `merge.ts`'s, and a
  Swift copy of any of that would drift the first week it existed. That is
  also why the store is file-shaped — `list` / `read` / `write` / `remove`, the
  framework's own `FileStore` — rather than something that understands a day:
  the whole document goes through the app's ordinary per-record merge with no
  iCloud-shaped special case anywhere.

### What breaks quietly

- **The iCloud bridge is three strings that must agree with `src/`**: the
  property the host installs itself on (`window.__timeCloudHost`), the
  announcement event (`time:cloud-host`), and the provider's name
  (`icloud`) — plus the five method names. None of them fails loudly on a
  mismatch: the backend simply never appears in the storage picker, on a
  device where the reader can see nothing wrong. `tests/native_icloud_test.ts`
  pins all of them against the app's own constants.
- **Nothing the root `tsc` can reach may import `expo`** (or any other
  `native/`-only dependency). The root config type-checks `tests/`, and
  `tests/native_icloud_test.ts` imports `native/src/icloudBridge.ts` — but a
  root `npm ci` does not install `native/`'s dependencies, so such an import
  passes on a fully-installed machine and fails only in CI. A **type-only**
  import is still an import here. That is why the wire shapes live in
  `native/src/icloudWire.ts`, which imports nothing at all, and why only
  `native/src/icloud.ts` reaches for the native module. `tsc` cannot guard
  this locally, so `tests/native_icloud_test.ts` reads the two files' import
  lines instead — crudely, and on purpose, because that fails where it helps.
- **A failure crosses the bridge as DATA, never as a rejection.** The only
  channel back into the page is an injected script, and an exception thrown
  there is swallowed by the WebView rather than reaching the promise. So
  `src/icloud.ts` answers `{ ok: false, kind }` and `cloudHost.ts` turns the
  kind back into the right framework error. Getting the three kinds apart
  matters: `offline` is what keeps the local copy in play, and collapsing it
  into `error` is how an unreachable container becomes an empty one and the
  user's hours get pushed over.
- **A file iCloud has listed is not a file iCloud has downloaded.** The Swift
  side waits for the bytes and reports a timeout as a failure, never as an
  empty document — an empty document is a valid one and would be merged as
  such.
- **The iCloud container id is pinned in three files that must agree**:
  `app.config.js` (all three iCloud entitlements),
  `modules/icloud-store/index.ts`, and `modules/icloud-store/ios/
ICloudStoreModule.swift`. Changing it after release strands every document
  already synced under the old one.
- **The loopback port is fixed** (`src/local-server.ts`). A web origin is
  scheme + host + port and `localStorage` is keyed by origin, so a random port
  hands the WebView an empty store on every launch — every day the user logged
  appears to vanish. The ladder falls back to another _deterministic_ port, and
  never to `0`.
- **`localhost`, never `127.0.0.1`.** App Transport Security blocks the literal
  address from `WKWebView` even with exception domains declared; the failure
  mode is a silent blank page on iOS.
- **The service worker is unregistered** (`src/injected.ts`). The origin is
  stable across app updates, so a worker registered by an older build keeps
  answering from its precache after a store update has already unpacked the
  new one — an App Store update that changes nothing until the app is deleted.
- **`native/ios` and `native/android` are prebuild output.** Regenerated from
  `app.config.js` by `expo prebuild --clean`, gitignored, and the source of
  truth for nothing. A fix made there survives until the next build; make it
  in the config instead.
- **`native/tsconfig.json` must not `extend` Expo's base.** `native/` is not
  installed by a root `npm ci`, so `expo/tsconfig.base` is absent in CI, and
  Vite resolves the nearest tsconfig for the root test that imports
  `native/src/icloudBridge.ts` — an unresolvable `extends` turns a
  fully-installed machine green and CI red. The base is inlined instead;
  re-check it against `node_modules/expo/tsconfig.base.json` when expo is
  upgraded.

Native builds run on **EAS** and are dispatch-only
(`.github/workflows/native.yml`) — every run costs build credits. CI's `native`
job only type-checks. See `native/README.md` and `native/RELEASING.md`.

## Where new code goes

| Change                                             | Goes in                                                                                                                                                                                                                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A new thing to log about a day                     | `src/app/types.ts` (model) + `actions.ts` (the edit) + `day.ts` (what it counts for) + a `migrations.ts` step — and ask what it feeds                                                                                                                                                  |
| A new derived number                               | `src/app/day.ts` (per day) or `report.ts` (over days), with tests in `tests/day_test.ts` / `tests/report_test.ts`                                                                                                                                                                      |
| A change to what the balance counts                | `src/app/report.ts` (`summarizeDay`'s `due` — never the day's `target`, which the charts draw their track at and the share is read against), with tests at real times in `tests/report_test.ts`                                                                                        |
| A change to what a button on Today does            | `src/app/actions.ts`, with tests in `tests/actions_test.ts`                                                                                                                                                                                                                            |
| A change to how the clock draws                    | `src/app/clock.ts` (geometry, tested), `sheen.ts` (what the light does to the metal, tested), `Dial.tsx` (paint) or `ClockFace.tsx` (what the day means on it, and what a press on it does)                                                                                            |
| A change to where the day sits on the dial         | `src/app/clock.ts` (`DAY_TRACK` and `FACE_R`, walked by `tests/clock_test.ts` for every dial) — never a second set of radii in `Dial.tsx`, and never back onto the dial's own ring                                                                                                     |
| A dial option that only makes sense with another   | `src/app/clock.ts` (let the geometry decide, the way `placementOf` does) + `DialPicker.tsx` (drop the control rather than offer a choice that cannot look right) — never a preset that quietly differs from what its settings say                                                      |
| A change to what a break counts for                | `src/app/types.ts` (`BreakCredit`) + `project.ts` (`creditSeconds` / `storedCredit`) + `day.ts` (what it counts for) + the validation in `migrations.ts` + `BreakCreditField.tsx` — one control for both forms, never a second table                                                   |
| A change to how long a break is assumed to take    | `src/app/BreakMinutesField.tsx` (the control and its step) + `project.ts` (`clampBreakMinutes` and the bounds) — one control for both forms, and the step is printed on the button that takes it rather than left to a number field's own arrows                                       |
| A change to how the hands move                     | `src/app/clock.ts` (the beat and the wind, tested) or `useHands.ts` (the frames) — never a CSS transition, see the note there; anything else on the dial that has to move with them is cut at `windMoment` and written from that loop too                                              |
| A change to the shape of a hand                    | `src/app/look.ts` (`DIAL_HANDS` — the widths, the bevel its sides close at, the tail) + `clock.ts` (`handPoint`, walked by `tests/clock_test.ts`) + `Dial.tsx` (paint) — the tip is an angle, never a share of the hand's length                                                       |
| A new keyboard shortcut                            | `src/app/shortcuts.ts` (the key and the command, tested in `tests/shortcuts_test.ts`) + the screen that answers the command                                                                                                                                                            |
| Something only the desk does                       | Behind `useDesk()` in `App.tsx`, or a `lg:` class / `@media (min-width: 64rem)` rule — the phone shell stays as it is                                                                                                                                                                  |
| Something the phone laid down does when left alone | `src/app/useFocus.ts` (when) + `[data-focus="on"]` in `styles.css` (what) — fade it and take the press off it, never `display: none` or a layout that moves the watch                                                                                                                  |
| Something the desk and a phone on its side share   | Behind `useWide()`, or a `wide:` class / the paired `@media` list in `styles.css` — never `lg:` alone, which leaves a landscape phone on the layout it has no height for; the edges are `shape.ts`'s                                                                                   |
| A change to the light behind the case              | `src/app/look.ts` (`FACE_BACKLIGHT`, the light a face is lit by, and `resolveBacklight` — walked by `tests/look_test.ts`) + `DialPicker.tsx`, which is the only screen the knobs are on; never a second backlight table                                                                |
| A new face, marker, typeface, ring, hand or preset | Run the `add-watch-face` skill (`.agents/skills/add-watch-face/`): `src/app/look.ts` (id + spec, walked by `tests/look_test.ts`), a string in `en.ts`, `main.tsx` for a bundled `@fontsource` family, and `make shots` to look at it — named for what it looks like, never for a maker |
| A change to the Report's month chart               | `src/app/monthChart.ts` (layout and colour, tested in `tests/monthChart_test.ts`) or `MonthCalendar.tsx` (paint)                                                                                                                                                                       |
| A change to the Report's week chart                | `src/app/dayBars.ts` (how a day splits at its target, tested in `tests/dayBars_test.ts`) or `DayBars.tsx` (paint)                                                                                                                                                                      |
| A change to the Report's two rings                 | `src/app/RangeGlance.tsx` (paint) — the angles come from `clock.ts` and the figures from `report.ts`, never a second fold of the days                                                                                                                                                  |
| A new figure on the exported specification         | `src/app/spec.ts` (the reading, tested in `tests/spec_test.ts`) + `specLayout.ts` (where it goes) — never a second fold of the days, and never a figure the screens cannot also show                                                                                                   |
| A change to the file exported for an invoice       | `src/app/invoiceExport.ts` (a reading of `spec.ts`, tested in `tests/invoiceExport_test.ts`) — bump `INVOICE_LINES_VERSION` on a breaking change and change the Invoice app's `interchange.ts` with it; never a second fold of the days                                                |
| A new look a specification may have                | `src/app/specStyle.ts` (id + spec, walked by `tests/specStyle_test.ts`) + a string in `en.ts` + `SpecExportModal.tsx` (the control) — fixed hex, never a theme token, and never a billing rule dressed as a style                                                                      |
| A change to how a specification is drawn           | `src/app/specLayout.ts` (the one layout, tested in `tests/specLayout_test.ts`) — never in `SpecPages.tsx` or `pdf/write.ts`, which are the two renderers over it and must stay interchangeable                                                                                         |
| A change to what a day is billed at                | `src/app/spec.ts` (`roundUpTo`, applied per day and never to the range) + `useAppSettings.ts` (`specRounding`) — never `SpecStyle`, and never `day.ts`, which reports what was worked                                                                                                  |
| A change to the Log's two rings                    | `src/app/DayGlance.tsx` (paint) — the angles come from `clock.ts` and the figures from `day.ts`, never from a second reading of the day                                                                                                                                                |
| A change to what a project holds                   | `src/app/types.ts` + `project.ts` + `ProjectEditModal.tsx` + `migrations.ts`                                                                                                                                                                                                           |
| A new glyph, or a colour a kind can wear           | `src/app/kinds.ts` (id + spec, walked by `tests/kinds_test.ts`) and a name in `en.ts` — never a second table in a screen                                                                                                                                                               |
| A new control on the span editor                   | `src/app/SpanEditModal.tsx` — never in one of the screens that open it                                                                                                                                                                                                                 |
| A new figure about a moment yet to come            | `src/app/day.ts` (`workdayEnd` is the only one, and it says nothing rather than guessing) — with a test at real times in `tests/day_test.ts`, and printed with `format.ts`'s `formatWallTime` rather than a record's 25th hour                                                         |
| A moment marked on the day's track                 | `src/app/clock.ts` (`DAY_MARK` / `dayMark`, and `aheadOnDial` — whether it has a place there at all, both walked by `tests/clock_test.ts`) + `ClockFace.tsx` (which moment, and its colour) + `Dial.tsx` (paint) — never the accent or the flag, which mean "at work" and "break" here |
| A change to what a kind of break or work wears     | `src/app/KindModal.tsx` (the form, opened by "Custom" or by holding a pill) — the mark and the hue tables stay in `kinds.ts`                                                                                                                                                           |
| A change to which kinds are on the Today screen    | `src/app/types.ts` (`pinned`) + `project.ts` (`isPinned` / `storedPinned` — the one place an absent one is read) + the validation in `migrations.ts` + `TodayScreen.tsx` (the split and the row's "…") — never a second list, and never a kind the "…" cannot reach                    |
| A control that answers being held                  | `src/app/useLongPress.ts` — spread its handlers on the button; never a second timer in a screen                                                                                                                                                                                        |
| A modal's save / cancel                            | `src/app/ModalHeader.tsx` — one top bar, never a row of buttons at the foot of the sheet; Enter and Escape are that bar's, not a form's                                                                                                                                                |
| A new way to correct a time on Today               | `src/app/DayTimelineModal.tsx` (an edge) or `ArrivalModal.tsx` (the arrival), with the edit as a pure function in `actions.ts`                                                                                                                                                         |
| A new screen                                       | `src/app/<Name>Screen.tsx` + a tab in `src/app/BottomNav.tsx`, or a button in `src/app/TopBar.tsx` if it is an action rather than a place                                                                                                                                              |
| A change to the light on the dial's metal          | `src/app/sheen.ts` (the light, and what it does to a facet or a dome — tested in `tests/sheen_test.ts`), `useTilt.ts` (the device's own readings) or `Dial.tsx` (paint)                                                                                                                |
| A new setting                                      | `src/app/useAppSettings.ts` (shape + clamping) + a `Section` in `SettingsScreen.tsx`                                                                                                                                                                                                   |
| A new developer-only affordance                    | `src/app/dev/`, revealed behind `settings.devMode` in `SettingsScreen.tsx`                                                                                                                                                                                                             |
| A change to what the demo shows                    | `src/app/dev/demoData.ts` (offsets from `today`, never fixed dates), with tests in `tests/demoData_test.ts`                                                                                                                                                                            |
| A new storage backend                              | The framework, not here — this app only wires adapters up in `useSyncEngine.ts`                                                                                                                                                                                                        |
| A backend only some hosts can offer                | `src/app/cloudHost.ts` (the capability, tested in `tests/cloudHost_test.ts`) + a row in `useSyncEngine.ts`'s `PROVIDER_NAMES` and its `available` — never a check for the wrapper, and never a module constant that claims a host is there                                             |
| Anything in the native wrapper                     | `native/...` — and read "The native wrapper" above first                                                                                                                                                                                                                               |
| Any user-facing string                             | `src/app/i18n/en.ts`, never inline in a component                                                                                                                                                                                                                                      |
| A shared UI primitive                              | The framework, if it is domain-free; `src/app/` only if it is time-report-specific                                                                                                                                                                                                     |

## Test conventions

Tests live in `tests/` with a `_test` suffix (OSS_SPEC §20.2) and run under
Vitest in the `node` environment — they cover the pure domain modules
(`intervals`, `day`, `actions`, `report`, `monthChart`, `clock`, `sheen`,
`format`, `project`, `kinds`, `merge`, `migrations`, `demoData`,
`shortcuts`, `cloudHost`), which is where the app's real
logic is. `native_icloud_test.ts` is the one that reaches outside `src/`: it
pins the strings the wrapper and the app have to agree on, and guards the
import discipline that lets it import from `native/` at all — see "The native
wrapper" above. No
DOM, no testing-library, no mocked clock. `tests/fixtures/helpers.ts` holds the shared
fixtures (a project, a day, a named-id `ctx`).

Run one file with `npx vitest run tests/day_test.ts`.

A change to the derivation without a test that pins the new behaviour to real
times is not finished. `dayTotals` takes the project as well as the day, because
what a break counts for belongs to the project; `tests/fixtures/helpers.ts`'s
`project()` counts no break, so a test that cares must say so. UI changes should keep the boot smoke path working:
`npm run build && npm run preview`, add a project, start working, and
check that the light comes up and the Log shows the session.

## Changelog and feature docs

`CHANGELOG.md`'s released sections are **generated** — never hand-edit them.
Every user-visible change adds a fragment under `.changes/unreleased/`:

```
.changes/unreleased/$(date +%s)-short-slug.md
---
type: Added        # Added | Changed | Fixed | Removed | Security | Deprecated
title: Short bold title
breaking: true     # optional — forces a major release
---

One sentence a user will read in the changelog.
```

A fragment for a substantial feature links to its doc under `docs/features/`
with `[Learn more](feature:<slug>)`.

## Documentation sync points

| If you change…                   | Update…                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The derivation in `day.ts`       | `docs/day-model.md`, `docs/features/today.md`, and the README's Examples block if the output shape moved                                                                       |
| `report.ts` or `monthChart.ts`   | `docs/day-model.md` (the report section) and `docs/features/report.md`                                                                                                         |
| `spec.ts` or `invoiceExport.ts`  | `docs/features/report.md` — and, for the export, the Invoice app's `docs/interchange.md`                                                                                       |
| `actions.ts`                     | `docs/features/today.md` and `docs/features/log.md`                                                                                                                            |
| The `Project` or `WorkDay` shape | `docs/architecture.md`'s data shape, `docs/features/projects.md`, and a `migrations.ts` step — a purely additive optional field needs the validation rather than a step        |
| Where the day sits on the dial   | `docs/features/today.md` and the README's Usage table — both describe the ring a reader is looking at                                                                          |
| The sync engine or the merge     | `docs/sync.md`                                                                                                                                                                 |
| `cloudHost.ts` or the bridge     | `docs/sync.md`, `docs/features/cloud-sync.md`, `docs/features/native-app.md`, `native/README.md`, and `tests/native_icloud_test.ts` — which pins the strings both halves share |
| Anything under `native/`         | `docs/features/native-app.md`, `native/README.md`, `native/RELEASING.md`                                                                                                       |
| A `VITE_*` variable              | `docs/configuration.md`, `src/vite-env.d.ts`, the README's Configuration table, and the workflows that pass it                                                                 |
| A screen's behaviour             | The matching `docs/features/*.md` and the README's Usage table                                                                                                                 |
| The navigation (nav or top bar)  | `docs/architecture.md`'s tree and the README's Usage tables                                                                                                                    |
| Module layout                    | The "Where new code goes" table above and `docs/architecture.md`                                                                                                               |
| A make target or script          | `CONTRIBUTING.md`, the README's Quick start, and this file's command list                                                                                                      |

## Parity and cross-cutting rules

- **Every string goes through `t()`.** English is the only catalog today; the
  runtime is in place so adding a language is one `loaders` entry. The names a
  new project starts with (Lunch, Coffee, Toilet, Meetings, …) are translated
  once at creation and then live in the document as the user's own words.
- **Two themes only** — one light, one dark, plus "follow the device". The
  framework ships a dozen palettes; this app deliberately exposes none of them.
  The one deliberate exception is the watch **face** (`DIAL_FACE` in
  `look.ts`): the dial on Today is drawn as a wrist watch, and a watch face has
  a colour the way an object does, not the way a theme does — a black dial is
  black on the light theme. Its ink, bezel and gradient are the face's own and
  never reach the UI around it; the day drawn on it stays the theme's accent,
  flag and category hues. Everything else about the dial — markers, typeface,
  size, placement, movement — is shape, not colour. The applied parts are
  not a colour at all: `STEEL` is one metal for all eight faces, and what a
  marker or a hand looks like is `sheen.ts`'s reckoning of the light on it. A dial option that tinted
  a button or a card would be the palette gallery this rule exists to refuse.
- **Four destinations, no sidebar, no drawer.** On the phone held upright
  they are the bottom bar, in a fixed left-to-right order a swipe moves
  along; laid down the same four, in the same order, go to the _top_ —
  two tabs into the left corner and two into the right, the label beside
  the glyph, floating over the watch where there is no bar to sit above
  (`app-nav-floating`, from `bare` in `App.tsx`) and taking a row of its
  own where there is — and fading out with everything else once that phone
  has been left alone on the watch, which is focus mode rather than a drawer:
  they are still the same four in the same corners, and the first press
  anywhere brings them back (`useFocus.ts`); on the desk the same four, in the same order, are
  tabs on the top bar, and the bottom bar is not drawn. A phone on its
  side does not get a rail down its edge: that is the sidebar this rule
  refuses. What the corners buy is the height a bar across the foot of a
  393px window was taking off the dial — the middle of that strip is empty,
  and the middle is where the watch stands. Things you do and then leave belong on the top bar, which
  is where Settings went — a screen on the phone, a side panel on the desk.
  Over Today the watch carries the name and the cog itself, the way a dial
  carries its maker and its date, and the bar goes without them; on the
  phone it goes altogether when nothing else is on it. A new _action_ is a
  top-bar button, not a tab.
- **The face is the switch, and only the face.** Starting and stopping the
  day is a press on the dial _inside its own ring_, and nothing else on Today
  starts or stops it. Everything outside that — the printed ring, the rim and
  the day's track under the bezel — opens the day stretch by stretch, because
  out there the watch is carrying a record and a record is corrected rather
  than switched. The line under the dial opens the arrival. Do not add a start
  button back, and do not give the switch the ring again.
- **No timer.** The day's progress is the bezel and the state is the light
  and the one line under the dial. A figure ticking up is the thing this
  screen was rid of.
- **The watch is centred, and it does not move.** Where the dial is sized by
  the height its row has left over — the desk and the stand — the words under
  it keep their room whether there are two lines of them or one
  (`.app-dial-note`), and the same room is left empty above the dial
  (`--dial-gap` and the reserve on the dial's column, `styles.css`). A line
  that comes and goes there is a watch that changes size when the day starts,
  and a caption reserved on one side only is a watch half a caption above the
  middle of the window.
- **A category's colour is one table.** `labels.ts` maps a kind of work to a
  hue — the one the project picked, or the one its position in the list gives
  it — and the clock's inner ring, the category chips, the Log's rows, the
  report's donut and the kind's own glyph all read it. Don't colour one of
  them another way. The palette in `kinds.ts` is the theme's own tokens, never
  fixed hex, and never the accent or the flag: those two already mean "at
  work" and "break" on the ring.
- **A kind's mark is one table too.** `kinds.ts` holds every glyph as paths on
  the same 24×24 grid as `icons.tsx`, drawn in `currentColor` by `KindGlyph`,
  so the element around it decides the colour. A new mark is an entry there
  and a name in `en.ts` — never an inline `<svg>` in a screen, and never an
  emoji or an icon font.
- **No dependency creep.** The framework, Preact, a font, and workbox-window.
  A new runtime dependency needs a reason that the framework can't serve. The
  faces the app ships — Inter, JetBrains Mono (the wordmark), and the dial's
  nine (Source Serif, Jost, Oswald, Barlow, Playfair Display, Cinzel, plus
  the two above and Inter's light weight) — are `@fontsource` packages,
  imported in `main.tsx` a weight and a subset at a time, and bundled from
  this origin. A font is
  never reached for over the network.

## Website staleness

The app _is_ the website (OSS_SPEC §11.2 / §11.4) — `pages.yml` builds it and
deploys `dist/`. There is no separate marketing site to drift out of date, but
the SEO surface in `index.html` and `public/` does: when the app's description
changes, update `index.html`'s title/description/OG/JSON-LD, `public/llms.txt`,
and the manifest copy in `pwa-plugin.ts` together. `make check-seo` asserts the
structure, not the wording — it will not catch a stale sentence.

## Maintenance skills

Skills live under `.agents/skills/` (OSS_SPEC §21); `.claude/skills` is a
symlink into that tree. Each has a `SKILL.md` with its discovery process, its
source→output mapping, and a `.last-updated` marker.

| Skill             | Runs when                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `maintenance`     | The registry and run order for every other skill — start here                                                                                          |
| `write-changeset` | Any user-visible change, before opening the PR                                                                                                         |
| `update-docs`     | `src/app/` changed in a way a `docs/` topic describes                                                                                                  |
| `update-readme`   | Commands, configuration, or the feature set changed                                                                                                    |
| `add-watch-face`  | A new dial, preset, marker style, typeface or ring is asked for — often from a photograph of a watch; keeps makers' names and trademarked features out |
