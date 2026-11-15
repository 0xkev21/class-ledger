import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  HeartHandshake,
  Plus,
  Search,
  Share2,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { Event } from '../types';
import {
  copyReportToClipboard,
  generateClosingEventAnnouncement,
  generateInitialEventAnnouncement,
} from '../utils/exporter';
import { formatDate, formatMMK } from '../utils/formatters';

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
  } = useTreasury();

  // Mode: 'details' view or in-sheet 'add_donor' view (eliminates nested modal)
  const [viewMode, setViewMode] = useState<'details' | 'add_donor'>('details');

  // Filter chips for fixed fee: All, Paid, Unpaid
  const [fixedFilter, setFixedFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Donor form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [donorAmount, setDonorAmount] = useState('5000');
  const [donorSearch, setDonorSearch] = useState('');

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

  // Burmese Announcement Copy Actions
  const handleCopyInitialAnnouncement = async () => {
    if (!event) return;
    const text = generateInitialEventAnnouncement(event, settings);
    const success = await copyReportToClipboard(text);
    if (success) {
      onShowToast('အစောပိုင်း ကြေညာချက် စာသား ကူးယူပြီးပါပြီ!');
    }
  };

  const handleCopyClosingAnnouncement = async () => {
    if (!event) return;
    const text = generateClosingEventAnnouncement(event, stats.totalCollected);
    const success = await copyReportToClipboard(text);
    if (success) {
      onShowToast('စာရင်းပိတ် / နောက်ဆုံးရက် ကြေညာချက် ကူးယူပြီးပါပြီ!');
    }
  };

  const handleDeleteEvent = () => {
    if (!event) return;
    Alert.alert(
      'အခမ်းအနား ဖျက်မည်',
      `"${event.name}" နှင့် သက်ဆိုင်သော မှတ်တမ်းအားလုံးကို ဖျက်ပစ်ရန် သေချာပါသလား?`,
      [
        { text: 'မဖျက်တော့ပါ', style: 'cancel' },
        {
          text: 'ဖျက်မည်',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(event.id);
            onClose();
            onShowToast('အခမ်းအနားကို ဖျက်ပစ်လိုက်ပါပြီ');
          },
        },
      ]
    );
  };

  // Add donor submit
  const handleAddDonorSubmit = async () => {
    if (!event || !selectedStudentId) {
      return;
    }
    const amt = parseInt(donorAmount, 10);
    if (isNaN(amt) || amt <= 0) return;

    await recordDonation(event.id, selectedStudentId, amt);
    setSelectedStudentId('');
    setDonorAmount('5000');
    setDonorSearch('');
    setViewMode('details');
    onShowToast('အလှူရှင် မှတ်တမ်းထည့်သွင်းပြီးပါပြီ!');
  };

  // Safe early exit AFTER all hooks are evaluated
  if (!visible || !event) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end md:justify-center items-center bg-black/40">
        <Pressable className="absolute inset-0" onPress={handleClose} />

        <View
          style={{
            maxHeight: windowHeight * 0.92,
            height: Platform.OS === 'web' ? 'auto' : Math.min(windowHeight * 0.88, 720),
            paddingBottom: Math.max(insets.bottom, 16),
          }}
          className="w-full md:max-w-2xl bg-slate-50 dark:bg-zinc-950 rounded-t-[32px] md:rounded-[28px] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Top Drag Handle Indicator (mobile only) */}
          <View className="items-center pt-3 pb-1 bg-white dark:bg-zinc-900 md:hidden">
            <View className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-zinc-700" />
          </View>

          {/* Header */}
          {viewMode === 'add_donor' ? (
            <View className="px-6 py-4 bg-white dark:bg-zinc-900 flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800">
              <View className="flex-row items-center flex-1 mr-3">
                <TouchableOpacity
                  onPress={() => setViewMode('details')}
                  accessibilityLabel="Go back to event details"
                  className="h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center mr-3 active:bg-slate-200 dark:active:bg-zinc-700"
                >
                  <ArrowLeft size={18} color="#71717a" />
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    အလှူရှင် စာရင်းသွင်းရန်
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400" numberOfLines={1}>
                    {event.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityLabel="Close"
                className="h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center"
              >
                <X size={18} color="#71717a" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="px-6 py-4 bg-white dark:bg-zinc-900 flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <View
                    className={`rounded-full px-2.5 py-0.5 ${
                      event.type === 'donation'
                        ? 'bg-rose-50 dark:bg-rose-950/60'
                        : 'bg-indigo-50 dark:bg-indigo-950/60'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        event.type === 'donation'
                          ? 'text-rose-600 dark:text-rose-300'
                          : 'text-indigo-600 dark:text-indigo-300'
                      }`}
                    >
                      {event.type === 'donation' ? 'စေတနာအလှူ (Donation)' : 'သတ်မှတ်ကြေး (Fixed Fee)'}
                    </Text>
                  </View>
                  {event.dueDate ? (
                    <View className="flex-row items-center rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5">
                      <CalendarDays size={12} color="#71717a" />
                      <Text className="ml-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        {event.dueDate}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-relaxed py-0.5">
                  {event.name}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={handleDeleteEvent}
                  accessibilityLabel="Delete event"
                  className="h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center active:bg-rose-100"
                >
                  <Trash2 size={16} color="#e11d48" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClose}
                  accessibilityLabel="Close"
                  className="h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center"
                >
                  <X size={18} color="#71717a" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {viewMode === 'add_donor' ? (
            /* In-Sheet Add Donor Form (No nested modal!) */
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {/* Step 1: Select Student */}
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                ၁။ လှူဒါန်းသူ ကျောင်းသား ရွေးချယ်ပါ
              </Text>

              <View className="flex-row items-center rounded-2xl bg-white dark:bg-zinc-900 px-3.5 py-2.5 mb-2.5 border border-slate-200 dark:border-zinc-800">
                <Search size={16} color="#9ca3af" />
                <TextInput
                  value={donorSearch}
                  onChangeText={setDonorSearch}
                  placeholder="ကျောင်းသားအမည် ရိုက်ထည့်ရှာပါ..."
                  placeholderTextColor="#9ca3af"
                  className="ml-2 flex-1 text-xs text-zinc-900 dark:text-zinc-50 p-0"
                />
                {donorSearch ? (
                  <TouchableOpacity onPress={() => setDonorSearch('')}>
                    <X size={14} color="#9ca3af" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Students list picker */}
              <View className="mb-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 max-h-56 overflow-hidden">
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
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
                          className={`flex-row items-center justify-between px-3.5 py-3 rounded-xl mb-1 ${
                            isSelected
                              ? 'bg-indigo-600'
                              : 'bg-slate-50 dark:bg-zinc-800/60 active:bg-slate-100 dark:active:bg-zinc-800'
                          }`}
                        >
                          <View className="flex-row items-center">
                            <User size={14} color={isSelected ? '#ffffff' : '#71717a'} />
                            <Text
                              className={`ml-2 text-xs font-bold ${
                                isSelected ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {s.name}
                            </Text>
                          </View>
                          {s.rollNumber ? (
                            <Text
                              className={`text-[11px] ${
                                isSelected ? 'text-indigo-200' : 'text-zinc-400'
                              }`}
                            >
                              {s.rollNumber}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  {students.length === 0 ? (
                    <Text className="text-center text-xs text-zinc-400 py-6">
                      ကျောင်းသားစာရင်း မရှိသေးပါ
                    </Text>
                  ) : null}
                </ScrollView>
              </View>

              {/* Step 2: Amount Input */}
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                ၂။ လှူဒါန်းငွေ ပမာဏ (MMK)
              </Text>
              <TextInput
                value={donorAmount}
                onChangeText={setDonorAmount}
                placeholder="e.g. 5000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                className="w-full rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-4 py-3.5 text-base font-bold text-zinc-900 dark:text-zinc-50 mb-3"
              />

              {/* Quick amount chips */}
              <View className="flex-row gap-2 mb-6">
                {[1000, 3000, 5000, 10000].map((chip) => {
                  const isSelectedChip = donorAmount === String(chip);
                  return (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => setDonorAmount(String(chip))}
                      className={`flex-1 items-center justify-center py-2.5 rounded-xl border ${
                        isSelectedChip
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelectedChip ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'
                        }`}
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
                className={`w-full rounded-full py-4 items-center justify-center ${
                  selectedStudentId
                    ? 'bg-indigo-600 active:bg-indigo-700 shadow-sm'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    selectedStudentId ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  အလှူငွေ ထည့်သွင်းမည်
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Hero MMK Banner */}
              <View className="rounded-3xl bg-indigo-600 p-5 mb-5 shadow-sm">
                <Text className="text-xs font-semibold text-indigo-100 uppercase tracking-wider mb-1">
                  ရရှိပြီး စုစုပေါင်း အလှူငွေ / ကောက်ခံငွေ
                </Text>
                <Text className="text-3xl font-extrabold text-white tracking-tight">
                  {formatMMK(stats.totalCollected)}
                </Text>

                {event.type === 'fixed_fee' ? (
                  <View className="mt-3 pt-3 border-t border-indigo-500/60 flex-row justify-between items-center">
                    <Text className="text-xs text-indigo-100">
                      ပေးချေပြီး ကျောင်းသား: <Text className="font-bold text-white">{stats.totalPaidCount} / {students.length} ဦး</Text>
                    </Text>
                    <Text className="text-xs text-indigo-100">
                      ကျန်: <Text className="font-bold text-amber-200">{stats.totalUnpaidCount} ဦး</Text>
                    </Text>
                  </View>
                ) : (
                  <View className="mt-2 flex-row items-center">
                    <Text className="text-xs text-indigo-100">
                      ပါဝင်လှူဒါန်းသူ အလှူရှင် စုစုပေါင်း: <Text className="font-bold text-white">{stats.totalDonors} ဦး</Text>
                    </Text>
                  </View>
                )}
              </View>

              {/* 1-Tap Burmese Announcement Action Chips */}
              <View className="mb-5">
                <View className="flex-row items-center mb-2.5 ml-1">
                  <Share2 size={13} color="#6366f1" />
                  <Text className="ml-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Viber / Telegram သို့ စာရင်းထုတ်ပြန်ရန်
                  </Text>
                </View>
                <View className="flex-row gap-2.5">
                  <TouchableOpacity
                    onPress={handleCopyInitialAnnouncement}
                    className="flex-1 flex-row items-center justify-center rounded-full bg-white dark:bg-zinc-900 py-3 px-3 shadow-none active:bg-indigo-50 dark:active:bg-zinc-800"
                  >
                    <Copy size={14} color="#4f46e5" />
                    <Text className="ml-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      အစောပိုင်း ကြေညာချက်
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCopyClosingAnnouncement}
                    className="flex-1 flex-row items-center justify-center rounded-full bg-white dark:bg-zinc-900 py-3 px-3 shadow-none active:bg-indigo-50 dark:active:bg-zinc-800"
                  >
                    <Copy size={14} color="#059669" />
                    <Text className="ml-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      စာရင်းပိတ် ကြေညာချက်
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* List Section Header & Search */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                    {event.type === 'donation' ? 'အလှူရှင်များ စာရင်း' : 'အတန်းသားများ ပေးချေမှု အခြေအနေ'}
                  </Text>

                  {event.type === 'donation' ? (
                    <TouchableOpacity
                      onPress={() => setViewMode('add_donor')}
                      className="flex-row items-center rounded-full bg-indigo-600 px-3.5 py-1.5 shadow-sm active:bg-indigo-700"
                    >
                      <Plus size={14} color="#ffffff" />
                      <Text className="ml-1 text-xs font-bold text-white">Add Donor</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Fixed Fee Filter Chips */}
                {event.type === 'fixed_fee' ? (
                  <View className="flex-row gap-2 mb-3">
                    {(['all', 'unpaid', 'paid'] as const).map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => setFixedFilter(mode)}
                        className={`rounded-full px-3.5 py-1.5 ${
                          fixedFilter === mode
                            ? 'bg-zinc-900 dark:bg-white'
                            : 'bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            fixedFilter === mode
                              ? 'text-white dark:text-zinc-900'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {mode === 'all'
                            ? `အားလုံး (${students.length})`
                            : mode === 'unpaid'
                            ? `မပေးရသေး (${stats.totalUnpaidCount})`
                            : `ပေးချေပြီး (${stats.totalPaidCount})`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Search input */}
                <View className="flex-row items-center rounded-2xl bg-white dark:bg-zinc-900 px-3.5 py-2.5 mb-3">
                  <Search size={16} color="#9ca3af" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="ကျောင်းသားအမည် ရှာရန်..."
                    placeholderTextColor="#9ca3af"
                    className="ml-2 flex-1 text-xs text-zinc-900 dark:text-zinc-50 p-0"
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X size={14} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* List Body */}
              {event.type === 'donation' ? (
                filteredDonors.length === 0 ? (
                  <View className="items-center justify-center py-12 rounded-3xl bg-white dark:bg-zinc-900 mb-8 p-6">
                    <View className="h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-950/60 items-center justify-center mb-3">
                      <HeartHandshake size={28} color="#e11d48" />
                    </View>
                    <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                      အလှူရှင် မှတ်တမ်း မရှိသေးပါ
                    </Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-4">
                      အလှူငွေထည့်သွင်းသူများကို Add Donor ခလုတ်ဖြင့် စာရင်းသွင်းနိုင်ပါသည်
                    </Text>
                    <TouchableOpacity
                      onPress={() => setViewMode('add_donor')}
                      className="rounded-full bg-indigo-600 px-5 py-2.5 active:bg-indigo-700"
                    >
                      <Text className="text-xs font-bold text-white">အလှူရှင် ထည့်မည်</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="gap-2.5 mb-8">
                    {filteredDonors.map((record, index) => {
                      const student = studentMap.get(record.studentId);
                      return (
                        <View
                          key={record.id}
                          className="rounded-2xl bg-white dark:bg-zinc-900 p-4 flex-row items-center justify-between"
                        >
                          <View className="flex-row items-center flex-1 mr-2">
                            <View className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mr-3">
                              <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {index + 1}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                                {student?.name || 'ကျောင်းသား'}
                              </Text>
                              {student?.rollNumber ? (
                                <Text className="text-[11px] text-zinc-400">
                                  Roll: {student.rollNumber}
                                </Text>
                              ) : null}
                            </View>
                          </View>

                          <View className="flex-row items-center gap-3">
                            <Text className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatMMK(record.amount)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => deleteEventRecord(record.id)}
                              className="p-1 rounded-full active:bg-rose-50"
                            >
                              <Trash2 size={15} color="#9ca3af" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )
              ) : fixedStudentsList.length === 0 ? (
                <View className="items-center justify-center py-12 rounded-3xl bg-white dark:bg-zinc-900 mb-8 p-6">
                  <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    ကျောင်းသား မတွေ့ပါ
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5 mb-8">
                  {fixedStudentsList.map((item) => (
                    <View
                      key={item.student.id}
                      className="rounded-2xl bg-white dark:bg-zinc-900 p-4 flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {item.student.name}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-0.5">
                          {item.student.rollNumber ? (
                            <Text className="text-[11px] text-zinc-400">
                              Roll: {item.student.rollNumber}
                            </Text>
                          ) : null}
                          <Text className="text-[11px] font-semibold text-zinc-500">
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
                        className={`flex-row items-center rounded-full px-3.5 py-1.5 ${
                          item.isPaid
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {item.isPaid ? (
                          <CheckCircle2 size={14} color="#059669" />
                        ) : (
                          <Clock size={14} color="#e11d48" />
                        )}
                        <Text
                          className={`ml-1.5 text-xs font-bold ${
                            item.isPaid
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {item.isPaid ? 'Paid' : 'Unpaid'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
