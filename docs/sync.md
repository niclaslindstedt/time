# Sync

Cloud sync is optional and off by default. When it is on, the app keeps a copy
of its one document — `time.json` — in a folder of the user's own Dropbox,
iCloud, and pulls that copy in when it opens.

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

The framework's storage adapters (`createDropboxAdapter`,
`createGdriveAdapter`) own the provider APIs, the token refresh and the
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

## Demo data

While the developer "Demo data" switch is on, the engine is paused entirely:
nothing is pulled and nothing is pushed, so two months of invented days can
never reach a connected account.
