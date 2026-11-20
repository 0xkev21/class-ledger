import { Gavel, Image as ImageIcon, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { BatchFineModal } from '@/src/components/BatchFineModal';
import { EmptyState } from '@/src/components/EmptyState';
import { FloatingActionButton } from '@/src/components/FloatingActionButton';
import { NativeIcon } from '@/src/components/NativeIcon';
import { SearchBar } from '@/src/components/SearchBar';
import { StatusPill } from '@/src/components/StatusPill';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { Fine } from '@/src/types';
import { formatMMK } from '@/src/utils/formatters';
import { Haptics } from '@/src/utils/haptics';

function chunkPairs<T>(items: T[]): Array<[T, T | null]> {
  const pairs: Array<[T, T | null]> = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push([items[i], items[i + 1] ?? null]);
  }
  return pairs;
}

export default function FinesScreen() {
  const {
    fines,
    students,
    subjects,
    finesSummary,
    toggleFinePaid,
    deleteFine,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>(
    'all'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAestheticModal, setShowAestheticModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const studentMap = useMemo(() => {
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);

  const subjectMap = useMemo(() => {
    return new Map(subjects.map((s) => [s.id, s]));
  }, [subjects]);

  const filteredFines = useMemo(() => {
    return fines.filter((fine) => {
      if (statusFilter === 'unpaid' && fine.isPaid) return false;
      if (statusFilter === 'paid' && !fine.isPaid) return false;

      if (
        selectedSubjectId !== 'all' &&
        fine.subjectId !== selectedSubjectId
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const student = studentMap.get(fine.studentId);
        const nameMatch = student?.name.toLowerCase().includes(q) || false;
        const rollMatch =
          student?.rollNumber?.toLowerCase().includes(q) || false;
        const reasonMatch = fine.reason.toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !reasonMatch) return false;
      }

      return true;
    });
  }, [fines, statusFilter, selectedSubjectId, searchQuery, studentMap]);

  const finePairs = useMemo(
    () => chunkPairs(filteredFines),
    [filteredFines]
  );

  const performDeleteFine = async (fineId: string) => {
    await deleteFine(fineId);
    setToastMessage(t.fines.deleteToast);
  };

  const handleDeleteFine = (fineId: string, studentName: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(t.fines.deleteMsg(studentName))) {
        void performDeleteFine(fineId);
      }
      return;
    }

    Alert.alert(t.fines.deleteTitle, t.fines.deleteMsg(studentName), [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: () => {
          void performDeleteFine(fineId);
        },
      },
    ]);
  };

  const renderStatusChips = () => (
    <View style={styles.statusChipRow}>
      {(['all', 'unpaid', 'paid'] as const).map((st) => {
        const isSelected = statusFilter === st;
        const count =
          st === 'all'
            ? fines.length
            : st === 'unpaid'
            ? fines.filter((f) => !f.isPaid).length
            : fines.filter((f) => f.isPaid).length;

        const label =
          st === 'all'
            ? `${t.common.all} (${count})`
            : st === 'unpaid'
            ? `${t.common.unpaid} (${count})`
            : `${t.common.paid} (${count})`;

        return (
          <TouchableOpacity
            key={st}
            onPress={() => {
              Haptics.selectionAsync();
              setStatusFilter(st);
            }}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? palette.ink : palette.surface,
                borderColor: isSelected ? palette.ink : palette.line,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? palette.bg : palette.ink,
                  fontFamily: fonts.medium,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFineCard = (fine: Fine) => {
    const student = studentMap.get(fine.studentId);
    const subject = subjectMap.get(fine.subjectId);
    const studentName = student?.name || t.common.name;

    return (
      <View
        key={fine.id}
        style={[
          styles.fineCard,
          {
            backgroundColor: palette.card,
            borderColor: palette.line,
          },
        ]}
      >
        {/* Top Row: Subject + Date on Left, Amount on Right */}
        <View style={styles.fineTopRow}>
          <View style={styles.fineBadgesLeft}>
            <StatusPill variant="brand" label={subject?.name || 'General'} />
            <StatusPill variant="neutral" mono label={fine.date} />
          </View>
          <Text
            selectable
            style={[
              styles.fineAmount,
              { color: palette.ink, fontFamily: fonts.monoMedium },
            ]}
          >
            {formatMMK(fine.amount)}
          </Text>
        </View>

        {/* Middle Row: Roll + Name + Reason */}
        <View style={styles.fineStudentBlock}>
          <View style={styles.fineStudentNameLine}>
            {student?.rollNumber ? (
              <Text
                selectable
                style={[
                  styles.fineRollText,
                  { color: palette.ink, fontFamily: fonts.monoMedium },
                ]}
              >
                {student.rollNumber}
              </Text>
            ) : null}
            <Text
              selectable
              numberOfLines={1}
              style={[
                styles.fineStudentName,
                { color: palette.ink, fontFamily: fonts.semibold },
              ]}
            >
              {studentName}
            </Text>
          </View>
          <Text
            selectable
            style={[
              styles.fineReason,
              { color: palette.muted, fontFamily: fonts.regular },
            ]}
          >
            {fine.reason}
          </Text>
        </View>

        {/* Bottom Row: 1-Tap Paid/Unpaid Toggle + Delete */}
        <View
          style={[
            styles.fineBottomRow,
            { borderTopColor: palette.line },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.impactLightAsync();
              toggleFinePaid(fine.id);
            }}
            activeOpacity={0.78}
            accessibilityRole="switch"
            accessibilityState={{ checked: fine.isPaid }}
            accessibilityLabel={`${studentName}, ${
              fine.isPaid ? t.common.paid : t.common.unpaid
            }`}
            style={styles.statusSwitchPress}
          >
            <StatusPill
              variant={fine.isPaid ? 'paid' : 'unpaid'}
              label={fine.isPaid ? t.common.paid : t.common.unpaid}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteFine(fine.id, studentName)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.common.delete}
            hitSlop={6}
            style={[
              styles.deleteCircleBtn,
              {
                backgroundColor: palette.surface,
              },
            ]}
          >
            <NativeIcon
              sfSymbol="trash"
              materialName="delete"
              FallbackIcon={Trash2}
              size={14}
              color={palette.muted}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          style={[
            styles.container,
            { maxWidth: isDesktop ? 1280 : 760 },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text
                selectable
                style={[
                  styles.pageTitle,
                  { color: palette.ink, fontFamily: fonts.bold },
                ]}
              >
                {t.fines.title}
              </Text>
              <Text
                style={[
                  styles.pageSubtitle,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {t.fines.subtitle}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowAestheticModal(true);
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t.fines.imageExport}
                style={[
                  styles.exportBtn,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.line,
                  },
                ]}
              >
                <NativeIcon
                  sfSymbol="photo.artframe"
                  materialName="image"
                  FallbackIcon={ImageIcon}
                  size={15}
                  color={themeColor.primary}
                />
                <Text
                  style={[
                    styles.exportBtnText,
                    { color: palette.ink, fontFamily: fonts.medium },
                  ]}
                >
                  {t.fines.imageExport}
                </Text>
              </TouchableOpacity>

              {isDesktop ? (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowBatchModal(true);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t.fines.batchFine}
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: themeColor.primary,
                    },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="plus"
                    materialName="add"
                    FallbackIcon={Plus}
                    size={16}
                    color={themeColor.onPrimary}
                  />
                  <Text
                    style={[
                      styles.primaryActionText,
                      {
                        color: themeColor.onPrimary,
                        fontFamily: fonts.semibold,
                      },
                    ]}
                  >
                    {t.fines.batchFine}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Summary Strip */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.line,
              },
            ]}
          >
            <View style={styles.summaryTopRow}>
              <Text
                style={[
                  styles.summaryEyebrow,
                  { color: palette.muted, fontFamily: fonts.medium },
                ]}
              >
                {t.fines.summaryTitle}
              </Text>
              <StatusPill
                variant="neutral"
                mono
                label={t.fines.countFines(fines.length)}
              />
            </View>

            <View style={styles.summaryMetricsRow}>
              {isDesktop ? (
                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: themeColor.primaryDark },
                  ]}
                >
                  <Text
                    style={[
                      styles.metricLabel,
                      {
                        color: themeColor.onPrimary,
                        fontFamily: fonts.medium,
                        opacity: 0.85,
                      },
                    ]}
                  >
                    {t.fines.totalAll}
                  </Text>
                  <Text
                    selectable
                    style={[
                      styles.metricValueLarge,
                      {
                        color: themeColor.onPrimary,
                        fontFamily: fonts.monoMedium,
                      },
                    ]}
                  >
                    {formatMMK(finesSummary.totalAll)}
                  </Text>
                </View>
              ) : null}

              <View
                style={[styles.metricBox, { backgroundColor: palette.paidBg }]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: palette.paidText, fontFamily: fonts.medium },
                  ]}
                >
                  {t.fines.paidTotal}
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
                style={[
                  styles.metricBox,
                  { backgroundColor: palette.unpaidBg },
                ]}
              >
                <Text
                  style={[
                    styles.metricLabel,
                    { color: palette.unpaidText, fontFamily: fonts.medium },
                  ]}
                >
                  {t.fines.unpaidTotal}
                </Text>
                <Text
                  selectable
                  style={[
                    styles.metricValue,
                    {
                      color: palette.unpaidText,
                      fontFamily: fonts.monoMedium,
                    },
                  ]}
                >
                  {formatMMK(finesSummary.totalUnpaid)}
                </Text>
              </View>
            </View>
          </View>

          {/* Filters & Search */}
          <View style={styles.controlsWrap}>
            {isDesktop ? (
              <View style={styles.desktopToolbarRow}>
                {renderStatusChips()}
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t.fines.searchPlaceholder}
                  style={styles.desktopSearchBar}
                />
              </View>
            ) : (
              <>
                {renderStatusChips()}
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t.fines.searchPlaceholder}
                />
              </>
            )}

            {/* Subject Filter Chips */}
            {subjects.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectChipsContent}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedSubjectId('all');
                  }}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedSubjectId === 'all' }}
                  style={[
                    styles.subjectChip,
                    {
                      backgroundColor:
                        selectedSubjectId === 'all'
                          ? themeColor.surface
                          : palette.card,
                      borderColor:
                        selectedSubjectId === 'all'
                          ? themeColor.border
                          : palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.subjectChipText,
                      {
                        color:
                          selectedSubjectId === 'all'
                            ? themeColor.text
                            : palette.muted,
                        fontFamily: fonts.medium,
                      },
                    ]}
                  >
                    {t.fines.allSubjects}
                  </Text>
                </TouchableOpacity>

                {subjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSubjectId(sub.id);
                      }}
                      activeOpacity={0.78}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.subjectChip,
                        {
                          backgroundColor: isSelected
                            ? themeColor.surface
                            : palette.card,
                          borderColor: isSelected
                            ? themeColor.border
                            : palette.line,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subjectChipText,
                          {
                            color: isSelected
                              ? themeColor.text
                              : palette.muted,
                            fontFamily: fonts.medium,
                          },
                        ]}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          {/* Fines Feed */}
          {filteredFines.length === 0 ? (
            <EmptyState
              title={t.fines.emptyTitle}
              description={t.fines.emptyDesc}
              icon={Gavel}
              sfSymbol="exclamationmark.triangle.fill"
              materialName="gavel"
              actionLabel={t.fines.batchFine}
              onActionPress={() => setShowBatchModal(true)}
            />
          ) : isDesktop ? (
            <View style={styles.feedGridGap}>
              {finePairs.map(([leftItem, rightItem]) => (
                <View key={leftItem.id} style={styles.desktopGridRow}>
                  <View style={styles.desktopGridCol}>
                    {renderFineCard(leftItem)}
                  </View>
                  <View style={styles.desktopGridCol}>
                    {rightItem ? renderFineCard(rightItem) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.feedListGap}>
              {filteredFines.map((fine) => renderFineCard(fine))}
            </View>
          )}
        </View>
      </ScrollView>

      {!isDesktop ? (
        <FloatingActionButton
          onPress={() => setShowBatchModal(true)}
          label={t.fines.batchFine}
        />
      ) : null}

      <BatchFineModal
        visible={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSuccess={(count) => {
          setToastMessage(t.fines.batchCountToast(count));
        }}
      />

      <AestheticReportModal
        visible={showAestheticModal}
        onClose={() => setShowAestheticModal(false)}
        onShowToast={(msg) => setToastMessage(msg)}
        initialReportType="student_fines"
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  exportBtnText: {
    fontSize: 12,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  primaryActionText: {
    fontSize: 13,
  },
  summaryCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  summaryEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 19,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
  metricValueLarge: {
    fontSize: 20,
    lineHeight: 25,
    fontVariant: ['tabular-nums'],
  },
  controlsWrap: {
    gap: 10,
    marginBottom: 16,
  },
  desktopToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  desktopSearchBar: {
    flex: 1,
    maxWidth: 380,
  },
  statusChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  chipText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  subjectChipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectChip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  subjectChipText: {
    fontSize: 12,
  },
  feedGridGap: {
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
  feedListGap: {
    gap: 10,
  },
  fineCard: {
    flex: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  fineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  fineBadgesLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  fineAmount: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  fineStudentBlock: {
    gap: 3,
  },
  fineStudentNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  fineRollText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  fineStudentName: {
    fontSize: 14,
    flexShrink: 1,
  },
  fineReason: {
    fontSize: 12,
    lineHeight: 17,
  },
  fineBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  statusSwitchPress: {
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  deleteCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
});
