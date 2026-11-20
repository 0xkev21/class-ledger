import { HeartHandshake, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateEventModal } from '@/src/components/CreateEventModal';
import { EmptyState } from '@/src/components/EmptyState';
import { EventDetailContent } from '@/src/components/EventDetailContent';
import { EventDetailModal } from '@/src/components/EventDetailModal';
import { FloatingActionButton } from '@/src/components/FloatingActionButton';
import { NativeIcon } from '@/src/components/NativeIcon';
import { SearchBar } from '@/src/components/SearchBar';
import { StatusPill } from '@/src/components/StatusPill';
import { ToastNotification } from '@/src/components/ToastNotification';
import { StaggeredRow } from '@/src/components/animated/StaggeredRow';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { Event, EventType } from '@/src/types';
import { formatMMK } from '@/src/utils/formatters';
import { Haptics } from '@/src/utils/haptics';

export default function EventsScreen() {
  const { events, eventRecords, students, getEventStats, language, t } =
    useTreasury();
  const { themeColor, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Mount guard on web keeps static SSR and client hydration identical
  const [hasMounted, setHasMounted] = useState(!isWeb);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const isDesktop = hasMounted && width >= 1024;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const overallTotalCollected = useMemo(() => {
    return eventRecords
      .filter((r) => r.isPaid)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [eventRecords]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (typeFilter !== 'all' && ev.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          ev.name.toLowerCase().includes(q) ||
          ev.extraNote?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, typeFilter, searchQuery]);

  const activeDesktopEvent = useMemo(() => {
    return (
      events.find((e) => e.id === selectedEventId) ??
      filteredEvents[0] ??
      events[0] ??
      null
    );
  }, [events, filteredEvents, selectedEventId]);

  const activeModalEvent = useMemo(() => {
    if (isDesktop || !selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) ?? null;
  }, [isDesktop, events, selectedEventId]);

  const filterChips = useMemo(
    () => [
      { id: 'all' as const, label: t.events.filterAll(events.length) },
      {
        id: 'donation' as const,
        label: t.events.filterDonation(
          events.filter((e) => e.type === 'donation').length
        ),
      },
      {
        id: 'fixed_fee' as const,
        label: t.events.filterFixed(
          events.filter((e) => e.type === 'fixed_fee').length
        ),
      },
    ],
    [events, t]
  );

  // Scroll-driven compact mobile header animation
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, 50], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.get(),
          [0, 50],
          [0, -10],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const compactHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [35, 65], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.get(),
          [35, 65],
          [-6, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const renderFilterRow = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScrollContent}
    >
      {filterChips.map((chip) => {
        const isSelected = typeFilter === chip.id;
        return (
          <TouchableOpacity
            key={chip.id}
            onPress={() => {
              Haptics.selectionAsync();
              setTypeFilter(chip.id);
            }}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.filterChip,
              {
                backgroundColor: isSelected ? palette.ink : palette.surface,
                borderColor: isSelected ? palette.ink : palette.line,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: isSelected ? palette.bg : palette.ink,
                  fontFamily: fonts.medium,
                },
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderEventCard = (ev: Event, compact: boolean) => {
    const stats = getEventStats(ev.id);
    const isSelectedCard = Boolean(
      isDesktop && activeDesktopEvent?.id === ev.id
    );
    const showProgress = ev.type === 'fixed_fee' && students.length > 0;
    const progressPct = showProgress
      ? Math.min(100, Math.round((stats.totalPaidCount / students.length) * 100))
      : 0;

    const metaLine =
      ev.type === 'fixed_fee'
        ? `${formatMMK(ev.fixedAmount || 0)} · ${t.events.perStudent}${
            ev.dueDate ? ` · ${ev.dueDate}` : ''
          }`
        : ev.dueDate
        ? `${t.events.dueDate}: ${ev.dueDate}`
        : ev.extraNote || t.events.donation;

    const countLabel =
      ev.type === 'donation'
        ? t.events.donorsCount(stats.totalDonors)
        : students.length > 0 && language === 'en'
        ? `${stats.totalPaidCount} / ${students.length} ${t.common.paid.toLowerCase()}`
        : t.events.paidCount(stats.totalPaidCount);

    return (
      <TouchableOpacity
        key={ev.id}
        onPress={() => {
          Haptics.selectionAsync();
          setSelectedEventId(ev.id);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelectedCard }}
        style={[
          styles.eventCard,
          {
            backgroundColor: palette.card,
            borderRadius: compact ? 12 : 16,
            padding: compact ? 14 : 18,
            borderColor: isSelectedCard ? themeColor.primary : palette.line,
            borderLeftWidth: isSelectedCard ? 3 : 1,
            borderLeftColor: isSelectedCard ? themeColor.primary : palette.line,
          },
        ]}
      >
        <View style={styles.cardTopRow}>
          <Text
            numberOfLines={compact ? 1 : 2}
            style={[
              styles.cardTitle,
              {
                color: palette.ink,
                fontFamily: fonts.semibold,
                fontSize: compact ? 14 : 16,
                lineHeight: compact ? 20 : 23,
              },
            ]}
          >
            {ev.name}
          </Text>
          <StatusPill
            variant={ev.type === 'donation' ? 'paid' : 'brand'}
            label={ev.type === 'donation' ? t.events.donation : t.events.fixedFee}
          />
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.cardMeta,
            { color: palette.muted, fontFamily: fonts.regular },
          ]}
        >
          {metaLine}
        </Text>

        <View
          style={[
            styles.cardFooter,
            {
              borderTopWidth: compact ? 0 : 1,
              borderTopColor: palette.line,
              paddingTop: compact ? 6 : 10,
              marginTop: compact ? 4 : 10,
            },
          ]}
        >
          <Text
            selectable
            style={[
              styles.cardAmount,
              {
                color: palette.ink,
                fontFamily: fonts.monoMedium,
                fontSize: compact ? 14 : 18,
              },
            ]}
          >
            {formatMMK(stats.totalCollected)}
          </Text>
          <Text
            style={[
              styles.cardCount,
              { color: palette.muted, fontFamily: fonts.mono },
            ]}
          >
            {countLabel}
          </Text>
        </View>

        {showProgress ? (
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: palette.surface },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: themeColor.primary,
                  width: `${progressPct}%` as any,
                },
              ]}
            />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: palette.bg }]}>
      <ToastNotification
        message={toastMessage}
        onHide={() => setToastMessage(null)}
      />

      {isDesktop ? (
        <View style={styles.desktopOuter}>
          <View
            style={[
              styles.splitFrame,
              {
                backgroundColor: palette.card,
                borderColor: palette.line,
              },
            ]}
          >
            {/* Left Sidebar */}
            <View
              style={[
                styles.leftSidebar,
                {
                  backgroundColor: palette.surface,
                  borderRightColor: palette.line,
                },
              ]}
            >
              {/* Total Collected Card (.cl-totalcard) */}
              <View
                style={[
                  styles.desktopTotalCard,
                  { backgroundColor: themeColor.primaryDark },
                ]}
              >
                <Text
                  style={[
                    styles.totalEyebrow,
                    { color: themeColor.onPrimary, fontFamily: fonts.medium },
                  ]}
                >
                  {t.events.totalCollected}
                </Text>
                <Text
                  selectable
                  style={[
                    styles.desktopTotalFigure,
                    {
                      color: themeColor.onPrimary,
                      fontFamily: fonts.semibold,
                    },
                  ]}
                >
                  {formatMMK(overallTotalCollected)}
                </Text>

                <View style={styles.totalCardBottom}>
                  <View style={styles.totalCountBadge}>
                    <Text
                      style={[
                        styles.totalCountText,
                        {
                          color: themeColor.onPrimary,
                          fontFamily: fonts.mono,
                        },
                      ]}
                    >
                      {t.events.eventsCount(events.length)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowCreateModal(true);
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t.events.newEvent}
                    style={styles.totalNewBtn}
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
                        styles.totalNewBtnText,
                        {
                          color: themeColor.onPrimary,
                          fontFamily: fonts.semibold,
                        },
                      ]}
                    >
                      {t.events.newEvent}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter Chips & Search */}
              <View style={styles.sidebarControls}>
                {renderFilterRow()}
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t.events.searchEvents}
                />
              </View>

              {/* Sidebar Events List */}
              <ScrollView
                style={styles.sidebarListScroll}
                contentContainerStyle={styles.sidebarListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {filteredEvents.length === 0 ? (
                  <View
                    style={[
                      styles.sidebarEmptyBox,
                      {
                        backgroundColor: palette.card,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sidebarEmptyText,
                        { color: palette.muted, fontFamily: fonts.regular },
                      ]}
                    >
                      {t.events.emptyTitle}
                    </Text>
                  </View>
                ) : (
                  filteredEvents.map((ev) => renderEventCard(ev, true))
                )}
              </ScrollView>
            </View>

            {/* Right Detail Pane */}
            <View
              style={[styles.rightPane, { backgroundColor: palette.bg }]}
            >
              {activeDesktopEvent ? (
                <EventDetailContent
                  event={activeDesktopEvent}
                  mode="pane"
                  onDeleted={() => setSelectedEventId(null)}
                  onShowToast={(msg) => setToastMessage(msg)}
                />
              ) : (
                <View style={styles.rightEmptyCenter}>
                  <EmptyState
                    title={t.events.emptyTitle}
                    description={t.events.emptyDesc}
                    icon={HeartHandshake}
                    sfSymbol="sparkles"
                    materialName="event"
                    actionLabel={t.events.newEvent}
                    onActionPress={() => setShowCreateModal(true)}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      ) : (
        <>
          {/* Pinned Compact Header Bar synced with scroll */}
          <Animated.View
            style={[
              styles.compactHeader,
              {
                paddingTop: insets.top,
                backgroundColor: palette.headerBg,
                borderBottomColor: palette.line,
              },
              compactHeaderStyle,
            ]}
            pointerEvents="none"
          >
            <View style={styles.compactHeaderInner}>
              <Text
                style={[
                  styles.compactTitle,
                  { color: palette.ink, fontFamily: fonts.semibold },
                ]}
              >
                {t.events.title}
              </Text>
              <StatusPill
                variant="brand"
                label={t.events.eventsCount(events.length)}
              />
            </View>
          </Animated.View>

          <Animated.ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            style={styles.mobileScroll}
            contentContainerStyle={[
              styles.mobileScrollContent,
              { paddingTop: insets.top + 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mobileContainer}>
              {/* Screen Header */}
              <Animated.View style={[styles.mobileTitleWrap, largeTitleStyle]}>
                <Text
                  selectable
                  style={[
                    styles.mobileTitle,
                    { color: palette.ink, fontFamily: fonts.bold },
                  ]}
                >
                  {t.events.title}
                </Text>
                <Text
                  style={[
                    styles.mobileSubtitle,
                    { color: palette.muted, fontFamily: fonts.regular },
                  ]}
                >
                  {t.events.subtitle}
                </Text>
              </Animated.View>

              {/* Mobile Total Collected Card */}
              <View
                style={[
                  styles.mobileTotalCard,
                  { backgroundColor: themeColor.primaryDark },
                ]}
              >
                <Text
                  style={[
                    styles.totalEyebrow,
                    { color: themeColor.onPrimary, fontFamily: fonts.medium },
                  ]}
                >
                  {t.events.totalCollected}
                </Text>
                <Text
                  selectable
                  style={[
                    styles.mobileTotalFigure,
                    {
                      color: themeColor.onPrimary,
                      fontFamily: fonts.bold,
                    },
                  ]}
                >
                  {formatMMK(overallTotalCollected)}
                </Text>
                <View style={styles.mobileCountWrap}>
                  <View style={styles.totalCountBadge}>
                    <Text
                      style={[
                        styles.totalCountText,
                        {
                          color: themeColor.onPrimary,
                          fontFamily: fonts.mono,
                        },
                      ]}
                    >
                      {t.events.eventsCount(events.length)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Filter Chips & Search Bar */}
              <View style={styles.mobileControls}>
                {renderFilterRow()}
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t.events.searchEvents}
                />
              </View>

              {/* Mobile Events Feed */}
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
                <View style={styles.mobileFeedList}>
                  {filteredEvents.map((ev, index) => (
                    <StaggeredRow key={ev.id} index={index}>
                      {renderEventCard(ev, false)}
                    </StaggeredRow>
                  ))}
                </View>
              )}
            </View>
          </Animated.ScrollView>

          <FloatingActionButton
            onPress={() => setShowCreateModal(true)}
            label={t.events.newEvent}
          />
        </>
      )}

      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={(id) => {
          setToastMessage(t.events.eventCreatedToast);
          setSelectedEventId(id);
        }}
      />

      <EventDetailModal
        event={activeModalEvent}
        visible={Boolean(activeModalEvent)}
        onClose={() => setSelectedEventId(null)}
        onShowToast={(msg) => setToastMessage(msg)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  desktopOuter: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    minHeight: 0,
  },
  splitFrame: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  leftSidebar: {
    flex: 5,
    minWidth: 320,
    maxWidth: 430,
    borderRightWidth: 1,
    padding: 16,
    gap: 12,
    minHeight: 0,
  },
  desktopTotalCard: {
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 16,
  },
  totalEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.88,
    marginBottom: 4,
  },
  desktopTotalFigure: {
    fontSize: 28,
    lineHeight: 33,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  totalCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  totalCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalCountText: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  totalNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 9999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  totalNewBtnText: {
    fontSize: 12,
  },
  sidebarControls: {
    gap: 10,
  },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  filterChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  sidebarListScroll: {
    flex: 1,
    minHeight: 0,
  },
  sidebarListContent: {
    gap: 10,
    paddingBottom: 12,
  },
  sidebarEmptyBox: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  sidebarEmptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  rightPane: {
    flex: 7,
    minWidth: 0,
    minHeight: 0,
  },
  rightEmptyCenter: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  eventCard: {
    borderCurve: 'continuous',
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
  },
  cardMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardAmount: {
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  cardCount: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 3,
    borderRadius: 9999,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compactHeaderInner: {
    height: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTitle: {
    fontSize: 14,
    lineHeight: 24,
    paddingTop: 2,
  },
  mobileScroll: {
    flex: 1,
    height: '100%',
  },
  mobileScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  mobileContainer: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  mobileTitleWrap: {
    marginBottom: 18,
  },
  mobileTitle: {
    fontSize: 26,
    lineHeight: 42,
    paddingTop: 4,
    letterSpacing: -0.3,
    ...(Platform.OS === 'android' ? { includeFontPadding: true } : {}),
  },
  mobileSubtitle: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 2,
  },
  mobileTotalCard: {
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 20,
    marginBottom: 18,
  },
  mobileTotalFigure: {
    fontSize: 30,
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  mobileCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  mobileControls: {
    gap: 10,
    marginBottom: 16,
  },
  mobileFeedList: {
    gap: 12,
  },
});
