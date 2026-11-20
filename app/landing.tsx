import { useRouter } from 'expo-router';
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Code2,
  Download,
  FileSpreadsheet,
  Gavel,
  Globe,
  HeartHandshake,
  Image as ImageIcon,
  Smartphone,
  Users,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/BrandMark';
import { StatusPill } from '@/src/components/StatusPill';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';

export default function ProductLandingPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { palette, themeColor } = useAppTheme();

  // The web landing page is the static page in public/landing/; this route hands over to it.
  useEffect(() => {
    if (Platform.OS === 'web') window.location.replace('./landing/');
  }, []);

  const handleOpenApp = () => {
    router.push('/(tabs)');
  };

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/0xkev21/class-ledger');
  };

  const handleOpenReleases = () => {
    Linking.openURL('https://github.com/0xkev21/class-ledger/releases');
  };

  if (Platform.OS === 'web') return null;

  const isWide = width >= 768;

  const capabilities = [
    {
      title: 'Events & Bulk Assessment',
      description:
        'Assess fixed fees or collect voluntary donation drives across your entire class roster with 1-tap contribution tracking.',
      Icon: HeartHandshake,
    },
    {
      title: 'Subject-Wise Fines',
      description:
        'Keep disciplinary fines organized by academic course and subject. Track paid vs owed balances with automatic rollups.',
      Icon: Gavel,
    },
    {
      title: 'Aesthetic Visual Reports',
      description:
        'Generate high-resolution PNG & SVG report cards and donor lists ready to share directly into class chat groups on Viber & Telegram.',
      Icon: ImageIcon,
    },
    {
      title: 'Cloud Sync & Multi-Tenancy',
      description:
        'Store data locally first. Optionally sign in with Google or email via Supabase for encrypted, user-isolated real-time synchronization.',
      Icon: Cloud,
    },
    {
      title: 'Safe Data Export & Portability',
      description:
        'Download JSON database backups and CSV exports with automated sanitization guarding against spreadsheet formula injection.',
      Icon: FileSpreadsheet,
    },
    {
      title: 'Bilingual: English & Myanmar',
      description:
        'Native language toggling between English and Myanmar (Burmese) with localized currency (MMK) and payment formatters.',
      Icon: Globe,
    },
  ];

  const platforms = [
    {
      title: 'Web App',
      description:
        'Zero installation. Open directly in Chrome, Safari, Firefox, or Edge on any computer.',
      cta: 'Open in Browser',
      onPress: handleOpenApp,
      Icon: Globe,
      ActionIcon: ArrowRight,
    },
    {
      title: 'Android APK & F-Droid',
      description:
        'Standalone APK available on GitHub Releases and via F-Droid / IzzyOnDroid.',
      cta: 'Get APK',
      onPress: handleOpenReleases,
      Icon: Smartphone,
      ActionIcon: Download,
    },
    {
      title: 'Linux Desktop',
      description:
        'Native desktop packages (.deb and .AppImage) powered by Tauri for high performance.',
      cta: 'Download Linux App',
      onPress: handleOpenReleases,
      Icon: Users,
      ActionIcon: Download,
    },
  ];

  const faqs = [
    {
      q: 'Is Class Ledger completely free to use?',
      a: 'Yes, Class Ledger is 100% free and open-source under the MIT license. There are no paid tiers, no advertisements, and no tracking.',
    },
    {
      q: 'Can I use it completely offline?',
      a: 'Yes! All students, fines, events, and dues are saved locally to your device storage. You only need an internet connection if you choose to sync your class data to the cloud.',
    },
    {
      q: 'How does cloud synchronization work?',
      a: 'Cloud sync uses Supabase with multi-tenant Row Level Security (RLS). When you sign in with Google or Email, your data is securely isolated so only your account can read or update your classroom data.',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      {/* Top Header */}
      <View
        style={[
          styles.navbar,
          {
            paddingTop: Math.max(insets.top, 14),
            backgroundColor: palette.card,
            borderBottomColor: palette.line,
          },
        ]}
      >
        <View style={styles.navbarInner}>
          <View style={styles.brandGroup}>
            <BrandMark size={32} accentColor={themeColor.primary} />
            <View>
              <Text
                style={[
                  styles.brandTitle,
                  { color: palette.ink, fontFamily: fonts.bold },
                ]}
              >
                Class Ledger
              </Text>
              <Text
                style={[
                  styles.brandSubtitle,
                  { color: palette.muted, fontFamily: fonts.medium },
                ]}
              >
                Student Treasury & Dues
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleOpenApp}
            activeOpacity={0.88}
            accessibilityRole="button"
            style={[
              styles.navCta,
              {
                backgroundColor: themeColor.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.navCtaText,
                { color: themeColor.onPrimary, fontFamily: fonts.semibold },
              ]}
            >
              Launch App
            </Text>
            <ArrowRight size={14} color={themeColor.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 40) },
        ]}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroInner}>
            <StatusPill
              variant="brand"
              label="100% Free & Open Source • Offline-First"
            />

            <Text
              style={[
                styles.heroHeading,
                isWide ? styles.heroHeadingWide : null,
                { color: palette.ink, fontFamily: fonts.bold },
              ]}
            >
              Student Treasury & Class Finances,{' '}
              <Text style={{ color: themeColor.primary, fontFamily: fonts.bold }}>
                Simplified.
              </Text>
            </Text>

            <Text
              style={[
                styles.heroLead,
                { color: palette.muted, fontFamily: fonts.regular },
              ]}
            >
              The modern, privacy-focused financial management ledger crafted specifically for university class representatives, student councils, and student treasurers. Track dues, manage disciplinary fines, generate stationery report sheets, and sync seamlessly.
            </Text>

            <View style={styles.heroActions}>
              <TouchableOpacity
                onPress={handleOpenApp}
                activeOpacity={0.88}
                accessibilityRole="button"
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: themeColor.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: themeColor.onPrimary, fontFamily: fonts.semibold },
                  ]}
                >
                  Open App
                </Text>
                <ArrowRight size={16} color={themeColor.onPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenReleases}
                activeOpacity={0.85}
                accessibilityRole="button"
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.lineStrong,
                  },
                ]}
              >
                <Smartphone size={16} color={palette.ink} />
                <Text
                  style={[
                    styles.secondaryBtnText,
                    { color: palette.ink, fontFamily: fonts.semibold },
                  ]}
                >
                  Releases & APK
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenGitHub}
                activeOpacity={0.85}
                accessibilityRole="button"
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.lineStrong,
                  },
                ]}
              >
                <Code2 size={16} color={palette.ink} />
                <Text
                  style={[
                    styles.secondaryBtnText,
                    { color: palette.ink, fontFamily: fonts.semibold },
                  ]}
                >
                  GitHub
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.assurancesRow}>
              {['No account required', 'No ads or telemetry', 'Myanmar KBZPay ready'].map(
                (item) => (
                  <View key={item} style={styles.assuranceItem}>
                    <CheckCircle2 size={14} color={palette.paidText} />
                    <Text
                      style={[
                        styles.assuranceText,
                        { color: palette.muted, fontFamily: fonts.medium },
                      ]}
                    >
                      {item}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        </View>

        {/* Core Capabilities */}
        <View
          style={[
            styles.bandSection,
            {
              backgroundColor: palette.surface,
              borderTopColor: palette.line,
              borderBottomColor: palette.line,
            },
          ]}
        >
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: themeColor.primary, fontFamily: fonts.monoMedium },
                ]}
              >
                CORE CAPABILITIES
              </Text>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.ink, fontFamily: fonts.bold },
                ]}
              >
                Everything student treasurers need
              </Text>
            </View>

            <View style={styles.cardGrid}>
              {capabilities.map(({ title, description, Icon }) => (
                <View
                  key={title}
                  style={[
                    styles.featureCard,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.line,
                      flexBasis: isWide ? 280 : '100%',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.cardIconWrap,
                      { backgroundColor: themeColor.surface },
                    ]}
                  >
                    <Icon size={20} color={themeColor.primary} />
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: palette.ink, fontFamily: fonts.semibold },
                    ]}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[
                      styles.cardBody,
                      { color: palette.muted, fontFamily: fonts.regular },
                    ]}
                  >
                    {description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Multi-Platform */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: themeColor.primary, fontFamily: fonts.monoMedium },
                ]}
              >
                MULTI-PLATFORM
              </Text>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.ink, fontFamily: fonts.bold },
                ]}
              >
                Run everywhere you work
              </Text>
            </View>

            <View style={styles.cardGrid}>
              {platforms.map(({ title, description, cta, onPress, Icon, ActionIcon }) => (
                <View
                  key={title}
                  style={[
                    styles.platformCard,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.line,
                      flexBasis: isWide ? 230 : '100%',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.cardIconWrap,
                      { backgroundColor: themeColor.surface },
                    ]}
                  >
                    <Icon size={20} color={themeColor.primary} />
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: palette.ink, fontFamily: fonts.semibold },
                    ]}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[
                      styles.cardBody,
                      { color: palette.muted, fontFamily: fonts.regular },
                    ]}
                  >
                    {description}
                  </Text>
                  <Pressable
                    onPress={onPress}
                    accessibilityRole="button"
                    style={styles.platformAction}
                  >
                    <Text
                      style={[
                        styles.platformActionText,
                        { color: themeColor.primary, fontFamily: fonts.semibold },
                      ]}
                    >
                      {cta}
                    </Text>
                    <ActionIcon size={14} color={themeColor.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* FAQ */}
        <View
          style={[
            styles.bandSection,
            {
              backgroundColor: palette.surface,
              borderTopColor: palette.line,
              borderBottomColor: palette.line,
            },
          ]}
        >
          <View style={[styles.sectionInner, { maxWidth: 760 }]}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: themeColor.primary, fontFamily: fonts.monoMedium },
                ]}
              >
                QUESTIONS & ANSWERS
              </Text>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.ink, fontFamily: fonts.bold },
                ]}
              >
                Frequently Asked Questions
              </Text>
            </View>

            <View style={styles.faqList}>
              {faqs.map((faq) => (
                <View
                  key={faq.q}
                  style={[
                    styles.faqCard,
                    { backgroundColor: palette.card, borderColor: palette.line },
                  ]}
                >
                  <Text
                    style={[
                      styles.faqQ,
                      { color: palette.ink, fontFamily: fonts.semibold },
                    ]}
                  >
                    {faq.q}
                  </Text>
                  <Text
                    style={[
                      styles.faqA,
                      { color: palette.muted, fontFamily: fonts.regular },
                    ]}
                  >
                    {faq.a}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: palette.line }]}>
          <View style={[styles.footerInner, isWide ? styles.footerInnerWide : null]}>
            <View style={styles.footerBrand}>
              <BrandMark size={24} accentColor={themeColor.primary} />
              <Text
                style={[
                  styles.footerBrandText,
                  { color: palette.ink, fontFamily: fonts.semibold },
                ]}
              >
                Class Ledger
              </Text>
            </View>

            <Text
              style={[
                styles.footerCopy,
                { color: palette.muted, fontFamily: fonts.regular },
              ]}
            >
              Licensed under MIT • Free and Open Source Software
            </Text>

            <View style={styles.footerLinks}>
              <Pressable onPress={handleOpenGitHub} accessibilityRole="button">
                <Text
                  style={[
                    styles.footerLink,
                    { color: palette.muted, fontFamily: fonts.medium },
                  ]}
                >
                  GitHub
                </Text>
              </Pressable>
              <Pressable onPress={handleOpenApp} accessibilityRole="button">
                <Text
                  style={[
                    styles.footerLink,
                    { color: themeColor.primary, fontFamily: fonts.semibold },
                  ]}
                >
                  Launch App
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navbar: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  navbarInner: {
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  brandSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
  navCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  navCtaText: {
    fontSize: 13,
    lineHeight: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  heroInner: {
    width: '100%',
    maxWidth: 740,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 16,
  },
  heroHeading: {
    fontSize: 30,
    lineHeight: 37,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroHeadingWide: {
    fontSize: 42,
    lineHeight: 50,
  },
  heroLead: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 620,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  primaryBtnText: {
    fontSize: 14,
    lineHeight: 18,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  secondaryBtnText: {
    fontSize: 14,
    lineHeight: 18,
  },
  assurancesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 6,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  assuranceText: {
    fontSize: 12,
    lineHeight: 16,
  },
  bandSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionInner: {
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
    gap: 24,
  },
  sectionHeader: {
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  featureCard: {
    flexGrow: 1,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  platformCard: {
    flexGrow: 1,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  platformAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  platformActionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  faqQ: {
    fontSize: 15,
    lineHeight: 20,
  },
  faqA: {
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  footerInner: {
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerInnerWide: {
    flexDirection: 'row',
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBrandText: {
    fontSize: 14,
    lineHeight: 18,
  },
  footerCopy: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerLink: {
    fontSize: 13,
    lineHeight: 18,
  },
});
