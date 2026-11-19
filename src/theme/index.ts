import { Platform } from 'react-native';
import { Color } from 'expo-router';

export * from './themeColors';

/**
 * Platform semantic colors that automatically resolve on device and adapt to color schemes.
 */
export const colors = {
  label: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: '#09090b',
  })!,
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: '#71717a',
  })!,
  tertiaryLabel: Platform.select({
    ios: Color.ios.tertiaryLabel,
    android: Color.android.dynamic.outline,
    default: '#a1a1aa',
  })!,
  separator: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: '#e4e4e7',
  })!,
  systemBackground: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: '#ffffff',
  })!,
  secondarySystemBackground: Platform.select({
    ios: Color.ios.secondarySystemBackground,
    android: Color.android.dynamic.surfaceVariant,
    default: '#f4f4f5',
  })!,
  systemIndigo: Platform.select({
    ios: Color.ios.systemIndigo,
    android: Color.android.dynamic.primary,
    default: '#4f46e5',
  })!,
  systemBlue: Platform.select({
    ios: Color.ios.systemBlue,
    android: Color.android.dynamic.primary,
    default: '#007aff',
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
