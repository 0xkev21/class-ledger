import {
  Calendar,
  Check,
  Gavel,
  Plus,
  Search,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useTreasury } from '../context/TreasuryContext';
import { formatMMK, getTodayFormatted } from '../utils/formatters';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';

interface BatchFineModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BatchFineModal: React.FC<BatchFineModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { subjects, students, batchCreateFines, addSubject, language, t } = useTreasury();
  const { isDark, themeColor } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [date, setDate] = useState(getTodayFormatted());
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('1000');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [error, setError] = useState('');

  // Inline Add Subject state
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  useEffect(() => {
    if (visible) {
      setDate(getTodayFormatted());
      if (subjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjects[0].id);
      }
      setSelectedStudentIds([]);
      setReason('');
      setAmount('1000');
      setSearchStudent('');
      setError('');
    }
  }, [visible, subjects]);

  const amountNumber = parseInt(amount, 10) || 0;
  const totalFineMMK = selectedStudentIds.length * amountNumber;

  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return students;
    const q = searchStudent.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q)
    );
  }, [students, searchStudent]);

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleCreateSubjectInline = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const newId = await addSubject({ name: newSubjectName.trim() });
      setSelectedSubjectId(newId);
      setNewSubjectName('');
      setIsAddingSubject(false);
    } catch (err: any) {
      setError(t.common.error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubjectId) {
      setError(t.modals.batchFine.errorSelectSubject);
      return;
    }
    if (!reason.trim()) {
      setError(t.modals.batchFine.errorReason);
      return;
    }
    if (amountNumber <= 0) {
      setError(t.modals.batchFine.errorAmount);
      return;
    }
    if (selectedStudentIds.length === 0) {
      setError(t.modals.batchFine.errorNoStudent);
      return;
    }

    try {
      const count = await batchCreateFines({
        date: date.trim(),
        subjectId: selectedSubjectId,
        reason: reason.trim(),
        amount: amountNumber,
        studentIds: selectedStudentIds,
      });

      onClose();
      onSuccess(count);
    } catch (err: any) {
      setError(err.message || t.common.error);
    }
  };

  return (
    <DragDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeight={windowHeight * 0.92}
      isDark={isDark}
      sheetClassName="p-0 overflow-hidden"
    >
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: themeColor.surface }}
            className="h-10 w-10 rounded-full items-center justify-center mr-3"
          >
            <NativeIcon
              sfSymbol="exclamationmark.triangle.fill"
              materialName="gavel"
              FallbackIcon={Gavel}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <View>
            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {t.modals.batchFine.title}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.modals.batchFine.subtitle}
            </Text>
          </View>
        </View>
        <PressableScale
          onPress={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDark ? '#27272a' : '#f4f4f5',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
        >
          <NativeIcon
            sfSymbol="xmark"
            materialName="close"
            FallbackIcon={X}
            size={16}
            color="#71717a"
          />
        </PressableScale>
      </View>

          {error ? (
            <View
              style={{ borderCurve: 'continuous' }}
              className="mx-6 mt-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3"
            >
              <Text className="text-xs text-rose-600 dark:text-rose-300 font-medium">{error}</Text>
            </View>
          ) : null}

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={true}
          >
            {/* 1. Date & Subject Row */}
            <View className="flex-row gap-3 mb-4">
              {/* Date */}
              <View className="flex-1">
                <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                  {t.modals.batchFine.dateLabel}
                </Text>
                <View
                  style={{ borderCurve: 'continuous' }}
                  className="flex-row items-center rounded-2xl bg-slate-100 dark:bg-zinc-800 px-3.5 py-3"
                >
                  <NativeIcon
                    sfSymbol="calendar"
                    materialName="calendar-today"
                    FallbackIcon={Calendar}
                    size={16}
                    color="#71717a"
                  />
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="DD/MM/YY"
                    placeholderTextColor="#9ca3af"
                    className="ml-2 flex-1 text-xs font-semibold text-zinc-900 dark:text-zinc-50 p-0"
                  />
                </View>
              </View>

              {/* Subject */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1.5 ml-1">
                  <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t.modals.batchFine.subjectLabel}
                  </Text>
                  {!isAddingSubject ? (
                    <TouchableOpacity
                      onPress={() => setIsAddingSubject(true)}
                      className="flex-row items-center"
                    >
                      <NativeIcon
                        sfSymbol="plus"
                        materialName="add"
                        FallbackIcon={Plus}
                        size={12}
                        color={themeColor.primary}
                      />
                      <Text
                        style={{ color: themeColor.primary }}
                        className="text-[11px] font-bold ml-0.5"
                      >
                        {t.common.add}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {isAddingSubject ? (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <TextInput
                      value={newSubjectName}
                      onChangeText={setNewSubjectName}
                      placeholder={t.modals.addSubject.namePlaceholder}
                      placeholderTextColor="#9ca3af"
                      autoFocus
                      onSubmitEditing={handleCreateSubjectInline}
                      style={{ borderCurve: 'continuous', borderColor: themeColor.primary }}
                      className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-50 border"
                    />
                    <TouchableOpacity
                      onPress={handleCreateSubjectInline}
                      disabled={!newSubjectName.trim()}
                      style={{
                        backgroundColor: themeColor.primary,
                        borderCurve: 'continuous',
                      }}
                      className="rounded-xl px-3 py-2 active:opacity-90"
                    >
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="text-xs font-bold"
                      >
                        {t.common.add}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setIsAddingSubject(false);
                        setNewSubjectName('');
                      }}
                      style={{ borderCurve: 'continuous' }}
                      className="rounded-xl bg-zinc-200 dark:bg-zinc-800 p-2"
                    >
                      <NativeIcon
                        sfSymbol="xmark"
                        materialName="close"
                        FallbackIcon={X}
                        size={14}
                        color="#71717a"
                      />
                    </TouchableOpacity>
                  </View>
                ) : subjects.length === 0 ? (
                  <TouchableOpacity
                    onPress={() => setIsAddingSubject(true)}
                    style={{
                      borderCurve: 'continuous',
                      borderColor: themeColor.border,
                      backgroundColor: themeColor.surface,
                    }}
                    className="rounded-2xl border border-dashed p-2.5 items-center justify-center"
                  >
                    <Text
                      style={{ color: themeColor.text }}
                      className="text-xs font-bold"
                    >
                      {t.roster.addSubject}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row gap-1.5"
                  >
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
                              ? '#27272a'
                              : '#f4f4f5',
                            borderCurve: 'continuous',
                          }}
                          className={`rounded-full px-3 py-2 ${
                            isSelected ? 'shadow-xs' : ''
                          }`}
                        >
                          <Text
                            style={{
                              color: isSelected
                                ? themeColor.onPrimary
                                : isDark
                                ? '#d4d4d8'
                                : '#3f3f46',
                            }}
                            className="text-xs font-bold"
                          >
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* 2. Reason */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                {t.modals.batchFine.reasonLabel} <Text className="text-rose-500">*</Text>
              </Text>
              <TextInput
                value={reason}
                onChangeText={(rVal) => {
                  setReason(rVal);
                  setError('');
                }}
                placeholder={t.modals.batchFine.reasonPlaceholder}
                placeholderTextColor="#9ca3af"
                style={{ borderCurve: 'continuous' }}
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-50"
              />
            </View>

            {/* 3. Amount Per Student */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                {t.modals.batchFine.amountLabel} <Text className="text-rose-500">*</Text>
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="1000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                style={{ borderCurve: 'continuous', fontVariant: ['tabular-nums'] }}
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-2"
              />
              <View className="flex-row gap-2">
                {[500, 1000, 2000, 3000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => setAmount(String(preset))}
                    style={{ borderCurve: 'continuous' }}
                    className="rounded-full bg-slate-200/80 dark:bg-zinc-700/80 px-3 py-1"
                  >
                    <Text
                      style={{ fontVariant: ['tabular-nums'] }}
                      className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {preset.toLocaleString()} K
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 4. Multi-Select Students Checklist */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-1">
                  {t.modals.batchFine.selectedCount(selectedStudentIds.length, filteredStudents.length)}
                </Text>
                <TouchableOpacity onPress={handleSelectAll}>
                  <Text
                    style={{ color: themeColor.primary }}
                    className="text-xs font-bold"
                  >
                    {selectedStudentIds.length === filteredStudents.length &&
                    filteredStudents.length > 0
                      ? (language === 'en' ? 'Deselect All' : 'အားလုံး ပယ်ဖျက်')
                      : t.modals.batchFine.selectAll}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search students input */}
              <View
                style={{
                  backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                  borderCurve: 'continuous',
                }}
                className="flex-row items-center rounded-2xl px-3.5 py-2.5 mb-2.5"
              >
                <NativeIcon
                  sfSymbol="magnifyingglass"
                  materialName="search"
                  FallbackIcon={Search}
                  size={16}
                  color={isDark ? '#71717a' : '#9ca3af'}
                />
                <TextInput
                  value={searchStudent}
                  onChangeText={setSearchStudent}
                  placeholder={t.modals.batchFine.searchStudentPlaceholder}
                  placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                  style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
                  className="ml-2 flex-1 text-xs p-0"
                />
              </View>

              {/* Student Checklist Container */}
              <View
                style={{ borderCurve: 'continuous' }}
                className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-2 max-h-56 border border-zinc-200/60 dark:border-zinc-700/60"
              >
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                  {filteredStudents.length === 0 ? (
                    <Text className="text-center text-xs text-zinc-400 py-6">
                      {t.roster.emptyStudentsTitle}
                    </Text>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => toggleSelectStudent(s.id)}
                          style={{
                            backgroundColor: isSelected
                              ? themeColor.surface
                              : isDark
                              ? '#18181b'
                              : '#ffffff',
                            borderCurve: 'continuous',
                          }}
                          className={`flex-row items-center justify-between p-3 rounded-xl mb-1 border ${
                            isSelected ? 'border-transparent' : 'border-zinc-200/70 dark:border-zinc-800/80'
                          }`}
                        >
                          <View className="flex-row items-center flex-1 mr-2">
                            <View
                              style={{
                                backgroundColor: isSelected ? themeColor.primary : 'transparent',
                                borderColor: isSelected ? themeColor.primary : (isDark ? '#52525b' : '#d4d4d8'),
                              }}
                              className="h-5 w-5 rounded-md items-center justify-center mr-3 border"
                            >
                              {isSelected ? (
                                <NativeIcon
                                  sfSymbol="checkmark"
                                  materialName="check"
                                  FallbackIcon={Check}
                                  size={14}
                                  color={themeColor.onPrimary}
                                />
                              ) : null}
                            </View>
                            <Text
                              style={{
                                color: isSelected
                                  ? themeColor.text
                                  : isDark
                                  ? '#f4f4f5'
                                  : '#18181b',
                              }}
                              className="text-xs font-bold"
                            >
                              {s.name}
                            </Text>
                          </View>

                          {s.rollNumber ? (
                            <Text className="text-[11px] text-zinc-400 font-medium">
                              {s.rollNumber}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Live Footer Summary & Action */}
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            className="p-5 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800"
          >
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {selectedStudentIds.length} {language === 'en' ? 'students' : 'ဦး'} • {formatMMK(amountNumber)}
              </Text>
              <Text
                style={{ fontVariant: ['tabular-nums'] }}
                className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50"
              >
                = {formatMMK(totalFineMMK)}
              </Text>
            </View>

            <PressableScale
              onPress={handleSubmit}
              disabled={selectedStudentIds.length === 0}
              style={{
                backgroundColor:
                  selectedStudentIds.length > 0
                    ? themeColor.primary
                    : isDark
                    ? '#27272a'
                    : '#e4e4e7',
                borderRadius: 9999,
                paddingVertical: 14,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                borderCurve: 'continuous',
                marginBottom: 4,
              }}
              className="w-full rounded-full py-3.5 items-center justify-center"
            >
              <Text
                style={{
                  color:
                    selectedStudentIds.length > 0
                      ? themeColor.onPrimary
                      : isDark
                      ? '#71717a'
                      : '#9ca3af',
                }}
                className="text-sm font-bold"
              >
                {t.modals.batchFine.submit} ({selectedStudentIds.length})
              </Text>
            </PressableScale>
          </View>
    </DragDismissSheet>
  );
};
