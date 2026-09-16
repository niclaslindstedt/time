// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { SegmentedControl } from "@niclaslindstedt/oss-framework/components";

import { Dial, type Band } from "./Dial.tsx";
import { useT } from "./i18n/index.ts";
import { CATEGORY_COLORS } from "./labels.ts";
import {
  DIAL_FACE,
  DIAL_FACES,
  DIAL_FONT,
  DIAL_FONTS,
  DIAL_MARKER_STYLES,
  DIAL_MOVEMENTS,
  DIAL_PLACEMENTS,
  DIAL_PRESET,
  DIAL_PRESETS,
  DIAL_SCALE,
  DIAL_SCALES,
  resolveDial,
  type DialConfig,
  type DialFace,
  type DialFont,
  type DialMarkers,
  type DialMovement,
  type DialPlacement,
  type DialPreset,
  type DialScale,
} from "./look.ts";
import type { Seconds } from "./types.ts";

// The settings' dial picker: eight presets and a ninth card, Custom, that
// opens the dial up piece by piece.
//
// Every preset card is a drawing of the dial it picks, with an invented
// morning on it and the hands at ten past ten — the choice previews itself,
// because the dial is on another screen and a name says nothing about what
// it looks like. Under Custom the same drawing is the live preview of what
// the six pickers below it add up to.
//
// The pickers read and write the caller's settings; nothing here is state.

/** Ten past ten, the time a watch is photographed at: the hands frame the
 *  marker at twelve and hide none of the quarters. */
const SHOWROOM: Seconds = 10 * 3600 + 9 * 60 + 36;

/** An invented morning for the previews: in at half past seven, a break at
 *  nine, a kind of work from half past nine. Colours are the app's own —
 *  the accent, the flag, the first category hue — so a preview shows the
 *  day the way Today will draw it. */
const SAMPLE: Band[] = [
  {
    start: 7.5 * 3600,
    end: SHOWROOM,
    fill: "var(--color-accent)",
    edge: "var(--color-accent)",
  },
  { start: 9.5 * 3600, end: SHOWROOM, fill: CATEGORY_COLORS[0]! },
  {
    start: 9 * 3600,
    end: 9.25 * 3600,
    fill: "var(--color-flag)",
    edge: "var(--color-flag)",
  },
];

type Props = {
  preset: DialPreset | "custom";
  custom: DialConfig;
  onPreset: (next: DialPreset | "custom") => void;
  onCustom: (next: DialConfig) => void;
};

