import {
  CalendarDays,
  HeartHandshake,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateEventModal } from '@/src/components/CreateEventModal';
import { EventDetailModal } from '@/src/components/EventDetailModal';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useTreasury } from '@/src/context/TreasuryContext';
import { Event, EventType } from '@/src/types';
import { formatMMK } from '@/src/utils/formatters';

export default function EventsScreen() {
  const { events, eventRecords, getEventStats } = useTreasury();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Overall Total Collected across all events
  const overallTotalCollected = useMemo(() => {
    return eventRecords
      .filter((r) => r.isPaid)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [eventRecords]);

  // Filtered Events Feed
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (typeFilter !== 'all' && ev.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return ev.name.toLowerCase().includes(q) || ev.extraNote?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [events, typeFilter, searchQuery]);

  return (
    <SafeAreaView
      style={{ flex: 1, height: '100%', minHeight: 0 }}
      className="flex-1 bg-slate-50 dark:bg-zinc-950"
    >
      <ToastNotification message={toastMessage} onHide={() => setToastMessage(null)} />

      {/* Main Content */}
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
              အခမ်းအနား & အလှူငွေများ
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              ဆရာကန်တော့ပွဲ၊ ကထိန်၊ ကြိုဆိုပွဲနှင့် အခန်းရန်ပုံငွေ ကောက်ခံမှုများ
            </Text>
          </View>

          {/* Hero Overall Collected Card */}
          <View className="rounded-3xl bg-indigo-600 p-6 mb-5 shadow-sm">
            <Text className="text-xs font-semibold uppercase tracking-wider text-indigo-100 mb-2">
              စုစုပေါင်း ကောက်ခံရရှိငွေ (All Events)
            </Text>
            <Text className="text-3xl font-extrabold text-white tracking-tight">
              {formatMMK(overallTotalCollected)}
            </Text>
            <View className="mt-3 flex-row items-center">
              <View className="rounded-full bg-indigo-700/80 px-3 py-1">
                <Text className="text-[11px] font-semibold text-indigo-100">
                  {events.length} အခမ်းအနား စာရင်းသွင်းထားသည်
                </Text>
              </View>
            </View>
          </View>

          {/* Filter Chips & Search Bar */}
          <View className="mb-4">
            {/* Horizontal Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-3">
              {[
                { id: 'all', label: `အားလုံး (${events.length})` },
                {
                  id: 'donation',
                  label: `စေတနာအလှူ (${events.filter((e) => e.type === 'donation').length})`,
                },
                {
                  id: 'fixed_fee',
                  label: `သတ်မှတ်ကြေး (${events.filter((e) => e.type === 'fixed_fee').length})`,
                },
              ].map((chip) => {
                const isSelected = typeFilter === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    onPress={() => setTypeFilter(chip.id as any)}
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
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search Input */}
            <View className="flex-row items-center rounded-2xl bg-white dark:bg-zinc-900 px-4 py-3">
              <Search size={16} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="အခမ်းအနား အမည်ဖြင့် ရှာရန်..."
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

          {/* Events Feed */}
          {filteredEvents.length === 0 ? (
            <View className="items-center justify-center py-16 px-6 rounded-3xl bg-white dark:bg-zinc-900 mt-2">
              <View className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-3">
                <HeartHandshake size={32} color="#4f46e5" />
              </View>
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                အခမ်းအနား မှတ်တမ်း မရှိသေးပါ
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-5 max-w-xs leading-relaxed">
                ဆရာကန်တော့ပွဲ၊ ကထိန် သို့မဟုတ် အတန်းရန်ပုံငွေအတွက် အသစ်စတင်ရန် အောက်ပါခလုတ်ကို နှိပ်ပါ
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                className="flex-row items-center rounded-full bg-indigo-600 px-6 py-3 active:bg-indigo-700 shadow-sm"
              >
                <Plus size={16} color="#ffffff" />
                <Text className="ml-1.5 text-xs font-bold text-white">အခမ်းအနား အသစ်ဖန်တီးမည်</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3.5">
              {filteredEvents.map((ev) => {
                const stats = getEventStats(ev.id);
                return (
                  <TouchableOpacity
                    key={ev.id}
                    onPress={() => setSelectedEvent(ev)}
                    activeOpacity={0.85}
                    className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-none"
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-2 mb-1.5">
                          <View
                            className={`rounded-full px-2.5 py-0.5 ${
                              ev.type === 'donation'
                                ? 'bg-rose-50 dark:bg-rose-950/60'
                                : 'bg-indigo-50 dark:bg-indigo-950/60'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                ev.type === 'donation'
                                  ? 'text-rose-600 dark:text-rose-300'
                                  : 'text-indigo-600 dark:text-indigo-300'
                              }`}
                            >
                              {ev.type === 'donation' ? 'စေတနာအလှူ' : 'သတ်မှတ်ကြေး'}
                            </Text>
                          </View>

                          {ev.dueDate ? (
                            <View className="flex-row items-center rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5">
                              <CalendarDays size={11} color="#71717a" />
                              <Text className="ml-1 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                {ev.dueDate}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 leading-relaxed py-0.5">
                          {ev.name}
                        </Text>
                      </View>
                    </View>

                    {/* MMK Amount */}
                    <View className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex-row items-end justify-between">
                      <View>
                        <Text className="text-[11px] font-medium text-zinc-400">
                          {ev.type === 'donation' ? 'ကောက်ခံရရှိငွေ' : 'ပေးသွင်းပြီး စုစုပေါင်း'}
                        </Text>
                        <Text className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                          {formatMMK(stats.totalCollected)}
                        </Text>
                      </View>

                      <View className="items-end">
                        {ev.type === 'donation' ? (
                          <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {stats.totalDonors} ဦး လှူဒါန်းပြီး
                          </Text>
                        ) : (
                          <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {stats.totalPaidCount} ဦး ပေးချေပြီး
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Prominent M3 Extended FAB */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.85}
          className="flex-row items-center rounded-full bg-indigo-600 px-5 py-4 shadow-lg active:bg-indigo-700"
        >
          <Plus size={18} color="#ffffff" />
          <Text className="ml-2 text-sm font-bold text-white">New Event</Text>
        </TouchableOpacity>
      </View>

      {/* Create Event Modal */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={(id) => {
          setToastMessage('အခမ်းအနား အသစ်ကို အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!');
          const created = events.find((e) => e.id === id);
          if (created) setSelectedEvent(created);
        }}
      />

      {/* Event Detail Modal */}
      {selectedEvent ? (
        <EventDetailModal
          event={selectedEvent}
          visible={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          onShowToast={(msg) => setToastMessage(msg)}
        />
      ) : null}
    </SafeAreaView>
  );
}
