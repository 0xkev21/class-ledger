import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { Haptics } from '@/src/utils/haptics';
import { BrandMark } from './BrandMark';

type TabRouteKey = 'index' | 'fines' | 'roster' | 'reports' | 'settings';

/**
 * Centered desktop navigation header matching .nav--centre and .cl-appbar on public/landing/.
 */
export const DesktopTopNav: React.FC = () => {
  const router = useRouter();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  const { palette, themeColor } = useAppTheme();
  const { user, language, setLanguage, t } = useTreasury();

  const tabsIdx = segments.indexOf('(tabs)');
  const activeTab: TabRouteKey =
    ((tabsIdx >= 0 ? segments[tabsIdx + 1] : segments[0]) as TabRouteKey) || 'index';

  const navItems: { key: TabRouteKey; label: string; href: string }[] = [
    { key: 'index', label: t.tabs.events, href: '/(tabs)' },
    { key: 'fines', label: t.tabs.fines, href: '/(tabs)/fines' },
    { key: 'roster', label: t.tabs.roster, href: '/(tabs)/roster' },
    { key: 'reports', label: t.tabs.reports, href: '/(tabs)/reports' },
    { key: 'settings', label: t.tabs.settings, href: '/(tabs)/settings' },
  ];

  const handleNavigate = (href: string, key: TabRouteKey) => {
    if (activeTab === key) return;
    Haptics.selectionAsync();
    router.navigate(href as any);
  };

  const handleToggleLanguage = () => {
    Haptics.selectionAsync();
    setLanguage(language === 'en' ? 'my' : 'en');
  };

  return (
    <View
      style={[
        styles.barOuter,
        {
          paddingTop: insets.top,
          backgroundColor: palette.card,
          borderBottomColor: palette.line,
        },
      ]}
    >
      <View style={styles.barInner}>
        {/* Left: Brand Mark, Name, Version */}
        <Pressable
          onPress={() => handleNavigate('/(tabs)', 'index')}
          accessibilityRole="button"
          accessibilityLabel="Class Ledger"
          style={styles.brandGroup}
        >
          <BrandMark size={26} accentColor={themeColor.primary} />
          <Text
            style={[
              styles.brandName,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            Class Ledger
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: palette.surface }]}>
            <Text
              style={[
                styles.versionText,
                { color: palette.muted, fontFamily: fonts.mono },
              ]}
            >
              v2.0.0
            </Text>
          </View>
        </Pressable>

        {/* Center: 5 Flat Underline Tabs */}
        <View style={styles.tabRow} accessibilityRole="tablist">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleNavigate(item.href, item.key)}
                activeOpacity={0.72}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={styles.tabButton}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? themeColor.primary : palette.muted,
                      fontFamily: isActive ? fonts.semibold : fonts.medium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    {
                      backgroundColor: isActive ? themeColor.primary : 'transparent',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right: Sync Indicator + Instant EN / မြန်မာ Toggle */}
        <View style={styles.rightGroup}>
          <TouchableOpacity
            onPress={() => handleNavigate('/(tabs)/settings', 'settings')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={user ? t.common.active : t.common.offline}
            style={[
              styles.statusPill,
              {
                backgroundColor: user ? palette.paidBg : palette.surface,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: user ? palette.paidText : palette.muted,
                },
              ]}
            />
            <Text
              style={[
                styles.statusLabel,
                {
                  color: user ? palette.paidText : palette.muted,
                  fontFamily: fonts.medium,
                },
              ]}
            >
              {user ? t.common.active : t.common.offline}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleLanguage}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Switch language"
            style={[
              styles.langButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <Text
              style={[
                styles.langText,
                {
                  color: language === 'en' ? palette.ink : palette.muted,
                  fontFamily: language === 'en' ? fonts.semibold : fonts.regular,
                },
              ]}
            >
              EN
            </Text>
            <Text style={[styles.langSep, { color: palette.muted }]}>/</Text>
            <Text
              style={[
                styles.langText,
                {
                  color: language === 'my' ? palette.ink : palette.muted,
                  fontFamily: language === 'my' ? fonts.semibold : fonts.regular,
                },
              ]}
            >
              မြန်မာ
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  barOuter: {
    borderBottomWidth: 1,
    width: '100%',
    zIndex: 40,
  },
  barInner: {
    height: 60,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  brandName: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  versionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 11,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    gap: 22,
  },
  tabButton: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'relative',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  tabText: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 12,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  langText: {
    fontSize: 12,
  },
  langSep: {
    fontSize: 11,
  },
});
