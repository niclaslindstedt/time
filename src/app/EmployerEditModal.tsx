// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Button,
  LabeledInput,
  Modal,
  TrashIcon,
} from "@niclaslindstedt/oss-framework/components";

import {
  MAX_BREAK_MINUTES,
  MAX_HOURS_PER_DAY,
  MIN_BREAK_MINUTES,
  MIN_HOURS_PER_DAY,
  clampBreakMinutes,
  clampHours,
  employerTemplate,
} from "./employer.ts";
import { useT } from "./i18n/index.ts";
import { makeId } from "./ids.ts";
import { weekdayLabel } from "./labels.ts";
import type { Employer, Weekday } from "./types.ts";

// The employer editor: name, working days, the day's length, the break types
// and the kinds of work. One sheet, edited as a draft and saved whole, so a
// half-finished rename never reaches the document.

type Props = {
  /** The employer to edit, or null to create one. */
  employer: Employer | null;
  onSave: (employer: Employer) => void;
  onClose: () => void;
};

const WEEK: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function EmployerEditModal({ employer, onSave, onClose }: Props) {
  const t = useT();
  const [draft, setDraft] = useState<Employer>(
    () =>
      employer ??
      employerTemplate(
        "",
        {
          lunch: t("employers.defaults.lunch"),
          coffee: t("employers.defaults.coffee"),
          toilet: t("employers.defaults.toilet"),
          meetings: t("employers.defaults.meetings"),
          planning: t("employers.defaults.planning"),
          retro: t("employers.defaults.retro"),
          admin: t("employers.defaults.admin"),
        },
        makeId,
        new Date().toISOString(),
      ),
  );
  const name = draft.name.trim();
  const valid =
    name.length > 0 &&
    draft.breakTypes.every((b) => b.name.trim().length > 0) &&
    draft.categories.every((c) => c.name.trim().length > 0);

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
      labelledBy="employer-editor-title"
      closeLabel={t("common.close")}
      footer={
        <div className="flex justify-end gap-2 bg-surface-3 px-3 py-3">
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
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
          >
            {t("common.save")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 overflow-y-auto px-3 py-4">
        <h2
          id="employer-editor-title"
          className="text-lg leading-tight font-bold text-fg-bright"
        >
          {employer ? t("employers.edit") : t("employers.add")}
        </h2>

        <LabeledInput
          label={t("employers.name")}
          value={draft.name}
          placeholder={t("employers.namePlaceholder")}
          required
          invalid={draft.name.trim().length === 0}
          onCommit={(next) => setDraft((d) => ({ ...d, name: next }))}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">{t("employers.workDays")}</span>
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
          <p className="text-xs text-muted">{t("employers.workDaysHint")}</p>
        </div>

        <LabeledInput
          label={t("employers.hoursPerDay")}
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
          <span className="text-xs text-muted">
            {t("employers.breakTypes")}
          </span>
          {draft.breakTypes.map((b) => (
            <div key={b.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <LabeledInput
                  label={t("employers.breakName")}
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
              <div className="w-20">
                <LabeledInput
                  label={t("employers.breakMinutes")}
                  type="number"
                  inputMode="numeric"
                  min={MIN_BREAK_MINUTES}
                  max={MAX_BREAK_MINUTES}
                  value={String(b.defaultMinutes)}
                  onCommit={(next) =>
                    setDraft((d) => ({
                      ...d,
                      breakTypes: d.breakTypes.map((x) =>
                        x.id === b.id
                          ? {
                              ...x,
                              defaultMinutes: clampBreakMinutes(
                                next,
                                x.defaultMinutes,
                              ),
                            }
                          : x,
                      ),
                    }))
                  }
                />
              </div>
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
          ))}
          <Button
            onClick={() =>
              setDraft((d) => ({
                ...d,
                breakTypes: [
                  ...d.breakTypes,
                  { id: makeId(), name: "", defaultMinutes: 15 },
                ],
              }))
            }
          >
            {t("employers.addBreakType")}
          </Button>
          <p className="text-xs text-muted">{t("employers.breakTypesHint")}</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted">
            {t("employers.categories")}
          </span>
          {draft.categories.map((c) => (
            <div key={c.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <LabeledInput
                  label={t("employers.categoryName")}
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
          ))}
          <Button
            onClick={() =>
              setDraft((d) => ({
                ...d,
                categories: [...d.categories, { id: makeId(), name: "" }],
              }))
            }
          >
            {t("employers.addCategory")}
          </Button>
          <p className="text-xs text-muted">{t("employers.categoriesHint")}</p>
        </div>
      </div>
    </Modal>
  );
}
