import {
  Check,
  Cloud,
  CreditCard,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Palette,
  RefreshCw,
  RotateCcw,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudSyncModal } from '@/src/components/CloudSyncModal';
import { NativeIcon } from '@/src/components/NativeIcon';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import {
  THEME_COLOR_LIST,
  ThemeColorId,
} from '@/src/theme/themeColors';
import {
  copyReportToClipboard,
  downloadFileWeb,
  generateFinesCSV,
} from '@/src/utils/exporter';

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
    lastSyncedAt,
    syncNow,
    language,
    setLanguage,
    t,
  } = useTreasury();
  const { isDark, themeColor } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [showCloudSync, setShowCloudSync] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // KBZPay Settings State
  const [kbzName, setKbzName] = useState(settings.ecKbzpayName || '');
  const [kbzPhone, setKbzPhone] = useState(settings.ecKbzpayPhone || '');

  useEffect(() => {
    setKbzName(settings.ecKbzpayName || '');
    setKbzPhone(settings.ecKbzpayPhone || '');
  }, [settings.ecKbzpayName, settings.ecKbzpayPhone]);

  // UI Theme Preset State
  const currentThemeId: ThemeColorId = themeColor.id || (settings.themeColorId as ThemeColorId) || 'indigo';

  const handleSelectThemePreset = async (presetId: ThemeColorId) => {
    if (currentThemeId === presetId) return;
    await updateSettings({ themeColorId: presetId });
    setToastMessage(t.settings.themeChangedToast);
  };

  const handleSelectLanguage = async (newLang: 'my' | 'en') => {
    if (language === newLang) return;
    await setLanguage(newLang);
    setToastMessage(
      newLang === 'en'
        ? 'Language switched to English'
        : 'ဘာသာစကားကို မြန်မာဘာသာသို့ ပြောင်းလဲပြီးပါပြီ'
    );
  };

  const handleSaveKbzSettings = async () => {
    await updateSettings({
      ecKbzpayName: kbzName.trim(),
      ecKbzpayPhone: kbzPhone.trim(),
    });
    setToastMessage(t.settings.kbzSavedToast);
  };

  // Trigger manual cloud sync
  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const result = await syncNow('push');
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

  // CSV Export
  const handleExportCSV = async () => {
    const csv = generateFinesCSV(fines, students, subjects);
    if (Platform.OS === 'web') {
      downloadFileWeb(`ec_fines_${Date.now()}.csv`, csv);
      setToastMessage(t.reports.csvSuccess);
    } else {
      await copyReportToClipboard(csv);
      setToastMessage(t.reports.clipboardSuccess);
    }
  };

  // JSON Backup Export
  const handleExportJSON = async () => {
    const json = getDatabaseJSON();
    if (Platform.OS === 'web') {
      downloadFileWeb(`class_ledger_backup_${Date.now()}.json`, json, 'application/json');
      setToastMessage(t.reports.jsonSuccess);
    } else {
      await copyReportToClipboard(json);
      setToastMessage(t.reports.clipboardSuccess);
    }
  };

  // Reset database handler
  const handleResetDatabase = () => {
    Alert.alert(
      t.settings.resetConfirmTitle,
      t.settings.resetConfirmMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.reset,
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            setToastMessage(t.settings.resetSuccessToast);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ToastNotification message={toastMessage} onHide={() => setToastMessage(null)} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, height: '100%' }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <View className="mb-5 pt-2">
            <Text
              selectable
              className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-relaxed py-0.5"
            >
              {t.settings.title}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.settings.subtitle}
            </Text>
          </View>

          {/* 1. LANGUAGE SELECTOR CARD */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="h-8 w-8 rounded-full items-center justify-center mr-2.5"
                >
                  <NativeIcon
                    sfSymbol="globe"
                    materialName="language"
                    FallbackIcon={Globe}
                    size={16}
                    color={themeColor.primary}
                  />
                </View>
                <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  {t.settings.language}
                </Text>
              </View>
            </View>

            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              {t.settings.languageSub}
            </Text>

            <View className="flex-row gap-3">
              {/* Burmese Option */}
              <TouchableOpacity
                onPress={() => handleSelectLanguage('my')}
                activeOpacity={0.8}
                style={{
                  borderCurve: 'continuous',
                  borderColor: language === 'my' ? themeColor.primary : 'transparent',
                }}
                className={`flex-1 flex-row items-center justify-between p-3.5 rounded-2xl border-2 ${
                  language === 'my'
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'bg-zinc-50 dark:bg-zinc-800/60'
                }`}
              >
                <View className="flex-row items-center">
                  <Text className="text-xl mr-2.5">🇲🇲</Text>
                  <View>
                    <Text
                      className={`text-xs ${
                        language === 'my'
                          ? 'font-extrabold text-zinc-900 dark:text-zinc-100'
                          : 'font-semibold text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {t.settings.burmese}
                    </Text>
                    <Text className="text-[10px] text-zinc-400">Burmese</Text>
                  </View>
                </View>
                {language === 'my' && (
                  <View
                    style={{ backgroundColor: themeColor.primary }}
                    className="h-5 w-5 rounded-full items-center justify-center shadow-xs"
                  >
                    <NativeIcon
                      sfSymbol="checkmark"
                      materialName="check"
                      FallbackIcon={Check}
                      size={12}
                      color={themeColor.onPrimary}
                    />
                  </View>
                )}
              </TouchableOpacity>

              {/* English Option */}
              <TouchableOpacity
                onPress={() => handleSelectLanguage('en')}
                activeOpacity={0.8}
                style={{
                  borderCurve: 'continuous',
                  borderColor: language === 'en' ? themeColor.primary : 'transparent',
                }}
                className={`flex-1 flex-row items-center justify-between p-3.5 rounded-2xl border-2 ${
                  language === 'en'
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'bg-zinc-50 dark:bg-zinc-800/60'
                }`}
              >
                <View className="flex-row items-center">
                  <Text className="text-xl mr-2.5">🇺🇸</Text>
                  <View>
                    <Text
                      className={`text-xs ${
                        language === 'en'
                          ? 'font-extrabold text-zinc-900 dark:text-zinc-100'
                          : 'font-semibold text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {t.settings.english}
                    </Text>
                    <Text className="text-[10px] text-zinc-400">English</Text>
                  </View>
                </View>
                {language === 'en' && (
                  <View
                    style={{ backgroundColor: themeColor.primary }}
                    className="h-5 w-5 rounded-full items-center justify-center shadow-xs"
                  >
                    <NativeIcon
                      sfSymbol="checkmark"
                      materialName="check"
                      FallbackIcon={Check}
                      size={12}
                      color={themeColor.onPrimary}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. APPEARANCE & THEME COLOR CARD */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="h-8 w-8 rounded-full items-center justify-center mr-2.5"
                >
                  <NativeIcon
                    sfSymbol="paintpalette.fill"
                    materialName="palette"
                    FallbackIcon={Palette}
                    size={16}
                    color={themeColor.primary}
                  />
                </View>
                <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  {t.settings.appearance}
                </Text>
              </View>
            </View>

            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              {t.settings.appearanceSub}
            </Text>

            {/* Current Active Color Live Preview Banner */}
            <View
              style={{
                backgroundColor: themeColor.surface,
                borderColor: themeColor.border,
                borderCurve: 'continuous',
              }}
              className="p-3.5 rounded-2xl border mb-4 flex-row items-center justify-between flex-wrap gap-2"
            >
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: themeColor.primary }}
                  className="h-7 w-7 rounded-full items-center justify-center mr-2.5 shadow-sm"
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
                  <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {t.settings.currentColor}
                  </Text>
                  <Text
                    style={{ fontVariant: ['tabular-nums'] }}
                    className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5"
                  >
                    HEX: {themeColor.primary}
                  </Text>
                </View>
              </View>

              {/* Live Mini Preview Components */}
              <View className="flex-row items-center gap-1.5">
                <View
                  style={{
                    backgroundColor: themeColor.primary,
                    borderCurve: 'continuous',
                  }}
                  className="px-2.5 py-1 rounded-full shadow-sm"
                >
                  <Text
                    style={{ color: themeColor.onPrimary }}
                    className="text-[10px] font-bold"
                  >
                    {t.common.preview}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: themeColor.surface,
                    borderColor: themeColor.border,
                    borderCurve: 'continuous',
                  }}
                  className="px-2 py-0.5 rounded-full border"
                >
                  <Text
                    style={{ color: themeColor.text }}
                    className="text-[10px] font-bold"
                  >
                    Badge
                  </Text>
                </View>
              </View>
            </View>

            {/* Color Presets Grid */}
            <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2.5 ml-0.5">
              {t.settings.presets}
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-1">
              {THEME_COLOR_LIST.map((preset) => {
                const isSelected = currentThemeId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => handleSelectThemePreset(preset.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    style={{
                      backgroundColor: preset.primary,
                      borderCurve: 'continuous',
                      borderColor: isSelected
                        ? isDark
                          ? '#ffffff'
                          : '#18181b'
                        : 'transparent',
                    }}
                    className={`h-11 w-11 rounded-2xl items-center justify-center border-2 shadow-sm ${
                      isSelected ? 'scale-105' : 'opacity-90'
                    }`}
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

          {/* 3. Cloud Sync Status & Account Card */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="h-8 w-8 rounded-full items-center justify-center mr-2.5"
                >
                  <NativeIcon
                    sfSymbol="cloud.fill"
                    materialName="cloud"
                    FallbackIcon={Cloud}
                    size={16}
                    color={themeColor.primary}
                  />
                </View>
                <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  {t.settings.cloudSync}
                </Text>
              </View>

              {/* Status Badge */}
              <View
                style={{ borderCurve: 'continuous' }}
                className={`flex-row items-center rounded-full px-2.5 py-1 ${
                  user
                    ? 'bg-emerald-50 dark:bg-emerald-950/40'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              >
                <View
                  className={`h-2 w-2 rounded-full mr-1.5 ${
                    user ? 'bg-emerald-500' : 'bg-zinc-400'
                  }`}
                />
                <Text
                  className={`text-[10px] font-bold ${
                    user
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {user ? t.settings.connected : t.settings.offlineMode}
                </Text>
              </View>
            </View>

            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              {t.settings.cloudSyncSub}
            </Text>

            {/* User Account Info if logged in */}
            {user ? (
              <View
                style={{ borderCurve: 'continuous' }}
                className="mb-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-3.5 flex-row items-center justify-between border border-zinc-200/60 dark:border-zinc-800"
              >
                <View className="flex-1 mr-2">
                  <Text className="text-[11px] text-zinc-400">{t.settings.connectedAccount}</Text>
                  <Text
                    selectable
                    className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5"
                  >
                    {user.email}
                  </Text>
                  {lastSyncedAt ? (
                    <Text
                      style={{ fontVariant: ['tabular-nums'] }}
                      className="text-[10px] text-zinc-400 mt-1"
                    >
                      {t.settings.lastSync(new Date(lastSyncedAt).toLocaleTimeString())}
                    </Text>
                  ) : null}
                </View>

                {/* Manual Sync Now Button */}
                <TouchableOpacity
                  onPress={handleManualSync}
                  disabled={isManualSyncing}
                  style={{
                    backgroundColor: themeColor.surface,
                    borderColor: themeColor.border,
                    borderCurve: 'continuous',
                  }}
                  className="rounded-xl border px-3 py-2 flex-row items-center active:opacity-80"
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
                        style={{ color: themeColor.text }}
                        className="ml-1 text-[11px] font-bold"
                      >
                        {t.settings.syncNow}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Cloud Sync Modal Action Button */}
            <TouchableOpacity
              onPress={() => setShowCloudSync(true)}
              style={{
                backgroundColor: themeColor.primary,
                borderCurve: 'continuous',
              }}
              className="w-full flex-row items-center justify-center rounded-full py-3.5 active:opacity-90 shadow-sm"
            >
              <NativeIcon
                sfSymbol="cloud.fill"
                materialName="cloud"
                FallbackIcon={Cloud}
                size={16}
                color={themeColor.onPrimary}
              />
              <Text
                style={{ color: themeColor.onPrimary }}
                className="ml-2 text-xs font-bold"
              >
                {user ? t.settings.manageCloud : t.settings.enableCloud}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. Payment Info Settings Card */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="h-8 w-8 rounded-full items-center justify-center mr-2.5"
                >
                  <NativeIcon
                    sfSymbol="creditcard.fill"
                    materialName="credit-card"
                    FallbackIcon={CreditCard}
                    size={16}
                    color={themeColor.primary}
                  />
                </View>
                <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  {t.settings.kbzPay}
                </Text>
              </View>
            </View>

            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              {t.settings.kbzPaySub}
            </Text>

            {/* KBZPay Name Input */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 ml-1">
                {t.settings.accountName}
              </Text>
              <TextInput
                value={kbzName}
                onChangeText={setKbzName}
                placeholder={t.settings.accountNamePlaceholder}
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                style={{
                  color: isDark ? '#f4f4f5' : '#18181b',
                  borderCurve: 'continuous',
                }}
                className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-xs"
              />
            </View>

            {/* KBZPay Phone Input */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 ml-1">
                {t.settings.phoneNumber}
              </Text>
              <TextInput
                value={kbzPhone}
                onChangeText={setKbzPhone}
                placeholder={t.settings.phoneNumberPlaceholder}
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                keyboardType="phone-pad"
                style={{
                  color: isDark ? '#f4f4f5' : '#18181b',
                  borderCurve: 'continuous',
                }}
                className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-xs"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveKbzSettings}
              style={{
                backgroundColor: themeColor.primary,
                borderCurve: 'continuous',
              }}
              className="w-full rounded-full py-3.5 items-center justify-center active:opacity-90 shadow-sm"
            >
              <Text
                style={{ color: themeColor.onPrimary }}
                className="text-xs font-bold"
              >
                {t.settings.saveKbz}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. Data Backup & Storage Card */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center mb-3">
              <View className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center mr-2.5">
                <NativeIcon
                  sfSymbol="internaldrive"
                  materialName="storage"
                  FallbackIcon={HardDrive}
                  size={16}
                  color="#71717a"
                />
              </View>
              <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {t.settings.dataBackup}
              </Text>
            </View>

            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              {t.settings.dataBackupSub}
            </Text>

            <View className="flex-row gap-2.5">
              <TouchableOpacity
                onPress={handleExportCSV}
                style={{ borderCurve: 'continuous' }}
                className="flex-1 flex-row items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 py-3 px-3 active:bg-zinc-200 dark:active:bg-zinc-700"
              >
                <NativeIcon
                  sfSymbol="tablecells"
                  materialName="table-chart"
                  FallbackIcon={FileSpreadsheet}
                  size={14}
                  color="#71717a"
                />
                <Text className="ml-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t.reports.exportCSV}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExportJSON}
                style={{ borderCurve: 'continuous' }}
                className="flex-1 flex-row items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 py-3 px-3 active:bg-zinc-200 dark:active:bg-zinc-700"
              >
                <NativeIcon
                  sfSymbol="internaldrive"
                  materialName="storage"
                  FallbackIcon={HardDrive}
                  size={14}
                  color="#71717a"
                />
                <Text className="ml-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t.reports.exportJSON}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 6. Danger Zone Card */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 shadow-none border border-rose-200 dark:border-rose-950/60"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold uppercase tracking-wider text-rose-600">
                {t.settings.dangerZone}
              </Text>
            </View>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              {t.settings.dangerZoneSub}
            </Text>
            <TouchableOpacity
              onPress={handleResetDatabase}
              style={{ borderCurve: 'continuous' }}
              className="flex-row items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 py-3 border border-rose-200 dark:border-rose-900/40 active:bg-rose-100"
            >
              <NativeIcon
                sfSymbol="arrow.counterclockwise"
                materialName="restart-alt"
                FallbackIcon={RotateCcw}
                size={14}
                color="#e11d48"
              />
              <Text className="ml-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                {t.settings.resetAllData}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        visible={showCloudSync}
        onClose={() => setShowCloudSync(false)}
      />
    </View>
  );
}
