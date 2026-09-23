# Configuration

The app runs with no configuration at all. What follows is what a _deploy_ can
set at build time, what a _user_ can set at runtime, and where the app keeps
its state.

## Build-time variables

Read by Vite at build time through `import.meta.env` (declared in
`src/vite-env.d.ts`). All optional.

| Variable                  | Effect                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_DROPBOX_APP_KEY`    | The Dropbox app key (a PKCE public client). Unset hides the Dropbox backend in Settings → Cloud sync.                                                                                                                                                                                                                                                                                     |
| `VITE_DROPBOX_APP_FOLDER` | The Dropbox app-folder name (`Apps/<name>/`), fixed by your Dropbox app's configuration. Default `time`.                                                                                                                                                                                                                                                                                  |
| `VITE_BASE`               | The deploy base path. `pages.yml` sets `/` for the release and `/preview/` for the rolling main build.                                                                                                                                                                                                                                                                                    |
| `VITE_PWA_IGNORE_PATHS`   | Sibling deploy paths the root service worker must disown (`/preview/`). Only the root release sets it.                                                                                                                                                                                                                                                                                    |
| `VITE_EDITION`            | Which build this is. `store` for the one sold in the App Store; anything else, including unset, is the free web edition, whose exported PDF specifications carry a notice on every page saying what made them (see `src/app/edition.ts` and [`features/report.md`](features/report.md)). There is no server to ask and no account to check, so the edition is the build that was shipped. |

Both OAuth identifiers are public by design: the flows are PKCE, so there is no
client secret anywhere in the pipeline.

## The native wrapper's variables

`native/` is a separate project with a build of its own; these are read there,
never by the web app. See
[`../native/.env.example`](../native/.env.example) and
[`../native/RELEASING.md`](../native/RELEASING.md).

| Variable               | Effect                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_TIME_URL` | Point the wrapper's WebView at a deployed slot instead of the copy bundled inside it. **Debugging only** — never a store build. |
| `EAS_PROJECT_ID`       | The EAS project a build runs under. `eas init` prints it but cannot write it into a dynamic config, so it is passed in.         |
| `EXPO_TOKEN`           | An Expo access token, so CI can drive EAS with no interactive login. A repository secret; treat it as a password.               |

## Runtime settings

Under the **⚙** on the top bar. Persisted per device in localStorage
(`time:settings`), never synced.

| Setting                | Values                               | Default |
| ---------------------- | ------------------------------------ | ------- |
| Theme                  | Light / Dark / Device                | Device  |
| Week starts on         | Monday / Sunday                      | Monday  |
| Project in use         | any project                          | first   |
| Developer mode         | on / off                             | off     |
| Capture console output | on / off (developer mode)            | off     |
| PDF style              | six styles / Custom                  | Studio  |
| PDF rounding           | none / 5 / 6 / 10 / 15 / 30 / 60 min | none    |
| PDF details            | Prepared by, Client, Reference, Note | empty   |

The last three are the export form's (**Report** → **…** → **Export to PDF**).
They are per device like everything else here: who you are is not a fact about
a project, and the next export starts where the last one left off.

The project in use is chosen from the **Projects** tab (or from the mark in
the top left corner once there are two). Everything about a project — its
mark and colour, working days, hours per day, break types, kinds of work — is
data in the document, not a setting, so it syncs and backs up with the days.

## Storage keys

| Key                        | Holds                                                       |
| -------------------------- | ----------------------------------------------------------- |
| `time:doc`                 | The document: projects and days (see `docs/day-model.md`)   |
| `time:doc:unreadable`      | A quarantined copy of a document this build could not parse |
| `time:settings`            | The runtime settings above                                  |
| `time:sync:backend`        | Which backend is active (`local`, `icloud`, `dropbox`)      |
| `time:sync:dropbox`        | Dropbox tokens                                              |
| `time:logs`                | The in-app log buffer                                       |
| `time:language`            | The language choice (English only today)                    |
| `oss:cache:<backend>:time` | The framework's offline cache of the cloud copy             |

iCloud has no key of its own beyond `time:sync:backend`: there is nothing to
store. The container belongs to the device's iCloud account, so choosing the
backend is the whole of connecting to it.
