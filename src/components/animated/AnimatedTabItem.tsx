import React, { useEffect } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface AnimatedTabItemProps {
  focused: boolean;
  color?: ColorValue;
  surfaceColor: string;
  activeColor: string;
  children: React.ReactNode;
}

export const AnimatedTabItem: React.FC<AnimatedTabItemProps> = ({
  focused,
  color,
  surfaceColor,
  activeColor,
  children,
}) => {
  const reducedMotion = useReducedMotion();

  const pillScale = useSharedValue(focused ? 1 : 0.65);
  const pillOpacity = useSharedValue(focused ? 1 : 0);
  const pillWidth = useSharedValue(focused ? 56 : 36);

  const iconScale = useSharedValue(focused ? 1.06 : 1);
  const iconTranslateY = useSharedValue(0);

  const dotScale = useSharedValue(focused ? 1 : 0);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      pillScale.value = focused ? 1 : 0.65;
      pillOpacity.value = focused ? 1 : 0;
      pillWidth.value = focused ? 56 : 36;
      iconScale.value = focused ? 1.06 : 1;
      iconTranslateY.value = 0;
      dotScale.value = focused ? 1 : 0;
      dotOpacity.value = focused ? 1 : 0;
      return;
    }

    if (focused) {
      // Elastic spring expand for active pill
      pillScale.value = withSpring(1, { duration: 280, dampingRatio: 0.65 });
      pillOpacity.value = withTiming(1, { duration: 180 });
      pillWidth.value = withSpring(56, { duration: 280, dampingRatio: 0.68 });

      // Playful bounce & pop for active icon
      iconScale.value = withSequence(
        withTiming(1.22, { duration: 120 }),
        withSpring(1.06, { duration: 240, dampingRatio: 0.55 })
      );
      iconTranslateY.value = withSequence(
        withTiming(-3, { duration: 110 }),
        withSpring(0, { duration: 240, dampingRatio: 0.55 })
      );

      // Micro accent dot
      dotScale.value = withSpring(1, { duration: 250, dampingRatio: 0.6 });
      dotOpacity.value = withTiming(1, { duration: 180 });
    } else {
      pillScale.value = withTiming(0.65, { duration: 150 });
      pillOpacity.value = withTiming(0, { duration: 140 });
      pillWidth.value = withTiming(36, { duration: 150 });

      iconScale.value = withSpring(1.0, { duration: 200, dampingRatio: 0.7 });
      iconTranslateY.value = withSpring(0, { duration: 200, dampingRatio: 0.7 });

      dotScale.value = withTiming(0, { duration: 120 });
      dotOpacity.value = withTiming(0, { duration: 120 });
    }
  }, [focused, reducedMotion]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
    opacity: pillOpacity.value,
    width: pillWidth.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: iconTranslateY.value },
      { scale: iconScale.value },
    ],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
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
        <Animated.View style={[styles.iconWrapper, iconAnimatedStyle]}>
          {children}
        </Animated.View>
      </View>
      <Animated.View
        style={[
          styles.activeDot,
          { backgroundColor: activeColor },
          dotAnimatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  pillWrapper: {
    height: 36,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    height: 36,
    borderRadius: 18,
    alignSelf: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
