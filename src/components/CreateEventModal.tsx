import { CalendarDays, HeartHandshake, Tag, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
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
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { EventType } from '@/src/types';
import { Haptics } from '@/src/utils/haptics';
import { AnimatedSegmentedControl } from './animated/AnimatedSegmentedControl';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';

export interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventCreated?: (eventId: string) => void;
}

const FIXED_AMOUNT_PRESETS = [1000, 2000, 5000, 10000];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onEventCreated,
}) => {
  const { addEvent, t } = useTreasury();
  const { isDark, themeColor, palette } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [name, setName] = useState('');
  const [type, setType] = useState<EventType>('donation');
  const [fixedAmount, setFixedAmount] = useState('5000');
  const [dueDate, setDueDate] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [error, setError] = useState('');

  const typeTabs = useMemo(
    () => [
      {
        id: 'donation' as const,
        label: t.events.donation,
        icon: ({ size, color }: { size: number; color: string }) => (
          <NativeIcon
            sfSymbol="sparkles"
            materialName="favorite"
            FallbackIcon={HeartHandshake}
            size={size}
            color={color}
          />
        ),
      },
      {
        id: 'fixed_fee' as const,
        label: t.events.fixedFee,
        icon: ({ size, color }: { size: number; color: string }) => (
          <NativeIcon
            sfSymbol="tag.fill"
            materialName="local-offer"
            FallbackIcon={Tag}
            size={size}
            color={color}
          />
        ),
      },
    ],
    [t]
  );

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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="calendar"
              materialName="event"
              FallbackIcon={CalendarDays}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <Text
            style={[
              styles.title,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {t.modals.createEvent.title}
          </Text>
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
        {/* Event Name */}
        <View style={styles.fieldGroup}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.createEvent.nameLabel}{' '}
            <Text style={{ color: palette.dangerText }}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={(tVal) => {
              setName(tVal);
              setError('');
            }}
            placeholder={t.modals.createEvent.namePlaceholder}
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                backgroundColor: palette.card,
                borderColor: palette.line,
                color: palette.ink,
                fontFamily: fonts.regular,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
              },
            ]}
          />
        </View>

        {/* Type Selector */}
        <View style={styles.fieldGroup}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.createEvent.typeLabel}
          </Text>
          <AnimatedSegmentedControl<EventType>
            tabs={typeTabs}
            activeId={type}
            onChange={setType}
            activeColor={palette.ink}
            onActiveColor={palette.bg}
            backgroundColor={palette.surface}
            inactiveTextColor={palette.muted}
          />
        </View>

        {/* Fixed Fee Amount Input + Quick Chips */}
        {type === 'fixed_fee' ? (
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.label,
                { color: palette.muted, fontFamily: fonts.medium },
              ]}
            >
              {t.modals.createEvent.fixedAmountLabel}{' '}
              <Text style={{ color: palette.dangerText }}>*</Text>
            </Text>
            <TextInput
              value={fixedAmount}
              onChangeText={setFixedAmount}
              placeholder="5000"
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
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
                },
              ]}
            />
            <View style={styles.presetsRow}>
              {FIXED_AMOUNT_PRESETS.map((preset) => {
                const isSelected = fixedAmount === String(preset);
                return (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFixedAmount(String(preset));
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
        ) : null}

        {/* Due Date */}
        <View style={styles.fieldGroup}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.createEvent.dueDateLabel} ({t.common.optional})
          </Text>
          <View
            style={[
              styles.inputIconWrap,
              { backgroundColor: palette.card, borderColor: palette.line },
            ]}
          >
            <NativeIcon
              sfSymbol="calendar"
              materialName="calendar-today"
              FallbackIcon={CalendarDays}
              size={16}
              color={palette.muted}
            />
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder={t.modals.createEvent.dueDatePlaceholder}
              placeholderTextColor={palette.muted}
              style={[
                styles.iconInputText,
                {
                  color: palette.ink,
                  fontFamily: fonts.mono,
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
                },
              ]}
            />
          </View>
        </View>

        {/* Extra Note */}
        <View style={styles.fieldGroupLast}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.createEvent.noteLabel} ({t.common.optional})
          </Text>
          <TextInput
            value={extraNote}
            onChangeText={setExtraNote}
            placeholder={t.modals.createEvent.notePlaceholder}
            placeholderTextColor={palette.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[
              styles.multilineInput,
              {
                backgroundColor: palette.card,
                borderColor: palette.line,
                color: palette.ink,
                fontFamily: fonts.regular,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
              },
            ]}
          />
        </View>

        {/* Submit Button */}
        <PressableScale
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel={t.modals.createEvent.submit}
          style={[styles.submitButton, { backgroundColor: themeColor.primary }]}
        >
          <Text
            style={[
              styles.submitText,
              { color: themeColor.onPrimary, fontFamily: fonts.semibold },
            ]}
          >
            {t.modals.createEvent.submit}
          </Text>
        </PressableScale>
      </ScrollView>
    </DragDismissSheet>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
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
    flexShrink: 1,
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
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldGroupLast: {
    marginBottom: 22,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 2,
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
  inputIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  iconInputText: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  multilineInput: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 78,
  },
  submitButton: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  submitText: {
    fontSize: 14,
  },
});
