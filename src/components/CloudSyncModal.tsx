import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Cloud,
  Copy,
  KeyRound,
  Lock,
  LogIn,
  RefreshCw,
  Send,
  X,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { getMobileAuthRedirectUri } from '@/src/storage/supabase';
import { fonts } from '@/src/theme';
import { AnimatedSegmentedControl } from './animated/AnimatedSegmentedControl';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';
import { StatusPill } from './StatusPill';

export interface CloudSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDark, themeColor, palette } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendEmailOtp,
    verifyEmailOtp,
    resetPasswordForEmail,
    updateUserPassword,
    signOut,
    syncStatus,
    isOnline,
    hasPendingSync,
    lastSyncedAt,
    syncNow,
    language,
    t,
  } = useTreasury();

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

  const [feedback, setFeedback] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setFeedback(null);
    }
  }, [visible]);

  const handleGoogleSignIn = async () => {
    setIsSubmittingAuth(true);
    setFeedback(null);
    try {
      const res = await signInWithGoogle();
      if (!res.success && res.error) {
        setFeedback({ text: res.error, isError: true });
      } else if (Platform.OS !== 'web') {
        setFeedback({
          text:
            language === 'en'
              ? 'Connected with Google account!'
              : 'Google ဖြင့် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ!',
          isError: false,
        });
      }
    } catch (err: any) {
      setFeedback({
        text: err.message || 'Google sign-in failed',
        isError: true,
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleEmailAuthSubmit = async () => {
    if (!email.trim() || !password) {
      setFeedback({
        text:
          language === 'en'
            ? 'Please fill in email and password.'
            : 'Email နှင့် Password ကို ဖြည့်စွက်ပေးပါ။',
        isError: true,
      });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        text:
          language === 'en'
            ? 'Password must be at least 6 characters.'
            : 'Password သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။',
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
            text:
              language === 'en'
                ? 'Signed in successfully!'
                : 'အောင်မြင်စွာ အကောင့်ဝင်ရောက်ပြီးပါပြီ!',
            isError: false,
          });
        }
      } else {
        const res = await signUpWithEmail(email, password, displayName);
        if (!res.success && res.error) {
          setFeedback({ text: res.error, isError: true });
        } else if (res.requiresEmailConfirmation) {
          setFeedback({
            text:
              language === 'en'
                ? 'Account created. Please check your email for the verification code.'
                : 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ Email ထဲရှိ Code ဖြင့် အတည်ပြုပေးပါ။',
            isError: false,
          });
          setAuthMode('otp_login');
        } else {
          setFeedback({
            text:
              language === 'en'
                ? 'Account created and signed in!'
                : 'အကောင့်အသစ် ဖွင့်လှစ်ပြီး ဝင်ရောက်ပါပြီ!',
            isError: false,
          });
        }
      }
    } catch (err: any) {
      setFeedback({
        text: err.message || 'Authentication error',
        isError: true,
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!email.trim()) {
      setFeedback({
        text:
          language === 'en'
            ? 'Please enter your email.'
            : 'ကျေးဇူးပြု၍ Email လိပ်စာ ထည့်သွင်းပေးပါ။',
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
          text:
            language === 'en'
              ? `Reset code sent to ${email}.`
              : `စကားဝှက် ပြင်ဆင်ရန် ကုဒ်ကို ${email} သို့ ပို့ထားပါပြီ။`,
          isError: false,
        });
        setAuthMode('verify_recovery');
      }
    } catch (err: any) {
      setFeedback({
        text: err.message || 'Password reset request failed',
        isError: true,
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleConfirmNewPassword = async () => {
    if (!otpToken.trim() || !newPassword) {
      setFeedback({
        text:
          language === 'en'
            ? 'Please fill in code and new password.'
            : 'ကုဒ်နှင့် စကားဝှက်အသစ်ကို ဖြည့်စွက်ပေးပါ။',
        isError: true,
      });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({
        text:
          language === 'en'
            ? 'Password must be at least 6 characters.'
            : 'စကားဝှက်အသစ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။',
        isError: true,
      });
      return;
    }

    setIsSubmittingAuth(true);
    setFeedback(null);
    try {
      const verifyRes = await verifyEmailOtp(email, otpToken, 'recovery');
      if (!verifyRes.success && verifyRes.error) {
        setFeedback({
          text: `Code မှားယွင်းပါသည်: ${verifyRes.error}`,
          isError: true,
        });
        return;
      }

      const updateRes = await updateUserPassword(newPassword);
      if (!updateRes.success && updateRes.error) {
        setFeedback({
          text: `စကားဝှက် ပြောင်းလဲ၍ မရပါ: ${updateRes.error}`,
          isError: true,
        });
      } else {
        setFeedback({
          text:
            language === 'en'
              ? 'Password updated successfully!'
              : 'စကားဝှက်အသစ် အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ!',
          isError: false,
        });
        setPassword(newPassword);
        setOtpToken('');
        setNewPassword('');
        setAuthMode('signin');
      }
    } catch (err: any) {
      setFeedback({
        text: err.message || 'Password update failed',
        isError: true,
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSendOtpLogin = async () => {
    if (!email.trim()) {
      setFeedback({
        text:
          language === 'en'
            ? 'Please enter your email.'
            : 'ကျေးဇူးပြု၍ Email လိပ်စာ ထည့်သွင်းပေးပါ။',
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
          text:
            language === 'en'
              ? `Login code sent to ${email}.`
              : `Login Code ကို ${email} သို့ ပို့ထားပါပြီ။`,
          isError: false,
        });
        setAuthMode('otp_login');
      }
    } catch (err: any) {
      setFeedback({
        text: err.message || 'OTP request failed',
        isError: true,
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleVerifyOtpLogin = async () => {
    if (!otpToken.trim()) {
      setFeedback({
        text:
          language === 'en'
            ? 'Please enter the verification code.'
            : 'Verification Code ကို ထည့်သွင်းပေးပါ။',
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
          setFeedback({
            text: `Code မှားယွင်းပါသည်: ${res.error}`,
            isError: true,
          });
        } else {
          setFeedback({
            text:
              language === 'en'
                ? 'Email verified successfully!'
                : 'Email အောင်မြင်စွာ အတည်ပြုပြီးပါပြီ!',
            isError: false,
          });
          setOtpToken('');
        }
      } else {
        setFeedback({
          text:
            language === 'en'
              ? 'Signed in with OTP code!'
              : 'One-Time Code ဖြင့် အောင်မြင်စွာ ဝင်ရောက်ပါပြီ!',
          isError: false,
        });
        setOtpToken('');
      }
    } catch (err: any) {
      setFeedback({
        text: err.message || 'OTP verification failed',
        isError: true,
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmittingAuth(true);
    try {
      await signOut();
      setFeedback({
        text:
          language === 'en'
            ? 'Signed out. Working in local offline mode.'
            : 'အကောင့်မှ ထွက်ပြီးပါပြီ။ Local အနေဖြင့် ဆက်လက်အသုံးပြုနိုင်ပါသည်။',
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

  const webOutlineStyle =
    Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

  return (
    <DragDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeight={windowHeight * 0.9}
      isDark={isDark}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="icloud.fill"
              materialName="cloud"
              FallbackIcon={Cloud}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <Text
            style={[
              styles.title,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {language === 'en' ? 'Cloud Sync' : 'အကောင့် & Cloud Sync'}
          </Text>
        </View>
        <PressableScale
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          style={[styles.closeButton, { backgroundColor: palette.surface }]}
        >
          <NativeIcon
            sfSymbol="xmark"
            materialName="close"
            FallbackIcon={X}
            size={16}
            color={palette.subtle}
          />
        </PressableScale>
      </View>

      <ScrollView
        style={{ maxHeight: Platform.OS === 'web' ? ('70vh' as any) : 520 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {feedback ? (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: feedback.isError
                  ? palette.dangerBg
                  : palette.paidBg,
                borderColor: feedback.isError
                  ? palette.line
                  : themeColor.border,
              },
            ]}
          >
            {feedback.isError ? (
              <AlertCircle size={16} color={palette.dangerText} />
            ) : (
              <CheckCircle2 size={16} color={palette.paidText} />
            )}
            <Text
              style={[
                styles.feedbackText,
                {
                  color: feedback.isError
                    ? palette.dangerText
                    : palette.paidText,
                  fontFamily: fonts.medium,
                },
              ]}
            >
              {feedback.text}
            </Text>
          </View>
        ) : null}

        {user ? (
          <View style={styles.mb12}>
            <View
              style={[
                styles.authCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.line,
                },
              ]}
            >
              <View style={styles.profileRow}>
                <View style={styles.profileLeft}>
                  {userAvatar ? (
                    <Image
                      source={{ uri: userAvatar }}
                      style={[
                        styles.avatarImg,
                        { borderColor: palette.line },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        { backgroundColor: themeColor.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarInitials,
                          {
                            color: themeColor.onPrimary,
                            fontFamily: fonts.semibold,
                          },
                        ]}
                      >
                        {userName.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.flexMinZero}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.userNameText,
                        { color: palette.ink, fontFamily: fonts.semibold },
                      ]}
                    >
                      {userName}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.userEmailText,
                        { color: palette.muted, fontFamily: fonts.regular },
                      ]}
                    >
                      {user.email}
                    </Text>
                  </View>
                </View>

                <PressableScale
                  onPress={handleSignOut}
                  disabled={isSubmittingAuth}
                  style={[
                    styles.signOutBtn,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.signOutText,
                      { color: palette.dangerText, fontFamily: fonts.semibold },
                    ]}
                  >
                    {language === 'en' ? 'Sign Out' : 'ထွက်မည်'}
                  </Text>
                </PressableScale>
              </View>

              <View
                style={[styles.syncStatusRow, { borderTopColor: palette.line }]}
              >
                <View style={styles.syncStatusLeft}>
                  {syncStatus === 'syncing' || isManualSyncing ? (
                    <ActivityIndicator
                      size="small"
                      color={themeColor.primary}
                    />
                  ) : (
                    <StatusPill
                      variant={isOnline ? 'paid' : 'unpaid'}
                      label={
                        isOnline
                          ? language === 'en'
                            ? 'Live Cloud Sync'
                            : 'Cloud Sync ချိတ်ဆက်ထားသည်'
                          : hasPendingSync
                          ? language === 'en'
                            ? 'Offline • Pending Sync'
                            : 'အော့ဖ်လိုင်း • Sync စောင့်ဆိုင်းနေသည်'
                          : language === 'en'
                          ? 'Offline • Signed In'
                          : 'အော့ဖ်လိုင်း • အကောင့်ဝင်ထားသည်'
                      }
                    />
                  )}
                  {formattedTime ? (
                    <Text
                      style={[
                        styles.syncTimeText,
                        { color: palette.muted, fontFamily: fonts.mono },
                      ]}
                    >
                      {formattedTime}
                    </Text>
                  ) : null}
                </View>

                <PressableScale
                  onPress={handleManualSync}
                  disabled={syncStatus === 'syncing' || isManualSyncing}
                  style={[
                    styles.syncTriggerBtn,
                    {
                      backgroundColor: themeColor.surface,
                      borderColor: themeColor.border,
                    },
                  ]}
                >
                  <RefreshCw size={13} color={themeColor.primary} />
                  <Text
                    style={[
                      styles.syncTriggerText,
                      { color: themeColor.text, fontFamily: fonts.semibold },
                    ]}
                  >
                    {language === 'en' ? 'Sync' : 'ပြန်ချိန်မည်'}
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.mb12}>
            <View
              style={[
                styles.introBox,
                { backgroundColor: palette.surface, borderColor: palette.line },
              ]}
            >
              <Text
                style={[
                  styles.introText,
                  { color: palette.subtle, fontFamily: fonts.regular },
                ]}
              >
                {language === 'en'
                  ? 'Sign in to automatically sync attendance and fund records across your phone and PC in realtime.'
                  : 'Google အကောင့်ဖြင့် ဝင်ရောက်ထားပါက ဖုန်းနှင့် ကွန်ပျူတာ အချင်းချင်း စာရင်းများကို အလိုအလျောက် Realtime သိမ်းဆည်းပေးပါမည်။'}
              </Text>
            </View>

            {/* Google 1-Tap Sign In */}
            <PressableScale
              disabled={isSubmittingAuth}
              onPress={handleGoogleSignIn}
              style={[
                styles.googleBtn,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.lineStrong,
                },
              ]}
            >
              {isSubmittingAuth ? (
                <ActivityIndicator size="small" color={themeColor.primary} />
              ) : (
                <View
                  style={[
                    styles.googleBadge,
                    { backgroundColor: palette.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.googleLetter,
                      { color: palette.ink, fontFamily: fonts.bold },
                    ]}
                  >
                    G
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.googleText,
                  { color: palette.ink, fontFamily: fonts.semibold },
                ]}
              >
                {language === 'en'
                  ? 'Continue with Google'
                  : 'Google ဖြင့် ဆက်လက်လုပ်ဆောင်မည်'}
              </Text>
            </PressableScale>

            {!showEmailForm ? (
              <View style={styles.emailToggleWrap}>
                <TouchableOpacity
                  onPress={() => setShowEmailForm(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  style={styles.emailTogglePress}
                >
                  <Text
                    style={[
                      styles.emailToggleText,
                      { color: themeColor.primary, fontFamily: fonts.medium },
                    ]}
                  >
                    {language === 'en'
                      ? 'Or use Email & Password'
                      : 'သို့မဟုတ် Email ဖြင့် ဝင်မည်'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.emailCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                {authMode === 'signin' || authMode === 'signup' ? (
                  <AnimatedSegmentedControl<'signin' | 'signup'>
                    tabs={[
                      {
                        id: 'signin',
                        label: language === 'en' ? 'Sign In' : 'ဝင်ရောက်မည်',
                      },
                      {
                        id: 'signup',
                        label: language === 'en' ? 'Sign Up' : 'အကောင့်ဖွင့်မည်',
                      },
                    ]}
                    activeId={authMode}
                    onChange={setAuthMode}
                    activeColor={palette.ink}
                    onActiveColor={palette.bg}
                    backgroundColor={palette.card}
                    inactiveTextColor={palette.muted}
                    style={styles.mb12}
                  />
                ) : (
                  <View
                    style={[
                      styles.subModeHeader,
                      { borderBottomColor: palette.line },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setAuthMode('signin')}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      style={styles.backLink}
                    >
                      <ArrowLeft size={15} color={themeColor.primary} />
                      <Text
                        style={[
                          styles.backLinkText,
                          { color: themeColor.primary, fontFamily: fonts.medium },
                        ]}
                      >
                        {language === 'en' ? 'Back' : 'နောက်သို့'}
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.subModeTitle,
                        { color: palette.ink, fontFamily: fonts.semibold },
                      ]}
                    >
                      {authMode === 'forgot'
                        ? 'စကားဝှက်မေ့နေပါက'
                        : authMode === 'verify_recovery'
                        ? 'စကားဝှက်အသစ်သတ်မှတ်ခြင်း'
                        : 'Email OTP'}
                    </Text>
                  </View>
                )}

                {authMode === 'signin' || authMode === 'signup' ? (
                  <View>
                    {authMode === 'signup' ? (
                      <View style={styles.fieldGroup}>
                        <Text
                          style={[
                            styles.fieldLabel,
                            { color: palette.muted, fontFamily: fonts.medium },
                          ]}
                        >
                          {language === 'en' ? 'Full Name' : 'အမည်'}
                        </Text>
                        <TextInput
                          placeholder="Ko Ko"
                          placeholderTextColor={palette.muted}
                          value={displayName}
                          onChangeText={setDisplayName}
                          style={[
                            styles.input,
                            {
                              backgroundColor: palette.card,
                              borderColor: palette.line,
                              color: palette.ink,
                              fontFamily: fonts.regular,
                            },
                            webOutlineStyle,
                          ]}
                        />
                      </View>
                    ) : null}

                    <View style={styles.fieldGroup}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: palette.muted, fontFamily: fonts.medium },
                        ]}
                      >
                        Email
                      </Text>
                      <TextInput
                        placeholder="ec.class@gmail.com"
                        placeholderTextColor={palette.muted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        style={[
                          styles.input,
                          {
                            backgroundColor: palette.card,
                            borderColor: palette.line,
                            color: palette.ink,
                            fontFamily: fonts.regular,
                          },
                          webOutlineStyle,
                        ]}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <View style={styles.passwordLabelRow}>
                        <Text
                          style={[
                            styles.fieldLabelNoGap,
                            { color: palette.muted, fontFamily: fonts.medium },
                          ]}
                        >
                          {language === 'en' ? 'Password' : 'စကားဝှက်'}
                        </Text>
                        {authMode === 'signin' ? (
                          <TouchableOpacity
                            onPress={() => setAuthMode('forgot')}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.linkSmall,
                                {
                                  color: themeColor.primary,
                                  fontFamily: fonts.medium,
                                },
                              ]}
                            >
                              {language === 'en' ? 'Forgot?' : 'မေ့နေပါသလား?'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <TextInput
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor={palette.muted}
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                        style={[
                          styles.input,
                          {
                            backgroundColor: palette.card,
                            borderColor: palette.line,
                            color: palette.ink,
                            fontFamily: fonts.regular,
                          },
                          webOutlineStyle,
                        ]}
                      />
                    </View>

                    <PressableScale
                      disabled={isSubmittingAuth}
                      onPress={handleEmailAuthSubmit}
                      style={[
                        styles.submitBtn,
                        { backgroundColor: themeColor.primary },
                      ]}
                    >
                      {isSubmittingAuth ? (
                        <ActivityIndicator
                          size="small"
                          color={themeColor.onPrimary}
                        />
                      ) : (
                        <LogIn size={15} color={themeColor.onPrimary} />
                      )}
                      <Text
                        style={[
                          styles.submitBtnText,
                          {
                            color: themeColor.onPrimary,
                            fontFamily: fonts.semibold,
                          },
                        ]}
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

                    <View
                      style={[
                        styles.formFooterLinks,
                        { borderTopColor: palette.line },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => setAuthMode('otp_login')}
                        activeOpacity={0.7}
                        style={styles.otpLink}
                      >
                        <KeyRound size={12} color={themeColor.primary} />
                        <Text
                          style={[
                            styles.linkSmall,
                            {
                              color: themeColor.primary,
                              fontFamily: fonts.medium,
                            },
                          ]}
                        >
                          {language === 'en'
                            ? 'Login with OTP code'
                            : 'OTP Code ဖြင့် ဝင်မည်'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setShowEmailForm(false)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.cancelLinkText,
                            { color: palette.muted, fontFamily: fonts.regular },
                          ]}
                        >
                          {language === 'en' ? 'Cancel' : 'ပိတ်မည်'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {authMode === 'forgot' ? (
                  <View>
                    <Text
                      style={[
                        styles.modeDesc,
                        { color: palette.subtle, fontFamily: fonts.regular },
                      ]}
                    >
                      {language === 'en'
                        ? 'Enter your email to receive an 8-digit password reset code.'
                        : 'စကားဝှက် ပြင်ဆင်ရန် Email သို့ ၈ လုံးပါ Recovery Code ပို့ပေးပါမည်။'}
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: palette.muted, fontFamily: fonts.medium },
                        ]}
                      >
                        Email
                      </Text>
                      <TextInput
                        placeholder="ec.class@gmail.com"
                        placeholderTextColor={palette.muted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        style={[
                          styles.input,
                          {
                            backgroundColor: palette.card,
                            borderColor: palette.line,
                            color: palette.ink,
                            fontFamily: fonts.regular,
                          },
                          webOutlineStyle,
                        ]}
                      />
                    </View>

                    <PressableScale
                      disabled={isSubmittingAuth}
                      onPress={handleRequestPasswordReset}
                      style={[
                        styles.submitBtn,
                        { backgroundColor: themeColor.primary },
                      ]}
                    >
                      {isSubmittingAuth ? (
                        <ActivityIndicator
                          size="small"
                          color={themeColor.onPrimary}
                        />
                      ) : (
                        <Send size={14} color={themeColor.onPrimary} />
                      )}
                      <Text
                        style={[
                          styles.submitBtnText,
                          {
                            color: themeColor.onPrimary,
                            fontFamily: fonts.semibold,
                          },
                        ]}
                      >
                        {language === 'en' ? 'Send Code' : 'Recovery Code ပို့ပါ'}
                      </Text>
                    </PressableScale>

                    <TouchableOpacity
                      onPress={() => setAuthMode('verify_recovery')}
                      activeOpacity={0.7}
                      style={styles.centerLinkBtn}
                    >
                      <Text
                        style={[
                          styles.linkSmall,
                          {
                            color: themeColor.primary,
                            fontFamily: fonts.medium,
                          },
                        ]}
                      >
                        {language === 'en'
                          ? 'Already have the 8-digit code?'
                          : 'ကုဒ် ၈ လုံး ရရှိထားပြီးဖြစ်ပါက နှိပ်ပါ'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {authMode === 'verify_recovery' ? (
                  <View>
                    <Text
                      style={[
                        styles.modeDesc,
                        { color: palette.subtle, fontFamily: fonts.regular },
                      ]}
                    >
                      {language === 'en'
                        ? 'Enter the 8-digit code and your new password.'
                        : 'Email ထဲရှိ ၈ လုံးပါ Code နှင့် စကားဝှက်အသစ်ကို ထည့်သွင်းပေးပါ။'}
                    </Text>

                    <TextInput
                      placeholder="Email"
                      placeholderTextColor={palette.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      style={[
                        styles.input,
                        styles.mb8,
                        {
                          backgroundColor: palette.card,
                          borderColor: palette.line,
                          color: palette.ink,
                          fontFamily: fonts.regular,
                        },
                        webOutlineStyle,
                      ]}
                    />

                    <TextInput
                      placeholder="8-digit Code"
                      placeholderTextColor={palette.muted}
                      keyboardType="number-pad"
                      maxLength={8}
                      value={otpToken}
                      onChangeText={setOtpToken}
                      style={[
                        styles.otpInput,
                        styles.mb8,
                        {
                          backgroundColor: palette.card,
                          borderColor: palette.line,
                          color: palette.ink,
                          fontFamily: fonts.monoMedium,
                        },
                        webOutlineStyle,
                      ]}
                    />

                    <TextInput
                      secureTextEntry
                      placeholder={
                        language === 'en' ? 'New Password' : 'စကားဝှက်အသစ်'
                      }
                      placeholderTextColor={palette.muted}
                      autoCapitalize="none"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      style={[
                        styles.input,
                        styles.mb12,
                        {
                          backgroundColor: palette.card,
                          borderColor: palette.line,
                          color: palette.ink,
                          fontFamily: fonts.regular,
                        },
                        webOutlineStyle,
                      ]}
                    />

                    <PressableScale
                      disabled={isSubmittingAuth}
                      onPress={handleConfirmNewPassword}
                      style={[
                        styles.submitBtn,
                        { backgroundColor: themeColor.primary },
                      ]}
                    >
                      {isSubmittingAuth ? (
                        <ActivityIndicator
                          size="small"
                          color={themeColor.onPrimary}
                        />
                      ) : (
                        <Lock size={14} color={themeColor.onPrimary} />
                      )}
                      <Text
                        style={[
                          styles.submitBtnText,
                          {
                            color: themeColor.onPrimary,
                            fontFamily: fonts.semibold,
                          },
                        ]}
                      >
                        {language === 'en'
                          ? 'Save New Password'
                          : 'စကားဝှက်အသစ် သိမ်းဆည်းမည်'}
                      </Text>
                    </PressableScale>
                  </View>
                ) : null}

                {authMode === 'otp_login' ? (
                  <View>
                    <Text
                      style={[
                        styles.modeDesc,
                        { color: palette.subtle, fontFamily: fonts.regular },
                      ]}
                    >
                      {language === 'en'
                        ? 'Sign in using the 8-digit OTP code sent to your email.'
                        : 'Email သို့ ပို့ပေးသော ၈ လုံးပါ Code ဖြင့် အတည်ပြု ဝင်ရောက်နိုင်ပါသည်။'}
                    </Text>

                    <View style={[styles.otpEmailRow, styles.mb8]}>
                      <TextInput
                        placeholder="Email"
                        placeholderTextColor={palette.muted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        style={[
                          styles.input,
                          styles.flexOne,
                          {
                            backgroundColor: palette.card,
                            borderColor: palette.line,
                            color: palette.ink,
                            fontFamily: fonts.regular,
                          },
                          webOutlineStyle,
                        ]}
                      />
                      <TouchableOpacity
                        disabled={isSubmittingAuth}
                        onPress={handleSendOtpLogin}
                        activeOpacity={0.78}
                        style={[
                          styles.sendCodeBtn,
                          {
                            backgroundColor: palette.card,
                            borderColor: palette.line,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sendCodeText,
                            { color: palette.ink, fontFamily: fonts.medium },
                          ]}
                        >
                          {language === 'en' ? 'Send' : 'ကုဒ်ပို့ပါ'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      placeholder="8-digit Code"
                      placeholderTextColor={palette.muted}
                      keyboardType="number-pad"
                      maxLength={8}
                      value={otpToken}
                      onChangeText={setOtpToken}
                      style={[
                        styles.otpInput,
                        styles.mb12,
                        {
                          backgroundColor: palette.card,
                          borderColor: palette.line,
                          color: palette.ink,
                          fontFamily: fonts.monoMedium,
                        },
                        webOutlineStyle,
                      ]}
                    />

                    <PressableScale
                      disabled={isSubmittingAuth}
                      onPress={handleVerifyOtpLogin}
                      style={[
                        styles.submitBtn,
                        { backgroundColor: themeColor.primary },
                      ]}
                    >
                      {isSubmittingAuth ? (
                        <ActivityIndicator
                          size="small"
                          color={themeColor.onPrimary}
                        />
                      ) : (
                        <KeyRound size={14} color={themeColor.onPrimary} />
                      )}
                      <Text
                        style={[
                          styles.submitBtnText,
                          {
                            color: themeColor.onPrimary,
                            fontFamily: fonts.semibold,
                          },
                        ]}
                      >
                        {language === 'en'
                          ? 'Verify & Sign In'
                          : 'အတည်ပြုပြီး ဝင်မည်'}
                      </Text>
                    </PressableScale>
                  </View>
                ) : null}
              </View>
            )}

            <View
              style={[
                styles.offlineBar,
                { backgroundColor: palette.surface },
              ]}
            >
              <Text
                style={[
                  styles.offlineText,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {language === 'en'
                  ? 'Without sign-in, all records remain saved offline on this device only.'
                  : 'အကောင့်မဝင်ဘဲ အော့ဖ်လိုင်းအသုံးပြုပါက စာရင်းများကို ဤစက်ထဲတွင်သာ သိမ်းဆည်းပါမည်။'}
              </Text>
            </View>

            {Platform.OS !== 'web' ? (
              <View style={styles.devUriWrap}>
                <Pressable
                  onPress={() => setShowDevCallback(!showDevCallback)}
                  style={styles.devToggleBtn}
                >
                  <Text
                    style={[
                      styles.devToggleText,
                      { color: palette.muted, fontFamily: fonts.regular },
                    ]}
                  >
                    {showDevCallback
                      ? 'Hide Redirect URI'
                      : 'Mobile OAuth Config URI'}
                  </Text>
                </Pressable>

                {showDevCallback ? (
                  <Pressable
                    onPress={async () => {
                      const uri = getMobileAuthRedirectUri();
                      await Clipboard.setStringAsync(uri);
                      setFeedback({
                        text: `Callback URI Copied:\n${uri}`,
                        isError: false,
                      });
                    }}
                    style={[
                      styles.copyUriBtn,
                      { backgroundColor: palette.surface },
                    ]}
                  >
                    <Copy size={11} color={themeColor.primary} />
                    <Text
                      style={[
                        styles.copyUriText,
                        { color: themeColor.primary, fontFamily: fonts.mono },
                      ]}
                    >
                      Copy Redirect URI
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </DragDismissSheet>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  flexMinZero: {
    flex: 1,
    minWidth: 0,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  scrollContent: {
    paddingVertical: 4,
  },
  feedbackBanner: {
    marginBottom: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  authCard: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 14,
  },
  userNameText: {
    fontSize: 14,
  },
  userEmailText: {
    fontSize: 12,
    marginTop: 1,
  },
  signOutBtn: {
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  signOutText: {
    fontSize: 12,
  },
  syncStatusRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  syncTimeText: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  syncTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  syncTriggerText: {
    fontSize: 12,
  },
  introBox: {
    marginBottom: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
  },
  introText: {
    fontSize: 12,
    lineHeight: 18,
  },
  googleBtn: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  googleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLetter: {
    fontSize: 12,
  },
  googleText: {
    fontSize: 14,
  },
  emailToggleWrap: {
    alignItems: 'center',
    marginTop: 2,
  },
  emailTogglePress: {
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  emailToggleText: {
    fontSize: 12,
  },
  emailCard: {
    marginTop: 4,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
  },
  subModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 12,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  backLinkText: {
    fontSize: 12,
  },
  subModeTitle: {
    fontSize: 12,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    marginBottom: 5,
    marginLeft: 2,
  },
  fieldLabelNoGap: {
    fontSize: 11,
    marginLeft: 2,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  input: {
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  otpInput: {
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  otpEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendCodeBtn: {
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  sendCodeText: {
    fontSize: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 12,
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 13,
  },
  formFooterLinks: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  linkSmall: {
    fontSize: 12,
  },
  cancelLinkText: {
    fontSize: 12,
  },
  modeDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  centerLinkBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  offlineBar: {
    marginTop: 12,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  offlineText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  devUriWrap: {
    marginTop: 8,
    alignItems: 'center',
  },
  devToggleBtn: {
    paddingVertical: 4,
  },
  devToggleText: {
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  copyUriBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  copyUriText: {
    fontSize: 10,
  },
});
