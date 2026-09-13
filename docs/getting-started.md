# Getting started

Time is a local-first time report. There is nothing to sign up for and
nothing to install beyond the app itself.

## Use the hosted app

Open [time.niclaslindstedt.se](https://time.niclaslindstedt.se/). On a phone,
use the browser's **Add to Home Screen** / install prompt: the app then opens
full-screen like a native one and works with no network at all.

## Run it locally

```sh
npm config set //npm.pkg.github.com/:_authToken <your-token>
git clone https://github.com/niclaslindstedt/time.git
cd time
npm install
npm run dev
```

The token needs the `read:packages` scope — the
`@niclaslindstedt/oss-framework` dependency comes from GitHub Packages, which
requires authentication even for public packages.

## Your first day

1. The app opens on **Today** and asks for an employer. Give it a name; the
   defaults are Monday to Friday, eight hours a day, with a 30-minute lunch
   and a 15-minute coffee break as break types and three kinds of work. Change
   any of it, or come back to it later under **Employers**.
2. Press **Enter office**. The timer starts, and the clock begins drawing the
   day.
3. Tap a break — **Lunch**, say — when you go, and tap it again when you are
   back. The timer stops while the break runs.
4. Tap a kind of work when it changes. This only labels the time; it does not
   start or stop anything.
5. Press **Leave office** when you go home.

Forgot a break? **Add a break…** on Today has a one-tap "I just had lunch (30
min)" for each type, or set the exact times. The **Log** tab shows the day as
a list where every row can be corrected.

## Where the data lives

In your browser's localStorage, on this device. **Settings → Your data**
downloads a JSON backup or restores one. To keep a copy in your own Dropbox
or Google Drive, and to sync between devices, see
[`features/cloud-sync.md`](features/cloud-sync.md).
