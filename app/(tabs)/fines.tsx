import {
  Calendar,
  CheckCircle2,
  Clock,
  Gavel,
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AestheticReportModal } from '@/src/components/AestheticReportModal';
import { BatchFineModal } from '@/src/components/BatchFineModal';
import { NativeIcon } from '@/src/components/NativeIcon';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { Fine } from '@/src/types';
import { formatMMK } from '@/src/utils/formatters';

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
  const { isDark, themeColor } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Modals state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAestheticModal, setShowAestheticModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fast lookups
  const studentMap = useMemo(() => {
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);

  const subjectMap = useMemo(() => {
    return new Map(subjects.map((s) => [s.id, s]));
  }, [subjects]);

  // Filtered fines list
  const filteredFines = useMemo(() => {
    return fines.filter((fine) => {
      // Status filter
      if (statusFilter === 'unpaid' && fine.isPaid) return false;
      if (statusFilter === 'paid' && !fine.isPaid) return false;

      // Subject filter
      if (selectedSubjectId !== 'all' && fine.subjectId !== selectedSubjectId) {
        return false;
      }

      // Search query (Student Name, Roll Number, or Reason)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const student = studentMap.get(fine.studentId);
        const nameMatch = student?.name.toLowerCase().includes(q) || false;
        const rollMatch = student?.rollNumber?.toLowerCase().includes(q) || false;
        const reasonMatch = fine.reason.toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !reasonMatch) return false;
      }

      return true;
    });
  }, [fines, statusFilter, selectedSubjectId, searchQuery, studentMap]);

  const handleDeleteFine = (fineId: string, studentName: string) => {
    Alert.alert(
      t.fines.deleteTitle,
      t.fines.deleteMsg(studentName),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteFine(fineId);
            setToastMessage(t.fines.deleteToast);
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
        showsVerticalScrollIndicator={true}
      >
        <View className="w-full max-w-4xl mx-auto">
          {/* Screen Header */}
          <View className="mb-5 pt-2 flex-row items-center justify-between">
            <View className="flex-1 mr-2">
              <Text
                selectable
                className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-relaxed py-0.5"
              >
                {t.fines.title}
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.fines.subtitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAestheticModal(true)}
              style={{ borderCurve: 'continuous' }}
              className="flex-row items-center bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 px-3.5 py-2.5 rounded-full shadow-xs active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <NativeIcon
                sfSymbol="photo.artframe"
                materialName="image"
                FallbackIcon={ImageIcon}
                size={14}
                color={themeColor.primary}
              />
              <Text className="ml-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {t.fines.imageExport}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hero Fine Summary Card */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t.fines.summaryTitle}
              </Text>
              <View className="h-7 w-7 rounded-full bg-rose-50 dark:bg-rose-950/60 items-center justify-center">
                <NativeIcon
                  sfSymbol="exclamationmark.triangle.fill"
                  materialName="gavel"
                  FallbackIcon={Gavel}
                  size={14}
                  color="#e11d48"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              {/* Collected (Paid) */}
              <View
                style={{ borderCurve: 'continuous' }}
                className="flex-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-100 dark:border-emerald-900/30"
              >
                <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">
                  {t.fines.paidTotal}
                </Text>
                <Text
                  selectable
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight"
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
                  {t.fines.unpaidTotal}
                </Text>
                <Text
                  selectable
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="text-lg font-extrabold text-rose-700 dark:text-rose-300 tracking-tight"
                >
                  {formatMMK(finesSummary.totalUnpaid)}
                </Text>
              </View>
            </View>
          </View>

          {/* Search & Filter Controls */}
          <View className="mb-4">
            {/* Status Chips */}
            <View className="flex-row gap-2 mb-3">
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
                    onPress={() => setStatusFilter(st)}
                    style={{
                      backgroundColor: isSelected
                        ? themeColor.primary
                        : isDark
                        ? '#18181b'
                        : '#ffffff',
                      borderCurve: 'continuous',
                    }}
                    className={`rounded-full px-4 py-2 border ${
                      isSelected
                        ? 'border-transparent shadow-xs'
                        : 'border-zinc-200/70 dark:border-zinc-800/80'
                    }`}
                  >
                    <Text
                      style={{
                        color: isSelected
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

            {/* Subject Filter Horizontal Scroll */}
            {subjects.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2 mb-3"
              >
                <TouchableOpacity
                  onPress={() => setSelectedSubjectId('all')}
                  style={{
                    backgroundColor:
                      selectedSubjectId === 'all'
                        ? themeColor.primary
                        : isDark
                        ? '#18181b'
                        : '#ffffff',
                    borderCurve: 'continuous',
                  }}
                  className={`rounded-full px-3.5 py-1.5 border ${
                    selectedSubjectId === 'all'
                      ? 'border-transparent shadow-xs'
                      : 'border-zinc-200/70 dark:border-zinc-800/80'
                  }`}
                >
                  <Text
                    style={{
                      color:
                        selectedSubjectId === 'all'
                          ? themeColor.onPrimary
                          : isDark
                          ? '#e4e4e7'
                          : '#52525b',
                    }}
                    className="text-[11px] font-bold"
                  >
                    {t.fines.allSubjects}
                  </Text>
                </TouchableOpacity>
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => setSelectedSubjectId(sub.id)}
                      style={{
                        backgroundColor: isSelected
                          ? themeColor.primary
                          : isDark
                          ? '#18181b'
                          : '#ffffff',
                        borderCurve: 'continuous',
                      }}
                      className={`rounded-full px-3.5 py-1.5 border ${
                        isSelected
                          ? 'border-transparent shadow-xs'
                          : 'border-zinc-200/70 dark:border-zinc-800/80'
                      }`}
                    >
                      <Text
                        style={{
                          color: isSelected
                            ? themeColor.onPrimary
                            : isDark
                            ? '#e4e4e7'
                            : '#52525b',
                        }}
                        className="text-[11px] font-bold"
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Search Bar */}
            <View
              style={{
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderCurve: 'continuous',
              }}
              className="flex-row items-center rounded-2xl px-4 py-3 border border-zinc-200/70 dark:border-zinc-800/80"
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
                placeholder={t.fines.searchPlaceholder}
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                className="ml-2.5 flex-1 text-xs p-0"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <NativeIcon
                    sfSymbol="xmark.circle.fill"
                    materialName="clear"
                    FallbackIcon={X}
                    size={15}
                    color={isDark ? '#71717a' : '#9ca3af'}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Fines Feed */}
          {filteredFines.length === 0 ? (
            <View
              style={{ borderCurve: 'continuous' }}
              className="items-center justify-center py-16 px-6 rounded-3xl bg-white dark:bg-zinc-900 mt-2 border border-zinc-200/70 dark:border-zinc-800/80"
            >
              <View
                style={{ backgroundColor: themeColor.surface }}
                className="h-16 w-16 rounded-full items-center justify-center mb-3"
              >
                <NativeIcon
                  sfSymbol="exclamationmark.triangle.fill"
                  materialName="gavel"
                  FallbackIcon={Gavel}
                  size={32}
                  color={themeColor.primary}
                />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                {t.fines.emptyTitle}
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-5 max-w-xs leading-relaxed">
                {t.fines.emptyDesc}
              </Text>
              <TouchableOpacity
                onPress={() => setShowBatchModal(true)}
                style={{
                  backgroundColor: themeColor.primary,
                  borderCurve: 'continuous',
                }}
                className="flex-row items-center rounded-full px-6 py-3 active:opacity-90 shadow-sm"
              >
                <NativeIcon
                  sfSymbol="plus"
                  materialName="add"
                  FallbackIcon={Plus}
                  size={16}
                  color={themeColor.onPrimary}
                />
                <Text
                  style={{ color: themeColor.onPrimary }}
                  className="ml-1.5 text-xs font-bold"
                >
                  {t.fines.batchFine}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-2.5">
              {filteredFines.map((fine) => {
                const student = studentMap.get(fine.studentId);
                const subject = subjectMap.get(fine.subjectId);

                return (
                  <View
                    key={fine.id}
                    style={{ borderCurve: 'continuous' }}
                    className="rounded-3xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-3">
                      {/* Subject badge & date */}
                      <View className="flex-row items-center gap-2 mb-1">
                        <View
                          style={{
                            backgroundColor: themeColor.surface,
                            borderColor: themeColor.border,
                            borderCurve: 'continuous',
                          }}
                          className="rounded-full px-2.5 py-0.5 border"
                        >
                          <Text
                            style={{ color: themeColor.text }}
                            className="text-[10px] font-bold"
                          >
                            {subject?.name || 'General'}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <NativeIcon
                            sfSymbol="calendar"
                            materialName="calendar-today"
                            FallbackIcon={Calendar}
                            size={11}
                            color="#9ca3af"
                          />
                          <Text className="ml-1 text-[10px] text-zinc-400">
                            {fine.date}
                          </Text>
                        </View>
                      </View>

                      {/* Student Name */}
                      <Text
                        selectable
                        className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed py-0.5"
                      >
                        {student?.name || 'Unknown Student'}
                        {student?.rollNumber ? (
                          <Text className="text-xs font-normal text-zinc-400">
                            {' '}({student.rollNumber})
                          </Text>
                        ) : null}
                      </Text>

                      {/* Reason */}
                      <Text
                        selectable
                        className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed"
                      >
                        {fine.reason}
                      </Text>
                    </View>

                    <View className="items-end gap-2">
                      {/* Amount */}
                      <Text
                        selectable
                        style={{ fontVariant: ['tabular-nums'] }}
                        className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50"
                      >
                        {formatMMK(fine.amount)}
                      </Text>

                      {/* 1-Tap Tactile Pill Toggle */}
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => toggleFinePaid(fine.id)}
                          activeOpacity={0.8}
                          style={{ borderCurve: 'continuous' }}
                          className={`flex-row items-center rounded-full px-3.5 py-1.5 ${
                            fine.isPaid
                              ? 'bg-emerald-500/15'
                              : 'bg-rose-500/15'
                          }`}
                        >
                          {fine.isPaid ? (
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
                              color: fine.isPaid
                                ? isDark
                                  ? '#34d399'
                                  : '#059669'
                                : isDark
                                ? '#fb7185'
                                : '#e11d48',
                            }}
                            className="ml-1.5 text-[11px] font-bold"
                          >
                            {fine.isPaid ? t.common.paid : t.common.unpaid}
                          </Text>
                        </TouchableOpacity>

                        {/* Delete Fine Button */}
                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteFine(fine.id, student?.name || 'Unknown')
                          }
                          className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/40"
                        >
                          <NativeIcon
                            sfSymbol="trash"
                            materialName="delete"
                            FallbackIcon={Trash2}
                            size={14}
                            color="#a1a1aa"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Prominent Floating Action Button with Safe Inset Positioning */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16) + 16,
          right: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => setShowBatchModal(true)}
          activeOpacity={0.85}
          style={{
            backgroundColor: themeColor.primary,
            borderCurve: 'continuous',
          }}
          className="flex-row items-center rounded-full px-5 py-4 shadow-lg active:opacity-90"
        >
          <NativeIcon
            sfSymbol="plus"
            materialName="add"
            FallbackIcon={Plus}
            size={18}
            color={themeColor.onPrimary}
          />
          <Text
            style={{ color: themeColor.onPrimary }}
            className="ml-2 text-sm font-bold"
          >
            {t.fines.batchFine}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Batch Fine Modal */}
      <BatchFineModal
        visible={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSuccess={(count) => {
          setToastMessage(t.fines.batchCountToast(count));
        }}
      />

      {/* Aesthetic Table Image Report Modal */}
      <AestheticReportModal
        visible={showAestheticModal}
        onClose={() => setShowAestheticModal(false)}
        onShowToast={(msg) => setToastMessage(msg)}
        initialReportType="student_fines"
      />
    </View>
  );
}
