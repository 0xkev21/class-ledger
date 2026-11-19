import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Haptics } from '@/src/utils/haptics';

export interface AnimatedTabButtonProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const AnimatedTabButton: React.FC<AnimatedTabButtonProps> = ({
  onPress,
  onPressIn,
  onPressOut,
  children,
  style,
  ...rest
}) => {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const handlePressIn = (e: GestureResponderEvent) => {
    Haptics.selectionAsync();
    if (!reducedMotion) {
      scale.value = withSpring(0.90, { duration: 120, dampingRatio: 0.7 });
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    if (!reducedMotion) {
      scale.value = withSpring(1.0, { duration: 250, dampingRatio: 0.55 });
    }
    onPressOut?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: 'transparent' }}
      style={[styles.pressable, style]}
    >
      <Animated.View style={[styles.inner, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
