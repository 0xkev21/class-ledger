import '../global.css';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono/400Regular';
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono/500Medium';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { ErrorBoundary as DefaultErrorBoundary, ErrorBoundaryProps } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TreasuryProvider, useAppTheme } from '@/src/context/TreasuryContext';

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

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
    'DMMono-Regular': DMMono_400Regular,
    'DMMono-Medium': DMMono_500Medium,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded && Platform.OS !== 'web') {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TreasuryProvider>
        <ThemedNavigationRoot />
      </TreasuryProvider>
    </GestureHandlerRootView>
  );
}

function ThemedNavigationRoot() {
  const { isDark, palette, themeColor } = useAppTheme();
  const [hasHydrated, setHasHydrated] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.toggle('dark', isDark);
      root.classList.toggle('light', !isDark);

      root.style.setProperty('--bg-page', palette.bg);
      root.style.setProperty('--bg-header', palette.headerBg);
      root.style.setProperty('--border-header', palette.line);
      root.style.setProperty('--bg-tabbar', palette.card);
      root.style.setProperty('--border-tabbar', palette.line);
      root.style.setProperty('--tab-inactive', palette.muted);
      root.style.setProperty('--bg-card', palette.card);
      root.style.setProperty('--border-card', palette.line);
      root.style.setProperty('--bg-surface', palette.surface);
      root.style.setProperty('--text-primary', palette.ink);
      root.style.setProperty('--text-muted', palette.muted);

      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute('content', palette.bg);
      }
    }
  }, [hasHydrated, isDark, palette]);

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    const primary = isDark ? themeColor.primaryLight : themeColor.primary;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary,
        background: palette.bg,
        card: palette.card,
        text: palette.ink,
        border: palette.lineStrong,
        notification: primary,
      },
    };
  }, [isDark, palette, themeColor]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
