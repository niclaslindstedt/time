# Sync

Cloud sync is optional and off by default. When it is on, the app keeps a copy
of its one document — `time.json` — in a folder of the user's own Dropbox or
Google Drive, and pulls that copy in when it opens.

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
revision checks; the engine is provider-agnostic past the two `create*` calls.

## The merge

Employers are keyed by id and days by `<date>:<employerId>`, and each carries
an `updatedAt` timestamp. Two copies merge record by record, the later edit
winning (`src/app/merge.ts`). Nobody is asked which side to keep: a day logged
on the phone and a break corrected on the laptop both survive.

**The known cost:** a deleted record is an absence, not a tombstone. A day
deleted on one device comes back from the other on the next sync, because the
deleting device has nothing to say about it. Days are added far more often
than they are deleted, so the trade is worth it — but delete on a device that
has already synced, or on both.

## What is sent

Exactly the document: employers and days, as JSON. No device identifier, no
settings, no logs. The same file is what **Settings → Download a backup**
writes, so it can be read with any text editor.

## Demo data

While the developer "Demo data" switch is on, the engine is paused entirely:
nothing is pulled and nothing is pushed, so two months of invented days can
never reach a connected account.
