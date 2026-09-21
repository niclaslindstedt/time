// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  Field,
  LabeledInput,
  Modal,
  Section,
  SelectPicker,
  ToggleRow,
} from "@niclaslindstedt/oss-framework/components";

import { EXPORT_NOTICE } from "./edition.ts";
import { formatFullDay, formatDayNamed } from "./format.ts";
import { ChartIcon, TagIcon } from "./icons.tsx";
import { useT, type TFn } from "./i18n/index.ts";
import { breakName, categoryName } from "./labels.ts";
import { ModalHeader } from "./ModalHeader.tsx";
import { PAPERS } from "./pdf/page.ts";
import { SPEC_ROUNDINGS, specification, type SpecRounding } from "./spec.ts";
import {
  downloadPdf,
  pageRule,
  printSpec,
  specFilename,
} from "./specExport.ts";
import { layoutSpec, type SpecLabels, type SpecNames } from "./specLayout.ts";
import { SpecPages } from "./SpecPages.tsx";
import {
  SPEC_ACCENT,
  SPEC_ACCENTS,
  SPEC_DENSITIES,
  SPEC_DETAILS,
  SPEC_FIGURE_STYLES,
  SPEC_HEADERS,
  SPEC_PRESET,
  SPEC_PRESETS,
  SPEC_SECTIONS,
  SPEC_TABLES,
  SPEC_TYPEFACES,
  resolveSpecStyle,
  type SpecPreset,
  type SpecStyle,
} from "./specStyle.ts";
import type { AppData, Project, Seconds } from "./types.ts";
import type { SpecDetails } from "./useAppSettings.ts";

// Exporting the range as a specification: pick a style, say who it is from
// and who it is for, and leave with a file or a printout.
//
// The cards at the top are the six styles, each one drawn as the first page
// of *this* specification rather than as a picture of a document — the same
// arrangement as the dial picker's preset cards, and for the same reason: a
// style is a thing you recognise when you see your own hours set in it.
//
// The modal owns nothing. The style and the details live in the settings
// store (per device, never in the document — see `useAppSettings.ts`), the
// figures are `spec.ts`'s reading of the same range the screen behind is
// showing, and the pages are `specLayout.ts`'s. What is here is the form.

type Props = {
  data: AppData;
  project: Project;
  from: DayKey;
  to: DayKey;
  /** The range as the Report screen names it — what the document prints and
   *  what the file is named after. */
  period: string;
  /** The same range as a filename will take it. */
  periodSlug: string;
  today: DayKey;
  now: Seconds;
  preset: SpecPreset | "custom";
  style: SpecStyle;
  details: SpecDetails;
  rounding: SpecRounding;
  onPreset: (preset: SpecPreset | "custom") => void;
  onStyle: (style: SpecStyle) => void;
  onDetails: (details: SpecDetails) => void;
  onRounding: (rounding: SpecRounding) => void;
  onClose: () => void;
};

/** How the document says what it rounded to, and how the form offers it. An
 *  hour is named rather than counted: "up to the next 60 minutes" is a
 *  sentence nobody writes. */
export function roundingLabel(t: TFn, minutes: SpecRounding): string {
  if (minutes === 0) return t("spec.roundingNone");
  if (minutes === 60) return t("spec.roundingHour");
  return t("spec.roundingMinutes", { minutes: String(minutes) });
}

