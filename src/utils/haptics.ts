/**
 * Safe haptic feedback wrapper.
 * Dynamically uses expo-haptics when installed, or gracefully no-ops on platforms without support.
 */
export const Haptics = {
  selectionAsync: async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-haptics');
      if (mod?.selectionAsync) {
        await mod.selectionAsync();
      }
    } catch {}
  },
  impactLightAsync: async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-haptics');
      if (mod?.impactAsync && mod.ImpactFeedbackStyle) {
        await mod.impactAsync(mod.ImpactFeedbackStyle.Light);
      }
    } catch {}
  },
  impactMediumAsync: async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-haptics');
      if (mod?.impactAsync && mod.ImpactFeedbackStyle) {
        await mod.impactAsync(mod.ImpactFeedbackStyle.Medium);
      }
    } catch {}
  },
  notificationSuccessAsync: async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-haptics');
      if (mod?.notificationAsync && mod.NotificationFeedbackType) {
        await mod.notificationAsync(mod.NotificationFeedbackType.Success);
      }
    } catch {}
  },
};
