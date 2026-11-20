import { Calendar, Check, Gavel, Plus, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { formatMMK, getTodayFormatted } from '@/src/utils/formatters';
import { Haptics } from '@/src/utils/haptics';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';
import { SearchBar } from './SearchBar';
import { StatusPill } from './StatusPill';

export interface BatchFineModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const FINE_AMOUNT_PRESETS = [500, 1000, 1500, 2000, 3000];

export const BatchFineModal: React.FC<BatchFineModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { subjects, students, batchCreateFines, addSubject, language, t } =
    useTreasury();
  const { isDark, themeColor, palette } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [date, setDate] = useState(getTodayFormatted());
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('1000');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [error, setError] = useState('');

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
    Haptics.selectionAsync();
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    Haptics.selectionAsync();
    if (
      selectedStudentIds.length === filteredStudents.length &&
      filteredStudents.length > 0
    ) {
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
    } catch {
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

  const allSelected =
    selectedStudentIds.length === filteredStudents.length &&
    filteredStudents.length > 0;
  const canSubmit = selectedStudentIds.length > 0;

  return (
    <DragDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeight={windowHeight * 0.92}
      isDark={isDark}
      sheetClassName="p-0 overflow-hidden"
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.card,
            borderBottomColor: palette.line,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="exclamationmark.triangle.fill"
              materialName="gavel"
              FallbackIcon={Gavel}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <View style={styles.flexMinZero}>
            <Text
              style={[
                styles.title,
                { color: palette.ink, fontFamily: fonts.semibold },
              ]}
            >
              {t.modals.batchFine.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.subtitle,
                { color: palette.muted, fontFamily: fonts.regular },
              ]}
            >
              {t.modals.batchFine.subtitle}
            </Text>
          </View>
        </View>

        <PressableScale
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          style={[styles.closeButton, { backgroundColor: palette.surface }]}
        >
          <NativeIcon
            sfSymbol="xmark"
            materialName="close"
            FallbackIcon={X}
            size={16}
            color={palette.subtle}
          />
        </PressableScale>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: palette.dangerBg }]}>
          <Text
            style={[
              styles.errorText,
              { color: palette.dangerText, fontFamily: fonts.medium },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.flexOne}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Date & Subject Row */}
        <View style={styles.dateSubjectRow}>
          {/* Date */}
          <View style={styles.flexOne}>
            <Text
              style={[
                styles.label,
                { color: palette.muted, fontFamily: fonts.medium },
              ]}
            >
              {t.modals.batchFine.dateLabel}
            </Text>
            <View
              style={[
                styles.dateInputWrap,
                { backgroundColor: palette.card, borderColor: palette.line },
              ]}
            >
              <NativeIcon
                sfSymbol="calendar"
                materialName="calendar-today"
                FallbackIcon={Calendar}
                size={15}
                color={palette.muted}
              />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="DD/MM/YY"
                placeholderTextColor={palette.muted}
                style={[
                  styles.dateInputText,
                  {
                    color: palette.ink,
                    fontFamily: fonts.monoMedium,
                    ...(Platform.OS === 'web'
                      ? ({ outlineStyle: 'none' } as any)
                      : {}),
                  },
                ]}
              />
            </View>
          </View>

          {/* Subject */}
          <View style={styles.flexOne}>
            <View style={styles.subjectLabelRow}>
              <Text
                style={[
                  styles.labelNoGap,
                  { color: palette.muted, fontFamily: fonts.medium },
                ]}
              >
                {t.modals.batchFine.subjectLabel}
              </Text>
              {!isAddingSubject ? (
                <TouchableOpacity
                  onPress={() => setIsAddingSubject(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t.common.add}
                  style={styles.inlineAddTrigger}
                >
                  <NativeIcon
                    sfSymbol="plus"
                    materialName="add"
                    FallbackIcon={Plus}
                    size={12}
                    color={themeColor.primary}
                  />
                  <Text
                    style={[
                      styles.inlineAddText,
                      { color: themeColor.primary, fontFamily: fonts.semibold },
                    ]}
                  >
                    {t.common.add}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {isAddingSubject ? (
              <View style={styles.inlineAddRow}>
                <TextInput
                  value={newSubjectName}
                  onChangeText={setNewSubjectName}
                  placeholder={t.modals.addSubject.namePlaceholder}
                  placeholderTextColor={palette.muted}
                  autoFocus
                  onSubmitEditing={handleCreateSubjectInline}
                  style={[
                    styles.inlineSubjectInput,
                    {
                      backgroundColor: palette.card,
                      borderColor: themeColor.primary,
                      color: palette.ink,
                      fontFamily: fonts.medium,
                      ...(Platform.OS === 'web'
                        ? ({ outlineStyle: 'none' } as any)
                        : {}),
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={handleCreateSubjectInline}
                  disabled={!newSubjectName.trim()}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t.common.add}
                  style={[
                    styles.inlineConfirmBtn,
                    {
                      backgroundColor: themeColor.primary,
                      opacity: !newSubjectName.trim() ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.inlineConfirmText,
                      {
                        color: themeColor.onPrimary,
                        fontFamily: fonts.semibold,
                      },
                    ]}
                  >
                    {t.common.add}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsAddingSubject(false);
                    setNewSubjectName('');
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t.common.cancel}
                  style={[
                    styles.inlineCancelBtn,
                    {
                      backgroundColor: palette.surface,
                    },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="xmark"
                    materialName="close"
                    FallbackIcon={X}
                    size={14}
                    color={palette.subtle}
                  />
                </TouchableOpacity>
              </View>
            ) : subjects.length === 0 ? (
              <TouchableOpacity
                onPress={() => setIsAddingSubject(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t.roster.addSubject}
                style={[
                  styles.emptySubjectBtn,
                  {
                    backgroundColor: themeColor.surface,
                    borderColor: themeColor.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptySubjectText,
                    { color: themeColor.text, fontFamily: fonts.semibold },
                  ]}
                >
                  {t.roster.addSubject}
                </Text>
              </TouchableOpacity>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectChipsContent}
              >
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
                            ? palette.ink
                            : palette.surface,
                          borderColor: isSelected
                            ? palette.ink
                            : palette.line,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subjectChipText,
                          {
                            color: isSelected ? palette.bg : palette.ink,
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
            )}
          </View>
        </View>

        {/* 2. Reason */}
        <View style={styles.fieldGroup}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.batchFine.reasonLabel}{' '}
            <Text style={{ color: palette.dangerText }}>*</Text>
          </Text>
          <TextInput
            value={reason}
            onChangeText={(rVal) => {
              setReason(rVal);
              setError('');
            }}
            placeholder={t.modals.batchFine.reasonPlaceholder}
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                backgroundColor: palette.card,
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

        {/* 3. Amount Per Student */}
        <View style={styles.fieldGroupLarge}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.batchFine.amountLabel}{' '}
            <Text style={{ color: palette.dangerText }}>*</Text>
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="1000"
            placeholderTextColor={palette.muted}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: palette.card,
                borderColor: palette.line,
                color: palette.ink,
                fontFamily: fonts.monoMedium,
                fontVariant: ['tabular-nums'],
                marginBottom: 8,
                ...(Platform.OS === 'web'
                  ? ({ outlineStyle: 'none' } as any)
                  : {}),
              },
            ]}
          />
          <View style={styles.presetsRow}>
            {FINE_AMOUNT_PRESETS.map((preset) => {
              const isSelected = amount === String(preset);
              return (
                <TouchableOpacity
                  key={preset}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAmount(String(preset));
                  }}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected
                        ? palette.ink
                        : palette.surface,
                      borderColor: isSelected ? palette.ink : palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      {
                        color: isSelected ? palette.bg : palette.ink,
                        fontFamily: fonts.monoMedium,
                      },
                    ]}
                  >
                    {preset.toLocaleString()} K
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Multi-Select Students Checklist */}
        <View style={styles.checklistSection}>
          <View style={styles.checklistHeader}>
            <Text
              style={[
                styles.labelNoGap,
                { color: palette.muted, fontFamily: fonts.medium },
              ]}
            >
              {t.modals.batchFine.selectedCount(
                selectedStudentIds.length,
                filteredStudents.length
              )}
            </Text>
            <TouchableOpacity
              onPress={handleSelectAll}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.selectAllText,
                  { color: themeColor.primary, fontFamily: fonts.semibold },
                ]}
              >
                {allSelected
                  ? language === 'en'
                    ? 'Deselect All'
                    : 'အားလုံး ပယ်ဖျက်'
                  : t.modals.batchFine.selectAll}
              </Text>
            </TouchableOpacity>
          </View>

          <SearchBar
            value={searchStudent}
            onChangeText={setSearchStudent}
            placeholder={t.modals.batchFine.searchStudentPlaceholder}
            style={styles.searchSpacer}
          />

          <View
            style={[
              styles.checklistBox,
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
              {filteredStudents.length === 0 ? (
                <Text
                  style={[
                    styles.emptyStudentsText,
                    { color: palette.muted, fontFamily: fonts.regular },
                  ]}
                >
                  {t.roster.emptyStudentsTitle}
                </Text>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => toggleSelectStudent(s.id)}
                      activeOpacity={0.8}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      style={[
                        styles.studentRow,
                        {
                          backgroundColor: isSelected
                            ? themeColor.surface
                            : palette.surface,
                          borderColor: isSelected
                            ? themeColor.border
                            : palette.line,
                        },
                      ]}
                    >
                      <View style={styles.studentRowLeft}>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: isSelected
                                ? themeColor.primary
                                : palette.card,
                              borderColor: isSelected
                                ? themeColor.primary
                                : palette.lineStrong,
                            },
                          ]}
                        >
                          {isSelected ? (
                            <NativeIcon
                              sfSymbol="checkmark"
                              materialName="check"
                              FallbackIcon={Check}
                              size={13}
                              color={themeColor.onPrimary}
                            />
                          ) : null}
                        </View>
                        {s.rollNumber ? (
                          <Text
                            style={[
                              styles.studentRoll,
                              {
                                color: isSelected
                                  ? themeColor.text
                                  : palette.muted,
                                fontFamily: fonts.monoMedium,
                              },
                            ]}
                          >
                            {s.rollNumber}
                          </Text>
                        ) : null}
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.studentName,
                            {
                              color: isSelected ? themeColor.text : palette.ink,
                              fontFamily: fonts.medium,
                            },
                          ]}
                        >
                          {s.name}
                        </Text>
                      </View>

                      {isSelected ? (
                        <StatusPill
                          variant="brand"
                          label={language === 'en' ? 'Selected' : 'ရွေးပြီး'}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Live Footer */}
      <View
        style={[
          styles.stickyFooter,
          {
            backgroundColor: palette.card,
            borderTopColor: palette.line,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.footerSummaryRow}>
          <Text
            style={[
              styles.footerCountText,
              { color: palette.muted, fontFamily: fonts.mono },
            ]}
          >
            {selectedStudentIds.length} {language === 'en' ? 'students' : 'ဦး'} ·{' '}
            {formatMMK(amountNumber)}
          </Text>
          <Text
            style={[
              styles.footerTotalText,
              { color: palette.ink, fontFamily: fonts.monoMedium },
            ]}
          >
            = {formatMMK(totalFineMMK)}
          </Text>
        </View>

        <PressableScale
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={t.modals.batchFine.submit}
          style={[
            styles.submitButton,
            {
              backgroundColor: canSubmit ? themeColor.primary : palette.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.submitText,
              {
                color: canSubmit ? themeColor.onPrimary : palette.muted,
                fontFamily: fonts.semibold,
              },
            ]}
          >
            {t.modals.batchFine.submit} ({selectedStudentIds.length})
          </Text>
        </PressableScale>
      </View>
    </DragDismissSheet>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  flexMinZero: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  errorBox: {
    marginHorizontal: 22,
    marginTop: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dateSubjectRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 2,
  },
  labelNoGap: {
    fontSize: 12,
    marginLeft: 2,
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  dateInputText: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  subjectLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inlineAddTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  inlineAddText: {
    fontSize: 11,
  },
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineSubjectInput: {
    flex: 1,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  inlineConfirmBtn: {
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  inlineConfirmText: {
    fontSize: 12,
  },
  inlineCancelBtn: {
    borderRadius: 10,
    borderCurve: 'continuous',
    padding: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  emptySubjectBtn: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  emptySubjectText: {
    fontSize: 12,
  },
  subjectChipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectChip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  subjectChipText: {
    fontSize: 12,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldGroupLarge: {
    marginBottom: 18,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  presetChipText: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  checklistSection: {
    marginBottom: 8,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectAllText: {
    fontSize: 12,
  },
  searchSpacer: {
    marginBottom: 10,
  },
  checklistBox: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 8,
    maxHeight: 224,
  },
  emptyStudentsText: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 20,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginBottom: 5,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  studentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  studentRoll: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  studentName: {
    fontSize: 13,
    flexShrink: 1,
  },
  stickyFooter: {
    paddingHorizontal: 22,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  footerCountText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  footerTotalText: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  submitButton: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 14,
  },
});
