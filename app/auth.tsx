import { AlertCircle, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import {
  createSessionFromUrl,
  getCurrentUser,
  subscribeToAuthChanges,
} from '@/src/storage/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColor } = useAppTheme();
  const { language } = useTreasury();
  const isEn = language === 'en';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handledRef = useRef(false);

  const navigateToHome = () => {
    router.replace('/(tabs)');
  };

  useEffect(() => {
    let isMounted = true;

    const completeSuccess = () => {
      if (!isMounted) return;
      setStatus('success');
      setTimeout(() => {
        if (isMounted) {
          navigateToHome();
        }
      }, 600);
    };

    const processUrl = async (url: string | null) => {
      if (!url || handledRef.current) return;

      if (
        url.includes('access_token') ||
        url.includes('refresh_token') ||
        url.includes('code=') ||
        url.includes('error')
      ) {
        handledRef.current = true;
        const res = await createSessionFromUrl(url);
        if (res.success) {
          completeSuccess();
        } else {
          // If session is already established despite error, treat as success
          const user = await getCurrentUser();
          if (user) {
            completeSuccess();
          } else if (isMounted) {
            setStatus('error');
            setErrorMessage(res.error || 'Authentication failed. Please try again.');
          }
        }
      }
    };

    const initAuth = async () => {
      // 1. Check if user is already authenticated
      const user = await getCurrentUser();
      if (user) {
        completeSuccess();
        return;
      }

      // 2. Parse initial URL if redirected from cold start or deep link
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        await processUrl(window.location.href);
      } else {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await processUrl(initialUrl);
        }
      }
    };

    initAuth();

    // 3. Listen to incoming deep links (e.g. Chrome Custom Tabs returning to running app)
    const sub = Linking.addEventListener('url', (event) => {
      processUrl(event.url);
    });

    // 4. Listen to Supabase auth state changes
    const unsubAuth = subscribeToAuthChanges((u) => {
      if (u) {
        completeSuccess();
      }
    });

    // 5. Fallback safety timer: in case session was established in parallel
    const timer = setTimeout(async () => {
      if (!isMounted || handledRef.current) return;
      const u = await getCurrentUser();
      if (u) {
        completeSuccess();
      } else if (status === 'loading') {
        setStatus('error');
        setErrorMessage(
          isEn
            ? 'Authentication response timed out. Please try signing in again.'
            : 'အကောင့်ဝင်ရောက်မှု အချိန်ကုန်သွားပါပြီ။ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားပါ။'
        );
      }
    }, 6000);

    return () => {
      isMounted = false;
      sub.remove();
      unsubAuth();
      clearTimeout(timer);
    };
  }, []);

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      className="flex-1 items-center justify-center bg-white px-6 dark:bg-zinc-950"
    >
      <View className="w-full max-w-sm items-center rounded-3xl border border-zinc-200/80 bg-zinc-50/80 p-8 text-center shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <View
          style={{ backgroundColor: themeColor.primary }}
          className="mb-5 h-16 w-16 items-center justify-center rounded-2xl shadow-md"
        >
          <BookOpen size={32} color={themeColor.onPrimary} />
        </View>

        {status === 'loading' && (
          <View className="items-center">
            <ActivityIndicator size="large" color={themeColor.primary} className="mb-4" />
            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {isEn ? 'Completing Sign In...' : 'အကောင့်ဝင်ရောက်မှုကို အတည်ပြုနေပါသည်...'}
            </Text>
            <Text className="mt-2 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {isEn
                ? 'Please wait while we verify your session and set up cloud sync.'
                : 'Cloud sync နှင့် ချိတ်ဆက်ရန် အတည်ပြုနေပါသည်။ ခဏစောင့်ဆိုင်းပေးပါ။'}
            </Text>
          </View>
        )}

        {status === 'success' && (
          <View className="items-center">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
              <CheckCircle2 size={28} color="#059669" />
            </View>
            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {isEn ? 'Signed In Successfully!' : 'အောင်မြင်စွာ အကောင့်ဝင်ရောက်ပြီးပါပြီ!'}
            </Text>
            <Text className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
              {isEn ? 'Redirecting to your dashboard...' : 'ပင်မစာမျက်နှာသို့ ကူးပြောင်းနေပါသည်...'}
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View className="w-full items-center">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60">
              <AlertCircle size={28} color="#e11d48" />
            </View>
            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {isEn ? 'Authentication Failed' : 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ'}
            </Text>
            <Text className="mt-2 text-center text-xs leading-relaxed text-rose-600 dark:text-rose-400">
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={navigateToHome}
              style={{ backgroundColor: themeColor.primary }}
              className="mt-6 flex-row w-full items-center justify-center rounded-xl py-3 shadow-sm"
            >
              <Text style={{ color: themeColor.onPrimary }} className="mr-2 text-xs font-semibold">
                {isEn ? 'Return to Home' : 'ပင်မစာမျက်နှာသို့ ပြန်သွားမည်'}
              </Text>
              <ArrowRight size={14} color={themeColor.onPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
