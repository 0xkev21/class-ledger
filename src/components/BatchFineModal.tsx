import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  CheckSquare,
  Gavel,
  Plus,
  Search,
  Square,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { useTreasury } from '../context/TreasuryContext';
import { formatMMK, getTodayFormatted } from '../utils/formatters';

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
  const { subjects, students, batchCreateFines, addSubject } = useTreasury();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [date, setDate] = useState(getTodayFormatted());
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('1000');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [error, setError] = useState('');

  // Inline Add Subject state (no nested modal!)
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

  // Quick fine amount chips
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

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
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
      setError('ဘာသာရပ်ထည့်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubjectId) {
      setError('ဘာသာရပ်တစ်ခု ရွေးချယ်ပေးပါရန်');
      return;
    }
    if (!reason.trim()) {
      setError('ဒဏ်ကြေးချမှတ်ရသည့် အကြောင်းပြချက် ရိုက်ထည့်ပါ');
      return;
    }
    if (amountNumber <= 0) {
      setError('ဒဏ်ကြေးပမာဏ ထည့်သွင်းပေးပါရန်');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setError('အနည်းဆုံး ကျောင်းသား ၁ ဦး ရွေးချယ်ပေးပါရန်');
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
      setError(err.message || 'ဒဏ်ကြေးမှတ်တမ်း ချမှတ်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end md:justify-center items-center bg-black/40"
      >
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View
          style={{
            maxHeight: windowHeight * 0.92,
            height: Platform.OS === 'web' ? 'auto' : Math.min(windowHeight * 0.88, 720),
          }}
          className="w-full md:max-w-2xl bg-white dark:bg-zinc-900 rounded-t-[32px] md:rounded-[28px] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Top Drag Handle Indicator (mobile only) */}
          <View className="items-center pt-3 pb-1 md:hidden">
            <View className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-zinc-700" />
          </View>

          {/* Header */}
          <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800">
            <View className="flex-row items-center">
              <View className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/60 items-center justify-center mr-3">
                <Gavel size={20} color="#e11d48" />
              </View>
              <View>
                <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  ဒဏ်ကြေး အစုလိုက် ချမှတ်ရန်
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  Batch Fine Generator
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center"
            >
              <X size={16} color="#71717a" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="mx-6 mt-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3">
              <Text className="text-xs text-rose-600 dark:text-rose-300 font-medium">{error}</Text>
            </View>
          ) : null}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={true}
          >
            {/* 1. Date & Subject Row */}
            <View className="flex-row gap-3 mb-4">
              {/* Date */}
              <View className="flex-1">
                <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                  ရက်စွဲ (Date)
                </Text>
                <View className="flex-row items-center rounded-2xl bg-slate-100 dark:bg-zinc-800 px-3.5 py-3">
                  <Calendar size={16} color="#71717a" />
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
                    ဘာသာရပ် (Subject)
                  </Text>
                  {!isAddingSubject ? (
                    <TouchableOpacity
                      onPress={() => setIsAddingSubject(true)}
                      className="flex-row items-center"
                    >
                      <Plus size={12} color="#4f46e5" />
                      <Text className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 ml-0.5">
                        New
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {isAddingSubject ? (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <TextInput
                      value={newSubjectName}
                      onChangeText={setNewSubjectName}
                      placeholder="ဘာသာရပ် အသစ်..."
                      placeholderTextColor="#9ca3af"
                      autoFocus
                      onSubmitEditing={handleCreateSubjectInline}
                      className="flex-1 rounded-xl bg-slate-100 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-50 border border-indigo-500"
                    />
                    <TouchableOpacity
                      onPress={handleCreateSubjectInline}
                      disabled={!newSubjectName.trim()}
                      className="rounded-xl bg-indigo-600 px-3 py-2 active:bg-indigo-700"
                    >
                      <Text className="text-xs font-bold text-white">ထည့်မည်</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setIsAddingSubject(false);
                        setNewSubjectName('');
                      }}
                      className="rounded-xl bg-slate-200 dark:bg-zinc-800 p-2"
                    >
                      <X size={14} color="#71717a" />
                    </TouchableOpacity>
                  </View>
                ) : subjects.length === 0 ? (
                  <TouchableOpacity
                    onPress={() => setIsAddingSubject(true)}
                    className="rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800 p-2.5 items-center justify-center"
                  >
                    <Text className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      ဘာသာရပ် အသစ်ထည့်ပါ
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
                          className={`rounded-full px-3 py-2 ${
                            isSelected
                              ? 'bg-indigo-600'
                              : 'bg-slate-100 dark:bg-zinc-800'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'
                            }`}
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
                ဒဏ်ကြေး အကြောင်းပြချက် (Reason) <Text className="text-rose-500">*</Text>
              </Text>
              <TextInput
                value={reason}
                onChangeText={(t) => {
                  setReason(t);
                  setError('');
                }}
                placeholder="e.g. didn't draw system architecture, အိမ်စာမတင်, နောက်ကျ"
                placeholderTextColor="#9ca3af"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-50"
              />
            </View>

            {/* 3. Amount Per Student */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                တစ်ဦးလျှင် ဒဏ်ကြေးပမာဏ (MMK) <Text className="text-rose-500">*</Text>
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="1000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-2"
              />
              <View className="flex-row gap-2">
                {[500, 1000, 2000, 3000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => setAmount(String(preset))}
                    className="rounded-full bg-slate-200/80 dark:bg-zinc-700/80 px-3 py-1"
                  >
                    <Text className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
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
                  ဒဏ်ကြေးချမှတ်မည့် ကျောင်းသားများ ({selectedStudentIds.length} ဦး ရွေးထားသည်)
                </Text>
                <TouchableOpacity onPress={handleSelectAll}>
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedStudentIds.length === filteredStudents.length &&
                    filteredStudents.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search students input */}
              <View className="flex-row items-center rounded-2xl bg-slate-100 dark:bg-zinc-800 px-3.5 py-2.5 mb-2.5">
                <Search size={16} color="#9ca3af" />
                <TextInput
                  value={searchStudent}
                  onChangeText={setSearchStudent}
                  placeholder="ကျောင်းသားအမည် ရှာရန်..."
                  placeholderTextColor="#9ca3af"
                  className="ml-2 flex-1 text-xs text-zinc-900 dark:text-zinc-50 p-0"
                />
              </View>

              {/* Student Checklist Container */}
              <View className="rounded-2xl bg-slate-50 dark:bg-zinc-800/60 p-2 max-h-56">
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                  {filteredStudents.length === 0 ? (
                    <Text className="text-center text-xs text-zinc-400 py-6">
                      ကျောင်းသားစာရင်း မရှိသေးပါ (Roster Tab တွင် အရင်ထည့်ပါ)
                    </Text>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => toggleSelectStudent(s.id)}
                          className={`flex-row items-center justify-between p-3 rounded-xl mb-1 ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70'
                              : 'bg-white dark:bg-zinc-800'
                          }`}
                        >
                          <View className="flex-row items-center flex-1 mr-2">
                            <View
                              className={`h-5 w-5 rounded-md items-center justify-center mr-3 ${
                                isSelected
                                  ? 'bg-indigo-600'
                                  : 'border border-slate-300 dark:border-zinc-600'
                              }`}
                            >
                              {isSelected ? <Check size={14} color="#ffffff" /> : null}
                            </View>
                            <Text
                              className={`text-xs font-bold ${
                                isSelected
                                  ? 'text-indigo-950 dark:text-indigo-100'
                                  : 'text-zinc-800 dark:text-zinc-200'
                              }`}
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
            className="p-5 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800"
          >
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {selectedStudentIds.length} students selected • {formatMMK(amountNumber)} each
              </Text>
              <Text className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                = {formatMMK(totalFineMMK)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={selectedStudentIds.length === 0}
              activeOpacity={0.85}
              className={`w-full rounded-full py-3.5 items-center justify-center ${
                selectedStudentIds.length > 0
                  ? 'bg-indigo-600 active:bg-indigo-700 shadow-sm'
                  : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  selectedStudentIds.length > 0
                    ? 'text-white'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}
              >
                ဒဏ်ကြေး မှတ်တမ်းတင်မည် ({selectedStudentIds.length} မှု)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
