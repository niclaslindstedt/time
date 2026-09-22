// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { Badge, Modal } from "@niclaslindstedt/oss-framework/components";

import { KindGlyph } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import { projectColor, projectGlyph } from "./labels.ts";
import type { Project } from "./types.ts";

// Which project the screens are showing, as a list rather than a menu.
//
// The top bar used to carry the name in a select, which is a row of chrome
// spent on a thing that changes once a week — and on a phone that select was
// the *only* thing on the bar over the watch, so the app wore a menu bar for
// it. Now the corner carries the project's mark and nothing else, and this is
// what the mark opens: every project, in its own colour, with the one in use
// badged.
//
// A row is the whole switch — press it and the app is on that project — so
// the sheet has no save bar and no row of buttons: it is a list, and pressing
// something in a list is the answer. Escape and the backdrop are the way out
// with nothing changed. Nothing here edits: a project's mark, its hue and
// everything else are the project form's, a press away on the Projects tab.

/**
 * The corner itself: the project's mark, in the project's hue, and nothing
 * else — no name, no chevron.
 *
 * A name in the bar was a word that had to be truncated on a phone and told
 * you what you already knew; a mark is one glyph you learn in a day and can
 * read from across the desk. It is drawn like the cog at the other end of the
 * bar — same square, same hover — because they are the same sort of thing:
 * a press that opens something over the screen and gives it back.
 */
export function ProjectMarkButton({
  project,
  open,
  onOpen,
}: {
  project: Project;
  open: boolean;
  onOpen: () => void;
}) {
  const t = useT();
  const label = t("projects.switchOf", { name: project.name });
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      title={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors ${
        open ? "bg-accent/15" : "hover:bg-surface-2"
      }`}
      style={{ color: projectColor(project) }}
    >
      <KindGlyph id={projectGlyph(project)} className="h-5 w-5" />
    </button>
  );
}

type Props = {
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function ProjectPickerModal({
  projects,
  activeId,
  onSelect,
  onClose,
}: Props) {
  const t = useT();
  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="project-picker-title"
      closeLabel={t("common.close")}
      centered
      size="max-w-sm"
    >
      <div className="flex flex-col gap-3 overflow-y-auto px-3 py-4">
        <h2
          id="project-picker-title"
          className="text-lg leading-tight font-bold text-fg-bright"
        >
          {t("projects.switch")}
        </h2>

        <ul className="flex flex-col gap-2">
          {projects.map((project) => {
            const active = project.id === activeId;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    if (!active) onSelect(project.id);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-accent/40 bg-accent/10"
                      : "border-line bg-surface-2 hover:bg-surface-3"
                  }`}
                >
                  {/* The mark in the project's own hue — the same square the
                    top bar shows, so what is pressed there and what is read
                    here are one thing. */}
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface"
                    style={{ color: projectColor(project) }}
                  >
                    <KindGlyph id={projectGlyph(project)} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-fg-bright">
                    {project.name}
                  </span>
                  {active && (
                    <Badge tone="accent">{t("projects.active")}</Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
