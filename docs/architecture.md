# Architecture

A frontend-only PWA. No server, no API, no build-time data source. Everything
below runs in the browser tab.

```
index.html
  └── src/main.tsx            mounts <App> inside the i18n LanguageRoot
       └── src/App.tsx        theme, store, sync, tab switch, chrome
            ├── TopBar            the project's mark in the left corner, mark + wordmark, the desk's tabs, sync glyph, cog — the dial carries the wordmark and the cog over Today
            ├── ProjectPickerModal  the corner's mark, and the list of projects it opens
            ├── TodayScreen       the timer, the clock, the buttons — writes the day
            ├── LogScreen         the day as a list — corrects it
            ├── ReportScreen      a week or a month, as two rings and charts
            ├── ProjectsScreen   the projects, and the editor behind each
            ├── SettingsScreen    settings, sync controls, backup, about
            ├── SidePanel         Settings on the desk, over the right-hand edge
            └── BottomNav         the four destinations, on the phone — at the foot upright, split into the two top corners laid down

src/app/
  types.ts          the model: Project, WorkDay (sessions, breaks, activities)
  intervals.ts      union / intersect / subtract over stretches   (pure)
  day.ts            a day's spans → its totals, state, stretches, and when the day is done (pure, clock-free)
  actions.ts        the edits a day can take                       (pure, clock-free)
  report.ts         many days → totals, balance, breakdowns        (pure, clock-free)
  monthChart.ts     a month → week rows of day boxes, and their colour (pure, clock-free)
  dayBars.ts        a range → a bar a day: the target's track and the hours in it (pure, clock-free)
  spec.ts           a range → the specification an invoice is sent with: billed days, decimal hours (pure, clock-free)
  specStyle.ts      how a specification looks: typefaces, headings, colours, tables, the six styles
  specLayout.ts     a specification + a style → pages of type and rules      (pure, clock-free)
  specExport.ts     the file's name, the download, and the print
  pdf/              the two renderers over those pages
    metrics.ts        base-14 widths and the WinAnsi encoding             (pure)
    page.ts           a page as text, rectangles and rules                (pure)
    write.ts          those pages → the bytes of a PDF                    (pure)
    svg.ts            the same pages → SVG attributes, for preview and print
  project.ts       the template, working days, the day's target, what a break counts for (pure)
  kinds.ts          the marks a project or a kind wears, and their hues  (pure)
  clock.ts          the dial's layout, hands, arcs, the frame's path, the wind  (pure)
  look.ts           the theme, and the dial's faces, fonts, markers, rings, presets
  edition.ts        which build this is — the free web one, or the App Store's
  format.ts         durations, timers, times of day
  labels.ts         domain value → label and colour
  merge.ts          two documents → one                            (pure)
  migrations.ts     bytes ⇄ AppData, with validation
  useDocStore.ts    the document in state, persisted to localStorage
  useSyncEngine.ts  the cloud copy: pull on open, debounced push on edit
  useAppSettings.ts the settings blob
  useNow.ts         the one place the clock is read
  useHands.ts       the hands: the movement's beat, and setting the watch
  shape.ts          phone, stand or desk — the two edges the shell is cut at
  useShape.ts       the same, live: useDesk / useStand / useWide
  useFocus.ts       focus mode: the stand left alone, where everything but the watch fades out
  shortcuts.ts      key → command, and whether Enter saves a modal   (pure)
  useShortcuts.ts   the window's keydown, turned into those commands
  useModalSave.ts   a modal's Save: Enter, the press, and when it may look dead
  useLongPress.ts   a control held rather than tapped, and the right button
  backup.ts         export / restore a JSON file
  cloudHost.ts      the seam a host fills to offer a document store of its own (iCloud)
  Dial.tsx          the watch face, drawn, with the day's progress on the bezel and the printing — shared by Today and Settings
  ClockFace.tsx     the day on the dial, the switch, the cog, the light, and the way into the stretches
  DialPicker.tsx    the presets and the custom pickers in Settings
  MonthCalendar.tsx the month's rows and boxes, scaled into the plot
  DayBars.tsx       the range's day bars, scaled into the plot
  RangeGlance.tsx   the Report's header: the range's share of its target, and its balance
  SpecExportModal.tsx  the export form: the six style cards, the pieces, the details, the preview
  SpecPages.tsx     a specification's pages as SVG — the preview, and what the printer gets
  DayGlance.tsx     the Log's header: the day on a dial, and its worked / break ring
  KindPicker.tsx    a project's or a kind's mark, and its colour
  ModalHeader.tsx   a dialog's top bar: cancel, the title, save — and Enter / Escape
  DayTimelineModal.tsx  the day stretch by stretch; moves one edge at a time
  ArrivalModal.tsx  when you started, corrected from the timer
  KindModal.tsx     a kind of break or work — invented, or held open to correct
  BreakCreditField.tsx  how much of a kind of break counts as work — one control, both forms
  BreakMinutesField.tsx what a kind of break is assumed to take — one control, both forms
  SpanEditModal.tsx the one editor behind every span
  ProjectEditModal.tsx  name, mark, working days, breaks, kinds of work
  NoProject.tsx     the card a screen stands on before there is a project, and the form behind it
  ProjectPickerModal.tsx  the top bar's mark, and the list of projects it opens
  dev/              the demo-data switch: an in-memory DocBackend
  i18n/             the catalog and the runtime

native/             the thin Expo wrapper — a separate npm project (see below)
  App.tsx           a WebView over the bundled build, and nothing else
  src/local-server.ts   unpacks the packed build and serves it on a fixed loopback port
  src/injected.ts   the theme reporter, and the service-worker teardown
  src/icloudBridge.ts   the store host it installs into the page   (pure)
  src/icloud.ts     answers the page's store requests
  modules/icloud-store/ list / read / write / remove in the app's iCloud container
```

