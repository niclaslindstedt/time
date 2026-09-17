# Troubleshooting

## Install and build

**`npm install` fails with `401 Unauthorized` for `@niclaslindstedt/oss-framework`.**
The package comes from GitHub Packages, which requires a token even for public
packages. Put one with the `read:packages` scope in `~/.npmrc`:
`//npm.pkg.github.com/:_authToken=<token>`. The project's own `.npmrc` only
maps the scope to the registry and carries no token.

**`make lint` fails on types from `react`.** The app runs on Preact;
`tsconfig.json`'s `paths` point `react` at `preact/compat`. Don't add
`@types/react` — see `AGENTS.md`.

## The numbers

**The break buttons are greyed out.** Breaks live inside time worked. Press
**Start working** first; a break logged outside a session counts for nothing
either way (see [`day-model.md`](day-model.md)).

**The timer did not stop when I took a break.** Only a break stops it; a kind
of work only labels the time. Tap the break type, not the category.

**A day's total looks wrong.** Open it in the **Log**. The total is the
sessions minus the breaks; each is a row with its times, and tapping one opens
the editor. A session nobody closed on a past day is read up to midnight.

**The overall balance is very negative.** It counts every expected working day
from the first day you logged, so a week of holiday without a logged day is a
week of shortfall. Adjust the project's working days for the weeks that
differ, or log the days off — a day with no time worked still counts as
logged.

**Today's target shows a day off.** The project's working days do not include
today's weekday. Edit the project under **Projects**.

**The percentage is over 100%.** That is overtime; the timer does not stop at
the target.

## Cloud sync

**"Reconnect needed".** The provider's session lapsed. Tap the sync glyph on
the top bar, then **Reconnect**.

**A deleted day came back.** The merge is per day, last edit wins, and a
deletion has no record to win with — the other device's copy is restored on
the next sync. Delete it on the other device too, or from a device that has
already synced the deletion. See [`sync.md`](sync.md).

**My hours are not on the other device.** Both devices must be connected to
the same account and the same provider, and the first device must have pushed
(the glyph reads "saved"). Tap the glyph → **Save now** on the first device,
then **Reload** on the second.

## Recovery

**The app opened empty after an update.** A document a newer build wrote can
be unreadable to an older one still cached by the service worker. The app
leaves the stored copy untouched and quarantines a copy under
`time:doc:unreadable`; reload once the update has applied and it comes back.
