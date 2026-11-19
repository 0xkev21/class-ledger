import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  HeartHandshake,
  Image as ImageIcon,
  Plus,
  Search,
  Share2,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useTreasury } from '../context/TreasuryContext';
import { Event } from '../types';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import {
  copyReportToClipboard,
  generateClosingEventAnnouncement,
  generateInitialEventAnnouncement,
} from '../utils/exporter';
import { formatDate, formatMMK } from '../utils/formatters';
import { AestheticReportModal } from './AestheticReportModal';
import { NativeIcon } from './NativeIcon';

interface EventDetailModalProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  visible,
  onClose,
  onShowToast,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
  const { isDark, themeColor } = useAppTheme();

  // Mode: 'details' view or in-sheet 'add_donor' view
  const [viewMode, setViewMode] = useState<'details' | 'add_donor'>('details');

  // Filter chips for fixed fee: All, Paid, Unpaid
  const [fixedFilter, setFixedFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Donor form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [donorAmount, setDonorAmount] = useState('5000');
  const [donorSearch, setDonorSearch] = useState('');
  const [showAestheticExport, setShowAestheticExport] = useState(false);

  const handleClose = () => {
    setViewMode('details');
    setSelectedStudentId('');
    setDonorAmount('5000');
    setDonorSearch('');
    onClose();
  };

  // Unconditionally compute data with hooks before any return
  const stats = useMemo(() => {
    return event
      ? getEventStats(event.id)
      : { totalCollected: 0, totalPaidCount: 0, totalUnpaidCount: 0, totalDonors: 0 };
  }, [event, getEventStats]);

  const records = useMemo(() => {
    return event ? eventRecords.filter((r) => r.eventId === event.id) : [];
  }, [event, eventRecords]);

  const studentMap = useMemo(() => {
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);

  // Filtered donor records for Donation mode
  const filteredDonors = useMemo(() => {
    if (!event) return [];
    return records.filter((r) => {
      if (!searchQuery.trim()) return true;
      const s = studentMap.get(r.studentId);
      const q = searchQuery.toLowerCase().trim();
      return (
        s?.name.toLowerCase().includes(q) ||
        s?.rollNumber?.toLowerCase().includes(q)
      );
    });
  }, [event, records, searchQuery, studentMap]);

  // Fixed Fee students list with payment states
  const fixedStudentsList = useMemo(() => {
    if (!event) return [];
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
        // Status filter
        if (fixedFilter === 'paid' && !item.isPaid) return false;
        if (fixedFilter === 'unpaid' && item.isPaid) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (
            item.student.name.toLowerCase().includes(q) ||
            item.student.rollNumber?.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [event, students, records, fixedFilter, searchQuery]);

  // Copy Burmese Announcement to Clipboard
  const handleCopyInitialAnnouncement = async () => {
    if (!event) return;
    const text = generateInitialEventAnnouncement(event, settings);
    const success = await copyReportToClipboard(text);
    if (success) {
      onShowToast(t.events.noticeCopied);
    }
  };

  const handleCopyClosingAnnouncement = async () => {
    if (!event) return;
    const text = generateClosingEventAnnouncement(event, stats.totalCollected);
    const success = await copyReportToClipboard(text);
    if (success) {
      onShowToast(t.events.finalCopied);
    }
  };

  const handleDeleteEvent = () => {
    if (!event) return;
    Alert.alert(
      t.events.deleteConfirmTitle,
      t.events.deleteConfirmMsg(event.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(event.id);
            handleClose();
            onShowToast(t.events.eventDeletedToast);
          },
        },
      ]
    );
  };

  const handleAddDonorSubmit = async () => {
    if (!event || !selectedStudentId) {
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

  // Safe early exit AFTER all hooks are evaluated
  if (!visible || !event) return null;

  return (
    <>
      <DragDismissSheet
        visible={visible}
        onClose={handleClose}
        maxHeight={windowHeight * 0.92}
        isDark={isDark}
        sheetClassName="p-0 overflow-hidden"
      >
        {/* Header */}
        {viewMode === 'add_donor' ? (
          <View className="px-6 py-4 bg-white dark:bg-zinc-900 flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800">
            <View className="flex-row items-center flex-1 mr-3">
              <TouchableOpacity
                onPress={() => setViewMode('details')}
                  accessibilityLabel="Go back"
                  style={{ borderCurve: 'continuous' }}
                  className="h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center mr-3 active:bg-slate-200 dark:active:bg-zinc-700"
                >
                  <NativeIcon
                    sfSymbol="chevron.left"
                    materialName="arrow-back"
                    FallbackIcon={ArrowLeft}
                    size={18}
                    color="#71717a"
                  />
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {t.modals.eventDetail.addDonorTitle}
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400" numberOfLines={1}>
                    {event.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityLabel="Close"
                style={{ borderCurve: 'continuous' }}
                className="h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center"
              >
                <NativeIcon
                  sfSymbol="xmark"
                  materialName="close"
                  FallbackIcon={X}
                  size={18}
                  color="#71717a"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="px-6 py-4 bg-white dark:bg-zinc-900 flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <View
                    style={{
                      backgroundColor:
                        event.type === 'donation'
                          ? isDark
                            ? 'rgba(244, 63, 94, 0.20)'
                            : '#fff1f2'
                          : themeColor.surface,
                      borderCurve: 'continuous',
                    }}
                    className="rounded-full px-2.5 py-0.5"
                  >
                    <Text
                      style={{
                        color:
                          event.type === 'donation'
                            ? isDark
                              ? '#fecdd3'
                              : '#e11d48'
                            : themeColor.text,
                      }}
                      className="text-[11px] font-bold"
                    >
                      {event.type === 'donation' ? t.events.donation : t.events.fixedFee}
                    </Text>
                  </View>
                  {event.dueDate ? (
                    <View
                      style={{ borderCurve: 'continuous' }}
                      className="flex-row items-center rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5"
                    >
                      <NativeIcon
                        sfSymbol="calendar"
                        materialName="calendar-today"
                        FallbackIcon={CalendarDays}
                        size={12}
                        color="#71717a"
                      />
                      <Text className="ml-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        {event.dueDate}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  selectable
                  className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-relaxed py-0.5"
                >
                  {event.name}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={handleDeleteEvent}
                  accessibilityLabel="Delete event"
                  style={{ borderCurve: 'continuous' }}
                  className="h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center active:bg-rose-100"
                >
                  <NativeIcon
                    sfSymbol="trash"
                    materialName="delete-outline"
                    FallbackIcon={Trash2}
                    size={16}
                    color="#e11d48"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClose}
                  accessibilityLabel="Close"
                  style={{ borderCurve: 'continuous' }}
                  className="h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center"
                >
                  <NativeIcon
                    sfSymbol="xmark"
                    materialName="close"
                    FallbackIcon={X}
                    size={18}
                    color="#71717a"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {viewMode === 'add_donor' ? (
            /* In-Sheet Add Donor Form */
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Step 1: Select Student */}
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                {t.modals.eventDetail.donorStudentLabel}
              </Text>

              <View
                style={{ borderCurve: 'continuous' }}
                className="flex-row items-center rounded-2xl bg-white dark:bg-zinc-900 px-3.5 py-2.5 mb-2.5 border border-slate-200 dark:border-zinc-800"
              >
                <NativeIcon
                  sfSymbol="magnifyingglass"
                  materialName="search"
                  FallbackIcon={Search}
                  size={16}
                  color="#9ca3af"
                />
                <TextInput
                  value={donorSearch}
                  onChangeText={setDonorSearch}
                  placeholder={t.events.searchDonors}
                  placeholderTextColor="#9ca3af"
                  className="ml-2 flex-1 text-xs text-zinc-900 dark:text-zinc-50 p-0"
                />
                {donorSearch ? (
                  <TouchableOpacity onPress={() => setDonorSearch('')}>
                    <NativeIcon
                      sfSymbol="xmark.circle.fill"
                      materialName="clear"
                      FallbackIcon={X}
                      size={14}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Students list picker */}
              <View
                style={{ borderCurve: 'continuous' }}
                className="mb-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 max-h-56 overflow-hidden"
              >
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {students
                    .filter((s) =>
                      donorSearch.trim()
                        ? s.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
                          s.rollNumber?.toLowerCase().includes(donorSearch.toLowerCase())
                        : true
                    )
                    .map((s) => {
                      const isSelected = selectedStudentId === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => setSelectedStudentId(s.id)}
                          style={{
                            backgroundColor: isSelected
                              ? themeColor.primary
                              : isDark
                              ? '#27272a'
                              : '#f4f4f5',
                            borderCurve: 'continuous',
                          }}
                          className={`flex-row items-center justify-between px-3.5 py-3 rounded-xl mb-1 ${
                            isSelected
                              ? ''
                              : 'active:bg-zinc-100 dark:active:bg-zinc-800'
                          }`}
                        >
                          <View className="flex-row items-center">
                            <NativeIcon
                              sfSymbol="person.fill"
                              materialName="person"
                              FallbackIcon={User}
                              size={14}
                              color={isSelected ? themeColor.onPrimary : (isDark ? '#a1a1aa' : '#71717a')}
                            />
                            <Text
                              style={{
                                color: isSelected
                                  ? themeColor.onPrimary
                                  : isDark
                                  ? '#f4f4f5'
                                  : '#27272a',
                              }}
                              className="ml-2 text-xs font-bold"
                            >
                              {s.name}
                            </Text>
                          </View>
                          {s.rollNumber ? (
                            <Text
                              style={{
                                color: isSelected
                                  ? 'rgba(255, 255, 255, 0.85)'
                                  : isDark
                                  ? '#a1a1aa'
                                  : '#71717a',
                              }}
                              className="text-[11px]"
                            >
                              {s.rollNumber}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  {students.length === 0 ? (
                    <Text className="text-center text-xs text-zinc-400 py-6">
                      {t.roster.emptyStudentsTitle}
                    </Text>
                  ) : null}
                </ScrollView>
              </View>

              {/* Step 2: Amount Input */}
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                {t.modals.eventDetail.donorAmountLabel}
              </Text>
              <TextInput
                value={donorAmount}
                onChangeText={setDonorAmount}
                placeholder="5000"
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                keyboardType="numeric"
                style={{
                  color: isDark ? '#f4f4f5' : '#18181b',
                  borderCurve: 'continuous',
                  fontVariant: ['tabular-nums'],
                }}
                className="w-full rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-4 py-3.5 text-base font-bold mb-3"
              />

              {/* Quick amount chips */}
              <View className="flex-row gap-2 mb-6">
                {[1000, 3000, 5000, 10000].map((chip) => {
                  const isSelectedChip = donorAmount === String(chip);
                  return (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => setDonorAmount(String(chip))}
                      style={{
                        backgroundColor: isSelectedChip
                          ? themeColor.primary
                          : isDark
                          ? '#18181b'
                          : '#ffffff',
                        borderColor: isSelectedChip
                          ? themeColor.primary
                          : isDark
                          ? '#27272a'
                          : '#e4e4e7',
                        borderCurve: 'continuous',
                      }}
                      className="flex-1 items-center justify-center py-2.5 rounded-xl border"
                    >
                      <Text
                        style={{
                          color: isSelectedChip
                            ? themeColor.onPrimary
                            : isDark
                            ? '#d4d4d8'
                            : '#3f3f46',
                          fontVariant: ['tabular-nums'],
                        }}
                        className="text-xs font-bold"
                      >
                        +{chip.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Save Donor button */}
              <TouchableOpacity
                onPress={handleAddDonorSubmit}
                disabled={!selectedStudentId}
                activeOpacity={0.85}
                style={{
                  backgroundColor: selectedStudentId
                    ? themeColor.primary
                    : isDark
                    ? '#27272a'
                    : '#e4e4e7',
                  borderCurve: 'continuous',
                }}
                className={`w-full rounded-full py-4 items-center justify-center ${
                  selectedStudentId ? 'active:opacity-90 shadow-sm' : ''
                }`}
              >
                <Text
                  style={{
                    color: selectedStudentId
                      ? themeColor.onPrimary
                      : isDark
                      ? '#71717a'
                      : '#9ca3af',
                  }}
                  className="text-sm font-bold"
                >
                  {t.modals.eventDetail.submitDonor}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Hero MMK Banner */}
              <View
                style={{
                  backgroundColor: themeColor.primary,
                  borderCurve: 'continuous',
                }}
                className="rounded-3xl p-5 mb-5 shadow-sm"
              >
                <Text
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                >
                  {t.events.totalCollected}
                </Text>
                <Text
                  selectable
                  style={{
                    color: themeColor.onPrimary,
                    fontVariant: ['tabular-nums'],
                  }}
                  className="text-3xl font-extrabold tracking-tight"
                >
                  {formatMMK(stats.totalCollected)}
                </Text>

                {event.type === 'fixed_fee' ? (
                  <View className="mt-3 pt-3 border-t border-indigo-500/60 flex-row justify-between items-center">
                    <Text className="text-xs text-indigo-100">
                      {t.common.paid}: <Text className="font-bold text-white">{stats.totalPaidCount} / {students.length}</Text>
                    </Text>
                    <Text className="text-xs text-indigo-100">
                      {t.common.unpaid}: <Text className="font-bold text-amber-200">{stats.totalUnpaidCount}</Text>
                    </Text>
                  </View>
                ) : (
                  <View className="mt-2 flex-row items-center">
                    <Text className="text-xs text-indigo-100">
                      {t.events.donorsCount(stats.totalDonors)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Announcements Action Chips */}
              <View className="mb-5">
                <View className="flex-row items-center mb-2.5 ml-1">
                  <NativeIcon
                    sfSymbol="square.and.arrow.up"
                    materialName="share"
                    FallbackIcon={Share2}
                    size={13}
                    color="#6366f1"
                  />
                  <Text className="ml-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t.modals.eventDetail.announcements}
                  </Text>
                </View>
                <View className="flex-row gap-2.5">
                  <TouchableOpacity
                    onPress={handleCopyInitialAnnouncement}
                    style={{ borderCurve: 'continuous' }}
                    className="flex-1 flex-row items-center justify-center rounded-full bg-white dark:bg-zinc-900 py-3 px-3 shadow-none active:bg-indigo-50 dark:active:bg-zinc-800"
                  >
                    <NativeIcon
                      sfSymbol="doc.on.doc"
                      materialName="content-copy"
                      FallbackIcon={Copy}
                      size={14}
                      color="#4f46e5"
                    />
                    <Text className="ml-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {t.modals.eventDetail.initialNotice}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCopyClosingAnnouncement}
                    style={{ borderCurve: 'continuous' }}
                    className="flex-1 flex-row items-center justify-center rounded-full bg-white dark:bg-zinc-900 py-3 px-3 shadow-none active:bg-indigo-50 dark:active:bg-zinc-800"
                  >
                    <NativeIcon
                      sfSymbol="doc.on.doc"
                      materialName="content-copy"
                      FallbackIcon={Copy}
                      size={14}
                      color="#059669"
                    />
                    <Text className="ml-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {t.modals.eventDetail.finalNotice}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Aesthetic Table Image Export Button */}
                <TouchableOpacity
                  onPress={() => setShowAestheticExport(true)}
                  style={{ borderCurve: 'continuous' }}
                  className="mt-2.5 w-full flex-row items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 py-2.5 px-4 border border-rose-200 dark:border-rose-900/40"
                >
                  <NativeIcon
                    sfSymbol="photo.artframe"
                    materialName="image"
                    FallbackIcon={ImageIcon}
                    size={14}
                    color="#e11d48"
                  />
                  <Text className="ml-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {t.reports.imageExport} (PNG)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* List Section Header & Search */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                    {event.type === 'donation' ? t.events.donorsList : t.events.collectionRoster}
                  </Text>

                  {event.type === 'donation' ? (
                    <TouchableOpacity
                      onPress={() => setViewMode('add_donor')}
                      style={{
                        backgroundColor: themeColor.primary,
                        borderCurve: 'continuous',
                      }}
                      className="flex-row items-center rounded-full px-3.5 py-1.5 shadow-xs active:opacity-90"
                    >
                      <NativeIcon
                        sfSymbol="plus"
                        materialName="add"
                        FallbackIcon={Plus}
                        size={14}
                        color={themeColor.onPrimary}
                      />
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="ml-1 text-xs font-bold"
                      >
                        {t.events.addDonor}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Fixed Fee Filter Chips */}
                {event.type === 'fixed_fee' ? (
                  <View className="flex-row gap-2 mb-3">
                    {(['all', 'unpaid', 'paid'] as const).map((mode) => {
                      const count =
                        mode === 'all'
                          ? students.length
                          : mode === 'unpaid'
                          ? stats.totalUnpaidCount
                          : stats.totalPaidCount;
                      const label =
                        mode === 'all'
                          ? `${t.common.all} (${count})`
                          : mode === 'unpaid'
                          ? `${t.common.unpaid} (${count})`
                          : `${t.common.paid} (${count})`;
                      return (
                        <TouchableOpacity
                          key={mode}
                          onPress={() => setFixedFilter(mode)}
                          style={{
                            backgroundColor:
                              fixedFilter === mode
                                ? themeColor.primary
                                : isDark
                                ? '#18181b'
                                : '#ffffff',
                            borderCurve: 'continuous',
                          }}
                          className={`rounded-full px-3.5 py-1.5 border ${
                            fixedFilter === mode
                              ? 'border-transparent shadow-xs'
                              : 'border-zinc-200/70 dark:border-zinc-800/80'
                          }`}
                        >
                          <Text
                            style={{
                              color:
                                fixedFilter === mode
                                  ? themeColor.onPrimary
                                  : isDark
                                  ? '#e4e4e7'
                                  : '#52525b',
                            }}
                            className="text-xs font-bold"
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                {/* Search input */}
                <View
                  style={{
                    backgroundColor: Platform.OS === 'web' ? 'var(--bg-card)' : isDark ? '#18181b' : '#ffffff',
                    borderCurve: 'continuous',
                  }}
                  className="flex-row items-center rounded-2xl px-3.5 py-2.5 mb-3 border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900"
                >
                  <NativeIcon
                    sfSymbol="magnifyingglass"
                    materialName="search"
                    FallbackIcon={Search}
                    size={16}
                    color={isDark ? '#71717a' : '#9ca3af'}
                  />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t.events.searchDonors}
                    placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                    style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                    className="ml-2 flex-1 text-xs p-0"
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <NativeIcon
                        sfSymbol="xmark.circle.fill"
                        materialName="clear"
                        FallbackIcon={X}
                        size={14}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* List Body */}
              {event.type === 'donation' ? (
                filteredDonors.length === 0 ? (
                  <View
                    style={{ borderCurve: 'continuous' }}
                    className="items-center justify-center py-12 rounded-3xl bg-white dark:bg-zinc-900 mb-8 p-6 border border-zinc-200/70 dark:border-zinc-800/80"
                  >
                    <View
                      style={{ backgroundColor: themeColor.surface }}
                      className="h-14 w-14 rounded-full items-center justify-center mb-3"
                    >
                      <NativeIcon
                        sfSymbol="sparkles"
                        materialName="favorite"
                        FallbackIcon={HeartHandshake}
                        size={28}
                        color={themeColor.primary}
                      />
                    </View>
                    <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                      {language === 'en' ? 'No donations yet' : 'အလှူရှင် မှတ်တမ်း မရှိသေးပါ'}
                    </Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-4">
                      {language === 'en' ? 'Add student donations to get started' : 'အလှူငွေထည့်သွင်းသူများကို စာရင်းသွင်းနိုင်ပါသည်'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setViewMode('add_donor')}
                      style={{
                        backgroundColor: themeColor.primary,
                        borderCurve: 'continuous',
                      }}
                      className="rounded-full px-5 py-2.5 active:opacity-90"
                    >
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="text-xs font-bold"
                      >
                        {t.events.addDonor}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="gap-2.5 mb-8">
                    {filteredDonors.map((record, index) => {
                      const student = studentMap.get(record.studentId);
                      return (
                        <View
                          key={record.id}
                          style={{ borderCurve: 'continuous' }}
                          className="rounded-2xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/70 dark:border-zinc-800/80 flex-row items-center justify-between"
                        >
                          <View className="flex-row items-center flex-1 mr-2">
                            <View
                              style={{
                                backgroundColor: themeColor.surface,
                                borderColor: themeColor.border,
                                borderCurve: 'continuous',
                              }}
                              className="h-8 w-8 rounded-full border items-center justify-center mr-3"
                            >
                              <Text
                                style={{
                                  color: themeColor.text,
                                  fontVariant: ['tabular-nums'],
                                }}
                                className="text-xs font-bold"
                              >
                                {index + 1}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text
                                selectable
                                className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
                              >
                                {student?.name || t.common.name}
                              </Text>
                              {student?.rollNumber ? (
                                <Text selectable className="text-[11px] text-zinc-400">
                                  {student.rollNumber}
                                </Text>
                              ) : null}
                            </View>
                          </View>

                          <View className="flex-row items-center gap-3">
                            <Text
                              selectable
                              style={{ fontVariant: ['tabular-nums'] }}
                              className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400"
                            >
                              {formatMMK(record.amount)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => deleteEventRecord(record.id)}
                              className="p-1 rounded-full active:bg-rose-50"
                            >
                              <NativeIcon
                                sfSymbol="trash"
                                materialName="delete-outline"
                                FallbackIcon={Trash2}
                                size={15}
                                color="#9ca3af"
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
                  style={{ borderCurve: 'continuous' }}
                  className="items-center justify-center py-12 rounded-3xl bg-white dark:bg-zinc-900 mb-8 p-6"
                >
                  <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {t.roster.emptyStudentsTitle}
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5 mb-8">
                  {fixedStudentsList.map((item) => (
                    <View
                      key={item.student.id}
                      style={{ borderCurve: 'continuous' }}
                      className="rounded-2xl bg-white dark:bg-zinc-900 p-4 flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-3">
                        <Text
                          selectable
                          className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
                        >
                          {item.student.name}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-0.5">
                          {item.student.rollNumber ? (
                            <Text selectable className="text-[11px] text-zinc-400">
                              {item.student.rollNumber}
                            </Text>
                          ) : null}
                          <Text
                            selectable
                            style={{ fontVariant: ['tabular-nums'] }}
                            className="text-[11px] font-semibold text-zinc-500"
                          >
                            {formatMMK(item.amount)}
                          </Text>
                        </View>
                      </View>

                      {/* 1-Tap M3 Pill Toggle */}
                      <TouchableOpacity
                        onPress={() =>
                          setEventStudentPaid(
                            event.id,
                            item.student.id,
                            !item.isPaid,
                            event.fixedAmount
                          )
                        }
                        activeOpacity={0.8}
                        style={{ borderCurve: 'continuous' }}
                        className={`flex-row items-center rounded-full px-3.5 py-1.5 ${
                          item.isPaid
                            ? 'bg-emerald-500/15'
                            : 'bg-rose-500/15'
                        }`}
                      >
                        {item.isPaid ? (
                          <NativeIcon
                            sfSymbol="checkmark.circle.fill"
                            materialName="check-circle"
                            FallbackIcon={CheckCircle2}
                            size={14}
                            color="#059669"
                          />
                        ) : (
                          <NativeIcon
                            sfSymbol="clock.fill"
                            materialName="schedule"
                            FallbackIcon={Clock}
                            size={14}
                            color="#e11d48"
                          />
                        )}
                        <Text
                          style={{
                            color: item.isPaid
                              ? isDark
                                ? '#6ee7b7'
                                : '#047857'
                              : isDark
                              ? '#fca5a5'
                              : '#b91c1c',
                          }}
                          className="ml-1.5 text-xs font-bold"
                        >
                          {item.isPaid ? t.common.paid : t.common.unpaid}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
      </DragDismissSheet>

      {/* Aesthetic Table Image Report Modal */}
      {event && (
        <AestheticReportModal
          visible={showAestheticExport}
          onClose={() => setShowAestheticExport(false)}
          onShowToast={onShowToast}
          initialReportType="event_donors"
          initialEventId={event.id}
        />
      )}
    </>
  );
};
