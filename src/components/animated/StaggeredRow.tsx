import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
  useReducedMotion,
} from 'react-native-reanimated';

export interface StaggeredRowProps {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  durationMs?: number;
  staggerMs?: number;
  maxDelayMs?: number;
}

// Module scope reflow transition — prevents builder recreation on render
const ROW_REFLOW = LinearTransition.duration(200);

export const StaggeredRow: React.FC<StaggeredRowProps> = ({
  index,
  children,
  style,
  className,
  durationMs = 240,
  staggerMs = 35,
  maxDelayMs = 300,
}) => {
  const reducedMotion = useReducedMotion();
  const delay = Math.min(index * staggerMs, maxDelayMs);

  const entering = useMemo(() => {
    if (reducedMotion) {
      return FadeIn.duration(durationMs);
    }
    return FadeInDown.duration(durationMs).delay(delay);
  }, [index, durationMs, delay, reducedMotion]);

  const exiting = useMemo(() => {
    if (reducedMotion) {
      return FadeOut.duration(150);
    }
    return FadeOutDown.duration(180);
  }, [reducedMotion]);

  return (
    <Animated.View
      entering={entering}
      exiting={exiting}
      layout={ROW_REFLOW}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
};