/** Every fixed word the document prints, read out of the catalog once. */
function docLabels(t: TFn, rounding: SpecRounding): SpecLabels {
  return {
    title: t("spec.doc.title"),
    project: t("spec.doc.project"),
    period: t("spec.doc.period"),
    issued: t("spec.doc.issued"),
    preparedBy: t("spec.doc.preparedBy"),
    client: t("spec.doc.client"),
    reference: t("spec.doc.reference"),
    summary: t("spec.doc.summary"),
    hours: t("spec.doc.hours"),
    days: t("spec.doc.days"),
    target: t("spec.doc.target"),
    balance: t("spec.doc.balance"),
    categories: t("spec.doc.categories"),
    breaks: t("spec.doc.breaks"),
    daily: t("spec.doc.daily"),
    date: t("spec.doc.date"),
    start: t("spec.doc.start"),
    end: t("spec.doc.end"),
    breakColumn: t("spec.doc.breakColumn"),
    decimal: t("spec.doc.decimal"),
    share: t("spec.doc.share"),
    kind: t("spec.doc.kind"),
    total: t("spec.doc.total"),
    running: t("spec.doc.running"),
    signature: t("spec.doc.signature"),
    signedDate: t("spec.doc.signedDate"),
    rounding: t("spec.doc.rounding"),
    roundedNote:
      rounding === 60
        ? t("spec.doc.roundedNoteHour")
        : t("spec.doc.roundedNote", { minutes: String(rounding) }),
    generated: t("spec.doc.generated"),
    noticeTitle: t("spec.notice.title"),
    noticeBody: t("spec.notice.body"),
  };
}

