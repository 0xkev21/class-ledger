export type ThemeColorId =
  | 'teal'
  | 'indigo'
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'crimson'
  | 'cyan';

export interface ThemeColorPreset {
  id: ThemeColorId;
  nameMm: string;
  nameEn: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  surfaceLight: string;
  surfaceDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  onPrimary: string;
}

export interface ActiveThemeColor {
  id: ThemeColorId;
  nameMm: string;
  nameEn: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  surface: string;
  border: string;
  text: string;
  onPrimary: string;
  raw: ThemeColorPreset;
}

export const THEME_COLOR_PRESETS: Record<ThemeColorId, ThemeColorPreset> = {
  teal: {
    id: 'teal',
    nameMm: 'စိမ်းပြာရောင် (မူလ)',
    nameEn: 'Slate Teal',
    primary: '#0d7480',
    primaryDark: '#0a5f69',
    primaryLight: '#289aa7',
    surfaceLight: '#e4f1f3',
    surfaceDark: 'rgba(13, 116, 128, 0.24)',
    borderLight: '#b8dce0',
    borderDark: 'rgba(40, 154, 167, 0.40)',
    textLight: '#095861',
    textDark: '#8ee0e8',
    onPrimary: '#ffffff',
  },
  indigo: {
    id: 'indigo',
    nameMm: 'မူလ Indigo',
    nameEn: 'Classic Indigo',
    primary: '#4f46e5',
    primaryDark: '#4338ca',
    primaryLight: '#6366f1',
    surfaceLight: '#eef2ff',
    surfaceDark: 'rgba(79, 70, 229, 0.20)',
    borderLight: '#c7d2fe',
    borderDark: 'rgba(99, 102, 241, 0.40)',
    textLight: '#4338ca',
    textDark: '#c7d2fe',
    onPrimary: '#ffffff',
  },
  blue: {
    id: 'blue',
    nameMm: 'တောက်ပ အပြာ',
    nameEn: 'Royal Blue',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',
    surfaceLight: '#eff6ff',
    surfaceDark: 'rgba(37, 99, 235, 0.20)',
    borderLight: '#bfdbfe',
    borderDark: 'rgba(59, 130, 246, 0.40)',
    textLight: '#1d4ed8',
    textDark: '#bfdbfe',
    onPrimary: '#ffffff',
  },
  emerald: {
    id: 'emerald',
    nameMm: 'မြဆင်း အစိမ်း',
    nameEn: 'Emerald Green',
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#10b981',
    surfaceLight: '#ecfdf5',
    surfaceDark: 'rgba(5, 150, 105, 0.20)',
    borderLight: '#a7f3d0',
    borderDark: 'rgba(16, 185, 129, 0.40)',
    textLight: '#047857',
    textDark: '#a7f3d0',
    onPrimary: '#ffffff',
  },
  violet: {
    id: 'violet',
    nameMm: 'မင်းသုံး ခရမ်း',
    nameEn: 'Royal Violet',
    primary: '#7c3aed',
    primaryDark: '#6d28d9',
    primaryLight: '#8b5cf6',
    surfaceLight: '#f5f3ff',
    surfaceDark: 'rgba(124, 58, 237, 0.20)',
    borderLight: '#ddd6fe',
    borderDark: 'rgba(139, 92, 246, 0.40)',
    textLight: '#6d28d9',
    textDark: '#ddd6fe',
    onPrimary: '#ffffff',
  },
  rose: {
    id: 'rose',
    nameMm: 'နှင်းဆီနီ',
    nameEn: 'Vibrant Rose',
    primary: '#e11d48',
    primaryDark: '#be123c',
    primaryLight: '#f43f5e',
    surfaceLight: '#fff1f2',
    surfaceDark: 'rgba(225, 29, 72, 0.20)',
    borderLight: '#fecdd3',
    borderDark: 'rgba(244, 63, 94, 0.40)',
    textLight: '#be123c',
    textDark: '#fecdd3',
    onPrimary: '#ffffff',
  },
  amber: {
    id: 'amber',
    nameMm: 'ရွှေဝါရောင်',
    nameEn: 'Sunset Amber',
    primary: '#d97706',
    primaryDark: '#b45309',
    primaryLight: '#f59e0b',
    surfaceLight: '#fffbeb',
    surfaceDark: 'rgba(217, 119, 6, 0.20)',
    borderLight: '#fde68a',
    borderDark: 'rgba(245, 158, 11, 0.40)',
    textLight: '#b45309',
    textDark: '#fde68a',
    onPrimary: '#ffffff',
  },
  crimson: {
    id: 'crimson',
    nameMm: 'ပတ္တမြားနီ',
    nameEn: 'Ruby Crimson',
    primary: '#dc2626',
    primaryDark: '#b91c1c',
    primaryLight: '#ef4444',
    surfaceLight: '#fef2f2',
    surfaceDark: 'rgba(220, 38, 38, 0.20)',
    borderLight: '#fecaca',
    borderDark: 'rgba(239, 68, 68, 0.40)',
    textLight: '#b91c1c',
    textDark: '#fecaca',
    onPrimary: '#ffffff',
  },
  cyan: {
    id: 'cyan',
    nameMm: 'မိုးပြာရောင်',
    nameEn: 'Sky Cyan',
    primary: '#0284c7',
    primaryDark: '#0369a1',
    primaryLight: '#38bdf8',
    surfaceLight: '#f0f9ff',
    surfaceDark: 'rgba(2, 132, 199, 0.20)',
    borderLight: '#bae6fd',
    borderDark: 'rgba(56, 189, 248, 0.40)',
    textLight: '#0369a1',
    textDark: '#bae6fd',
    onPrimary: '#ffffff',
  },
};

