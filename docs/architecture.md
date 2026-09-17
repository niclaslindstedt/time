# Architecture

A frontend-only PWA. No server, no API, no build-time data source. Everything
below runs in the browser tab.

```
index.html
  └── src/main.tsx            mounts <App> inside the i18n LanguageRoot
       └── src/App.tsx        theme, store, sync, tab switch, chrome
            ├── TopBar            mark + wordmark, the desk's tabs, project switcher, sync glyph, cog
            ├── TodayScreen       the timer, the clock, the buttons — writes the day
            ├── LogScreen         the day as a list — corrects it
            ├── ReportScreen      a week or a month, as tiles and charts
            ├── ProjectsScreen   the projects, and the editor behind each
            ├── SettingsScreen    settings, sync controls, backup, about
            ├── SidePanel         Settings on the desk, over the right-hand edge
            └── BottomNav         the four destinations, on the phone

src/app/
  types.ts          the model: Project, WorkDay (sessions, breaks, activities)
  intervals.ts      union / intersect / subtract over stretches   (pure)
  day.ts            a day's spans → its totals, state, stretches  (pure, clock-free)
  actions.ts        the edits a day can take                       (pure, clock-free)
  report.ts         many days → totals, balance, breakdowns        (pure, clock-free)
  monthChart.ts     a month → week rows of day boxes, and their colour (pure, clock-free)
  project.ts       the template, working days, the day's target   (pure)
  clock.ts          the dial's layout, hands, arcs, the frame's path, the wind  (pure)
  look.ts           the theme, and the dial's faces, fonts, markers, presets
  format.ts         durations, timers, times of day
  labels.ts         domain value → label and colour
  merge.ts          two documents → one                            (pure)
  migrations.ts     bytes ⇄ AppData, with validation
  useDocStore.ts    the document in state, persisted to localStorage
  useSyncEngine.ts  the cloud copy: pull on open, debounced push on edit
  useAppSettings.ts the settings blob
  useNow.ts         the one place the clock is read
  useHands.ts       the hands: the movement's beat, and setting the watch
  useDesk.ts        whether the window is a desk (≥ 64rem) or a phone
  shortcuts.ts      key → command, and whether Enter saves a modal   (pure)
  useShortcuts.ts   the window's keydown, turned into those commands
  useModalSave.ts   Enter inside a modal's card, turned into its Save
  backup.ts         export / restore a JSON file
  Dial.tsx          the watch face, drawn, with the day's progress on the bezel — shared by Today and Settings
  ClockFace.tsx     the day on the dial, the switch, the light, and the way into the stretches
  DialPicker.tsx    the presets and the custom pickers in Settings
  MonthCalendar.tsx the month's rows and boxes, scaled into the plot
  DayGlance.tsx     the Log's header: the day on a dial, and its worked / break ring
  ModalHeader.tsx   a dialog's top bar: cancel, the title, save — and Enter / Escape
  DayTimelineModal.tsx  the day stretch by stretch; moves one edge at a time
  ArrivalModal.tsx  when you started, corrected from the timer
  NewKindModal.tsx  a kind of break or work, named on the spot
  SpanEditModal.tsx the one editor behind every span
  ProjectEditModal.tsx  name, working days, breaks, kinds of work
  dev/              the demo-data switch: an in-memory DocBackend
  i18n/             the catalog and the runtime
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
  workDays: Weekday[]; // 0 = Sunday … 6 = Saturday
  hoursPerDay: number;
  breakTypes: { id: string; name: string; defaultMinutes: number }[];
  categories: { id: string; name: string }[];
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
