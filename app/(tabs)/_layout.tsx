import { BarChart3, Gavel, HeartHandshake, Settings2, Users } from 'lucide-react-native';
import { ErrorBoundaryProps, Tabs } from 'expo-router';
import { ErrorBoundary as DefaultErrorBoundary } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesktopTopNav } from '@/src/components/DesktopTopNav';
import { NativeIcon } from '@/src/components/NativeIcon';
import { AnimatedTabButton } from '@/src/components/animated/AnimatedTabButton';
import { AnimatedTabItem } from '@/src/components/animated/AnimatedTabItem';
import { useAppTheme, useTranslation } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';

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
  const { themeColor, isDark, palette } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const [hasMounted, setHasMounted] = useState(!isWeb);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isDesktop = hasMounted && width >= 1024;

  const bottomInset = isWeb ? 8 : Math.max(insets.bottom, 8);
  const tabHeight = 60 + bottomInset;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {isDesktop ? <DesktopTopNav /> : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontFamily: fonts.medium,
            fontSize: 11,
            marginTop: 2,
          },
          tabBarActiveTintColor: isDark ? themeColor.primaryLight : themeColor.primary,
          tabBarInactiveTintColor: palette.muted,
          tabBarHideOnKeyboard: true,
          tabBarButton: ({ ref, ...props }) => (
            <AnimatedTabButton {...props} />
          ),
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarStyle: isDesktop
            ? { display: 'none' }
            : {
                backgroundColor: palette.card,
                borderTopColor: palette.line,
                borderTopWidth: 1,
                elevation: 0,
                shadowOpacity: 0,
                height: tabHeight,
                paddingBottom: bottomInset,
                paddingTop: 6,
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
    </View>
  );
}
