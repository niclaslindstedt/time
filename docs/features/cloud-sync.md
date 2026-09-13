# Cloud sync

Off by default. Under **Settings → Cloud sync**, choose Dropbox or Google
Drive, grant access in the provider's own window, and the app keeps a copy of
its document — one JSON file, `time.json` — in a folder of your account. Both
providers appear only when the deploy was built with their client id (see
[`../configuration.md`](../configuration.md)).

Once connected, a glyph on the top bar shows the sync state; tapping it opens
the sync details with **Save now**, **Reload**, **Reconnect** and a connection
check. Every edit is pushed after a short pause; the copy is pulled in when
the app opens.

Two devices connected to the same account merge day by day, the later edit of
each winning, with one caveat about deletions — see [`../sync.md`](../sync.md).

**Disconnect** drops the credentials and nothing else: the document stays on
the device, and the copy in the cloud is left where it is.
