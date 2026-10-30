// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0

// A wrapping row of choices, for a picker whose options will not fit on one
// line: the dial's eight marker styles and nine typefaces, and the kinds of
// break or work a project holds, which are as many as the reader made. A
// segmented control keeps every option on one row and runs off the side of
// the card once there are more than a phone has room for; this goes on to
// the next row instead.

export function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-1.5"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`min-h-8 max-w-full truncate rounded-full border px-3 text-sm transition-colors ${
              on
                ? "border-accent bg-accent/15 text-fg-bright"
                : "border-line bg-surface-2 text-fg hover:bg-surface-1"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