export function SpecExportModal({
  data,
  project,
  from,
  to,
  period,
  periodSlug,
  today,
  now,
  preset,
  style,
  details,
  rounding,
  onPreset,
  onStyle,
  onDetails,
  onRounding,
  onClose,
}: Props) {
  const t = useT();
  // The moment the document is dated and stamped, taken once when the form
  // opens: a preview that re-dated itself every keystroke would put a
  // different file on disk from the one on screen.
  const [openedAt] = useState(() => new Date().toISOString());
  const [draft, setDraft] = useState(details);

  const chosen = resolveSpecStyle(preset, style);

  const labels = useMemo(() => docLabels(t, rounding), [t, rounding]);
  const names = useMemo<SpecNames>(
    () => ({
      day: (date) => formatDayNamed(date),
      category: (id) =>
        id === null ? t("common.uncategorised") : categoryName(t, project, id),
      breakType: (id) => breakName(t, project, id),
      page: (page, pages) =>
        t("spec.doc.page", { page: String(page), pages: String(pages) }),
    }),
    [t, project],
  );

  const fields = useMemo(
    () => ({
      period,
      issued: formatFullDay(today),
      preparedBy: draft.preparedBy,
      client: draft.client,
      reference: draft.reference,
      note: draft.note,
    }),
    [period, today, draft],
  );

  // Two readings of the range, because whether a day nobody worked is listed
  // is the style's to say and the six cards below are showing six styles at
  // once. Both are wanted either way, and a fold over a month of days is
  // cheaper than deciding which one is not.
  const worked = useMemo(
    () => specification(data, project, from, to, today, now, { rounding }),
    [data, project, from, to, today, now, rounding],
  );
  const everyDay = useMemo(
    () =>
      specification(data, project, from, to, today, now, {
        blanks: true,
        rounding,
      }),
    [data, project, from, to, today, now, rounding],
  );
  const specFor = useMemo(
    () => (blanks: boolean) => (blanks ? everyDay : worked),
    [everyDay, worked],
  );

  const docFor = useMemo(
    () => (forStyle: SpecStyle) =>
      layoutSpec({
        spec: specFor(forStyle.blanks),
        style: forStyle,
        labels,
        names,
        fields,
        notice: EXPORT_NOTICE,
        createdAt: openedAt,
      }),
    [specFor, labels, names, fields, openedAt],
  );

  const doc = useMemo(() => docFor(chosen), [docFor, chosen]);
  const cards = useMemo(
    () =>
      SPEC_PRESETS.map((id) => ({
        id,
        doc: docFor(SPEC_PRESET[id]),
      })),
    [docFor],
  );

  const filename = specFilename(project.name, periodSlug);
  const empty = doc.pages.length === 0;

  const setStyle = (patch: Partial<SpecStyle>) => {
    // Editing a knob is editing the custom style: a preset that quietly
    // differed from what its settings said would be the one thing the dial
    // picker refuses too.
    onStyle({ ...chosen, ...patch });
    onPreset("custom");
  };

  const commitDetails = (patch: Partial<SpecDetails>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onDetails(next);
  };

  const option = <T extends string>(values: readonly T[], group: string) =>
    values.map((value) => ({
      value,
      label: t(`spec.${group}.${value}` as "spec.tableOption.open"),
    }));

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="spec-export-title"
      closeLabel={t("common.close")}
      centered
      size="max-w-4xl"
    >
      <ModalHeader
        titleId="spec-export-title"
        title={t("spec.title")}
        onCancel={onClose}
        onSave={() => downloadPdf(doc, filename)}
        saveLabel={t("spec.download")}
        saveDisabled={empty}
        extra={
          <Button
            className="min-h-10 shrink-0"
            disabled={empty}
            onClick={() => printSpec()}
          >
            {t("spec.print")}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 overflow-y-auto px-3 py-3 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-xs text-muted">{t("spec.intro")}</p>

          <Section
            title={t("spec.style")}
            icon={<TagIcon className="h-3.5 w-3.5" />}
          >
            <ul className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
              {cards.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    aria-pressed={preset === card.id}
                    onClick={() => onPreset(card.id)}
                    className={`flex w-full flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                      preset === card.id
                        ? "border-accent bg-surface-2"
                        : "border-line hover:bg-surface-2"
                    }`}
                  >
                    <span className="overflow-hidden rounded border border-line">
                      <SpecPages
                        doc={{ ...card.doc, pages: card.doc.pages.slice(0, 1) }}
                      />
                    </span>
                    <span className="truncate px-0.5 text-xs font-bold text-fg-bright">
                      {t(`spec.preset.${card.id}` as "spec.preset.ledger")}
                    </span>
                    <span className="line-clamp-2 px-0.5 text-[0.65rem] leading-tight text-muted">
                      {t(
                        `spec.preset.${card.id}Hint` as "spec.preset.ledgerHint",
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {preset !== "custom" && (
              <Button
                className="w-full"
                onClick={() => {
                  onStyle(SPEC_PRESET[preset]);
                  onPreset("custom");
                }}
              >
                {t("spec.saveCustom")}
              </Button>
            )}
            {preset === "custom" && (
              <p className="text-xs text-muted">{t("spec.savedCustom")}</p>
            )}
          </Section>

          <Section
            title={t("spec.styleCustom")}
            icon={<ChartIcon className="h-3.5 w-3.5" />}
          >
            <Field label={t("spec.typeface")}>
              <SelectPicker
                value={chosen.typeface}
                options={option(SPEC_TYPEFACES, "typefaceOption")}
                onChange={(typeface) => setStyle({ typeface })}
                ariaLabel={t("spec.typeface")}
              />
            </Field>
            <Field label={t("spec.header")}>
              <SelectPicker
                value={chosen.header}
                options={option(SPEC_HEADERS, "headerOption")}
                onChange={(header) => setStyle({ header })}
                ariaLabel={t("spec.header")}
              />
            </Field>
            <Field label={t("spec.accent")}>
              <SelectPicker
                value={chosen.accent}
                options={SPEC_ACCENTS.map((value) => ({
                  value,
                  label: t(
                    `spec.accentOption.${value}` as "spec.accentOption.ink",
                  ),
                  labelStyle: { color: SPEC_ACCENT[value] },
                }))}
                onChange={(accent) => setStyle({ accent })}
                ariaLabel={t("spec.accent")}
              />
            </Field>
            <Field label={t("spec.table")}>
              <SelectPicker
                value={chosen.table}
                options={option(SPEC_TABLES, "tableOption")}
                onChange={(table) => setStyle({ table })}
                ariaLabel={t("spec.table")}
              />
            </Field>
            <Field label={t("spec.density")}>
              <SelectPicker
                value={chosen.density}
                options={option(SPEC_DENSITIES, "densityOption")}
                onChange={(density) => setStyle({ density })}
                ariaLabel={t("spec.density")}
              />
            </Field>
            <Field label={t("spec.paper")}>
              <SelectPicker
                value={chosen.paper}
                options={option(PAPERS, "paperOption")}
                onChange={(paper) => setStyle({ paper })}
                ariaLabel={t("spec.paper")}
              />
            </Field>
            <Field label={t("spec.detail")}>
              <SelectPicker
                value={chosen.detail}
                options={option(SPEC_DETAILS, "detailOption")}
                onChange={(detail) => setStyle({ detail })}
                ariaLabel={t("spec.detail")}
              />
            </Field>
            <p className="text-xs text-muted">{t("spec.detailHint")}</p>
            <Field label={t("spec.figures")}>
              <SelectPicker
                value={chosen.figures}
                options={option(SPEC_FIGURE_STYLES, "figuresOption")}
                onChange={(figures) => setStyle({ figures })}
                ariaLabel={t("spec.figures")}
              />
            </Field>
          </Section>

          <Section title={t("spec.sections")}>
            {SPEC_SECTIONS.map((key) => (
              <ToggleRow
                key={key}
                label={t(`spec.section.${key}` as "spec.section.summary")}
                hint={key === "balance" ? t("spec.balanceHint") : undefined}
                checked={chosen.sections[key]}
                onChange={(next) =>
                  setStyle({ sections: { ...chosen.sections, [key]: next } })
                }
              />
            ))}
            <ToggleRow
              label={t("spec.blanks")}
              hint={t("spec.blanksHint")}
              checked={chosen.blanks}
              onChange={(blanks) => setStyle({ blanks })}
            />
            <ToggleRow
              label={t("spec.footer")}
              checked={chosen.footer}
              onChange={(footer) => setStyle({ footer })}
            />
          </Section>

          <Section title={t("spec.rounding")}>
            <Field label={t("spec.rounding")}>
              <SelectPicker
                value={rounding}
                options={SPEC_ROUNDINGS.map((value) => ({
                  value,
                  label: roundingLabel(t, value),
                }))}
                onChange={(next) => onRounding(next)}
                ariaLabel={t("spec.rounding")}
              />
            </Field>
            <p className="text-xs text-muted">{t("spec.roundingHint")}</p>
          </Section>

          <Section title={t("spec.details")}>
            <p className="text-xs text-muted">{t("spec.detailsHint")}</p>
            <LabeledInput
              label={t("spec.doc.preparedBy")}
              value={draft.preparedBy}
              onCommit={(preparedBy) => commitDetails({ preparedBy })}
            />
            <LabeledInput
              label={t("spec.doc.client")}
              value={draft.client}
              onCommit={(client) => commitDetails({ client })}
            />
            <LabeledInput
              label={t("spec.doc.reference")}
              value={draft.reference}
              onCommit={(reference) => commitDetails({ reference })}
            />
            <LabeledInput
              label={t("spec.doc.note")}
              value={draft.note}
              onCommit={(note) => commitDetails({ note })}
            />
          </Section>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 lg:sticky lg:top-0">
          <div className="flex items-baseline justify-between gap-2 px-0.5">
            <span className="text-xs font-bold text-muted uppercase">
              {t("spec.preview")}
            </span>
            <span className="truncate text-xs text-muted">
              {doc.pages.length === 1
                ? t("spec.previewPage")
                : t("spec.previewPages", { count: String(doc.pages.length) })}
            </span>
          </div>
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto rounded-lg bg-surface-2 p-3">
            <SpecPages doc={doc} className="shrink-0 rounded shadow-lg" />
          </div>
          <p className="truncate px-0.5 text-xs text-muted">{filename}</p>
        </div>
      </div>

      {/* The copy the printer gets: the same pages, off screen until a print
          starts (see `.spec-print` in `styles.css`). */}
      <div className="spec-print" aria-hidden="true">
        <style>{pageRule(doc)}</style>
        <SpecPages doc={doc} />
      </div>
    </Modal>
  );
}
