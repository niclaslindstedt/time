// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import {
  CATEGORY_COLOR,
  CATEGORY_PALETTE,
  GLYPH_GROUPS_FOR,
  glyphsIn,
  type CategoryColor,
  type GlyphId,
  type KindSort,
} from "./kinds.ts";
import { KindGlyph } from "./icons.tsx";
import { useT } from "./i18n/index.ts";

// The mark a kind of break or work wears, and — for a kind of work — the hue
// it is drawn in. Opened from a row of the project form, in place rather than
// over it: a picker for a row of a sheet that is itself a sheet would be a
// dialog on a dialog, and this one is small enough to unfold where it is.
//
// The glyphs are drawn in the colour the kind will actually be drawn in, so
// the grid is the preview: pick a hue and every mark in the grid moves to it.

type Props = {
  /** Which vocabularies the grid offers: a break type is shown the day's
   *  pauses, a kind of work is shown work's, and both are shown the neutral
   *  marks. The other one's is not offered at all — see `GLYPH_GROUPS_FOR`. */
  kind: KindSort;
  glyph: GlyphId;
  onGlyph: (glyph: GlyphId) => void;
  /** A kind of work's colour, or null when it takes the one its place in the
   *  list gives it. Left out for a break type, which is the flag colour the
   *  way every break on the clock is. */
  color?: CategoryColor | null;
  onColor?: (color: CategoryColor | null) => void;
  /** The CSS colour the marks are drawn in — the chosen hue, or the
   *  positional one when there is no choice. */
  tint: string;
  /** The CSS colour "Automatic" would give this kind, so that cell shows the
   *  hue it stands for rather than an empty square. */
  autoTint?: string;
};

/**
 * The way into the picker: a square showing what the kind wears now, in the
 * colour it will be drawn in. Sits at the head of a row in the project form
 * and beside the name field when a kind is invented on the Today screen, so
 * the mark is changed where the kind is.
 */
export function MarkButton({
  glyph,
  tint,
  label,
  open,
  onToggle,
}: {
  glyph: GlyphId;
  tint: string;
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={open}
      onClick={onToggle}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
        open
          ? "border-accent bg-accent/15"
          : "border-line bg-surface-2 hover:bg-surface-3"
      }`}
      style={{ color: tint }}
    >
      <KindGlyph id={glyph} className="h-5 w-5" />
    </button>
  );
}

const CELL =
  "flex h-9 w-full items-center justify-center rounded-md border transition-colors";
const OFF = "border-line bg-surface-2 hover:bg-surface-3";
const ON = "border-accent bg-accent/15";

export function KindPicker({
  kind,
  glyph,
  onGlyph,
  color,
  onColor,
  tint,
  autoTint,
}: Props) {
  const t = useT();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-2">
      {onColor && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">{t("kinds.colour")}</span>
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-9">
            {/* "Automatic" first, and it is a colour too — the one the list
                is already giving this kind, so the cell shows it rather than
                an empty square. */}
            <button
              type="button"
              aria-pressed={!color}
              aria-label={t("kinds.colourAuto")}
              title={t("kinds.colourAuto")}
              onClick={() => onColor(null)}
              className={`${CELL} ${!color ? ON : OFF}`}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-dashed"
                style={{ borderColor: autoTint ?? tint }}
              />
            </button>
            {CATEGORY_PALETTE.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={color === id}
                aria-label={t(`kinds.palette.${id}`)}
                title={t(`kinds.palette.${id}`)}
                onClick={() => onColor(id)}
                className={`${CELL} ${color === id ? ON : OFF}`}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full"
                  style={{ background: CATEGORY_COLOR[id] }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The grid is the preview: `currentColor` set here reaches every mark
          in it, so picking a hue above repaints the marks below. */}
      <div className="flex flex-col gap-2" style={{ color: tint }}>
        <span className="text-xs text-muted">{t("kinds.mark")}</span>
        {GLYPH_GROUPS_FOR[kind].map((group) => (
          <div key={group} className="flex flex-col gap-1">
            <span className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
              {t(`kinds.group.${group}`)}
            </span>
            <div className="grid grid-cols-6 gap-1 sm:grid-cols-9">
              {glyphsIn(group).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={glyph === id}
                  aria-label={t(`kinds.glyph.${id}`)}
                  title={t(`kinds.glyph.${id}`)}
                  onClick={() => onGlyph(id)}
                  className={`${CELL} ${glyph === id ? ON : OFF}`}
                >
                  <KindGlyph id={id} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
