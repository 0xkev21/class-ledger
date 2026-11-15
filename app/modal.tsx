import { BookOpen, CheckCircle, Smartphone, Users } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <ScrollView className="flex-1 bg-white p-5 dark:bg-slate-900">
      <View className="items-center py-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-md">
          <BookOpen size={28} color="#ffffff" />
        </View>
        <Text className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
          EC Treasury & Student Management
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          တက္ကသိုလ် အတန်းခေါင်းဆောင် (EC) ဘဏ္ဍာရေးစီမံခန့်ခွဲမှုစနစ် v1.0
        </Text>
      </View>

      <View className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
          အဓိက အင်္ဂါရပ်များ (Core Features)
        </Text>

        <View className="mt-3 flex-row items-start">
          <CheckCircle size={16} color="#059669" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
              အခမ်းအနားကြေး အစုလိုက် ထုတ်ပေးခြင်း (Bulk Event Generator)
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              ဆရာကန်တော့ပွဲကြေး၊ ကြိုဆိုပွဲကြေးများကို အတန်းသားအားလုံးထံ ၁ ချက်နှိပ်ရုံဖြင့် သတ်မှတ်နိုင်ခြင်း။
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-start">
          <CheckCircle size={16} color="#059669" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
              ဘာသာရပ်အလိုက် ဒဏ်ကြေးစီမံမှု (Subject-wise Fines)
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              နောက်ကျ၊ အိမ်စာမတင် စသည့် ဒဏ်ကြေးများကို ဘာသာရပ်အလိုက် အတိအကျ သတ်မှတ်နိုင်ခြင်း။
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-start">
          <CheckCircle size={16} color="#059669" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
              အပြည့် & တစ်စိတ်တစ်ပိုင်း ပေးချေမှု (Partial Payments)
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              ငွေသား (Cash) နှင့် KBZPay အပြည့် သို့မဟုတ် တစ်စိတ်တစ်ပိုင်း ခွဲခြားလက်ခံနိုင်ခြင်း။
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-start">
          <CheckCircle size={16} color="#059669" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Viber / Telegram မျှဝေရန် အစီရင်ခံစာ ထုတ်ယူမှု
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              အတန်း Group များသို့ ပေးချေရန်ကျန်သူများစာရင်းကို တိုက်ရိုက် ကူးယူပို့စ်တင်နိုင်ခြင်း။
            </Text>
          </View>
        </View>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}
