import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  KeyRound,
  Laptop,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Send,
  ShieldCheck,
  Smartphone,
  User as UserIcon,
  X,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTreasury } from '../context/TreasuryContext';
import { getMobileAuthRedirectUri } from '../storage/supabase';

interface CloudSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ visible, onClose }) => {
  const {
    user,
    isAuthLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendEmailOtp,
    verifyEmailOtp,
    resetPasswordForEmail,
    updateUserPassword,
    signOut,
    syncStatus,
    syncMessage,
    lastSyncedAt,
    isCloudConnected,
    syncNow,
    refreshCloudConnection,
  } = useTreasury();

  // Auth form states
  const [authMode, setAuthMode] = useState<
    'signin' | 'signup' | 'forgot' | 'verify_recovery' | 'otp_login'
  >('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (visible) {
      setFeedback(null);
    }
  }, [visible]);

  // Handle Google 1-Tap Sign In
  const handleGoogleSignIn = async () => {
    setIsSubmittingAuth(true);
    setFeedback(null);
    try {
      const res = await signInWithGoogle();
      if (!res.success && res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        if (Platform.OS !== 'web') {
          setFeedback({
            text: 'Google Sign-In ဖြင့် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ!',
            isError: false,
          });
        }
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Google sign-in failed', isError: true });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Email & Password Sign In / Sign Up
  const handleEmailAuthSubmit = async () => {
    if (!email.trim() || !password) {
      setFeedback({ text: 'Email နှင့် Password ကို ဖြည့်စွက်ပေးပါ။', isError: true });
      return;
    }

    if (password.length < 6) {
      setFeedback({ text: 'Password သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။', isError: true });
      return;
    }

    setIsSubmittingAuth(true);
    setFeedback(null);

    try {
      if (authMode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (!res.success && res.error) {
          setFeedback({ text: res.error, isError: true });
        } else {
          setFeedback({ text: 'အောင်မြင်စွာ အကောင့်ဝင်ရောက်ပြီးပါပြီ!', isError: false });
        }
      } else {
        const res = await signUpWithEmail(email, password, displayName);
        if (!res.success && res.error) {
          setFeedback({ text: res.error, isError: true });
        } else if (res.requiresEmailConfirmation) {
          setFeedback({
            text: 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ သင့် Email ထဲရှိ ၈ လုံးပါ Code ဖြင့် အတည်ပြုနိုင်ပါသည်။',
            isError: false,
          });
          setAuthMode('otp_login');
        } else {
          setFeedback({ text: 'အကောင့်အသစ် ဖွင့်လှစ်ပြီး အလိုအလျောက် ဝင်ရောက်ပါပြီ!', isError: false });
        }
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Authentication error', isError: true });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Forgot Password - Request 8-digit Reset Code
  const handleRequestPasswordReset = async () => {
    if (!email.trim()) {
      setFeedback({ text: 'ကျေးဇူးပြု၍ သင့် Email လိပ်စာကို ထည့်သွင်းပေးပါ။', isError: true });
      return;
    }

    setIsSubmittingAuth(true);
    setFeedback(null);
    try {
      const res = await resetPasswordForEmail(email);
      if (!res.success && res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        setFeedback({
          text: `စကားဝှက် ပြန်လည်ပြင်ဆင်ရန် ၈ လုံးပါ Code ကို ${email} သို့ ပို့ထားပါပြီ။`,
          isError: false,
        });
        setAuthMode('verify_recovery');
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Password reset request failed', isError: true });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Verify Recovery Code & Set New Password
  const handleConfirmNewPassword = async () => {
    if (!otpToken.trim() || !newPassword) {
      setFeedback({ text: '၈ လုံးပါ Code နှင့် စကားဝှက်အသစ်ကို ဖြည့်စွက်ပေးပါ။', isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ text: 'စကားဝှက်အသစ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။', isError: true });
      return;
    }

    setIsSubmittingAuth(true);
    setFeedback(null);
    try {
      const verifyRes = await verifyEmailOtp(email, otpToken, 'recovery');
      if (!verifyRes.success && verifyRes.error) {
        setFeedback({ text: `Code မှားယွင်းပါသည်: ${verifyRes.error}`, isError: true });
        return;
      }

      const updateRes = await updateUserPassword(newPassword);
      if (!updateRes.success && updateRes.error) {
        setFeedback({ text: `စကားဝှက် ပြောင်းလဲ၍ မရပါ: ${updateRes.error}`, isError: true });
      } else {
        setFeedback({
          text: 'စကားဝှက်အသစ် အောင်မြင်စွာ ပြောင်းလဲပြီး ဝင်ရောက်ပါပြီ!',
          isError: false,
        });
        setPassword(newPassword);
        setOtpToken('');
        setNewPassword('');
        setAuthMode('signin');
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Password update failed', isError: true });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Send One-Time Email Login Code (Passwordless OTP)
  const handleSendOtpLogin = async () => {
    if (!email.trim()) {
      setFeedback({ text: 'ကျေးဇူးပြု၍ သင့် Email လိပ်စာကို ထည့်သွင်းပေးပါ။', isError: true });
      return;
    }

    setIsSubmittingAuth(true);
    setFeedback(null);
    try {
      const res = await sendEmailOtp(email);
      if (!res.success && res.error) {
        setFeedback({ text: res.error, isError: true });
      } else {
        setFeedback({
          text: `၈ လုံးပါ Login Code ကို ${email} သို့ ပို့ထားပါပြီ။`,
          isError: false,
        });
        setAuthMode('otp_login');
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'OTP request failed', isError: true });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Verify One-Time Email Login Code
  const handleVerifyOtpLogin = async () => {
    if (!otpToken.trim()) {
      setFeedback({ text: '၈ လုံးပါ Verification Code ကို ထည့်သွင်းပေးပါ။', isError: true });
      return;
    }

    setIsSubmittingAuth(true);
    setFeedback(null);
    try {
      const res = await verifyEmailOtp(email, otpToken, 'email');
      if (!res.success && res.error) {
        // Try fallback with 'signup' type
        const signupFallback = await verifyEmailOtp(email, otpToken, 'signup');
        if (!signupFallback.success && signupFallback.error) {
          setFeedback({ text: `Code မှားယွင်းပါသည်: ${res.error}`, isError: true });
        } else {
          setFeedback({ text: 'Email အောင်မြင်စွာ အတည်ပြုပြီးပါပြီ!', isError: false });
          setOtpToken('');
        }
      } else {
        setFeedback({ text: 'One-Time Code ဖြင့် အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ!', isError: false });
        setOtpToken('');
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'OTP verification failed', isError: true });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmittingAuth(true);
    try {
      await signOut();
      setFeedback({ text: 'အကောင့်မှ ထွက်ပြီးပါပြီ။ Local Offline အနေဖြင့် ဆက်လက်အသုံးပြုနိုင်ပါသည်။', isError: false });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // User metadata resolution
  const userMetadata = user?.user_metadata || {};
  const userName =
    userMetadata.full_name ||
    userMetadata.name ||
    user?.email?.split('@')[0] ||
    'EC Representative';
  const userAvatar = userMetadata.avatar_url || userMetadata.picture || null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 px-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <View className="flex-row items-center space-x-2">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60">
                <Cloud size={20} color="#4f46e5" />
              </View>
              <View className="ml-2.5">
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  အကောင့် & Cloud Sync
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  ဖုန်းနှင့် ကွန်ပျူတာ အချင်းချင်း စာရင်းမျှဝေခြင်း
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full p-1.5 active:bg-slate-100 dark:active:bg-slate-800"
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: Platform.OS === 'web' ? '70vh' : 500 }}
            contentContainerStyle={{ paddingVertical: 12 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Feedback Banner */}
            {feedback ? (
              <View
                className={`mb-3 rounded-2xl p-3.5 ${
                  feedback.isError
                    ? 'bg-rose-50 border border-rose-200 dark:border-rose-800 dark:bg-rose-950/60'
                    : 'bg-emerald-50 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/60'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    feedback.isError
                      ? 'text-rose-800 dark:text-rose-200'
                      : 'text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  {feedback.text}
                </Text>
              </View>
            ) : syncMessage ? (
              <View
                className={`mb-3 rounded-2xl p-3 ${
                  syncStatus === 'error'
                    ? 'bg-rose-50 border border-rose-200 dark:border-rose-800 dark:bg-rose-950/60'
                    : syncStatus === 'synced'
                    ? 'bg-emerald-50 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/60'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    syncStatus === 'error'
                      ? 'text-rose-800 dark:text-rose-200'
                      : syncStatus === 'synced'
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {syncMessage}
                </Text>
              </View>
            ) : null}

            {/* If Authenticated: Show Profile & Sync Status */}
            {user ? (
              <View className="mb-4">
                {/* User Profile Card */}
                <View className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center space-x-3">
                      {userAvatar ? (
                        <Image
                          source={{ uri: userAvatar }}
                          className="h-12 w-12 rounded-full border border-indigo-200"
                        />
                      ) : (
                        <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-600">
                          <Text className="text-base font-bold text-white">
                            {userName.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="ml-3 flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-sm font-bold text-slate-900 dark:text-white">
                            {userName}
                          </Text>
                          <View className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950">
                            <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              Active
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                          {user.email}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleSignOut}
                      disabled={isSubmittingAuth}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 active:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40"
                    >
                      <Text className="text-xs font-bold text-rose-700 dark:text-rose-300">
                        ထွက်မည် (Sign Out)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="mt-3.5 flex-row items-center border-t border-indigo-100/60 pt-3 dark:border-slate-700">
                    <ShieldCheck size={14} color="#059669" />
                    <Text className="ml-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      သင့်အတန်းစာရင်းများကို ဤအကောင့်ထဲသို့ အလိုအလျောက် sync လုပ်နေပါသည်
                    </Text>
                  </View>
                </View>

                {/* Automatic Cloud Sync Status Card */}
                <View className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      {syncStatus === 'syncing' ? (
                        <ActivityIndicator size="small" color="#4f46e5" />
                      ) : (
                        <View className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2" />
                      )}
                      <Text className="ml-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {syncStatus === 'syncing'
                          ? 'အလိုအလျောက် Sync လုပ်နေပါသည်...'
                          : 'အလိုအလျောက် Cloud Sync စနစ်ဖွင့်ထားပါသည်'}
                      </Text>
                    </View>

                    <View className="rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950">
                      <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        Auto Realtime
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    စာရင်းအသစ်များ၊ ငွေပေးချေမှုများနှင့် ပြင်ဆင်ချက်များကို ထည့်သွင်းလိုက်သည်နှင့် ဖုန်းနှင့် ကွန်ပျူတာ အချင်းချင်း အလိုအလျောက် Realtime သိမ်းဆည်းပေးနေပါသည်။ ခလုတ်များ နှိပ်ရန် မလိုအပ်ပါ။
                  </Text>

                  {lastSyncedAt ? (
                    <View className="mt-3 flex-row items-center justify-between border-t border-slate-200/70 pt-2.5 dark:border-slate-700/60">
                      <Text className="text-[11px] text-slate-400">
                        နောက်ဆုံး အလိုအလျောက် sync ပြီးချိန်:
                      </Text>
                      <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {new Date(lastSyncedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : (
              /* If Logged Out: Show Frictionless Google Sign In & Email Form */
              <View className="mb-4">
                {/* Friendly Value Proposition Card */}
                <View className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                  <View className="flex-row items-center">
                    <ShieldCheck size={16} color="#4f46e5" />
                    <Text className="ml-2 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      မည်သည့် Setup မှ ပြုလုပ်ရန် မလိုပါ
                    </Text>
                  </View>
                  <Text className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Google ဖြင့် ၁ ချက်နှိပ် Sign In ဝင်ရုံဖြင့် သင့်အတန်းရန်ပုံငွေစာရင်းများကို
                    ဖုန်း၊ Tablet နှင့် Laptop များအချင်းချင်း အလိုအလျောက် တစ်ပြိုင်နက်
                    သိမ်းဆည်းပေးမည် ဖြစ်ပါသည်။
                  </Text>

                  <View className="mt-3 flex-row items-center space-x-3 text-[11px] text-slate-500">
                    <View className="flex-row items-center mr-3">
                      <Smartphone size={12} color="#6366f1" />
                      <Text className="ml-1 text-[11px] text-slate-500 dark:text-slate-400">Mobile</Text>
                    </View>
                    <View className="flex-row items-center mr-3">
                      <Laptop size={12} color="#6366f1" />
                      <Text className="ml-1 text-[11px] text-slate-500 dark:text-slate-400">Web / Desktop</Text>
                    </View>
                    <View className="flex-row items-center">
                      <ShieldCheck size={12} color="#059669" />
                      <Text className="ml-1 text-[11px] text-emerald-600 dark:text-emerald-400">Encrypted Cloud</Text>
                    </View>
                  </View>
                </View>

                {/* Big Google 1-Tap Sign-In Button */}
                <TouchableOpacity
                  disabled={isSubmittingAuth}
                  onPress={handleGoogleSignIn}
                  className="mb-2 flex-row items-center justify-center rounded-2xl border border-slate-300 bg-white py-3.5 px-4 shadow-sm active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                >
                  {isSubmittingAuth ? (
                    <ActivityIndicator size="small" color="#4f46e5" />
                  ) : (
                    <View className="mr-3 h-5 w-5 items-center justify-center rounded-full bg-red-500">
                      <Text className="text-xs font-black text-white">G</Text>
                    </View>
                  )}
                  <Text className="text-sm font-bold text-slate-800 dark:text-white">
                    Google ဖြင့် ဆက်လက်လုပ်ဆောင်မည် (Continue with Google)
                  </Text>
                </TouchableOpacity>

                {/* Mobile OAuth Callback Helper */}
                {Platform.OS !== 'web' ? (
                  <TouchableOpacity
                    onPress={async () => {
                      const uri = getMobileAuthRedirectUri();
                      await Clipboard.setStringAsync(uri);
                      setFeedback({
                        text: `Callback URI Copied:\n${uri}\n\nAdd this into your Supabase Dashboard > Authentication > URL Configuration > Redirect URLs.`,
                        isError: false,
                      });
                    }}
                    className="mb-3 px-2 py-1 items-center flex-row justify-center"
                  >
                    <Copy size={11} color="#6366f1" />
                    <Text className="ml-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 text-center">
                      Copy Mobile Callback URI for Supabase Allowlist
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Divider */}
                <View className="my-2 flex-row items-center justify-center">
                  <View className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
                  <Text className="mx-3 text-[11px] font-semibold text-slate-400">သို့မဟုတ်</Text>
                  <View className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
                </View>

                {/* Email Sign In / Sign Up Toggle */}
                {!showEmailForm ? (
                  <TouchableOpacity
                    onPress={() => setShowEmailForm(true)}
                    className="flex-row items-center justify-center rounded-xl py-2 active:opacity-75"
                  >
                    <Mail size={14} color="#6366f1" />
                    <Text className="ml-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Email & Password ဖြင့် အသုံးပြုမည်
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    {/* Header / Tab navigation depending on mode */}
                    {authMode === 'signin' || authMode === 'signup' ? (
                      <View className="mb-3 flex-row rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
                        <TouchableOpacity
                          onPress={() => setAuthMode('signin')}
                          className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                            authMode === 'signin' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              authMode === 'signin'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            ဝင်ရောက်မည် (Sign In)
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setAuthMode('signup')}
                          className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                            authMode === 'signup' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              authMode === 'signup'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            အကောင့်အသစ်ဖွင့်မည် (Sign Up)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View className="mb-3 flex-row items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-700">
                        <TouchableOpacity
                          onPress={() => setAuthMode('signin')}
                          className="flex-row items-center"
                        >
                          <ArrowLeft size={16} color="#6366f1" />
                          <Text className="ml-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            နောက်သို့ (Back)
                          </Text>
                        </TouchableOpacity>
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {authMode === 'forgot'
                            ? 'စကားဝှက်မေ့နေပါက'
                            : authMode === 'verify_recovery'
                            ? 'စကားဝှက်အသစ်သတ်မှတ်ခြင်း'
                            : 'Email OTP ဖြင့် ဝင်မည်'}
                        </Text>
                      </View>
                    )}

                    {/* Form for Sign In or Sign Up */}
                    {(authMode === 'signin' || authMode === 'signup') && (
                      <View>
                        {authMode === 'signup' && (
                          <View className="mb-2.5">
                            <Text className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              အမည် (Full Name)
                            </Text>
                            <TextInput
                              placeholder="မောင်မောင် (EC)"
                              placeholderTextColor="#94a3b8"
                              value={displayName}
                              onChangeText={setDisplayName}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                          </View>
                        )}

                        <View className="mb-2.5">
                          <Text className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Email လိပ်စာ
                          </Text>
                          <TextInput
                            placeholder="ec.class@gmail.com"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </View>

                        <View className="mb-3">
                          <View className="mb-1 flex-row items-center justify-between">
                            <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              စကားဝှက် (Password)
                            </Text>
                            {authMode === 'signin' && (
                              <TouchableOpacity onPress={() => setAuthMode('forgot')}>
                                <Text className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                  စကားဝှက်မေ့နေပါသလား?
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <TextInput
                            secureTextEntry
                            placeholder="••••••••"
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                            value={password}
                            onChangeText={setPassword}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </View>

                        <TouchableOpacity
                          disabled={isSubmittingAuth}
                          onPress={handleEmailAuthSubmit}
                          className="flex-row items-center justify-center rounded-xl bg-indigo-600 py-2.5 active:bg-indigo-700"
                        >
                          {isSubmittingAuth ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <LogIn size={15} color="#ffffff" />
                          )}
                          <Text className="ml-1.5 text-xs font-bold text-white">
                            {authMode === 'signin' ? 'Sign In ဝင်မည်' : 'အကောင့်သစ်ဖွင့်မည်'}
                          </Text>
                        </TouchableOpacity>

                        {/* Extra helper links */}
                        <View className="mt-3 flex-row items-center justify-between border-t border-slate-200 pt-2.5 dark:border-slate-700">
                          <TouchableOpacity
                            onPress={() => setAuthMode('otp_login')}
                            className="flex-row items-center"
                          >
                            <KeyRound size={13} color="#6366f1" />
                            <Text className="ml-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                              ၈ လုံးပါ OTP Code ဖြင့် ဝင်မည်
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity onPress={() => setShowEmailForm(false)}>
                            <Text className="text-[11px] text-slate-400">ပိတ်မည် (Close)</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Mode: Forgot Password (Request 8-digit Recovery Code) */}
                    {authMode === 'forgot' && (
                      <View>
                        <Text className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          သင့်အကောင့်ဖွင့်ထားသော Email လိပ်စာကို ထည့်ပါ။ စကားဝှက် ပြင်ဆင်ရန် ၈ လုံးပါ Recovery Code ပို့ပေးပါမည်။
                        </Text>

                        <View className="mb-3">
                          <Text className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Email လိပ်စာ
                          </Text>
                          <TextInput
                            placeholder="ec.class@gmail.com"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </View>

                        <TouchableOpacity
                          disabled={isSubmittingAuth}
                          onPress={handleRequestPasswordReset}
                          className="flex-row items-center justify-center rounded-xl bg-indigo-600 py-2.5 active:bg-indigo-700"
                        >
                          {isSubmittingAuth ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Send size={14} color="#ffffff" />
                          )}
                          <Text className="ml-1.5 text-xs font-bold text-white">
                            Recovery Code (၈ လုံး) ပို့ပါ
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setAuthMode('verify_recovery')}
                          className="mt-3 items-center py-1"
                        >
                          <Text className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                            ကုဒ် ၈ လုံး ရရှိထားပြီးဖြစ်ပါက ဤနေရာကို နှိပ်ပါ
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Mode: Verify Recovery Code & Set New Password */}
                    {authMode === 'verify_recovery' && (
                      <View>
                        <Text className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          သင့် Email သို့ ရောက်ရှိလာသော ၈ လုံးပါ Code နှင့် စကားဝှက်အသစ်ကို ထည့်သွင်းပေးပါ။
                        </Text>

                        <View className="mb-2.5">
                          <Text className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Email လိပ်စာ
                          </Text>
                          <TextInput
                            placeholder="ec.class@gmail.com"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </View>

                        <View className="mb-2.5">
                          <Text className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            ၈ လုံးပါ Recovery Code (OTP)
                          </Text>
                          <TextInput
                            placeholder="12345678"
                            placeholderTextColor="#94a3b8"
                            keyboardType="number-pad"
                            autoComplete="one-time-code"
                            textContentType="oneTimeCode"
                            maxLength={8}
                            value={otpToken}
                            onChangeText={setOtpToken}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-bold tracking-widest text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </View>

                        <View className="mb-3.5">
                          <Text className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            စကားဝှက်အသစ် (New Password)
                          </Text>
                          <TextInput
                            secureTextEntry
                            placeholder="အနည်းဆုံး ၆ လုံး"
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </View>

                        <TouchableOpacity
                          disabled={isSubmittingAuth}
                          onPress={handleConfirmNewPassword}
                          className="flex-row items-center justify-center rounded-xl bg-indigo-600 py-2.5 active:bg-indigo-700"
                        >
                          {isSubmittingAuth ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Lock size={14} color="#ffffff" />
                          )}
                          <Text className="ml-1.5 text-xs font-bold text-white">
                            စကားဝှက်အသစ် သိမ်းဆည်းပြီး ဝင်မည်
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Mode: One-Time Email Code Login / Verification */}
                    {authMode === 'otp_login' && (
                      <View>
                        <Text className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          Password မလိုဘဲ Email သို့ ပေးပို့သော ၈ လုံးပါ Code ဖြင့် အတည်ပြု ဝင်ရောက်နိုင်ပါသည်။ (Sign Up အပြီး Email အတည်ပြုရန်အတွက်လည်း အသုံးပြုနိုင်ပါသည်)
                        </Text>

                        <View className="mb-2.5">
                          <Text className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Email လိပ်စာ
                          </Text>
                          <View className="flex-row items-center space-x-2">
                            <TextInput
                              placeholder="ec.class@gmail.com"
                              placeholderTextColor="#94a3b8"
                              keyboardType="email-address"
                              autoCapitalize="none"
                              value={email}
                              onChangeText={setEmail}
                              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                            <TouchableOpacity
                              disabled={isSubmittingAuth}
                              onPress={handleSendOtpLogin}
                              className="rounded-xl bg-slate-200 px-3 py-2 dark:bg-slate-700"
                            >
                              <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                Code ပို့ပါ
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View className="mb-3.5">
                          <Text className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            ၈ လုံးပါ One-Time Code
                          </Text>
                          <TextInput
                            placeholder="12345678"
                            placeholderTextColor="#94a3b8"
                            keyboardType="number-pad"
                            autoComplete="one-time-code"
                            textContentType="oneTimeCode"
                            maxLength={8}
                            value={otpToken}
                            onChangeText={setOtpToken}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-bold tracking-widest text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </View>

                        <TouchableOpacity
                          disabled={isSubmittingAuth}
                          onPress={handleVerifyOtpLogin}
                          className="flex-row items-center justify-center rounded-xl bg-indigo-600 py-2.5 active:bg-indigo-700"
                        >
                          {isSubmittingAuth ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <KeyRound size={14} color="#ffffff" />
                          )}
                          <Text className="ml-1.5 text-xs font-bold text-white">
                            Code အတည်ပြုပြီး ဝင်မည်
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Offline Mode Note */}
            <View className="mb-1 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/40">
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                💡 အကောင့်မဝင်ဘဲ Offline သာ အသုံးပြုလိုပါက စာရင်းများကို ဖုန်း/ကွန်ပျူတာ
                စက်ထဲတွင်သာ သိမ်းဆည်းထားမည် ဖြစ်ပါသည်။ Cloud သို့ သိမ်းဆည်းရန်သာ အကောင့်ဝင်ရန် လိုအပ်ပါသည်။
              </Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
