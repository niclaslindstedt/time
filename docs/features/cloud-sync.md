# Cloud sync

Off by default. Under **Settings → Cloud sync**, choose Dropbox, grant access
in Dropbox's own window, and the app keeps a copy of its document — one JSON
file, `time.json` — in a folder of your account. Dropbox appears only when the
deploy was built with its app key (see
[`../configuration.md`](../configuration.md)).

**iCloud Drive** is offered too, in the App Store build and nowhere else: a
browser cannot reach a device's iCloud, so on the website the option is not
there at all. It has no window to grant anything in — the container belongs to
the iCloud account the phone is already signed into, so choosing it is the
whole of connecting. The file lands under **Files → iCloud Drive → Time**,
where you can open it and copy it out. See
[`native-app.md`](native-app.md).

**Your server** is the option for keeping the copy on a machine you run
yourself — a [storage server](https://github.com/niclaslindstedt/storage) at
home or on a host you choose. It is end-to-end encrypted: the server holds the
file but cannot read it, nor its name. Choosing it asks for a **pairing
code**; paste the one the server's admin console shows (or point the phone's
camera at its QR, which opens the app with the code in it). The first device
makes the account's key and shows a **recovery key** — write it down, it is
the only way back if every device is lost. Every other device is added from
one already connected, under **Settings → Add a device**: a QR that pairs the
new device with the keys in it. A device paired with a code from the console
instead shows a **safety code** and waits until a connected device approves
it under **Settings → Waiting for approval** (check the codes match), or until
you type the recovery key. Changes from another device arrive within moments,
without reopening the app. **Unpair this device** erases this device's keys;
**Make a new recovery key** retires the old one.

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
