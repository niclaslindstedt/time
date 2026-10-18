// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Which build this is.
//
// The app is given away on the web and sold in the App Store, and two things
// differ: the notice a specification exported from the web build carries
// (what made the document, and where to buy the app that stops saying so),
// and Dropbox, which the phone app's store build does not offer at all. Both are a
// *build* parameter rather than a setting or a flag in the document — there
// is no server to ask and no account to check, so the only honest place for
// them is the build that was shipped (see `docs/configuration.md`).
//
// Unset means the web edition, which is the safe way round: a build nobody
// configured is the free one.

export type Edition = "web" | "store";

/** The edition this build is. */
export const EDITION: Edition =
  import.meta.env.VITE_EDITION === "store" ? "store" : "web";

/** Whether an exported specification carries the notice. True everywhere but
 *  a build that was made for the App Store. */
export const EXPORT_NOTICE = EDITION === "web";

/** Whether this build offers Dropbox at all. The phone app's store build does
 *  not: it keeps the hours on the phone and in iCloud (no self-hosted server
 *  either, for now — see `useSyncEngine.ts`), and
 *  a constant here lets the bundler fold the Dropbox picker, its sign-in and
 *  its sentences out of that build rather than hide them at run time. The
 *  website and the desktop app (neither sets `VITE_EDITION=store`) keep it,
 *  still subject to an app key being configured (`useSyncEngine.ts`). */
export const DROPBOX_OFFERED = EDITION === "web";
