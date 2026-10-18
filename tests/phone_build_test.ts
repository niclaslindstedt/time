// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The phone app's copy of the site, built for real as the store edition
// (`native/scripts/bundle-web.mjs`), and the website's beside it: the phone
// app's page names no other edition of itself, its About links to the full
// privacy policy on apps.agilator.se, and nothing in it asks for a scan.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const POLICY = "https://apps.agilator.se/time/privacy/";

type Built = { html: string; js: string };

// NODE_ENV and the test runner's own variables are dropped, so it is the
// build CI ships.
function build(env: Record<string, string>): Built {
  const out = mkdtempSync(join(tmpdir(), "time-phone-build-"));
  try {
    const base = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) =>
          key !== "NODE_ENV" &&
          !key.startsWith("VITEST") &&
          !key.startsWith("VITE_"),
      ),
    );
    execFileSync(
      process.execPath,
      [
        join(root, "node_modules", "vite", "bin", "vite.js"),
        "build",
        "--outDir",
        out,
        "--emptyOutDir",
        "--logLevel",
        "error",
      ],
      { cwd: root, env: { ...base, ...env }, stdio: "pipe" },
    );
    const js = readdirSync(out, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
      .map((entry) => readFileSync(join(entry.parentPath, entry.name), "utf8"))
      .join("\n");
    return { html: readFileSync(join(out, "index.html"), "utf8"), js };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

describe("the phone app's build", () => {
  let phone: Built;
  beforeAll(() => {
    phone = build({ VITE_EDITION: "store", VITE_SHELL_BUILD: "on" });
  }, 120_000);

  it("has a page that names no other edition", () => {
    expect(phone.html).not.toMatch(/<!--/);
    expect(phone.html).not.toMatch(/og:|twitter:/);
    expect(phone.html).not.toMatch(/\bPWA\b|Dropbox|website/i);
    expect(phone.html).toMatch(/<meta\s+name="description"/);
  });

  it("links to the full privacy policy", () => {
    expect(phone.js).toContain(POLICY);
  });

  it("carries no Dropbox sign-in and no scanner", () => {
    expect(phone.js).not.toContain("Dropbox is not configured");
    expect(phone.js).not.toMatch(/scan-qr|Point the camera/);
    expect(phone.js).not.toContain("browser's settings");
  });
});

describe("the website's build", () => {
  let web: Built;
  beforeAll(() => {
    web = build({});
  }, 120_000);

  it("keeps its own page and wording", () => {
    expect(web.html).toMatch(/\bPWA\b/);
    expect(web.html).toMatch(/og:title/);
    expect(web.js).toContain("browser's settings");
    expect(web.js).not.toContain(POLICY);
  });
});