## The framework's share

[`@niclaslindstedt/oss-framework`](https://github.com/niclaslindstedt/oss-framework)
supplies the UI kit (modals, buttons, segmented controls, labelled fields, the
settings layout, the toast viewport), the bottom bar and the swipe that pages
it, the charts (`BarChart`, `DonutChart` and the series colour table), the
theme engine, the calendar helpers (`DayKey` arithmetic), the storage adapters
and the local cache around them, the migration runner, the i18n runtime, the
log store and viewer, and the PWA update state machine. The app imports only
published subpaths.

The renderer is **Preact** through `preact/compat`: the framework is built
against React, and `@preact/preset-vite` plus `tsconfig.json`'s `paths` alias
`react` onto Preact for the bundle and the type-checker alike.

## The native wrapper's share

`native/` ships the same web app to the App Store and Google Play. It is a
**separate npm project** — its own `package.json`, lockfile and
`node_modules`, reached with `--prefix native` — and it is thin on purpose: a
loopback HTTP server serving the packed web build, a `WebView` over it, and
one thing the browser cannot do, which is reach the device's **iCloud**.

Nothing in `src/` knows it exists. iCloud reaches the app the same way any
other capability would: `cloudHost.ts` looks for a document store on `window`
and the wrapper installs one, so the browser shows no native-shaped hole and a
second host would light the same backend up.

See [`features/native-app.md`](features/native-app.md) and
[`../native/README.md`](../native/README.md).

## The shape of the data

One document (`time:doc` in localStorage):

```ts
type AppData = {
  version: 2;
  projects: Record<string, Project>;
  days: Record<string, WorkDay>; // keyed "<YYYY-MM-DD>:<projectId>"
};

type Project = {
  id: string;
  name: string;
  glyph?: GlyphId; // its mark; absent takes the folder
  color?: CategoryColor; // its hue; absent takes the accent
  workDays: Weekday[]; // 0 = Sunday … 6 = Saturday
  hoursPerDay: number;
  breakTypes: {
    id: string;
    name: string;
    defaultMinutes: number;
    glyph?: GlyphId; // its mark; absent takes the cup
    // how much of one still counts as work; absent counts none of it
    credit?: { mode: "all" } | { mode: "partial"; minutes: number };
    pinned?: false; // in the Today row's "···"; absent is a button of its own
  }[];
  categories: {
    id: string;
    name: string;
    glyph?: GlyphId; // its mark; absent takes the label
    color?: CategoryColor; // its hue; absent takes its place in the list
    pinned?: false; // in the Today row's "···"; absent is a button of its own
  }[];
  updatedAt: string; // ISO — the merge tiebreak
};

type WorkDay = {
  date: string; // the local calendar day
  projectId: string;
  sessions: Span[]; // presence: at work on the project
  breaks: (Span & { typeId: string })[];
  activities: (Span & { categoryId: string })[];
  updatedAt: string;
};

type Span = { id: string; start: number; end: number | null };
// seconds since the day's local midnight; `end` null while running
```

Times are seconds since the day's **local** midnight, on purpose: a time
report is about the clock on the wall where the work happens, and a document
that changed meaning when a phone changed timezone would sync wrong between
two devices set differently. A span past midnight has an end past 86 400 and belongs to the
day it started on.

Nothing derived is stored. Totals, the state, the balance and the charts are
all recomputed from the spans on render — see [`day-model.md`](day-model.md).

## The document pipeline

Every read goes through `migrations.ts`: localStorage, the cloud copy, a
restored backup. `normalizeDoc` runs the framework's migrator (two steps so
far: stamping an unversioned document as v1, then v1 → v2, which renames
`employers` to `projects` and each day's `employerId` to `projectId` — ids are
untouched, so every day stays under the key it was filed under), then coerces
every project and day into the shape above, dropping what is not a span, a
name or a date.
`serializeDoc` writes keys in sorted order so equal documents are equal bytes,
which keeps cloud revisions from churning.

A document from a **newer** build is refused rather than emptied: the store
quarantines the bytes under `time:doc:unreadable` and boots empty without
writing over the stored copy, so the document comes back once the update
applies.

## The service worker

`pwa-plugin.ts` emits `sw.js`, `version.json`, `precache-manifest.json` and
the web manifest at build time — a "prompt to update" worker that precaches
the build, parks in `waiting`, and applies on the framework's `UpdateToast`.
Per deploy base (`/`, `/preview/`) the cache id (`src/app/pwa.ts`) and the
manifest identity differ, so the channels install as separate apps.
