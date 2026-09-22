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
// five, it is printed on the buttons that take it, and they are as tall as
// everything else in the form. The arrows are turned off in `styles.css`
// (`.app-step-field`) rather than left under the buttons that replaced them.
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
        <StepButton
          label={t("kinds.minutes.lessLabel", { minutes: String(STEP) })}
          text={t("kinds.minutes.less", { minutes: String(STEP) })}
          disabled={minutes <= MIN_BREAK_MINUTES}
          onClick={() => step(-STEP)}
        />
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
          className={`app-step-field min-w-0 flex-1 text-center ${LABELED_FIELD_CLASS}`}
        />
        <StepButton
          label={t("kinds.minutes.moreLabel", { minutes: String(STEP) })}
          text={t("kinds.minutes.more", { minutes: String(STEP) })}
          disabled={minutes >= MAX_BREAK_MINUTES}
          onClick={() => step(STEP)}
        />
      </div>
    </div>
  );
}

/** One of the two. Shaped like `BreakCreditField`'s answers, because they sit
 *  one above the other in both forms and a second button shape between them
 *  would read as a different kind of control. */
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
      className="min-h-10 w-16 shrink-0 rounded-md border border-line bg-surface-2 text-xs font-semibold text-muted tabular-nums transition-colors enabled:hover:bg-surface-3 enabled:hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
    >
      {text}
    </button>
  );
}
