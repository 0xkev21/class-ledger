import { BookOpen, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTreasury } from '../context/TreasuryContext';
import { Subject } from '../types';

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
  const { addSubject, updateSubject } = useTreasury();
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
      setError('ဘာသာရပ်အမည် ထည့်သွင်းပေးပါရန်');
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
      setError(err.message || 'သိမ်းဆည်းရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end md:justify-center items-center bg-black/40"
      >
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View
          style={{
            maxHeight: windowHeight * 0.90,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
          className="w-full md:max-w-md bg-white dark:bg-zinc-900 rounded-t-[32px] md:rounded-[28px] p-6 shadow-2xl flex-col"
        >
          {/* Drag Handle Indicator (mobile only) */}
          <View className="items-center mb-4 md:hidden">
            <View className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-zinc-700" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="h-10 w-10 rounded-full bg-violet-50 dark:bg-violet-950/60 items-center justify-center mr-3">
                <BookOpen size={20} color="#7c3aed" />
              </View>
              <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {editingSubject ? 'ဘာသာရပ် အမည်ပြင်ရန်' : 'ဘာသာရပ် အသစ်ထည့်ရန်'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center"
            >
              <X size={16} color="#71717a" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3">
              <Text className="text-xs text-rose-600 dark:text-rose-300 font-medium">{error}</Text>
            </View>
          ) : null}

          {/* Subject Name Input */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
              ဘာသာရပ်အမည် (Subject Name) <Text className="text-rose-500">*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              placeholder="e.g. Project & Professionalism, Software Engineering"
              placeholderTextColor="#9ca3af"
              className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-50"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="w-full rounded-full bg-violet-600 py-3.5 items-center justify-center shadow-sm active:bg-violet-700"
          >
            <Text className="text-sm font-bold text-white">
              {editingSubject ? 'ဘာသာရပ် အတည်ပြုမည်' : 'ဘာသာရပ် ထည့်မည်'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
