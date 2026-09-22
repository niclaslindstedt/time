// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useId, useMemo } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Field,
  Modal,
  SegmentedControl,
  SelectPicker,
} from "@niclaslindstedt/oss-framework/components";

import { formatDayNamed, formatHours } from "./format.ts";
import { useT } from "./i18n/index.ts";
import {
  INVOICE_GRAINS,
  downloadInvoiceLines,
  invoiceFilename,
  invoiceLinesFile,
  invoiceLinesTotal,
  type InvoiceGrain,
} from "./invoiceExport.ts";
import { categoryName } from "./labels.ts";
import { ModalHeader } from "./ModalHeader.tsx";
import { SPEC_ROUNDINGS, specification, type SpecRounding } from "./spec.ts";
import type { AppData, Project, Seconds } from "./types.ts";

// Exporting the range for an invoice: choose how the hours are cut into
// lines and how a day is rounded, see what that comes to, and leave with a
// file the Invoice app fills an invoice from by having it dropped on one.
//
// The rounding is the specification's own setting — the same knob, the same
// figure — so the hours the invoice bills are the hours the specification
// sent with it shows.

type Props = {
  data: AppData;
  project: Project;
  from: DayKey;
  to: DayKey;
  /** The range as the Report screen names it — printed under the invoice's
   *  title and what the file is named after. */
  period: string;
  periodSlug: string;
  today: DayKey;
  now: Seconds;
  grain: InvoiceGrain;
  rounding: SpecRounding;
  onGrain: (grain: InvoiceGrain) => void;
  onRounding: (rounding: SpecRounding) => void;
  onClose: () => void;
};

export function InvoiceExportModal({
  data,
  project,
  from,
  to,
  period,
  periodSlug,
  today,
  now,
  grain,
  rounding,
  onGrain,
  onRounding,
  onClose,
}: Props) {
  const t = useT();
  const titleId = useId();

  const file = useMemo(
    () =>
      invoiceLinesFile(
        specification(data, project, from, to, today, now, { rounding }),
        grain,
        {
          day: formatDayNamed,
          kind: (id) => categoryName(t, project, id),
          unlabelled: t("common.uncategorised"),
          rounding: t("invoiceExport.rounding"),
        },
        {
          period,
          exportedAt: new Date().toISOString(),
          appVersion: __APP_VERSION__,
        },
      ),
    [data, project, from, to, today, now, rounding, grain, period, t],
  );
  const hours = invoiceLinesTotal(file.lines);

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={titleId}
      centered
      closeLabel={t("common.close")}
    >
      <ModalHeader
        titleId={titleId}
        title={t("invoiceExport.title")}
        onCancel={onClose}
        onSave={() => {
          downloadInvoiceLines(file, invoiceFilename(project.name, periodSlug));
          onClose();
        }}
        saveDisabled={file.lines.length === 0}
        saveLabel={t("invoiceExport.download")}
      />
      <div className="flex flex-col gap-3 p-3">
        <p className="text-xs text-muted">{t("invoiceExport.intro")}</p>
        <Field label={t("invoiceExport.grain")}>
          <SegmentedControl<InvoiceGrain>
            value={grain}
            options={INVOICE_GRAINS.map((g) => ({
              value: g,
              label: t(
                `invoiceExport.grains.${g}` as "invoiceExport.grains.period",
              ),
            }))}
            onChange={onGrain}
            ariaLabel={t("invoiceExport.grain")}
            fullWidth
          />
        </Field>
        <Field label={t("spec.rounding")}>
          <SelectPicker<string>
            value={String(rounding)}
            options={SPEC_ROUNDINGS.map((r) => ({
              value: String(r),
              label:
                r === 0
                  ? t("spec.roundingNone")
                  : t("spec.roundingMinutes", { minutes: String(r) }),
            }))}
            onChange={(v) => onRounding(Number(v) as SpecRounding)}
            ariaLabel={t("spec.rounding")}
          />
        </Field>
        <p className="text-sm text-fg">
          {file.lines.length === 0
            ? t("invoiceExport.empty")
            : t("invoiceExport.summary", {
                count: String(file.lines.length),
                hours: formatHours(Math.round(hours * 3600)),
              })}
        </p>
        <p className="text-xs text-muted">{t("invoiceExport.hint")}</p>
      </div>
    </Modal>
  );
}
