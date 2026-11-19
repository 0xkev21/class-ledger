import React, { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Haptics } from '@/src/utils/haptics';
import { EASE_IN_OUT } from '@/src/utils/motion';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ size: number; color: string }>;
  badge?: number | string;
}

export interface AnimatedSegmentedControlProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  activeColor: string;
  onActiveColor: string;
  inactiveTextColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export function AnimatedSegmentedControl<T extends string = string>({
  tabs,
  activeId,
  onChange,
  activeColor,
  onActiveColor,
  inactiveTextColor = '#71717a',
  backgroundColor = '#f4f4f5',
  style,
  className = '',
}: AnimatedSegmentedControlProps<T>) {
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const [hasMeasured, setHasMeasured] = useState(false);
  const reducedMotion = useReducedMotion();

  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);

  const handleLayout = (id: string, e: LayoutChangeEvent) => {
    const layout = e.nativeEvent.layout;
    setLayouts((prev) => {
      if (
        prev[id] &&
        prev[id].x === layout.x &&
        prev[id].width === layout.width &&
        prev[id].height === layout.height
      ) {
        return prev;
      }
      return { ...prev, [id]: layout };
    });
  };

  useEffect(() => {
    const currentLayout = layouts[activeId];
    if (!currentLayout) return;

    if (!hasMeasured) {
      x.set(currentLayout.x);
      w.set(currentLayout.width);
      h.set(currentLayout.height);
      setHasMeasured(true);
      return;
    }

    if (reducedMotion) {
      x.set(currentLayout.x);
      w.set(currentLayout.width);
      h.set(currentLayout.height);
    } else {
      x.set(withTiming(currentLayout.x, { duration: 240, easing: EASE_IN_OUT }));
      w.set(withTiming(currentLayout.width, { duration: 240, easing: EASE_IN_OUT }));
      h.set(currentLayout.height);
    }
  }, [activeId, layouts, hasMeasured, reducedMotion]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    width: w.get(),
    height: h.get() || '100%',
    opacity: hasMeasured ? 1 : 0,
  }));

  const handleTabPress = (id: T) => {
    if (id !== activeId) {
      Haptics.selectionAsync();
      onChange(id);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderCurve: 'continuous' },
        style,
      ]}
      className={`relative flex-row p-1 rounded-full border border-zinc-200/70 dark:border-zinc-800/80 overflow-hidden ${className}`}
    >
      {/* Sliding Pill Indicator (out-of-flow absolute with no children) */}
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: activeColor,
            borderCurve: 'continuous',
          },
          pillAnimatedStyle,
        ]}
      />

      {/* Interactive Tabs */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const IconComponent = tab.icon;

        return (
          <Pressable
            key={tab.id}
            onPress={() => handleTabPress(tab.id)}
            onLayout={(e) => handleLayout(tab.id, e)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
            className="flex-1 flex-row items-center justify-center py-2.5 rounded-full z-10"
          >
            {IconComponent ? (
              <IconComponent
                size={16}
                color={isActive ? onActiveColor : inactiveTextColor}
              />
            ) : null}
            <Text
              style={{
                color: isActive ? onActiveColor : inactiveTextColor,
              }}
              className={`${IconComponent ? 'ml-2' : ''} text-xs font-bold`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
  },
  pill: {
    position: 'absolute',
    top: 4,
    left: 0,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    backgroundColor: 'transparent',
  },
});
