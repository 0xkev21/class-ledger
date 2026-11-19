import { BarChart3, Gavel, HeartHandshake, Settings2, Users } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeIcon } from '@/src/components/NativeIcon';
import { useAppTheme, useTranslation } from '@/src/context/TreasuryContext';

export default function TabLayout() {
  const { themeColor, isDark } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isWeb = process.env.EXPO_OS === 'web';

  const bottomInset = isWeb ? 8 : Math.max(insets.bottom, 8);
  const tabHeight = 52 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: isDark ? themeColor.primaryLight : themeColor.primary,
        tabBarInactiveTintColor: isDark ? '#a1a1aa' : '#71717a',
        tabBarHideOnKeyboard: true,
        tabBarButton: ({ ref, ...props }) => (
          <Pressable
            {...props}
            android_ripple={{ color: 'transparent' }}
          />
        ),
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#09090b' : '#ffffff',
          borderTopColor: isDark ? '#27272a' : '#f4f4f5',
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
            <View
              style={{
                backgroundColor: focused ? themeColor.surface : 'transparent',
                borderRadius: 18,
                height: 36,
                minWidth: 52,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NativeIcon
                sfSymbol="sparkles"
                materialName="event"
                FallbackIcon={HeartHandshake}
                color={color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="fines"
        options={{
          title: t.tabs.fines,
          tabBarAccessibilityLabel: t.tabs.fines,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? themeColor.surface : 'transparent',
                borderRadius: 18,
                height: 36,
                minWidth: 52,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NativeIcon
                sfSymbol="exclamationmark.triangle.fill"
                materialName="gavel"
                FallbackIcon={Gavel}
                color={color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          title: t.tabs.roster,
          tabBarAccessibilityLabel: t.tabs.roster,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? themeColor.surface : 'transparent',
                borderRadius: 18,
                height: 36,
                minWidth: 52,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NativeIcon
                sfSymbol="person.2.fill"
                materialName="people"
                FallbackIcon={Users}
                color={color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t.tabs.reports,
          tabBarAccessibilityLabel: t.tabs.reports,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? themeColor.surface : 'transparent',
                borderRadius: 18,
                height: 36,
                minWidth: 52,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NativeIcon
                sfSymbol="chart.bar.fill"
                materialName="bar-chart"
                FallbackIcon={BarChart3}
                color={color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarAccessibilityLabel: t.tabs.settings,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? themeColor.surface : 'transparent',
                borderRadius: 18,
                height: 36,
                minWidth: 52,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NativeIcon
                sfSymbol="gear"
                materialName="settings"
                FallbackIcon={Settings2}
                color={color}
                size={22}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
