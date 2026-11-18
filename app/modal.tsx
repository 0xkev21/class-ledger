import { BookOpen, CheckCircle, ExternalLink, Globe } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTreasury } from '../src/context/TreasuryContext';

export default function ModalScreen() {
  const router = useRouter();
  const { language, themeColor } = useTreasury();

  const isEn = language === 'en';

  return (
    <ScrollView className="flex-1 bg-white p-5 dark:bg-slate-900">
      <View className="items-center py-4">
        <View
          style={{ backgroundColor: themeColor.primary }}
          className="h-14 w-14 items-center justify-center rounded-2xl shadow-md"
        >
          <BookOpen size={28} color={themeColor.onPrimary} />
        </View>
        <Text className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
          Class Ledger
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          {isEn ? 'Class Ledger Management System v1.0' : 'အတန်းခေါင်းဆောင် စာရင်းစီမံခန့်ခွဲမှုစနစ် v1.0'}
        </Text>
      </View>

      <View className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {isEn ? 'Core Features' : 'အဓိက အင်္ဂါရပ်များ'}
        </Text>

        <View className="mt-3 flex-row items-start">
          <CheckCircle size={16} color="#059669" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isEn ? 'Bulk Event Assessment' : 'အခမ်းအနားကြေး အစုလိုက် သတ်မှတ်ခြင်း'}
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Assess fees to all students simultaneously with 1-tap.'
                : 'အတန်းသားအားလုံးထံ အခမ်းအနားကြေး ၁ ချက်နှိပ်ရုံဖြင့် သတ်မှတ်နိုင်ခြင်း။'}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-start">
          <CheckCircle size={16} color="#059669" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isEn ? 'Subject-wise Fines' : 'ဘာသာရပ်အလိုက် ဒဏ်ကြေးစီမံမှု'}
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Assign attendance and submission fines by subject.'
                : 'ပျက်ကွက်နှင့် အိမ်စာမတင် ဒဏ်ကြေးများကို ဘာသာရပ်အလိုက် အတိအကျ သတ်မှတ်နိုင်ခြင်း။'}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-start">
          <CheckCircle size={16} color="#059669" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isEn ? 'Flexible Payment Tracking' : 'ပေးချေမှု အသေးစိတ် မှတ်တမ်း'}
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Track cash and KBZPay payments with partial or full settlements.'
                : 'ငွေသားနှင့် KBZPay ပေးချေမှုများကို အပြည့်အစုံ မှတ်တမ်းတင်နိုင်ခြင်း။'}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-start">
          <CheckCircle size={16} color="#059669" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isEn ? 'Quick Social Share & High-Res Export' : 'ကြေညာချက်နှင့် ပုံထုတ်ယူမှု'}
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Export beautiful aesthetic reports or copy text directly for Viber & Telegram.'
                : 'အတန်း Group များသို့ ပေးချေရန်ကျန်သူများစာရင်းကို တိုက်ရိုက်ကူးယူမျှဝေနိုင်ခြင်း။'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          router.dismiss();
          router.push('/landing' as any);
        }}
        style={{ borderCurve: 'continuous', borderColor: themeColor.primary }}
        className="mt-5 flex-row items-center justify-center rounded-2xl border bg-zinc-50 dark:bg-zinc-800/80 p-3.5"
      >
        <Globe size={16} color={themeColor.primary} />
        <Text style={{ color: themeColor.primary }} className="ml-2 text-xs font-bold">
          {isEn ? 'View Product Website & Overview' : 'ဝဘ်ဆိုက်နှင့် မိတ်ဆက်စာမျက်နှာကြည့်ရှုရန်'}
        </Text>
        <ExternalLink size={13} color={themeColor.primary} className="ml-1.5" />
      </TouchableOpacity>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}
