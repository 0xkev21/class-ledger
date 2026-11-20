import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/BrandMark';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import {
  createSessionFromUrl,
  getCurrentUser,
  subscribeToAuthChanges,
} from '@/src/storage/supabase';
import { fonts } from '@/src/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColor, palette } = useAppTheme();
  const { language } = useTreasury();
  const isEn = language === 'en';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
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
          const user = await getCurrentUser();
          if (user) {
            completeSuccess();
          } else if (isMounted) {
            setStatus('error');
            setErrorMessage(
              res.error || 'Authentication failed. Please try again.'
            );
          }
        }
      }
    };

    const initAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        completeSuccess();
        return;
      }

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

    const sub = Linking.addEventListener('url', (event) => {
      processUrl(event.url);
    });

    const unsubAuth = subscribeToAuthChanges((u) => {
      if (u) {
        completeSuccess();
      }
    });

    const timer = setTimeout(async () => {
      if (!isMounted || handledRef.current) return;
      const u = await getCurrentUser();
      if (u) {
        completeSuccess();
      } else {
        setStatus((prev) => {
          if (prev === 'loading') {
            setErrorMessage(
              isEn
                ? 'Authentication response timed out. Please try signing in again.'
                : 'အကောင့်ဝင်ရောက်မှု အချိန်ကုန်သွားပါပြီ။ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားပါ။'
            );
            return 'error';
          }
          return prev;
        });
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
      style={[
        styles.screenRoot,
        {
          backgroundColor: palette.bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.card,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.brandHeader}>
          <BrandMark size={48} accentColor={themeColor.primary} />
          <Text
            style={[
              styles.brandWordmark,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            Class Ledger
          </Text>
        </View>

        {status === 'loading' ? (
          <View style={styles.stateBlock}>
            <ActivityIndicator
              size="large"
              color={themeColor.primary}
              style={styles.spinner}
            />
            <Text
              style={[
                styles.stateTitle,
                { color: palette.ink, fontFamily: fonts.bold },
              ]}
            >
              {isEn
                ? 'Completing Sign In...'
                : 'အကောင့်ဝင်ရောက်မှုကို အတည်ပြုနေပါသည်...'}
            </Text>
            <Text
              style={[
                styles.stateDesc,
                { color: palette.muted, fontFamily: fonts.regular },
              ]}
            >
              {isEn
                ? 'Please wait while we verify your session and set up cloud sync.'
                : 'Cloud sync နှင့် ချိတ်ဆက်ရန် အတည်ပြုနေပါသည်။ ခဏစောင့်ဆိုင်းပေးပါ။'}
            </Text>
          </View>
        ) : null}

        {status === 'success' ? (
          <View style={styles.stateBlock}>
            <View
              style={[styles.statusBadge, { backgroundColor: palette.paidBg }]}
            >
              <CheckCircle2 size={28} color={palette.paidText} />
            </View>
            <Text
              style={[
                styles.stateTitle,
                { color: palette.ink, fontFamily: fonts.bold },
              ]}
            >
              {isEn
                ? 'Signed In Successfully'
                : 'အောင်မြင်စွာ အကောင့်ဝင်ရောက်ပြီးပါပြီ'}
            </Text>
            <Text
              style={[
                styles.stateDesc,
                { color: palette.muted, fontFamily: fonts.regular },
              ]}
            >
              {isEn
                ? 'Redirecting to your dashboard...'
                : 'ပင်မစာမျက်နှာသို့ ကူးပြောင်းနေပါသည်...'}
            </Text>
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.stateBlock}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: palette.dangerBg },
              ]}
            >
              <AlertCircle size={28} color={palette.dangerText} />
            </View>
            <Text
              style={[
                styles.stateTitle,
                { color: palette.ink, fontFamily: fonts.bold },
              ]}
            >
              {isEn
                ? 'Authentication Failed'
                : 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ'}
            </Text>
            {errorMessage ? (
              <Text
                style={[
                  styles.errorMsg,
                  { color: palette.dangerText, fontFamily: fonts.regular },
                ]}
              >
                {errorMessage}
              </Text>
            ) : null}
            <TouchableOpacity
              onPress={navigateToHome}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={[
                styles.returnBtn,
                {
                  backgroundColor: themeColor.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.returnBtnText,
                  { color: themeColor.onPrimary, fontFamily: fonts.semibold },
                ]}
              >
                {isEn ? 'Return to Home' : 'ပင်မစာမျက်နှာသို့ ပြန်သွားမည်'}
              </Text>
              <ArrowRight size={14} color={themeColor.onPrimary} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  brandWordmark: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  stateBlock: {
    width: '100%',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 14,
  },
  statusBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stateTitle: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 6,
  },
  stateDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  returnBtn: {
    marginTop: 22,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 13,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  returnBtnText: {
    fontSize: 13,
  },
});
