// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Dropbox is offered on the website and in the desktop app, and not at all in
// the phone app's store build (`VITE_EDITION=store`): not on the picker, not
// in the sentence over it, and not as a stored choice an earlier install left
// behind — that one reads as this device. The website and the desktop app go
// on offering it exactly when an app key is configured.

import { afterEach, describe, expect, it, vi } from "vitest";

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  const sync = await import("../src/app/useSyncEngine.ts");
  const { en } = await import("../src/app/i18n/en.ts");
  return { sync, en };
}

/** A device's localStorage holding one stored backend choice. */
function storedBackend(value: string): void {
  const items = new Map([["time:sync:backend", value]]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, next: string) => void items.set(key, next),
    removeItem: (key: string) => void items.delete(key),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the phone app's store build", () => {
  const STORE = { VITE_EDITION: "store", VITE_DROPBOX_APP_KEY: "key" };

  it("offers no Dropbox, even with an app key in its environment", async () => {
    const { sync } = await load(STORE);
    expect(sync.DROPBOX_APP_KEY).toBe("");
    expect(sync.AVAILABLE_BACKENDS).not.toContain("dropbox");
    // Nor a server, for now — see `server_offered_test.ts`.
    expect(sync.AVAILABLE_BACKENDS).toEqual(["local"]);
  });

  it("names no Dropbox over the picker", async () => {
    const { en } = await load(STORE);
    expect(en.settings.syncHint).not.toMatch(/dropbox/i);
    expect(en.settings.syncHintICloud).not.toMatch(/dropbox/i);
    expect(en.settings.syncHintICloud).toMatch(/iCloud/);
  });

  it("reads a Dropbox choice left by an earlier install as this device", async () => {
    const { sync } = await load(STORE);
    storedBackend("dropbox");
    expect(sync.readBackend()).toBe("local");
    storedBackend("icloud");
    expect(sync.readBackend()).toBe("icloud");
  });
});

describe("the website and the desktop app", () => {
  it("offer Dropbox when an app key is configured", async () => {
    const { sync, en } = await load({ VITE_DROPBOX_APP_KEY: "key" });
    expect(sync.DROPBOX_APP_KEY).toBe("key");
    expect(sync.AVAILABLE_BACKENDS).toEqual(["local", "dropbox", "selfhosted"]);
    expect(en.settings.syncHint).toMatch(/Dropbox/);
    storedBackend("dropbox");
    expect(sync.readBackend()).toBe("dropbox");
  });

  it("hide it, as before, when no key is configured", async () => {
    const { sync } = await load({ VITE_DROPBOX_APP_KEY: "" });
    expect(sync.AVAILABLE_BACKENDS).toEqual(["local", "selfhosted"]);
  });
});
