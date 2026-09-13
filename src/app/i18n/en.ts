// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The English catalog — the app's single source of user-facing copy, and (as
// the fallback language) the source of the compile-time message-key type. Add
// a string here first; `t()` won't type-check against a key this file doesn't
// carry.
//
// `{name}`-style placeholders interpolate at call time. Keep the surrounding
// sentence in the catalog rather than concatenating fragments at the call
// site: a translator needs the whole sentence to move its words around.

export const en = {
  app: {
    name: "Time",
    tagline: "Your working day, on your device",
  },

  nav: {
    today: "Today",
    log: "Log",
    report: "Report",
    employers: "Employers",
    settings: "Settings",
  },

  common: {
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    add: "Add",
    edit: "Edit",
    remove: "Remove",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    previous: "Previous",
    next: "Next",
    none: "None",
    uncategorised: "Uncategorised",
    employer: "Employer",
  },

  // The main screen: the clock, the timer, and the buttons that move the day
  // along. Every label here is read one-handed on the way in or out of a
  // room, so they are short.
  today: {
    noEmployer: "Add the employer you work for, and the clock is ready.",
    addEmployer: "Add employer",
    state: {
      out: "Not at work",
      working: "Working",
      break: "On a break",
    },
    since: "since {time}",
    breakSince: "{name} since {time}",
    breakUntil: "{name} until {time}",
    doneAt: "Left at {time}",
    clockIn: "Enter office",
    clockOut: "Leave office",
    endBreak: "End {name}",
    ofTarget: "of {target} today",
    dayOff: "A day off — every minute counts extra",
    balanceToday: "Today {balance}",
    balanceOverall: "Overall {balance}",
    breaks: "Breaks",
    breaksHint:
      "Tap one as you leave the desk — it is written down as the length it usually takes, and the clock is where you correct it.",
    breaksOutHint: "Enter the office first.",
    categories: "Working on",
    categoriesHint: "Tap what you are doing; tap again to stop labelling.",
    paused: "paused",
    pausedHint: "A break is on, so nothing is being counted towards this.",
    custom: "Custom",
    // Tapping the timer: the arrival is the one time of day that is wrong
    // most often, because the app is opened after the fact.
    arrival: "Correct when you got in",
    arrivalTitle: "When did you get in?",
    arrivalHint:
      "Moves the start of the stretch you are in. The timer, the day and the balance all follow.",
    arrivalWorked: "That makes {duration} worked so far.",
    arrivalEarlier: "{minutes} min earlier",
    arrivalLater: "{minutes} min later",
    // Creating a break type or a kind of work from the Today screen, without
    // going to the employer form for it.
    newBreak: "A kind of break",
    newBreakHint:
      "It joins this employer's breaks, and starts now. The minutes are how long one is assumed to take.",
    newCategory: "A kind of work",
    newCategoryHint:
      "It joins this employer's kinds of work, and you are doing it from now.",
    kindName: "Name",
    kindNamePlaceholder: "What to call it",
    kindMinutes: "Minutes",
    kindRequired: "Give it a name.",
    clockLabel: "Today on a twelve-hour clock",
    clockDesc:
      "Time at work is drawn as a ring around the dial, with breaks marked on it and the kind of work on an inner ring.",
    legend: {
      work: "At work",
      break: "Break",
    },
    openTimeline: "Open today's stretches",
    breakEndLabel: "{name} ended {time} — tap to change",
  },

  // The clock face's popup: the day as the stretches it is made of, with the
  // moment each one ended up for correction.
  timeline: {
    title: "Today, stretch by stretch",
    hint: "Change when a stretch ended and the next one starts there. None of this was timed to the second — it is the shape of the day, not a stopwatch.",
    empty: "Nothing logged yet today.",
    running: "still going",
    ends: "Ended",
    endOf: "When {name} ended",
    earlier: "Five minutes earlier",
    later: "Five minutes later",
    work: "At work",
    stuck: "That would leave no room for the stretch next to it.",
  },

  // The day as a list — what the clock drew, editable.
  log: {
    title: "Log",
    noEmployer: "Add an employer to start logging.",
    empty: "Nothing logged this day.",
    sessions: "At work",
    breaks: "Breaks",
    activities: "Working on",
    addSession: "Add time at work",
    addBreak: "Add a break",
    addActivity: "Add an activity",
    span: "{start} – {end}",
    running: "still running",
    unknownType: "Deleted type",
    worked: "Worked",
    breakTotal: "Breaks",
    firstIn: "In",
    lastOut: "Out",
    deleteDay: "Delete this day",
    deleteDayConfirm: "Delete this day?",
    deleteDayHint:
      "Everything logged for {day} is removed, and every total derived from it moves. This can't be undone.",
    saved: "Saved",
    deleted: "Deleted",
    edit: "Edit {kind}",
    add: "Add {kind}",
  },

  // The span editor, shared by the three lists.
  editor: {
    kind: {
      session: "time at work",
      break: "break",
      activity: "activity",
    },
    type: "Kind of break",
    category: "Kind of work",
    start: "Start",
    end: "End",
    running: "Still running",
    invalid: "The end has to come after the start.",
    tooManyOpen: "Something of this kind is already running.",
    delete: "Delete",
    deleteConfirm: "Delete this {kind}?",
  },

  report: {
    title: "Report",
    noEmployer: "Add an employer to see a report.",
    week: "Week",
    month: "Month",
    thisWeek: "This week",
    thisMonth: "This month",
    worked: "Worked",
    target: "Target",
    balance: "Balance",
    overall: "Overall balance",
    overallHint: "Since the first day you logged.",
    workedDays: "{count} of {expected} days",
    perDay: "Hours per day",
    perDayDesc:
      "Hours worked on each day of the range, next to the hours expected.",
    seriesWorked: "Worked",
    seriesTarget: "Target",
    categories: "Where the hours went",
    categoriesDesc: "Worked hours by kind of work over the range.",
    breaks: "Breaks",
    breaksDesc: "Break time by kind over the range.",
    empty: "No time logged in this range yet.",
    total: "Total",
  },

  employers: {
    title: "Employers",
    empty: "No employer yet. Add one and the clock is ready.",
    add: "Add employer",
    edit: "Edit employer",
    active: "In use",
    use: "Use",
    delete: "Delete",
    deleteConfirm: "Delete {name}?",
    deleteHint:
      "The employer and every day logged for it are removed. This can't be undone.",
    summaryDays: "{days}",
    summaryHours: "{hours} h a day",
    summaryBreaks: "{count} break types",
    summaryCategories: "{count} kinds of work",
    name: "Name",
    namePlaceholder: "Where you work",
    nameRequired: "Give the employer a name.",
    workDays: "Working days",
    workDaysHint: "The days a full day is expected. Any other day is extra.",
    hoursPerDay: "Hours per working day",
    breakTypes: "Break types",
    breakTypesHint:
      "One button each on the Today screen. The minutes are how long a break of that kind is assumed to take when you tap it — correct it on the clock afterwards.",
    breakName: "Name",
    breakMinutes: "Minutes",
    addBreakType: "Add a break type",
    categories: "Kinds of work",
    categoriesHint:
      "Optional labels for what you are doing, so the report can say where the hours went.",
    categoryName: "Name",
    addCategory: "Add a kind of work",
    saved: "Employer saved",
    deleted: "Employer deleted",
    // The names a new employer starts with. Stored in the document once
    // created, so renaming one here only affects employers made afterwards.
    defaults: {
      lunch: "Lunch",
      coffee: "Coffee",
      meetings: "Meetings",
      coding: "Coding",
      admin: "Admin",
    },
  },

  settings: {
    title: "Settings",
    appearance: "Appearance",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "Device",
    calendar: "Week",
    weekStart: "Week starts on",
    weekStartHint: "Decides which seven days the weekly report covers.",
    monday: "Monday",
    sunday: "Sunday",
    sync: "Cloud sync",
    syncHint:
      "Off by default. Connect your own Dropbox or Google Drive to keep a copy there and sync between devices.",
    backend: "Storage",
    connected: "Connected to {name}",
    localOnly: "Kept on this device only",
    saveNow: "Save now",
    reload: "Reload",
    disconnect: "Disconnect",
    data: "Your data",
    export: "Download a backup",
    exportHint: "A JSON file with every employer and every day.",
    import: "Restore a backup",
    importHint:
      "Merges the file into what is here — the newer copy of each day wins.",
    imported: "Restored {count} new days",
    importFailed: "That file is not a Time backup.",
    deleteAll: "Delete everything",
    deleteAllHint:
      "Removes every employer and day from this device. A connected cloud copy is not touched.",
    deleteAllConfirm: "Delete everything on this device?",
    deleted: "Everything deleted",
    developer: "Developer",
    devMode: "Developer mode",
    devModeHint: "Show demo data, the log panel and the document size.",
    demoData: "Demo data",
    demoDataHint:
      "Swap in two months of invented days for this session. Nothing on this device or in the cloud is touched; a reload restores your own.",
    demoDataOn: "Showing demo data",
    demoDataOff: "Back to your own data",
    captureLogs: "Capture console output",
    captureLogsHint: "Mirror console messages into the log panel below.",
    documentSize: "Document size",
    about: "About",
    version: "Version",
    build: "Build",
    privacy:
      "Time keeps your working hours on this device. Nothing is sent anywhere unless you connect your own cloud account, and then only there.",
  },

  sync: {
    syncedTo: "Synced to {name}",
  },

  update: {
    available: "A new version is ready",
    reload: "Reload",
  },
} as const;

export type Catalog = typeof en;
