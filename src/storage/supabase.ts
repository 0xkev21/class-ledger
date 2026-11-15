import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Required for completing web-browser authentication sessions across iOS, Android, and Web
WebBrowser.maybeCompleteAuthSession();

const LAST_SYNCED_KEY = '@ec_treasury_last_synced_at';
const LEGACY_CONFIG_KEY = '@ec_treasury_supabase_config_v1';

// Automatically purge any legacy custom database configuration to protect privacy and security
(async () => {
  try {
    await AsyncStorage.removeItem(LEGACY_CONFIG_KEY);
  } catch {
    // ignore
  }
})();

let cachedClient: SupabaseClient | null = null;

/**
 * Gets environment variables configured at build/runtime (.env)
 */
export function getEnvSupabaseCredentials(): { url: string; anonKey: string } {
  const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  return { url, anonKey };
}

/**
 * Checks if cloud database credentials are configured in the environment
 */
export function isCloudConfigured(): boolean {
  const { url, anonKey } = getEnvSupabaseCredentials();
  return Boolean(url && anonKey);
}

/**
 * Loads the last cloud synchronization timestamp
 */
export async function getLastSyncedAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SYNCED_KEY);
  } catch {
    return null;
  }
}

/**
 * Saves the last cloud synchronization timestamp
 */
export async function saveLastSyncedAt(timestamp: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNCED_KEY, timestamp);
  } catch (err) {
    console.error('Failed to save lastSyncedAt to storage:', err);
  }
}

/**
 * Gets or initializes the singleton Supabase client using environment credentials.
 * End users cannot configure or view arbitrary database endpoints.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getEnvSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

/**
 * Extracts OAuth tokens or error information from an incoming redirect URL
 */
export function extractAuthTokensFromUrl(url: string): {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  error?: string;
} {
  try {
    const params: Record<string, string> = {};

    // 1. Parse query string (?foo=bar)
    if (url.includes('?')) {
      const queryString = url.split('?')[1].split('#')[0];
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    // 2. Parse hash fragment (#foo=bar)
    if (url.includes('#')) {
      const hashString = url.split('#')[1];
      const hashParams = new URLSearchParams(hashString);
      hashParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    // 3. Fallback to Linking.parse
    const parsed = Linking.parse(url);
    if (parsed.queryParams) {
      Object.entries(parsed.queryParams).forEach(([k, v]) => {
        if (typeof v === 'string') params[k] = v;
      });
    }

    const rawError = params.error_description || params.error;
    const error = rawError ? decodeURIComponent(rawError.replace(/\+/g, ' ')) : undefined;

    return {
      accessToken: params.access_token,
      refreshToken: params.refresh_token,
      code: params.code,
      error,
    };
  } catch (err: any) {
    return { error: err.message || 'Failed to parse redirect URL.' };
  }
}

/**
 * Creates and sets a Supabase session from an OAuth callback URL
 */
export async function createSessionFromUrl(
  url: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database service is not configured.' };

  const { accessToken, refreshToken, code, error } = extractAuthTokensFromUrl(url);

  if (error) {
    return { success: false, error };
  }

  try {
    if (accessToken && refreshToken) {
      const { error: sessionError } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) return { success: false, error: sessionError.message };
      return { success: true };
    }

    if (code) {
      const { error: codeError } = await client.auth.exchangeCodeForSession(code);
      if (codeError) return { success: false, error: codeError.message };
      return { success: true };
    }

    return { success: false, error: 'No authentication tokens found in redirect URL.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to establish session from URL.' };
  }
}

/**
 * Returns the exact deep link callback URI used for OAuth redirects on this device
 */
export function getMobileAuthRedirectUri(): string {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return Linking.createURL('auth');
}

/**
 * Signs in using Google OAuth across Web, Mobile (Android/iOS) and Linux Desktop
 */
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Cloud database is not configured. Please check your Supabase project configuration in .env.',
    };
  }

  try {
    if (Platform.OS === 'web') {
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      console.log('[Supabase Auth] Web OAuth redirectTo:', redirectTo);
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } else {
      // Mobile / Native: use WebBrowser & custom app scheme
      const redirectTo = Linking.createURL('auth');
      console.log('[Supabase Auth] Mobile OAuth redirectTo:', redirectTo);
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { success: false, error: error.message };
      if (!data?.url) return { success: false, error: 'No OAuth URL returned by provider.' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        return await createSessionFromUrl(result.url);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // On Android, openAuthSessionAsync often returns 'dismiss' because the deep link intent reopened the app.
        // Check if the session was already established by the deep link listener:
        const currentUser = await getCurrentUser();
        if (currentUser) {
          return { success: true };
        }
        return { success: false, error: 'Google sign-in was cancelled or dismissed.' };
      }
      return { success: true };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Google sign-in failed.' };
  }
}

/**
 * Signs in with Email and Password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Database service is not configured.' };
  }
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user || undefined };
}

/**
 * Signs up with Email and Password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; error?: string; user?: User; requiresEmailConfirmation?: boolean }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Database service is not configured.' };
  }
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: name?.trim() || undefined,
        name: name?.trim() || undefined,
      },
    },
  });
  if (error) return { success: false, error: error.message };
  const requiresEmailConfirmation = Boolean(data.user && !data.session);
  return {
    success: true,
    user: data.user || undefined,
    requiresEmailConfirmation,
  };
}

/**
 * Sends an 8-digit One-Time Password (OTP) verification code or magic link to an email
 */
export async function sendEmailOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Database service is not configured.' };
  }
  const { error } = await client.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
    },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Verifies an 8-digit email OTP token (for signup confirmation, passwordless login, or password recovery)
 */
export async function verifyEmailOtp(
  email: string,
  token: string,
  type: 'signup' | 'email' | 'recovery' = 'email'
): Promise<{ success: boolean; error?: string; user?: User }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Database service is not configured.' };
  }
  const { data, error } = await client.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, user: data.user || undefined };
}

/**
 * Requests a password reset email (delivers an 8-digit recovery code and link)
 */
export async function resetPasswordForEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Database service is not configured.' };
  }
  const { error } = await client.auth.resetPasswordForEmail(email.trim());
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Updates the authenticated user's password
 */
export async function updateUserPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Database service is not configured.' };
  }
  const { error } = await client.auth.updateUser({
    password: newPassword,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Signs out the currently authenticated user
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: true };
  const { error } = await client.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Gets currently authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user || null;
}

/**
 * Subscribes to Supabase Auth state changes
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => {
    subscription.unsubscribe();
  };
}
