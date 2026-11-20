import {
  ArrowLeft,
  Copy,
  HeartHandshake,
  Image as ImageIcon,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { Event } from '@/src/types';
import {
  copyReportToClipboard,
  generateClosingEventAnnouncement,
  generateInitialEventAnnouncement,
} from '@/src/utils/exporter';
import { formatMMK } from '@/src/utils/formatters';
import { Haptics } from '@/src/utils/haptics';
import { AestheticReportModal } from './AestheticReportModal';
import { NativeIcon } from './NativeIcon';
import { SearchBar } from './SearchBar';
import { StatusPill } from './StatusPill';
import { PressableScale } from './animated/PressableScale';

export interface EventDetailContentProps {
  event: Event;
  mode: 'pane' | 'sheet';
  onClose?: () => void;
  onDeleted?: () => void;
  onShowToast: (msg: string) => void;
}

const QUICK_DONOR_AMOUNTS = [1000, 3000, 5000, 10000];

export const EventDetailContent: React.FC<EventDetailContentProps> = ({
  event,
  mode,
  onClose,
  onDeleted,
  onShowToast,
}) => {
  const {
    settings,
    students,
    eventRecords,
    recordDonation,
    deleteEventRecord,
    setEventStudentPaid,
    deleteEvent,
    getEventStats,
    language,
    t,
  } = useTreasury();
  const { themeColor, palette } = useAppTheme();

  const [viewMode, setViewMode] = useState<'details' | 'add_donor'>('details');
  const [fixedFilter, setFixedFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [donorAmount, setDonorAmount] = useState('5000');
  const [donorSearch, setDonorSearch] = useState('');
  const [showAestheticExport, setShowAestheticExport] = useState(false);

  // Reset local filters/form when switching events in desktop split view
  useEffect(() => {
    setViewMode('details');
    setFixedFilter('all');
    setSearchQuery('');
    setSelectedStudentId('');
    setDonorAmount('5000');
    setDonorSearch('');
  }, [event.id]);

  const stats = useMemo(() => {
    return getEventStats(event.id);
  }, [event.id, getEventStats]);

  const records = useMemo(() => {
    return eventRecords.filter((r) => r.eventId === event.id);
  }, [event.id, eventRecords]);

  const studentMap = useMemo(() => {
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);

  const filteredDonors = useMemo(() => {
    return records.filter((r) => {
      if (!searchQuery.trim()) return true;
      const s = studentMap.get(r.studentId);
      const q = searchQuery.toLowerCase().trim();
      return (
        s?.name.toLowerCase().includes(q) ||
        s?.rollNumber?.toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery, studentMap]);

  const fixedStudentsList = useMemo(() => {
    return students
      .map((student) => {
        const record = records.find((r) => r.studentId === student.id);
        const isPaid = record ? record.isPaid : false;
        const amount = record ? record.amount : event.fixedAmount || 0;
        return {
          student,
          record,
          isPaid,
          amount,
        };
      })
      .filter((item) => {
        if (fixedFilter === 'paid' && !item.isPaid) return false;
        if (fixedFilter === 'unpaid' && item.isPaid) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (
            item.student.name.toLowerCase().includes(q) ||
            item.student.rollNumber?.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [students, records, event.fixedAmount, fixedFilter, searchQuery]);

  const fixedStudentPairs = useMemo(() => {
    const pairs: Array<
      [(typeof fixedStudentsList)[number], (typeof fixedStudentsList)[number] | null]
    > = [];
    for (let i = 0; i < fixedStudentsList.length; i += 2) {
      pairs.push([fixedStudentsList[i], fixedStudentsList[i + 1] ?? null]);
    }
    return pairs;
  }, [fixedStudentsList]);

  const pickerStudents = useMemo(() => {
    const q = donorSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q)
    );
  }, [students, donorSearch]);

  const rollRangeLabel = useMemo(() => {
    const rolls = students.map((s) => s.rollNumber?.trim()).filter(Boolean) as string[];
    if (rolls.length >= 2) {
      return `${rolls[0]} – ${rolls[rolls.length - 1]}`;
    }
    if (rolls.length === 1) {
      return rolls[0];
    }
    return t.roster.studentCount(students.length);
  }, [students, t]);

  const handleCopyInitialAnnouncement = async () => {
    const text = generateInitialEventAnnouncement(event, settings);
    const success = await copyReportToClipboard(text);
    if (success) {
      onShowToast(t.events.noticeCopied);
    }
  };

  const handleCopyClosingAnnouncement = async () => {
    const text = generateClosingEventAnnouncement(event, stats.totalCollected);
    const success = await copyReportToClipboard(text);
    if (success) {
      onShowToast(t.events.finalCopied);
    }
  };

  const performDelete = async () => {
    await deleteEvent(event.id);
    onDeleted?.();
    onClose?.();
    onShowToast(t.events.eventDeletedToast);
  };

  const handleDeleteEvent = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(t.events.deleteConfirmMsg(event.name))) {
        void performDelete();
      }
      return;
    }

    Alert.alert(
      t.events.deleteConfirmTitle,
      t.events.deleteConfirmMsg(event.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            void performDelete();
          },
        },
      ]
    );
  };

  const handleAddDonorSubmit = async () => {
    if (!selectedStudentId) {
      Alert.alert(t.common.error, t.modals.eventDetail.errorSelectStudent);
      return;
    }
    const amt = parseInt(donorAmount, 10);
    if (isNaN(amt) || amt <= 0) return;

    await recordDonation(event.id, selectedStudentId, amt);
    setSelectedStudentId('');
    setDonorAmount('5000');
    setDonorSearch('');
    setViewMode('details');
    onShowToast(t.events.donorAddedToast);
  };

  const renderFixedStudentRow = (item: (typeof fixedStudentsList)[number]) => {
    const isPane = mode === 'pane';
    return (
      <TouchableOpacity
        key={item.student.id}
        onPress={() => {
          Haptics.selectionAsync();
          setEventStudentPaid(
            event.id,
            item.student.id,
            !item.isPaid,
            event.fixedAmount
          );
        }}
        activeOpacity={0.78}
        accessibilityRole="switch"
        accessibilityState={{ checked: item.isPaid }}
        accessibilityLabel={`${item.student.name}, ${item.isPaid ? t.common.paid : t.common.unpaid}`}
        style={[
          styles.rosterRow,
          {
            backgroundColor: isPane ? palette.surface : palette.card,
            borderWidth: isPane ? 0 : 1,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.rosterRowLeft}>
          <View style={styles.rosterNameLine}>
            {item.student.rollNumber ? (
              <Text
                style={[
                  styles.rollText,
                  { color: palette.ink, fontFamily: fonts.monoMedium },
                ]}
              >
                {item.student.rollNumber}
              </Text>
            ) : null}
            <Text
              numberOfLines={1}
              style={[
                styles.studentNameText,
                { color: palette.ink, fontFamily: fonts.medium },
              ]}
            >
              {item.student.name}
            </Text>
          </View>
          {!isPane ? (
            <Text
              style={[
                styles.sheetAmountSub,
                { color: palette.muted, fontFamily: fonts.mono },
              ]}
            >
              {formatMMK(item.amount)}
            </Text>
          ) : null}
        </View>

        <StatusPill
          variant={item.isPaid ? 'paid' : 'unpaid'}
          label={item.isPaid ? t.common.paid : t.common.unpaid}
        />
      </TouchableOpacity>
    );
  };

  const renderAddDonorView = () => (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.card,
            borderBottomColor: palette.line,
            paddingHorizontal: mode === 'pane' ? 22 : 20,
          },
        ]}
      >
        <View style={styles.addDonorHeaderLeft}>
          <TouchableOpacity
            onPress={() => setViewMode('details')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
            style={[
              styles.iconCircleBtn,
              { backgroundColor: palette.surface },
            ]}
          >
            <NativeIcon
              sfSymbol="chevron.left"
              materialName="arrow-back"
              FallbackIcon={ArrowLeft}
              size={18}
              color={palette.subtle}
            />
          </TouchableOpacity>
          <View style={styles.flexMinZero}>
            <Text
              style={[
                styles.addDonorTitle,
                { color: palette.ink, fontFamily: fonts.semibold },
              ]}
            >
              {t.modals.eventDetail.addDonorTitle}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.addDonorSubtitle,
                { color: palette.muted, fontFamily: fonts.regular },
              ]}
            >
              {event.name}
            </Text>
          </View>
        </View>

        {mode === 'sheet' && onClose ? (
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
            style={[
              styles.iconCircleBtn,
              { backgroundColor: palette.surface },
            ]}
          >
            <NativeIcon
              sfSymbol="xmark"
              materialName="close"
              FallbackIcon={X}
              size={18}
              color={palette.subtle}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={[
          styles.addDonorScroll,
          { paddingHorizontal: mode === 'pane' ? 22 : 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.fieldEyebrow,
            { color: palette.muted, fontFamily: fonts.medium },
          ]}
        >
          {t.modals.eventDetail.donorStudentLabel}
        </Text>

        <SearchBar
          value={donorSearch}
          onChangeText={setDonorSearch}
          placeholder={t.events.searchDonors}
          style={styles.mb10}
        />

        <View
          style={[
            styles.studentPickerBox,
            {
              backgroundColor: palette.card,
              borderColor: palette.line,
            },
          ]}
        >
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {pickerStudents.map((s) => {
              const isSelected = selectedStudentId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedStudentId(s.id);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.studentPickerRow,
                    {
                      backgroundColor: isSelected
                        ? themeColor.primary
                        : palette.surface,
                    },
                  ]}
                >
                  <View style={styles.studentPickerNameWrap}>
                    <NativeIcon
                      sfSymbol="person.fill"
                      materialName="person"
                      FallbackIcon={User}
                      size={14}
                      color={isSelected ? themeColor.onPrimary : palette.muted}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.studentPickerName,
                        {
                          color: isSelected ? themeColor.onPrimary : palette.ink,
                          fontFamily: fonts.medium,
                        },
                      ]}
                    >
                      {s.name}
                    </Text>
                  </View>
                  {s.rollNumber ? (
                    <Text
                      style={[
                        styles.studentPickerRoll,
                        {
                          color: isSelected
                            ? themeColor.onPrimary
                            : palette.muted,
                          fontFamily: fonts.mono,
                        },
                      ]}
                    >
                      {s.rollNumber}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {pickerStudents.length === 0 ? (
              <Text
                style={[
                  styles.emptyPickerText,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {t.roster.emptyStudentsTitle}
              </Text>
            ) : null}
          </ScrollView>
        </View>

        <Text
          style={[
            styles.fieldEyebrow,
            { color: palette.muted, fontFamily: fonts.medium },
          ]}
        >
          {t.modals.eventDetail.donorAmountLabel}
        </Text>

        <TextInput
          value={donorAmount}
          onChangeText={setDonorAmount}
          placeholder="5000"
          placeholderTextColor={palette.muted}
          keyboardType="numeric"
          style={[
            styles.amountInput,
            {
              backgroundColor: palette.card,
              borderColor: palette.line,
              color: palette.ink,
              fontFamily: fonts.monoMedium,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            },
          ]}
        />

        <View style={styles.quickChipsRow}>
          {QUICK_DONOR_AMOUNTS.map((chip) => {
            const isSelectedChip = donorAmount === String(chip);
            return (
              <TouchableOpacity
                key={chip}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDonorAmount(String(chip));
                }}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelectedChip }}
                style={[
                  styles.quickChip,
                  {
                    backgroundColor: isSelectedChip
                      ? palette.ink
                      : palette.surface,
                    borderColor: isSelectedChip ? palette.ink : palette.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    {
                      color: isSelectedChip ? palette.bg : palette.ink,
                      fontFamily: fonts.monoMedium,
                    },
                  ]}
                >
                  +{chip.toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <PressableScale
          onPress={handleAddDonorSubmit}
          disabled={!selectedStudentId}
          accessibilityRole="button"
          accessibilityLabel={t.modals.eventDetail.submitDonor}
          style={[
            styles.submitDonorBtn,
            {
              backgroundColor: selectedStudentId
                ? themeColor.primary
                : palette.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.submitDonorText,
              {
                color: selectedStudentId ? themeColor.onPrimary : palette.muted,
                fontFamily: fonts.semibold,
              },
            ]}
          >
            {t.modals.eventDetail.submitDonor}
          </Text>
        </PressableScale>
      </ScrollView>
    </View>
  );

  const isPane = mode === 'pane';
  const rateMeta =
    event.type === 'fixed_fee' && event.fixedAmount
      ? `${formatMMK(event.fixedAmount)} · ${t.events.perStudent}`
      : null;

  return (
    <>
      {viewMode === 'add_donor' ? (
        renderAddDonorView()
      ) : (
        <View style={styles.root}>
          {/* Header (.cl-modalhead) */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: isPane ? palette.bg : palette.card,
                borderBottomColor: palette.line,
                paddingHorizontal: isPane ? 22 : 20,
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.eyebrowRow}>
                <StatusPill
                  variant={event.type === 'donation' ? 'paid' : 'brand'}
                  label={
                    event.type === 'donation'
                      ? t.events.donation
                      : t.events.fixedFee
                  }
                />
                {event.dueDate ? (
                  <StatusPill variant="neutral" mono label={event.dueDate} />
                ) : null}
                {rateMeta ? (
                  <Text
                    style={[
                      styles.rateMeta,
                      { color: palette.muted, fontFamily: fonts.regular },
                    ]}
                  >
                    {rateMeta}
                  </Text>
                ) : null}
              </View>
              <Text
                selectable
                style={[
                  styles.eventTitle,
                  { color: palette.ink, fontFamily: fonts.semibold },
                ]}
              >
                {event.name}
              </Text>
            </View>

            {isPane ? (
              <View style={styles.headerRightPane}>
                <View style={styles.headerStatsBlock}>
                  <Text
                    selectable
                    style={[
                      styles.paneFigure,
                      { color: palette.ink, fontFamily: fonts.semibold },
                    ]}
                  >
                    {formatMMK(stats.totalCollected)}
                  </Text>
                  <Text
                    style={[
                      styles.paneStatsSub,
                      { color: palette.muted, fontFamily: fonts.mono },
                    ]}
                  >
                    {event.type === 'fixed_fee'
                      ? `${t.common.paid}: ${stats.totalPaidCount} / ${students.length} · ${t.common.unpaid}: ${stats.totalUnpaidCount}`
                      : t.events.donorsCount(stats.totalDonors)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleDeleteEvent}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t.modals.eventDetail.deleteEvent}
                  hitSlop={6}
                  style={[
                    styles.iconCircleBtn,
                    {
                      backgroundColor: palette.surface,
                    },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="trash"
                    materialName="delete-outline"
                    FallbackIcon={Trash2}
                    size={16}
                    color={palette.dangerText}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.headerRightSheet}>
                <TouchableOpacity
                  onPress={handleDeleteEvent}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t.modals.eventDetail.deleteEvent}
                  style={[
                    styles.iconCircleBtn,
                    {
                      backgroundColor: palette.surface,
                    },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="trash"
                    materialName="delete-outline"
                    FallbackIcon={Trash2}
                    size={16}
                    color={palette.dangerText}
                  />
                </TouchableOpacity>
                {onClose ? (
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t.common.close}
                    style={[
                      styles.iconCircleBtn,
                      {
                        backgroundColor: palette.surface,
                      },
                    ]}
                  >
                    <NativeIcon
                      sfSymbol="xmark"
                      materialName="close"
                      FallbackIcon={X}
                      size={18}
                      color={palette.subtle}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>

          {/* Body ScrollView */}
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={[
              styles.bodyScroll,
              {
                paddingHorizontal: isPane ? 22 : 20,
                paddingBottom: isPane ? 20 : 40,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Mobile Sheet Summary Banner */}
            {!isPane ? (
              <View
                style={[
                  styles.sheetBanner,
                  { backgroundColor: themeColor.primaryDark },
                ]}
              >
                <Text
                  style={[
                    styles.sheetBannerEyebrow,
                    {
                      color: themeColor.onPrimary,
                      fontFamily: fonts.medium,
                    },
                  ]}
                >
                  {t.events.totalCollected}
                </Text>
                <Text
                  selectable
                  style={[
                    styles.sheetBannerFigure,
                    {
                      color: themeColor.onPrimary,
                      fontFamily: fonts.bold,
                    },
                  ]}
                >
                  {formatMMK(stats.totalCollected)}
                </Text>

                <View style={styles.sheetBannerDivider}>
                  {event.type === 'fixed_fee' ? (
                    <View style={styles.sheetBannerMetaRow}>
                      <Text
                        style={[
                          styles.sheetBannerMeta,
                          {
                            color: themeColor.onPrimary,
                            fontFamily: fonts.mono,
                          },
                        ]}
                      >
                        {t.common.paid}: {stats.totalPaidCount} / {students.length}
                      </Text>
                      <Text
                        style={[
                          styles.sheetBannerMeta,
                          {
                            color: themeColor.onPrimary,
                            fontFamily: fonts.mono,
                          },
                        ]}
                      >
                        {t.common.unpaid}: {stats.totalUnpaidCount}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.sheetBannerMeta,
                        {
                          color: themeColor.onPrimary,
                          fontFamily: fonts.mono,
                        },
                      ]}
                    >
                      {t.events.donorsCount(stats.totalDonors)}
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            {/* Controls & Actions Toolbar */}
            <View style={styles.toolbarRow}>
              <View style={styles.chipGroup}>
                {event.type === 'fixed_fee' ? (
                  (['all', 'unpaid', 'paid'] as const).map((modeKey) => {
                    const count =
                      modeKey === 'all'
                        ? students.length
                        : modeKey === 'unpaid'
                        ? stats.totalUnpaidCount
                        : stats.totalPaidCount;
                    const label =
                      modeKey === 'all'
                        ? `${t.common.all} (${count})`
                        : modeKey === 'unpaid'
                        ? `${t.common.unpaid} (${count})`
                        : `${t.common.paid} (${count})`;
                    const isActive = fixedFilter === modeKey;
                    return (
                      <TouchableOpacity
                        key={modeKey}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setFixedFilter(modeKey);
                        }}
                        activeOpacity={0.78}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isActive
                              ? palette.ink
                              : palette.surface,
                            borderColor: isActive ? palette.ink : palette.line,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: isActive ? palette.bg : palette.ink,
                              fontFamily: fonts.medium,
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setViewMode('add_donor');
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t.events.addDonor}
                    style={[
                      styles.addDonorPillBtn,
                      {
                        backgroundColor: themeColor.primary,
                      },
                    ]}
                  >
                    <NativeIcon
                      sfSymbol="plus"
                      materialName="add"
                      FallbackIcon={Plus}
                      size={14}
                      color={themeColor.onPrimary}
                    />
                    <Text
                      style={[
                        styles.addDonorPillText,
                        {
                          color: themeColor.onPrimary,
                          fontFamily: fonts.semibold,
                        },
                      ]}
                    >
                      {t.events.addDonor}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.chipGroup}>
                <TouchableOpacity
                  onPress={handleCopyInitialAnnouncement}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={t.modals.eventDetail.initialNotice}
                  style={[
                    styles.actionChip,
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
                    size={13}
                    color={themeColor.primary}
                  />
                  <Text
                    style={[
                      styles.actionChipText,
                      { color: palette.ink, fontFamily: fonts.medium },
                    ]}
                  >
                    {t.modals.eventDetail.initialNotice}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCopyClosingAnnouncement}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={t.modals.eventDetail.finalNotice}
                  style={[
                    styles.actionChip,
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
                    size={13}
                    color={palette.paidText}
                  />
                  <Text
                    style={[
                      styles.actionChipText,
                      { color: palette.ink, fontFamily: fonts.medium },
                    ]}
                  >
                    {t.modals.eventDetail.finalNotice}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowAestheticExport(true)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={t.reports.imageExport}
                  style={[
                    styles.actionChip,
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
                    size={13}
                    color={themeColor.primary}
                  />
                  <Text
                    style={[
                      styles.actionChipText,
                      { color: palette.ink, fontFamily: fonts.medium },
                    ]}
                  >
                    {t.reports.imageExport}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Input */}
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.events.searchDonors}
              style={styles.mb12}
            />

            {/* Collection List / Donors List */}
            {event.type === 'donation' ? (
              filteredDonors.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyIconWrap,
                      { backgroundColor: themeColor.surface },
                    ]}
                  >
                    <NativeIcon
                      sfSymbol="sparkles"
                      materialName="favorite"
                      FallbackIcon={HeartHandshake}
                      size={26}
                      color={themeColor.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.emptyCardTitle,
                      { color: palette.ink, fontFamily: fonts.semibold },
                    ]}
                  >
                    {language === 'en'
                      ? 'No donations yet'
                      : 'အလှူရှင် မှတ်တမ်း မရှိသေးပါ'}
                  </Text>
                  <Text
                    style={[
                      styles.emptyCardDesc,
                      { color: palette.muted, fontFamily: fonts.regular },
                    ]}
                  >
                    {language === 'en'
                      ? 'Add student donations to get started'
                      : 'အလှူငွေထည့်သွင်းသူများကို စာရင်းသွင်းနိုင်ပါသည်'}
                  </Text>
                  <PressableScale
                    onPress={() => setViewMode('add_donor')}
                    accessibilityRole="button"
                    accessibilityLabel={t.events.addDonor}
                    style={[
                      styles.emptyActionBtn,
                      { backgroundColor: themeColor.primary },
                    ]}
                  >
                    <NativeIcon
                      sfSymbol="plus"
                      materialName="add"
                      FallbackIcon={Plus}
                      size={15}
                      color={themeColor.onPrimary}
                    />
                    <Text
                      style={[
                        styles.emptyActionText,
                        {
                          color: themeColor.onPrimary,
                          fontFamily: fonts.semibold,
                        },
                      ]}
                    >
                      {t.events.addDonor}
                    </Text>
                  </PressableScale>
                </View>
              ) : (
                <View style={styles.listGap}>
                  {filteredDonors.map((record, index) => {
                    const student = studentMap.get(record.studentId);
                    return (
                      <View
                        key={record.id}
                        style={[
                          styles.donorCard,
                          {
                            backgroundColor: isPane
                              ? palette.surface
                              : palette.card,
                            borderColor: palette.line,
                            borderWidth: isPane ? 0 : 1,
                          },
                        ]}
                      >
                        <View style={styles.donorCardLeft}>
                          <View
                            style={[
                              styles.indexBadge,
                              { backgroundColor: themeColor.surface },
                            ]}
                          >
                            <Text
                              style={[
                                styles.indexBadgeText,
                                {
                                  color: themeColor.text,
                                  fontFamily: fonts.monoMedium,
                                },
                              ]}
                            >
                              {index + 1}
                            </Text>
                          </View>
                          <View style={styles.flexMinZero}>
                            <Text
                              selectable
                              numberOfLines={1}
                              style={[
                                styles.donorName,
                                { color: palette.ink, fontFamily: fonts.semibold },
                              ]}
                            >
                              {student?.name || t.common.name}
                            </Text>
                            {student?.rollNumber ? (
                              <Text
                                selectable
                                style={[
                                  styles.donorRoll,
                                  { color: palette.muted, fontFamily: fonts.mono },
                                ]}
                              >
                                {student.rollNumber}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.donorCardRight}>
                          <Text
                            selectable
                            style={[
                              styles.donorAmount,
                              {
                                color: palette.paidText,
                                fontFamily: fonts.monoMedium,
                              },
                            ]}
                          >
                            {formatMMK(record.amount)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => deleteEventRecord(record.id)}
                            activeOpacity={0.6}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={t.common.delete}
                            style={styles.trashBtn}
                          >
                            <NativeIcon
                              sfSymbol="trash"
                              materialName="delete-outline"
                              FallbackIcon={Trash2}
                              size={15}
                              color={palette.muted}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )
            ) : fixedStudentsList.length === 0 ? (
              <View
                style={[
                  styles.emptyBoxSimple,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyBoxSimpleText,
                    { color: palette.muted, fontFamily: fonts.medium },
                  ]}
                >
                  {t.roster.emptyStudentsTitle}
                </Text>
              </View>
            ) : isPane ? (
              <View style={styles.paneRosterGrid}>
                {fixedStudentPairs.map(([leftItem, rightItem]) => (
                  <View key={leftItem.student.id} style={styles.paneRosterPair}>
                    <View style={styles.paneRosterCol}>
                      {renderFixedStudentRow(leftItem)}
                    </View>
                    <View style={styles.paneRosterCol}>
                      {rightItem ? renderFixedStudentRow(rightItem) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.sheetRosterList}>
                {fixedStudentsList.map((item) => renderFixedStudentRow(item))}
              </View>
            )}
          </ScrollView>

          {/* Desktop Pane Footer */}
          {isPane ? (
            <View
              style={[
                styles.paneFooter,
                {
                  borderTopColor: palette.line,
                  backgroundColor: palette.bg,
                },
              ]}
            >
              <Text
                style={[
                  styles.paneFooterHint,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {event.type === 'fixed_fee'
                  ? language === 'en'
                    ? 'One tap toggles Paid or Unpaid · Auto-saves offline'
                    : 'တစ်ချက်နှိပ်ရုံဖြင့် ပေးပြီး / မပေးရသေး ပြောင်းနိုင်သည်'
                  : language === 'en'
                  ? 'Tap + Add Donor to record contributions · Auto-saves offline'
                  : 'အလှူရှင်ထည့်ရန် + ခလုတ်ကို နှိပ်ပါ · အော့ဖ်လိုင်းသိမ်းဆည်းသည်'}
              </Text>
              <Text
                style={[
                  styles.paneFooterSummary,
                  { color: palette.muted, fontFamily: fonts.mono },
                ]}
              >
                {event.type === 'fixed_fee'
                  ? rollRangeLabel
                  : t.events.donorsCount(stats.totalDonors)}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <AestheticReportModal
        visible={showAestheticExport}
        onClose={() => setShowAestheticExport(false)}
        onShowToast={onShowToast}
        initialReportType="event_donors"
        initialEventId={event.id}
      />
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  flexOne: {
    flex: 1,
    minHeight: 0,
  },
  flexMinZero: {
    flex: 1,
    minWidth: 0,
  },
  mb10: {
    marginBottom: 10,
  },
  mb12: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  eyebrowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  rateMeta: {
    fontSize: 12,
  },
  eventTitle: {
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  headerRightPane: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerStatsBlock: {
    alignItems: 'flex-end',
  },
  paneFigure: {
    fontSize: 22,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  paneStatsSub: {
    fontSize: 12,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  headerRightSheet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  bodyScroll: {
    paddingTop: 14,
  },
  sheetBanner: {
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 18,
    marginBottom: 14,
  },
  sheetBannerEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.85,
    marginBottom: 4,
  },
  sheetBannerFigure: {
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  sheetBannerDivider: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  sheetBannerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetBannerMeta: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    opacity: 0.94,
  },
  toolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  filterChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  addDonorPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  addDonorPillText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  actionChipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  paneRosterGrid: {
    gap: 8,
  },
  paneRosterPair: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  paneRosterCol: {
    flex: 1,
    minWidth: 0,
  },
  sheetRosterList: {
    gap: 8,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  rosterRowLeft: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rosterNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  rollText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  studentNameText: {
    fontSize: 13,
    flexShrink: 1,
  },
  sheetAmountSub: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  listGap: {
    gap: 8,
  },
  donorCard: {
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  donorCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  indexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexBadgeText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  donorName: {
    fontSize: 14,
  },
  donorRoll: {
    fontSize: 11,
    marginTop: 1,
  },
  donorCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  donorAmount: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  trashBtn: {
    padding: 4,
    borderRadius: 9999,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontSize: 15,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyCardDesc: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 16,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyActionText: {
    fontSize: 13,
  },
  emptyBoxSimple: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBoxSimpleText: {
    fontSize: 13,
    textAlign: 'center',
  },
  paneFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paneFooterHint: {
    fontSize: 12,
    flexShrink: 1,
  },
  paneFooterSummary: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  addDonorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  addDonorTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  addDonorSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  addDonorScroll: {
    paddingTop: 18,
    paddingBottom: 36,
  },
  fieldEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  studentPickerBox: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 8,
    maxHeight: 220,
    marginBottom: 18,
  },
  studentPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderCurve: 'continuous',
    marginBottom: 4,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  studentPickerNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  studentPickerName: {
    fontSize: 13,
    flexShrink: 1,
  },
  studentPickerRoll: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  emptyPickerText: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 20,
  },
  amountInput: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    marginBottom: 10,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  quickChipText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  submitDonorBtn: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDonorText: {
    fontSize: 14,
  },
});
