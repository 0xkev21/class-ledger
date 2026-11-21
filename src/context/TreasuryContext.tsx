import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance, AppState, AppStateStatus, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { User } from '@supabase/supabase-js';
import { useColorScheme } from '@/components/useColorScheme';
import { INITIAL_STATE, loadDatabase, resetDatabaseToDefaults, saveDatabase } from '../storage/db';
import {
  ActiveThemeColor,
  DEFAULT_THEME_COLOR_ID,
  resolveThemeColor,
  ThemeColorId,
} from '../theme/themeColors';
import { getSurfacePalette, SurfacePalette } from '../theme';
import {
  clearLastSyncedAt,
  createSessionFromUrl,
  getCurrentUser,
  getLastSyncedAt,
  getSupabaseClient,
  isCloudConfigured,
  resetPasswordForEmail as apiResetPasswordForEmail,
  saveLastSyncedAt,
  sendEmailOtp as apiSendEmailOtp,
  signInWithEmail as apiSignInWithEmail,
  signInWithGoogle as apiSignInWithGoogle,
  signOutUser as apiSignOutUser,
  signUpWithEmail as apiSignUpWithEmail,
  subscribeToAuthChanges,
  updateUserPassword as apiUpdateUserPassword,
  verifyEmailOtp as apiVerifyEmailOtp,
} from '../storage/supabase';
import {
  clearSyncQueue,
  deleteEventFromCloud,
  deleteEventRecordFromCloud,
  deleteFineFromCloud,
  deleteStudentFromCloud,
  deleteSubjectFromCloud,
  enqueuePendingDelete,
  flushPendingDeletes,
  isNetworkError,
  loadSyncQueue,
  markPendingPush,
  pullCloudToLocal,
  pushLocalToCloud,
  saveSyncQueue,
  subscribeToTreasuryRealtime,
  SyncResult,
  SyncTable,
  syncWithCloud,
} from '../storage/sync';
import {
  AppDatabaseState,
  AppLanguage,
  AppSettings,
  Event,
  EventRecord,
  EventStat,
  EventType,
  Fine,
  FinesSummary,
  Student,
  StudentFineStat,
  Subject,
  SubjectFineStat,
  ThemeMode,
} from '../types';
import { getTranslations, Translations } from '../i18n';

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'disabled';

interface TreasuryContextType {
  settings: AppSettings;
  students: Student[];
  subjects: Subject[];
  events: Event[];
  eventRecords: EventRecord[];
  fines: Fine[];
  isLoading: boolean;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  themeColor: ActiveThemeColor;
  palette: SurfacePalette;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  t: Translations;

  // Settings
  updateSettings: (data: Partial<AppSettings>) => Promise<void>;

  // Student management
  addStudent: (data: { name: string; phone?: string; rollNumber?: string }) => Promise<void>;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id' | 'createdAt'>>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  // Subject management
  addSubject: (data: { name: string }) => Promise<string>;
  updateSubject: (id: string, data: { name: string }) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // Event management
  addEvent: (data: {
    name: string;
    type: EventType;
    fixedAmount?: number;
    dueDate?: string;
    extraNote?: string;
  }) => Promise<string>;
  updateEvent: (id: string, data: Partial<Omit<Event, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Event Record operations
  recordDonation: (eventId: string, studentId: string, amount: number) => Promise<void>;
  deleteEventRecord: (recordId: string) => Promise<void>;
  setEventStudentPaid: (
    eventId: string,
    studentId: string,
    isPaid: boolean,
    amount?: number
  ) => Promise<void>;
  getEventStats: (eventId: string) => EventStat;

  // Fine operations
  batchCreateFines: (params: {
    date: string;
    subjectId: string;
    reason: string;
    amount: number;
    studentIds: string[];
  }) => Promise<number>;
  toggleFinePaid: (fineId: string) => Promise<void>;
  deleteFine: (fineId: string) => Promise<void>;

  // Computed Summaries
  finesSummary: FinesSummary;
  subjectFineStats: SubjectFineStat[];
  studentFineStats: StudentFineStat[];
  getStudentUnpaidFineBalance: (studentId: string) => number;

  // Database Management
  resetToDefaults: () => Promise<void>;
  importDatabase: (jsonString: string) => Promise<boolean>;
  getDatabaseJSON: () => string;

  // Supabase Auth & Cloud Sync
  user: User | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string; user?: User; requiresEmailConfirmation?: boolean }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (
    email: string,
    token: string,
    type?: 'signup' | 'email' | 'recovery'
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  syncStatus: CloudSyncStatus;
  syncMessage: string;
  lastSyncedAt: string | null;
  isCloudConnected: boolean;
  isOnline: boolean;
  hasPendingSync: boolean;
  syncNow: (mode?: 'push' | 'pull' | 'merge') => Promise<SyncResult>;
  refreshCloudConnection: () => Promise<void>;
}

const TreasuryContext = createContext<TreasuryContextType | null>(null);

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const TreasuryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppDatabaseState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Supabase Sync States
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [hasPendingSync, setHasPendingSync] = useState<boolean>(false);

  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Debounce ref for auto-pushing local changes to cloud
  const pushDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPushingRef = useRef<boolean>(false);
  const isSyncingRef = useRef<boolean>(false);
  const realtimeUnsubRef = useRef<(() => void) | null>(null);
  const authUnsubRef = useRef<(() => void) | null>(null);

