// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Which build this is.
//
// The app is given away on the web and sold in the App Store, and the one
// thing that differs is the notice a specification exported from the web build
// carries: what made the document, and where to buy the app that stops saying
// so. It is a *build* parameter rather than a setting or a flag in the
// document — there is no server to ask and no account to check, so the only
// honest place for it is the build that was shipped (see
// `docs/configuration.md`).
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
