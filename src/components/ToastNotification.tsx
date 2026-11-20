import { CheckCircle2 } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { fonts, surfaces } from '@/src/theme';
import { EASE_OUT } from '@/src/utils/motion';

interface ToastNotificationProps {
  message: string | null;
  onHide: () => void;
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  onHide,
  duration = 2400,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    if (message) {
      opacity.value = withTiming(1, { duration: 200, easing: EASE_OUT });
      translateY.value = reducedMotion
        ? 0
        : withSpring(0, { duration: 300, dampingRatio: 1 });

      exitTimer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 180, easing: EASE_OUT });
        if (!reducedMotion) {
          translateY.value = withTiming(-20, { duration: 180, easing: EASE_OUT });
        }

        hideTimer = setTimeout(() => {
          onHideRef.current();
        }, 180);
      }, duration);
    } else {
      opacity.value = 0;
      translateY.value = -20;
    }

    return () => {
      if (exitTimer) clearTimeout(exitTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [message, duration, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  const toastBg = isDark ? surfaces.light.bg : surfaces.dark.card;
  const toastText = isDark ? surfaces.light.ink : surfaces.dark.ink;
  const iconColor = isDark ? surfaces.light.paidText : '#34d399';

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: Math.max(insets.top, 16) + 8,
          left: 24,
          right: 24,
          zIndex: 9999,
          alignItems: 'center',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: toastBg,
          },
        ]}
      >
        <CheckCircle2 size={18} color={iconColor} />
        <Text
          style={[
            styles.message,
            {
              color: toastText,
              fontFamily: fonts.medium,
            },
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    shadowColor: '#1f3038',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  message: {
    marginLeft: 10,
    fontSize: 13,
  },
});
