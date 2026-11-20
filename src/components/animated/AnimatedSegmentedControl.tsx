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
import { useAppTheme } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
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
  activeColor?: string;
  onActiveColor?: string;
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
  inactiveTextColor,
  backgroundColor,
  style,
  className = '',
}: AnimatedSegmentedControlProps<T>) {
  const { palette } = useAppTheme();
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const [hasMeasured, setHasMeasured] = useState(false);
  const reducedMotion = useReducedMotion();

  const resolvedTrackBg = backgroundColor ?? palette.surface;
  const resolvedActiveBg = activeColor ?? palette.ink;
  const resolvedActiveText = onActiveColor ?? palette.bg;
  const resolvedInactiveText = inactiveTextColor ?? palette.muted;

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
        {
          backgroundColor: resolvedTrackBg,
          borderColor: palette.line,
          borderCurve: 'continuous',
        },
        style,
      ]}
      className={className}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: resolvedActiveBg,
            borderCurve: 'continuous',
          },
          pillAnimatedStyle,
        ]}
      />

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
          >
            {IconComponent ? (
              <IconComponent
                size={15}
                color={isActive ? resolvedActiveText : resolvedInactiveText}
              />
            ) : null}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? resolvedActiveText : resolvedInactiveText,
                  fontFamily: isActive ? fonts.semibold : fonts.medium,
                  marginLeft: IconComponent ? 7 : 0,
                },
              ]}
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
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: 4,
    left: 0,
    borderRadius: 9,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 13,
  },
});
