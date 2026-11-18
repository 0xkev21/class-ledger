import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cloud,
  Code2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Gavel,
  Globe,
  HeartHandshake,
  Image as ImageIcon,
  Lock,
  Moon,
  Smartphone,
  Sun,
  Users,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/TreasuryContext';

export default function ProductLandingPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, themeColor } = useAppTheme();


  const handleOpenApp = () => {
    router.push('/(tabs)');
  };

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/0xkev21/class-ledger');
  };

  const handleOpenReleases = () => {
    Linking.openURL('https://github.com/0xkev21/class-ledger/releases');
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950">
      {/* Top Navbar */}
      <View
        style={{ paddingTop: Math.max(insets.top, 14), borderBottomWidth: 1 }}
        className="border-zinc-200/80 bg-white/90 backdrop-blur-md px-5 pb-3.5 dark:border-zinc-800/80 dark:bg-zinc-950/90"
      >
        <View className="mx-auto flex-row w-full max-w-5xl items-center justify-between">
          <View className="flex-row items-center space-x-2.5">
            <View
              style={{ backgroundColor: themeColor.primary }}
              className="h-9 w-9 items-center justify-center rounded-xl shadow-sm"
            >
              <BookOpen size={20} color={themeColor.onPrimary} />
            </View>
            <View className="ml-2.5">
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Class Ledger
              </Text>
              <Text className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                Student Treasury & Dues
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={handleOpenApp}
              style={{ backgroundColor: themeColor.primary }}
              className="flex-row items-center rounded-xl px-4 py-2 shadow-sm"
            >
              <Text
                style={{ color: themeColor.onPrimary }}
                className="text-xs font-semibold mr-1.5"
              >
                Launch App
              </Text>
              <ArrowRight size={14} color={themeColor.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
        className="flex-1"
      >
        {/* Hero Section */}
        <View className="px-5 pt-12 pb-16">
          <View className="mx-auto max-w-3xl items-center text-center">
            {/* Pill Badge */}
            <View className="mb-6 flex-row items-center rounded-full border border-zinc-200 bg-zinc-100 px-3.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
              <View className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
              <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                100% Free & Open Source • Offline-First
              </Text>
            </View>

            <Text className="text-center text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
              Student Treasury & Class Finances,{' '}
              <Text style={{ color: themeColor.primary }}>Simplified.</Text>
            </Text>

            <Text className="mt-5 text-center text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl">
              The modern, privacy-focused financial management ledger crafted specifically for university class representatives, student councils, and student treasurers. Track dues, manage disciplinary fines, generate aesthetic report cards, and sync seamlessly.
            </Text>

            {/* CTA Buttons */}
            <View className="mt-8 flex-row flex-wrap items-center justify-center gap-3">
              <TouchableOpacity
                onPress={handleOpenApp}
                style={{ backgroundColor: themeColor.primary }}
                className="flex-row items-center rounded-2xl px-6 py-3.5 shadow-md"
              >
                <Text
                  style={{ color: themeColor.onPrimary }}
                  className="text-sm font-bold mr-2"
                >
                  Launch Web App
                </Text>
                <ArrowRight size={16} color={themeColor.onPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenReleases}
                className="flex-row items-center rounded-2xl border border-zinc-300 bg-white px-5 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Smartphone size={16} color={isDark ? '#e4e4e7' : '#18181b'} />
                <Text className="ml-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Download APK
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenGitHub}
                className="flex-row items-center rounded-2xl border border-zinc-300 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Code2 size={16} color={isDark ? '#e4e4e7' : '#18181b'} />
                <Text className="ml-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  GitHub
                </Text>
              </TouchableOpacity>
            </View>

            {/* Micro assurances */}
            <View className="mt-6 flex-row flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <View className="flex-row items-center">
                <CheckCircle2 size={13} color="#10b981" />
                <Text className="ml-1 text-[11px] text-zinc-600 dark:text-zinc-400">No account required</Text>
              </View>
              <View className="flex-row items-center">
                <CheckCircle2 size={13} color="#10b981" />
                <Text className="ml-1 text-[11px] text-zinc-600 dark:text-zinc-400">No ads or telemetry</Text>
              </View>
              <View className="flex-row items-center">
                <CheckCircle2 size={13} color="#10b981" />
                <Text className="ml-1 text-[11px] text-zinc-600 dark:text-zinc-400">Myanmar KBZPay ready</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Feature Grid Section */}
        <View className="border-t border-zinc-100 bg-zinc-50/70 px-5 py-16 dark:border-zinc-900 dark:bg-zinc-900/40">
          <View className="mx-auto max-w-5xl">
            <View className="mb-12 items-center text-center">
              <Text className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Core Capabilities
              </Text>
              <Text className="mt-2 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Everything student treasurers need
              </Text>
            </View>

            <View className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <View className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="mb-4 h-11 w-11 items-center justify-center rounded-xl"
                >
                  <HeartHandshake size={22} color={themeColor.primary} />
                </View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Events & Bulk Assessment
                </Text>
                <Text className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Assess fixed fees or collect voluntary donation drives across your entire class roster with 1-tap contribution tracking.
                </Text>
              </View>

              {/* Feature 2 */}
              <View className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="mb-4 h-11 w-11 items-center justify-center rounded-xl"
                >
                  <Gavel size={22} color={themeColor.primary} />
                </View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Subject-Wise Fines
                </Text>
                <Text className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Keep disciplinary fines organized by academic course and subject. Track paid vs owed balances with automatic rollups.
                </Text>
              </View>

              {/* Feature 3 */}
              <View className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="mb-4 h-11 w-11 items-center justify-center rounded-xl"
                >
                  <ImageIcon size={22} color={themeColor.primary} />
                </View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Aesthetic Visual Reports
                </Text>
                <Text className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Generate high-resolution PNG & SVG report cards and donor lists ready to share directly into class chat groups on Viber & Telegram.
                </Text>
              </View>

              {/* Feature 4 */}
              <View className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="mb-4 h-11 w-11 items-center justify-center rounded-xl"
                >
                  <Cloud size={22} color={themeColor.primary} />
                </View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Cloud Sync & Multi-Tenancy
                </Text>
                <Text className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Store data locally first. Optionally sign in with Google or email via Supabase for encrypted, user-isolated real-time synchronization.
                </Text>
              </View>

              {/* Feature 5 */}
              <View className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="mb-4 h-11 w-11 items-center justify-center rounded-xl"
                >
                  <FileSpreadsheet size={22} color={themeColor.primary} />
                </View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Safe Data Export & Portability
                </Text>
                <Text className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Download JSON database backups and CSV exports with automated sanitization guarding against spreadsheet formula injection.
                </Text>
              </View>

              {/* Feature 6 */}
              <View className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="mb-4 h-11 w-11 items-center justify-center rounded-xl"
                >
                  <Globe size={22} color={themeColor.primary} />
                </View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Bilingual: English & Myanmar
                </Text>
                <Text className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Native language toggling between English and Myanmar (Burmese) with localized currency (MMK) and payment formatters.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Platform Availability Section */}
        <View className="px-5 py-16">
          <View className="mx-auto max-w-4xl text-center">
            <Text className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Multi-Platform
            </Text>
            <Text className="mt-2 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Run everywhere you work
            </Text>

            <View className="mt-10 flex-row flex-wrap justify-center gap-4">
              <View className="w-64 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <Globe size={24} color={themeColor.primary} />
                <Text className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Web App
                </Text>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Zero installation. Open directly in Chrome, Safari, Firefox, or Edge on any computer.
                </Text>
                <TouchableOpacity
                  onPress={handleOpenApp}
                  className="mt-4 flex-row items-center"
                >
                  <Text
                    style={{ color: themeColor.primary }}
                    className="text-xs font-bold mr-1"
                  >
                    Open in Browser
                  </Text>
                  <ArrowRight size={13} color={themeColor.primary} />
                </TouchableOpacity>
              </View>

              <View className="w-64 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <Smartphone size={24} color={themeColor.primary} />
                <Text className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Android APK & F-Droid
                </Text>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Standalone APK available on GitHub Releases and via F-Droid / IzzyOnDroid.
                </Text>
                <TouchableOpacity
                  onPress={handleOpenReleases}
                  className="mt-4 flex-row items-center"
                >
                  <Text
                    style={{ color: themeColor.primary }}
                    className="text-xs font-bold mr-1"
                  >
                    Get APK
                  </Text>
                  <Download size={13} color={themeColor.primary} />
                </TouchableOpacity>
              </View>

              <View className="w-64 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <Users size={24} color={themeColor.primary} />
                <Text className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Linux Desktop
                </Text>
                <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Native desktop packages (.deb and .AppImage) powered by Tauri for high performance.
                </Text>
                <TouchableOpacity
                  onPress={handleOpenReleases}
                  className="mt-4 flex-row items-center"
                >
                  <Text
                    style={{ color: themeColor.primary }}
                    className="text-xs font-bold mr-1"
                  >
                    Download Linux App
                  </Text>
                  <Download size={13} color={themeColor.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View className="border-t border-zinc-100 bg-zinc-50/70 px-5 py-16 dark:border-zinc-900 dark:bg-zinc-900/40">
          <View className="mx-auto max-w-3xl">
            <Text className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Questions & Answers
            </Text>
            <Text className="mt-2 text-center text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </Text>

            <View className="mt-8 space-y-4">
              <View className="rounded-xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Is Class Ledger completely free to use?
                </Text>
                <Text className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  Yes, Class Ledger is 100% free and open-source under the MIT license. There are no paid tiers, no advertisements, and no tracking.
                </Text>
              </View>

              <View className="rounded-xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Can I use it completely offline?
                </Text>
                <Text className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  Yes! All students, fines, events, and dues are saved locally to your device storage. You only need an internet connection if you choose to sync your class data to the cloud.
                </Text>
              </View>

              <View className="rounded-xl border border-zinc-200 bg-white p-4.5 dark:border-zinc-800 dark:bg-zinc-900">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  How does cloud synchronization work?
                </Text>
                <Text className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  Cloud sync uses Supabase with multi-tenant Row Level Security (RLS). When you sign in with Google or Email, your data is securely isolated so only your account can read or update your classroom data.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="border-t border-zinc-200/80 px-5 pt-12 pb-6 dark:border-zinc-800">
          <View className="mx-auto flex-col sm:flex-row max-w-5xl items-center justify-between gap-4">
            <View className="flex-row items-center space-x-2">
              <View
                style={{ backgroundColor: themeColor.primary }}
                className="h-7 w-7 items-center justify-center rounded-lg"
              >
                <BookOpen size={16} color={themeColor.onPrimary} />
              </View>
              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 ml-2">
                Class Ledger
              </Text>
            </View>

            <Text className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              Licensed under MIT • Free and Open Source Software
            </Text>

            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={handleOpenGitHub}>
                <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  GitHub
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenApp}>
                <Text
                  style={{ color: themeColor.primary }}
                  className="text-xs font-bold"
                >
                  Launch App
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
