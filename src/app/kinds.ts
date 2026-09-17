// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// What a kind of break or a kind of work *looks* like: the glyph it wears,
// and — for a kind of work — the colour it is drawn in.
//
// A project's break types and categories are the user's own words, and words
// in a list all look alike at a glance. A mark does not: the Today screen's
// pills, the Log's rows and the Report's legend are scanned rather than read,
// and a cup, a fork and a pair of brackets separate three rows faster than
// three labels do.
//
// Every option is an id and a spec, the way `look.ts` holds the dial's
// vocabulary: the project form offers the ids, the document stores one, the
// reader validates what comes back against this table, and a test walks it.
// Nothing here imports anything — it sits under the model, so `types.ts`,
// `project.ts`, `migrations.ts` and the screens can all read it.
//
// The glyphs are drawn on the same Lucide 24×24 grid at the same 2px stroke
// weight as `icons.tsx`, and painted in `currentColor`, so a kind's mark sits
// on the same line as the app's own icons and takes the colour of whatever it
// is put in — which is how a kind of work's colour reaches its glyph.

// ── The glyphs ──────────────────────────────────────────────────────────────

/** Which vocabulary a glyph belongs to. A break type and a kind of work may
 *  wear any of them — the grouping only decides what the picker offers first,
 *  because someone naming a break is usually after a cup and someone naming a
 *  kind of work is usually after a pair of brackets. */
export type GlyphGroup = "work" | "break" | "mark";

export const GLYPH_GROUPS: GlyphGroup[] = ["work", "break", "mark"];

/** A glyph: the vocabulary it belongs to, and the paths it is drawn from.
 *  Paths only — a circle is an arc pair — so the catalogue stays plain data a
 *  test can walk and the renderer stays one component. */
export type GlyphSpec = {
  group: GlyphGroup;
  d: readonly string[];
};

/**
 * The marks a kind of break or work can wear.
 *
 * The work vocabulary is deliberately weighted towards work done at a
 * computer — that is what this app is used for — but kept wide enough that a
 * support shift, a workshop, a bookkeeping afternoon or a day of drawings all
 * have something better than a dot. The break vocabulary is the day's pauses.
 * The marks at the end are the neutral ones, for anything the other two miss.
 */
