// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Button,
  IconButton,
  LabeledInput,
  Modal,
  StarIcon,
  TrashIcon,
} from "@niclaslindstedt/oss-framework/components";

import {
  MAX_HOURS_PER_DAY,
  MIN_HOURS_PER_DAY,
  clampHours,
  isPinned,
  projectTemplate,
  storedCredit,
  storedPinned,
} from "./project.ts";
import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import {
  CATEGORY_COLOR,
  DEFAULT_BREAK_GLYPH,
  DEFAULT_CATEGORY_GLYPH,
  glyphFor,
  type CategoryColor,
  type GlyphId,
} from "./kinds.ts";
import { KindPicker, MarkButton } from "./KindPicker.tsx";
import {
  CATEGORY_COLORS,
  PROJECT_AUTO_COLOR,
  WEEK,
  weekdayLabel,
} from "./labels.ts";
import { ModalHeader } from "./ModalHeader.tsx";
import { BreakCreditField } from "./BreakCreditField.tsx";
import { BreakMinutesField } from "./BreakMinutesField.tsx";
import {
  DEFAULT_BREAK_CREDIT,
  type BreakCredit,
  type Project,
  type Weekday,
} from "./types.ts";

// The project editor: name, working days, the day's length, the break types
// and the kinds of work. One sheet, edited as a draft and saved whole, so a
// half-finished rename never reaches the document.
//
// The project itself carries a mark and a hue, and so does each break type
// and kind of work — a kind of work a colour too; every one of them is picked
// from the row it belongs to. The picker unfolds under the row rather than
// opening over it — one row at a time, because the sheet is already a sheet
// and a dialog on a dialog is a trap on a phone.
//
// The project's own is the first thing the sheet asks for after the name, and
// it is not decoration: the top bar shows the mark *instead of* the name, so
// this is the row that decides what a project looks like from the corner of
// every screen.

type Props = {
  /** The project to edit, or null to create one. */
  project: Project | null;
  onSave: (project: Project) => void;
  onClose: () => void;
};

/** The key the project's own picker is opened under (see `picking`). */
const PROJECT_ROW = "project";

