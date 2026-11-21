import {
  Check,
  Cloud,
  CreditCard,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  Sun,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudSyncModal } from '@/src/components/CloudSyncModal';
import { NativeIcon } from '@/src/components/NativeIcon';
import { StatusPill } from '@/src/components/StatusPill';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import {
  DEFAULT_THEME_COLOR_ID,
  THEME_COLOR_LIST,
  ThemeColorId,
} from '@/src/theme/themeColors';
import { ThemeMode } from '@/src/types';
import {
  copyReportToClipboard,
  downloadFileWeb,
  generateFinesCSV,
} from '@/src/utils/exporter';
import { Haptics } from '@/src/utils/haptics';

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    fines,
    students,
    subjects,
    resetToDefaults,
    getDatabaseJSON,
    user,
    isOnline,
    hasPendingSync,
    lastSyncedAt,
    syncNow,
    language,
    setLanguage,
    t,
  } = useTreasury();
  const { themeColor, palette, themeMode, setThemeMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Mount guard on web keeps static SSR and client hydration identical
  const [hasMounted, setHasMounted] = useState(!isWeb);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const isDesktop = hasMounted && width >= 1024;

  const [showCloudSync, setShowCloudSync] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const [kbzName, setKbzName] = useState(settings.ecKbzpayName || '');
  const [kbzPhone, setKbzPhone] = useState(settings.ecKbzpayPhone || '');

  useEffect(() => {
    setKbzName(settings.ecKbzpayName || '');
    setKbzPhone(settings.ecKbzpayPhone || '');
  }, [settings.ecKbzpayName, settings.ecKbzpayPhone]);

  const currentThemeId: ThemeColorId =
    themeColor.id ||
    (settings.themeColorId as ThemeColorId) ||
    DEFAULT_THEME_COLOR_ID;

  const handleSelectThemePreset = async (presetId: ThemeColorId) => {
    if (currentThemeId === presetId) return;
    Haptics.selectionAsync();
    await updateSettings({ themeColorId: presetId });
    setToastMessage(t.settings.themeChangedToast);
  };

  const handleSelectThemeMode = async (mode: ThemeMode) => {
    if (themeMode === mode) return;
    Haptics.selectionAsync();
    await setThemeMode(mode);
    setToastMessage(t.settings.themeModeChangedToast);
  };

  const handleSelectLanguage = async (newLang: 'my' | 'en') => {
    if (language === newLang) return;
    Haptics.selectionAsync();
    await setLanguage(newLang);
    setToastMessage(
      newLang === 'en'
        ? 'Language switched to English'
        : 'ဘာသာစကားကို မြန်မာဘာသာသို့ ပြောင်းလဲပြီးပါပြီ'
    );
  };

  const handleSaveKbzSettings = async () => {
    Haptics.notificationSuccessAsync();
    await updateSettings({
      ecKbzpayName: kbzName.trim(),
      ecKbzpayPhone: kbzPhone.trim(),
    });
    setToastMessage(t.settings.kbzSavedToast);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const result = await syncNow('merge');
      if (result.success) {
        setToastMessage(t.settings.syncSuccess);
      } else {
        setToastMessage(result.message || t.settings.syncError);
      }
    } catch (err: any) {
      setToastMessage(err.message || t.settings.syncError);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleExportCSV = async () => {
    Haptics.selectionAsync();
    const csv = generateFinesCSV(fines, students, subjects);
    if (Platform.OS === 'web') {
      downloadFileWeb(`ec_fines_${Date.now()}.csv`, csv);
      setToastMessage(t.reports.csvSuccess);
    } else {
      await copyReportToClipboard(csv);
      setToastMessage(t.reports.clipboardSuccess);
    }
  };

  const handleExportJSON = async () => {
    Haptics.selectionAsync();
    const json = getDatabaseJSON();
    if (Platform.OS === 'web') {
      downloadFileWeb(
        `class_ledger_backup_${Date.now()}.json`,
        json,
        'application/json'
      );
      setToastMessage(t.reports.jsonSuccess);
    } else {
      await copyReportToClipboard(json);
      setToastMessage(t.reports.clipboardSuccess);
    }
  };

  const performReset = async () => {
    await resetToDefaults();
    setToastMessage(t.settings.resetSuccessToast);
  };

  const handleResetDatabase = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(t.settings.resetConfirmMsg)) {
        void performReset();
      }
      return;
    }

    Alert.alert(t.settings.resetConfirmTitle, t.settings.resetConfirmMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.reset,
        style: 'destructive',
        onPress: () => {
          void performReset();
        },
      },
    ]);
  };

  const appearanceCard = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="paintpalette.fill"
              materialName="palette"
              FallbackIcon={Palette}
              size={16}
              color={themeColor.primary}
            />
          </View>
          <Text
            style={[
              styles.cardTitle,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {t.settings.appearance}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.cardDesc,
          { color: palette.muted, fontFamily: fonts.regular },
        ]}
      >
        {t.settings.appearanceSub}
      </Text>

      {/* Light / Dark / Follow System Switcher */}
      <Text
        style={[
          styles.sectionLabel,
          { color: palette.subtle, fontFamily: fonts.medium },
        ]}
      >
        {t.settings.themeMode}
      </Text>

      <View style={styles.themeModeRow}>
        {(
          [
            {
              id: 'system' as const,
              sfSymbol: 'circle.lefthalf.filled' as const,
              materialName: 'brightness-auto' as const,
              FallbackIcon: Monitor,
              label: t.settings.themeSystem,
            },
            {
              id: 'light' as const,
              sfSymbol: 'sun.max.fill' as const,
              materialName: 'light-mode' as const,
              FallbackIcon: Sun,
              label: t.settings.themeLight,
            },
            {
              id: 'dark' as const,
              sfSymbol: 'moon.fill' as const,
              materialName: 'dark-mode' as const,
              FallbackIcon: Moon,
              label: t.settings.themeDark,
            },
          ] as const
        ).map((opt) => {
          const isSelected = themeMode === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => handleSelectThemeMode(opt.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.themeModeOption,
                {
                  backgroundColor: isSelected ? themeColor.surface : palette.bg,
                  borderColor: isSelected ? themeColor.primary : palette.line,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <NativeIcon
                sfSymbol={opt.sfSymbol}
                materialName={opt.materialName}
                FallbackIcon={opt.FallbackIcon}
                size={18}
                color={isSelected ? themeColor.primary : palette.muted}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.themeModeLabel,
                  {
                    color: isSelected ? themeColor.text : palette.ink,
                    fontFamily: isSelected ? fonts.semibold : fonts.medium,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Color Live Preview Banner */}
      <View
        style={[
          styles.activeColorBanner,
          {
            backgroundColor: themeColor.surface,
            borderColor: themeColor.border,
          },
        ]}
      >
        <View style={styles.activeColorLeft}>
          <View
            style={[
              styles.activeColorCircle,
              { backgroundColor: themeColor.primary },
            ]}
          >
            <NativeIcon
              sfSymbol="checkmark"
              materialName="check"
              FallbackIcon={Check}
              size={14}
              color={themeColor.onPrimary}
            />
          </View>
          <View>
            <Text
              style={[
                styles.activeColorTitle,
                { color: palette.ink, fontFamily: fonts.semibold },
              ]}
            >
              {language === 'en' ? themeColor.nameEn : themeColor.nameMm}
            </Text>
            <Text
              style={[
                styles.activeColorHex,
                { color: palette.muted, fontFamily: fonts.mono },
              ]}
            >
              HEX: {themeColor.primary}
            </Text>
          </View>
        </View>

        <View style={styles.miniPreviewRow}>
          <View
            style={[
              styles.miniPreviewPill,
              { backgroundColor: themeColor.primary },
            ]}
          >
            <Text
              style={[
                styles.miniPreviewText,
                { color: themeColor.onPrimary, fontFamily: fonts.semibold },
              ]}
            >
              {t.common.preview}
            </Text>
          </View>
          <StatusPill variant="brand" label="Badge" />
        </View>
      </View>

      <Text
        style={[
          styles.sectionLabel,
          { color: palette.subtle, fontFamily: fonts.medium },
        ]}
      >
        {t.settings.presets}
      </Text>

      <View style={styles.swatchesGrid}>
        {THEME_COLOR_LIST.map((preset) => {
          const isSelected = currentThemeId === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => handleSelectThemePreset(preset.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={preset.nameEn}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.swatchButton,
                {
                  backgroundColor: preset.primary,
                  borderColor: isSelected ? palette.ink : 'transparent',
                  opacity: isSelected ? 1 : 0.92,
                },
              ]}
            >
              {isSelected ? (
                <NativeIcon
                  sfSymbol="checkmark"
                  materialName="check"
                  FallbackIcon={Check}
                  size={18}
                  color={preset.onPrimary}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const languageCard = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="globe"
              materialName="language"
              FallbackIcon={Globe}
              size={16}
              color={themeColor.primary}
            />
          </View>
          <Text
            style={[
              styles.cardTitle,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {t.settings.language}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.cardDesc,
          { color: palette.muted, fontFamily: fonts.regular },
        ]}
      >
        {t.settings.languageSub}
      </Text>

      <View style={styles.langRow}>
        {(['my', 'en'] as const).map((langKey) => {
          const isSelected = language === langKey;
          const title =
            langKey === 'my' ? t.settings.burmese : t.settings.english;
          const sub = langKey === 'my' ? 'Burmese' : 'English';
          const code = langKey === 'my' ? 'MY' : 'EN';
          return (
            <TouchableOpacity
              key={langKey}
              onPress={() => handleSelectLanguage(langKey)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.langOption,
                {
                  backgroundColor: palette.bg,
                  borderColor: isSelected ? themeColor.primary : palette.line,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <View style={styles.langOptionLeft}>
                <View
                  style={[
                    styles.langCodeBadge,
                    {
                      backgroundColor: isSelected
                        ? themeColor.surface
                        : palette.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langCodeText,
                      {
                        color: isSelected ? themeColor.text : palette.ink,
                        fontFamily: fonts.monoMedium,
                      },
                    ]}
                  >
                    {code}
                  </Text>
                </View>
                <View>
                  <Text
                    style={[
                      styles.langTitle,
                      { color: palette.ink, fontFamily: fonts.semibold },
                    ]}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[
                      styles.langSub,
                      { color: palette.muted, fontFamily: fonts.regular },
                    ]}
                  >
                    {sub}
                  </Text>
                </View>
              </View>

              {isSelected ? (
                <View
                  style={[
                    styles.langCheck,
                    { backgroundColor: themeColor.primary },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="checkmark"
                    materialName="check"
                    FallbackIcon={Check}
                    size={12}
                    color={themeColor.onPrimary}
                  />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const kbzCard = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="creditcard.fill"
              materialName="credit-card"
              FallbackIcon={CreditCard}
              size={16}
              color={themeColor.primary}
            />
          </View>
          <Text
            style={[
              styles.cardTitle,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {t.settings.kbzPay}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.cardDesc,
          { color: palette.muted, fontFamily: fonts.regular },
        ]}
      >
        {t.settings.kbzPaySub}
      </Text>

      <View style={styles.fieldGroup}>
        <Text
          style={[
            styles.inputLabel,
            { color: palette.muted, fontFamily: fonts.medium },
          ]}
        >
          {t.settings.accountName}
        </Text>
        <TextInput
          value={kbzName}
          onChangeText={setKbzName}
          placeholder={t.settings.accountNamePlaceholder}
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            {
              backgroundColor: palette.bg,
              borderColor: palette.line,
              color: palette.ink,
              fontFamily: fonts.regular,
              ...(Platform.OS === 'web'
                ? ({ outlineStyle: 'none' } as any)
                : {}),
            },
          ]}
        />
      </View>

      <View style={styles.fieldGroupLast}>
        <Text
          style={[
            styles.inputLabel,
            { color: palette.muted, fontFamily: fonts.medium },
          ]}
        >
          {t.settings.phoneNumber}
        </Text>
        <TextInput
          value={kbzPhone}
          onChangeText={setKbzPhone}
          placeholder={t.settings.phoneNumberPlaceholder}
          placeholderTextColor={palette.muted}
          keyboardType="phone-pad"
          style={[
            styles.input,
            {
              backgroundColor: palette.bg,
              borderColor: palette.line,
              color: palette.ink,
              fontFamily: fonts.mono,
              ...(Platform.OS === 'web'
                ? ({ outlineStyle: 'none' } as any)
                : {}),
            },
          ]}
        />
      </View>

      <TouchableOpacity
        onPress={handleSaveKbzSettings}
        activeOpacity={0.85}
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
          {t.settings.saveKbz}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const cloudCard = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="cloud.fill"
              materialName="cloud"
              FallbackIcon={Cloud}
              size={16}
              color={themeColor.primary}
            />
          </View>
          <Text
            style={[
              styles.cardTitle,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {t.settings.cloudSync}
          </Text>
        </View>

        <StatusPill
          variant={user ? (isOnline ? 'paid' : 'unpaid') : 'neutral'}
          label={
            user
              ? isOnline
                ? t.settings.connected
                : hasPendingSync
                ? `${t.common.offline} • Pending`
                : t.common.offline
              : t.settings.offlineMode
          }
        />
      </View>

      <Text
        style={[
          styles.cardDesc,
          { color: palette.muted, fontFamily: fonts.regular },
        ]}
      >
        {t.settings.cloudSyncSub}
      </Text>

      {user ? (
        <View
          style={[
            styles.accountBox,
            { backgroundColor: palette.surface, borderColor: palette.line },
          ]}
        >
          <View style={styles.flexMinZero}>
            <Text
              style={[
                styles.accountCaption,
                { color: palette.muted, fontFamily: fonts.regular },
              ]}
            >
              {t.settings.connectedAccount}
            </Text>
            <Text
              selectable
              style={[
                styles.accountEmail,
                { color: palette.ink, fontFamily: fonts.semibold },
              ]}
            >
              {user.email}
            </Text>
            {lastSyncedAt ? (
              <Text
                style={[
                  styles.lastSyncText,
                  { color: palette.muted, fontFamily: fonts.mono },
                ]}
              >
                {t.settings.lastSync(
                  new Date(lastSyncedAt).toLocaleTimeString()
                )}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleManualSync}
            disabled={isManualSyncing}
            activeOpacity={0.78}
            accessibilityRole="button"
            style={[
              styles.syncNowBtn,
              {
                backgroundColor: themeColor.surface,
                borderColor: themeColor.border,
              },
            ]}
          >
            {isManualSyncing ? (
              <ActivityIndicator size="small" color={themeColor.primary} />
            ) : (
              <>
                <NativeIcon
                  sfSymbol="arrow.clockwise"
                  materialName="sync"
                  FallbackIcon={RefreshCw}
                  size={13}
                  color={themeColor.primary}
                />
                <Text
                  style={[
                    styles.syncNowText,
                    { color: themeColor.text, fontFamily: fonts.semibold },
                  ]}
                >
                  {t.settings.syncNow}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          setShowCloudSync(true);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        style={[
          styles.primaryBtnIcon,
          {
            backgroundColor: themeColor.primary,
          },
        ]}
      >
        <NativeIcon
          sfSymbol="cloud.fill"
          materialName="cloud"
          FallbackIcon={Cloud}
          size={16}
          color={themeColor.onPrimary}
        />
        <Text
          style={[
            styles.primaryBtnText,
            { color: themeColor.onPrimary, fontFamily: fonts.semibold },
          ]}
        >
          {user ? t.settings.manageCloud : t.settings.enableCloud}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const backupCard = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: palette.surface }]}
          >
            <NativeIcon
              sfSymbol="internaldrive"
              materialName="storage"
              FallbackIcon={HardDrive}
              size={16}
              color={palette.subtle}
            />
          </View>
          <Text
            style={[
              styles.cardTitle,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {t.settings.dataBackup}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.cardDesc,
          { color: palette.muted, fontFamily: fonts.regular },
        ]}
      >
        {t.settings.dataBackupSub}
      </Text>

      <View style={styles.backupRow}>
        <TouchableOpacity
          onPress={handleExportCSV}
          activeOpacity={0.78}
          accessibilityRole="button"
          style={[
            styles.surfaceActionBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <NativeIcon
            sfSymbol="tablecells"
            materialName="table-chart"
            FallbackIcon={FileSpreadsheet}
            size={14}
            color={palette.subtle}
          />
          <Text
            style={[
              styles.surfaceActionText,
              { color: palette.ink, fontFamily: fonts.medium },
            ]}
          >
            {t.reports.exportCSV}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportJSON}
          activeOpacity={0.78}
          accessibilityRole="button"
          style={[
            styles.surfaceActionBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <NativeIcon
            sfSymbol="internaldrive"
            materialName="storage"
            FallbackIcon={HardDrive}
            size={14}
            color={palette.subtle}
          />
          <Text
            style={[
              styles.surfaceActionText,
              { color: palette.ink, fontFamily: fonts.medium },
            ]}
          >
            {t.reports.exportJSON}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const dangerCard = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <Text
        style={[
          styles.dangerEyebrow,
          { color: palette.dangerText, fontFamily: fonts.semibold },
        ]}
      >
        {t.settings.dangerZone}
      </Text>
      <Text
        style={[
          styles.cardDesc,
          { color: palette.muted, fontFamily: fonts.regular },
        ]}
      >
        {t.settings.dangerZoneSub}
      </Text>
      <TouchableOpacity
        onPress={handleResetDatabase}
        activeOpacity={0.8}
        accessibilityRole="button"
        style={[
          styles.dangerBtn,
          {
            backgroundColor: palette.dangerBg,
          },
        ]}
      >
        <NativeIcon
          sfSymbol="arrow.counterclockwise"
          materialName="restart-alt"
          FallbackIcon={RotateCcw}
          size={14}
          color={palette.dangerText}
        />
        <Text
          style={[
            styles.dangerBtnText,
            { color: palette.dangerText, fontFamily: fonts.semibold },
          ]}
        >
          {t.settings.resetAllData}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.screenRoot, { backgroundColor: palette.bg }]}>
      <ToastNotification
        message={toastMessage}
        onHide={() => setToastMessage(null)}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isDesktop ? 24 : 20,
            paddingTop: isDesktop ? 24 : insets.top + 16,
            paddingBottom: isDesktop ? 40 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.container, { maxWidth: isDesktop ? 1280 : 760 }]}
        >
          {/* Header */}
          <View style={styles.headerBlock}>
            <Text
              selectable
              style={[
                styles.pageTitle,
                { color: palette.ink, fontFamily: fonts.bold },
              ]}
            >
              {t.settings.title}
            </Text>
            <Text
              style={[
                styles.pageSubtitle,
                { color: palette.muted, fontFamily: fonts.regular },
              ]}
            >
              {t.settings.subtitle}
            </Text>
          </View>

          {isDesktop ? (
            <View style={styles.desktopColumns}>
              <View style={styles.desktopCol}>
                {appearanceCard}
                {languageCard}
                {kbzCard}
              </View>
              <View style={styles.desktopCol}>
                {cloudCard}
                {backupCard}
                {dangerCard}
              </View>
            </View>
          ) : (
            <View style={styles.mobileStack}>
              {languageCard}
              {appearanceCard}
              {cloudCard}
              {kbzCard}
              {backupCard}
              {dangerCard}
            </View>
          )}
        </View>
      </ScrollView>

      <CloudSyncModal
        visible={showCloudSync}
        onClose={() => setShowCloudSync(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    width: '100%',
    alignSelf: 'center',
  },
  flexMinZero: {
    flex: 1,
    minWidth: 0,
  },
  headerBlock: {
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 42,
    paddingTop: 4,
    letterSpacing: -0.3,
    ...(Platform.OS === 'android' ? { includeFontPadding: true } : {}),
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 2,
  },
  desktopColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  desktopCol: {
    flex: 1,
    minWidth: 0,
    gap: 16,
  },
  mobileStack: {
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  activeColorBanner: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  activeColorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeColorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeColorTitle: {
    fontSize: 13,
  },
  activeColorHex: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  miniPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPreviewPill: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  miniPreviewText: {
    fontSize: 11,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 10,
  },
  themeModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  themeModeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderCurve: 'continuous',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  themeModeLabel: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
  swatchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langOption: {
    flex: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  langCodeBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  langCodeText: {
    fontSize: 12,
  },
  langTitle: {
    fontSize: 13,
  },
  langSub: {
    fontSize: 11,
  },
  langCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldGroupLast: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  primaryBtnIcon: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  primaryBtnText: {
    fontSize: 13,
  },
  accountBox: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  accountCaption: {
    fontSize: 11,
  },
  accountEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  lastSyncText: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    marginTop: 3,
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexShrink: 0,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  syncNowText: {
    fontSize: 12,
  },
  backupRow: {
    flexDirection: 'row',
    gap: 10,
  },
  surfaceActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  surfaceActionText: {
    fontSize: 12,
  },
  dangerEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dangerBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  dangerBtnText: {
    fontSize: 13,
  },
});
