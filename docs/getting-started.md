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

1. The app opens on **Today** and asks for a project. Give it a name; the
   defaults are Monday to Friday, eight hours a day, four break types — a
   30-minute lunch and a 15-minute coffee on the screen, with an hour of
   training and an hour of healthcare waiting in the row's **···** — and four
   kinds of work. Change any of it, or come back to it later under
   **Projects**.
2. Press the clock. The light behind it comes up, and the clock begins
   drawing the day.
3. Tap a break — **Lunch**, say — when you go, and tap **End Lunch** when you
   are back. It runs until you do; the half hour a lunch usually takes is
   printed on the rim as when it is expected to be over. The light dims for as
   long as it runs. Forgot to end it? Tap the time on the rim and set when you
   came back.
4. Tap a kind of work when it changes. This only labels the time; it does not
   start or stop anything. While a break is on it says **paused**, because a
   break stops the counting.
5. Press the clock again when you are done for the day.

The lunch ran long? Its end is printed on the rim of the clock — tap it, or
the stretch on the ring, and the day opens stretch by stretch, where moving
one end starts the next stretch there. Tap the line under the clock to
correct when you started. A
kind of break or work nobody set up in advance is **Custom**, at the end of
either row. The **Log** tab shows the day as a list where every row can be
corrected one span at a time.

## Where the data lives

In your browser's localStorage, on this device. **Settings → Your data**
downloads a JSON backup or restores one. To keep a copy in your own Dropbox
or and to sync between devices, see
[`features/cloud-sync.md`](features/cloud-sync.md).