export const THEME_COLOR_LIST = Object.values(THEME_COLOR_PRESETS);

export const DEFAULT_THEME_COLOR_ID: ThemeColorId = 'teal';

export function isValidHexColor(hex: string): boolean {
  if (!hex) return false;
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean);
}

export function normalizeHexColor(hex: string): string {
  if (!hex) return '#0D7480';
  let clean = hex.startsWith('#') ? hex.slice(1).trim() : hex.trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return '#0D7480';
  }
  return `#${clean.toUpperCase()}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const norm = normalizeHexColor(hex).slice(1);
  const num = parseInt(norm, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function shadeHex(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent;
  const newR = Math.max(0, Math.min(255, Math.round(r * factor)));
  const newG = Math.max(0, Math.min(255, Math.round(g * factor)));
  const newB = Math.max(0, Math.min(255, Math.round(b * factor)));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`.toUpperCase();
}

export function blendHexWithWhite(hex: string, colorWeight: number): string {
  const { r, g, b } = hexToRgb(normalizeHexColor(hex));
  const newR = Math.max(0, Math.min(255, Math.round(r * colorWeight + 255 * (1 - colorWeight))));
  const newG = Math.max(0, Math.min(255, Math.round(g * colorWeight + 255 * (1 - colorWeight))));
  const newB = Math.max(0, Math.min(255, Math.round(b * colorWeight + 255 * (1 - colorWeight))));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`.toUpperCase();
}

export function getContrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Relative luminance calculation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? '#1f3038' : '#ffffff';
}

export function resolveThemeColor(
  themeColorId: ThemeColorId | string = DEFAULT_THEME_COLOR_ID,
  isDark = false
): ActiveThemeColor {
  let preset: ThemeColorPreset;

  if (themeColorId && themeColorId in THEME_COLOR_PRESETS) {
    preset = THEME_COLOR_PRESETS[themeColorId as ThemeColorId];
  } else {
    preset = THEME_COLOR_PRESETS[DEFAULT_THEME_COLOR_ID];
  }

  return {
    id: preset.id,
    nameMm: preset.nameMm,
    nameEn: preset.nameEn,
    primary: preset.primary,
    primaryDark: preset.primaryDark,
    primaryLight: preset.primaryLight,
    surface: isDark ? preset.surfaceDark : preset.surfaceLight,
    border: isDark ? preset.borderDark : preset.borderLight,
    text: isDark ? preset.textDark : preset.textLight,
    onPrimary: preset.onPrimary,
    raw: preset,
  };
}
