// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import {
  DEFAULT_KINDS,
  breakTypeOf,
  clampHours,
  clampWeekHours,
  creditSeconds,
  dayHours,
  formatHoursField,
  hoursUnit,
  parseHours,
  switchHoursUnit,
  weekHours,
  withHours,
  isPinned,
  projectTemplate,
  isWorkDay,
  storedCredit,
  storedPinned,
  suggestedGlyph,
  targetSeconds,
  weekdayOf,
} from "../src/app/project.ts";
import { allowsGlyph } from "../src/app/kinds.ts";
import { project } from "./fixtures/helpers.ts";

const labels = {
  lunch: "Lunch",
  coffee: "Coffee",
  toilet: "Toilet",
  training: "Training",
  healthcare: "Healthcare",
  meetings: "Meetings",
  planning: "Planning",
  retro: "Retro",
  admin: "Admin",
};

describe("projectTemplate", () => {
  it("gives every default break and kind of work a mark of its own", () => {
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    expect(e.breakTypes.map((b) => b.glyph)).toEqual([
      "meal",
      "coffee",
      "exercise",
      "health",
    ]);
    expect(e.categories.map((c) => c.glyph)).toEqual([
      "meeting",
      "planning",
      "review",
      "admin",
    ]);
  });

  it("suggests a mark for a kind of its own that has none", () => {
    // A project written before there were marks: its kinds are the app's own
    // names, so they are given the app's own marks.
    expect(suggestedGlyph("Lunch", "break", labels)).toBe("meal");
    expect(suggestedGlyph("Toilet", "break", labels)).toBe("toilet");
    expect(suggestedGlyph("Retro", "category", labels)).toBe("review");
    // However it was cased, and whatever space is round it.
    expect(suggestedGlyph("  admin  ", "category", labels)).toBe("admin");
  });

  it("suggests nothing for a name it never suggested, or the wrong sort", () => {
    expect(suggestedGlyph("Coding", "category", labels)).toBeUndefined();
    expect(suggestedGlyph("", "break", labels)).toBeUndefined();
    // The two vocabularies stay apart: a break called "Meetings" is not given
    // the kind of work's mark, and a kind of work called "Lunch" is not given
    // the break's.
    expect(suggestedGlyph("Meetings", "break", labels)).toBeUndefined();
    expect(suggestedGlyph("Lunch", "category", labels)).toBeUndefined();
  });

  it("suggests the same mark the template stamps in", () => {
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    for (const b of e.breakTypes) {
      expect(suggestedGlyph(b.name, "break", labels), b.name).toBe(b.glyph);
    }
    for (const c of e.categories) {
      expect(suggestedGlyph(c.name, "category", labels), c.name).toBe(c.glyph);
    }
  });

  it("marks each of them from its own vocabulary", () => {
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    for (const b of e.breakTypes)
      expect(allowsGlyph("break", b.glyph)).toBe(true);
    for (const c of e.categories) {
      expect(allowsGlyph("category", c.glyph)).toBe(true);
    }
    // …and the table they come from says the same, entry by entry.
    for (const [key, kind] of Object.entries(DEFAULT_KINDS)) {
      expect(allowsGlyph(kind.sort, kind.glyph), key).toBe(true);
    }
  });

  it("picks no colours, so the four take the hues their order gives them", () => {
    // A new project looks exactly as one always did until someone chooses
    // otherwise — the colour is stored only when it is picked.
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    expect(e.categories.every((c) => c.color === undefined)).toBe(true);
  });

  it("builds a Monday-to-Friday, eight-hour project with the default breaks", () => {
    let n = 0;
    const e = projectTemplate("Acme", labels, () => `id${++n}`, "now");
    expect(e.name).toBe("Acme");
    expect(e.workDays).toEqual([1, 2, 3, 4, 5]);
    expect(e.hoursPerDay).toBe(8);
    expect(e.breakTypes.map((b) => [b.name, b.defaultMinutes])).toEqual([
      ["Lunch", 30],
      ["Coffee", 15],
      ["Training", 60],
      ["Healthcare", 60],
    ]);
    expect(e.categories.map((c) => c.name)).toEqual([
      "Meetings",
      "Planning",
      "Retro",
      "Admin",
    ]);
    // Every id is distinct.
    const ids = [
      e.id,
      ...e.breakTypes.map((b) => b.id),
      ...e.categories.map((c) => c.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("work days", () => {
  it("knows a weekday from a date", () => {
    expect(weekdayOf("2026-03-02")).toBe(1);
    expect(weekdayOf("2026-03-08")).toBe(0);
  });

  it("expects work on the project's days only", () => {
    expect(isWorkDay(project(), "2026-03-02")).toBe(true);
    expect(isWorkDay(project(), "2026-03-07")).toBe(false);
    expect(isWorkDay(project({ workDays: [6] }), "2026-03-07")).toBe(true);
  });

  it("targets the day length in seconds", () => {
    expect(targetSeconds(project())).toBe(8 * 3600);
    expect(targetSeconds(project({ hoursPerDay: 7.5 }))).toBe(27_000);
  });
});

describe("lookups and clamps", () => {
  it("finds a break type or answers null", () => {
    expect(breakTypeOf(project(), "lunch")?.name).toBe("Lunch");
    expect(breakTypeOf(project(), "gone")).toBeNull();
  });

  it("clamps hours into range", () => {
    expect(clampHours("abc")).toBe(8);
    expect(clampHours(0)).toBe(0.5);
    expect(clampHours(40)).toBe(16);
    expect(clampHours(7.5)).toBe(7.5);
  });

  it("reads a typed decimal comma, and an empty field as nothing", () => {
    // An empty field used to read as nought and clamp to half an hour.
    expect(clampHours("", 8)).toBe(8);
    expect(clampHours(null, 8)).toBe(8);
    expect(clampHours("7,5")).toBe(7.5);
    expect(clampHours(" 7.25 ")).toBe(7.25);
    expect(clampWeekHours("37,5")).toBe(37.5);
    expect(clampWeekHours(200)).toBe(112);
    expect(clampWeekHours("x")).toBe(40);
  });
});

describe("hours typed", () => {
  it("takes a point, a comma or hours and minutes", () => {
    expect(parseHours("7.5")).toBe(7.5);
    expect(parseHours("7,5")).toBe(7.5);
    expect(parseHours(",5")).toBe(0.5);
    expect(parseHours("8")).toBe(8);
    expect(parseHours("8.")).toBe(8);
    expect(parseHours("7:30")).toBe(7.5);
    expect(parseHours("37:45")).toBe(37.75);
    expect(parseHours(6.4)).toBe(6.4);
  });

  it("refuses what is not a number of hours", () => {
    for (const bad of [
      "",
      "  ",
      "abc",
      "7.5.1",
      "7,5,1",
      "7:75",
      "-3",
      "1e3",
    ]) {
      expect(parseHours(bad), bad).toBeNull();
    }
    expect(parseHours(Number.NaN)).toBeNull();
    expect(parseHours(undefined)).toBeNull();
  });

  it("shows at most two decimals and no trailing noughts", () => {
    expect(formatHoursField(7.5)).toBe("7.5");
    expect(formatHoursField(8)).toBe("8");
    expect(formatHoursField(40 / 3)).toBe("13.33");
  });
});

describe("hours per week", () => {
  it("is a day's hours unless the week was entered", () => {
    const p = project({ hoursPerDay: 7.5 });
    expect(hoursUnit(p)).toBe("day");
    expect(dayHours(p)).toBe(7.5);
    expect(weekHours(p)).toBe(37.5);
  });

  it("spreads a week evenly over the working days", () => {
    const p = withHours(project(), "week", "37,5");
    expect(hoursUnit(p)).toBe("week");
    expect(p.hoursPerWeek).toBe(37.5);
    expect(weekHours(p)).toBe(37.5);
    // Kept in step, so a build that reads only the day reads the same day.
    expect(p.hoursPerDay).toBe(7.5);
    expect(targetSeconds(p)).toBe(27_000);
    const four = withHours(project({ workDays: [1, 2, 3, 4] }), "week", 30);
    expect(dayHours(four)).toBe(7.5);
    expect(
      targetSeconds(project({ hoursPerWeek: 40, workDays: [1, 2, 3] })),
    ).toBe(48_000);
  });

  it("holds the week when the working days change", () => {
    const p = withHours(project(), "week", 40);
    const three = withHours({ ...p, workDays: [1, 2, 3] }, "week", 40);
    expect(weekHours(three)).toBe(40);
    expect(three.hoursPerDay).toBeCloseTo(40 / 3);
  });

  it("stands on the day's figure with no working day to spread over", () => {
    const p = project({ hoursPerDay: 6, hoursPerWeek: 40, workDays: [] });
    expect(dayHours(p)).toBe(6);
    expect(targetSeconds(p)).toBe(6 * 3600);
  });

  it("holds a week spread over too few days to the longest day", () => {
    const p = project({ hoursPerWeek: 40, workDays: [1] });
    expect(dayHours(p)).toBe(16);
  });

  it("switches between the two without changing the target", () => {
    const day = project({ hoursPerDay: 7.5 });
    const week = switchHoursUnit(day, "week");
    expect(week.hoursPerWeek).toBe(37.5);
    expect(targetSeconds(week)).toBe(targetSeconds(day));
    const back = switchHoursUnit(week, "day");
    expect(back.hoursPerWeek).toBeUndefined();
    expect("hoursPerWeek" in back).toBe(false);
    expect(back.hoursPerDay).toBe(7.5);
    expect(switchHoursUnit(day, "day")).toBe(day);
  });

  it("takes the day's hours as the week's when there are no working days", () => {
    const p = switchHoursUnit(
      project({ hoursPerDay: 8, workDays: [] }),
      "week",
    );
    expect(p.hoursPerWeek).toBe(8);
    expect(dayHours(p)).toBe(8);
  });

  it("drops the week when a day's hours are set", () => {
    const p = withHours(project({ hoursPerWeek: 40 }), "day", "6,5");
    expect(hoursUnit(p)).toBe("day");
    expect(p.hoursPerDay).toBe(6.5);
  });
});

describe("the template's own answers", () => {
  const made = () => {
    let n = 0;
    return projectTemplate("Acme", labels, () => `id${++n}`, "now");
  };
  it("counts no break as work, and stores that as nothing at all", () => {
    // Every break a new project starts with is one people actually disagree
    // about, so the app answers for none of them. Said from the list end, so
    // a break added to the template later cannot quietly start counting.
    expect(made().breakTypes.filter((b) => b.credit !== undefined)).toEqual([]);
    for (const b of made().breakTypes) {
      expect(creditSeconds(made(), b.id), b.name).toBe(0);
    }
  });

  it("shows lunch and coffee, and keeps the two long ones in the ···", () => {
    // Four breaks is more than a phone's row holds, and most days have
    // neither the gym nor the doctor in them.
    expect(
      made()
        .breakTypes.filter(isPinned)
        .map((b) => b.name),
    ).toEqual(["Lunch", "Coffee"]);
    expect(
      made()
        .breakTypes.filter((b) => !isPinned(b))
        .map((b) => b.name),
    ).toEqual(["Training", "Healthcare"]);
  });

  it("shows every kind of work it starts with", () => {
    expect(made().categories.every(isPinned)).toBe(true);
  });

  it("stores only the hidden ones, so the shown ones are the bytes they were", () => {
    // "Shown" is absent, the way "no credit" and "automatic colour" are: a
    // project nobody has hidden anything in must not grow a field.
    const pinnedFields = [...made().breakTypes, ...made().categories].map(
      (k) => k.pinned,
    );
    expect(pinnedFields).toEqual([
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("does not stamp a toilet break any more, but still knows the mark", () => {
    // It was the one break that counted as work, and five minutes is shorter
    // than the tap that logs it. The name is still the app's own, so a
    // document written when it was stamped keeps getting the right mark.
    expect(made().breakTypes.some((b) => b.name === "Toilet")).toBe(false);
    expect(suggestedGlyph("Toilet", "break", labels)).toBe("toilet");
  });
});

describe("isPinned and storedPinned", () => {
  it("reads an absent answer as shown", () => {
    // Every document written before there was a ··· shows the buttons it
    // always did.
    expect(isPinned({})).toBe(true);
    expect(isPinned({ pinned: true })).toBe(true);
    expect(isPinned({ pinned: false })).toBe(false);
  });

  it("writes nothing for shown, and the flag for hidden", () => {
    expect(storedPinned(true)).toEqual({});
    expect(storedPinned(false)).toEqual({ pinned: false });
  });

  it("round-trips either way", () => {
    for (const pinned of [true, false]) {
      expect(isPinned({ ...storedPinned(pinned) })).toBe(pinned);
    }
  });
});

describe("what a break counts for", () => {
  const acme = project({
    breakTypes: [
      { id: "lunch", name: "Lunch", defaultMinutes: 30 },
      {
        id: "coffee",
        name: "Coffee",
        defaultMinutes: 15,
        credit: { mode: "all" },
      },
      {
        id: "toilet",
        name: "Toilet",
        defaultMinutes: 5,
        credit: { mode: "partial", minutes: 20 },
      },
    ],
  });

  it("counts nothing of a kind nobody has answered for", () => {
    expect(creditSeconds(acme, "lunch")).toBe(0);
  });

  it("counts the whole of a kind that is counted in full", () => {
    expect(creditSeconds(acme, "coffee")).toBe(Infinity);
  });

  it("counts the stated minutes of a partial one", () => {
    expect(creditSeconds(acme, "toilet")).toBe(20 * 60);
  });

  it("counts nothing of a kind the project has lost", () => {
    expect(creditSeconds(acme, "gone")).toBe(0);
  });

  it("stores an answer of none as no answer at all", () => {
    // So a project that counts no break is byte for byte the document it was
    // before there was anything to answer.
    expect(storedCredit({ mode: "none" })).toEqual({});
    expect(storedCredit({ mode: "all" })).toEqual({ credit: { mode: "all" } });
    expect(storedCredit({ mode: "partial", minutes: 30 })).toEqual({
      credit: { mode: "partial", minutes: 30 },
    });
  });
});
