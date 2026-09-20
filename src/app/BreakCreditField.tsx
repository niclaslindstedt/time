// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { LABELED_FIELD_CLASS } from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import {
  MAX_BREAK_MINUTES,
  MIN_BREAK_MINUTES,
  clampCreditMinutes,
} from "./project.ts";
import type { BreakCredit } from "./types.ts";

// How much of a kind of break still counts as work: the one control for it,
// spread by both forms that edit a kind of break — the project editor and
// the Today screen's `KindModal`. One control rather than two, for the same
// reason the marks live in one table: a rule that reads differently in two
// places is two rules.
//
// Three answers rather than a switch, because two is not enough to say what
// people are actually paid. A trip down the corridor usually still counts; an
// hour's lunch usually does not; and the common middle case is a lunch of
// which the first half hour counts and the rest is your own. The minutes are
// asked for only when they mean something, and the line under the buttons
// says what the answer does to the day — because "counts as work" is a
// phrase you want spelled out once before you trust it with your hours.

type Props = {
  credit: BreakCredit;
  /** What a break of this kind is assumed to take — where the minutes start
   *  when the partial answer is picked, since the whole of a break is the
   *  obvious first guess at how much of it counts. */
  defaultMinutes: number;
  onChange: (credit: BreakCredit) => void;
};

export function BreakCreditField({ credit, defaultMinutes, onChange }: Props) {
  const t = useT();
  const modes: { mode: BreakCredit["mode"]; label: string }[] = [
    { mode: "none", label: t("kinds.credit.none") },
    { mode: "all", label: t("kinds.credit.all") },
    { mode: "partial", label: t("kinds.credit.partial") },
  ];

  const pick = (mode: BreakCredit["mode"]) => {
    if (mode === credit.mode) return;
    if (mode === "partial") {
      onChange({
        mode: "partial",
        minutes: clampCreditMinutes(defaultMinutes, MIN_BREAK_MINUTES),
      });
      return;
    }
    onChange({ mode });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted">{t("kinds.credit.label")}</span>
      <div className="flex gap-2">
        <div className="grid flex-1 grid-cols-3 gap-1">
          {modes.map((m) => {
            const on = m.mode === credit.mode;
            return (
              <button
                key={m.mode}
                type="button"
                aria-pressed={on}
                onClick={() => pick(m.mode)}
                className={`min-h-10 rounded-md border px-1 text-xs font-semibold transition-colors ${
                  on
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-line bg-surface-2 text-muted hover:bg-surface-3"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        {credit.mode === "partial" && (
          <label className="w-20 shrink-0">
            <span className="sr-only">{t("kinds.credit.minutes")}</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_BREAK_MINUTES}
              max={MAX_BREAK_MINUTES}
              value={String(credit.minutes)}
              aria-label={t("kinds.credit.minutes")}
              onInput={(e) =>
                onChange({
                  mode: "partial",
                  minutes: clampCreditMinutes(
                    e.currentTarget.value,
                    credit.minutes,
                  ),
                })
              }
              className={LABELED_FIELD_CLASS}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted">{says(t, credit)}</p>
    </div>
  );
}

/** What the answer does to the day, in a sentence. */
function says(t: ReturnType<typeof useT>, credit: BreakCredit): string {
  if (credit.mode === "all") return t("kinds.credit.saysAll");
  if (credit.mode === "partial") {
    return t("kinds.credit.saysPartial", { minutes: String(credit.minutes) });
  }
  return t("kinds.credit.saysNone");
}
