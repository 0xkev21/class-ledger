import { BarChart3, Gavel, HeartHandshake, Settings2, Users } from 'lucide-react-native';
import { ErrorBoundaryProps, Tabs } from 'expo-router';
import { ErrorBoundary as DefaultErrorBoundary } from 'expo-router';
import React, { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeIcon } from '@/src/components/NativeIcon';
import { AnimatedTabButton } from '@/src/components/animated/AnimatedTabButton';
import { AnimatedTabItem } from '@/src/components/animated/AnimatedTabItem';
import { useAppTheme, useTranslation } from '@/src/context/TreasuryContext';

/**
 * Resilient Tab Error Boundary:
 * Prevents transient Metro web chunk network errors from flashing on tab transitions.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('fetch') ||
      error?.name === 'AsyncRequireError'
    ) {
      const timer = setTimeout(() => {
        retry();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [error, retry]);

  if (
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('fetch') ||
    error?.name === 'AsyncRequireError'
  ) {
    return null;
  }

  return <DefaultErrorBoundary error={error} retry={retry} />;
}

export default function TabLayout() {
  const { themeColor, isDark } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isWeb = process.env.EXPO_OS === 'web';

  const bottomInset = isWeb ? 8 : Math.max(insets.bottom, 8);
  const tabHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: isDark ? themeColor.primaryLight : themeColor.primary,
        tabBarInactiveTintColor: isWeb ? 'var(--tab-inactive)' : (isDark ? '#a1a1aa' : '#71717a'),
        tabBarHideOnKeyboard: true,
        tabBarButton: ({ ref, ...props }) => (
          <AnimatedTabButton {...props} />
        ),
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: isWeb ? 'var(--bg-tabbar)' : (isDark ? '#09090b' : '#ffffff'),
          borderTopColor: isWeb ? 'var(--border-tabbar)' : (isDark ? '#27272a' : '#f4f4f5'),
          borderTopWidth: 1,
          elevation: isDark ? 0 : 4,
          shadowColor: '#000000',
          shadowOpacity: isDark ? 0 : 0.05,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 4,
          paddingHorizontal: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.events,
          tabBarAccessibilityLabel: t.tabs.events,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabItem
              focused={focused}
              color={color}
              surfaceColor={themeColor.surface}
              activeColor={isDark ? themeColor.primaryLight : themeColor.primary}
            >
              <NativeIcon
                sfSymbol="sparkles"
                materialName="event"
                FallbackIcon={HeartHandshake}
                color={color}
                size={22}
              />
            </AnimatedTabItem>
          ),
        }}
      />
      <Tabs.Screen
        name="fines"
        options={{
          title: t.tabs.fines,
          tabBarAccessibilityLabel: t.tabs.fines,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabItem
              focused={focused}
              color={color}
              surfaceColor={themeColor.surface}
              activeColor={isDark ? themeColor.primaryLight : themeColor.primary}
            >
              <NativeIcon
                sfSymbol="exclamationmark.triangle.fill"
                materialName="gavel"
                FallbackIcon={Gavel}
                color={color}
                size={22}
              />
            </AnimatedTabItem>
          ),
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          title: t.tabs.roster,
          tabBarAccessibilityLabel: t.tabs.roster,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabItem
              focused={focused}
              color={color}
              surfaceColor={themeColor.surface}
              activeColor={isDark ? themeColor.primaryLight : themeColor.primary}
            >
              <NativeIcon
                sfSymbol="person.2.fill"
                materialName="people"
                FallbackIcon={Users}
                color={color}
                size={22}
              />
            </AnimatedTabItem>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t.tabs.reports,
          tabBarAccessibilityLabel: t.tabs.reports,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabItem
              focused={focused}
              color={color}
              surfaceColor={themeColor.surface}
              activeColor={isDark ? themeColor.primaryLight : themeColor.primary}
            >
              <NativeIcon
                sfSymbol="chart.bar.fill"
                materialName="bar-chart"
                FallbackIcon={BarChart3}
                color={color}
                size={22}
              />
            </AnimatedTabItem>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarAccessibilityLabel: t.tabs.settings,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabItem
              focused={focused}
              color={color}
              surfaceColor={themeColor.surface}
              activeColor={isDark ? themeColor.primaryLight : themeColor.primary}
            >
              <NativeIcon
                sfSymbol="gear"
                materialName="settings"
                FallbackIcon={Settings2}
                color={color}
                size={22}
              />
            </AnimatedTabItem>
          ),
        }}
      />
    </Tabs>
  );
}
