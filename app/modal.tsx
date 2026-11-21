import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle2, ExternalLink, Globe } from 'lucide-react-native';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/BrandMark';
import { StatusPill } from '@/src/components/StatusPill';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';

export default function ModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useTreasury();
  const { palette, themeColor, isDark } = useAppTheme();

  const isEn = language === 'en';

  const features = [
    {
      title: isEn
        ? 'Bulk Event Assessment'
        : 'အခမ်းအနားကြေး အစုလိုက် သတ်မှတ်ခြင်း',
      desc: isEn
        ? 'Assess fees to all students simultaneously with 1-tap.'
        : 'အတန်းသားအားလုံးထံ အခမ်းအနားကြေး ၁ ချက်နှိပ်ရုံဖြင့် သတ်မှတ်နိုင်ခြင်း။',
    },
    {
      title: isEn
        ? 'Subject-wise Fines'
        : 'ဘာသာရပ်အလိုက် ဒဏ်ကြေးစီမံမှု',
      desc: isEn
        ? 'Assign attendance and submission fines by subject.'
        : 'ပျက်ကွက်နှင့် အိမ်စာမတင် ဒဏ်ကြေးများကို ဘာသာရပ်အလိုက် အတိအကျ သတ်မှတ်နိုင်ခြင်း။',
    },
    {
      title: isEn
        ? 'Flexible Payment Tracking'
        : 'ပေးချေမှု အသေးစိတ် မှတ်တမ်း',
      desc: isEn
        ? 'Track cash and KBZPay payments with partial or full settlements.'
        : 'ငွေသားနှင့် KBZPay ပေးချေမှုများကို အပြည့်အစုံ မှတ်တမ်းတင်နိုင်ခြင်း။',
    },
    {
      title: isEn
        ? 'Quick Social Share & High-Res Export'
        : 'ကြေညာချက်နှင့် ပုံထုတ်ယူမှု',
      desc: isEn
        ? 'Export crisp stationery reports or copy text directly for Viber & Telegram.'
        : 'အတန်း Group များသို့ ပေးချေရန်ကျန်သူများစာရင်းကို တိုက်ရိုက်ကူးယူမျှဝေနိုင်ခြင်း။',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.bg }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: Math.max(insets.bottom, 28) },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.heroHeader}>
        <BrandMark size={52} accentColor={themeColor.primary} />
        <View style={styles.heroTitleRow}>
          <Text
            style={[
              styles.heroTitle,
              { color: palette.ink, fontFamily: fonts.bold },
            ]}
          >
            Class Ledger
          </Text>
          <StatusPill variant="brand" mono label="v2.1.0" />
        </View>
        <Text
          style={[
            styles.heroSubtitle,
            { color: palette.muted, fontFamily: fonts.regular },
          ]}
        >
          {isEn
            ? 'Student Treasury & Ledger Management'
            : 'အတန်းခေါင်းဆောင် စာရင်းစီမံခန့်ခွဲမှုစနစ်'}
        </Text>
      </View>

      <View
        style={[
          styles.featuresCard,
          { backgroundColor: palette.card, borderColor: palette.line },
        ]}
      >
        <Text
          style={[
            styles.sectionLabel,
            { color: palette.muted, fontFamily: fonts.semibold },
          ]}
        >
          {isEn ? 'CORE FEATURES' : 'အဓိက အင်္ဂါရပ်များ'}
        </Text>

        {features.map((feat, idx) => (
          <View
            key={feat.title}
            style={[
              styles.featureRow,
              idx > 0 && { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12 },
            ]}
          >
            <View
              style={[
                styles.featureIconBadge,
                { backgroundColor: palette.paidBg },
              ]}
            >
              <CheckCircle2 size={16} color={palette.paidText} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text
                style={[
                  styles.featureTitle,
                  { color: palette.ink, fontFamily: fonts.semibold },
                ]}
              >
                {feat.title}
              </Text>
              <Text
                style={[
                  styles.featureDesc,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {feat.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => {
          router.dismiss();
          router.push('/landing' as any);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        style={[
          styles.ctaButton,
          {
            backgroundColor: palette.card,
            borderColor: themeColor.primary,
          },
        ]}
      >
        <Globe size={16} color={themeColor.primary} />
        <Text
          style={[
            styles.ctaText,
            { color: themeColor.primary, fontFamily: fonts.semibold },
          ]}
        >
          {isEn
            ? 'View Product Website & Overview'
            : 'ဝဘ်ဆိုက်နှင့် မိတ်ဆက်စာမျက်နှာကြည့်ရှုရန်'}
        </Text>
        <ExternalLink size={14} color={themeColor.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 18,
  },
  heroHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  featuresCard: {
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.9,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTextWrap: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  ctaText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
