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
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TreasuryProvider, useAppTheme } from '@/src/context/TreasuryContext';
import { surfaces } from '@/src/theme';

const LedgerLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0d7480',
    background: surfaces.light.bg,
    card: surfaces.light.card,
    text: surfaces.light.ink,
    border: '#d8e0e4',
    notification: '#0d7480',
  },
};

const LedgerDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#289aa7',
    background: surfaces.dark.bg,
    card: surfaces.dark.card,
    text: surfaces.dark.ink,
    border: '#2c3c44',
    notification: '#289aa7',
  },
};

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
  const { isDark } = useAppTheme();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute('content', isDark ? '#16232a' : '#f7f9fa');
      }
    }
  }, [isDark]);

  return (
    <ThemeProvider value={isDark ? LedgerDarkTheme : LedgerLightTheme}>
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
