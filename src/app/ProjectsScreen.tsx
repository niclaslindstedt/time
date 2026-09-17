// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Badge,
  Button,
  ConfirmDialog,
  FolderIcon,
  PlusIcon,
} from "@niclaslindstedt/oss-framework/components";

import { ProjectEditModal } from "./ProjectEditModal.tsx";
import { useT } from "./i18n/index.ts";
import { weekdayLabel } from "./labels.ts";
import { projectList, type Project } from "./types.ts";
import type { DocStore } from "./useDocStore.ts";

// What the hours are for. One card per project, and the editor behind each.
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
              {active && projects.length > 1 && (
                <Badge tone="accent">{t("projects.active")}</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              {t("projects.summaryDays", {
                days:
                  e.workDays.map(weekdayLabel).join(" ") || t("common.none"),
              })}
              {" · "}
              {t("projects.summaryHours", { hours: String(e.hoursPerDay) })}
              {" · "}
              {t("projects.summaryBreaks", {
                count: String(e.breakTypes.length),
              })}
              {" · "}
              {t("projects.summaryCategories", {
                count: String(e.categories.length),
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => setEditing({ project: e })}>
                {t("common.edit")}
              </Button>
              {!active && (
                <Button variant="primary" onClick={() => onActivate(e.id)}>
                  {t("projects.use")}
                </Button>
              )}
              <Button variant="danger" onClick={() => setConfirmDelete(e)}>
                {t("projects.delete")}
              </Button>
            </div>
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