export const GLYPH = {
  // ── Work ──
  /** Angle brackets — writing code. */
  coding: {
    group: "work",
    d: ["m8 16-4-4 4-4", "m16 8 4 4-4 4", "m14 4-4 16"],
  },
  /** A prompt and a caret — the shell. */
  terminal: { group: "work", d: ["m4 17 6-6-6-6", "M12 19h8"] },
  /** A beetle — chasing a fault. */
  debugging: {
    group: "work",
    d: [
      "m8 2 1.9 1.9",
      "M14.1 3.9 16 2",
      "M9 7.1v-1a3 3 0 1 1 6 0v1",
      "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6",
      "M12 20v-9",
      "M6.5 9C4.6 8.8 3 7.1 3 5",
      "M6 13H2",
      "M3 21c0-2.1 1.7-3.9 3.8-4",
      "M21 5c0 2.1-1.6 3.8-3.5 4",
      "M22 13h-4",
      "M17.2 17c2.1.1 3.8 1.9 3.8 4",
    ],
  },
  /** A screen on a desk — work at a computer, whatever it is. */
  laptop: { group: "work", d: ["M4 5h16v11H4z", "M2 20h20"] },
  /** A globe with meridians — the web. */
  web: {
    group: "work",
    d: [
      "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
      "M3.5 9h17",
      "M3.5 15h17",
      "M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18Z",
    ],
  },
  /** A handset — a phone, an app, the small screen. */
  mobile: {
    group: "work",
    d: [
      "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z",
      "M11 18.5h2",
    ],
  },
  /** A pen — design, drawing, the visual pass. */
  design: {
    group: "work",
    d: ["M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z", "m15 5 4 4"],
  },
  /** A page with lines — prose: a document, a spec, a post. */
  writing: {
    group: "work",
    d: [
      "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z",
      "M14 3v5h5",
      "M9 13h6",
      "M9 17h4",
    ],
  },
  /** A grid of cells — a sheet, a budget, a model. */
  spreadsheet: {
    group: "work",
    d: ["M4 4h16v16H4z", "M4 9.5h16", "M4 15h16", "M10 4v16"],
  },
  /** A screen on a stand — a deck, and giving one. */
  slides: {
    group: "work",
    d: ["M3 3h18", "M4 3v11h16V3", "M12 14v4", "m8 21 4-3 4 3"],
  },
  /** An envelope — the inbox. */
  email: { group: "work", d: ["M3 5h18v14H3z", "m3 7 9 6 9-6"] },
  /** A speech bubble — chat, and the answering of it. */
  chat: {
    group: "work",
    d: ["M21 14a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z"],
  },
  /** A handset — a call. */
  call: {
    group: "work",
    d: [
      "M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z",
    ],
  },
  /** A camera — the call with faces in it. */
  video: {
    group: "work",
    d: [
      "M3 7h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z",
      "m15 10 5-2.5a.7.7 0 0 1 1 .6v7.8a.7.7 0 0 1-1 .6L15 14Z",
    ],
  },
  /** Three figures — a meeting, a workshop, a pairing session. */
  meeting: {
    group: "work",
    d: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
      "M22 21v-2a4 4 0 0 0-3-3.9",
      "M16 3.2a4 4 0 0 1 0 7.6",
    ],
  },
  /** A calendar — planning, and the ceremonies on it. */
  planning: {
    group: "work",
    d: ["M8 2v4", "M16 2v4", "M4 5h16v16H4z", "M4 10h16"],
  },
  /** Ticks against lines — a list worked through. */
  tasks: {
    group: "work",
    d: [
      "m3 6 1.2 1.2L6.8 4.6",
      "m3 12 1.2 1.2L6.8 10.6",
      "m3 18 1.2 1.2L6.8 16.6",
      "M10 5.5h11",
      "M10 11.5h11",
      "M10 17.5h11",
    ],
  },
  /** A magnifier — a review, an audit, a read of someone else's work. */
  review: {
    group: "work",
    d: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z", "m16.4 16.4 4.6 4.6"],
  },
  /** An open book — reading up, and the long thinking that follows. */
  research: {
    group: "work",
    d: [
      "M12 7v14",
      "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z",
    ],
  },
  /** A mortar board — a course, a certification, teaching one. */
  learning: {
    group: "work",
    d: ["m22 9-10-5L2 9l10 5Z", "M6 11.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"],
  },
  /** Stacked discs — data, queries, the migration nobody enjoyed. */
  database: {
    group: "work",
    d: [
      "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z",
      "M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6",
      "M20 12c0 1.7-3.6 3-8 3s-8-1.3-8-3",
    ],
  },
  /** Two racked boxes — the machines, and keeping them up. */
  server: {
    group: "work",
    d: ["M4 4h16v6H4z", "M4 14h16v6H4z", "M8 7h.01", "M8 17h.01"],
  },
  /** A cloud — the platform, the account, the bill. */
  cloud: {
    group: "work",
    d: ["M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.7-1.3A4 4 0 0 0 6.5 19Z"],
  },
  /** A rocket — a release, and the shipping of it. */
  deploy: {
    group: "work",
    d: [
      "M12 2.5c3 2 5 6 5 10l-3 3h-4l-3-3c0-4 2-8 5-10Z",
      "M12 8.5h.01",
      "M9 15.5v5l3-2 3 2v-5",
    ],
  },
  /** A flask — tests, and the writing of them. */
  testing: {
    group: "work",
    d: [
      "M9 3h6",
      "M10 3v6.5L4.7 18a2 2 0 0 0 1.7 3h11.2a2 2 0 0 0 1.7-3L14 9.5V3",
      "M7.5 14h9",
    ],
  },
  /** A headset — support, the desk, the on-call shift. */
  support: {
    group: "work",
    d: [
      "M4 14v-2a8 8 0 0 1 16 0v2",
      "M4 14h2.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z",
      "M20 14h-2.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H19a1 1 0 0 0 1-1Z",
    ],
  },
  /** A shield — security work, and the reviews it brings. */
  security: {
    group: "work",
    d: ["M12 2 4 5v6.5c0 5 3.4 8.6 8 10.5 4.6-1.9 8-5.5 8-10.5V5Z"],
  },
  /** Bars — numbers, reporting, the look at how it went. */
  analytics: {
    group: "work",
    d: ["M3 21h18", "M7 21V11", "M12 21V4", "M17 21v-7"],
  },
  /** A branch — the repository work around the code itself. */
  branch: {
    group: "work",
    d: [
      "M6 2.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
      "M6 17.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
      "M18 6.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
      "M6 6.5v11",
      "M18 10.5a6 6 0 0 1-6 6H9",
    ],
  },
  /** A briefcase — admin, the paperwork, the things with forms. */
  admin: {
    group: "work",
    d: ["M4 7h16v13H4z", "M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", "M4 12h16"],
  },
  /** A currency mark — invoicing, bookkeeping, the money side. */
  finance: {
    group: "work",
    d: ["M12 2v20", "M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  },
  /** A lamp — the thinking-up part: ideas, architecture, a first sketch. */
  ideas: {
    group: "work",
    d: [
      "M9 19h6",
      "M10 22h4",
      "M12 2a7 7 0 0 0-4 12.8V17h8v-2.2A7 7 0 0 0 12 2Z",
    ],
  },
  /** A target — deep work, the hours with the door shut. */
  focus: {
    group: "work",
    d: [
      "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
      "M12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z",
    ],
  },
  /** A spanner — maintenance, upkeep, the chores of a codebase. */
  maintenance: {
    group: "work",
    d: [
      "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-8 8l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 8-8Z",
    ],
  },

  // ── Breaks ──
  /** A cup — the coffee break, and every break shaped like one. */
  coffee: {
    group: "break",
    d: [
      "M17 8h1a4 4 0 1 1 0 8h-1",
      "M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z",
      "M6 2v2",
      "M10 2v2",
      "M14 2v2",
    ],
  },
  /** A fork and a knife — lunch. */
  meal: {
    group: "break",
    d: [
      "M5 2v5a2 2 0 0 0 4 0V2",
      "M7 9v13",
      "M17 2c-1.1 0-2 2.2-2 5v6h4V7c0-2.8-.9-5-2-5Z",
      "M17 13v9",
    ],
  },
  /** A drop — the shortest trip of the day. */
  toilet: { group: "break", d: ["M12 2.7 6.6 8.1a7.6 7.6 0 1 0 10.8 0Z"] },
  /** A figure on its feet — the loop round the block. */
  walk: {
    group: "break",
    d: [
      "M12 3.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z",
      "M12 11v4",
      "m6 9 6 2 6-2",
      "m9 21 3-6 3 6",
    ],
  },
  /** The sun — the break taken outdoors. */
  outside: {
    group: "break",
    d: [
      "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
      "M12 2v2",
      "M12 20v2",
      "m4.9 4.9 1.4 1.4",
      "m17.7 17.7 1.4 1.4",
      "M2 12h2",
      "M20 12h2",
      "m6.3 17.7-1.4 1.4",
      "m19.1 4.9-1.4 1.4",
    ],
  },
  /** A dumbbell — the gym, the swim, the run at noon. */
  exercise: {
    group: "break",
    d: ["M7 12h10", "M6 8v8", "M18 8v8", "M3 10v4", "M21 10v4"],
  },
  /** A moon — the lie-down, the nap, the quiet half hour. */
  rest: {
    group: "break",
    d: ["M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"],
  },
  /** A bag — the errand run in the middle of the day. */
  errand: {
    group: "break",
    d: [
      "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",
      "M3 6h18",
      "M16 10a4 4 0 0 1-8 0",
    ],
  },
  /** A car — the drive between two places of work. */
  commute: {
    group: "break",
    d: [
      "M5 17H3.5a1 1 0 0 1-1-1v-3.5c0-.5.1-1 .4-1.4L5 7.5c.3-.5.9-.8 1.5-.8h11c.6 0 1.2.3 1.5.8l2.1 3.6c.3.4.4.9.4 1.4V16a1 1 0 0 1-1 1H19",
      "M2.9 12h18.2",
      "M9 17h6",
      "M7 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
      "M17 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
    ],
  },
  /** A heart — the appointment, the medicine, the body's own errand. */
  health: {
    group: "break",
    d: [
      "M12 20.5 4.2 12.9a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8Z",
    ],
  },
  /** A note — the listening kind of pause. */
  music: {
    group: "break",
    d: [
      "M9 18V5l11-2v13",
      "M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
      "M17 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    ],
  },
  /** Two bars in a ring — a pause with nothing else to say about it. */
  pause: {
    group: "break",
    d: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M10 9v6", "M14 9v6"],
  },

  // ── Marks ──
  /** A label — the default a kind of work starts with. */
  tag: {
    group: "mark",
    d: [
      "M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z",
      "M7 7h.01",
    ],
  },
  /** A star — the one that matters most. */
  star: {
    group: "mark",
    d: [
      "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z",
    ],
  },
  /** A flag — a thing marked to come back to. */
  flag: {
    group: "mark",
    d: [
      "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z",
      "M4 22v-7",
    ],
  },
  /** A pin — a place: the office, the site, the customer. */
  pin: {
    group: "mark",
    d: [
      "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z",
      "M12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
    ],
  },
  /** A bolt — the urgent thing that arrived without asking. */
  bolt: { group: "mark", d: ["M13 2 4 14h7l-1 8 9-12h-7Z"] },
  /** A ring — a mark that says nothing, for a kind that needs none. */
  dot: { group: "mark", d: ["M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"] },
} satisfies Record<string, GlyphSpec>;

/** Every glyph a kind may wear. */
export type GlyphId = keyof typeof GLYPH;

/** The ids, in catalogue order — work first, then breaks, then the neutral
 *  marks. The picker reorders them per kind; everything else reads this. */
export const GLYPH_IDS = Object.keys(GLYPH) as GlyphId[];

/** The ids of one vocabulary, in catalogue order. */
export function glyphsIn(group: GlyphGroup): GlyphId[] {
  return GLYPH_IDS.filter((id) => GLYPH[id].group === group);
}

/** Whether a stored value names a glyph this version knows. Unknown ids are
 *  dropped rather than kept, so a document written by a newer version does
 *  not leave a kind with a mark that cannot be drawn. */
export function isGlyphId(value: unknown): value is GlyphId {
  return typeof value === "string" && value in GLYPH;
}

/** The mark a break type wears when it has none of its own. */
export const DEFAULT_BREAK_GLYPH: GlyphId = "coffee";

/** The mark a kind of work wears when it has none of its own. */
export const DEFAULT_CATEGORY_GLYPH: GlyphId = "tag";

/** The glyph a stored value names, or the fallback. */
export function glyphOr(value: unknown, fallback: GlyphId): GlyphId {
  return isGlyphId(value) ? value : fallback;
}

// ── The colours ─────────────────────────────────────────────────────────────
// A kind of work is drawn in one hue everywhere it appears — the clock's inner
// ring, the chips, the Log's rows, the Report's donut — and now its glyph too.
// Until now that hue was purely positional; a project can set it per kind
// instead, and a kind with none set keeps the position it always had.
//
// The palette is the theme's own tokens rather than fixed hex, so a colour
// chosen on the light theme is still legible on the dark one — this is the
// app's two-themes rule, not the dial's face exception. The accent and the
// flag are deliberately absent: those two already mean "at work" and "break"
// on the clock's ring, and a kind of work wearing either would read as the
// ring's own colour rather than as a label over it.

export type CategoryColor =
  "blue" | "ocean" | "violet" | "amber" | "red" | "mint" | "rose" | "slate";

/** The palette the project form offers, in the order it shows them. */
export const CATEGORY_PALETTE: CategoryColor[] = [
  "blue",
  "ocean",
  "violet",
  "amber",
  "red",
  "mint",
  "rose",
  "slate",
];

/** Colour id → the theme token it is drawn from. */
export const CATEGORY_COLOR: Record<CategoryColor, string> = {
  blue: "var(--link)",
  ocean: "var(--path)",
  violet: "var(--pipe)",
  amber: "var(--meta)",
  red: "var(--danger)",
  mint: "var(--positive)",
  rose: "var(--negative)",
  slate: "var(--muted)",
};

/** The ramp a kind of work with no colour of its own takes, by its position
 *  in the project's list — the first four of the palette, which is the order
 *  categories have always been drawn in. */
export const AUTO_CATEGORY_COLORS: CategoryColor[] = CATEGORY_PALETTE.slice(
  0,
  4,
);

/** Whether a stored value names a colour this version knows. */
export function isCategoryColor(value: unknown): value is CategoryColor {
  return typeof value === "string" && value in CATEGORY_COLOR;
}