  const isCloudConnected = isCloudConfigured();

  const systemColorScheme = useColorScheme();
  const [hydratedThemeMode, setHydratedThemeMode] = useState<ThemeMode | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('cl-theme-mode');
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setHydratedThemeMode(stored);
        }
      } catch {}
    }
  }, []);

  const rawThemeMode =
    isLoading && hydratedThemeMode !== null
      ? hydratedThemeMode
      : state.settings.themeMode;
  const themeMode: ThemeMode =
    rawThemeMode === 'light' || rawThemeMode === 'dark'
      ? rawThemeMode
      : 'system';
  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const themeColor = useMemo(() => {
    return resolveThemeColor(
      state.settings.themeColorId,
      isDark
    );
  }, [state.settings.themeColorId, isDark]);

  const palette = useMemo(
    () => getSurfacePalette(state.settings.themeColorId, isDark),
    [state.settings.themeColorId, isDark]
  );

  useEffect(() => {
    if (isLoading) return;
    if (Platform.OS !== 'web') {
      try {
        if (typeof Appearance.setColorScheme === 'function') {
          Appearance.setColorScheme(
            (themeMode === 'system' ? 'unspecified' : themeMode) as any
          );
        }
      } catch (err) {
        console.warn('Failed to update native color scheme:', err);
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('cl-theme-mode', themeMode);
      } catch {}
    }
  }, [themeMode, isLoading]);

  const setThemeMode = async (mode: ThemeMode) => {
    await updateSettings({ themeMode: mode });
  };

  const language: AppLanguage = state.settings.language === 'en' ? 'en' : 'my';
  const t = useMemo(() => getTranslations(language), [language]);

  const setLanguage = async (newLang: AppLanguage) => {
    await updateSettings({ language: newLang });
  };

  // Safely merges cloud database state without wiping local user theme/UI preferences
  const applyCloudState = async (
    cloudState: AppDatabaseState,
    syncedAt?: string,
    message?: string
  ) => {
    let updatedNext: AppDatabaseState | null = null;
    setState((prev) => {
      const mergedSettings: AppSettings = {
        ecKbzpayName: cloudState.settings.ecKbzpayName || prev.settings.ecKbzpayName,
        ecKbzpayPhone: cloudState.settings.ecKbzpayPhone || prev.settings.ecKbzpayPhone,
        themeColorId: prev.settings.themeColorId || cloudState.settings.themeColorId || DEFAULT_THEME_COLOR_ID,
        themeMode: prev.settings.themeMode || 'system',
        language: prev.settings.language || cloudState.settings.language || 'my',
      };
      const next: AppDatabaseState = {
        ...cloudState,
        settings: mergedSettings,
      };
      updatedNext = next;
      stateRef.current = next;
      return next;
    });

    if (updatedNext) {
      await saveDatabase(updatedNext);
    }
    if (syncedAt) {
      setLastSyncedAt(syncedAt);
      await saveLastSyncedAt(syncedAt);
    }
    if (message) {
      setSyncStatus('synced');
      setSyncMessage(message);
    }
  };

  // Load database and initialize Supabase on mount
  useEffect(() => {
    let isMounted = true;

    const runAutoMergeSync = async (
      targetUserId: string,
      targetEmail?: string | null
    ): Promise<SyncResult | null> => {
      const client = getSupabaseClient();
      if (!client || isSyncingRef.current) return null;

      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
        if (isMounted) {
          setIsOnline(false);
          setSyncStatus('idle');
          setSyncMessage('Offline mode — changes saved locally');
        }
        return null;
      }

      isSyncingRef.current = true;
      if (isMounted) {
        setSyncStatus('syncing');
        setSyncMessage('Cloud နှင့် စာရင်းများ ချိန်ညှိနေပါသည်...');
      }

      try {
        const res = await syncWithCloud(stateRef.current, client, targetUserId);
        if (!isMounted) return res;

        if (res.success && res.updatedState) {
          setIsOnline(true);
          setHasPendingSync(false);
          await applyCloudState(
            res.updatedState,
            res.syncedAt || new Date().toISOString(),
            targetEmail ? `Synced with ${targetEmail}` : 'Synced with Cloud'
          );
        } else if (isNetworkError(res.message)) {
          setIsOnline(false);
          setSyncStatus('idle');
          setSyncMessage('Offline mode — changes saved locally');
        } else {
          setSyncStatus('error');
          setSyncMessage(res.message);
        }
        return res;
      } catch (err: any) {
        if (isMounted) {
          if (isNetworkError(err)) {
            setIsOnline(false);
            setSyncStatus('idle');
            setSyncMessage('Offline mode — changes saved locally');
          } else {
            setSyncStatus('error');
            setSyncMessage(err?.message || 'Sync error');
          }
        }
        return null;
      } finally {
        isSyncingRef.current = false;
      }
    };

    const ensureRealtimeSubscribed = (client: any) => {
      if (realtimeUnsubRef.current) realtimeUnsubRef.current();
      realtimeUnsubRef.current = subscribeToTreasuryRealtime(client, () => {
        if (isPushingRef.current || isSyncingRef.current) return;
        if (realtimeDebounceTimerRef.current) {
          clearTimeout(realtimeDebounceTimerRef.current);
        }
        realtimeDebounceTimerRef.current = setTimeout(async () => {
          try {
            if (!isMounted || isPushingRef.current || isSyncingRef.current) return;
            const activeUser = userRef.current || (await getCurrentUser());
            if (!activeUser?.id) return;
            await runAutoMergeSync(activeUser.id, activeUser.email);
          } catch (rtErr) {
            console.warn('[TreasuryContext] Realtime sync notice:', rtErr);
          }
        }, 800);
      });
    };

    (async () => {
      try {
        // 1. Instant local load & pending sync check
        const [localData, queue, lastSync] = await Promise.all([
          loadDatabase(),
          loadSyncQueue(),
          getLastSyncedAt(),
        ]);
        if (isMounted) {
          setState(localData);
          stateRef.current = localData;
          setHasPendingSync(queue.hasPendingPush || queue.pendingDeletes.length > 0);
          if (lastSync) setLastSyncedAt(lastSync);
          setIsLoading(false);
        }

        // 2. Connect and auto-sync if credentials exist
        const client = getSupabaseClient();
        if (client) {
          if (authUnsubRef.current) authUnsubRef.current();
          authUnsubRef.current = subscribeToAuthChanges(async (newUser) => {
            if (!isMounted) return;
            setUser(newUser);
            userRef.current = newUser;
            setIsAuthLoading(false);

            if (newUser) {
              ensureRealtimeSubscribed(client);
              await runAutoMergeSync(newUser.id, newUser.email);
            } else {
              setSyncStatus('idle');
            }
          });

          try {
            const currentUser = await getCurrentUser();
            if (isMounted) {
              setUser(currentUser);
              userRef.current = currentUser;
              setIsAuthLoading(false);
            }

            if (currentUser?.id) {
              ensureRealtimeSubscribed(client);
              await runAutoMergeSync(currentUser.id, currentUser.email);
            } else {
              setSyncStatus('idle');
            }
          } catch (syncErr: any) {
            console.warn('[TreasuryContext] Initial sync notice:', syncErr?.message || syncErr);
            if (isMounted) {
              setIsAuthLoading(false);
              if (isNetworkError(syncErr)) {
                setIsOnline(false);
                setSyncStatus('idle');
              } else {
                setSyncStatus('error');
                setSyncMessage(syncErr?.message || 'Offline mode');
              }
            }
          }
        } else {
          setIsAuthLoading(false);
          setSyncStatus('disabled');
        }
      } catch (err) {
        console.error('Failed loading db:', err);
        if (isMounted) {
          setIsLoading(false);
          setIsAuthLoading(false);
        }
      }
    })();

    const handleAppResume = () => {
      const client = getSupabaseClient();
      if (!client) return;
      const activeId = userRef.current?.id;
      if (activeId) {
        void runAutoMergeSync(activeId, userRef.current?.email);
      } else {
        getCurrentUser()
          .then((activeUser) => {
            if (activeUser?.id && isMounted) {
              setUser(activeUser);
              userRef.current = activeUser;
              void runAutoMergeSync(activeUser.id, activeUser.email);
            }
          })
          .catch(() => {});
      }
    };

    const handleWebOnline = () => {
      if (!isMounted) return;
      setIsOnline(true);
      handleAppResume();
    };

    const handleWebOffline = () => {
      if (!isMounted) return;
      setIsOnline(false);
      setSyncStatus('idle');
    };

    const appStateSub = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') {
        handleAppResume();
      }
    });

    // Deep link listener for OAuth redirects on Android & iOS
    const handleDeepLink = async (event: { url: string }) => {
      if (
        event.url.includes('access_token') ||
        event.url.includes('code=') ||
        event.url.includes('error')
      ) {
        const res = await createSessionFromUrl(event.url);
        if (res.success) {
          const u = await getCurrentUser();
          if (u && isMounted) {
            setUser(u);
            userRef.current = u;
          }
        } else if (res.error) {
          console.warn('[TreasuryContext] Deep link authentication rejected:', res.error);
        }
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);

    // Handle deep links from cold start
    Linking.getInitialURL().then(async (initialUrl) => {
      if (
        initialUrl &&
        (initialUrl.includes('access_token') ||
          initialUrl.includes('code=') ||
          initialUrl.includes('error'))
      ) {
        const res = await createSessionFromUrl(initialUrl);
        if (res.success) {
          const u = await getCurrentUser();
          if (u && isMounted) {
            setUser(u);
            userRef.current = u;
          }
        } else if (res.error) {
          console.warn('[TreasuryContext] Cold start deep link authentication rejected:', res.error);
        }
      }
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', handleAppResume);
      window.addEventListener('online', handleWebOnline);
      window.addEventListener('offline', handleWebOffline);
    }

    return () => {
      isMounted = false;
      appStateSub.remove();
      linkSub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('focus', handleAppResume);
        window.removeEventListener('online', handleWebOnline);
        window.removeEventListener('offline', handleWebOffline);
      }
      if (realtimeUnsubRef.current) realtimeUnsubRef.current();
      if (authUnsubRef.current) authUnsubRef.current();
      if (pushDebounceTimerRef.current) clearTimeout(pushDebounceTimerRef.current);
      if (realtimeDebounceTimerRef.current) clearTimeout(realtimeDebounceTimerRef.current);
    };
  }, []);

  // Persist updated state locally and trigger automatic debounced cloud push
  const updateAndPersist = async (
    updater: (prev: AppDatabaseState) => AppDatabaseState,
    cloudAction?: (client: any) => Promise<void>,
    deleteTarget?: { table: SyncTable; id: string }
  ) => {
    let nextState: AppDatabaseState | null = null;
    setState((prev) => {
      const next = updater(prev);
      nextState = next;
      stateRef.current = next;
      return next;
    });

    if (!nextState) return;
    const next = nextState as AppDatabaseState;

    saveDatabase(next).catch((e) => console.error('Local auto-save failed:', e));

    // Mark offline queue immediately so edits are never lost if app closes or is offline
    setHasPendingSync(true);
    if (deleteTarget) {
      await enqueuePendingDelete(deleteTarget.table, deleteTarget.id);
    } else {
      await markPendingPush();
    }

    const client = getSupabaseClient();
    const activeUser = userRef.current;
    if (!client || !activeUser?.id) {
      return;
    }

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setSyncStatus('idle');
      setSyncMessage('Offline — saved locally');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('အလိုအလျောက် Cloud သို့ သိမ်းဆည်းနေပါသည်...');

    if (pushDebounceTimerRef.current) {
      clearTimeout(pushDebounceTimerRef.current);
    }

    pushDebounceTimerRef.current = setTimeout(async () => {
      const currentUser = userRef.current;
      if (!currentUser?.id) return;

      try {
        isPushingRef.current = true;
        const queue = await loadSyncQueue();
        if (queue.pendingDeletes.length > 0) {
          const delRes = await flushPendingDeletes(client, queue.pendingDeletes);
          if (delRes.remaining.length > 0) {
            await saveSyncQueue({
              hasPendingPush: queue.hasPendingPush,
              pendingDeletes: delRes.remaining,
            });
            throw new Error(delRes.error || 'Network error deleting from cloud');
          }
        }
        if (cloudAction) {
          await cloudAction(client);
        }
        const res = await pushLocalToCloud(stateRef.current, client, currentUser.id);
        if (res.success) {
          await clearSyncQueue();
          setHasPendingSync(false);
          setIsOnline(true);
          setSyncStatus('synced');
          setSyncMessage(`အလိုအလျောက် သိမ်းဆည်းပြီးပါပြီ (${currentUser.email})`);
          const now = new Date().toISOString();
          setLastSyncedAt(now);
          await saveLastSyncedAt(now);
        } else if (isNetworkError(res.message)) {
          setIsOnline(false);
          setSyncStatus('idle');
          setSyncMessage('Offline — saved locally');
        } else {
          setSyncStatus('error');
          setSyncMessage(res.message);
        }
      } catch (err: any) {
        if (isNetworkError(err)) {
          setIsOnline(false);
          setSyncStatus('idle');
          setSyncMessage('Offline — saved locally');
        } else {
          setSyncStatus('error');
          setSyncMessage(err?.message || 'Auto sync failed');
        }
      } finally {
        setTimeout(() => {
          isPushingRef.current = false;
        }, 1200);
      }
    }, 500);
  };

  // Settings: Instant local update, fast persistence, and light background cloud sync
  const updateSettings = async (data: Partial<AppSettings>) => {
    let nextState: AppDatabaseState | null = null;
    setState((prev) => {
      const next: AppDatabaseState = {
        ...prev,
        settings: {
          ...prev.settings,
          ...data,
        },
      };
      nextState = next;
      stateRef.current = next;
      return next;
    });

    if (!nextState) return;
    const next = nextState as AppDatabaseState;

    saveDatabase(next).catch((e) => console.error('Local settings auto-save failed:', e));

    const client = getSupabaseClient();
    if (client && user?.id) {
      try {
        const payload: Record<string, any> = {
          user_id: user.id,
          ec_kbzpay_name: next.settings.ecKbzpayName || '',
          ec_kbzpay_phone: next.settings.ecKbzpayPhone || '',
          theme_color_id: next.settings.themeColorId || DEFAULT_THEME_COLOR_ID,
          language: next.settings.language || 'my',
          updated_at: new Date().toISOString(),
        };
        await client.from('settings').upsert(payload);
      } catch (settingsErr) {
        console.warn('Background settings sync error:', settingsErr);
      }
    }
  };

  // Student management
  const addStudent = async (data: { name: string; phone?: string; rollNumber?: string }) => {
    const newStudent: Student = {
      id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      phone: data.phone?.trim() || undefined,
      rollNumber: data.rollNumber?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await updateAndPersist((prev) => ({
      ...prev,
      students: [newStudent, ...prev.students],
    }));
  };

  const updateStudent = async (id: string, data: Partial<Omit<Student, 'id' | 'createdAt'>>) => {
    await updateAndPersist((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
  };

  const deleteStudent = async (id: string) => {
    await updateAndPersist(
      (prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== id),
        eventRecords: prev.eventRecords.filter((r) => r.studentId !== id),
        fines: prev.fines.filter((f) => f.studentId !== id),
      }),
      async (client) => {
        await deleteStudentFromCloud(id, client);
      },
      { table: 'students', id }
    );
  };

  // Subject management
  const addSubject = async (data: { name: string }): Promise<string> => {
    const newSub: Subject = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      createdAt: new Date().toISOString(),
    };
    await updateAndPersist((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSub],
    }));
    return newSub.id;
  };

  const updateSubject = async (id: string, data: { name: string }) => {
    await updateAndPersist((prev) => ({
      ...prev,
      subjects: prev.subjects.map((sub) =>
        sub.id === id ? { ...sub, name: data.name.trim() } : sub
      ),
    }));
  };

  const deleteSubject = async (id: string) => {
    await updateAndPersist(
      (prev) => ({
        ...prev,
        subjects: prev.subjects.filter((sub) => sub.id !== id),
        fines: prev.fines.filter((f) => f.subjectId !== id),
      }),
      async (client) => {
        await deleteSubjectFromCloud(id, client);
      },
      { table: 'subjects', id }
    );
  };

  // Event management
  const addEvent = async (data: {
    name: string;
    type: EventType;
    fixedAmount?: number;
    dueDate?: string;
    extraNote?: string;
  }): Promise<string> => {
    const id = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEvent: Event = {
      id,
      name: data.name.trim(),
      type: data.type,
      fixedAmount: data.type === 'fixed_fee' ? data.fixedAmount || 0 : undefined,
      dueDate: data.dueDate?.trim() || undefined,
      extraNote: data.extraNote?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // If it's fixed fee, automatically generate unpaid records for current students if desired
    // (or let user manage them). In real-world workflow, fixed fees are tracked across the class:
    let initialRecords: EventRecord[] = [];
    if (newEvent.type === 'fixed_fee' && (newEvent.fixedAmount || 0) > 0) {
      initialRecords = state.students.map((student) => ({
        id: `rec-${Date.now()}-${student.id}`,
        eventId: id,
        studentId: student.id,
        amount: newEvent.fixedAmount || 0,
        isPaid: false,
        createdAt: new Date().toISOString(),
      }));
    }

    await updateAndPersist((prev) => ({
      ...prev,
      events: [newEvent, ...prev.events],
      eventRecords: [...initialRecords, ...prev.eventRecords],
    }));

    return id;
  };

  const updateEvent = async (id: string, data: Partial<Omit<Event, 'id' | 'createdAt'>>) => {
    await updateAndPersist((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
  };

  const deleteEvent = async (id: string) => {
    await updateAndPersist(
      (prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
        eventRecords: prev.eventRecords.filter((r) => r.eventId !== id),
      }),
      async (client) => {
        await deleteEventFromCloud(id, client);
      },
      { table: 'events', id }
    );
  };

  // Event Records
  const recordDonation = async (eventId: string, studentId: string, amount: number) => {
    if (amount <= 0) return;
    const newRecord: EventRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventId,
      studentId,
      amount,
      isPaid: true,
      createdAt: new Date().toISOString(),
    };
    await updateAndPersist((prev) => ({
      ...prev,
      eventRecords: [newRecord, ...prev.eventRecords],
    }));
  };

  const deleteEventRecord = async (recordId: string) => {
    await updateAndPersist(
      (prev) => ({
        ...prev,
        eventRecords: prev.eventRecords.filter((r) => r.id !== recordId),
      }),
      async (client) => {
        await deleteEventRecordFromCloud(recordId, client);
      },
      { table: 'event_records', id: recordId }
    );
  };

  const setEventStudentPaid = async (
    eventId: string,
    studentId: string,
    isPaid: boolean,
    amount?: number
  ) => {
    await updateAndPersist((prev) => {
      const event = prev.events.find((e) => e.id === eventId);
      const defaultAmt = amount ?? event?.fixedAmount ?? 0;

      const existingIndex = prev.eventRecords.findIndex(
        (r) => r.eventId === eventId && r.studentId === studentId
      );

      if (existingIndex >= 0) {
        const updated = [...prev.eventRecords];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isPaid,
          amount: defaultAmt > 0 ? defaultAmt : updated[existingIndex].amount,
        };
        return { ...prev, eventRecords: updated };
      } else {
        const newRecord: EventRecord = {
          id: `rec-${Date.now()}-${studentId}`,
          eventId,
          studentId,
          amount: defaultAmt,
          isPaid,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, eventRecords: [newRecord, ...prev.eventRecords] };
      }
    });
  };

  // Event stats calculation
  const getEventStats = (eventId: string): EventStat => {
    const event = state.events.find((e) => e.id === eventId) || {
      id: eventId,
      name: '',
      type: 'donation' as EventType,
      createdAt: '',
    };
    const records = state.eventRecords.filter((r) => r.eventId === eventId);

    if (event.type === 'donation') {
      const totalCollected = records.reduce((sum, r) => sum + r.amount, 0);
      return {
        event,
        totalCollected,
        totalDonors: records.length,
        totalPaidCount: records.length,
        totalUnpaidCount: 0,
      };
    } else {
      // Fixed fee: check against all students or existing records
      const paidRecords = records.filter((r) => r.isPaid);
      const totalCollected = paidRecords.reduce((sum, r) => sum + r.amount, 0);
      const fee = event.fixedAmount || 0;
      const expectedTotal = fee * state.students.length;
      const paidCount = paidRecords.length;
      const unpaidCount = Math.max(0, state.students.length - paidCount);

      return {
        event,
        totalCollected,
        expectedTotal,
        totalDonors: paidCount,
        totalPaidCount: paidCount,
        totalUnpaidCount: unpaidCount,
      };
    }
  };

  // Fine operations
  const batchCreateFines = async ({
    date,
    subjectId,
    reason,
    amount,
    studentIds,
  }: {
    date: string;
    subjectId: string;
    reason: string;
    amount: number;
    studentIds: string[];
  }): Promise<number> => {
    if (studentIds.length === 0 || amount <= 0) return 0;

    const now = new Date().toISOString();
    const newFines: Fine[] = studentIds.map((studentId, idx) => ({
      id: `fine-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId,
      studentId,
      reason: reason.trim(),
      date: date.trim(),
      amount,
      isPaid: false,
      createdAt: now,
    }));

    await updateAndPersist((prev) => ({
      ...prev,
      fines: [...newFines, ...prev.fines],
    }));

    return newFines.length;
  };

  const toggleFinePaid = async (fineId: string) => {
    await updateAndPersist((prev) => ({
      ...prev,
      fines: prev.fines.map((f) => (f.id === fineId ? { ...f, isPaid: !f.isPaid } : f)),
    }));
  };

  const deleteFine = async (fineId: string) => {
    await updateAndPersist(
      (prev) => ({
        ...prev,
        fines: prev.fines.filter((f) => f.id !== fineId),
      }),
      async (client) => {
        await deleteFineFromCloud(fineId, client);
      },
      { table: 'fines', id: fineId }
    );
  };

  // Computed Fine summaries
  const finesSummary = useMemo<FinesSummary>(() => {
    let totalPaid = 0;
    let totalUnpaid = 0;
    for (const f of state.fines) {
      if (f.isPaid) {
        totalPaid += f.amount;
      } else {
        totalUnpaid += f.amount;
      }
    }
    return {
      totalPaid,
      totalUnpaid,
      totalAll: totalPaid + totalUnpaid,
    };
  }, [state.fines]);

  const subjectFineStats = useMemo<SubjectFineStat[]>(() => {
    return state.subjects.map((subject) => {
      const subjectFines = state.fines.filter((f) => f.subjectId === subject.id);
      let totalPaid = 0;
      let totalUnpaid = 0;
      for (const f of subjectFines) {
        if (f.isPaid) totalPaid += f.amount;
        else totalUnpaid += f.amount;
      }
      return {
        subject,
        totalPaid,
        totalUnpaid,
        totalAll: totalPaid + totalUnpaid,
        count: subjectFines.length,
      };
    });
  }, [state.subjects, state.fines]);

  const studentFineStats = useMemo<StudentFineStat[]>(() => {
    return state.students.map((student) => {
      const studentFines = state.fines.filter((f) => f.studentId === student.id);
      let totalPaid = 0;
      let totalUnpaid = 0;
      let unpaidCount = 0;
      for (const f of studentFines) {
        if (f.isPaid) {
          totalPaid += f.amount;
        } else {
          totalUnpaid += f.amount;
          unpaidCount++;
        }
      }
      return {
        student,
        totalPaid,
        totalUnpaid,
        totalAll: totalPaid + totalUnpaid,
        unpaidCount,
      };
    });
  }, [state.students, state.fines]);

  const getStudentUnpaidFineBalance = (studentId: string): number => {
    return state.fines
      .filter((f) => f.studentId === studentId && !f.isPaid)
      .reduce((sum, f) => sum + f.amount, 0);
  };

  // Database actions
  const resetToDefaults = async () => {
    const defaults = await resetDatabaseToDefaults();
    setState(defaults);
    stateRef.current = defaults;
    const client = getSupabaseClient();
    if (client) {
      await pushLocalToCloud(defaults, client, user?.id);
    }
  };

  const importDatabase = async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString) as AppDatabaseState;
      if (Array.isArray(parsed.students) && Array.isArray(parsed.events)) {
        const sanitized: AppDatabaseState = {
          settings: {
            ecKbzpayName: parsed.settings?.ecKbzpayName || '',
            ecKbzpayPhone: parsed.settings?.ecKbzpayPhone || '',
            themeColorId: parsed.settings?.themeColorId || stateRef.current.settings.themeColorId || DEFAULT_THEME_COLOR_ID,
            themeMode:
              parsed.settings?.themeMode === 'light' || parsed.settings?.themeMode === 'dark'
                ? parsed.settings.themeMode
                : (stateRef.current.settings.themeMode || 'system'),
            language: parsed.settings?.language === 'en' ? 'en' : (stateRef.current.settings.language || 'my'),
          },
          students: Array.isArray(parsed.students) ? parsed.students : [],
          subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
          events: Array.isArray(parsed.events) ? parsed.events : [],
          eventRecords: Array.isArray(parsed.eventRecords) ? parsed.eventRecords : [],
          fines: Array.isArray(parsed.fines) ? parsed.fines : [],
          version: 2,
        };
        await saveDatabase(sanitized);
        setState(sanitized);
        stateRef.current = sanitized;
        const client = getSupabaseClient();
        if (client) {
          await pushLocalToCloud(sanitized, client, user?.id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getDatabaseJSON = () => {
    return JSON.stringify(state, null, 2);
  };

  // Supabase Auth & Cloud Sync
  const signInWithGoogle = async () => apiSignInWithGoogle();
  const signInWithEmail = async (email: string, password: string) =>
    apiSignInWithEmail(email, password);
  const signUpWithEmail = async (email: string, password: string, name?: string) =>
    apiSignUpWithEmail(email, password, name);
  const sendEmailOtp = async (email: string) => apiSendEmailOtp(email);
  const verifyEmailOtp = async (
    email: string,
    token: string,
    type: 'signup' | 'email' | 'recovery' = 'email'
  ) => apiVerifyEmailOtp(email, token, type);
  const resetPasswordForEmail = async (email: string) => apiResetPasswordForEmail(email);
  const updateUserPassword = async (newPassword: string) => apiUpdateUserPassword(newPassword);
  const signOut = async () => {
    try {
      await apiSignOutUser();
    } catch (err) {
      console.error('Failed to revoke session:', err);
    } finally {
      setUser(null);
      userRef.current = null;
      await resetDatabaseToDefaults();
      setState(INITIAL_STATE);
      stateRef.current = INITIAL_STATE;
      setLastSyncedAt(null);
      setHasPendingSync(false);
      await clearLastSyncedAt();
      await clearSyncQueue();
      setSyncStatus('idle');
      setSyncMessage('Signed out');
    }
  };

  const syncNow = async (mode: 'push' | 'pull' | 'merge' = 'merge'): Promise<SyncResult> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Cloud database is not configured.' };
    }

    const activeUser = userRef.current;
    if (!activeUser) {
      setSyncStatus('error');
      const msg = 'Cloud synchronization requires an authenticated account. Please sign in.';
      setSyncMessage(msg);
      return { success: false, message: msg };
    }

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setSyncStatus('idle');
      const msg = 'Offline mode — changes will sync automatically when connected.';
      setSyncMessage(msg);
      return { success: false, message: msg };
    }

    setSyncStatus('syncing');
    setSyncMessage(
      mode === 'push'
        ? 'Pushing data to cloud...'
        : mode === 'pull'
        ? 'Pulling data from cloud...'
        : 'Syncing local and cloud data...'
    );

    try {
      if (mode === 'push') {
        const queue = await loadSyncQueue();
        if (queue.pendingDeletes.length > 0) {
          const delRes = await flushPendingDeletes(client, queue.pendingDeletes);
          if (delRes.remaining.length > 0) {
            await saveSyncQueue({
              hasPendingPush: queue.hasPendingPush,
              pendingDeletes: delRes.remaining,
            });
            throw new Error(delRes.error || 'Failed to sync pending deletions.');
          }
        }
        const res = await pushLocalToCloud(stateRef.current, client, activeUser.id);
        if (res.success) {
          await clearSyncQueue();
          setHasPendingSync(false);
          setIsOnline(true);
          setSyncStatus('synced');
          setSyncMessage(`Successfully pushed to ${activeUser.email}`);
          const now = new Date().toISOString();
          setLastSyncedAt(now);
          await saveLastSyncedAt(now);
        } else if (isNetworkError(res.message)) {
          setIsOnline(false);
          setSyncStatus('idle');
          setSyncMessage('Offline mode — saved locally');
        } else {
          setSyncStatus('error');
          setSyncMessage(res.message);
        }
        return res;
      } else if (mode === 'pull') {
        const res = await pullCloudToLocal(client, activeUser.id, stateRef.current.settings);
        if (res.success && res.updatedState) {
          await clearSyncQueue();
          setHasPendingSync(false);
          setIsOnline(true);
          await applyCloudState(
            res.updatedState,
            new Date().toISOString(),
            `Successfully pulled for ${activeUser.email}`
          );
        } else if (isNetworkError(res.message)) {
          setIsOnline(false);
          setSyncStatus('idle');
          setSyncMessage('Offline mode — saved locally');
        } else {
          setSyncStatus('error');
          setSyncMessage(res.message);
        }
        return res;
      } else {
        const res = await syncWithCloud(stateRef.current, client, activeUser.id);
        if (res.success && res.updatedState) {
          setHasPendingSync(false);
          setIsOnline(true);
          await applyCloudState(
            res.updatedState,
            res.syncedAt || new Date().toISOString(),
            `Synced with ${activeUser.email}`
          );
        } else if (isNetworkError(res.message)) {
          setIsOnline(false);
          setSyncStatus('idle');
          setSyncMessage('Offline mode — saved locally');
        } else {
          setSyncStatus('error');
          setSyncMessage(res.message);
        }
        return res;
      }
    } catch (err: any) {
      if (isNetworkError(err)) {
        setIsOnline(false);
        setSyncStatus('idle');
        setSyncMessage('Offline mode — saved locally');
        return { success: false, message: 'Offline mode — saved locally' };
      }
      setSyncStatus('error');
      setSyncMessage(err.message || 'Sync operation failed');
      return { success: false, message: err.message || 'Sync failed' };
    }
  };

  const refreshCloudConnection = async () => {
    const client = getSupabaseClient();
    if (client) {
      if (realtimeUnsubRef.current) realtimeUnsubRef.current();
      realtimeUnsubRef.current = subscribeToTreasuryRealtime(client, () => {
        if (isPushingRef.current || isSyncingRef.current) return;
        if (realtimeDebounceTimerRef.current) {
          clearTimeout(realtimeDebounceTimerRef.current);
        }
        realtimeDebounceTimerRef.current = setTimeout(async () => {
          if (isPushingRef.current || isSyncingRef.current) return;
          const activeUser = userRef.current || (await getCurrentUser());
          if (!activeUser?.id) return;
          const res = await syncWithCloud(stateRef.current, client, activeUser.id);
          if (res.success && res.updatedState) {
            setHasPendingSync(false);
            setIsOnline(true);
            await applyCloudState(res.updatedState, res.syncedAt || new Date().toISOString());
          }
        }, 800);
      });
      await syncNow('merge');
    } else {
      setSyncStatus('disabled');
      if (realtimeUnsubRef.current) realtimeUnsubRef.current();
    }
  };

  return (
    <TreasuryContext.Provider
      value={{
        settings: state.settings,
        students: state.students,
        subjects: state.subjects,
        events: state.events,
        eventRecords: state.eventRecords,
        fines: state.fines,
        isLoading,
        isDark,
        themeMode,
        setThemeMode,
        themeColor,
        palette,
        language,
        setLanguage,
        t,
        updateSettings,
        addStudent,
        updateStudent,
        deleteStudent,
        addSubject,
        updateSubject,
        deleteSubject,
        addEvent,
        updateEvent,
        deleteEvent,
        recordDonation,
        deleteEventRecord,
        setEventStudentPaid,
        getEventStats,
        batchCreateFines,
        toggleFinePaid,
        deleteFine,
        finesSummary,
        subjectFineStats,
        studentFineStats,
        getStudentUnpaidFineBalance,
        resetToDefaults,
        importDatabase,
        getDatabaseJSON,
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
        isOnline,
        hasPendingSync,
        syncNow,
        refreshCloudConnection,
      }}
    >
      {children}
    </TreasuryContext.Provider>
  );
};

export const useTreasury = () => {
  const context = useContext(TreasuryContext);
  if (!context) {
    throw new Error('useTreasury must be used within a TreasuryProvider');
  }
  return context;
};

export const useAppTheme = () => {
  const { themeColor, palette, isDark, themeMode, setThemeMode, settings, updateSettings } =
    useTreasury();
  return {
    themeColor,
    isDark,
    palette,
    themeColorId: (settings.themeColorId as ThemeColorId) || DEFAULT_THEME_COLOR_ID,
    setThemeColor: async (themeColorId: ThemeColorId) => {
      await updateSettings({
        themeColorId,
      });
    },
    themeMode,
    setThemeMode,
  };
};

export const useTranslation = () => {
  const { language, setLanguage, t } = useTreasury();
  return { language, setLanguage, t };
};
