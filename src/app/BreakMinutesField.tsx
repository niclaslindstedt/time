// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { LABELED_FIELD_CLASS } from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import {
  MAX_BREAK_MINUTES,
  MIN_BREAK_MINUTES,
  clampBreakMinutes,
} from "./project.ts";

// What a break of this kind is assumed to take: the one control for it,
// spread by both forms that edit a kind of break — the project editor and
// the Today screen's `KindModal` — for the same reason `BreakCreditField` is
// one control, and the same reason the marks live in one table.
//
// Two buttons rather than the number field's own spinner. The spinner is a
// pair of arrows four pixels tall in the corner of the box: a mouse target
// on a screen that is mostly thumbs, pointing at a step nobody stated — one
// minute, which is not a step anyone adjusts a lunch by. So the step is
// five, and it is printed on the buttons that take it. The arrows are turned
// off in `styles.css` (`.app-step-field`) rather than left under the buttons
// that replaced them.
//
// The pair sits together at the right of the field, where the arrows were and
// in the order the arrows were in — down then up. Split either side of the
// number they were two controls with a number between them, which is a range
// rather than a stepper; together they are the one thing the spinner was, at
// a size a thumb can find. A few pixels smaller than the three answers to
// "Counts as work" directly below, because these are a handle on the field
// beside them and those are a choice of their own.
//
// The number is still typed into. Five at a time is how a break is nudged,
// not how an unusual one is entered, and a field you can only step is a
// field that takes eleven taps to say 55.
//
// The step is literal: "+5m" adds five. Snapping an odd 7 up to 10 would be
// the more tidy-minded reading, and it would mean the button did something
// other than what is written on it.

/** How much a press moves it. Five minutes is the granularity a break is
 *  actually thought about in, and a fifth of the lunch every project starts
 *  with. */
const STEP = 5;

type Props = {
  minutes: number;
  onChange: (minutes: number) => void;
};

export function BreakMinutesField({ minutes, onChange }: Props) {
  const t = useT();
  const step = (by: number) =>
    onChange(clampBreakMinutes(minutes + by, minutes));

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted">{t("kinds.minutes.label")}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={MIN_BREAK_MINUTES}
          max={MAX_BREAK_MINUTES}
          value={String(minutes)}
          aria-label={t("kinds.minutes.label")}
          onInput={(e) =>
            onChange(clampBreakMinutes(e.currentTarget.value, minutes))
          }
          className={`app-step-field min-w-0 flex-1 ${LABELED_FIELD_CLASS}`}
        />
        <div className="flex shrink-0 gap-1">
          <StepButton
            label={t("kinds.minutes.lessLabel", { minutes: String(STEP) })}
            text={t("kinds.minutes.less", { minutes: String(STEP) })}
            disabled={minutes <= MIN_BREAK_MINUTES}
            onClick={() => step(-STEP)}
          />
          <StepButton
            label={t("kinds.minutes.moreLabel", { minutes: String(STEP) })}
            text={t("kinds.minutes.more", { minutes: String(STEP) })}
            disabled={minutes >= MAX_BREAK_MINUTES}
            onClick={() => step(STEP)}
          />
        </div>
      </div>
    </div>
  );
}

/** One of the two: the same border and tint as `BreakCreditField`'s answers,
 *  which sit directly under these in both forms, and a few pixels shorter and
 *  narrower than one — enough that the pair reads as a handle on the field
 *  beside it rather than as two more of the buttons below. */
function StepButton({
  label,
  text,
  disabled,
  onClick,
}: {
  label: string;
  text: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="h-9 w-14 shrink-0 rounded-md border border-line bg-surface-2 text-xs font-semibold text-muted tabular-nums transition-colors enabled:hover:bg-surface-3 enabled:hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
    >
      {text}
    </button>
  );
}
