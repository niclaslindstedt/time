// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// What the phone app's Expo config and its EAS profiles promise the stores.
//
// The camera was there only to scan a storage server's pairing code, and the
// store build offers no server for now (the owner's decision), so the wrapper
// carries no camera at all: no plugin, no usage string naming the server, no
// Android permission. The version is the release's, and the submit profile
// names the Apple team.

import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const root = join(__dirname, "..");

type ExpoConfig = {
  version: string;
  plugins: unknown[];
  ios: { infoPlist: Record<string, unknown> };
  android: { permissions?: string[]; blockedPermissions?: string[] };
};

const config = (
  require("../native/app.config.js") as () => { expo: ExpoConfig }
)().expo;

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as Record<
    string,
    unknown
  >;
}

describe("the phone app's camera", () => {
  it("is not configured: no plugin, no usage string, no permission", () => {
    const plugins = config.plugins.map((p) => (Array.isArray(p) ? p[0] : p));
    expect(plugins).not.toContain("expo-camera");
    expect(config.ios.infoPlist).not.toHaveProperty("NSCameraUsageDescription");
    expect(config.android.permissions).toEqual([]);
    expect(JSON.stringify(config)).not.toMatch(/camera|storage server/i);
  });

  it("is not a dependency, and nothing in the wrapper imports one", () => {
    const pkg = json("native/package.json") as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies).not.toHaveProperty("expo-camera");
    const sources = [
      join(root, "native", "App.tsx"),
      ...readdirSync(join(root, "native", "src")).map((name) =>
        join(root, "native", "src", name),
      ),
    ];
    for (const file of sources) {
      expect(readFileSync(file, "utf8")).not.toMatch(/expo-camera|scan-qr/);
    }
  });
});

describe("the store build's identity", () => {
  it("takes its version from the release", () => {
    expect(config.version).toBe(
      (json("package.json") as { version: string }).version,
    );
  });

  it("declares no non-exempt encryption", () => {
    expect(config.ios.infoPlist.ITSAppUsesNonExemptEncryption).toBe(false);
  });

  it("submits under the Apple team, with no app id or Apple ID committed", () => {
    const submit = (
      json("native/eas.json") as {
        submit: { production: { ios: Record<string, string> } };
      }
    ).submit.production.ios;
    expect(submit).toEqual({ appleTeamId: "8Z7JSMA9SB" });
  });
});
