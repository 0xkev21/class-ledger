import { CheckCircle2 } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(0);
      translateY.setValue(-20);
    }
  }, [message, duration, onHide, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: Math.max(insets.top, 16) + 8,
        left: 24,
        right: 24,
        zIndex: 9999,
        alignItems: 'center',
        opacity,
        transform: [{ translateY }],
      }}
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
