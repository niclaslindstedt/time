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
  day, break types with default lengths, kinds of work) and a `WorkDay` per
  project per calendar day: three lists of spans — `sessions` (presence),
  `breaks` (pauses inside presence, each of a type), `activities` (a kind of
  work over presence). Times are **seconds since the day's local midnight**,
  so the document means the same on every device and a night shift is an end
  past 86 400.
- `src/app/intervals.ts` — union / intersect / subtract over `[start, end)`
  stretches. Pure.
- `src/app/day.ts` — the derivation: presence = the sessions; worked =
  presence − breaks; a category's time = its activities ∩ worked. Breaks carve
  time out, activities only label it, and anything outside a session counts
  for nothing. **Pure and clock-free** — `now` is a parameter.
- `src/app/actions.ts` — the edits, as pure functions from a day to a new
  day: clock in / out, start / end a break, set the category, add a span after
  the fact, edit or remove one. The invariants (one open session, one open
  break, one open activity, a break only inside a session) live here, with a
  test, rather than in a screen. Ids and the `updatedAt` stamp come in through
  a `ctx` argument so nothing here touches chance or the clock.
- `src/app/report.ts` — many days → the totals, the balance and the
  breakdowns: a day is summarised against the project's target for that
  date, a range is the sum. A day that has not come yet is not a shortfall.
  Pure and clock-free.
- `src/app/monthChart.ts` — the month laid out as a calendar of boxes: a row
  per week, a box per day, both axes hours and both cumulative — a box is as
  wide as the day worked and the boxes butt up, a row is as tall as the week
  worked and the rows stack, so the last row's foot is the month's total. The
  neighbouring month's days take the width a working day is meant to take and
  add nothing to a row's height. Its `boxColor` is the red-green-blue ramp a
  day's box is filled from — a _scale_ rather than `labels.ts`'s table, mixed
  from the theme's own tokens. Pure and clock-free.
- `src/app/project.ts` — the project template (Mon–Fri, 8 h, lunch 30 min,
  coffee 15 min, toilet 5 min), whether a date is a working day, the day's
  target, the clamps.
- `src/app/clock.ts` — the twelve-hour dial's geometry: angles, hand
  rotations, arc paths, and `dialLayout` — where the day's ring, the hour
  markers and the hands sit for a given placement and marker size — and the
  timer card's frame path, which is the same arithmetic for a rounded
  rectangle. Pure.
- `src/app/look.ts` — the app's two themes, and the dial's vocabulary: the
  eight faces, eight typefaces, eight marker styles, eight hour sizes, the
  three placements against the ring, the three movements, and the eight
  presets they combine into. Every option is an id and a spec, so the
  settings can validate and the tests can walk them.
- `src/app/format.ts` — durations, timers, times of day, and the parse of a
  typed time.
- `src/app/merge.ts` — the per-record, last-edit-wins document merge that
  both cloud sync and backup restore run through.
- `src/app/migrations.ts` — parse / normalise / serialize; the only module
  that trusts stored bytes.
- `src/app/useDocStore.ts` — the document store, over a `DocBackend` seam
  rather than `localStorage` directly (which is what demo data swaps).
- `src/app/useSyncEngine.ts` — the sync engine over the framework's storage
  adapters (debounced push, conflict / auth / throttle handling). Suspended
  wholesale while demo data has taken over storage.
- `src/app/useNow.ts` — the one place the clock is read: `today` and
  `seconds`, ticking at the rate a screen asks for and re-read on focus.
- `src/app/dev/` — the developer "Demo data" switch: two months of invented
  days (`demoData.ts`, pure and clock-free, every date an offset from
  `today`), the in-memory `DocBackend` that serves them, and the
  never-persisted flag. Behind `import()`, so a production user never
  downloads it.
- `src/app/TodayScreen.tsx`, `LogScreen.tsx`, `ReportScreen.tsx`,
  `ProjectsScreen.tsx`, `SettingsScreen.tsx` — the five screens. Four are
  bottom-nav tabs; Settings is reached from the top bar's cog, because it is a
  thing you do and leave rather than a place you are. Today is where the day
  is _filed_; Log is where it is _corrected_, because a list is where a wrong
  time is visible.
- `src/app/Dial.tsx` — the watch face, drawn: bezel, face, minute track,
  markers, hands, and the day as coloured bands it is handed. The bezel is
  also the day's progress: clockwise from twelve, closing at the target and
  going round again in the flag colour past it — the one number the Today
  screen draws rather than prints. Paint only, no vocabulary, so the same
  drawing serves Today and the preset cards in Settings. The hands move by
  CSS transition (`styles.css`), keyed on the movement.
