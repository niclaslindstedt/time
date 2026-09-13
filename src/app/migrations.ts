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

import { createMigrator } from "@niclaslindstedt/oss-framework/storage";

import { isValidSpan } from "./actions.ts";
import {
  DEFAULT_HOURS_PER_DAY,
  DEFAULT_WORK_DAYS,
  clampBreakMinutes,
  clampHours,
} from "./employer.ts";
import {
  DOC_VERSION,
  dayKey,
  emptyDoc,
  type ActivitySpan,
  type AppData,
  type BreakSpan,
  type Employer,
  type Span,
  type Weekday,
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
  const [keyDate = "", keyEmployer = ""] = key.split(":");
  const date = str(value.date, keyDate);
  const employerId = str(value.employerId, keyEmployer);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !employerId) return null;
  return {
    date,
    employerId,
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

function parseNamed(value: unknown): { id: string; name: string }[] {
  if (!Array.isArray(value)) return [];
  const out: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const id = str(raw.id);
    const name = str(raw.name).trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name });
  }
  return out;
}

/** Coerce one stored employer, or drop it when it has no id or name. */
function parseEmployer(key: string, value: unknown): Employer | null {
  if (!isRecord(value)) return null;
  const id = str(value.id, key);
  const name = str(value.name).trim();
  if (!id || !name) return null;
  const breakTypes = Array.isArray(value.breakTypes)
    ? value.breakTypes
        .filter(isRecord)
        .map((raw) => ({
          id: str(raw.id),
          name: str(raw.name).trim(),
          defaultMinutes: clampBreakMinutes(raw.defaultMinutes, 15),
        }))
        .filter((b) => b.id && b.name)
    : [];
  return {
    id,
    name,
    workDays: parseWeekdays(value.workDays),
    hoursPerDay: clampHours(value.hoursPerDay, DEFAULT_HOURS_PER_DAY),
    breakTypes,
    categories: parseNamed(value.categories),
    updatedAt: stampOf(value.updatedAt),
  };
}

// Step `n` migrates a document from version `n` to `n + 1`. v0 is a document
// that predates versioning (the framework's runner reads a missing `version`
// as 0); v1 is the first published shape. Existing steps are never edited.
const migrator = createMigrator({
  latestVersion: DOC_VERSION,
  migrations: {
    0: (doc) => ({ ...doc, version: 1 }),
  },
});

/** Validate and normalise an arbitrary parsed value into an `AppData`. */
export function normalizeDoc(value: unknown): AppData {
  if (!isRecord(value)) return emptyDoc();
  const { data } = migrator.migrate(value);
  const migrated = data as unknown as Record<string, unknown>;

  const employers: AppData["employers"] = {};
  const employersRaw = isRecord(migrated.employers) ? migrated.employers : {};
  for (const [key, raw] of Object.entries(employersRaw)) {
    const employer = parseEmployer(key, raw);
    if (employer) employers[employer.id] = employer;
  }

  const days: AppData["days"] = {};
  const daysRaw = isRecord(migrated.days) ? migrated.days : {};
  for (const [key, raw] of Object.entries(daysRaw)) {
    const day = parseDay(key, raw);
    if (day) days[dayKey(day.employerId, day.date)] = day;
  }

  return { version: DOC_VERSION, employers, days };
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
  const employers: AppData["employers"] = {};
  for (const id of Object.keys(data.employers).sort()) {
    employers[id] = data.employers[id]!;
  }
  const days: AppData["days"] = {};
  for (const key of Object.keys(data.days).sort()) {
    days[key] = data.days[key]!;
  }
  return JSON.stringify({ version: DOC_VERSION, employers, days });
}
