import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Cloud,
  Copy,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  Send,
  User as UserIcon,
  X,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAppTheme, useTreasury } from '../context/TreasuryContext';
import { getMobileAuthRedirectUri } from '../storage/supabase';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';

interface CloudSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ visible, onClose }) => {
  const { isDark } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
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
    syncNow,
    themeColor,
    language,
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
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showDevCallback, setShowDevCallback] = useState(false);

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
            text: language === 'en' ? 'Connected with Google account!' : 'Google ဖြင့် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ!',
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
      setFeedback({
        text: language === 'en' ? 'Please fill in email and password.' : 'Email နှင့် Password ကို ဖြည့်စွက်ပေးပါ။',
        isError: true,
      });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        text: language === 'en' ? 'Password must be at least 6 characters.' : 'Password သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။',
        isError: true,
      });
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
          setFeedback({
            text: language === 'en' ? 'Signed in successfully!' : 'အောင်မြင်စွာ အကောင့်ဝင်ရောက်ပြီးပါပြီ!',
            isError: false,
          });
        }
      } else {
        const res = await signUpWithEmail(email, password, displayName);
        if (!res.success && res.error) {
          setFeedback({ text: res.error, isError: true });
        } else if (res.requiresEmailConfirmation) {
          setFeedback({
            text: language === 'en' ? 'Account created. Please check your email for the verification code.' : 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ Email ထဲရှိ Code ဖြင့် အတည်ပြုပေးပါ။',
            isError: false,
          });
          setAuthMode('otp_login');
        } else {
          setFeedback({
            text: language === 'en' ? 'Account created and signed in!' : 'အကောင့်အသစ် ဖွင့်လှစ်ပြီး ဝင်ရောက်ပါပြီ!',
            isError: false,
          });
        }
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Authentication error', isError: true });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Forgot Password - Request Reset Code
  const handleRequestPasswordReset = async () => {
    if (!email.trim()) {
      setFeedback({
        text: language === 'en' ? 'Please enter your email.' : 'ကျေးဇူးပြု၍ Email လိပ်စာ ထည့်သွင်းပေးပါ။',
        isError: true,
      });
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
          text: language === 'en' ? `Reset code sent to ${email}.` : `စကားဝှက် ပြင်ဆင်ရန် ကုဒ်ကို ${email} သို့ ပို့ထားပါပြီ။`,
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
      setFeedback({
        text: language === 'en' ? 'Please fill in code and new password.' : 'ကုဒ်နှင့် စကားဝှက်အသစ်ကို ဖြည့်စွက်ပေးပါ။',
        isError: true,
      });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({
        text: language === 'en' ? 'Password must be at least 6 characters.' : 'စကားဝှက်အသစ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။',
        isError: true,
      });
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
          text: language === 'en' ? 'Password updated successfully!' : 'စကားဝှက်အသစ် အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ!',
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

  // Handle Send One-Time Email Login Code
  const handleSendOtpLogin = async () => {
    if (!email.trim()) {
      setFeedback({
        text: language === 'en' ? 'Please enter your email.' : 'ကျေးဇူးပြု၍ Email လိပ်စာ ထည့်သွင်းပေးပါ။',
        isError: true,
      });
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
          text: language === 'en' ? `Login code sent to ${email}.` : `Login Code ကို ${email} သို့ ပို့ထားပါပြီ။`,
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
      setFeedback({
        text: language === 'en' ? 'Please enter the verification code.' : 'Verification Code ကို ထည့်သွင်းပေးပါ။',
        isError: true,
      });
      return;
    }

    setIsSubmittingAuth(true);
    setFeedback(null);
    try {
      const res = await verifyEmailOtp(email, otpToken, 'email');
      if (!res.success && res.error) {
        const signupFallback = await verifyEmailOtp(email, otpToken, 'signup');
        if (!signupFallback.success && signupFallback.error) {
          setFeedback({ text: `Code မှားယွင်းပါသည်: ${res.error}`, isError: true });
        } else {
          setFeedback({
            text: language === 'en' ? 'Email verified successfully!' : 'Email အောင်မြင်စွာ အတည်ပြုပြီးပါပြီ!',
            isError: false,
          });
          setOtpToken('');
        }
      } else {
        setFeedback({
          text: language === 'en' ? 'Signed in with OTP code!' : 'One-Time Code ဖြင့် အောင်မြင်စွာ ဝင်ရောက်ပါပြီ!',
          isError: false,
        });
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
      setFeedback({
        text: language === 'en' ? 'Signed out. Working in local offline mode.' : 'အကောင့်မှ ထွက်ပြီးပါပြီ။ Local အနေဖြင့် ဆက်လက်အသုံးပြုနိုင်ပါသည်။',
        isError: false,
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await syncNow();
    } finally {
      setIsManualSyncing(false);
    }
  };

  // User metadata resolution
  const userMetadata = user?.user_metadata || {};
  const userName =
    userMetadata.full_name ||
    userMetadata.name ||
    user?.email?.split('@')[0] ||
    'EC Member';
  const userAvatar = userMetadata.avatar_url || userMetadata.picture || null;

  const formattedTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <DragDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeight={windowHeight * 0.9}
      isDark={isDark}
    >
      {/* Header - Unified with app sheet design */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: themeColor.surface }}
            className="h-10 w-10 rounded-full items-center justify-center mr-3"
          >
            <NativeIcon
              sfSymbol="icloud.fill"
              materialName="cloud"
              FallbackIcon={Cloud}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {language === 'en' ? 'Cloud Sync' : 'အကောင့် & Cloud Sync'}
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

      <ScrollView
        style={{ maxHeight: Platform.OS === 'web' ? '70vh' : 520 }}
        contentContainerStyle={{ paddingVertical: 4 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Feedback / Alert */}
        {feedback && (
          <View
            className={`mb-3 rounded-2xl p-3 flex-row items-center ${
              feedback.isError
                ? 'bg-rose-50 border border-rose-200 dark:border-rose-900/60 dark:bg-rose-950/40'
                : 'bg-emerald-50 border border-emerald-200 dark:border-emerald-900/60 dark:bg-emerald-950/40'
            }`}
          >
            {feedback.isError ? (
              <AlertCircle size={16} color="#e11d48" className="mr-2" />
            ) : (
              <CheckCircle2 size={16} color="#059669" className="mr-2" />
            )}
            <Text
              className={`text-xs font-medium flex-1 ml-2 ${
                feedback.isError
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {feedback.text}
            </Text>
          </View>
        )}

        {/* ============================================================ */}
        {/* AUTHENTICATED: Consolidated Single Card                      */}
        {/* ============================================================ */}
        {user ? (
          <View className="mb-4">
            <View className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              {/* Profile Row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                  {userAvatar ? (
                    <Image
                      source={{ uri: userAvatar }}
                      className="h-11 w-11 rounded-full border border-zinc-200 dark:border-zinc-700"
                    />
                  ) : (
                    <View
                      style={{ backgroundColor: themeColor.primary }}
                      className="h-11 w-11 items-center justify-center rounded-full"
                    >
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="text-sm font-bold"
                      >
                        {userName.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="ml-3 flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
                    >
                      {userName}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
                    >
                      {user.email}
                    </Text>
                  </View>
                </View>

                {/* Sign Out Button */}
                <PressableScale
                  onPress={handleSignOut}
                  disabled={isSubmittingAuth}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80"
                >
                  <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {language === 'en' ? 'Sign Out' : 'ထွက်မည်'}
                  </Text>
                </PressableScale>
              </View>

              {/* Status & Sync Row */}
              <View className="mt-3.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-700/60 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  {syncStatus === 'syncing' || isManualSyncing ? (
                    <ActivityIndicator size="small" color={themeColor.primary} className="mr-2" />
                  ) : (
                    <View className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2" />
                  )}
                  <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {syncStatus === 'syncing' || isManualSyncing
                      ? language === 'en'
                        ? 'Syncing...'
                        : 'Sync လုပ်နေပါသည်...'
                      : language === 'en'
                      ? 'Live Cloud Sync'
                      : 'Cloud Sync ချိတ်ဆက်ထားသည်'}
                  </Text>
                  {formattedTime ? (
                    <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 ml-1.5">
                      • {formattedTime}
                    </Text>
                  ) : null}
                </View>

                <PressableScale
                  onPress={handleManualSync}
                  disabled={syncStatus === 'syncing' || isManualSyncing}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                  className="flex-row items-center"
                >
                  <RefreshCw
                    size={13}
                    color={themeColor.primary}
                    className={syncStatus === 'syncing' || isManualSyncing ? 'animate-spin' : ''}
                  />
                  <Text
                    style={{ color: themeColor.primary }}
                    className="ml-1 text-[11px] font-semibold"
                  >
                    {language === 'en' ? 'Sync' : 'ပြန်ချိန်မည်'}
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        ) : (
          /* ============================================================ */
          /* LOGGED OUT: Clean, Punchy 1-Action Auth Flow                 */
          /* ============================================================ */
          <View className="mb-4">
            {/* Simple Value Proposition (1 concise sentence) */}
            <View className="mb-4 rounded-2xl bg-zinc-50 p-4 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800/40">
              <Text className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                {language === 'en'
                  ? 'Sign in to automatically sync attendance and fund records across your phone and PC in realtime.'
                  : 'Google အကောင့်ဖြင့် ဝင်ရောက်ထားပါက ဖုန်းနှင့် ကွန်ပျူတာ အချင်းချင်း စာရင်းများကို အလိုအလျောက် Realtime သိမ်းဆည်းပေးပါမည်။'}
              </Text>
            </View>

            {/* Google 1-Tap Sign-In Button */}
            <PressableScale
              disabled={isSubmittingAuth}
              onPress={handleGoogleSignIn}
              style={{
                borderRadius: 16,
              }}
              className="mb-3 flex-row items-center justify-center border border-zinc-300 bg-white py-3.5 px-4 shadow-sm active:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
            >
              {isSubmittingAuth ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <View className="mr-2.5 h-5 w-5 items-center justify-center rounded-full bg-red-500">
                  <Text className="text-xs font-black text-white">G</Text>
                </View>
              )}
              <Text className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {language === 'en'
                  ? 'Continue with Google'
                  : 'Google ဖြင့် ဆက်လက်လုပ်ဆောင်မည်'}
              </Text>
            </PressableScale>

            {/* Email Form Toggle or Divider */}
            {!showEmailForm ? (
              <View className="items-center mt-1">
                <TouchableOpacity
                  onPress={() => setShowEmailForm(true)}
                  className="py-2 active:opacity-75"
                >
                  <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {language === 'en'
                      ? 'Or use Email & Password'
                      : 'သို့မဟုတ် Email ဖြင့် ဝင်မည်'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mt-1 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                {/* Auth Mode Tabs */}
                {authMode === 'signin' || authMode === 'signup' ? (
                  <View className="mb-3 flex-row rounded-xl bg-zinc-200/70 p-1 dark:bg-zinc-800">
                    <TouchableOpacity
                      onPress={() => setAuthMode('signin')}
                      className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                        authMode === 'signin' ? 'bg-white shadow-sm dark:bg-zinc-900' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          authMode === 'signin'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {language === 'en' ? 'Sign In' : 'ဝင်ရောက်မည်'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setAuthMode('signup')}
                      className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                        authMode === 'signup' ? 'bg-white shadow-sm dark:bg-zinc-900' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          authMode === 'signup'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {language === 'en' ? 'Sign Up' : 'အကောင့်ဖွင့်မည်'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="mb-3 flex-row items-center justify-between border-b border-zinc-200 pb-2.5 dark:border-zinc-700">
                    <TouchableOpacity
                      onPress={() => setAuthMode('signin')}
                      className="flex-row items-center"
                    >
                      <ArrowLeft size={16} color="#6366f1" />
                      <Text className="ml-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {language === 'en' ? 'Back' : 'နောက်သို့'}
                      </Text>
                    </TouchableOpacity>
                    <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      {authMode === 'forgot'
                        ? 'စကားဝှက်မေ့နေပါက'
                        : authMode === 'verify_recovery'
                        ? 'စကားဝှက်အသစ်သတ်မှတ်ခြင်း'
                        : 'Email OTP'}
                    </Text>
                  </View>
                )}

                {/* Form Fields for Sign In or Sign Up */}
                {(authMode === 'signin' || authMode === 'signup') && (
                  <View>
                    {authMode === 'signup' && (
                      <View className="mb-2.5">
                        <Text className="mb-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          {language === 'en' ? 'Full Name' : 'အမည်'}
                        </Text>
                        <TextInput
                          placeholder="Ko Ko"
                          placeholderTextColor="#94a3b8"
                          value={displayName}
                          onChangeText={setDisplayName}
                          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                        />
                      </View>
                    )}

                    <View className="mb-2.5">
                      <Text className="mb-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        Email
                      </Text>
                      <TextInput
                        placeholder="ec.class@gmail.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                    </View>

                    <View className="mb-3">
                      <View className="mb-1 flex-row items-center justify-between">
                        <Text className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          {language === 'en' ? 'Password' : 'စကားဝှက်'}
                        </Text>
                        {authMode === 'signin' && (
                          <TouchableOpacity onPress={() => setAuthMode('forgot')}>
                            <Text className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                              {language === 'en' ? 'Forgot?' : 'မေ့နေပါသလား?'}
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
                        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                    </View>

                    <PressableScale
                      disabled={isSubmittingAuth}
                      onPress={handleEmailAuthSubmit}
                      style={{
                        backgroundColor: themeColor.primary,
                        borderRadius: 12,
                      }}
                      className="flex-row items-center justify-center py-2.5"
                    >
                      {isSubmittingAuth ? (
                        <ActivityIndicator size="small" color={themeColor.onPrimary} />
                      ) : (
                        <LogIn size={15} color={themeColor.onPrimary} />
                      )}
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="ml-1.5 text-xs font-bold"
                      >
                        {authMode === 'signin'
                          ? language === 'en'
                            ? 'Sign In'
                            : 'Sign In ဝင်မည်'
                          : language === 'en'
                          ? 'Sign Up'
                          : 'အကောင့်ဖွင့်မည်'}
                      </Text>
                    </PressableScale>

                    <View className="mt-3 flex-row items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
                      <TouchableOpacity
                        onPress={() => setAuthMode('otp_login')}
                        className="flex-row items-center"
                      >
                        <KeyRound size={12} color="#6366f1" />
                        <Text className="ml-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                          {language === 'en' ? 'Login with OTP code' : 'OTP Code ဖြင့် ဝင်မည်'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => setShowEmailForm(false)}>
                        <Text className="text-[11px] text-zinc-400">
                          {language === 'en' ? 'Cancel' : 'ပိတ်မည်'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Forgot Password Mode */}
                {authMode === 'forgot' && (
                  <View>
                    <Text className="mb-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {language === 'en'
                        ? 'Enter your email to receive an 8-digit password reset code.'
                        : 'စကားဝှက် ပြင်ဆင်ရန် Email သို့ ၈ လုံးပါ Recovery Code ပို့ပေးပါမည်။'}
                    </Text>

                    <View className="mb-3">
                      <Text className="mb-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                        Email
                      </Text>
                      <TextInput
                        placeholder="ec.class@gmail.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                    </View>

                    <PressableScale
                      disabled={isSubmittingAuth}
                      onPress={handleRequestPasswordReset}
                      style={{
                        backgroundColor: themeColor.primary,
                        borderRadius: 12,
                      }}
                      className="flex-row items-center justify-center py-2.5"
                    >
                      {isSubmittingAuth ? (
                        <ActivityIndicator size="small" color={themeColor.onPrimary} />
                      ) : (
                        <Send size={14} color={themeColor.onPrimary} />
                      )}
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="ml-1.5 text-xs font-bold"
                      >
                        {language === 'en' ? 'Send Code' : 'Recovery Code ပို့ပါ'}
                      </Text>
                    </PressableScale>

                    <TouchableOpacity
                      onPress={() => setAuthMode('verify_recovery')}
                      className="mt-2.5 items-center py-1"
                    >
                      <Text className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                        {language === 'en'
                          ? 'Already have the 8-digit code?'
                          : 'ကုဒ် ၈ လုံး ရရှိထားပြီးဖြစ်ပါက နှိပ်ပါ'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Verify Recovery Code Mode */}
                {authMode === 'verify_recovery' && (
                  <View>
                    <Text className="mb-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {language === 'en'
                        ? 'Enter the 8-digit code and your new password.'
                        : 'Email ထဲရှိ ၈ လုံးပါ Code နှင့် စကားဝှက်အသစ်ကို ထည့်သွင်းပေးပါ။'}
                    </Text>

                    <View className="mb-2">
                      <TextInput
                        placeholder="Email"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                    </View>

                    <View className="mb-2">
                      <TextInput
                        placeholder="8-digit Code"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        maxLength={8}
                        value={otpToken}
                        onChangeText={setOtpToken}
                        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-bold tracking-widest text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                    </View>

                    <View className="mb-3">
                      <TextInput
                        secureTextEntry
                        placeholder={language === 'en' ? 'New Password' : 'စကားဝှက်အသစ်'}
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                    </View>

                    <PressableScale
                      disabled={isSubmittingAuth}
                      onPress={handleConfirmNewPassword}
                      style={{
                        backgroundColor: themeColor.primary,
                        borderRadius: 12,
                      }}
                      className="flex-row items-center justify-center py-2.5"
                    >
                      {isSubmittingAuth ? (
                        <ActivityIndicator size="small" color={themeColor.onPrimary} />
                      ) : (
                        <Lock size={14} color={themeColor.onPrimary} />
                      )}
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="ml-1.5 text-xs font-bold"
                      >
                        {language === 'en' ? 'Save New Password' : 'စကားဝှက်အသစ် သိမ်းဆည်းမည်'}
                      </Text>
                    </PressableScale>
                  </View>
                )}

                {/* OTP Login Mode */}
                {authMode === 'otp_login' && (
                  <View>
                    <Text className="mb-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {language === 'en'
                        ? 'Sign in using the 8-digit OTP code sent to your email.'
                        : 'Email သို့ ပို့ပေးသော ၈ လုံးပါ Code ဖြင့် အတည်ပြု ဝင်ရောက်နိုင်ပါသည်။'}
                    </Text>

                    <View className="mb-2 flex-row items-center space-x-2">
                      <TextInput
                        placeholder="Email"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                      <TouchableOpacity
                        disabled={isSubmittingAuth}
                        onPress={handleSendOtpLogin}
                        className="rounded-xl bg-zinc-200 px-3 py-2 dark:bg-zinc-700 ml-2"
                      >
                        <Text className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                          {language === 'en' ? 'Send' : 'ကုဒ်ပို့ပါ'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View className="mb-3">
                      <TextInput
                        placeholder="8-digit Code"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        maxLength={8}
                        value={otpToken}
                        onChangeText={setOtpToken}
                        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-bold tracking-widest text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      />
                    </View>

                    <PressableScale
                      disabled={isSubmittingAuth}
                      onPress={handleVerifyOtpLogin}
                      style={{
                        backgroundColor: themeColor.primary,
                        borderRadius: 12,
                      }}
                      className="flex-row items-center justify-center py-2.5"
                    >
                      {isSubmittingAuth ? (
                        <ActivityIndicator size="small" color={themeColor.onPrimary} />
                      ) : (
                        <KeyRound size={14} color={themeColor.onPrimary} />
                      )}
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="ml-1.5 text-xs font-bold"
                      >
                        {language === 'en' ? 'Verify & Sign In' : 'အတည်ပြုပြီး ဝင်မည်'}
                      </Text>
                    </PressableScale>
                  </View>
                )}
              </View>
            )}

            {/* Offline Mode Note (Only shown when logged out, single concise line) */}
            <View className="mt-3 rounded-xl bg-zinc-50 px-3.5 py-2.5 dark:bg-zinc-800/40">
              <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                {language === 'en'
                  ? '💡 Without sign-in, all records remain saved offline on this device only.'
                  : '💡 အကောင့်မဝင်ဘဲ အော့ဖ်လိုင်းအသုံးပြုပါက စာရင်းများကို ဤစက်ထဲတွင်သာ သိမ်းဆည်းပါမည်။'}
              </Text>
            </View>

            {/* Collapsed Developer Helper for Mobile OAuth Callback (if on native mobile) */}
            {Platform.OS !== 'web' ? (
              <View className="mt-2 items-center">
                <TouchableOpacity
                  onPress={() => setShowDevCallback(!showDevCallback)}
                  className="py-1"
                >
                  <Text className="text-[10px] text-zinc-400 underline">
                    {showDevCallback ? 'Hide Redirect URI' : 'Mobile OAuth Config URI'}
                  </Text>
                </TouchableOpacity>

                {showDevCallback && (
                  <TouchableOpacity
                    onPress={async () => {
                      const uri = getMobileAuthRedirectUri();
                      await Clipboard.setStringAsync(uri);
                      setFeedback({
                        text: `Callback URI Copied:\n${uri}`,
                        isError: false,
                      });
                    }}
                    className="mt-1 flex-row items-center rounded-lg bg-zinc-100 px-2 py-1 dark:bg-zinc-800"
                  >
                    <Copy size={11} color="#6366f1" />
                    <Text className="ml-1 text-[10px] text-indigo-600 dark:text-indigo-400">
                      Copy Redirect URI
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </DragDismissSheet>
  );
};

