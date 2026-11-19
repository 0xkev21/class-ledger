import { Platform, Vibration } from 'react-native';

/**
 * Safe haptic feedback wrapper.
 * Dynamically uses expo-haptics when available, with native React Native Vibration fallback
 * on Android and web so touch clicks always provide crisp tactile physical feedback.
 */
export const Haptics = {
  selectionAsync: async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-haptics');
      if (mod?.selectionAsync) {
        await mod.selectionAsync();
        return;
      }
    } catch {}

    if (Platform.OS === 'android') {
      try {
        Vibration.vibrate(10);
      } catch {}
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  },
  impactLightAsync: async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-haptics');
      if (mod?.impactAsync && mod.ImpactFeedbackStyle) {
        await mod.impactAsync(mod.ImpactFeedbackStyle.Light);
        return;
      }
    } catch {}

    if (Platform.OS === 'android') {
      try {
        Vibration.vibrate(14);
      } catch {}
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(14);
      } catch {}
    }
  },
  impactMediumAsync: async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-haptics');
      if (mod?.impactAsync && mod.ImpactFeedbackStyle) {
        await mod.impactAsync(mod.ImpactFeedbackStyle.Medium);
        return;
      }
    } catch {}

    if (Platform.OS === 'android') {
      try {
        Vibration.vibrate(28);
      } catch {}
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(28);
      } catch {}
    }
  },
  notificationSuccessAsync: async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-haptics');
      if (mod?.notificationAsync && mod.NotificationFeedbackType) {
        await mod.notificationAsync(mod.NotificationFeedbackType.Success);
        return;
      }
    } catch {}

    if (Platform.OS === 'android') {
      try {
        Vibration.vibrate([0, 15, 60, 20]);
      } catch {}
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([15, 60, 20]);
      } catch {}
    }
  },
};
