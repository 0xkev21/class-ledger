import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Gavel,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BatchFineModal } from '@/src/components/BatchFineModal';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useTreasury } from '@/src/context/TreasuryContext';
import { formatMMK } from '@/src/utils/formatters';

export default function FinesScreen() {
  const {
    fines,
    students,
    subjects,
    toggleFinePaid,
    deleteFine,
    finesSummary,
  } = useTreasury();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Modals & Toasts
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Filtered fines
  const filteredFines = useMemo(() => {
    return fines.filter((fine) => {
      // Status filter
      if (statusFilter === 'paid' && !fine.isPaid) return false;
      if (statusFilter === 'unpaid' && fine.isPaid) return false;

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
      'ဒဏ်ကြေး ဖျက်မည်',
      `"${studentName}" ၏ ဒဏ်ကြေးမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?`,
      [
        { text: 'မဖျက်ပါ', style: 'cancel' },
        {
          text: 'ဖျက်မည်',
          style: 'destructive',
          onPress: async () => {
            await deleteFine(fineId);
            setToastMessage('ဒဏ်ကြေးမှတ်တမ်းကို ဖျက်ပစ်လိုက်ပါပြီ');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, height: '100%', minHeight: 0 }}
      className="flex-1 bg-slate-50 dark:bg-zinc-950"
    >
      <ToastNotification message={toastMessage} onHide={() => setToastMessage(null)} />

      <ScrollView
        style={{ flex: 1, height: '100%' }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
      >
        <View className="w-full max-w-4xl mx-auto">
          {/* Screen Header */}
          <View className="mb-5 pt-2">
            <Text className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-relaxed py-0.5">
              ဘာသာရပ်ဆိုင်ရာ ဒဏ်ကြေးများ
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              နောက်ကျ၊ အိမ်စာမတင်၊ အခန်းတွင်းစည်းကမ်းဖောက်ဖျက်မှု ဒဏ်ကြေးများ
            </Text>
          </View>

          {/* Hero Fine Summary Card */}
          <View className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 shadow-none">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                ဒဏ်ကြေး စာရင်းချုပ် (Fine Summary)
              </Text>
              <View className="h-7 w-7 rounded-full bg-rose-50 dark:bg-rose-950/60 items-center justify-center">
                <Gavel size={14} color="#e11d48" />
              </View>
            </View>

            <View className="flex-row gap-3">
              {/* Collected (Paid) */}
              <View className="flex-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4">
                <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">
                  ကောက်ခံရရှိပြီး (Paid)
                </Text>
                <Text className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight">
                  {formatMMK(finesSummary.totalPaid)}
                </Text>
              </View>

              {/* Pending (Unpaid) */}
              <View className="flex-1 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4">
                <Text className="text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-0.5">
                  ကောက်ခံရန်ကျန် (Unpaid)
                </Text>
                <Text className="text-lg font-extrabold text-rose-700 dark:text-rose-300 tracking-tight">
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
                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setStatusFilter(st)}
                    className={`rounded-full px-4 py-2 ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-white'
                        : 'bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-white dark:text-zinc-900'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {st === 'all'
                        ? `အားလုံး (${fines.length})`
                        : st === 'unpaid'
                        ? `မပေးရသေး (${fines.filter((f) => !f.isPaid).length})`
                        : `ပေးပြီး (${fines.filter((f) => f.isPaid).length})`}
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
                  className={`rounded-full px-3.5 py-1.5 ${
                    selectedSubjectId === 'all'
                      ? 'bg-indigo-600'
                      : 'bg-white dark:bg-zinc-900'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      selectedSubjectId === 'all'
                        ? 'text-white'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    All Subjects
                  </Text>
                </TouchableOpacity>
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => setSelectedSubjectId(sub.id)}
                      className={`rounded-full px-3.5 py-1.5 ${
                        isSelected
                          ? 'bg-indigo-600'
                          : 'bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          isSelected
                            ? 'text-white'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Search Bar */}
            <View className="flex-row items-center rounded-2xl bg-white dark:bg-zinc-900 px-4 py-3">
              <Search size={16} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="ကျောင်းသားအမည် သို့မဟုတ် အကြောင်းပြချက်ဖြင့် ရှာရန်..."
                placeholderTextColor="#9ca3af"
                className="ml-2.5 flex-1 text-xs text-zinc-900 dark:text-zinc-50 p-0"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={15} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Fines Feed */}
          {filteredFines.length === 0 ? (
            <View className="items-center justify-center py-16 px-6 rounded-3xl bg-white dark:bg-zinc-900 mt-2">
              <View className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-950/60 items-center justify-center mb-3">
                <Gavel size={32} color="#e11d48" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                ဒဏ်ကြေး မှတ်တမ်း မရှိသေးပါ
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-5 max-w-xs leading-relaxed">
                နောက်ကျ သို့မဟုတ် အိမ်စာမတင်သည့် ကျောင်းသားများကို + Batch Fine ခလုတ်ဖြင့် အစုလိုက် မှတ်တမ်းတင်ပါ
              </Text>
              <TouchableOpacity
                onPress={() => setShowBatchModal(true)}
                className="flex-row items-center rounded-full bg-indigo-600 px-6 py-3 active:bg-indigo-700 shadow-sm"
              >
                <Plus size={16} color="#ffffff" />
                <Text className="ml-1.5 text-xs font-bold text-white">+ Batch Fine ထည့်မည်</Text>
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
                    className="rounded-3xl bg-white dark:bg-zinc-900 p-4 shadow-none flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-3">
                      {/* Subject badge & date */}
                      <View className="flex-row items-center gap-2 mb-1">
                        <View className="rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5">
                          <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {subject?.name || 'General'}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Calendar size={11} color="#9ca3af" />
                          <Text className="ml-1 text-[10px] text-zinc-400">
                            {fine.date}
                          </Text>
                        </View>
                      </View>

                      {/* Student Name */}
                      <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed py-0.5">
                        {student?.name || 'Unknown Student'}
                        {student?.rollNumber ? (
                          <Text className="text-xs font-normal text-zinc-400">
                            {' '}({student.rollNumber})
                          </Text>
                        ) : null}
                      </Text>

                      {/* Reason */}
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {fine.reason}
                      </Text>
                    </View>

                    <View className="items-end gap-2">
                      {/* Amount */}
                      <Text className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                        {formatMMK(fine.amount)}
                      </Text>

                      {/* 1-Tap Tactile M3 Pill Toggle */}
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => toggleFinePaid(fine.id)}
                          activeOpacity={0.8}
                          className={`flex-row items-center rounded-full px-3.5 py-1.5 ${
                            fine.isPaid
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {fine.isPaid ? (
                            <CheckCircle2 size={14} color="#059669" />
                          ) : (
                            <Clock size={14} color="#e11d48" />
                          )}
                          <Text
                            className={`ml-1.5 text-xs font-bold ${
                              fine.isPaid
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {fine.isPaid ? 'Paid' : 'Unpaid'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteFine(fine.id, student?.name || 'ကျောင်းသား')}
                          className="p-1 rounded-full active:bg-rose-50"
                        >
                          <Trash2 size={15} color="#9ca3af" />
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

      {/* Prominent M3 Extended FAB */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => setShowBatchModal(true)}
          activeOpacity={0.85}
          className="flex-row items-center rounded-full bg-rose-600 px-5 py-4 shadow-lg active:bg-rose-700"
        >
          <Plus size={18} color="#ffffff" />
          <Text className="ml-2 text-sm font-bold text-white">Batch Fine</Text>
        </TouchableOpacity>
      </View>

      {/* Batch Fine Modal */}
      <BatchFineModal
        visible={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSuccess={(count) => {
          setToastMessage(`ကျောင်းသား ${count} ဦး အတွက် ဒဏ်ကြေး ချမှတ်ပြီးပါပြီ!`);
        }}
      />
    </SafeAreaView>
  );
}
