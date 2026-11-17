import { Platform } from 'react-native';
import { Color } from 'expo-router';

export * from '@/src/theme/themeColors';

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
    default: '#e4e4e7',
  })!,
  systemBackground: Platform.select({
    ios: Color.ios.systemBackground,
    default: '#ffffff',
  })!,
  secondarySystemBackground: Platform.select({
    ios: Color.ios.secondarySystemBackground,
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
};
