# Time

> A local-first time report PWA — start working, take your breaks, stop, and read your working hours back as a clock, a log and charts. No account, no server.

[![ci](https://github.com/niclaslindstedt/time/actions/workflows/ci.yml/badge.svg)](https://github.com/niclaslindstedt/time/actions/workflows/ci.yml)
[![seo](https://github.com/niclaslindstedt/time/actions/workflows/seo.yml/badge.svg)](https://github.com/niclaslindstedt/time/actions/workflows/seo.yml)
[![pages](https://github.com/niclaslindstedt/time/actions/workflows/pages.yml/badge.svg)](https://github.com/niclaslindstedt/time/actions/workflows/pages.yml)
[![license](https://img.shields.io/badge/license-PolyForm--Noncommercial--1.0.0-blue.svg)](LICENSE)

## What

**Time** is a time report that runs entirely in your browser. You press
the clock when you start working and press it again when you stop. In
between, a tap takes a break — lunch, coffee, a walk, whatever your project's
day allows for — and another tap says what kind of work you are doing. The
main screen is a wrist watch with the day drawn on it: time worked as a ring,
breaks marked on it, the kind of work in its colour, the day's share of its
target filling the bezel, and a light behind the case while you are working.

A break is written down with an end the moment you take it — the length that
kind of break usually takes — so you never have to remember to say you are
back. The guess is printed on the rim of the clock; tap it (or the clock) and
the day opens stretch by stretch, where moving the end of the lunch moves the
start of the work after it. Tap the timer to correct when you started. Every
one of those times is an estimate and the app says so: work is not timed to
the second anyway.

Forgot to set up the walk you take on Tuesdays? **Custom**, in the **···** at
the end of the break row, names one and starts it. That **···** is also where
the kinds the project has but does not show are kept, so a project can hold a
dozen of them without the screen holding a dozen buttons. Hold a pill you
already have — or press the right button on it — and the same sheet opens on
that kind, so its mark, its colour, its name and whether it is on this screen
at all are changed where they are worn. Everything else is corrected in the
**Log**, where every session, break and activity of any day is a row you can
edit or delete. The **Report** opens on two rings — the range's share of its
target, and its balance — over the week as a column per day, the hours filling
the target's track and carrying on past it on a long day, and the month as a
calendar of boxes — a row to the week, a box to the day, as wide as the hours
it worked — plus where the hours went by kind of work, what the breaks took,
and the running balance.

You set up an **project** — the working days, the length of a working day,
the break types with their default lengths and marks and how much of each
still counts as work, the kinds of work with their marks and colours. One project is the default and the app never asks
which; register a second and a switcher appears.

Nothing about a total is stored: the document holds projects and the spans of
each day, and every number is derived from them at read time, so a corrected
break moves every downstream figure.

The same app ships to the **App Store** and **Google Play** through a thin
native wrapper in [`native/`](native/README.md) — the whole web build packed
inside the download and served from the device, so it runs with no network at
all. On a phone that gains one thing a browser cannot: **iCloud**, as a third
option beside Dropbox and Google Drive, keeping the document in your own
container under Files → iCloud Drive → Time.

It is built on [`@niclaslindstedt/oss-framework`](https://github.com/niclaslindstedt/oss-framework),
the shared React/Preact surface behind the sibling
[contacts](https://github.com/niclaslindstedt/contacts) and
[period](https://github.com/niclaslindstedt/period) apps — same storage
adapters, same theme engine, same PWA update lifecycle.

## Why

- **It is your record.** When you were at work, for whom and doing what is a
  record about a named person. It lives in your browser's localStorage, and
  leaves the device only if you connect **your own** iCloud, Dropbox or Google
  Drive — to a folder you can open, in a JSON file you can read. No analytics, no
  telemetry, no third-party requests at runtime.
- **Two taps a day.** Enter, leave. Breaks and categories are one tap each,
  and anything you forgot can be added afterwards.
- **Honest numbers.** The timer, the log and the report read the same
  derivation, so they cannot disagree; a day that has not come yet is not a
  shortfall, and a Saturday of work is overtime.
- **Works offline, installs as an app.** A PWA with a self-updating service
  worker; the network is never on the critical path.

## Prerequisites

- Node.js ≥ 22 (CI pins 24 — see `.nvmrc`), npm ≥ 10
- A GitHub personal access token with `read:packages` in `~/.npmrc` — the
  `@niclaslindstedt/oss-framework` dependency resolves from GitHub Packages

## Install

```sh
npm config set //npm.pkg.github.com/:_authToken <your-token>
git clone https://github.com/niclaslindstedt/time.git
cd time
npm install
```

Or just open the hosted app at
[time.niclaslindstedt.se](https://time.niclaslindstedt.se/) and install it
from your browser's "Add to Home Screen" / install prompt — it is a PWA and
works fully offline.

## Quick start

```sh
npm run dev
```

Open the printed URL. The app opens on **Today**, which is the watch: press
the dial and the project form comes up — give it a name, keep or change the
Monday-to-Friday, eight-hour default and the default breaks, and save. Press
the face again and the day starts. Tap **Lunch** when you go (it books the
half hour; tap it again if you are back early), tap **Planning** when you sit
down to it, and press the face when you are done for the day. The **Log** has
the day as a list; the **Report** has the week.

To try the production build the way it deploys:

```sh
npm run build && npm run preview
```

The native wrapper is a separate project with its own dependencies — a root
`npm install` does not touch it:

```sh
make native-install      # install the wrapper's dependencies
make native-bundle       # build the web app into native/assets/webroot.zip
make native-typecheck
```

See [`native/README.md`](native/README.md) for running it on a device, and
[`native/RELEASING.md`](native/RELEASING.md) for a store build.

## Usage

Four places to be. On a phone held upright they are the bottom bar — swipe
left or right to move between them; laid on its side the same four go to the
top, two in each corner, leaving the height to the watch; on a desk (a window
1024px or wider) they are tabs on the top bar, Settings slides in over
the right-hand edge, and the keyboard reaches the day (`S` starts or stops,
`1`–`9` pick a kind of work, `,` opens Settings, `P` the projects; in a
dialog, `Enter` saves and `Escape` cancels):

| Tab          | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Today**    | Before there is a project the same watch stands there empty, and a press anywhere on it opens the project form; after that, a wrist watch's dial with time worked, breaks and kinds of work drawn on a track of their own just inside the bezel, the day's share of its target filling the bezel clockwise and overshooting in the flag colour past it, and a light behind the case that beats while you are working. The dial is printed the way a watch is — the name under twelve, the movement's word under it, and the Settings cog in a window above six where a date would be — so on a phone the watch is the top of the screen. The face — inside the dial's own minute ring — is the switch: press it to start working and again to stop. Round it, the buttons: one per break type in its own mark, one chip per kind of work in its own mark and colour — the ones the project shows, with a dashed **···** at the end of each row holding the rest and **Custom**, which names a kind you have not set up and marks it on the spot; holding one of those buttons — or the right button on it — opens that kind to change its mark, its colour, its name and whether it is shown here; on a desk, and on a phone laid on its side, they stand either side of the dial instead — which is what makes a phone propped up sideways a desk clock with the day's controls on it. Press anywhere outside the face — the ring, the rim, the day's track — or a break's end printed on the rim, to open the day stretch by stretch and move an end; press the line under the dial to correct when you started; that line also says when today's hours are done, given what the day holds and what its breaks count for — and a green dot marks that same moment on the day's track, ahead of the hours coloured in so far, until the day reaches it. Laid on its side and left alone, everything but the watch fades out and the first touch brings it back. Under a mouse, resting on the ring reads a stretch's name and times, and the right button opens everything the day can do. |
| **Log**      | Any day as a list — time worked, breaks, activities — under two rings: the day's stretches on a twelve-hour dial with the started and stopped hands, and the worked / break split beside it. Tap a row to edit its times or kind, or delete it; the **+** in a section's corner adds one after the fact; **…** beside the date deletes the day; page through the days with the arrows.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Report**   | A week or a month, opening on two rings: the range's share of its target, filling clockwise and overshooting in the flag colour past it, and its balance, red when short and green when ahead — each with its pair of figures under it, worked and target, balance and the running balance since your first day. Under them, the week as a column per day, where the target is the track and the hours worked fill it from the floor and carry on past the top when the day ran long; the month as a calendar of boxes, a row to the week and a box to the day; where the hours went by kind of work; break time by kind. **…** beside the range exports it as a PDF specification to send with an invoice — six built-in styles or one of your own, the hours at whatever grain you choose, optional rounding up to the next 5 to 60 minutes a day, and either a download or a print.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Projects** | One card per project: a pill per working day, weekends apart, and the day's length. Edit and delete are the two glyphs top right. The editor names the break types and kinds of work, says how much of each kind of break still counts as work — none of it, all of it, or the first so many minutes a day — stars the ones that get a button of their own on **Today** — and gives each a mark from its own vocabulary — the day's pauses for a break type, work's for a kind of work, and the neutral marks to both — with one of eight colours for a kind of work, which it then wears on the clock, on its chip and in the report. Add a project, and — once there are two — choose which is **in use**; the top bar then grows a switcher.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

…and one button for the screen you visit and leave — on the dial over Today, and on the top bar everywhere else:

| Button | What it does                                                                                                                                                                                                                                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **⚙**  | Settings: theme, the watch dial (nine presets or a custom face, markers, numerals, ring, hands, size and movement, each face with a backlight of its own), reflections on its metal as you tilt the device, week start, cloud sync (Dropbox, Google Drive, and iCloud in the app-store build), backup / restore / delete, developer tools, and the build. |

## Configuration

The app needs no configuration to run. Two build-time variables switch cloud
sync on; both are public OAuth client identifiers (the flows are PKCE, so there
is no secret to protect), and leaving either unset simply hides that provider:

| Variable                  | Effect                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `VITE_DROPBOX_APP_KEY`    | Enables the Dropbox backend.                                                                                       |
| `VITE_GOOGLE_CLIENT_ID`   | Enables the Google Drive backend.                                                                                  |
| `VITE_DROPBOX_APP_FOLDER` | Folder name the document is filed under (default `time`).                                                          |
| `VITE_GDRIVE_APP_FOLDER`  | Folder name in My Drive (default `time`).                                                                          |
| `VITE_BASE`               | Deploy base path (default `/`).                                                                                    |
| `VITE_EDITION`            | `store` for the App Store build, whose exported PDF specifications carry no notice. Default: the free web edition. |

iCloud takes no variable at all: it is offered by the native wrapper's host,
so it appears in the app-store build and nowhere else.

See [`docs/configuration.md`](docs/configuration.md) for the details.

## Examples

Build a day and read it back — the derivation is pure, so it runs anywhere, no
DOM required:

```ts
import { clockIn, clockOut, takeBreak } from "./src/app/actions.ts";
import { dayTotals } from "./src/app/day.ts";
import { blankDay, type Project } from "./src/app/types.ts";

const ctx = {
  id: () => crypto.randomUUID(),
  updatedAt: new Date().toISOString(),
};
const h = (hours: number, minutes = 0) => hours * 3600 + minutes * 60;

const project: Project = {
  id: "acme",
  name: "Acme",
  workDays: [1, 2, 3, 4, 5],
  hoursPerDay: 8,
  breakTypes: [{ id: "lunch", name: "Lunch", defaultMinutes: 30 }],
  categories: [],
  updatedAt: ctx.updatedAt,
};

let day = blankDay(project.id, "2026-03-02", ctx.updatedAt);
day = clockIn(day, h(8), ctx);
day = takeBreak(day, "lunch", h(12), 30 * 60, ctx); // ends at 12:30
day = clockOut(day, h(17), ctx);

dayTotals(day, project, h(23));
// → { presence: 32400, worked: 30600, breaks: { lunch: 1800 },
//     breakCredit: {}, state: "out", firstIn: 28800, lastOut: 61200, … }
```

The project comes in because a kind of break can say how much of one still
counts as work — none of it by default, which is why `breakCredit` is empty
and the nine hours present less the half-hour lunch are the eight and a half
worked.

Every number is a function of the day's spans and `now`, which is always
passed in — nothing here reads the clock. See
[`docs/day-model.md`](docs/day-model.md).

## Troubleshooting

| Symptom                                     | Fix                                                                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm install` fails with `401 Unauthorized` | The framework comes from GitHub Packages — see Prerequisites.                                                                |
| The break buttons are greyed out            | Breaks live inside time worked: press **Start working** first.                                                               |
| The balance looks too negative              | Every expected day since your first logged one counts; check **Projects** → working days, and the **Log** for gaps.          |
| A day's total looks wrong                   | Open it in the **Log**: the total is the sessions minus the breaks that come off the day, and each is a row you can correct. |
| Cloud sync shows "Reconnect needed"         | The provider's session lapsed. Tap the sync glyph → Reconnect.                                                               |

More in [`docs/troubleshooting.md`](docs/troubleshooting.md).

## Documentation

- [Getting started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [The day model](docs/day-model.md) — sessions, breaks, activities, and what they add up to
- [Sync](docs/sync.md)
- [The app on a phone](docs/features/native-app.md) — the native wrapper and iCloud
- [Troubleshooting](docs/troubleshooting.md)
- [`AGENTS.md`](AGENTS.md) — conventions for humans and coding agents

## Contributing

Bugs and feature requests go to
[Issues](https://github.com/niclaslindstedt/time/issues); open-ended
questions to [Discussions](https://github.com/niclaslindstedt/time/discussions).
See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow, and
[`SECURITY.md`](SECURITY.md) for private vulnerability reporting.

## License

[PolyForm Noncommercial 1.0.0](LICENSE) © Niclas Lindstedt.
