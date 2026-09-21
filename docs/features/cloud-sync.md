# Cloud sync

Off by default. Under **Settings → Cloud sync**, choose Dropbox or Google
Drive, grant access in the provider's own window, and the app keeps a copy of
its document — one JSON file, `time.json` — in a folder of your account. Both
providers appear only when the deploy was built with their client id (see
[`../configuration.md`](../configuration.md)).

**iCloud Drive** is offered too, in the App Store build and nowhere else: a
browser cannot reach a device's iCloud, so on the website the option is not
there at all. It has no window to grant anything in — the container belongs to
the iCloud account the phone is already signed into, so choosing it is the
whole of connecting. The file lands under **Files → iCloud Drive → Time**,
where you can open it and copy it out. See
[`native-app.md`](native-app.md).

Once connected, a glyph on the top bar shows the sync state; tapping it opens
the sync details with **Save now**, **Reload**, **Reconnect** and a connection
check. Every edit is pushed after a short pause; the copy is pulled in when
the app opens.

Two devices connected to the same account merge day by day, the later edit of
each winning, with one caveat about deletions — see [`../sync.md`](../sync.md).

**Disconnect** drops the credentials and nothing else: the document stays on
the device, and the copy in the cloud is left where it is. (iCloud has no
credentials to drop, so disconnecting it is simply choosing this device
again.)
