import {
  BarChart3,
  Copy,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticReportModal } from '@/src/components/AestheticReportModal';
import { NativeIcon } from '@/src/components/NativeIcon';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { ReportSourceType } from '@/src/types/imageReport';
import {
  copyReportToClipboard,
  downloadFileWeb,
  generateEndOfYearFineSummary,
  generateFinesCSV,
} from '@/src/utils/exporter';
import { formatMMK } from '@/src/utils/formatters';

export default function ReportsScreen() {
  const {
    fines,
    finesSummary,
    students,
    subjects,
    subjectFineStats,
    studentFineStats,
    language,
    t,
  } = useTreasury();
  const { isDark, themeColor } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAestheticModal, setShowAestheticModal] = useState(false);
  const [aestheticInitialType, setAestheticInitialType] = useState<ReportSourceType>('student_fines');

  // Breakdown switcher: 'subject' | 'student'
  const [breakdownMode, setBreakdownMode] = useState<'subject' | 'student'>('subject');

  // 1-Click Copy End-of-Year Fine Summary
  const handleCopyEndOfYearReport = async () => {
    const reportText = generateEndOfYearFineSummary({
      totalPaid: finesSummary.totalPaid,
      totalUnpaid: finesSummary.totalUnpaid,
      totalAll: finesSummary.totalAll,
      subjectStats: subjectFineStats,
    });
    const success = await copyReportToClipboard(reportText);
    if (success) {
      setToastMessage(t.reports.clipboardSuccess);
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    const csv = generateFinesCSV(fines, students, subjects);
    if (Platform.OS === 'web') {
      downloadFileWeb(`ec_fines_report_${Date.now()}.csv`, csv);
      setToastMessage(t.reports.csvSuccess);
    } else {
      await copyReportToClipboard(csv);
      setToastMessage(t.reports.clipboardSuccess);
    }
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
        showsVerticalScrollIndicator={true}
      >
        <View className="w-full max-w-4xl mx-auto">
          {/* Screen Header */}
          <View className="mb-5 pt-2">
            <Text
              selectable
              className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-relaxed py-0.5"
            >
              {t.reports.title}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.reports.subtitle}
            </Text>
          </View>

          {/* 1. Hero Fine Summary Card */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-6 mb-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t.reports.financialStatus}
              </Text>
              <View
                style={{ backgroundColor: themeColor.surface }}
                className="h-8 w-8 rounded-full items-center justify-center"
              >
                <NativeIcon
                  sfSymbol="chart.bar.fill"
                  materialName="bar-chart"
                  FallbackIcon={BarChart3}
                  size={16}
                  color={themeColor.primary}
                />
              </View>
            </View>

            {/* Large Overall Total Display */}
            <Text
              selectable
              style={{ fontVariant: ['tabular-nums'] }}
              className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-4"
            >
              {formatMMK(finesSummary.totalAll)}
            </Text>

            <View className="flex-row gap-3">
              {/* Collected (Paid) */}
              <View
                style={{ borderCurve: 'continuous' }}
                className="flex-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-100 dark:border-emerald-900/30"
              >
                <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">
                  {t.reports.paidFines}
                </Text>
                <Text
                  selectable
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight"
                >
                  {formatMMK(finesSummary.totalPaid)}
                </Text>
              </View>

              {/* Pending (Unpaid) */}
              <View
                style={{ borderCurve: 'continuous' }}
                className="flex-1 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-100 dark:border-rose-900/30"
              >
                <Text className="text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-0.5">
                  {t.reports.unpaidFines}
                </Text>
                <Text
                  selectable
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-xl font-extrabold text-rose-700 dark:text-rose-300 tracking-tight"
                >
                  {formatMMK(finesSummary.totalUnpaid)}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. 1-Click Copy End-of-Year Fine Report Button */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={handleCopyEndOfYearReport}
              activeOpacity={0.85}
              style={{
                backgroundColor: themeColor.primary,
                borderCurve: 'continuous',
              }}
              className="w-full flex-row items-center justify-center rounded-full py-4 px-6 shadow-sm active:opacity-90"
            >
              <NativeIcon
                sfSymbol="doc.on.doc"
                materialName="content-copy"
                FallbackIcon={Copy}
                size={18}
                color={themeColor.onPrimary}
              />
              <Text
                style={{ color: themeColor.onPrimary }}
                className="ml-2 text-sm font-bold"
              >
                {t.reports.finesSummary} ({t.common.copy})
              </Text>
            </TouchableOpacity>
            <Text className="text-[11px] text-zinc-400 text-center mt-2">
              {language === 'en'
                ? 'Ready to share directly to Viber or Telegram'
                : 'စာရင်းချုပ်ကို Viber / Telegram သို့ တိုက်ရိုက်ကူးယူနိုင်ပါသည်'}
            </Text>
          </View>

          {/* 3. Aesthetic Table Image Report Card */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-6 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: themeColor.surface }}
                  className="h-8 w-8 rounded-full items-center justify-center mr-2.5"
                >
                  <NativeIcon
                    sfSymbol="photo.artframe"
                    materialName="image"
                    FallbackIcon={Sparkles}
                    size={16}
                    color={themeColor.primary}
                  />
                </View>
                <View>
                  <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                    {t.reports.imageExport}
                  </Text>
                  <Text className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {language === 'en'
                      ? 'Export formatted table as PNG image'
                      : 'လှပသော ဇယားဒီဇိုင်းဖြင့် Report Image ထုတ်ယူရန်'}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              {language === 'en'
                ? 'Generate high-res table images for student dues and subject fines.'
                : 'ကျောင်းသားဒဏ်ကြေးနှင့် ဘာသာရပ်ဆိုင်ရာ စာရင်းများကို ဇယားပုံစံ Image အဖြစ် ထုတ်ယူနိုင်ပါသည်။'}
            </Text>

            <View className="flex-row gap-2.5">
              <TouchableOpacity
                onPress={() => {
                  setAestheticInitialType('student_fines');
                  setShowAestheticModal(true);
                }}
                activeOpacity={0.85}
                style={{
                  backgroundColor: themeColor.primary,
                  borderCurve: 'continuous',
                }}
                className="flex-1 flex-row items-center justify-center rounded-2xl py-3 px-3 shadow-xs active:opacity-90"
              >
                <NativeIcon
                  sfSymbol="photo.fill"
                  materialName="image"
                  FallbackIcon={ImageIcon}
                  size={15}
                  color={themeColor.onPrimary}
                />
                <Text
                  style={{ color: themeColor.onPrimary }}
                  className="ml-1.5 text-xs font-bold"
                >
                  {language === 'en' ? 'Student Table' : 'ကျောင်းသား ဇယားပုံစံ'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setAestheticInitialType('subject_fines');
                  setShowAestheticModal(true);
                }}
                activeOpacity={0.85}
                style={{
                  borderCurve: 'continuous',
                }}
                className="flex-1 flex-row items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 py-3 px-3 border border-zinc-200/80 dark:border-zinc-700 shadow-xs active:bg-zinc-200 dark:active:bg-zinc-700"
              >
                <NativeIcon
                  sfSymbol="tablecells.fill"
                  materialName="table-chart"
                  FallbackIcon={FileSpreadsheet}
                  size={15}
                  color="#71717a"
                />
                <Text className="ml-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {language === 'en' ? 'Subject Summary' : 'ဘာသာရပ် စာရင်းချုပ်'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Breakdown Switcher (By Subject | By Student) */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {language === 'en' ? 'Fines Breakdown' : 'ဒဏ်ကြေး ခွဲခြမ်းစိတ်ဖြာမှု'}
              </Text>

              {/* Segmented Pills with Theme Accent */}
              <View
                style={{ borderCurve: 'continuous' }}
                className="flex-row p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-zinc-200/70 dark:border-zinc-700/60"
              >
                <TouchableOpacity
                  onPress={() => setBreakdownMode('subject')}
                  style={{
                    backgroundColor:
                      breakdownMode === 'subject' ? themeColor.primary : 'transparent',
                    borderCurve: 'continuous',
                  }}
                  className={`px-3 py-1.5 rounded-full ${
                    breakdownMode === 'subject' ? 'shadow-xs' : ''
                  }`}
                >
                  <Text
                    style={{
                      color:
                        breakdownMode === 'subject'
                          ? themeColor.onPrimary
                          : isDark
                          ? '#d4d4d8'
                          : '#52525b',
                    }}
                    className="text-xs font-bold"
                  >
                    {t.reports.subject}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setBreakdownMode('student')}
                  style={{
                    backgroundColor:
                      breakdownMode === 'student' ? themeColor.primary : 'transparent',
                    borderCurve: 'continuous',
                  }}
                  className={`px-3 py-1.5 rounded-full ${
                    breakdownMode === 'student' ? 'shadow-xs' : ''
                  }`}
                >
                  <Text
                    style={{
                      color:
                        breakdownMode === 'student'
                          ? themeColor.onPrimary
                          : isDark
                          ? '#d4d4d8'
                          : '#52525b',
                    }}
                    className="text-xs font-bold"
                  >
                    {t.reports.student}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Breakdown Content */}
            {breakdownMode === 'subject' ? (
              subjectFineStats.length === 0 ? (
                <View
                  style={{ borderCurve: 'continuous' }}
                  className="rounded-2xl bg-white dark:bg-zinc-900 p-6 items-center border border-zinc-200/70 dark:border-zinc-800/80"
                >
                  <Text className="text-xs text-zinc-400">{t.reports.noSubjects}</Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {subjectFineStats.map((stat) => (
                    <View
                      key={stat.subject.id}
                      style={{ borderCurve: 'continuous' }}
                      className="rounded-3xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/70 dark:border-zinc-800/80"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text
                          selectable
                          className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
                        >
                          {stat.subject.name}
                        </Text>
                        <Text className="text-xs font-semibold text-zinc-400">
                          {t.reports.totalFinesCount(stat.count)}
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <View>
                          <Text className="text-[10px] text-zinc-400">{t.common.paid}</Text>
                          <Text
                            selectable
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400"
                          >
                            {formatMMK(stat.totalPaid)}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-[10px] text-zinc-400">{t.common.unpaid}</Text>
                          <Text
                            selectable
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-xs font-bold text-rose-600 dark:text-rose-400"
                          >
                            {formatMMK(stat.totalUnpaid)}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-[10px] text-zinc-400">{t.common.total}</Text>
                          <Text
                            selectable
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50"
                          >
                            {formatMMK(stat.totalAll)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )
            ) : (
              studentFineStats.length === 0 ? (
                <View
                  style={{ borderCurve: 'continuous' }}
                  className="rounded-2xl bg-white dark:bg-zinc-900 p-6 items-center border border-zinc-200/70 dark:border-zinc-800/80"
                >
                  <Text className="text-xs text-zinc-400">{t.roster.emptyStudentsTitle}</Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {studentFineStats
                    .sort((a, b) => b.totalUnpaid - a.totalUnpaid)
                    .map((stat) => (
                      <View
                        key={stat.student.id}
                        style={{ borderCurve: 'continuous' }}
                        className="rounded-3xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/70 dark:border-zinc-800/80 flex-row items-center justify-between"
                      >
                        <View className="flex-1 mr-3">
                          <Text
                            selectable
                            className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
                          >
                            {stat.student.name}
                            {stat.student.rollNumber ? ` (${stat.student.rollNumber})` : ''}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <Text
                              selectable
                              style={{ fontVariant: ['tabular-nums'] }}
                              className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold"
                            >
                              {t.common.paid}: {formatMMK(stat.totalPaid)}
                            </Text>
                            <Text className="text-[11px] text-zinc-400">•</Text>
                            <Text
                              selectable
                              style={{ fontVariant: ['tabular-nums'] }}
                              className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold"
                            >
                              {t.common.unpaid}: {formatMMK(stat.totalUnpaid)}
                            </Text>
                          </View>
                        </View>

                        <View className="items-end">
                          <Text
                            selectable
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50"
                          >
                            {formatMMK(stat.totalAll)}
                          </Text>
                          {stat.unpaidCount > 0 ? (
                            <Text className="text-[10px] text-rose-500 font-bold">
                              {t.reports.unpaidCount(stat.unpaidCount)}
                            </Text>
                          ) : (
                            <Text className="text-[10px] text-emerald-500 font-bold">
                              {t.roster.allClear}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                </View>
              )
            )}
          </View>

          {/* 5. Quick Export Actions Toolbar */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center mb-3">
              <View
                style={{ backgroundColor: themeColor.surface }}
                className="h-8 w-8 rounded-full items-center justify-center mr-2.5"
              >
                <NativeIcon
                  sfSymbol="arrow.up.doc.fill"
                  materialName="file-download"
                  FallbackIcon={FileSpreadsheet}
                  size={16}
                  color={themeColor.primary}
                />
              </View>
              <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {t.common.export}
              </Text>
            </View>

            <View className="flex-row gap-2.5">
              <TouchableOpacity
                onPress={() => {
                  setAestheticInitialType('student_fines');
                  setShowAestheticModal(true);
                }}
                style={{
                  borderCurve: 'continuous',
                  backgroundColor: themeColor.surface,
                  borderColor: themeColor.border,
                }}
                className="flex-1 flex-row items-center justify-center rounded-full py-3 border active:opacity-80"
              >
                <NativeIcon
                  sfSymbol="photo.artframe"
                  materialName="image"
                  FallbackIcon={ImageIcon}
                  size={14}
                  color={themeColor.primary}
                />
                <Text
                  style={{ color: themeColor.text }}
                  className="ml-1.5 text-xs font-bold"
                >
                  {t.reports.imageExport}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExportCSV}
                style={{ borderCurve: 'continuous' }}
                className="flex-1 flex-row items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 py-3 active:bg-zinc-200 dark:active:bg-zinc-700"
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
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Aesthetic Table Image Report Modal */}
      <AestheticReportModal
        visible={showAestheticModal}
        onClose={() => setShowAestheticModal(false)}
        onShowToast={(msg) => setToastMessage(msg)}
        initialReportType={aestheticInitialType}
      />
    </View>
  );
}
