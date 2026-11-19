import {
  CalendarDays,
  HeartHandshake,
  Plus,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { CreateEventModal } from '@/src/components/CreateEventModal';
import { EmptyState } from '@/src/components/EmptyState';
import { EventDetailModal } from '@/src/components/EventDetailModal';
import { FloatingActionButton } from '@/src/components/FloatingActionButton';
import { NativeIcon } from '@/src/components/NativeIcon';
import { SearchBar } from '@/src/components/SearchBar';
import { ToastNotification } from '@/src/components/ToastNotification';
import { PressableScale } from '@/src/components/animated/PressableScale';
import { StaggeredRow } from '@/src/components/animated/StaggeredRow';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { Event, EventType } from '@/src/types';
import { formatMMK } from '@/src/utils/formatters';
import { Haptics } from '@/src/utils/haptics';

export default function EventsScreen() {
  const { events, eventRecords, getEventStats, t } = useTreasury();
  const { isDark, themeColor } = useAppTheme();
  const insets = useSafeAreaInsets();

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

  // Scroll driven header animations
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, 50], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.get(), [0, 50], [0, -10], Extrapolation.CLAMP),
      },
    ],
  }));

  const compactHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [35, 65], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.get(), [35, 65], [-6, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ToastNotification message={toastMessage} onHide={() => setToastMessage(null)} />

      {/* Pinned Compact Header Bar synced with scroll */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            paddingTop: insets.top,
            backgroundColor: isDark ? 'rgba(9, 9, 11, 0.92)' : 'rgba(250, 250, 250, 0.92)',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: isDark ? '#27272a' : '#e4e4e7',
          },
          compactHeaderStyle,
        ]}
        pointerEvents="none"
      >
        <View className="h-12 px-5 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {t.events.title}
          </Text>
          <View
            style={{ backgroundColor: themeColor.surface, borderCurve: 'continuous' }}
            className="rounded-full px-2.5 py-0.5"
          >
            <Text style={{ color: themeColor.text }} className="text-2xs font-bold">
              {t.events.eventsCount(events.length)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Main Content with Native Inset Adjustment & Scrollable Keyboard Dismiss */}
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, height: '100%' }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-4xl mx-auto">
          {/* Screen Header */}
          <Animated.View style={[{ marginBottom: 20, paddingTop: 8 }, largeTitleStyle]}>
            <Text
              selectable
              className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-relaxed py-0.5"
            >
              {t.events.title}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.events.subtitle}
            </Text>
          </Animated.View>

          {/* Hero Overall Collected Card with Themed Background */}
          <View
            style={{
              backgroundColor: themeColor.primary,
              borderCurve: 'continuous',
            }}
            className="rounded-3xl p-6 mb-5 shadow-sm"
          >
            <Text
              style={{ color: 'rgba(255, 255, 255, 0.85)' }}
              className="text-xs font-semibold uppercase tracking-wider mb-2"
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
              {formatMMK(overallTotalCollected)}
            </Text>
            <View className="mt-3 flex-row items-center">
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  borderCurve: 'continuous',
                }}
                className="rounded-full px-3 py-1"
              >
                <Text
                  style={{ color: themeColor.onPrimary }}
                  className="text-xs-tight font-semibold"
                >
                  {t.events.eventsCount(events.length)}
                </Text>
              </View>
            </View>
          </View>

          {/* Filter Chips & Search Bar */}
          <View className="mb-4">
            {/* Horizontal Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
              className="mb-3"
            >
              {[
                { id: 'all', label: t.events.filterAll(events.length) },
                {
                  id: 'donation',
                  label: t.events.filterDonation(events.filter((e) => e.type === 'donation').length),
                },
                {
                  id: 'fixed_fee',
                  label: t.events.filterFixed(events.filter((e) => e.type === 'fixed_fee').length),
                },
              ].map((chip) => {
                const isSelected = typeFilter === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTypeFilter(chip.id as any);
                    }}
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
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search Input */}
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.events.searchEvents}
            />
          </View>

          {/* Events Feed */}
          {filteredEvents.length === 0 ? (
            <EmptyState
              title={t.events.emptyTitle}
              description={t.events.emptyDesc}
              icon={HeartHandshake}
              sfSymbol="sparkles"
              materialName="event"
              actionLabel={t.events.newEvent}
              onActionPress={() => setShowCreateModal(true)}
            />
          ) : (
            <View className="gap-3.5">
              {filteredEvents.map((ev, index) => {
                const stats = getEventStats(ev.id);
                return (
                  <StaggeredRow key={ev.id} index={index}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedEvent(ev);
                      }}
                      activeOpacity={0.85}
                      style={{ borderCurve: 'continuous' }}
                      className="rounded-3xl bg-white dark:bg-zinc-900 p-5 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none"
                    >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-2 mb-1.5">
                          <View
                            style={{
                              backgroundColor:
                                ev.type === 'donation'
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
                                  ev.type === 'donation'
                                    ? isDark
                                      ? '#fecdd3'
                                      : '#e11d48'
                                    : themeColor.text,
                              }}
                              className="text-2xs font-bold"
                            >
                              {ev.type === 'donation' ? t.events.donation : t.events.fixedFee}
                            </Text>
                          </View>

                          {ev.dueDate ? (
                            <View
                              style={{
                                backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                                borderCurve: 'continuous',
                              }}
                              className="flex-row items-center rounded-full px-2.5 py-0.5"
                            >
                              <NativeIcon
                                sfSymbol="calendar"
                                materialName="calendar-today"
                                FallbackIcon={CalendarDays}
                                size={11}
                                color={isDark ? '#a1a1aa' : '#71717a'}
                              />
                              <Text
                                style={{ color: isDark ? '#d4d4d8' : '#52525b' }}
                                className="ml-1 text-2xs font-medium"
                              >
                                {ev.dueDate}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text
                          selectable
                          className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 leading-relaxed py-0.5"
                        >
                          {ev.name}
                        </Text>
                      </View>
                    </View>

                    {/* MMK Amount */}
                    <View className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex-row items-end justify-between">
                      <View>
                        <Text
                          style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                          className="text-xs-tight font-medium"
                        >
                          {ev.type === 'donation' ? t.events.collected : t.events.amountPaidTotal}
                        </Text>
                        <Text
                          selectable
                          style={{ fontVariant: ['tabular-nums'] }}
                          className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight"
                        >
                          {formatMMK(stats.totalCollected)}
                        </Text>
                      </View>

                      <View className="items-end">
                        {ev.type === 'donation' ? (
                          <Text
                            style={{ color: isDark ? themeColor.primaryLight : themeColor.primary }}
                            className="text-xs font-semibold"
                          >
                            {t.events.donorsCount(stats.totalDonors)}
                          </Text>
                        ) : (
                          <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {t.events.paidCount(stats.totalPaidCount)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </StaggeredRow>
              );
            })}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Prominent Floating Action Button with Safe Inset Positioning */}
      <FloatingActionButton
        onPress={() => setShowCreateModal(true)}
        label={t.events.newEvent}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={(id) => {
          setToastMessage(t.events.eventCreatedToast);
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
    </View>
  );
}
