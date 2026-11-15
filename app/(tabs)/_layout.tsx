import { BarChart3, Gavel, HeartHandshake, Users } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const bottomInset = Platform.OS === 'web' ? 0 : Math.max(insets.bottom, 12);
  const tabHeight = Platform.OS === 'web' ? 64 : 60 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#a5b4fc' : '#4338ca',
        tabBarInactiveTintColor: isDark ? '#71717a' : '#71717a',
        tabBarActiveBackgroundColor: isDark
          ? 'rgba(99, 102, 241, 0.22)'
          : 'rgba(79, 70, 229, 0.12)',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarLabelPosition: Platform.OS === 'web' ? 'beside-icon' : 'below-icon',
        tabBarItemStyle: {
          borderRadius: 20,
          marginHorizontal: 4,
          marginVertical: 4,
          paddingVertical: 4,
          paddingHorizontal: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#09090b' : '#ffffff',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 4,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginLeft: Platform.OS === 'web' ? 6 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'အခမ်းအနား',
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <HeartHandshake size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fines"
        options={{
          title: 'ဒဏ်ကြေး',
          tabBarLabel: 'Fines',
          tabBarIcon: ({ color, size }) => (
            <Gavel size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          title: 'ကျောင်းသား',
          tabBarLabel: 'Roster',
          tabBarIcon: ({ color, size }) => (
            <Users size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'အစီရင်ခံစာ',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size || 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
