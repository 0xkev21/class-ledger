import React, { useState } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  cubicBezier,
  useReducedMotion,
} from 'react-native-reanimated';
import { cssInterop } from 'nativewind';
import { Haptics } from '@/src/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressable, { className: 'style' });

export interface PressableScaleProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  targetScale?: number;
  durationMs?: number;
  className?: string;
  hapticFeedback?: boolean | 'selection' | 'light' | 'medium';
  children: React.ReactNode;
}

const DEFAULT_TIMING = cubicBezier(0.23, 1, 0.32, 1);

export const PressableScale: React.FC<PressableScaleProps> = ({
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  children,
  style,
  className,
  targetScale = 0.97,
  durationMs = 120,
  hitSlop = 12,
  pressRetentionOffset = 16,
  hapticFeedback = true,
  ...rest
}) => {
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();

  const isPressed = !disabled && pressed;
  const activeScale = reducedMotion ? 1 : targetScale;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        if (hapticFeedback !== false) {
          if (hapticFeedback === 'medium') {
            Haptics.impactMediumAsync();
          } else if (hapticFeedback === 'light') {
            Haptics.impactLightAsync();
          } else {
            Haptics.selectionAsync();
          }
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      accessibilityRole="button"
      className={className}
      style={[
        styles.box,
        {
          transitionDuration: `${durationMs}ms`,
        },
        isPressed && {
          transform: [{ scale: activeScale }],
        },
        style as any,
      ]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  box: {
    transform: [{ scale: 1 }],
    transitionProperty: 'transform',
    transitionTimingFunction: DEFAULT_TIMING as any,
  },
});
