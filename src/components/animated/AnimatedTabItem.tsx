import React, { useEffect } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export interface AnimatedTabItemProps {
  focused: boolean;
  color?: ColorValue;
  surfaceColor: string;
  activeColor?: string;
  children: React.ReactNode;
}

/**
 * Clean tonal pill highlight for mobile bottom tab items.
 */
export const AnimatedTabItem: React.FC<AnimatedTabItemProps> = ({
  focused,
  surfaceColor,
  children,
}) => {
  const reducedMotion = useReducedMotion();
  const pillOpacity = useSharedValue(focused ? 1 : 0);
  const pillScale = useSharedValue(focused ? 1 : 0.85);

  useEffect(() => {
    if (reducedMotion) {
      pillOpacity.value = focused ? 1 : 0;
      pillScale.value = focused ? 1 : 0.85;
      return;
    }

    pillOpacity.value = withTiming(focused ? 1 : 0, { duration: 160 });
    pillScale.value = withTiming(focused ? 1 : 0.85, { duration: 180 });
  }, [focused, reducedMotion]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scale: pillScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.pillWrapper}>
        <Animated.View
          style={[
            styles.pill,
            { backgroundColor: surfaceColor },
            pillAnimatedStyle,
          ]}
        />
        <View style={styles.iconWrapper}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  pillWrapper: {
    height: 28,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    inset: 0,
    height: 28,
    width: 52,
    borderRadius: 14,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
