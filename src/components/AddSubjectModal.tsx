import { BookOpen, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useTreasury } from '../context/TreasuryContext';
import { Subject } from '../types';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';

interface AddSubjectModalProps {
  visible: boolean;
  onClose: () => void;
  editingSubject?: Subject | null;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  visible,
  onClose,
  editingSubject,
}) => {
  const { addSubject, updateSubject, t } = useTreasury();
  const { isDark, themeColor } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (editingSubject) {
        setName(editingSubject.name);
      } else {
        setName('');
      }
      setError('');
    }
  }, [visible, editingSubject]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t.modals.addSubject.errorRequired);
      return;
    }

    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: name.trim(),
        });
      } else {
        await addSubject({
          name: name.trim(),
        });
      }
      onClose();
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
              sfSymbol="book.fill"
              materialName="menu-book"
              FallbackIcon={BookOpen}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {editingSubject
              ? t.modals.addSubject.titleEdit
              : t.modals.addSubject.titleAdd}
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

      {/* Subject Name Input */}
      <View className="mb-6">
        <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
          {t.modals.addSubject.nameLabel} <Text className="text-rose-500">*</Text>
        </Text>
        <TextInput
          value={name}
          onChangeText={(tVal) => {
            setName(tVal);
            setError('');
          }}
          placeholder={t.modals.addSubject.namePlaceholder}
          placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
          style={{
            color: isDark ? '#f4f4f5' : '#18181b',
            borderCurve: 'continuous',
          }}
          className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3.5 text-sm"
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
        className="w-full rounded-full py-3.5 items-center justify-center shadow-sm"
      >
        <Text
          style={{ color: themeColor.onPrimary }}
          className="text-sm font-bold"
        >
          {editingSubject
            ? t.modals.addSubject.submitEdit
            : t.modals.addSubject.submitAdd}
        </Text>
      </PressableScale>
    </DragDismissSheet>
  );
};