- `src/app/ClockFace.tsx` — the day on the dial, and the switch. One ring:
  presence as the accent band and its thin outer line, a kind of work in its
  hue on the band with the line left the accent, a break the flag colour on
  both. Reads `day.ts` only. The face is the button that starts and stops
  the day; a stretch on the ring, and the break ends printed on the rim,
  open the day's stretches instead. Behind the case is the backlight — the
  glow that says the day is being counted, in the colour, beat and strength
  the settings chose. Under a mouse the ring reads on hover and the right
  button opens the day's menu.
- `src/app/shortcuts.ts` — key → command, pure and tested: `S` for the face,
  the digits for the kinds of work, `,` and `P` for the two panels.
  `useShortcuts.ts` binds it to the window and stands down while a field or
  a dialog has the keyboard.
- `src/app/useDesk.ts` — whether the window is a desk (64rem and wider) or a
  phone. The one number, shared with every `lg:` and `@media (min-width:
64rem)` in the app.
- `src/app/SidePanel.tsx` — Settings on the desk: a panel over the
  right-hand edge of the content area, so the dial changes live as a face is
  picked. A dialog to assistive tech and to the shortcuts.
- `src/app/DialPicker.tsx` — Settings' dial picker: the eight preset cards,
  each a `Dial` of its own, and the six pickers under Custom.
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
- `src/app/DayTimelineModal.tsx` — the day as the stretches `daySegments`
  makes of it, each end movable. The only edit it can make is `moveBoundary`,
  which moves both sides of a moment at once.
- `src/app/ArrivalModal.tsx`, `NewKindModal.tsx` — the Today screen's two
  small forms: when you started (opened by the timer), and a kind of break or
  work named on the spot (the "Custom" pill).
- `src/app/ModalHeader.tsx` — the top bar of every modal that is saved or
  abandoned: cancel on the left, the title between, save on the right. It is
  a sibling of the modal's scrolling body, so it stays put over a long form —
  and it keeps the buttons off the bottom edge, where the nav is.
- `src/app/SpanEditModal.tsx`, `ProjectEditModal.tsx` — the two editors.
  The span editor is the one form behind every row in the Log; the project
  editor edits a draft and saves whole.
- `src/app/TopBar.tsx`, `BottomNav.tsx` — the shell's two bars. The top bar
  grows a project switcher only once there are two projects, and on the desk
  carries the four destinations as tabs; the bottom bar is the phone's.
- `src/app/labels.ts` — domain value → label and colour, in one place, so a
  kind of work is one hue on the clock and in the charts.
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

## Where new code goes

| Change                                  | Goes in                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A new thing to log about a day          | `src/app/types.ts` (model) + `actions.ts` (the edit) + `day.ts` (what it counts for) + a `migrations.ts` step — and ask what it feeds     |
| A new derived number                    | `src/app/day.ts` (per day) or `report.ts` (over days), with tests in `tests/day_test.ts` / `tests/report_test.ts`                         |
| A change to what a button on Today does | `src/app/actions.ts`, with tests in `tests/actions_test.ts`                                                                               |
| A change to how the clock draws         | `src/app/clock.ts` (geometry, tested), `Dial.tsx` (paint) or `ClockFace.tsx` (what the day means on it, and what a press on it does)      |
| A new keyboard shortcut                 | `src/app/shortcuts.ts` (the key and the command, tested in `tests/shortcuts_test.ts`) + the screen that answers the command               |
| Something only the desk does            | Behind `useDesk()` in `App.tsx`, or a `lg:` class / `@media (min-width: 64rem)` rule — the phone shell stays as it is                     |
| A new face, marker, typeface or preset  | `src/app/look.ts` (id + spec, walked by `tests/look_test.ts`), a string in `en.ts`, and `main.tsx` for a bundled `@fontsource` family     |
| A change to the Report's month chart    | `src/app/monthChart.ts` (layout and colour, tested in `tests/monthChart_test.ts`) or `MonthCalendar.tsx` (paint)                          |
| A change to what a project holds        | `src/app/types.ts` + `project.ts` + `ProjectEditModal.tsx` + `migrations.ts`                                                              |
| A new control on the span editor        | `src/app/SpanEditModal.tsx` — never in one of the screens that open it                                                                    |
| A modal's save / cancel                 | `src/app/ModalHeader.tsx` — one top bar, never a row of buttons at the foot of the sheet                                                  |
| A new way to correct a time on Today    | `src/app/DayTimelineModal.tsx` (an edge) or `ArrivalModal.tsx` (the arrival), with the edit as a pure function in `actions.ts`            |
| A new screen                            | `src/app/<Name>Screen.tsx` + a tab in `src/app/BottomNav.tsx`, or a button in `src/app/TopBar.tsx` if it is an action rather than a place |
| A new setting                           | `src/app/useAppSettings.ts` (shape + clamping) + a `Section` in `SettingsScreen.tsx`                                                      |
| A new developer-only affordance         | `src/app/dev/`, revealed behind `settings.devMode` in `SettingsScreen.tsx`                                                                |
| A change to what the demo shows         | `src/app/dev/demoData.ts` (offsets from `today`, never fixed dates), with tests in `tests/demoData_test.ts`                               |
| A new storage backend                   | The framework, not here — this app only wires adapters up in `useSyncEngine.ts`                                                           |
| Any user-facing string                  | `src/app/i18n/en.ts`, never inline in a component                                                                                         |
| A shared UI primitive                   | The framework, if it is domain-free; `src/app/` only if it is time-report-specific                                                        |