export function ProjectEditModal({ project, onSave, onClose }: Props) {
  const t = useT();
  const [draft, setDraft] = useState<Project>(
    () =>
      project ??
      projectTemplate(
        "",
        {
          lunch: t("projects.defaults.lunch"),
          coffee: t("projects.defaults.coffee"),
          toilet: t("projects.defaults.toilet"),
          training: t("projects.defaults.training"),
          healthcare: t("projects.defaults.healthcare"),
          meetings: t("projects.defaults.meetings"),
          planning: t("projects.defaults.planning"),
          retro: t("projects.defaults.retro"),
          admin: t("projects.defaults.admin"),
        },
        makeId,
        new Date().toISOString(),
      ),
  );
  /** Which row has its picker unfolded — one at a time, so the sheet does not
   *  turn into a wall of grids. The project's own row is keyed by a name
   *  rather than an id, since it is the sheet itself rather than a row of a
   *  list; a kind can never collide with it, ids being what `makeId` hands
   *  out. */
  const [picking, setPicking] = useState<string | null>(null);
  const name = draft.name.trim();
  /** The project's own mark and the hue it is drawn in, read off the draft so
   *  the row previews what the top bar will actually show. */
  const projectMark = glyphFor(draft.glyph, "project");
  const projectTint = draft.color
    ? CATEGORY_COLOR[draft.color]
    : PROJECT_AUTO_COLOR;
  const valid =
    name.length > 0 &&
    draft.breakTypes.every((b) => b.name.trim().length > 0) &&
    draft.categories.every((c) => c.name.trim().length > 0);

  /** The hue a kind of work with no colour of its own takes, by its place in
   *  the list — the same ramp `categoryColor` falls back to, read here off the
   *  draft rather than the saved project so the row previews what a reordered
   *  or newly added kind will actually be drawn in. */
  const autoColor = (index: number) =>
    CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? "var(--link)";

  const setGlyph = (
    list: "breakTypes" | "categories",
    id: string,
    glyph: GlyphId,
  ) =>
    setDraft((d) => ({
      ...d,
      [list]: d[list].map((x) => (x.id === id ? { ...x, glyph } : x)),
    }));

  /** How much of a kind of break counts as work. Stored as nothing at all
   *  when the answer is "none", so a project that counts no break is the
   *  document it always was (see `storedCredit`). */
  const setCredit = (id: string, credit: BreakCredit) =>
    setDraft((d) => ({
      ...d,
      breakTypes: d.breakTypes.map((x) => {
        if (x.id !== id) return x;
        const rest = { ...x };
        delete rest.credit;
        return { ...rest, ...storedCredit(credit) };
      }),
    }));

  /** The project's own hue, under the same discipline: "automatic" is stored
   *  as no colour at all, so a project nobody has dressed is byte for byte
   *  the project it always was. */
  const setProjectColor = (color: CategoryColor | null) =>
    setDraft((d) => {
      const rest = { ...d };
      delete rest.color;
      return color ? { ...rest, color } : rest;
    });

  /** A colour, or null for "automatic" — which is stored as no colour at all,
   *  so the kind goes on taking its position's hue if the list is reordered. */
  const setColor = (id: string, color: CategoryColor | null) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.map((x) => {
        if (x.id !== id) return x;
        const rest = { ...x };
        delete rest.color;
        return color ? { ...rest, color } : rest;
      }),
    }));

  /** What a break of this kind is assumed to take. Already clamped by the
   *  control, which is the only thing that sets it. */
  const setMinutes = (id: string, defaultMinutes: number) =>
    setDraft((d) => ({
      ...d,
      breakTypes: d.breakTypes.map((x) =>
        x.id === id ? { ...x, defaultMinutes } : x,
      ),
    }));

  /** Whether the kind carries a button of its own on the Today screen.
   *  "Shown" is stored as nothing at all, the same discipline (see
   *  `storedPinned`), so a project nobody has hidden anything in is the
   *  document it always was. */
  const setPinned = (list: "breakTypes" | "categories", id: string) =>
    setDraft((d) => ({
      ...d,
      [list]: d[list].map((x) => {
        if (x.id !== id) return x;
        const rest = { ...x };
        delete rest.pinned;
        return { ...rest, ...storedPinned(!isPinned(x)) };
      }),
    }));

  const toggleDay = (day: Weekday) =>
    setDraft((d) => ({
      ...d,
      workDays: d.workDays.includes(day)
        ? d.workDays.filter((w) => w !== day)
        : [...d.workDays, day].sort(),
    }));

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="project-editor-title"
      closeLabel={t("common.close")}
    >
      <ModalHeader
        titleId="project-editor-title"
        title={project ? t("projects.edit") : t("projects.add")}
        onCancel={onClose}
        onSave={() =>
          onSave({
            ...draft,
            name,
            breakTypes: draft.breakTypes.map((b) => ({
              ...b,
              name: b.name.trim(),
            })),
            categories: draft.categories.map((c) => ({
              ...c,
              name: c.name.trim(),
            })),
            updatedAt: new Date().toISOString(),
          })
        }
        saveDisabled={!valid}
      />

      {/* The sheet has no footer any more, and the framework only lays the
          bottom safe area in under one — so the body keeps clear of the home
          indicator itself. */}
      <div className="flex flex-col gap-5 overflow-y-auto px-3 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {/* The project's own mark and hue, in the row its name is in — because
            the mark is what the app shows of a project from here on: the
            corner of the top bar carries it instead of the name, and the
            list that corner opens is read by it. Same control as a kind's,
            unfolding under the row the same way. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <MarkButton
              glyph={projectMark}
              tint={projectTint}
              label={t("kinds.markOf", { name: name || t("common.project") })}
              open={picking === PROJECT_ROW}
              onToggle={() =>
                setPicking((p) => (p === PROJECT_ROW ? null : PROJECT_ROW))
              }
            />
            <div className="min-w-0 flex-1">
              <LabeledInput
                label={t("projects.name")}
                value={draft.name}
                placeholder={t("projects.namePlaceholder")}
                required
                invalid={draft.name.trim().length === 0}
                onCommit={(next) => setDraft((d) => ({ ...d, name: next }))}
              />
            </div>
          </div>
          {picking === PROJECT_ROW && (
            <KindPicker
              kind="project"
              glyph={projectMark}
              tint={projectTint}
              autoTint={PROJECT_AUTO_COLOR}
              color={draft.color ?? null}
              onGlyph={(next) => setDraft((d) => ({ ...d, glyph: next }))}
              onColor={setProjectColor}
            />
          )}
          <p className="text-xs text-muted">{t("projects.markHint")}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">{t("projects.workDays")}</span>
          <div className="grid grid-cols-7 gap-1">
            {WEEK.map((day) => {
              const on = draft.workDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(day)}
                  className={`min-h-10 rounded-md border text-xs font-semibold transition-colors ${
                    on
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-line bg-surface-2 text-muted hover:bg-surface-3"
                  }`}
                >
                  {weekdayLabel(day)}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">{t("projects.workDaysHint")}</p>
        </div>

        <LabeledInput
          label={t("projects.hoursPerDay")}
          type="number"
          inputMode="decimal"
          min={MIN_HOURS_PER_DAY}
          max={MAX_HOURS_PER_DAY}
          step={0.25}
          value={String(draft.hoursPerDay)}
          onCommit={(next) =>
            setDraft((d) => ({
              ...d,
              hoursPerDay: clampHours(next, d.hoursPerDay),
            }))
          }
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted">{t("projects.breakTypes")}</span>
          {draft.breakTypes.map((b) => {
            const glyph = glyphFor(b.glyph, "break");
            return (
              <div
                key={b.id}
                className="flex flex-col gap-2 rounded-xl border border-line/60 p-2"
              >
                <div className="flex items-end gap-2">
                  {/* A break is the flag colour wherever it is drawn — on the
                      clock's ring, on the Today button, in the Log — so its
                      mark is too, and there is no colour to pick. */}
                  <MarkButton
                    glyph={glyph}
                    tint="var(--color-flag)"
                    label={t("kinds.markOf", { name: b.name })}
                    open={picking === b.id}
                    onToggle={() =>
                      setPicking((p) => (p === b.id ? null : b.id))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <LabeledInput
                      label={t("projects.breakName")}
                      value={b.name}
                      required
                      invalid={b.name.trim().length === 0}
                      onCommit={(name) =>
                        setDraft((d) => ({
                          ...d,
                          breakTypes: d.breakTypes.map((x) =>
                            x.id === b.id ? { ...x, name } : x,
                          ),
                        }))
                      }
                    />
                  </div>
                  <PinButton
                    name={b.name}
                    pinned={isPinned(b)}
                    onToggle={() => setPinned("breakTypes", b.id)}
                  />
                  <button
                    type="button"
                    aria-label={t("common.remove")}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        breakTypes: d.breakTypes.filter((x) => x.id !== b.id),
                      }))
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line text-muted hover:text-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                {/* The minutes on a line of their own, under the name. They
                    used to be a twenty-wide box wedged between the name and
                    the bin, which left the name of a break about as much room
                    as the word "Healthcare" needs — and there is nowhere in
                    that row to put two buttons. */}
                <BreakMinutesField
                  minutes={b.defaultMinutes}
                  onChange={(next) => setMinutes(b.id, next)}
                />
                <BreakCreditField
                  credit={b.credit ?? DEFAULT_BREAK_CREDIT}
                  defaultMinutes={b.defaultMinutes}
                  onChange={(next) => setCredit(b.id, next)}
                />
                {picking === b.id && (
                  <KindPicker
                    kind="break"
                    glyph={glyph}
                    tint="var(--color-flag)"
                    onGlyph={(next) => setGlyph("breakTypes", b.id, next)}
                  />
                )}
              </div>
            );
          })}
          <Button
            onClick={() =>
              setDraft((d) => ({
                ...d,
                breakTypes: [
                  ...d.breakTypes,
                  {
                    id: makeId(),
                    name: "",
                    defaultMinutes: 15,
                    glyph: DEFAULT_BREAK_GLYPH,
                  },
                ],
              }))
            }
          >
            {t("projects.addBreakType")}
          </Button>
          <p className="text-xs text-muted">{t("projects.breakTypesHint")}</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted">{t("projects.categories")}</span>
          {draft.categories.map((c, i) => {
            const glyph = glyphFor(c.glyph, "category");
            const auto = autoColor(i);
            const tint = c.color ? CATEGORY_COLOR[c.color] : auto;
            return (
              <div key={c.id} className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <MarkButton
                    glyph={glyph}
                    tint={tint}
                    label={t("kinds.markOf", { name: c.name })}
                    open={picking === c.id}
                    onToggle={() =>
                      setPicking((p) => (p === c.id ? null : c.id))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <LabeledInput
                      label={t("projects.categoryName")}
                      value={c.name}
                      required
                      invalid={c.name.trim().length === 0}
                      onCommit={(name) =>
                        setDraft((d) => ({
                          ...d,
                          categories: d.categories.map((x) =>
                            x.id === c.id ? { ...x, name } : x,
                          ),
                        }))
                      }
                    />
                  </div>
                  <PinButton
                    name={c.name}
                    pinned={isPinned(c)}
                    onToggle={() => setPinned("categories", c.id)}
                  />
                  <button
                    type="button"
                    aria-label={t("common.remove")}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        categories: d.categories.filter((x) => x.id !== c.id),
                      }))
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line text-muted hover:text-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                {picking === c.id && (
                  <KindPicker
                    kind="category"
                    glyph={glyph}
                    tint={tint}
                    autoTint={auto}
                    color={c.color ?? null}
                    onGlyph={(next) => setGlyph("categories", c.id, next)}
                    onColor={(next) => setColor(c.id, next)}
                  />
                )}
              </div>
            );
          })}
          <Button
            onClick={() =>
              setDraft((d) => ({
                ...d,
                categories: [
                  ...d.categories,
                  { id: makeId(), name: "", glyph: DEFAULT_CATEGORY_GLYPH },
                ],
              }))
            }
          >
            {t("projects.addCategory")}
          </Button>
          <p className="text-xs text-muted">{t("projects.categoriesHint")}</p>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Whether a kind is on the Today screen, as the button that sits between its
 * name and the bin.
 *
 * A star rather than `kinds.ts`'s pin, which is a map pin — a place, the
 * office, the customer — and reads as "where" beside a break called Lunch.
 * The star is the framework's, for the same reason: this is a control in a
 * form, not a mark a kind wears, and the two vocabularies stay apart.
 * Pressed it wears the accent, because a kind held on the screen is one you
 * will be looking at.
 */
function PinButton({
  name,
  pinned,
  onToggle,
}: {
  name: string;
  pinned: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  return (
    <IconButton
      label={t("projects.pin", { name })}
      pressed={pinned}
      onClick={onToggle}
    >
      <StarIcon className="h-4 w-4" />
    </IconButton>
  );
}
