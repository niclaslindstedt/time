# Sync

Cloud sync is optional and off by default. When it is on, the app keeps a copy
of its one document — `time.json` — in a folder of the user's own Dropbox,
iCloud or storage server, and pulls that copy in when it opens.

## The shape of it

The local document in localStorage is always the working copy. The sync engine
(`src/app/useSyncEngine.ts`) reads and writes _around_ the document store:

- **On open**, and whenever the backend changes, it pulls the cloud copy and
  merges it in (see below).
- **On edit**, it marks the document dirty and pushes it after a 1.2-second
  debounce, so a burst of taps on the Today screen is one request.
- **On conflict** — the cloud copy moved on since the last pull — it merges
  the cloud copy in and pushes again on the newer revision.
- **Offline**, it keeps working on the local copy and pushes when the network
  is back. The framework's `withLocalCache` keeps the last cloud copy readable
  offline too.

The framework's storage adapters (`createDropboxAdapter`, a self-hosted
namespace's `adapter()`) own the provider APIs, the token refresh and the
revision checks; the engine is provider-agnostic past the `create*` calls.

## iCloud, and the host that offers it

iCloud is the third backend and the only one with no OAuth: the container
belongs to the device's iCloud account, so connecting is choosing it.

It is also the only one the app cannot reach by itself. A browser has no way
into a device's iCloud, so the backend is offered by whichever **host** the
app happens to be running in: `src/app/cloudHost.ts` looks for a document
store on `window` and turns one into an ordinary `StorageAdapter` through the
framework's `createFileStoreAdapter`. Everything downstream — the debounce,
the revision check, the conflict, the merge — is the same code path Dropbox
and Drive take.

That seam is a question about **capability, not identity**. Nothing in `src/`
asks whether it is running inside the native wrapper; it asks whether a store
was offered. The App Store build's wrapper fills it in
(`native/src/icloudBridge.ts`), a browser does not, and the picker follows —
which is why `AVAILABLE_BACKENDS` is a reading on the engine (`available`)
rather than a module constant.

Three failures are kept apart, because the app says something different about
each: **signed out** of iCloud (the reader's to fix, in iOS Settings, so the
app offers to reconnect), **not downloaded yet** (another device wrote the
file and the bytes are still coming — treated as offline, so the local copy
stays in play and nothing is pushed over), and everything else, which is
shown and stopped on.

## Your own server

The fourth backend is a storage server the reader runs themselves —
[`storage-server`](https://github.com/niclaslindstedt/storage), at home or on a
host of their choosing — that stores only ciphertext. The framework's
self-hosted client (`@niclaslindstedt/oss-framework/storage`) encrypts on the
device; the server never sees the document, the file name or the key.

Where Dropbox has OAuth, this backend has **pairing**. A device is paired to
the server with a one-time code — a QR from the server's admin console, or
from another of the reader's devices under **Settings → Add a device** — and
its keys are kept in the device's key vault (non-extractable keys in
IndexedDB in a browser), never in localStorage and never on the server. The
decisions live in `src/app/selfHosted.ts` (pure, tested in
`tests/selfHosted_test.ts`); the lifecycle around them in
`src/app/useSelfHosted.ts`; the sheets in `SelfHostedConnectModal.tsx` and
`SelfHostedSettings.tsx`.

- **The account's first device** makes the account key and shows a
  **recovery key** once; the sheet stays open until the reader says it is
  stored. It is the only way back if every device is lost.
- **A code another device made** carries the account key sealed inside it, so
  that device is syncing the moment it pairs. A phone's camera opens the
  website straight from the QR (`https://…/#oss=…`); the code is wiped from
  the address bar as soon as it is read. The phone app scans it itself: its
  pairing sheet offers **Scan** where the shell advertises the framework's
  `scan-qr` capability (`canScanQrCode()`), and `scanPairing` in
  `selfHosted.ts` hands the code down the same path as a paste.
- **A code the server made**, for an account that already has keys, leaves
  the new device waiting: it shows a **safety code**, and a device that holds
  the keys approves it in Settings after checking the same code is shown
  there. Typing the recovery key instead works too.

The document goes to one namespace — the account's first `time` namespace, or
a new one on the account's first device — as one encrypted file, `time.json`,
through the namespace's `adapter()`: an ordinary `StorageAdapter`, so the
debounce, the revision check, the conflict and the merge below are the same
code path. It adds one thing the clouds do not: the server streams change
events, so another device's push is pulled in within a moment rather than on
the next open (`adapter.watch`).

Why a file and not the framework's row-level adapter: the rows would carry
the same records, but the union merge below would then resurrect a day
deleted on another device record by record. One file keeps the behaviour
identical to the other backends.

**Unreachable** (the server is off, or the phone is away from home without a
route to it) is kept apart from **signed out**: the device keeps its keys,
works on its local copy, and tries again when the network comes back and every
minute. A device revoked from another device or the console is signed out and
has to pair again. **Unpair this device** erases its keys; the hours on it and
the copy on the server are left alone.

## The merge

Projects are keyed by id and days by `<date>:<projectId>`, and each carries
an `updatedAt` timestamp. Two copies merge record by record, the later edit
winning (`src/app/merge.ts`). Nobody is asked which side to keep: a day logged
on the phone and a break corrected on the laptop both survive.

**The known cost:** a deleted record is an absence, not a tombstone. A day
deleted on one device comes back from the other on the next sync, because the
deleting device has nothing to say about it. Days are added far more often
than they are deleted, so the trade is worth it — but delete on a device that
has already synced, or on both.

## What is sent

Exactly the document: projects and days, as JSON. No device identifier, no
settings, no logs. The same file is what **Settings → Download a backup**
writes, so it can be read with any text editor.

On iCloud it is written into the container's `Documents` folder, which iCloud
publishes to the Files app — so the file holding somebody's hours is one they
can open, copy and delete.

To a storage server it is sent encrypted, with its name encrypted too. The
server learns the device's name as the reader typed it (for its device list),
the page's origin (for CORS), sizes and times — and nothing of the hours.

## Demo data

While the developer "Demo data" switch is on — or the build was made with
`VITE_SEED=demo` — the engine is paused entirely: nothing is pulled and
nothing is pushed, so the invented weeks can never reach a connected account.
The storage picker refuses to connect or disconnect a backend meanwhile,
since either would change the reader's real backend from a session that is
not theirs.
