# Releasing the native app

Builds run on **EAS Build** (Expo's infrastructure), not on GitHub's runners
and not on a laptop. Everything below is a one-time setup followed by a
one-click dispatch.

> **License note.** The source is `PolyForm-Noncommercial-1.0.0`, which
> governs what others may do with it. The copyright holder is not bound by it
> and sells the App Store build: paid up front, with no in-app purchases and no
> ads.

## One-time setup

### 1. The Expo project

```sh
cd native
npx eas-cli login
npx eas-cli init          # prints the project id
```

`eas init` normally writes the id into `app.json` — this app uses a **dynamic**
config (`app.config.js`), which it cannot write to, so the id is passed in
instead:

- **CI**: set it as the repository **secret** `EAS_PROJECT_ID`
  (Settings → Secrets and variables → Actions → Secrets).
- **Locally**: `native/.env` (`cp .env.example .env`).

### 2. The CI token

Create a **robot** access token at
`https://expo.dev/accounts/<account>/settings/access-tokens` — a robot cannot
sign in to the dashboard and owns no projects, so its blast radius is bounded —
and set it as the repository **secret** `EXPO_TOKEN`.

### 3. Store credentials

EAS holds these on the project, not in this repo:

```sh
npx eas-cli credentials          # iOS signing + Android keystore
```

For submission, fill in the placeholders in `eas.json` →
`submit.production`:

| Field                       | Where it comes from                                                                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple ID (not committed)    | Asked for by `eas submit` when it signs in; never written into `eas.json`.                                                                                                                                                                                 |
| `ascAppId`                  | App Store Connect → the app → App Information → **Apple ID** (digits). Add it under `submit.production.ios` once the app record exists; until then the key is absent, not a placeholder — `eas submit` rejects placeholder values before it does anything. |
| `appleTeamId`               | developer.apple.com → Membership details → **Team ID** (10 characters). Committed under `submit.production.ios` (`8Z7JSMA9SB`); not a secret.                                                                                                              |
| `play-service-account.json` | Play Console → Setup → API access → a service account key. Gitignored; upload it to EAS with `eas credentials` rather than committing it.                                                                                                                  |

### 4. iOS capabilities

The app declares one iCloud container, `iCloud.se.agilator.time`.
Before the first store build, in the Apple Developer portal:

1. **Certificates, Identifiers & Profiles → Identifiers → iCloud Containers**
   — create the container with exactly that identifier.
2. **Identifiers → the app's App ID → iCloud** — enable the capability and
   tick that container.

An entitlement the App ID does not carry fails code signing, and — worse — a
container that signs but was never created resolves to nil at runtime: the app
builds, installs, launches, and reports iCloud as unavailable with nothing in
the log to say why.

### 5. Dropbox

Nothing to do: the phone app offers no Dropbox. Its bundle is the store
edition, which folds the backend out (`src/app/edition.ts`), and the native
workflow passes no Dropbox secrets to it (see
[README → Signing in to Dropbox](README.md#signing-in-to-dropbox)). The
website and the desktop app keep Dropbox, with their own redirect URIs
(`docs/configuration.md`).

## Cutting a build

Dispatch **Actions → native → Run workflow** and pick:

| Input      | Meaning                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `platform` | `ios` (the default), `android` or `all`.                                                                                               |
| `profile`  | `development` (dev client), `preview` (internal, APK + simulator), `testflight` (store-signed, still ours), `production` (what ships). |
| `submit`   | Also submit to the stores. Refused on anything but `production`.                                                                       |

The job builds the web app, packs it into `native/assets/webroot.zip`, and
queues the build on EAS with `--no-wait` — it exits immediately, so watch the
build itself at <https://expo.dev>.

The **marketing version** is the release's: `app.config.js` reads it from the
repo root's `package.json`, which the **Release** workflow bumps when it tags
`v<version>` — so cut the release first, then build from it, and the app and
the website never disagree about which release they are. Store **build
numbers** are auto-incremented by EAS (`appVersionSource: remote`); nothing is
bumped by hand.

EAS installs with the Node that `eas.json` pins — `"node"` in every build
profile, the same major as `.nvmrc`. Without it EAS falls back to its image's
default Node, whose npm 10 reads the lockfile npm 11 wrote as out of sync and
stops the build at `npm ci` ("Missing: typescript@5.9.3 from lock file"). Move
the pin when `.nvmrc` moves.

## The store listing

The listing's words and rules live in [`store/`](store/README.md). Its URLs:

- privacy policy: `https://apps.agilator.se/time/privacy/` (Settings → About
  links to it too)
- marketing: `https://apps.agilator.se/time/`
- support: `https://apps.agilator.se/time/support/`

The required screenshot sizes are the 6.9″ iPhone (1320×2868) and, since
`ios.supportsTablet` is true, the 13″ iPad (2064×2752); App Store Connect
scales each down to the smaller devices in its family. They are produced
outside this repository and staged into `store/screenshots/` by the listing
tooling — see [`store/README.md`](store/README.md#the-screenshots).

## Doing it from a laptop instead

```sh
cd native
npm ci
npm run build:preview        # internal build
npm run build:testflight     # store-signed, to TestFlight
npm run build:production     # what ships
npm run submit
```

Each of those bundles the web app first — the wrapper serves that copy, and a
build without it launches to a blank screen.

## Checklist before a store build

- [ ] `make lint && make test && make build` is green at the repo root.
- [ ] `make native-typecheck` is green.
- [ ] `EXPO_PUBLIC_TIME_URL` is **unset** — a build that streams the website
      is the exact shape App Store guideline 4.2 rejects.
- [ ] The version in the root `package.json` is the one you mean to ship.
- [ ] On a real device signed into iCloud: **Settings → Cloud sync → iCloud
      Drive**, log a day, and see `time.json` appear under **Files → iCloud
      Drive → Time**. Then sign out of iCloud and confirm the app says so
      rather than losing the day.
- [ ] **Settings → Cloud sync** offers This device and iCloud Drive, and no
      Dropbox or server — nor does any sentence on the screen name either.
- [ ] The app never asks for the camera: there is nothing in it to scan.
- [ ] Report → **…** → the specification's **Download PDF** opens the share
      sheet, and **Save to Files** writes
      `<project>_<period>_specification.pdf`; the same for the invoice file and
      **Settings → Download a backup**. Nothing opens Safari.
