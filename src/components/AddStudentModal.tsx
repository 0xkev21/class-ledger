import { User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { Student } from '../types';

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
  const { addStudent, updateStudent } = useTreasury();
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
      setError('ကျောင်းသားအမည် ထည့်သွင်းပေးပါရန်');
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
          className="w-full md:max-w-lg bg-white dark:bg-zinc-900 rounded-t-[32px] md:rounded-[28px] p-6 shadow-2xl flex-col"
        >
          {/* Drag Handle Indicator (mobile only) */}
          <View className="items-center mb-4 md:hidden">
            <View className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-zinc-700" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              <View className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mr-3">
                <User size={20} color="#4f46e5" />
              </View>
              <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {editingStudent ? 'ကျောင်းသား အချက်အလက်ပြင်ရန်' : 'ကျောင်းသား အသစ်ထည့်ရန်'}
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Student Name (Required) */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                ကျောင်းသားအမည် (Student Name) <Text className="text-rose-500">*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError('');
                }}
                placeholder="e.g. Aung Kaung Myat"
                placeholderTextColor="#9ca3af"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-50"
              />
            </View>

            {/* Roll Number (Optional) */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                ခုံနံပါတ် / Roll Number (ရွေးချယ်ရန်)
              </Text>
              <TextInput
                value={rollNumber}
                onChangeText={setRollNumber}
                placeholder="e.g. 3CS-14 or 12"
                placeholderTextColor="#9ca3af"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-50"
              />
            </View>

            {/* Phone (Optional) */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                ဖုန်းနံပါတ် / Phone (ရွေးချယ်ရန်)
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 09447131200"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-50"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              className="w-full rounded-full bg-indigo-600 py-3.5 items-center justify-center shadow-sm active:bg-indigo-700 mb-2"
            >
              <Text className="text-sm font-bold text-white">
                {editingStudent ? 'အချက်အလက် သိမ်းမည်' : 'အတန်းစာရင်းထဲ ထည့်မည်'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
