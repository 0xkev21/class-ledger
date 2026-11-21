import { Platform } from 'react-native';
import { Color } from 'expo-router';
import {
  DEFAULT_THEME_COLOR_ID,
  hexToRgb,
  THEME_COLOR_PRESETS,
  ThemeColorId,
} from './themeColors';

export * from './themeColors';

export interface SurfacePalette {
  bg: string;
  surface: string;
  card: string;
  ink: string;
  muted: string;
  subtle: string;
  line: string;
  lineStrong: string;
  headerBg: string;
  paidBg: string;
  paidText: string;
  unpaidBg: string;
  unpaidText: string;
  dangerBg: string;
  dangerText: string;
}

/**
 * Cool-white-slate surface & ink tokens aligned with public/landing/index.html.
 */
export const surfaces: { light: SurfacePalette; dark: SurfacePalette } = {
  light: {
    bg: '#f7f9fa',
    surface: '#ecf0f2',
    card: '#ffffff',
    ink: '#1f3038',
    muted: '#5d6b72',
    subtle: '#48565d',
    line: 'rgba(31, 48, 56, 0.11)',
    lineStrong: 'rgba(31, 48, 56, 0.22)',
    headerBg: 'rgba(247, 249, 250, 0.94)',
    paidBg: '#e3f3ea',
    paidText: '#14532d',
    unpaidBg: '#fbeedb',
    unpaidText: '#78350f',
    dangerBg: '#fef2f2',
    dangerText: '#b91c1c',
  },
  dark: {
    bg: '#16232a',
    surface: '#24343d',
    card: '#1f3038',
    ink: '#f7f9fa',
    muted: '#9ea7ab',
    subtle: '#b6c0c4',
    line: 'rgba(247, 249, 250, 0.12)',
    lineStrong: 'rgba(247, 249, 250, 0.24)',
    headerBg: 'rgba(22, 35, 42, 0.94)',
    paidBg: 'rgba(22, 163, 74, 0.18)',
    paidText: '#86efac',
    unpaidBg: 'rgba(217, 119, 6, 0.20)',
    unpaidText: '#fcd34d',
    dangerBg: 'rgba(220, 38, 38, 0.20)',
    dangerText: '#fca5a5',
  },
};

function mixHex(baseHex: string, tintHex: string, tintWeight: number): string {
  const base = hexToRgb(baseHex);
  const tint = hexToRgb(tintHex);
  const r = Math.max(0, Math.min(255, Math.round(base.r * (1 - tintWeight) + tint.r * tintWeight)));
  const g = Math.max(0, Math.min(255, Math.round(base.g * (1 - tintWeight) + tint.g * tintWeight)));
  const b = Math.max(0, Math.min(255, Math.round(base.b * (1 - tintWeight) + tint.b * tintWeight)));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates a subtle accent-tinted surface palette for light and dark modes.
 * Keeps the default Slate Teal preset exact while tinting neutrals for all other accents.
 */
export function getSurfacePalette(
  themeColorId: ThemeColorId | string = DEFAULT_THEME_COLOR_ID,
  isDark = false
): SurfacePalette {
  if (!themeColorId || themeColorId === DEFAULT_THEME_COLOR_ID || !(themeColorId in THEME_COLOR_PRESETS)) {
    return isDark ? surfaces.dark : surfaces.light;
  }

  const primary = THEME_COLOR_PRESETS[themeColorId as ThemeColorId].primary;

  if (isDark) {
    const bg = mixHex('#15171a', primary, 0.12);
    const card = mixHex('#1e2125', primary, 0.14);
    const surface = mixHex('#24282d', primary, 0.14);
    const ink = mixHex('#f8f9fa', primary, 0.03);
    const muted = mixHex('#9fa4aa', primary, 0.06);
    const subtle = mixHex('#b8bec4', primary, 0.06);
    const bgRgb = hexToRgb(bg);
    const inkRgb = hexToRgb(ink);

    return {
      ...surfaces.dark,
      bg,
      surface,
      card,
      ink,
      muted,
      subtle,
      line: `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0.12)`,
      lineStrong: `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0.24)`,
      headerBg: `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.94)`,
    };
  }

  const bg = mixHex('#f8f9fa', primary, 0.03);
  const surface = mixHex('#edf0f2', primary, 0.05);
  const ink = mixHex('#1c2024', primary, 0.14);
  const muted = mixHex('#61666b', primary, 0.08);
  const subtle = mixHex('#4a5056', primary, 0.10);
  const bgRgb = hexToRgb(bg);
  const inkRgb = hexToRgb(ink);

  return {
    ...surfaces.light,
    bg,
    surface,
    card: '#ffffff',
    ink,
    muted,
    subtle,
    line: `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0.11)`,
    lineStrong: `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0.22)`,
    headerBg: `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.94)`,
  };
}

/**
 * Bundled font family names registered in app/_layout.tsx (Outfit + DM Mono).
 */
export const fonts = {
  regular: 'Outfit-Regular',
  medium: 'Outfit-Medium',
  semibold: 'Outfit-SemiBold',
  bold: 'Outfit-Bold',
  mono: 'DMMono-Regular',
  monoMedium: 'DMMono-Medium',
} as const;

/**
 * Platform semantic colors that automatically resolve on device and adapt to color schemes.
 */
export const colors = {
  label: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: '#1f3038',
  })!,
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: '#5d6b72',
  })!,
  tertiaryLabel: Platform.select({
    ios: Color.ios.tertiaryLabel,
    android: Color.android.dynamic.outline,
    default: '#9ea7ab',
  })!,
  separator: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: '#d8e0e4',
  })!,
  systemBackground: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: '#f7f9fa',
  })!,
  secondarySystemBackground: Platform.select({
    ios: Color.ios.secondarySystemBackground,
    android: Color.android.dynamic.surfaceVariant,
    default: '#ecf0f2',
  })!,
  systemIndigo: Platform.select({
    ios: Color.ios.systemIndigo,
    android: Color.android.dynamic.primary,
    default: '#0d7480',
  })!,
  systemBlue: Platform.select({
    ios: Color.ios.systemBlue,
    android: Color.android.dynamic.primary,
    default: '#0d7480',
  })!,
  systemGreen: Platform.select({
    ios: Color.ios.systemGreen,
    android: Color.android.dynamic.tertiary,
    default: '#16a34a',
  })!,
  systemRed: Platform.select({
    ios: Color.ios.systemRed,
    android: Color.android.dynamic.error,
    default: '#dc2626',
  })!,
  systemOrange: Platform.select({
    ios: Color.ios.systemOrange,
    android: Color.android.dynamic.errorContainer,
    default: '#ea580c',
  })!,
  onTint: '#ffffff',
} as const;

/**
 * 4-point spacing scale
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  compact: 12,
  md: 16,
  comfortable: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Standard border radius tokens
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 24,
  full: 9999,
} as const;

/**
 * Motion duration tokens (in ms)
 */
export const motion = {
  instant: 100,
  fast: 150,
  base: 250,
  slow: 400,
} as const;
