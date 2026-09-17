// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Badge,
  Button,
  ConfirmDialog,
  FolderIcon,
  IconButton,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@niclaslindstedt/oss-framework/components";

import { ProjectEditModal } from "./ProjectEditModal.tsx";
import { useT } from "./i18n/index.ts";
import { WEEK, isWeekend, weekdayLabel } from "./labels.ts";
import { projectList, type Project } from "./types.ts";
import type { DocStore } from "./useDocStore.ts";

// What the hours are for. One card per project, and the editor behind each.
// A card is the shape of the week: a pill per working day (a weekend in the
// flag colour) and a pill for the day's length. What the project holds
// beyond that — its breaks and its kinds of work — is the editor's business,
// not a count on a card. Editing and deleting are the two glyphs top right.
// With one project the rest of the app never asks which; with two or more
// the top bar grows a switcher and this is where "in use" is set.

type Props = {
  store: DocStore;
  activeId: string | null;
  onActivate: (id: string) => void;
  /** Open the editor for a new project on mount — the Today screen's
   *  onboarding button lands here. */
  openNew: boolean;
  onOpenedNew: () => void;
  onNotice: (message: string) => void;
};

type Editing = { project: Project | null };

/** The shape every figure on a card wears: a working day, a weekend worked,
 *  and the length of the day. One class so the row reads as one row. */
const PILL =
  "inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-semibold";

export function ProjectsScreen({
  store,
  activeId,
  onActivate,
  openNew,
  onOpenedNew,
  onNotice,
}: Props) {
  const t = useT();
  const [editing, setEditing] = useState<Editing | null>(() =>
    openNew ? { project: null } : null,
  );
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const projects = projectList(store.data);

  const closeEditor = () => {
    setEditing(null);
    if (openNew) onOpenedNew();
  };

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      {projects.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface-3 p-6 text-center">
          <FolderIcon className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm text-muted">{t("projects.empty")}</p>
        </div>
      )}

      {projects.map((e) => {
        const active = e.id === activeId;
        const workDays = WEEK.filter((day) => e.workDays.includes(day));
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
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="min-w-0 truncate text-lg font-bold text-fg-bright">
                  {e.name}
                </h2>
                {active && projects.length > 1 && (
                  <Badge tone="accent">{t("projects.active")}</Badge>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconButton
                  label={t("common.edit")}
                  onClick={() => setEditing({ project: e })}
                >
                  <PencilIcon className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={t("projects.delete")}
                  className="hover:border-danger/50 hover:text-danger!"
                  onClick={() => setConfirmDelete(e)}
                >
                  <TrashIcon className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {workDays.length === 0 ? (
                <span
                  className={`${PILL} border-dashed border-line bg-surface-2 text-muted`}
                >
                  {t("projects.summaryNoDays")}
                </span>
              ) : (
                workDays.map((day) => (
                  <span
                    key={day}
                    className={`${PILL} ${
                      isWeekend(day)
                        ? "border-flag/40 bg-flag/15 text-flag"
                        : "border-accent/40 bg-accent/15 text-accent"
                    }`}
                  >
                    {weekdayLabel(day)}
                  </span>
                ))
              )}
              <span className={`${PILL} border-line bg-surface-2 text-muted`}>
                {t("projects.summaryHours", { hours: String(e.hoursPerDay) })}
              </span>
            </div>
            {!active && (
              <div className="mt-3">
                <Button variant="primary" onClick={() => onActivate(e.id)}>
                  {t("projects.use")}
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <Button variant="primary" onClick={() => setEditing({ project: null })}>
        <span className="inline-flex items-center gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {t("projects.add")}
        </span>
      </Button>

      {editing && (
        <ProjectEditModal
          project={editing.project}
          onSave={(project) => {
            store.saveProject(project);
            if (!editing.project) onActivate(project.id);
            onNotice(t("projects.saved"));
            closeEditor();
          }}
          onClose={closeEditor}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t("projects.deleteConfirm", {
          name: confirmDelete?.name ?? "",
        })}
        description={t("projects.deleteHint")}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          if (confirmDelete) store.deleteProject(confirmDelete.id);
          setConfirmDelete(null);
          onNotice(t("projects.deleted"));
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
