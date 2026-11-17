import { User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
import { Student } from '../types';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  editingStudent?: Student | null;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  visible,
  onClose,
  editingStudent,
}) => {
  const { addStudent, updateStudent, t } = useTreasury();
  const { isDark, themeColor } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (editingStudent) {
        setName(editingStudent.name);
        setRollNumber(editingStudent.rollNumber || '');
        setPhone(editingStudent.phone || '');
      } else {
        setName('');
        setRollNumber('');
        setPhone('');
      }
      setError('');
    }
  }, [visible, editingStudent]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t.modals.addStudent.errorRequired);
      return;
    }

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          name: name.trim(),
          rollNumber: rollNumber.trim() || undefined,
          phone: phone.trim() || undefined,
        });
      } else {
        await addStudent({
          name: name.trim(),
          rollNumber: rollNumber.trim() || undefined,
          phone: phone.trim() || undefined,
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
              sfSymbol="person.fill"
              materialName="person"
              FallbackIcon={User}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {editingStudent
              ? t.modals.addStudent.titleEdit
              : t.modals.addStudent.titleAdd}
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
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Student Name (Required) */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                {t.modals.addStudent.nameLabel} <Text className="text-rose-500">*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={(tVal) => {
                  setName(tVal);
                  setError('');
                }}
                placeholder={t.modals.addStudent.namePlaceholder}
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                style={{
                  color: isDark ? '#f4f4f5' : '#18181b',
                  borderCurve: 'continuous',
                }}
                className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3.5 text-sm"
              />
            </View>

            {/* Roll Number (Optional) */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                {t.modals.addStudent.rollLabel} ({t.common.optional})
              </Text>
              <TextInput
                value={rollNumber}
                onChangeText={setRollNumber}
                placeholder={t.modals.addStudent.rollPlaceholder}
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                style={{
                  color: isDark ? '#f4f4f5' : '#18181b',
                  borderCurve: 'continuous',
                }}
                className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3.5 text-sm"
              />
            </View>

            {/* Phone (Optional) */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                {t.modals.addStudent.phoneLabel} ({t.common.optional})
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t.modals.addStudent.phonePlaceholder}
                placeholderTextColor={isDark ? '#71717a' : '#9ca3af'}
                keyboardType="phone-pad"
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
              className="w-full rounded-full py-3.5 items-center justify-center shadow-sm mb-2"
            >
              <Text
                style={{ color: themeColor.onPrimary }}
                className="text-sm font-bold"
              >
                {editingStudent
                  ? t.modals.addStudent.submitEdit
                  : t.modals.addStudent.submitAdd}
              </Text>
            </PressableScale>
          </ScrollView>
    </DragDismissSheet>
  );
};
