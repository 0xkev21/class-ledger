import { CheckCircle2 } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    if (message) {
      // Entrance
      opacity.value = withTiming(1, { duration: 200, easing: EASE_OUT });
      translateY.value = reducedMotion
        ? 0
        : withSpring(0, { duration: 300, dampingRatio: 1 });

      exitTimer = setTimeout(() => {
        // Exit
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
      <View className="flex-row items-center rounded-full bg-zinc-900/95 dark:bg-white/95 px-5 py-3 shadow-lg">
        <CheckCircle2 size={18} color="#10b981" />
        <Text className="ml-2.5 text-xs font-bold text-white dark:text-zinc-900">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};
