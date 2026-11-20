import { Platform } from 'react-native';
import { Color } from 'expo-router';

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
