# Time

> A local-first time report PWA — enter the office, take your breaks, leave, and read your working hours back as a clock, a log and charts. No account, no server.

[![ci](https://github.com/niclaslindstedt/time/actions/workflows/ci.yml/badge.svg)](https://github.com/niclaslindstedt/time/actions/workflows/ci.yml)
[![seo](https://github.com/niclaslindstedt/time/actions/workflows/seo.yml/badge.svg)](https://github.com/niclaslindstedt/time/actions/workflows/seo.yml)
[![pages](https://github.com/niclaslindstedt/time/actions/workflows/pages.yml/badge.svg)](https://github.com/niclaslindstedt/time/actions/workflows/pages.yml)
[![license](https://img.shields.io/badge/license-PolyForm--Noncommercial--1.0.0-blue.svg)](LICENSE)

## What

**Time** is a time report that runs entirely in your browser. You press one
button when you enter the office and the same button when you leave. In
between, a tap takes a break — lunch, coffee, a walk, whatever your employer's
day allows for — and another tap says what kind of work you are doing. The
main screen is a running timer with the share of the day's target beside it,
over a twelve-hour clock with the day drawn on: time at work as a ring, breaks
marked on it, the kind of work on an inner ring.

A break is written down with an end the moment you take it — the length that
kind of break usually takes — so you never have to remember to say you are
back. The guess is printed on the rim of the clock; tap it (or the clock) and
the day opens stretch by stretch, where moving the end of the lunch moves the
start of the work after it. Tap the timer to correct when you got in. Every
one of those times is an estimate and the app says so: work is not timed to
the second anyway.

Forgot to set up the walk you take on Tuesdays? **Custom**, at the end of the
break row, names one and starts it. Everything else is corrected in the
**Log**, where every session, break and activity of any day is a row you can
edit or delete. The **Report** shows the hours worked against the target per
day for a week or a month, where the hours went by kind of work, what the
breaks took, and the running balance.

You set up an **employer** — the working days, the length of a working day,
the break types with their default lengths, the kinds of work. One employer is
the default and the app never asks which; register a second and a switcher
appears.

Nothing about a total is stored: the document holds employers and the spans of
each day, and every number is derived from them at read time, so a corrected
break moves every downstream figure.

It is built on [`@niclaslindstedt/oss-framework`](https://github.com/niclaslindstedt/oss-framework),
the shared React/Preact surface behind the sibling
[contacts](https://github.com/niclaslindstedt/contacts) and
[period](https://github.com/niclaslindstedt/period) apps — same storage
adapters, same theme engine, same PWA update lifecycle.

## Why

- **It is your record.** When you were at work, for whom and doing what is a
  record about a named person. It lives in your browser's localStorage, and
  leaves the device only if you connect **your own** Dropbox or Google Drive —
  to a folder you can open, in a JSON file you can read. No analytics, no
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

Open the printed URL. The app opens on **Today** and asks for an employer:
give it a name, keep or change the Monday-to-Friday, eight-hour default and the
two default breaks, and save. Press **Enter office** and the timer starts. Tap
**Lunch** when you go (it books the half hour; tap it again if you are back
early), tap **Coding** when you sit down to it, and **Leave office** when you
go home. The **Log** has the day
as a list; the **Report** has the week.

To try the production build the way it deploys:

```sh
npm run build && npm run preview
```

## Usage

Four tabs, on a bottom bar — swipe left or right to move between them:

| Tab           | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Today**     | The running timer and the share of the day's target it is, a twelve-hour clock with time at work, breaks and kinds of work drawn on it, today's and the overall balance, and the buttons: **Enter / Leave office**, one per break type, one chip per kind of work, and **Custom** for a kind you have not set up. Tap the timer to correct when you got in; tap the clock, or a break's end printed on its rim, to open the day stretch by stretch and move an end. |
| **Log**       | Any day as a list — time at work, breaks, activities — with the day's first-in, last-out, worked and break totals. Tap a row to edit its times or kind, or delete it; add a session, a break or an activity after the fact; page through the days with the arrows.                                                                                                                                                                                                  |
| **Report**    | A week or a month: worked, target, balance and the running balance since your first day; hours worked against target per day; where the hours went by kind of work; break time by kind.                                                                                                                                                                                                                                                                             |
| **Employers** | One card per employer with its working days, day length, break types and kinds of work. Add, edit, delete, and — once there are two — choose which is **in use**; the top bar then grows a switcher.                                                                                                                                                                                                                                                                |

…and one button on the top bar, for the screen you visit and leave:

| Button | What it does                                                                                        |
| ------ | --------------------------------------------------------------------------------------------------- |
| **⚙**  | Settings: theme, week start, cloud sync, backup / restore / delete, developer tools, and the build. |

## Configuration

The app needs no configuration to run. Two build-time variables switch cloud
sync on; both are public OAuth client identifiers (the flows are PKCE, so there
is no secret to protect), and leaving either unset simply hides that provider:

| Variable                  | Effect                                                    |
| ------------------------- | --------------------------------------------------------- |
| `VITE_DROPBOX_APP_KEY`    | Enables the Dropbox backend.                              |
| `VITE_GOOGLE_CLIENT_ID`   | Enables the Google Drive backend.                         |
| `VITE_DROPBOX_APP_FOLDER` | Folder name the document is filed under (default `time`). |
| `VITE_GDRIVE_APP_FOLDER`  | Folder name in My Drive (default `time`).                 |
| `VITE_BASE`               | Deploy base path (default `/`).                           |

See [`docs/configuration.md`](docs/configuration.md) for the details.

## Examples

Build a day and read it back — the derivation is pure, so it runs anywhere, no
DOM required:

```ts
import { clockIn, clockOut, takeBreak } from "./src/app/actions.ts";
import { dayTotals } from "./src/app/day.ts";
import { blankDay } from "./src/app/types.ts";

const ctx = {
  id: () => crypto.randomUUID(),
  updatedAt: new Date().toISOString(),
};
const h = (hours: number, minutes = 0) => hours * 3600 + minutes * 60;

let day = blankDay("acme", "2026-03-02", ctx.updatedAt);
day = clockIn(day, h(8), ctx);
day = takeBreak(day, "lunch", h(12), 30 * 60, ctx); // ends at 12:30
day = clockOut(day, h(17), ctx);

dayTotals(day, h(23));
// → { presence: 32400, worked: 30600, breaks: { lunch: 1800 }, state: "out",
//     firstIn: 28800, lastOut: 61200, … }
```

Every number is a function of the day's spans and `now`, which is always
passed in — nothing here reads the clock. See
[`docs/day-model.md`](docs/day-model.md).

## Troubleshooting

| Symptom                                     | Fix                                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm install` fails with `401 Unauthorized` | The framework comes from GitHub Packages — see Prerequisites.                                                        |
| The break buttons are greyed out            | Breaks live inside time at work: press **Enter office** first.                                                       |
| The balance looks too negative              | Every expected day since your first logged one counts; check **Employers** → working days, and the **Log** for gaps. |
| A day's total looks wrong                   | Open it in the **Log**: the total is the sessions minus the breaks, and each is a row you can correct.               |
| Cloud sync shows "Reconnect needed"         | The provider's session lapsed. Tap the sync glyph → Reconnect.                                                       |

More in [`docs/troubleshooting.md`](docs/troubleshooting.md).

## Documentation

- [Getting started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [The day model](docs/day-model.md) — sessions, breaks, activities, and what they add up to
- [Sync](docs/sync.md)
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
