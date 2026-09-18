// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { SegmentedControl } from "@niclaslindstedt/oss-framework/components";

import { Dial, type Band } from "./Dial.tsx";
import { useT } from "./i18n/index.ts";
import { CATEGORY_COLORS } from "./labels.ts";
import {
  BACKLIGHT_COLOR,
  BACKLIGHT_COLORS,
  BACKLIGHT_HZ,
  BACKLIGHT_INTENSITY,
  BACKLIGHT_SPREAD,
  DIAL_FACE,
  DIAL_FACES,
  DIAL_FONT,
  DIAL_FONTS,
  DIAL_HAND_SETS,
  DIAL_MARKER_STYLES,
  DIAL_MOVEMENTS,
  DIAL_PLACEMENTS,
  DIAL_PRESET,
  DIAL_PRESETS,
  DIAL_RINGS,
  DIAL_SCALE,
  DIAL_SCALES,
  FACE_BACKLIGHT,
  glowGeometry,
  resolveBacklight,
  resolveDial,
  type Backlight,
  type BacklightColor,
  type DialConfig,
  type DialFace,
  type DialFont,
  type DialHands,
  type DialMarkers,
  type DialMovement,
  type DialPlacement,
  type DialPreset,
  type DialRing,
  type DialScale,
} from "./look.ts";
import type { Seconds } from "./types.ts";

// The settings' dial picker: nine presets and a tenth card, Custom, that
// opens the dial up piece by piece.
//
// Every preset card is a drawing of the dial it picks, with an invented
// morning on it and the hands at ten past ten — the choice previews itself,
// because the dial is on another screen and a name says nothing about what
// it looks like. Under Custom the same drawing is the live preview of what
// the pickers below it add up to.
//
// Every card is lit by its own backlight as well, steadily rather than
// beating: the light belongs to the face (`FACE_BACKLIGHT` in `look.ts`), so
// a card that showed only the dial would be half the choice. A card clips its
// own halo, so ten lights sit in one grid without spilling into each other.
//
// The pickers read and write the caller's settings; nothing here is state.

/** How much of its light a preset card is lit by. A card is nearly all
 *  dial, so the halo is cropped at the tile's edge before it has fallen off
 *  — at full strength the brightest lights come out as a flat wash of
 *  colour rather than a glow behind a watch. The dial on Today has the
 *  screen to fall off into and is drawn at its own strength. */
const CARD_GLOW = 0.55;

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
  /** The light Custom holds. A preset's own is its face's, looked up. */
  backlight: Backlight;
  onPreset: (next: DialPreset | "custom") => void;
  onCustom: (next: DialConfig) => void;
  onBacklight: (next: Backlight) => void;
};

