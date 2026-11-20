import { Link, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandMark } from '@/src/components/BrandMark';
import { StatusPill } from '@/src/components/StatusPill';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';

export default function NotFoundScreen() {
  const { palette, themeColor } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.card, borderColor: palette.line },
          ]}
        >
          <View style={styles.brandRow}>
            <BrandMark size={40} accentColor={themeColor.primary} />
            <StatusPill variant="neutral" mono label="404" />
          </View>

          <Text
            style={[
              styles.title,
              { color: palette.ink, fontFamily: fonts.bold },
            ]}
          >
            Page Not Found
          </Text>

          <Text
            style={[
              styles.description,
              { color: palette.muted, fontFamily: fonts.regular },
            ]}
          >
            This screen doesn&apos;t exist or has been moved. Return to Class Ledger to continue managing events, fines, and balances.
          </Text>

          <Link href="/" asChild>
            <TouchableOpacity
              activeOpacity={0.88}
              accessibilityRole="button"
              style={[
                styles.button,
                {
                  backgroundColor: themeColor.primary,
                },
              ]}
            >
              <ArrowLeft size={16} color={themeColor.onPrimary} />
              <Text
                style={[
                  styles.buttonText,
                  { color: themeColor.onPrimary, fontFamily: fonts.semibold },
                ]}
              >
                Return to Home
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  button: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    paddingVertical: 13,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 18,
  },
});
