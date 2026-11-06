export const SPACE = 8;

/** Linear icon stroke in CSS pixels. Lucide renders this with absoluteStrokeWidth. */
export const ICON_STROKE = 1.6;

export const GLASS_ALPHA = 0.08;
export const GLASS_ALPHA_MIN = 0.07;
export const GLASS_ALPHA_MAX = 0.1;

export const THEME_STORAGE_KEY = "pji-theme";
export const LOCALE_STORAGE_KEY = "pji-locale";
export const PALETTE_STORAGE_KEY = "pji-palette";

export type ThemeName = "day" | "night";

export type Palette = {
  bgStart: string;
  bgEnd: string;
  plum: string;
  cobalt: string;
  ember: string;
  glass: number;
};

/** Default night surface: purple-black, with plum / cobalt / ember glows. */
export const NIGHT_PALETTE: Palette = {
  bgStart: "#2e1065",
  bgEnd: "#060607",
  plum: "#c084fc",
  cobalt: "#60a5fa",
  ember: "#fb923c",
  glass: GLASS_ALPHA,
};

export const DAY_PALETTE: Palette = {
  bgStart: "#ede4ff",
  bgEnd: "#f7f4ef",
  plum: "#7e22ce",
  cobalt: "#1d4ed8",
  ember: "#c2410c",
  glass: GLASS_ALPHA,
};

export const DEFAULT_THEME: ThemeName = "night";

export function paletteFor(theme: ThemeName): Palette {
  return theme === "day" ? { ...DAY_PALETTE } : { ...NIGHT_PALETTE };
}

export function paletteStorageKey(theme: ThemeName) {
  return `${PALETTE_STORAGE_KEY}-${theme}`;
}

export function clampGlass(value: number): number {
  if (!Number.isFinite(value)) return GLASS_ALPHA;
  const snapped = Math.round(value * 100) / 100;
  if (snapped < GLASS_ALPHA_MIN) return GLASS_ALPHA_MIN;
  if (snapped > GLASS_ALPHA_MAX) return GLASS_ALPHA_MAX;
  return snapped;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export function sanitizePalette(input: Partial<Palette> | null | undefined, theme: ThemeName): Palette {
  const base = paletteFor(theme);
  if (!input) return base;
  return {
    bgStart: HEX.test(input.bgStart ?? "") ? input.bgStart!.toLowerCase() : base.bgStart,
    bgEnd: HEX.test(input.bgEnd ?? "") ? input.bgEnd!.toLowerCase() : base.bgEnd,
    plum: HEX.test(input.plum ?? "") ? input.plum!.toLowerCase() : base.plum,
    cobalt: HEX.test(input.cobalt ?? "") ? input.cobalt!.toLowerCase() : base.cobalt,
    ember: HEX.test(input.ember ?? "") ? input.ember!.toLowerCase() : base.ember,
    glass: clampGlass(typeof input.glass === "number" ? input.glass : base.glass),
  };
}
