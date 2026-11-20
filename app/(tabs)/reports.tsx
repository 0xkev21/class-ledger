import {
  BarChart3,
  Copy,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticReportModal } from '@/src/components/AestheticReportModal';
import { NativeIcon } from '@/src/components/NativeIcon';
import { StatusPill } from '@/src/components/StatusPill';
import { ToastNotification } from '@/src/components/ToastNotification';
import { AnimatedSegmentedControl } from '@/src/components/animated/AnimatedSegmentedControl';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { StudentFineStat, SubjectFineStat } from '@/src/types';
import { ReportSourceType } from '@/src/types/imageReport';
import {
  copyReportToClipboard,
  downloadFileWeb,
  generateEndOfYearFineSummary,
  generateFinesCSV,
} from '@/src/utils/exporter';
import { formatMMK } from '@/src/utils/formatters';
import { Haptics } from '@/src/utils/haptics';

function chunkPairs<T>(items: T[]): Array<[T, T | null]> {
  const pairs: Array<[T, T | null]> = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push([items[i], items[i + 1] ?? null]);
  }
  return pairs;
}

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
  const { themeColor, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Mount guard on web keeps static SSR and client hydration identical
  const [hasMounted, setHasMounted] = useState(!isWeb);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const isDesktop = hasMounted && width >= 1024;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAestheticModal, setShowAestheticModal] = useState(false);
  const [aestheticInitialType, setAestheticInitialType] =
    useState<ReportSourceType>('student_fines');
  const [breakdownMode, setBreakdownMode] = useState<'subject' | 'student'>(
    'subject'
  );

  const sortedStudentStats = useMemo(
    () =>
      [...studentFineStats].sort((a, b) => b.totalUnpaid - a.totalUnpaid),
    [studentFineStats]
  );

  const subjectPairs = useMemo(
    () => chunkPairs(subjectFineStats),
    [subjectFineStats]
  );
  const studentPairs = useMemo(
    () => chunkPairs(sortedStudentStats),
    [sortedStudentStats]
  );

  const collectionPct =
    finesSummary.totalAll > 0
      ? Math.min(
          100,
          Math.round((finesSummary.totalPaid / finesSummary.totalAll) * 100)
        )
      : 0;

  const breakdownTabs = useMemo(
    () => [
      { id: 'subject' as const, label: t.reports.subject },
      { id: 'student' as const, label: t.reports.student },
    ],
    [t]
  );

  const handleCopyEndOfYearReport = async () => {
    Haptics.selectionAsync();
    const reportText = generateEndOfYearFineSummary({
      totalPaid: finesSummary.totalPaid,
      totalUnpaid: finesSummary.totalUnpaid,
      totalAll: finesSummary.totalAll,
      subjectStats: subjectFineStats,
    });
    const success = await copyReportToClipboard(reportText);
    if (success) {
      Haptics.notificationSuccessAsync();
      setToastMessage(t.reports.clipboardSuccess);
    }
  };

  const handleExportCSV = async () => {
    Haptics.selectionAsync();
    const csv = generateFinesCSV(fines, students, subjects);
    if (Platform.OS === 'web') {
      downloadFileWeb(`ec_fines_report_${Date.now()}.csv`, csv);
      Haptics.notificationSuccessAsync();
      setToastMessage(t.reports.csvSuccess);
    } else {
      await copyReportToClipboard(csv);
      Haptics.notificationSuccessAsync();
      setToastMessage(t.reports.clipboardSuccess);
    }
  };

  const openAesthetic = (type: ReportSourceType) => {
    Haptics.selectionAsync();
    setAestheticInitialType(type);
    setShowAestheticModal(true);
  };

  const renderSubjectCard = (stat: SubjectFineStat) => (
    <View
      key={stat.subject.id}
      style={[
        styles.breakdownCard,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.subjectHeaderRow}>
        <Text
          selectable
          numberOfLines={1}
          style={[
            styles.breakdownTitle,
            { color: palette.ink, fontFamily: fonts.semibold },
          ]}
        >
          {stat.subject.name}
        </Text>
        <StatusPill
          variant="neutral"
          mono
          label={t.reports.totalFinesCount(stat.count)}
        />
      </View>

      <View
        style={[
          styles.subjectStatsRow,
          { borderTopColor: palette.line },
        ]}
      >
        <View style={styles.statCol}>
          <Text
            style={[
              styles.statMicroLabel,
              { color: palette.muted, fontFamily: fonts.regular },
            ]}
          >
            {t.common.paid}
          </Text>
          <Text
            selectable
            style={[
              styles.statMonoVal,
              { color: palette.paidText, fontFamily: fonts.monoMedium },
            ]}
          >
            {formatMMK(stat.totalPaid)}
          </Text>
        </View>

        <View style={styles.statCol}>
          <Text
            style={[
              styles.statMicroLabel,
              { color: palette.muted, fontFamily: fonts.regular },
            ]}
          >
            {t.common.unpaid}
          </Text>
          <Text
            selectable
            style={[
              styles.statMonoVal,
              { color: palette.unpaidText, fontFamily: fonts.monoMedium },
            ]}
          >
            {formatMMK(stat.totalUnpaid)}
          </Text>
        </View>

        <View style={styles.statColEnd}>
          <Text
            style={[
              styles.statMicroLabel,
              { color: palette.muted, fontFamily: fonts.regular },
            ]}
          >
            {t.common.total}
          </Text>
          <Text
            selectable
            style={[
              styles.statMonoVal,
              { color: palette.ink, fontFamily: fonts.monoMedium },
            ]}
          >
            {formatMMK(stat.totalAll)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStudentCard = (stat: StudentFineStat) => (
    <View
      key={stat.student.id}
      style={[
        styles.studentStatCard,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.studentStatLeft}>
        <View style={styles.studentTitleLine}>
          {stat.student.rollNumber ? (
            <StatusPill variant="neutral" mono label={stat.student.rollNumber} />
          ) : null}
          <Text
            selectable
            numberOfLines={1}
            style={[
              styles.breakdownTitle,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {stat.student.name}
          </Text>
        </View>

        <View style={styles.studentSubStats}>
          <Text
            selectable
            style={[
              styles.studentSubVal,
              { color: palette.paidText, fontFamily: fonts.mono },
            ]}
          >
            {t.common.paid}: {formatMMK(stat.totalPaid)}
          </Text>
          <Text style={[styles.dotSep, { color: palette.muted }]}>·</Text>
          <Text
            selectable
            style={[
              styles.studentSubVal,
              { color: palette.unpaidText, fontFamily: fonts.mono },
            ]}
          >
            {t.common.unpaid}: {formatMMK(stat.totalUnpaid)}
          </Text>
        </View>
      </View>

      <View style={styles.studentStatRight}>
        <Text
          selectable
          style={[
            styles.statMonoVal,
            { color: palette.ink, fontFamily: fonts.monoMedium },
          ]}
        >
          {formatMMK(stat.totalAll)}
        </Text>
        <StatusPill
          variant={stat.unpaidCount > 0 ? 'unpaid' : 'paid'}
          label={
            stat.unpaidCount > 0
              ? t.reports.unpaidCount(stat.unpaidCount)
              : t.roster.allClear
          }
        />
      </View>
    </View>
  );

  const financialCard = (
    <View
      style={[
        styles.card,
        isDesktop ? styles.desktopFinancialCol : styles.mb16,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="chart.bar.fill"
              materialName="bar-chart"
              FallbackIcon={BarChart3}
              size={16}
              color={themeColor.primary}
            />
          </View>
          <Text
            style={[
              styles.eyebrowText,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.reports.financialStatus}
          </Text>
        </View>
        <StatusPill
          variant="neutral"
          mono
          label={t.fines.countFines(fines.length)}
        />
      </View>

      <Text
        selectable
        style={[
          styles.heroFigure,
          { color: palette.ink, fontFamily: fonts.bold },
        ]}
      >
        {formatMMK(finesSummary.totalAll)}
      </Text>

      <View style={styles.metricsSplitRow}>
        <View
          style={[styles.metricBox, { backgroundColor: palette.paidBg }]}
        >
          <Text
            style={[
              styles.metricLabel,
              { color: palette.paidText, fontFamily: fonts.medium },
            ]}
          >
            {t.reports.paidFines}
          </Text>
          <Text
            selectable
            style={[
              styles.metricValue,
              { color: palette.paidText, fontFamily: fonts.monoMedium },
            ]}
          >
            {formatMMK(finesSummary.totalPaid)}
          </Text>
        </View>

        <View
          style={[styles.metricBox, { backgroundColor: palette.unpaidBg }]}
        >
          <Text
            style={[
              styles.metricLabel,
              { color: palette.unpaidText, fontFamily: fonts.medium },
            ]}
          >
            {t.reports.unpaidFines}
          </Text>
          <Text
            selectable
            style={[
              styles.metricValue,
              { color: palette.unpaidText, fontFamily: fonts.monoMedium },
            ]}
          >
            {formatMMK(finesSummary.totalUnpaid)}
          </Text>
        </View>
      </View>

      {/* Collection Rate Progress Bar */}
      <View style={styles.progressSection}>
        <View
          style={[styles.progressTrack, { backgroundColor: palette.surface }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: themeColor.primary,
                width: `${collectionPct}%` as any,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.progressCaption,
            { color: palette.muted, fontFamily: fonts.mono },
          ]}
        >
          {finesSummary.totalAll > 0
            ? `${collectionPct}% ${
                language === 'en' ? t.common.paid.toLowerCase() : t.common.paid
              }`
            : `0% ${
                language === 'en' ? t.common.paid.toLowerCase() : t.common.paid
              }`}
        </Text>
      </View>
    </View>
  );

  const exportHubCard = (
    <View
      style={[
        styles.card,
        isDesktop ? styles.desktopExportCol : styles.mb20,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.exportHeaderRow}>
        <View
          style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
        >
          <NativeIcon
            sfSymbol="photo.artframe"
            materialName="image"
            FallbackIcon={Sparkles}
            size={16}
            color={themeColor.primary}
          />
        </View>
        <View style={styles.flexMinZero}>
          <Text
            style={[
              styles.cardTitle,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {t.reports.imageExport}
          </Text>
          <Text
            style={[
              styles.cardSub,
              { color: palette.muted, fontFamily: fonts.regular },
            ]}
          >
            {language === 'en'
              ? 'Export stationery PNG/SVG sheets, summary text, or CSV'
              : 'ဇယားပုံစံ PNG/SVG ၊ စာရင်းချုပ် နှင့် CSV ဖိုင်များ ထုတ်ယူရန်'}
          </Text>
        </View>
      </View>

      {/* Primary Stationery Studio Actions */}
      <View style={styles.exportActionsRow}>
        <TouchableOpacity
          onPress={() => openAesthetic('student_fines')}
          activeOpacity={0.85}
          accessibilityRole="button"
          style={[
            styles.primaryExportBtn,
            {
              backgroundColor: themeColor.primary,
            },
          ]}
        >
          <NativeIcon
            sfSymbol="photo.fill"
            materialName="image"
            FallbackIcon={ImageIcon}
            size={15}
            color={themeColor.onPrimary}
          />
          <Text
            style={[
              styles.primaryExportText,
              { color: themeColor.onPrimary, fontFamily: fonts.semibold },
            ]}
          >
            {language === 'en' ? 'Student Table' : 'ကျောင်းသား ဇယား'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openAesthetic('subject_fines')}
          activeOpacity={0.8}
          accessibilityRole="button"
          style={[
            styles.secondaryExportBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <NativeIcon
            sfSymbol="tablecells.fill"
            materialName="table-chart"
            FallbackIcon={FileSpreadsheet}
            size={15}
            color={palette.ink}
          />
          <Text
            style={[
              styles.secondaryExportText,
              { color: palette.ink, fontFamily: fonts.medium },
            ]}
          >
            {language === 'en' ? 'Subject Summary' : 'ဘာသာရပ် စာရင်း'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Utility Actions */}
      <View style={styles.exportActionsRow}>
        <TouchableOpacity
          onPress={handleCopyEndOfYearReport}
          activeOpacity={0.78}
          accessibilityRole="button"
          style={[
            styles.utilityBtn,
            {
              backgroundColor: palette.card,
              borderColor: palette.line,
            },
          ]}
        >
          <NativeIcon
            sfSymbol="doc.on.doc"
            materialName="content-copy"
            FallbackIcon={Copy}
            size={14}
            color={themeColor.primary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.utilityBtnText,
              { color: palette.ink, fontFamily: fonts.medium },
            ]}
          >
            {language === 'en' ? 'Copy Summary' : `${t.reports.finesSummary}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportCSV}
          activeOpacity={0.78}
          accessibilityRole="button"
          style={[
            styles.utilityBtn,
            {
              backgroundColor: palette.card,
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
            numberOfLines={1}
            style={[
              styles.utilityBtnText,
              { color: palette.ink, fontFamily: fonts.medium },
            ]}
          >
            {t.reports.exportCSV}
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        style={[
          styles.exportHint,
          { color: palette.muted, fontFamily: fonts.regular },
        ]}
      >
        {language === 'en'
          ? 'Summary text is ready for Viber or Telegram; CSV escapes formulas safely'
          : 'စာရင်းချုပ်ကို Viber / Telegram သို့ တိုက်ရိုက်ကူးယူနိုင်သည်'}
      </Text>
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
          {/* Screen Header */}
          <View style={styles.headerRow}>
            <View style={styles.flexMinZero}>
              <Text
                selectable
                style={[
                  styles.pageTitle,
                  { color: palette.ink, fontFamily: fonts.bold },
                ]}
              >
                {t.reports.title}
              </Text>
              <Text
                style={[
                  styles.pageSubtitle,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {t.reports.subtitle}
              </Text>
            </View>

            {isDesktop ? (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleExportCSV}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  style={[
                    styles.headerOutlineBtn,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="tablecells"
                    materialName="table-chart"
                    FallbackIcon={FileSpreadsheet}
                    size={15}
                    color={palette.subtle}
                  />
                  <Text
                    style={[
                      styles.headerBtnText,
                      { color: palette.ink, fontFamily: fonts.medium },
                    ]}
                  >
                    {t.reports.exportCSV}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCopyEndOfYearReport}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  style={[
                    styles.headerPrimaryBtn,
                    {
                      backgroundColor: themeColor.primary,
                    },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="doc.on.doc"
                    materialName="content-copy"
                    FallbackIcon={Copy}
                    size={15}
                    color={themeColor.onPrimary}
                  />
                  <Text
                    style={[
                      styles.headerBtnText,
                      { color: themeColor.onPrimary, fontFamily: fonts.semibold },
                    ]}
                  >
                    {language === 'en' ? 'Copy Summary' : t.common.copy}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Top Financial Summary + Export Hub */}
          {isDesktop ? (
            <View style={styles.desktopTopRow}>
              {financialCard}
              {exportHubCard}
            </View>
          ) : (
            <>
              {financialCard}
              {exportHubCard}
            </>
          )}

          {/* Fines Breakdown Switcher */}
          <View
            style={[
              styles.breakdownHeaderRow,
              !isDesktop ? styles.mobileBreakdownHeaderCol : null,
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: palette.ink, fontFamily: fonts.semibold },
              ]}
            >
              {language === 'en' ? 'Fines Breakdown' : 'ဒဏ်ကြေး ခွဲခြမ်းစိတ်ဖြာမှု'}
            </Text>

            <AnimatedSegmentedControl<'subject' | 'student'>
              tabs={breakdownTabs}
              activeId={breakdownMode}
              onChange={setBreakdownMode}
              activeColor={palette.ink}
              onActiveColor={palette.bg}
              backgroundColor={palette.surface}
              inactiveTextColor={palette.muted}
              style={
                isDesktop
                  ? styles.desktopBreakdownControl
                  : styles.mobileBreakdownControl
              }
            />
          </View>

          {/* Breakdown List */}
          {breakdownMode === 'subject' ? (
            subjectFineStats.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: palette.card, borderColor: palette.line },
                ]}
              >
                <Text
                  style={[
                    styles.emptyBoxText,
                    { color: palette.muted, fontFamily: fonts.regular },
                  ]}
                >
                  {t.reports.noSubjects}
                </Text>
              </View>
            ) : isDesktop ? (
              <View style={styles.gridGap}>
                {subjectPairs.map(([leftItem, rightItem]) => (
                  <View key={leftItem.subject.id} style={styles.desktopGridRow}>
                    <View style={styles.desktopGridCol}>
                      {renderSubjectCard(leftItem)}
                    </View>
                    <View style={styles.desktopGridCol}>
                      {rightItem ? renderSubjectCard(rightItem) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.listGap}>
                {subjectFineStats.map((stat) => renderSubjectCard(stat))}
              </View>
            )
          ) : sortedStudentStats.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: palette.card, borderColor: palette.line },
              ]}
            >
              <Text
                style={[
                  styles.emptyBoxText,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {t.roster.emptyStudentsTitle}
              </Text>
            </View>
          ) : isDesktop ? (
            <View style={styles.gridGap}>
              {studentPairs.map(([leftItem, rightItem]) => (
                <View key={leftItem.student.id} style={styles.desktopGridRow}>
                  <View style={styles.desktopGridCol}>
                    {renderStudentCard(leftItem)}
                  </View>
                  <View style={styles.desktopGridCol}>
                    {rightItem ? renderStudentCard(rightItem) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.listGap}>
              {sortedStudentStats.map((stat) => renderStudentCard(stat))}
            </View>
          )}
        </View>
      </ScrollView>

      <AestheticReportModal
        visible={showAestheticModal}
        onClose={() => setShowAestheticModal(false)}
        onShowToast={(msg) => setToastMessage(msg)}
        initialReportType={aestheticInitialType}
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
  mb16: {
    marginBottom: 16,
  },
  mb20: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    paddingTop: 6,
  },
  headerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  headerPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  headerBtnText: {
    fontSize: 13,
  },
  desktopTopRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    marginBottom: 22,
  },
  desktopFinancialCol: {
    flex: 7,
  },
  desktopExportCol: {
    flex: 5,
    justifyContent: 'space-between',
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
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  eyebrowText: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroFigure: {
    fontSize: 32,
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  metricsSplitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 25,
    fontVariant: ['tabular-nums'],
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  progressCaption: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  exportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 21,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  exportActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  primaryExportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 11,
    paddingHorizontal: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  primaryExportText: {
    fontSize: 12,
  },
  secondaryExportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  secondaryExportText: {
    fontSize: 12,
  },
  utilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  utilityBtnText: {
    fontSize: 12,
  },
  exportHint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  mobileBreakdownHeaderCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 30,
    paddingTop: 2,
  },
  desktopBreakdownControl: {
    width: 280,
  },
  mobileBreakdownControl: {
    width: '100%',
  },
  gridGap: {
    gap: 12,
  },
  desktopGridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  desktopGridCol: {
    flex: 1,
    minWidth: 0,
  },
  listGap: {
    gap: 10,
  },
  breakdownCard: {
    flex: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  breakdownTitle: {
    fontSize: 15,
    flexShrink: 1,
  },
  subjectStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  statCol: {
    flex: 1,
    gap: 2,
  },
  statColEnd: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  statMicroLabel: {
    fontSize: 11,
  },
  statMonoVal: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  studentStatCard: {
    flex: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  studentStatLeft: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  studentTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  studentSubStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  studentSubVal: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  dotSep: {
    fontSize: 12,
  },
  studentStatRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  emptyBox: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyBoxText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
