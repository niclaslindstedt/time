#!/usr/bin/env node
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
//
// Screenshots of the watch face, for iterating on its look.
//
// The dial is drawn from the day, the settings and the clock, and a change
// to how it draws is judged by eye — so this puts the production build in a
// headless browser, seeds a day in one of a few states, pins the clock to
// ten past ten (the time a watch is photographed at), and takes a picture of
// the dial for each combination asked for. Run it after `make build`, or
// through `make shots`, which builds first.
//
//   node scripts/dial-shots.mjs                          the default dial, working, phone, dark
//   node scripts/dial-shots.mjs --preset all             every preset
//   node scripts/dial-shots.mjs --preset uptown --state out,working,break,over
//   node scripts/dial-shots.mjs --dial '{"face":"black","ring":"chapter"}'
//   node scripts/dial-shots.mjs --shell phone,desk --theme dark,light
//   node scripts/dial-shots.mjs --preset abyss --settings
//
// Options (each list is comma-separated):
//   --preset  <ids|all>   a preset id from look.ts (default: the default preset)
//   --dial    <json>      a custom dial instead, as fields over the default preset
//   --state   <list>      out | working | break | over          (default: working)
//   --shell   <list>      phone | desk                          (default: phone)
//   --theme   <list>      dark | light                          (default: dark)
//   --size    <id>        small | medium | large                (default: large)
//   --backlight <json>    backlight fields over the default (colour, hz, intensity, spread)
//   --at      <HH:MM[:SS]> where the hands stand                (default: 10:09:36)
//                         the day is laid out back from it, so an "over" day
//                         at ten past ten started in the night — pass 18:30
//   --settings            a picture of Settings' dial section too, opened from the dial
//   --full                the whole screen rather than the dial and its light
//   --out     <dir>       where the pictures go                 (default: shots/)
//   --url     <url>       a running server to use               (default: http://localhost:4173/)
//   --browser <path>      a Chromium to run; otherwise Playwright's own
//
// Playwright is not a dependency of the app — nothing shipped needs it — so
// it is installed on demand and outside the lockfile:
//
//   npm install --no-save playwright && npx playwright install chromium
//
// A Chromium already on the machine is used instead with --browser or the
// PLAYWRIGHT_CHROMIUM variable; Claude Code on the web has one at
// /opt/pw-browsers/chromium, and the script looks there by itself.
//
// Nothing here reaches the network: the page is the local build, served by
// vite preview, which the script starts if nothing answers at --url.

import { existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

import {
  DEFAULT_BACKLIGHT,
  DEFAULT_DIAL_PRESET,
  DIAL_PRESET,
  DIAL_PRESETS,
} from "../src/app/look.ts";

const STATES = ["out", "working", "break", "over"];
const SHELLS = {
  phone: { width: 393, height: 852 },
  desk: { width: 1280, height: 800 },
};
const THEMES = ["dark", "light"];
const H = 3600;
const M = 60;

const args = parseArgs(process.argv.slice(2));
const url = args.url ?? "http://localhost:4173/";
const out = resolve(args.out ?? "shots");
const at = parseTime(args.at ?? "10:09:36");
const states = list(args.state, ["working"], STATES);
const shells = list(args.shell, ["phone"], Object.keys(SHELLS));
const themes = list(args.theme, ["dark"], THEMES);
const size = args.size ?? "large";
const backlight = { ...DEFAULT_BACKLIGHT, ...json(args.backlight) };

/** The dials to draw: presets by id, or one custom dial. */
const dials = args.dial
  ? [
      {
        name: "custom",
        preset: "custom",
        clock: { ...DIAL_PRESET[DEFAULT_DIAL_PRESET], ...json(args.dial) },
      },
    ]
  : list(args.preset, [DEFAULT_DIAL_PRESET], DIAL_PRESETS, "all").map((id) => ({
      name: id,
      preset: id,
      clock: DIAL_PRESET[id],
    }));

const { chromium } = await loadPlaywright();
const server = (await answers(url)) ? null : await startPreview(url);
mkdirSync(out, { recursive: true });

try {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  for (const dial of dials)
    for (const state of states)
      for (const shell of shells)
        for (const theme of themes) {
          const name = `${dial.name}-${state}-${shell}-${theme}`;
          const context = await browser.newContext({
            viewport: SHELLS[shell],
            deviceScaleFactor: 2,
            colorScheme: theme,
          });
          const page = await context.newPage();
          // The clock stands still, so a picture is the same picture twice
          // and the hands do not wind while it is taken.
          await page.clock.setFixedTime(dateAt(at));
          await page.addInitScript(seed, {
            at,
            today: dayKey(dateAt(at)),
            state,
            settings: {
              theme,
              clockPreset: dial.preset,
              clock: dial.clock,
              clockSize: size,
              backlight,
            },
          });
          await page.goto(url);
          // The fonts, and the light's fade-up. The callback runs in the page.
          // eslint-disable-next-line no-undef
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(900);
          await page.screenshot({
            path: `${out}/${name}.png`,
            clip: args.full ? undefined : await dialClip(page, SHELLS[shell]),
          });
          console.log(`${name}.png`);

          if (args.settings) {
            await page
              .getByRole("button", { name: "Settings" })
              .first()
              .click();
            // The pickers under Custom when there are any, else the cards.
            const movement = page.getByText("Movement", { exact: true });
            const anchor = (await movement.count())
              ? movement.first()
              : page.getByText("The clock", { exact: true }).first();
            await anchor.scrollIntoViewIfNeeded();
            await page.waitForTimeout(400);
            await page.screenshot({ path: `${out}/${name}-settings.png` });
            console.log(`${name}-settings.png`);
          }
          await context.close();
        }
  await browser.close();
} finally {
  server?.kill();
}

/** The day, the project and the settings a state is drawn from, written
 *  into localStorage before the app boots. Runs in the page. */
function seed({ at, today, state, settings }) {
  const stamp = new Date().toISOString();
  const span = (id, start, end, more = {}) => ({
    id,
    start: Math.max(0, start),
    end: end === null ? null : Math.max(0, end),
    ...more,
  });
  const project = {
    id: "p1",
    name: "Studio",
    workDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    breakTypes: [
      { id: "lunch", name: "Lunch", defaultMinutes: 30 },
      { id: "coffee", name: "Coffee", defaultMinutes: 15 },
      { id: "toilet", name: "Toilet", defaultMinutes: 5 },
    ],
    categories: [
      { id: "meetings", name: "Meetings" },
      { id: "coding", name: "Coding" },
    ],
    updatedAt: stamp,
  };
  // The morning, relative to where the hands stand.
  const days = {
    // Done for the day: a full day behind, the light off.
    out: {
      sessions: [span("s1", at - 8 * 3600, at - 30 * 60)],
      breaks: [span("b1", at - 4 * 3600, at - 3.5 * 3600, { typeId: "lunch" })],
      activities: [
        span("a1", at - 8 * 3600, at - 30 * 60, { categoryId: "coding" }),
      ],
    },
    // At work since a while, lunch had, a kind of work on.
    working: {
      sessions: [span("s1", at - 2.75 * 3600, null)],
      breaks: [span("b1", at - 1.5 * 3600, at - 3600, { typeId: "lunch" })],
      activities: [span("a1", at - 3600, null, { categoryId: "coding" })],
    },
    // The same, and a coffee that started five minutes ago with ten to go.
    break: {
      sessions: [span("s1", at - 2.75 * 3600, null)],
      breaks: [
        span("b1", at - 1.5 * 3600, at - 3600, { typeId: "lunch" }),
        span("b2", at - 5 * 60, at + 10 * 60, { typeId: "coffee" }),
      ],
      activities: [span("a1", at - 3600, null, { categoryId: "coding" })],
    },
    // A long day: past the target, so the bezel goes round again.
    over: {
      sessions: [span("s1", at - 9.5 * 3600, null)],
      breaks: [span("b1", at - 5 * 3600, at - 4.5 * 3600, { typeId: "lunch" })],
      activities: [
        span("a1", at - 9.5 * 3600, at - 5 * 3600, { categoryId: "meetings" }),
        span("a2", at - 4.5 * 3600, null, { categoryId: "coding" }),
      ],
    },
  };
  const day = {
    date: today,
    projectId: "p1",
    ...days[state],
    updatedAt: stamp,
  };
  localStorage.setItem(
    "time:doc",
    JSON.stringify({
      version: 2,
      projects: { p1: project },
      days: { [`${today}:p1`]: day },
    }),
  );
  localStorage.setItem("time:settings", JSON.stringify(settings));
}

/** The dial and the light round it, as a clip inside the viewport. */
async function dialClip(page, viewport) {
  const box = await page.locator('[data-area="dial"]').boundingBox();
  if (!box) return undefined;
  const pad = 24;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  return {
    x,
    y,
    width: Math.min(viewport.width - x, box.width + 2 * pad),
    height: Math.min(viewport.height - y, box.height + 2 * pad),
  };
}

// ── The machinery ──

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) fail(`unexpected argument: ${arg}`);
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (
      key === "settings" ||
      key === "full" ||
      next === undefined ||
      next.startsWith("--")
    ) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/** A comma-separated list, checked against what is on offer. */
function list(value, fallback, offered, all) {
  if (value === undefined || value === true) return fallback;
  if (all && value === all) return [...offered];
  const items = String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const item of items) {
    if (!offered.includes(item))
      fail(`unknown value "${item}"; one of ${offered.join(", ")}`);
  }
  return items;
}

function json(value) {
  if (value === undefined || value === true) return {};
  try {
    return JSON.parse(value);
  } catch {
    return fail(`not JSON: ${value}`);
  }
}

/** HH:MM[:SS] to seconds since midnight. */
function parseTime(text) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (!m) fail(`--at wants HH:MM or HH:MM:SS, not "${text}"`);
  return Number(m[1]) * H + Number(m[2]) * M + Number(m[3] ?? 0);
}

/** Today, at that many seconds past local midnight. */
function dateAt(seconds) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + seconds * 1000);
}

/** The document's key for a date: its local calendar day. */
function dayKey(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return fail(
      "playwright is not installed. It is not a dependency of the app, so install it outside the lockfile:\n" +
        "  npm install --no-save playwright && npx playwright install chromium",
    );
  }
}

/** A Chromium to run: the one named, the one Claude Code on the web keeps,
 *  or Playwright's own. */
function chromiumPath() {
  const named = args.browser ?? process.env.PLAYWRIGHT_CHROMIUM;
  if (named) return named;
  const web = "/opt/pw-browsers/chromium";
  return existsSync(web) ? web : undefined;
}

async function answers(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

/** `vite preview` on the port --url names, serving dist/. */
async function startPreview(url) {
  if (!existsSync(resolve("dist/index.html"))) {
    fail(
      `nothing answers at ${url} and there is no dist/ to serve — run \`make build\` first`,
    );
  }
  const port = new URL(url).port || "4173";
  const child = spawn(
    "npx",
    ["vite", "preview", "--port", port, "--strictPort"],
    {
      stdio: "ignore",
    },
  );
  for (let i = 0; i < 40; i++) {
    if (await answers(url)) return child;
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  return fail(`vite preview did not come up at ${url}`);
}

function fail(message) {
  console.error(message);
  process.exit(2);
}