export function DialPicker({ preset, custom, onPreset, onCustom }: Props) {
  const t = useT();
  const current = resolveDial(preset, custom);
  const set = <K extends keyof DialConfig>(key: K, value: DialConfig[K]) =>
    onCustom({ ...current, [key]: value });

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label={t("settings.clockPreset")}
        className="grid grid-cols-3 gap-2"
      >
        {DIAL_PRESETS.map((id) => (
          <PresetCard
            key={id}
            id={id}
            dial={DIAL_PRESET[id]}
            name={t(`settings.preset.${id}`)}
            hint={t(`settings.presetHint.${id}`)}
            on={preset === id}
            onPick={() => onPreset(id)}
          />
        ))}
        <PresetCard
          id="custom"
          dial={custom}
          name={t("settings.clockCustom")}
          hint={t("settings.clockCustomHint")}
          on={preset === "custom"}
          onPick={() => {
            // Custom starts from the dial you are looking at, not from the
            // one you left there last time — the reason to open it up is to
            // change one thing about this one.
            if (preset !== "custom") onCustom(current);
            onPreset("custom");
          }}
        />
      </div>

      {preset === "custom" && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-3 p-3">
          <Labelled label={t("settings.clockFace")}>
            <div
              role="radiogroup"
              aria-label={t("settings.clockFace")}
              className="flex flex-wrap gap-2"
            >
              {DIAL_FACES.map((face) => (
                <Swatch
                  key={face}
                  face={face}
                  name={t(`settings.face.${face}`)}
                  on={current.face === face}
                  onPick={() => set("face", face)}
                />
              ))}
            </div>
          </Labelled>

          <Labelled label={t("settings.clockMarkers")}>
            <Chips<DialMarkers>
              label={t("settings.clockMarkers")}
              value={current.markers}
              options={DIAL_MARKER_STYLES.map((m) => ({
                value: m,
                label: t(`settings.markers.${m}`),
              }))}
              onChange={(m) => set("markers", m)}
            />
          </Labelled>

          {/* Each face wears the typeface it picks: a name in one font would
              say nothing about what it does to the numerals. */}
          <Labelled label={t("settings.clockFont")}>
            <Chips<DialFont>
              label={t("settings.clockFont")}
              value={current.font}
              options={DIAL_FONTS.map((font) => ({
                value: font,
                label: (
                  <span
                    style={{
                      fontFamily: DIAL_FONT[font].family,
                      fontWeight: DIAL_FONT[font].weight,
                    }}
                  >
                    {t(`settings.font.${font}`)}
                  </span>
                ),
              }))}
              onChange={(font) => set("font", font)}
            />
          </Labelled>

          <Labelled label={t("settings.clockScale")}>
            <SegmentedControl
              value={String(current.scale)}
              options={DIAL_SCALES.map((scale) => ({
                value: String(scale),
                label: (
                  <span
                    aria-label={String(scale)}
                    style={{ fontSize: `${8 + DIAL_SCALE[scale] * 0.35}px` }}
                  >
                    {scale}
                  </span>
                ),
              }))}
              onChange={(next) => set("scale", Number(next) as DialScale)}
              ariaLabel={t("settings.clockScale")}
              fullWidth
            />
          </Labelled>

          <Labelled label={t("settings.clockPlacement")}>
            <SegmentedControl<DialPlacement>
              value={current.placement}
              options={DIAL_PLACEMENTS.map((p) => ({
                value: p,
                label: t(`settings.placement.${p}`),
              }))}
              onChange={(p) => set("placement", p)}
              ariaLabel={t("settings.clockPlacement")}
              fullWidth
            />
          </Labelled>

          <Labelled label={t("settings.clockMovement")}>
            <SegmentedControl<DialMovement>
              value={current.movement}
              options={DIAL_MOVEMENTS.map((m) => ({
                value: m,
                label: t(`settings.movement.${m}`),
              }))}
              onChange={(m) => set("movement", m)}
              ariaLabel={t("settings.clockMovement")}
              fullWidth
            />
            <p className="text-xs text-muted">
              {t(`settings.movementHint.${current.movement}`)}
            </p>
          </Labelled>
        </div>
      )}
    </div>
  );
}

function PresetCard({
  id,
  dial,
  name,
  hint,
  on,
  onPick,
}: {
  id: string;
  dial: DialConfig;
  name: string;
  hint: string;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={`${name}. ${hint}`}
      title={hint}
      onClick={onPick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors ${
        on
          ? "border-accent bg-accent/10"
          : "border-line bg-surface-3 hover:bg-surface-2"
      }`}
    >
      <Dial
        id={`preset-${id}`}
        dial={dial}
        now={SHOWROOM}
        bands={SAMPLE}
        ariaHidden
        className="block h-auto w-full"
      />
      <span
        className={`text-xs font-semibold ${on ? "text-fg-bright" : "text-fg"}`}
      >
        {name}
      </span>
    </button>
  );
}

/** A face, as a disc of its own colour: the one picker here that is about
 *  a colour, drawn as the colour rather than named. */
function Swatch({
  face,
  name,
  on,
  onPick,
}: {
  face: DialFace;
  name: string;
  on: boolean;
  onPick: () => void;
}) {
  const spec = DIAL_FACE[face];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={name}
      title={name}
      onClick={onPick}
      className={`h-9 w-9 rounded-full border-2 transition-transform ${
        on ? "scale-110 border-accent" : "border-line hover:scale-105"
      }`}
      style={{
        background: `radial-gradient(circle at 40% 35%, ${spec.dial}, ${spec.edge})`,
      }}
    />
  );
}

/** A wrapping row of choices, for the two pickers with eight words each
 *  that a segmented control could not fit on a phone. */
function Chips<T extends string>({
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
            className={`min-h-8 rounded-full border px-3 text-sm transition-colors ${
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

function Labelled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-fg">{label}</span>
      {children}
    </div>
  );
}
