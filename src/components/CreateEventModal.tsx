import { CalendarDays, HeartHandshake, Tag, X } from 'lucide-react-native';
import React, { useState } from 'react';
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
import { EventType } from '../types';

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
  const { addEvent } = useTreasury();
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
      setError('အခမ်းအနား / အစီအစဉ် အမည် ထည့်သွင်းပေးပါရန်');
      return;
    }

    const amt = type === 'fixed_fee' ? parseInt(fixedAmount, 10) || 0 : undefined;
    if (type === 'fixed_fee' && (!amt || amt <= 0)) {
      setError('သတ်မှတ်ကြေးပမာဏ အနည်းဆုံး ၁ ကျပ် ထည့်ပေးပါရန်');
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
      setError(err.message || 'အခမ်းအနား ဖန်တီးရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
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
            height: Platform.OS === 'web' ? 'auto' : Math.min(windowHeight * 0.85, 680),
            paddingBottom: Math.max(insets.bottom, 16),
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
                <CalendarDays size={20} color="#4f46e5" />
              </View>
              <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                အခမ်းအနား အသစ်ဖန်တီးရန်
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

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Event Name */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                အခမ်းအနား အမည် (Event Name) <Text className="text-rose-500">*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError('');
                }}
                placeholder="e.g. မဟာဘုံကထိန်, ဆရာကန်တော့ပွဲ, အခန်းရန်ပုံငွေ"
                placeholderTextColor="#9ca3af"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-50"
              />
            </View>

            {/* Type Selector (Segmented Pill) */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 ml-1">
                အမျိုးအစား ရွေးချယ်ရန် (Collection Type)
              </Text>
              <View className="flex-row p-1 bg-slate-100 dark:bg-zinc-800 rounded-full">
                <TouchableOpacity
                  onPress={() => setType('donation')}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                    type === 'donation'
                      ? 'bg-indigo-600 shadow-sm'
                      : 'bg-transparent'
                  }`}
                >
                  <HeartHandshake
                    size={16}
                    color={type === 'donation' ? '#ffffff' : '#71717a'}
                  />
                  <Text
                    className={`ml-2 text-xs font-bold ${
                      type === 'donation'
                        ? 'text-white'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    စေတနာအလှူ (Donation)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setType('fixed_fee')}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                    type === 'fixed_fee'
                      ? 'bg-indigo-600 shadow-sm'
                      : 'bg-transparent'
                  }`}
                >
                  <Tag
                    size={16}
                    color={type === 'fixed_fee' ? '#ffffff' : '#71717a'}
                  />
                  <Text
                    className={`ml-2 text-xs font-bold ${
                      type === 'fixed_fee'
                        ? 'text-white'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    သတ်မှတ်ကြေး (Fixed Fee)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* If Fixed Fee: Amount Input */}
            {type === 'fixed_fee' ? (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                  တစ်ဦးလျှင် ကောက်ခံမည့်နှုန်း (MMK) <Text className="text-rose-500">*</Text>
                </Text>
                <TextInput
                  value={fixedAmount}
                  onChangeText={setFixedAmount}
                  placeholder="e.g. 5000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                />
                <View className="flex-row gap-2 mt-2">
                  {[2000, 3000, 5000, 10000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setFixedAmount(String(preset))}
                      className="rounded-full bg-slate-200/80 dark:bg-zinc-700/80 px-3 py-1"
                    >
                      <Text className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
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
                နောက်ဆုံးရက် / Due Date (ရွေးချယ်ရန်)
              </Text>
              <View className="flex-row items-center rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3">
                <CalendarDays size={18} color="#9ca3af" />
                <TextInput
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="e.g. 30/10/26"
                  placeholderTextColor="#9ca3af"
                  className="ml-2.5 flex-1 text-sm text-zinc-900 dark:text-zinc-50 p-0"
                />
              </View>
            </View>

            {/* Extra Announcement Note */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1">
                ကြေညာချက်တွင် ထည့်သွင်းလိုသော အထူးမှတ်ချက် (Optional Extra Note)
              </Text>
              <TextInput
                value={extraNote}
                onChangeText={setExtraNote}
                placeholder="e.g. 🎗️ လှူဖွယ်ပစ္စည်းများ ကိုယ်တိုင်လှူဒါန်းချင်ပါက ကျောင်းကပဒေသာမှာသွားရောက်လှူဒါန်းနိုင်ပါတယ်"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 p-3.5 text-sm text-zinc-900 dark:text-zinc-50 min-h-[75px]"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              className="w-full rounded-full bg-indigo-600 py-3.5 items-center justify-center shadow-sm active:bg-indigo-700 mb-2"
            >
              <Text className="text-sm font-bold text-white">
                အခမ်းအနား အသစ်စတင်မည်
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
