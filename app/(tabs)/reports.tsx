import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Cloud,
  Copy,
  Download,
  FileSpreadsheet,
  GraduationCap,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Settings2,
  Upload,
  User,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudSyncModal } from '@/src/components/CloudSyncModal';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useTreasury } from '@/src/context/TreasuryContext';
import {
  copyReportToClipboard,
  downloadFileWeb,
  generateEndOfYearFineSummary,
  generateFinesCSV,
} from '@/src/utils/exporter';
import { formatMMK } from '@/src/utils/formatters';

export default function ReportsScreen() {
  const {
    settings,
    updateSettings,
    fines,
    students,
    subjects,
    finesSummary,
    subjectFineStats,
    studentFineStats,
    resetToDefaults,
    importDatabase,
    getDatabaseJSON,
    user,
    syncStatus,
  } = useTreasury();

  // Breakdown switcher: 'subject' | 'student'
  const [breakdownMode, setBreakdownMode] = useState<'subject' | 'student'>('subject');

  // Modals & Toasts
  const [showCloudSync, setShowCloudSync] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings local state
  const [kbzName, setKbzName] = useState(settings.ecKbzpayName);
  const [kbzPhone, setKbzPhone] = useState(settings.ecKbzpayPhone);

  const handleSaveSettings = async () => {
    await updateSettings({
      ecKbzpayName: kbzName.trim(),
      ecKbzpayPhone: kbzPhone.trim(),
    });
    setToastMessage('KBZPay အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ!');
  };

  // 1-Click End-of-Year Fine Report Copy
  const handleCopyEndOfYearReport = async () => {
    const reportText = generateEndOfYearFineSummary({
      totalPaid: finesSummary.totalPaid,
      totalUnpaid: finesSummary.totalUnpaid,
      totalAll: finesSummary.totalAll,
      subjectStats: subjectFineStats,
    });

    const success = await copyReportToClipboard(reportText);
    if (success) {
      setToastMessage('နှစ်ချုပ် ဒဏ်ကြေး အစီရင်ခံစာ ကူးယူပြီးပါပြီ!');
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    const csv = generateFinesCSV(fines, students, subjects);
    if (Platform.OS === 'web') {
      downloadFileWeb(`ec_fines_${Date.now()}.csv`, csv);
      setToastMessage('Fines CSV ဖိုင် ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ');
    } else {
      await copyReportToClipboard(csv);
      setToastMessage('Fines CSV စာသားကို Clipboard သို့ ကူးယူပြီးပါပြီ');
    }
  };

  // JSON Backup Export
  const handleExportJSON = async () => {
    const json = getDatabaseJSON();
    if (Platform.OS === 'web') {
      downloadFileWeb(`ec_treasury_backup_${Date.now()}.json`, json, 'application/json');
      setToastMessage('JSON Backup ဖိုင် ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ');
    } else {
      await copyReportToClipboard(json);
      setToastMessage('Database JSON ကို Clipboard သို့ ကူးယူပြီးပါပြီ');
    }
  };

  // Reset database handler
  const handleResetDatabase = () => {
    Alert.alert(
      'ဒေတာအားလုံး အသစ်ပြန်လည်သတ်မှတ်မည်',
      'ကျောင်းသားများ၊ ဒဏ်ကြေးများနှင့် အခမ်းအနားမှတ်တမ်းအားလုံးကို ရှင်းလင်းပြီး 100% အသစ်စတင်ရန် သေချာပါသလား?',
      [
        { text: 'မလုပ်တော့ပါ', style: 'cancel' },
        {
          text: 'အားလုံးရှင်းလင်းမည်',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            setToastMessage('ဒေတာအားလုံး ရှင်းလင်းပြီး စနစ်အသစ် စတင်ပါပြီ');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, height: '100%', minHeight: 0 }}
      className="flex-1 bg-slate-50 dark:bg-zinc-950"
    >
      <ToastNotification message={toastMessage} onHide={() => setToastMessage(null)} />

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
              အစီရင်ခံစာ & ဆက်တင်များ
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              ဒဏ်ကြေးနှစ်ချုပ် အစီရင်ခံစာ၊ အတန်းတွင်းမျှဝေရန်နှင့် Cloud Sync
            </Text>
          </View>

          {/* 1. Hero Fine Summary Card */}
          <View className="rounded-3xl bg-white dark:bg-zinc-900 p-6 mb-5 shadow-none">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                စုစုပေါင်း ဒဏ်ကြေး ဘဏ္ဍာရေးအခြေအနေ
              </Text>
              <View className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center">
                <BarChart3 size={16} color="#4f46e5" />
              </View>
            </View>

            {/* Large Overall Total Display */}
            <Text className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">
              {formatMMK(finesSummary.totalAll)}
            </Text>

            <View className="flex-row gap-3">
              {/* Collected (Paid) */}
              <View className="flex-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4">
                <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">
                  ကောက်ခံရရှိပြီး (Paid)
                </Text>
                <Text className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight">
                  {formatMMK(finesSummary.totalPaid)}
                </Text>
              </View>

              {/* Pending (Unpaid) */}
              <View className="flex-1 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4">
                <Text className="text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-0.5">
                  ကောက်ခံရန်ကျန် (Unpaid)
                </Text>
                <Text className="text-xl font-extrabold text-rose-700 dark:text-rose-300 tracking-tight">
                  {formatMMK(finesSummary.totalUnpaid)}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. 1-Click Copy End-of-Year Fine Report Button */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={handleCopyEndOfYearReport}
              activeOpacity={0.85}
              className="w-full flex-row items-center justify-center rounded-full bg-indigo-600 py-4 px-6 shadow-sm active:bg-indigo-700"
            >
              <Copy size={18} color="#ffffff" />
              <Text className="ml-2 text-sm font-bold text-white">
                1-Click Copy End-of-Year Fine Summary
              </Text>
            </TouchableOpacity>
            <Text className="text-[11px] text-zinc-400 text-center mt-2">
              ဘာသာရပ်အလိုက် ကောက်ခံရရှိငွေ စာရင်းချုပ်ကို Viber / Telegram သို့ တိုက်ရိုက်ကူးယူနိုင်ပါသည်
            </Text>
          </View>

          {/* 3. Breakdown Switcher (By Subject | By Student) */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                ဒဏ်ကြေး ခွဲခြမ်းစိတ်ဖြာမှု
              </Text>

              {/* Segmented Pills */}
              <View className="flex-row p-1 bg-white dark:bg-zinc-900 rounded-full">
                <TouchableOpacity
                  onPress={() => setBreakdownMode('subject')}
                  className={`px-3 py-1.5 rounded-full ${
                    breakdownMode === 'subject'
                      ? 'bg-zinc-900 dark:bg-white'
                      : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      breakdownMode === 'subject'
                        ? 'text-white dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    By Subject
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setBreakdownMode('student')}
                  className={`px-3 py-1.5 rounded-full ${
                    breakdownMode === 'student'
                      ? 'bg-zinc-900 dark:bg-white'
                      : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      breakdownMode === 'student'
                        ? 'text-white dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    By Student
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Breakdown Content */}
            {breakdownMode === 'subject' ? (
              subjectFineStats.length === 0 ? (
                <View className="rounded-2xl bg-white dark:bg-zinc-900 p-6 items-center">
                  <Text className="text-xs text-zinc-400">ဘာသာရပ်ဆိုင်ရာ ဒဏ်ကြေး မှတ်တမ်း မရှိသေးပါ</Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {subjectFineStats.map((stat) => (
                    <View
                      key={stat.subject.id}
                      className="rounded-3xl bg-white dark:bg-zinc-900 p-4"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {stat.subject.name}
                        </Text>
                        <Text className="text-xs font-semibold text-zinc-400">
                          {stat.count} မှု
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <View>
                          <Text className="text-[10px] text-zinc-400">Paid (ရရှိပြီး)</Text>
                          <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMMK(stat.totalPaid)}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-[10px] text-zinc-400">Unpaid (ကျန်)</Text>
                          <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            {formatMMK(stat.totalUnpaid)}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-[10px] text-zinc-400">Total (စုစုပေါင်း)</Text>
                          <Text className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50">
                            {formatMMK(stat.totalAll)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )
            ) : (
              studentFineStats.length === 0 ? (
                <View className="rounded-2xl bg-white dark:bg-zinc-900 p-6 items-center">
                  <Text className="text-xs text-zinc-400">ကျောင်းသားစာရင်း မရှိသေးပါ</Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {studentFineStats
                    .sort((a, b) => b.totalUnpaid - a.totalUnpaid)
                    .map((stat) => (
                      <View
                        key={stat.student.id}
                        className="rounded-3xl bg-white dark:bg-zinc-900 p-4 flex-row items-center justify-between"
                      >
                        <View className="flex-1 mr-3">
                          <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                            {stat.student.name}
                            {stat.student.rollNumber ? ` (${stat.student.rollNumber})` : ''}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Paid: {formatMMK(stat.totalPaid)}
                            </Text>
                            <Text className="text-[11px] text-zinc-400">•</Text>
                            <Text className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                              Owed: {formatMMK(stat.totalUnpaid)}
                            </Text>
                          </View>
                        </View>

                        <View className="items-end">
                          <Text className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50">
                            {formatMMK(stat.totalAll)}
                          </Text>
                          {stat.unpaidCount > 0 ? (
                            <Text className="text-[10px] text-rose-500 font-bold">
                              {stat.unpaidCount} မှု မပေးရသေး
                            </Text>
                          ) : (
                            <Text className="text-[10px] text-emerald-500 font-bold">
                              ရှင်းလင်းပြီး
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                </View>
              )
            )}
          </View>

          {/* 4. Settings & Cloud Sync Card */}
          <View className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 shadow-none">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mr-2.5">
                  <Settings2 size={16} color="#4f46e5" />
                </View>
                <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  EC KBZPay ဆက်တင်များ
                </Text>
              </View>
            </View>

            {/* KBZPay Name Input */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 ml-1">
                EC KBZPay အကောင့်အမည် (e.g. Kaung Sat Oo)
              </Text>
              <TextInput
                value={kbzName}
                onChangeText={setKbzName}
                placeholder="Kaung Sat Oo"
                placeholderTextColor="#9ca3af"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3 text-xs text-zinc-900 dark:text-zinc-50"
              />
            </View>

            {/* KBZPay Phone Input */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 ml-1">
                EC KBZPay ဖုန်းနံပါတ် (e.g. 09447131200)
              </Text>
              <TextInput
                value={kbzPhone}
                onChangeText={setKbzPhone}
                placeholder="09447131200"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                className="w-full rounded-2xl bg-slate-100 dark:bg-zinc-800 px-4 py-3 text-xs text-zinc-900 dark:text-zinc-50"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveSettings}
              className="w-full rounded-full bg-zinc-900 dark:bg-white py-3 items-center justify-center"
            >
              <Text className="text-xs font-bold text-white dark:text-zinc-900">
                KBZPay အချက်အလက် သိမ်းမည်
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. Supabase Cloud Sync & Backup Actions */}
          <View className="rounded-3xl bg-white dark:bg-zinc-900 p-5 mb-5 shadow-none">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/60 items-center justify-center mr-2.5">
                  <Cloud size={16} color="#2563eb" />
                </View>
                <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  Cloud Sync & ဒေတာသိမ်းဆည်းမှု
                </Text>
              </View>
            </View>

            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              ဖုန်းနှင့် Laptop (Desktop/Web) အကြား အလိုအလျောက် Realtime စာရင်းချိတ်ဆက်နိုင်ပါသည်။ ခလုတ်နှိပ်စရာမလိုဘဲ အချိန်နှင့်တစ်ပြေးညီ သိမ်းဆည်းပေးပါသည်။
            </Text>

            {/* Open Cloud Sync Modal Button */}
            <TouchableOpacity
              onPress={() => setShowCloudSync(true)}
              className="w-full flex-row items-center justify-center rounded-full bg-blue-600 py-3.5 mb-3 active:bg-blue-700"
            >
              <Cloud size={16} color="#ffffff" />
              <Text className="ml-2 text-xs font-bold text-white">
                {user ? `အလိုအလျောက် Cloud ချိတ်ဆက်ထားသည် (${user.email})` : 'အလိုအလျောက် Cloud Sync & Auth ဖွင့်မည်'}
              </Text>
            </TouchableOpacity>

            {/* Backup Buttons */}
            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                onPress={handleExportCSV}
                className="flex-1 flex-row items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 py-3"
              >
                <FileSpreadsheet size={14} color="#71717a" />
                <Text className="ml-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  CSV Export
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExportJSON}
                className="flex-1 flex-row items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 py-3"
              >
                <HardDrive size={14} color="#71717a" />
                <Text className="ml-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  JSON Backup
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reset App to Clean Slate */}
            <View className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <TouchableOpacity
                onPress={handleResetDatabase}
                className="flex-row items-center justify-center py-2"
              >
                <RotateCcw size={14} color="#e11d48" />
                <Text className="ml-1.5 text-xs font-bold text-rose-600">
                  ဒေတာအားလုံး ရှင်းလင်းမည် (Reset to 0)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        visible={showCloudSync}
        onClose={() => setShowCloudSync(false)}
      />
    </SafeAreaView>
  );
}