## Test conventions

Tests live in `tests/` with a `_test` suffix (OSS_SPEC §20.2) and run under
Vitest in the `node` environment — they cover the pure domain modules
(`intervals`, `day`, `actions`, `report`, `monthChart`, `clock`, `format`,
`project`, `merge`, `migrations`, `demoData`, `shortcuts`), which is where the app's real
logic is. No
DOM, no testing-library, no mocked clock. `tests/fixtures/helpers.ts` holds the shared
fixtures (a project, a day, a named-id `ctx`).

Run one file with `npx vitest run tests/day_test.ts`.

A change to the derivation without a test that pins the new behaviour to real
times is not finished. UI changes should keep the boot smoke path working:
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

| If you change…                   | Update…                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| The derivation in `day.ts`       | `docs/day-model.md`, `docs/features/today.md`, and the README's Examples block if the output shape moved       |
| `report.ts` or `monthChart.ts`   | `docs/day-model.md` (the report section) and `docs/features/report.md`                                         |
| `actions.ts`                     | `docs/features/today.md` and `docs/features/log.md`                                                            |
| The `Project` or `WorkDay` shape | `docs/architecture.md`'s data shape, `docs/features/projects.md`, and a `migrations.ts` step                   |
| The sync engine or the merge     | `docs/sync.md`                                                                                                 |
| A `VITE_*` variable              | `docs/configuration.md`, `src/vite-env.d.ts`, the README's Configuration table, and the workflows that pass it |
| A screen's behaviour             | The matching `docs/features/*.md` and the README's Usage table                                                 |
| The navigation (nav or top bar)  | `docs/architecture.md`'s tree and the README's Usage tables                                                    |
| Module layout                    | The "Where new code goes" table above and `docs/architecture.md`                                               |
| A make target or script          | `CONTRIBUTING.md`, the README's Quick start, and this file's command list                                      |

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
  size, placement, movement — is shape, not colour. A dial option that tinted
  a button or a card would be the palette gallery this rule exists to refuse.
- **Four destinations, no sidebar, no drawer.** On the phone they are the
  bottom bar, in a fixed left-to-right order a swipe moves along; on the desk
  the same four, in the same order, are tabs on the top bar, and the bottom
  bar is not drawn. Things you do and then leave belong on the top bar, which
  is where Settings went — a screen on the phone, a side panel on the desk.
  A new _action_ is a top-bar button, not a tab.
- **The face is the switch.** Starting and stopping the day is a press on
  the dial, and nothing else on Today starts or stops it. A stretch of the
  ring opens the stretches; the line under the dial opens the arrival. Do
  not add a start button back.
- **No timer.** The day's progress is the bezel and the state is the light
  and the one line under the dial. A figure ticking up is the thing this
  screen was rid of.
- **A category's colour is one table.** `labels.ts` maps a kind of work to a
  hue by its position in the project's list; the clock's inner ring, the
  category chips and the report's donut all read it. Don't colour one of them
  another way.
- **No dependency creep.** The framework, Preact, a font, and workbox-window.
  A new runtime dependency needs a reason that the framework can't serve. The
  faces the app ships — Inter, JetBrains Mono (the wordmark), and the dial's
  eight (Source Serif, Jost, Oswald, Barlow, Playfair Display, Cinzel, plus
  the two above) — are `@fontsource` packages, imported in `main.tsx` a
  weight and a subset at a time, and bundled from this origin. A font is
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

| Skill             | Runs when                                                     |
| ----------------- | ------------------------------------------------------------- |
| `maintenance`     | The registry and run order for every other skill — start here |
| `write-changeset` | Any user-visible change, before opening the PR                |
| `update-docs`     | `src/app/` changed in a way a `docs/` topic describes         |
| `update-readme`   | Commands, configuration, or the feature set changed           |
