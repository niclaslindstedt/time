// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Badge,
  BuildingIcon,
  Button,
  ConfirmDialog,
  PlusIcon,
} from "@niclaslindstedt/oss-framework/components";

import { EmployerEditModal } from "./EmployerEditModal.tsx";
import { useT } from "./i18n/index.ts";
import { weekdayLabel } from "./labels.ts";
import { employerList, type Employer } from "./types.ts";
import type { DocStore } from "./useDocStore.ts";

// Who the hours are for. One card per employer, and the editor behind each.
// With one employer the rest of the app never asks which; with two or more
// the top bar grows a switcher and this is where "in use" is set.

type Props = {
  store: DocStore;
  activeId: string | null;
  onActivate: (id: string) => void;
  /** Open the editor for a new employer on mount — the Today screen's
   *  onboarding button lands here. */
  openNew: boolean;
  onOpenedNew: () => void;
  onNotice: (message: string) => void;
};

type Editing = { employer: Employer | null };

export function EmployersScreen({
  store,
  activeId,
  onActivate,
  openNew,
  onOpenedNew,
  onNotice,
}: Props) {
  const t = useT();
  const [editing, setEditing] = useState<Editing | null>(() =>
    openNew ? { employer: null } : null,
  );
  const [confirmDelete, setConfirmDelete] = useState<Employer | null>(null);
  const employers = employerList(store.data);

  const closeEditor = () => {
    setEditing(null);
    if (openNew) onOpenedNew();
  };

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      {employers.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface-3 p-6 text-center">
          <BuildingIcon className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm text-muted">{t("employers.empty")}</p>
        </div>
      )}

      {employers.map((e) => {
        const active = e.id === activeId;
        return (
          <div
            key={e.id}
            className={`rounded-2xl border p-4 ${
              active
                ? "border-accent/40 bg-accent/10"
                : "border-line bg-surface-3"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="min-w-0 truncate text-lg font-bold text-fg-bright">
                {e.name}
              </h2>
              {active && employers.length > 1 && (
                <Badge tone="accent">{t("employers.active")}</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              {t("employers.summaryDays", {
                days:
                  e.workDays.map(weekdayLabel).join(" ") || t("common.none"),
              })}
              {" · "}
              {t("employers.summaryHours", { hours: String(e.hoursPerDay) })}
              {" · "}
              {t("employers.summaryBreaks", {
                count: String(e.breakTypes.length),
              })}
              {" · "}
              {t("employers.summaryCategories", {
                count: String(e.categories.length),
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => setEditing({ employer: e })}>
                {t("common.edit")}
              </Button>
              {!active && (
                <Button variant="primary" onClick={() => onActivate(e.id)}>
                  {t("employers.use")}
                </Button>
              )}
              <Button variant="danger" onClick={() => setConfirmDelete(e)}>
                {t("employers.delete")}
              </Button>
            </div>
          </div>
        );
      })}

      <Button variant="primary" onClick={() => setEditing({ employer: null })}>
        <span className="inline-flex items-center gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {t("employers.add")}
        </span>
      </Button>

      {editing && (
        <EmployerEditModal
          employer={editing.employer}
          onSave={(employer) => {
            store.saveEmployer(employer);
            if (!editing.employer) onActivate(employer.id);
            onNotice(t("employers.saved"));
            closeEditor();
          }}
          onClose={closeEditor}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t("employers.deleteConfirm", {
          name: confirmDelete?.name ?? "",
        })}
        description={t("employers.deleteHint")}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          if (confirmDelete) store.deleteEmployer(confirmDelete.id);
          setConfirmDelete(null);
          onNotice(t("employers.deleted"));
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
