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
    projects: "Projects",
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
    uncategorised: "Uncategorised",
    project: "Project",
  },

  // The main screen: the clock, the timer, and the buttons that move the day
  // along. Every label here is read one-handed as the work starts or stops,
  // so they are short.
  today: {
    noProject: "Add the project you work on, and the clock is ready.",
    addProject: "Add project",
    state: {
      out: "Not working",
      working: "Working",
      break: "On a break",
    },
    since: "since {time}",
    breakSince: "{name} since {time}",
    breakUntil: "{name} until {time}",
    doneAt: "Stopped at {time}",
    clockIn: "Start working",
    clockOut: "Stop working",
    endBreak: "End {name}",
    percentOfTarget: "{percent} of today's target",
    // Just the fact. That every minute of a day off is time in hand is what
    // the app does with it, not something the line has to say.
    dayOff: "Day off",
    breaks: "Breaks",
    categories: "Working on",
    paused: "paused",
    pausedHint: "A break is on, so nothing is being counted towards this.",
    outHint: "Press the clock to start the day.",
    custom: "Custom",
    // Tapping the timer: the moment the work started is the one time of day
    // that is wrong most often, because the app is opened after the fact.
    arrival: "Correct when you started",
    arrivalTitle: "When did you start?",
    arrivalHint:
      "Moves the start of the stretch you are in. The timer, the day and the balance all follow.",
    arrivalWorked: "That makes {duration} worked so far.",
    arrivalEarlier: "{minutes} min earlier",
    arrivalLater: "{minutes} min later",
    // Creating a break type or a kind of work from the Today screen, without
    // going to the project form for it.
    newBreak: "A kind of break",
    newBreakHint:
      "It joins this project's breaks, and starts now. The minutes are how long one is assumed to take.",
    newCategory: "A kind of work",
    newCategoryHint:
      "It joins this project's kinds of work, and you are doing it from now.",
    // Holding a pill opens the kind it stands for, in the same form.
    holdToEdit: "Hold to edit",
    editKind: "Edit {name}",
    editBreakHint:
      "Its mark, its name, and how long one is assumed to take. Breaks already written down keep the times they have.",
    editCategoryHint:
      "Its mark, its colour and its name. Everything already logged under it follows the change.",
    kindName: "Name",
    kindNamePlaceholder: "What to call it",
    kindMinutes: "Minutes",
    kindRequired: "Give it a name.",
    // The movement's word on the dial, under the name: what a watch prints
    // on its face about what drives it.
    calibre: {
      quartz: "Quartz",
      mechanical: "Automatic",
      sweep: "Glide",
    },
    clockLabel: "Today on a twelve-hour clock",
    clockDesc:
      "Time worked is drawn as a ring around the dial, with breaks marked on it and the kind of work in its colour; the bezel fills as the day's target is worked. Press the face to start or stop working, or a stretch of the ring to correct it.",
    legend: {
      work: "Working",
      break: "Break",
    },
    openTimeline: "Open today's stretches",
    breakEndLabel: "{name} ended {time} — tap to change",
    // The desk. The dial answers a mouse: hovering a stretch of the ring
    // says what it was and when, and the right button opens the day's
    // actions where the pointer is.
    menuLabel: "The day",
    menuBreak: "{name} · {minutes} min",
    stopLabelling: "Stop labelling {name}",
    // The browser tab, while the app is open in one: the timer where the
    // page's name would be, so a glance at the tab strip is a glance at the
    // day.
    tabTitle: "{timer} {state} · {app}",
    tabBreak: "{name} until {time}",
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
    work: "Working",
    stuck: "That would leave no room for the stretch next to it.",
  },

  // The day as a list — what the clock drew, editable.
  log: {
    title: "Log",
    noProject: "Add a project to start logging.",
    empty: "Nothing logged this day.",
    sessions: "Working",
    breaks: "Breaks",
    activities: "Working on",
    addSession: "Add time worked",
    addBreak: "Add a break",
    addActivity: "Add an activity",
    span: "{start} – {end}",
    running: "still running",
    // The two rings above the lists. The dial is the day's shape — where it
    // started and where it stopped, on the twelve-hour clock — and the ring
    // beside it is how the stretch between them split.
    dialLabel: "The day on the clock",
    dialDesc: "Started at {start}, stopped at {end}.",
    splitLabel: "Worked and breaks",
    splitDesc: "{worked} worked and {breaks} of breaks.",
    dayMenu: "This day",
    unknownType: "Deleted type",
    worked: "Worked",
    breakTotal: "Breaks",
    firstIn: "Started",
    lastOut: "Stopped",
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
      session: "time worked",
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
    noProject: "Add a project to see a report.",
    week: "Week",
    month: "Month",
    thisWeek: "This week",
    thisMonth: "This month",
    worked: "Worked",
    target: "Target",
    balance: "Balance",
    overall: "Overall balance",
    overallShort: "Overall",
    overallHint: "Overall is since the first day you logged.",
    workedDays: "{count} of {expected} days",
    // The two rings over the charts — the Log's header, one screen up.
    shareLabel: "Worked against target",
    shareDesc: "{worked} worked of a target of {target}.",
    balanceLabel: "The balance, against the range's target",
    balanceDesc: "{balance} against a target of {target}.",
    perDay: "Hours per day",
    perDayDesc:
      "A column a day: the target is the track, the hours worked fill it from the floor up, and a day that ran long carries on past the top.",
    perWeek: "Hours per week",
    perWeekDesc:
      "A row per week and a box per day: a box is as wide as the day's hours, a row as tall as the week's, and the rows stack to the month's total. The dotted lines are the target — a working day's hours across, and what the month should have added up to down.",
    ofTarget: "of {target}",
    dayOff: "Day off",
    notThisMonth: "Not this month",
    weekRange: "{from} – {to}",
    scale: "Short of the day's target, on it, a fifth past.",
    seriesWorked: "Worked",
    seriesOver: "Over",
    seriesTarget: "Target",
    categories: "Where the hours went",
    categoriesDesc: "Worked hours by kind of work over the range.",
    breaks: "Breaks",
    breaksDesc: "Break time by kind over the range.",
    empty: "No time logged in this range yet.",
    total: "Total",
  },

  projects: {
    title: "Projects",
    empty: "No project yet. Add one and the clock is ready.",
    add: "Add project",
    edit: "Edit project",
    active: "In use",
    use: "Use",
    delete: "Delete",
    deleteConfirm: "Delete {name}?",
    deleteHint:
      "The project and every day logged for it are removed. This can't be undone.",
    summaryHours: "{hours} hour workday",
    summaryNoDays: "No working days",
    name: "Name",
    namePlaceholder: "What you are working on",
    nameRequired: "Give the project a name.",
    workDays: "Working days",
    workDaysHint: "The days a full day is expected. Any other day is extra.",
    hoursPerDay: "Hours per working day",
    breakTypes: "Break types",
    breakTypesHint:
      "One button each on the Today screen. The minutes are how long a break of that kind is assumed to take when you tap it — correct it on the clock afterwards. Tap a mark to change it.",
    breakName: "Name",
    breakMinutes: "Minutes",
    addBreakType: "Add a break type",
    categories: "Kinds of work",
    categoriesHint:
      "Optional labels for what you are doing, so the report can say where the hours went. Tap a mark to change it, or to pick the colour this kind of work is drawn in — on the clock, on its chip and in the report.",
    categoryName: "Name",
    addCategory: "Add a kind of work",
    saved: "Project saved",
    deleted: "Project deleted",
    // The names a new project starts with. Stored in the document once
    // created, so renaming one here only affects projects made afterwards.
    defaults: {
      lunch: "Lunch",
      coffee: "Coffee",
      toilet: "Toilet",
      meetings: "Meetings",
      planning: "Planning",
      retro: "Retro",
      admin: "Admin",
    },
  },

  // The marks a break type or a kind of work can wear, and the hues a kind of
  // work can be drawn in — the ids of `kinds.ts`, named. A name here is what
  // the picker's cell announces to a screen reader and shows on hover.
  kinds: {
    mark: "Mark",
    markOf: "Mark for {name}",
    colour: "Colour",
    colourAuto: "Automatic",
    group: {
      work: "Work",
      break: "Breaks",
      mark: "Marks",
    },
    glyph: {
      coding: "Code",
      terminal: "Terminal",
      debugging: "Bugs",
      laptop: "Computer",
      web: "Web",
      mobile: "Mobile",
      design: "Design",
      writing: "Writing",
      spreadsheet: "Spreadsheet",
      slides: "Slides",
      email: "Email",
      chat: "Chat",
      call: "Call",
      video: "Video call",
      meeting: "Meeting",
      planning: "Planning",
      tasks: "Tasks",
      review: "Review",
      research: "Research",
      learning: "Learning",
      database: "Database",
      server: "Servers",
      cloud: "Cloud",
      deploy: "Release",
      testing: "Testing",
      support: "Support",
      security: "Security",
      analytics: "Analytics",
      branch: "Branch",
      admin: "Admin",
      finance: "Finance",
      ideas: "Ideas",
      focus: "Focus",
      maintenance: "Maintenance",
      coffee: "Coffee",
      meal: "Meal",
      toilet: "Toilet",
      drop: "Drop",
      walk: "Walk",
      outside: "Outdoors",
      exercise: "Exercise",
      rest: "Rest",
      errand: "Errand",
      commute: "Travel",
      health: "Health",
      music: "Music",
      pause: "Pause",
      tag: "Label",
      star: "Star",
      flag: "Flag",
      pin: "Place",
      bolt: "Urgent",
      dot: "Dot",
    },
    palette: {
      blue: "Blue",
      ocean: "Ocean",
      violet: "Violet",
      amber: "Amber",
      red: "Red",
      mint: "Mint",
      rose: "Rose",
      slate: "Slate",
    },
  },

  settings: {
    title: "Settings",
    appearance: "Appearance",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "Device",
    clock: "The clock",
    clockHint:
      "The dial on Today, as a wrist watch. Each one comes with the light that suits it. Pick one of the presets, or Custom and put one together: the face, the markers, the numerals and their size, where they sit against the day's ring, what the ring is, what the hands are, how the second hand moves, and the light behind the case.",
    clockPreset: "Dial",
    clockCustom: "Custom",
    clockCustomHint: "Your own dial and its light, piece by piece.",
    // The nine presets, named for what they look like.
    preset: {
      snowfield: "Snowfield",
      abyss: "Abyss",
      trailhead: "Trailhead",
      summit: "Summit",
      boulevard: "Boulevard",
      studio: "Studio",
      tidewater: "Tidewater",
      harvest: "Harvest",
      uptown: "Uptown",
    },
    presetHint: {
      snowfield: "Textured silver, applied batons, a hand that glides.",
      abyss: "The diver: black, dots, a triangle at twelve.",
      trailhead: "The field watch: every hour numbered, tall and clear.",
      summit: "The expedition dial: 3, 6 and 9.",
      boulevard: "The dress watch: white, Roman numerals, a quiet tick.",
      studio: "Small geometric numerals at the rim, and nothing else.",
      tidewater: "Blue sunburst, tapered wedges.",
      harvest: "Champagne, numerals at the quarters in a serif.",
      uptown:
        "The sixties dress watch: silver blocks out to the ring, tapered steel hands, the day on a blue minute ring.",
    },
    clockFace: "Face",
    face: {
      white: "White",
      silver: "Silver",
      slate: "Slate",
      black: "Black",
      blue: "Blue",
      green: "Green",
      burgundy: "Burgundy",
      champagne: "Champagne",
    },
    clockMarkers: "Hour markers",
    markers: {
      batons: "Batons",
      blocks: "Blocks",
      dots: "Dots",
      numerals: "Numerals",
      roman: "Roman",
      quarters: "Quarters",
      threeSixNine: "3 · 6 · 9",
      wedges: "Wedges",
      ticks: "Ticks",
    },
    clockFont: "Numerals",
    font: {
      grotesque: "Grotesque",
      light: "Light",
      geometric: "Geometric",
      condensed: "Condensed",
      engineered: "Engineered",
      serif: "Serif",
      didone: "Didone",
      inscribed: "Inscribed",
      mono: "Mono",
    },
    clockScale: "Hour size",
    clockPlacement: "Markers sit",
    placement: {
      outside: "Outside the ring",
      over: "Over the ring",
      inside: "Inside the ring",
    },
    clockRing: "The day's ring",
    ring: {
      groove: "A groove",
      chapter: "Minute ring",
    },
    ringHint: {
      groove: "A faint track the day is drawn into.",
      chapter:
        "A blue ring printed with the minutes, which the day fills — work, breaks and kinds of work — with the minutes printed over them.",
    },
    clockHands: "Hands",
    hands: {
      bar: "Bars",
      tapered: "Tapered",
    },
    handsHint: {
      bar: "The same width from the cap to the tip, a half-round bar of steel.",
      tapered:
        "The tapered hands of a dress watch, broad where they leave the cap and narrowing to a point, with a ridge down each that takes the light on one side, and a plain hairline second hand.",
    },
    clockMovement: "Movement",
    movement: {
      quartz: "Quartz",
      mechanical: "Mechanical",
      sweep: "Glide",
    },
    movementHint: {
      quartz: "The second hand steps once a second.",
      mechanical:
        "Eight small steps a second, the way a mechanical calibre beats.",
      sweep: "The second hand glides round without a step.",
    },
    clockSize: "Size",
    clockSizeHint:
      "How much of the screen the dial takes: on a phone a share of the width, on a desk a share of the window's height — about half of it, most of it, or nearly all of it.",
    clockSizeSmall: "Small",
    clockSizeMedium: "Medium",
    clockSizeLarge: "Large",
    reflect: "Reflections",
    reflectHint:
      "Move the light on the dial's metal as you turn the device, the way a watch on your wrist catches it. Needs the motion sensors; the readings are used for the next frame and nothing else — they are never stored or sent.",
    reflectDenied:
      "The device did not allow access to its motion sensors, so the light stays where it is. You can allow it in the browser's settings for this site and try again.",
    // The light behind the dial.
    backlight: "Backlight",
    backlightHint:
      "A light behind the case while you are working, the way a television lights the wall behind it. It beats while the day is being counted, holds low on a break, and is off when you are not working.",
    backlightColor: "Colour",
    backlightColorName: {
      accent: "Theme",
      white: "White",
      amber: "Amber",
      green: "Green",
      teal: "Teal",
      blue: "Blue",
      violet: "Violet",
      rose: "Rose",
    },
    backlightBeat: "Beat",
    backlightSteady: "Steady",
    backlightHz: "{hz} Hz",
    backlightIntensity: "Brightness",
    backlightSpread: "Spread",
    backlightSpreadHint:
      "How far the light reaches past the case. Turn it down if the glow runs into the bars around a large dial.",
    backlightFaceHint:
      "Every face comes with a light of its own — warm behind the dark dials, quiet behind the pale ones. Picking a face above brings its light with it; change it here afterwards if you want another.",
    backlightOff: "Off",
    backlightPercent: "{percent}%",
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
    exportHint: "A JSON file with every project and every day.",
    import: "Restore a backup",
    importHint:
      "Merges the file into what is here — the newer copy of each day wins.",
    imported: "Restored {count} new days",
    importFailed: "That file is not a Time backup.",
    deleteAll: "Delete everything",
    deleteAllHint:
      "Removes every project and day from this device. A connected cloud copy is not touched.",
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