export function DialPicker({
  preset,
  custom,
  backlight,
  onPreset,
  onCustom,
  onBacklight,
}: Props) {
  const t = useT();
  const current = resolveDial(preset, custom);
  const glow = resolveBacklight(preset, backlight);
  const set = <K extends keyof DialConfig>(key: K, value: DialConfig[K]) =>
    onCustom({ ...current, [key]: value });
  const setGlow = <K extends keyof Backlight>(key: K, value: Backlight[K]) =>
    onBacklight({ ...glow, [key]: value });

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
            glow={FACE_BACKLIGHT[DIAL_PRESET[id].face]}
            on={preset === id}
            onPick={() => onPreset(id)}
          />
        ))}
        <PresetCard
          id="custom"
          dial={custom}
          name={t("settings.clockCustom")}
          hint={t("settings.clockCustomHint")}
          glow={backlight}
          on={preset === "custom"}
          onPick={() => {
            // Custom starts from the dial you are looking at, not from the
            // one you left there last time — the reason to open it up is to
            // change one thing about this one. Its light comes across with
            // it, which for a preset is the light of the face it wears.
            if (preset !== "custom") {
              onCustom(current);
              onBacklight(glow);
            }
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
                  onPick={() => {
                    // A face brings its own light. Tuning one afterwards is
                    // what the four knobs below are for, and picking the
                    // face again is how you get back to where it started.
                    set("face", face);
                    onBacklight(FACE_BACKLIGHT[face]);
                  }}
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

          <Labelled label={t("settings.clockRing")}>
            <SegmentedControl<DialRing>
              value={current.ring}
              options={DIAL_RINGS.map((r) => ({
                value: r,
                label: t(`settings.ring.${r}`),
              }))}
              onChange={(r) => set("ring", r)}
              ariaLabel={t("settings.clockRing")}
              fullWidth
            />
            <p className="text-xs text-muted">
              {t(`settings.ringHint.${current.ring}`)}
            </p>
          </Labelled>

          <Labelled label={t("settings.clockHands")}>
            <SegmentedControl<DialHands>
              value={current.hands}
              options={DIAL_HAND_SETS.map((h) => ({
                value: h,
                label: t(`settings.hands.${h}`),
              }))}
              onChange={(h) => set("hands", h)}
              ariaLabel={t("settings.clockHands")}
              fullWidth
            />
            <p className="text-xs text-muted">
              {t(`settings.handsHint.${current.hands}`)}
            </p>
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

          {/* The light behind the case. It lives here rather than out in the
              settings because it belongs to the face: a preset is lit by its
              own, and this is where a dial is taken apart. Its colour is the
              watch's rather than the theme's — see `look.ts` for why that is
              not a palette. */}
          <Labelled label={t("settings.backlight")}>
            <p className="text-xs text-muted">{t("settings.backlightHint")}</p>
            <div
              role="radiogroup"
              aria-label={t("settings.backlightColor")}
              className="flex flex-wrap gap-2"
            >
              {BACKLIGHT_COLORS.map((color) => (
                <GlowSwatch
                  key={color}
                  color={color}
                  name={t(
                    `settings.backlightColorName.${color}` as "settings.backlightColorName.accent",
                  )}
                  on={glow.color === color}
                  onPick={() => setGlow("color", color)}
                />
              ))}
            </div>
            <Slider
              label={t("settings.backlightBeat")}
              value={glow.hz}
              min={BACKLIGHT_HZ.min}
              max={BACKLIGHT_HZ.max}
              step={BACKLIGHT_HZ.step}
              display={
                glow.hz === 0
                  ? t("settings.backlightSteady")
                  : t("settings.backlightHz", { hz: glow.hz.toFixed(2) })
              }
              onChange={(hz) => setGlow("hz", hz)}
            />
            <Slider
              label={t("settings.backlightIntensity")}
              value={glow.intensity}
              min={BACKLIGHT_INTENSITY.min}
              max={BACKLIGHT_INTENSITY.max}
              step={BACKLIGHT_INTENSITY.step}
              display={
                glow.intensity === 0
                  ? t("settings.backlightOff")
                  : t("settings.backlightPercent", {
                      percent: String(glow.intensity),
                    })
              }
              onChange={(intensity) => setGlow("intensity", intensity)}
            />
            {/* How far the light lands, as against how strong it is. A large
                dial has little room around it, and a halo wider than that
                room runs into the bars and is cut off at them — so the reach
                is a knob of its own rather than a constant. */}
            <Slider
              label={t("settings.backlightSpread")}
              value={glow.spread}
              min={BACKLIGHT_SPREAD.min}
              max={BACKLIGHT_SPREAD.max}
              step={BACKLIGHT_SPREAD.step}
              display={t("settings.backlightPercent", {
                percent: String(glow.spread),
              })}
              onChange={(spread) => setGlow("spread", spread)}
            />
            <p className="text-xs text-muted">
              {t("settings.backlightSpreadHint")}
            </p>
            <p className="text-xs text-muted">
              {t("settings.backlightFaceHint")}
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
  glow,
  on,
  onPick,
}: {
  id: string;
  dial: DialConfig;
  name: string;
  hint: string;
  glow: Backlight;
  on: boolean;
  onPick: () => void;
}) {
  const halo = glowGeometry(glow.spread);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={`${name}. ${hint}`}
      title={hint}
      onClick={onPick}
      className={`relative flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border p-2 transition-colors ${
        on
          ? "border-accent bg-accent/10"
          : "border-line bg-surface-3 hover:bg-surface-2"
      }`}
    >
      {/* The card's own light, held steady: ten cards beating at ten rates
          would be a fairground, and what a card shows is the colour and the
          reach rather than the beat. It is behind the drawing and clipped by
          the card, so a wide halo lights this tile and not its neighbours —
          and dimmed by `CARD_GLOW`, because that clip is also what would
          make it a flat wash. */}
      <span
        aria-hidden="true"
        data-state="working"
        data-beat="off"
        className="app-glow"
        style={
          {
            "--glow-color": BACKLIGHT_COLOR[glow.color],
            "--glow-alpha": (glow.intensity / 100) * CARD_GLOW,
            "--glow-inset": `${halo.inset}%`,
            "--glow-hold": `${halo.hold}%`,
            "--glow-fade": `${halo.fade}%`,
            "--glow-blur": `${halo.blur}px`,
          } as Record<string, string | number>
        }
      />
      <Dial
        id={`preset-${id}`}
        dial={dial}
        now={SHOWROOM}
        bands={SAMPLE}
        ariaHidden
        className="relative block h-auto w-full"
      />
      <span
        className={`relative text-xs font-semibold ${
          on ? "text-fg-bright" : "text-fg"
        }`}
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

/** A backlight colour, as a lit dot: the one picker about a light, drawn as
 *  the light rather than named. */
function GlowSwatch({
  color,
  name,
  on,
  onPick,
}: {
  color: BacklightColor;
  name: string;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={name}
      title={name}
      onClick={onPick}
      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
        on ? "border-fg-bright" : "border-transparent hover:border-line"
      }`}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 rounded-full shadow-[0_0_10px_var(--swatch)]"
        style={
          {
            background: BACKLIGHT_COLOR[color],
            "--swatch": BACKLIGHT_COLOR[color],
          } as Record<string, string>
        }
      />
    </button>
  );
}

/** A native range, with its value said in words beside the label — a slider
 *  on its own is a question with no answer. */
function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (next: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between text-xs">
        <span className="text-fg">{label}</span>
        <span className="text-muted tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="app-range w-full"
      />
    </label>
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
