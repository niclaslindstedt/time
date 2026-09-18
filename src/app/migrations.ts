// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The persistence pipeline: raw JSON in, a validated `AppData` out, and back.
// Every read — from localStorage, from a cloud backend, from a restored
// backup — goes through `parseDoc`, so no other module has to trust the bytes
// it was handed.
//
// The framework owns the migration *runner* (`createMigrator`); this module
// owns the step table and the shape validation. A schema change means bumping
// `DOC_VERSION` in `types.ts` and appending one step here — never editing an
// existing step, which would silently rewrite documents that already migrated
// through it.
//
// A *purely additive optional* field is the one change that needs no step: a
// kind of work's glyph and colour are absent on every document written before
// them, and absent is exactly what "the mark and hue this kind always had"
// means, so there is nothing for a step to rewrite. What such a field does
// need is the validation below — the value is an id into `kinds.ts`, and an
// id this build has no entry for is dropped like any other unknown field.

import {
  createMigrator,
  type Versioned,
} from "@niclaslindstedt/oss-framework/storage";

import { isValidSpan } from "./actions.ts";
import { allowsGlyph, isCategoryColor, type KindSort } from "./kinds.ts";
import {
  DEFAULT_HOURS_PER_DAY,
  DEFAULT_WORK_DAYS,
  clampBreakMinutes,
  clampHours,
} from "./project.ts";
import {
  DOC_VERSION,
  dayKey,
  emptyDoc,
  type ActivitySpan,
  type AppData,
  type BreakSpan,
  type BreakType,
  type Project,
  type Span,
  type Weekday,
  type WorkCategory,
  type WorkDay,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const EPOCH = new Date(0).toISOString();

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function stampOf(value: unknown): string {
  return typeof value === "string" ? value : EPOCH;
}

function parseSpan(value: unknown): Span | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  if (!id) return null;
  const start = Number(value.start);
  const end =
    value.end === null || value.end === undefined ? null : Number(value.end);
  if (!isValidSpan(start, end)) return null;
  return { id, start, end };
}

function parseSpans<S extends Span>(
  value: unknown,
  extend: (span: Span, raw: Record<string, unknown>) => S | null,
): S[] {
  if (!Array.isArray(value)) return [];
  const out: S[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    const span = parseSpan(raw);
    if (!span || seen.has(span.id)) continue;
    const full = extend(span, raw as Record<string, unknown>);
    if (!full) continue;
    seen.add(span.id);
    out.push(full);
  }
  return out;
}

/** Coerce one stored day into a `WorkDay`, or drop it when it isn't one. */
function parseDay(key: string, value: unknown): WorkDay | null {
  if (!isRecord(value)) return null;
  const [keyDate = "", keyProject = ""] = key.split(":");
  const date = str(value.date, keyDate);
  const projectId = str(value.projectId, keyProject);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !projectId) return null;
  return {
    date,
    projectId,
    sessions: parseSpans<Span>(value.sessions, (span) => span),
    breaks: parseSpans<BreakSpan>(value.breaks, (span, raw) => {
      const typeId = str(raw.typeId);
      return typeId ? { ...span, typeId } : null;
    }),
    activities: parseSpans<ActivitySpan>(value.activities, (span, raw) => {
      const categoryId = str(raw.categoryId);
      return categoryId ? { ...span, categoryId } : null;
    }),
    updatedAt: stampOf(value.updatedAt),
  };
}

function parseWeekdays(value: unknown): Weekday[] {
  if (!Array.isArray(value)) return [...DEFAULT_WORK_DAYS];
  const out = new Set<Weekday>();
  for (const v of value) {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0 && n <= 6) out.add(n as Weekday);
  }
  return [...out].sort();
}

/** The named things a project holds — its break types and its kinds of work —
 *  read one at a time, with the optional bits each may carry.
 *
 *  A glyph or a colour the running version has no entry for is dropped rather
 *  than kept: these are ids into `kinds.ts`, and a document written by a newer
 *  version can name one this build cannot draw. So is a glyph from the other
 *  vocabulary — a break wearing a pair of angle brackets — which an older
 *  version could store before the two lists were kept apart. Dropping it
 *  leaves the kind with the default mark and its positional hue, which is what
 *  a kind that never had either looks like. */
function parseNamed<T extends { id: string; name: string }>(
  value: unknown,
  extend: (
    base: { id: string; name: string },
    raw: Record<string, unknown>,
  ) => T,
): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const id = str(raw.id);
    const name = str(raw.name).trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    out.push(extend({ id, name }, raw));
  }
  return out;
}

