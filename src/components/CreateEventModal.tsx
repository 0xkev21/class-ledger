import { CalendarDays, HeartHandshake, Tag, X } from 'lucide-react-native';
import React, { useState } from 'react';
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
import { EventType } from '../types';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventCreated?: (eventId: string) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onEventCreated,
}) => {
  const { addEvent, t } = useTreasury();
  const { isDark, themeColor } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [type, setType] = useState<EventType>('donation');
  const [fixedAmount, setFixedAmount] = useState('5000');
  const [dueDate, setDueDate] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t.modals.createEvent.errorName);
      return;
    }

    const amt = type === 'fixed_fee' ? parseInt(fixedAmount, 10) || 0 : undefined;
    if (type === 'fixed_fee' && (!amt || amt <= 0)) {
      setError(t.modals.createEvent.errorAmount);
      return;
    }

    try {
      const eventId = await addEvent({
        name: name.trim(),
        type,
        fixedAmount: amt,
        dueDate: dueDate.trim() || undefined,
        extraNote: extraNote.trim() || undefined,
      });

      setName('');
      setType('donation');
      setFixedAmount('5000');
      setDueDate('');
      setExtraNote('');
      setError('');

      onClose();
      if (onEventCreated) {
        onEventCreated(eventId);
      }
    } catch (err: any) {
      setError(err.message || t.common.error);
    }
  };

  return (
    <DragDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeight={windowHeight * 0.9}
      isDark={isDark}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: themeColor.surface }}
            className="h-10 w-10 rounded-full items-center justify-center mr-3"
          >
            <NativeIcon
              sfSymbol="calendar"
              materialName="event"
              FallbackIcon={CalendarDays}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {t.modals.createEvent.title}
          </Text>
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
              className="mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3"
            >
              <Text className="text-xs text-rose-600 dark:text-rose-300 font-medium">{error}</Text>
            </View>
          ) : null}

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Event Name */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                {t.modals.createEvent.nameLabel} <Text className="text-rose-500">*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={(tVal) => {
                  setName(tVal);
                  setError('');
                }}
                placeholder={t.modals.createEvent.namePlaceholder}
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                style={{
                  color: isDark ? '#f4f4f5' : '#18181b',
                  borderCurve: 'continuous',
                }}
                className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3.5 text-sm"
              />
            </View>

            {/* Type Selector (Segmented Pill) */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 ml-1">
                {t.modals.createEvent.typeLabel}
              </Text>
              <View
                style={{ borderCurve: 'continuous' }}
                className="flex-row p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"
              >
                <TouchableOpacity
                  onPress={() => setType('donation')}
                  style={{
                    backgroundColor: type === 'donation' ? themeColor.primary : 'transparent',
                    borderCurve: 'continuous',
                  }}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                    type === 'donation' ? 'shadow-xs' : ''
                  }`}
                >
                  <NativeIcon
                    sfSymbol="sparkles"
                    materialName="favorite"
                    FallbackIcon={HeartHandshake}
                    size={16}
                    color={type === 'donation' ? themeColor.onPrimary : (isDark ? '#a1a1aa' : '#71717a')}
                  />
                  <Text
                    style={{
                      color: type === 'donation' ? themeColor.onPrimary : (isDark ? '#d4d4d8' : '#52525b'),
                    }}
                    className="ml-2 text-xs font-bold"
                  >
                    {t.events.donation}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setType('fixed_fee')}
                  style={{
                    backgroundColor: type === 'fixed_fee' ? themeColor.primary : 'transparent',
                    borderCurve: 'continuous',
                  }}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                    type === 'fixed_fee' ? 'shadow-xs' : ''
                  }`}
                >
                  <NativeIcon
                    sfSymbol="tag.fill"
                    materialName="local-offer"
                    FallbackIcon={Tag}
                    size={16}
                    color={type === 'fixed_fee' ? themeColor.onPrimary : (isDark ? '#a1a1aa' : '#71717a')}
                  />
                  <Text
                    style={{
                      color: type === 'fixed_fee' ? themeColor.onPrimary : (isDark ? '#d4d4d8' : '#52525b'),
                    }}
                    className="ml-2 text-xs font-bold"
                  >
                    {t.events.fixedFee}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* If Fixed Fee: Amount Input */}
            {type === 'fixed_fee' ? (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                  {t.modals.createEvent.fixedAmountLabel} <Text className="text-rose-500">*</Text>
                </Text>
                <TextInput
                  value={fixedAmount}
                  onChangeText={setFixedAmount}
                  placeholder="5000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  style={{ borderCurve: 'continuous', fontVariant: ['tabular-nums'] }}
                  className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                />
                <View className="flex-row gap-2 mt-2">
                  {[2000, 3000, 5000, 10000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setFixedAmount(String(preset))}
                      style={{ borderCurve: 'continuous' }}
                      className="rounded-full bg-zinc-200/80 dark:bg-zinc-700/80 px-3 py-1"
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
            ) : null}

            {/* Due Date */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                {t.modals.createEvent.dueDateLabel} ({t.common.optional})
              </Text>
              <View
                style={{ borderCurve: 'continuous' }}
                className="flex-row items-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3"
              >
                <NativeIcon
                  sfSymbol="calendar"
                  materialName="calendar-today"
                  FallbackIcon={CalendarDays}
                  size={18}
                  color="#9ca3af"
                />
                <TextInput
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder={t.modals.createEvent.dueDatePlaceholder}
                  placeholderTextColor="#9ca3af"
                  className="ml-2.5 flex-1 text-sm text-zinc-900 dark:text-zinc-50 p-0"
                />
              </View>
            </View>

            {/* Extra Announcement Note */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                {t.modals.createEvent.noteLabel} ({t.common.optional})
              </Text>
              <TextInput
                value={extraNote}
                onChangeText={setExtraNote}
                placeholder={t.modals.createEvent.notePlaceholder}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ borderCurve: 'continuous' }}
                className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-3.5 text-sm text-zinc-900 dark:text-zinc-50 min-h-[75px]"
              />
            </View>

            {/* Submit Button */}
            <PressableScale
              onPress={handleSubmit}
              style={{
                backgroundColor: themeColor.primary,
                borderRadius: 9999,
                paddingVertical: 14,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                borderCurve: 'continuous',
                marginBottom: 8,
              }}
              className="w-full rounded-full py-4 items-center justify-center shadow-sm"
            >
              <Text
                style={{ color: themeColor.onPrimary }}
                className="text-sm font-bold"
              >
                {t.modals.createEvent.submit}
              </Text>
            </PressableScale>
          </ScrollView>
    </DragDismissSheet>
  );
};
