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
| `VITE_GOOGLE_CLIENT_ID`   | The Google OAuth client id (GIS token client). Unset hides the Google Drive backend.                                                                                                                                                                                                                                                                                                      |
| `VITE_DROPBOX_APP_FOLDER` | The Dropbox app-folder name (`Apps/<name>/`), fixed by your Dropbox app's configuration. Default `time`.                                                                                                                                                                                                                                                                                  |
| `VITE_GDRIVE_APP_FOLDER`  | The folder created in My Drive to hold the synced document. Default `time`.                                                                                                                                                                                                                                                                                                               |
| `VITE_BASE`               | The deploy base path. `pages.yml` sets `/` for the release and `/preview/` for the rolling main build.                                                                                                                                                                                                                                                                                    |
| `VITE_PWA_IGNORE_PATHS`   | Sibling deploy paths the root service worker must disown (`/preview/`). Only the root release sets it.                                                                                                                                                                                                                                                                                    |
| `VITE_EDITION`            | Which build this is. `store` for the one sold in the App Store; anything else, including unset, is the free web edition, whose exported PDF specifications carry a notice on every page saying what made them (see `src/app/edition.ts` and [`features/report.md`](features/report.md)). There is no server to ask and no account to check, so the edition is the build that was shipped. |

Both OAuth identifiers are public by design: the flows are PKCE, so there is no
client secret anywhere in the pipeline.

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

The project in use is chosen from the **Projects** tab (or the top-bar
switcher once there are two). Everything about a project — working days,
hours per day, break types, kinds of work — is data in the document, not a
setting, so it syncs and backs up with the days.

## Storage keys

| Key                        | Holds                                                       |
| -------------------------- | ----------------------------------------------------------- |
| `time:doc`                 | The document: projects and days (see `docs/day-model.md`)   |
| `time:doc:unreadable`      | A quarantined copy of a document this build could not parse |
| `time:settings`            | The runtime settings above                                  |
| `time:sync:backend`        | Which backend is active (`local`, `dropbox`, `gdrive`)      |
| `time:sync:dropbox`        | Dropbox tokens                                              |
| `time:sync:gdrive`         | Google Drive token                                          |
| `time:logs`                | The in-app log buffer                                       |
| `time:language`            | The language choice (English only today)                    |
| `oss:cache:<backend>:time` | The framework's offline cache of the cloud copy             |