/** The mark a kind carries, when it carries one this build knows and this
 *  sort of kind may wear. */
function parseGlyph(raw: Record<string, unknown>, kind: KindSort) {
  return allowsGlyph(kind, raw.glyph) ? { glyph: raw.glyph } : {};
}

/** Coerce one stored project, or drop it when it has no id or name. */
function parseProject(key: string, value: unknown): Project | null {
  if (!isRecord(value)) return null;
  const id = str(value.id, key);
  const name = str(value.name).trim();
  if (!id || !name) return null;
  const breakTypes = parseNamed<BreakType>(value.breakTypes, (base, raw) => ({
    ...base,
    defaultMinutes: clampBreakMinutes(raw.defaultMinutes, 15),
    ...parseGlyph(raw, "break"),
  }));
  const categories = parseNamed<WorkCategory>(
    value.categories,
    (base, raw) => ({
      ...base,
      ...parseGlyph(raw, "category"),
      ...(isCategoryColor(raw.color) ? { color: raw.color } : {}),
    }),
  );
  return {
    id,
    name,
    workDays: parseWeekdays(value.workDays),
    hoursPerDay: clampHours(value.hoursPerDay, DEFAULT_HOURS_PER_DAY),
    breakTypes,
    categories,
    updatedAt: stampOf(value.updatedAt),
  };
}

/**
 * v1 → v2: the thing you work for became a *project* rather than an
 * employer, so `employers` is now `projects` and a day points at its
 * `projectId`. Ids are untouched, which is what keeps `dayKey()` — and so
 * every day already filed under `date:id` — valid across the rename.
 */
function renameEmployersToProjects(doc: Versioned): Versioned {
  const { employers, days, ...rest } = doc as Versioned & {
    employers?: unknown;
    days?: unknown;
  };
  const renamedDays: Record<string, unknown> = {};
  if (isRecord(days)) {
    for (const [key, raw] of Object.entries(days)) {
      if (!isRecord(raw)) continue;
      const { employerId, ...day } = raw as Record<string, unknown> & {
        employerId?: unknown;
      };
      renamedDays[key] =
        day.projectId === undefined && employerId !== undefined
          ? { ...day, projectId: employerId }
          : day;
    }
  }
  return {
    ...rest,
    version: 2,
    projects: rest.projects ?? (isRecord(employers) ? employers : {}),
    days: renamedDays,
  };
}

// Step `n` migrates a document from version `n` to `n + 1`. v0 is a document
// that predates versioning (the framework's runner reads a missing `version`
// as 0); v1 is the first published shape. Existing steps are never edited.
const migrator = createMigrator({
  latestVersion: DOC_VERSION,
  migrations: {
    0: (doc) => ({ ...doc, version: 1 }),
    1: renameEmployersToProjects,
  },
});

/** Validate and normalise an arbitrary parsed value into an `AppData`. */
export function normalizeDoc(value: unknown): AppData {
  if (!isRecord(value)) return emptyDoc();
  const { data } = migrator.migrate(value);
  const migrated = data as unknown as Record<string, unknown>;

  const projects: AppData["projects"] = {};
  const projectsRaw = isRecord(migrated.projects) ? migrated.projects : {};
  for (const [key, raw] of Object.entries(projectsRaw)) {
    const project = parseProject(key, raw);
    if (project) projects[project.id] = project;
  }

  const days: AppData["days"] = {};
  const daysRaw = isRecord(migrated.days) ? migrated.days : {};
  for (const [key, raw] of Object.entries(daysRaw)) {
    const day = parseDay(key, raw);
    if (day) days[dayKey(day.projectId, day.date)] = day;
  }

  return { version: DOC_VERSION, projects, days };
}

/** Parse serialized document bytes. Throws on malformed JSON so the caller
 *  can decide whether to quarantine the stored copy — a *shape* problem is
 *  recoverable (unknown fields are dropped), a *syntax* problem is not. */
export function parseDoc(raw: string): AppData {
  return normalizeDoc(JSON.parse(raw) as unknown);
}

/** Serialize a document for storage. Keys are emitted in sorted order so the
 *  bytes are stable — two devices holding the same days produce the same
 *  string, which keeps cloud revisions from churning on no-op saves. */
export function serializeDoc(data: AppData): string {
  const projects: AppData["projects"] = {};
  for (const id of Object.keys(data.projects).sort()) {
    projects[id] = data.projects[id]!;
  }
  const days: AppData["days"] = {};
  for (const key of Object.keys(data.days).sort()) {
    days[key] = data.days[key]!;
  }
  return JSON.stringify({ version: DOC_VERSION, projects, days });
}
