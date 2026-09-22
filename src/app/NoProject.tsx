// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Button,
  FolderIcon,
  PlusIcon,
} from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import { ProjectEditModal } from "./ProjectEditModal.tsx";
import type { DocStore } from "./useDocStore.ts";

// The card a screen stands on before there is a project — and the way out of
// it.
//
// A screen that names what is missing and then leaves you to go and find it
// is a dead end: the sentence is the whole of it, and the reader has to work
// out for themselves that Projects is the tab and "Add project" is the button
// at the foot of it. The Today screen has never had that problem, because the
// dial itself opens the project form (`NO_PROJECT` in `TodayScreen.tsx`); the
// Log and the Report say their own sentence with the same form behind a
// button.
//
// It is the one project form the whole app opens — the Projects screen's and
// the watch's — so a project made from here is a project made anywhere. And
// saving puts it in use, the way saving the first one from the watch does:
// the screen you are already on is the screen you wanted, so it fills in
// behind the sheet rather than sending you to Projects and back.

type Props = {
  store: DocStore;
  /** What the card says, in the words of the screen it stands on. */
  message: string;
  /** The project made here goes into use — it is the first one, or this card
   *  would not be standing. */
  onAdded: (id: string) => void;
  onNotice: (message: string) => void;
};

export function NoProject({ store, message, onAdded, onNotice }: Props) {
  const t = useT();
  const [adding, setAdding] = useState(false);

  return (
    <div className="px-3 py-3">
      <div className="rounded-2xl border border-line bg-surface-3 p-6 text-center">
        <FolderIcon className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 text-sm text-muted">{message}</p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => setAdding(true)}
        >
          <span className="inline-flex items-center gap-1.5">
            <PlusIcon className="h-4 w-4" />
            {t("projects.add")}
          </span>
        </Button>
      </div>

      {adding && (
        <ProjectEditModal
          project={null}
          onSave={(made) => {
            store.saveProject(made);
            onAdded(made.id);
            onNotice(t("projects.saved"));
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
