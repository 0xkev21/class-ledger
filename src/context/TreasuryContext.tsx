import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { User } from '@supabase/supabase-js';
import { useColorScheme } from '@/components/useColorScheme';
import { INITIAL_STATE, loadDatabase, resetDatabaseToDefaults, saveDatabase } from '../storage/db';
import {
  ActiveThemeColor,
  resolveThemeColor,
  ThemeColorId,
} from '../theme/themeColors';
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
  deleteEventFromCloud,
  deleteEventRecordFromCloud,
  deleteFineFromCloud,
  deleteStudentFromCloud,
  deleteSubjectFromCloud,
  pullCloudToLocal,
  pushLocalToCloud,
  subscribeToTreasuryRealtime,
  SyncResult,
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
  themeColor: ActiveThemeColor;
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
  syncNow: (mode?: 'push' | 'pull') => Promise<SyncResult>;
  refreshCloudConnection: () => Promise<void>;
}

const TreasuryContext = createContext<TreasuryContextType | null>(null);

export const TreasuryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppDatabaseState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Supabase Sync States
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Debounce ref for auto-pushing local changes to cloud
  const pushDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPushingRef = useRef<boolean>(false);
  const realtimeUnsubRef = useRef<(() => void) | null>(null);
  const authUnsubRef = useRef<(() => void) | null>(null);

  const isCloudConnected = isCloudConfigured();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColor = useMemo(() => {
    return resolveThemeColor(
      state.settings.themeColorId,
      isDark
    );
  }, [state.settings.themeColorId, isDark]);

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
        themeColorId: prev.settings.themeColorId || cloudState.settings.themeColorId || 'indigo',
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

    (async () => {
      try {
        // 1. Instant local load
        const localData = await loadDatabase();
        if (isMounted) {
          setState(localData);
          stateRef.current = localData;
          setIsLoading(false);
        }

        // 2. Load last cloud sync timestamp
        const lastSync = await getLastSyncedAt();
        if (lastSync && isMounted) {
          setLastSyncedAt(lastSync);
        }

        // 3. Connect and auto-sync if credentials exist
        const client = getSupabaseClient();
        if (client) {
          getCurrentUser()
            .then((u) => {
              if (isMounted) {
                setUser(u);
                setIsAuthLoading(false);
              }
            })
            .catch((err) => {
              console.warn('[TreasuryContext] Initial auth check notice:', err);
              if (isMounted) {
                setUser(null);
                setIsAuthLoading(false);
              }
            });

          if (authUnsubRef.current) authUnsubRef.current();
          authUnsubRef.current = subscribeToAuthChanges(async (newUser) => {
            if (!isMounted) return;
            setUser(newUser);
            setIsAuthLoading(false);

            if (newUser) {
              setSyncStatus('syncing');
              setSyncMessage('Google အကောင့်နှင့် ချိတ်ဆက်ပြီး Cloud စာရင်းရယူနေပါသည်...');
              try {
                const pullRes = await pullCloudToLocal(client, newUser.id, stateRef.current.settings);
                if (pullRes.success && pullRes.updatedState) {
                  const cloudHasData =
                    pullRes.updatedState.students.length > 0 ||
                    pullRes.updatedState.events.length > 0 ||
                    pullRes.updatedState.fines.length > 0;

                  if (cloudHasData) {
                    await applyCloudState(
                      pullRes.updatedState,
                      pullRes.syncedAt || new Date().toISOString(),
                      `Synced with ${newUser.email}`
                    );
                  } else if (
                    stateRef.current.students.length > 0 ||
                    stateRef.current.events.length > 0 ||
                    stateRef.current.fines.length > 0
                  ) {
                    const pushRes = await pushLocalToCloud(stateRef.current, client, newUser.id);
                    if (pushRes.success) {
                      setSyncStatus('synced');
                      setSyncMessage(`Local data uploaded to ${newUser.email}`);
                      const now = pushRes.syncedAt || new Date().toISOString();
                      setLastSyncedAt(now);
                      await saveLastSyncedAt(now);
                    }
                  } else {
                    setSyncStatus('synced');
                    setSyncMessage(`Connected as ${newUser.email}`);
                  }
                } else if (!pullRes.success) {
                  setSyncStatus('error');
                  setSyncMessage(pullRes.message);
                }
              } catch (err: any) {
                console.warn('Initial user sync error:', err);
                setSyncStatus('error');
                setSyncMessage(err.message || 'Sync error');
              }
            } else {
              setSyncStatus('idle');
            }
          });

          try {
            const currentUser = await getCurrentUser();
            if (currentUser?.id) {
              setSyncStatus('syncing');
              setSyncMessage('Checking cloud database...');
              const pullRes = await pullCloudToLocal(client, currentUser.id, localData.settings);
              if (!isMounted) return;

              if (pullRes.success && pullRes.updatedState) {
                const cloudHasData =
                  pullRes.updatedState.students.length > 0 ||
                  pullRes.updatedState.events.length > 0 ||
                  pullRes.updatedState.fines.length > 0;

                if (cloudHasData) {
                  await applyCloudState(
                    pullRes.updatedState,
                    pullRes.syncedAt || new Date().toISOString(),
                    `Synced with ${currentUser.email}`
                  );
                } else {
                  const pushRes = await pushLocalToCloud(localData, client, currentUser.id);
                  if (pushRes.success) {
                    setSyncStatus('synced');
                    setSyncMessage('Cloud database initialized!');
                    const now = pushRes.syncedAt || new Date().toISOString();
                    setLastSyncedAt(now);
                    await saveLastSyncedAt(now);
                  }
                }

                if (realtimeUnsubRef.current) realtimeUnsubRef.current();
                realtimeUnsubRef.current = subscribeToTreasuryRealtime(client, () => {
                  if (isPushingRef.current) return;
                  if (realtimeDebounceTimerRef.current) {
                    clearTimeout(realtimeDebounceTimerRef.current);
                  }
                  realtimeDebounceTimerRef.current = setTimeout(async () => {
                    try {
                      if (!isMounted || isPushingRef.current) return;
                      const activeUser = await getCurrentUser();
                      if (!activeUser?.id) return;
                      const updateRes = await pullCloudToLocal(client, activeUser.id, stateRef.current.settings);
                      if (updateRes.success && updateRes.updatedState && isMounted) {
                        await applyCloudState(updateRes.updatedState, new Date().toISOString());
                      }
                    } catch (rtErr) {
                      console.warn('[TreasuryContext] Realtime sync notice:', rtErr);
                    }
                  }, 800);
                });
              } else {
                setSyncStatus('error');
                setSyncMessage(pullRes.message);
              }
            } else {
              setSyncStatus('idle');
            }
          } catch (syncErr: any) {
            console.warn('[TreasuryContext] Initial sync notice:', syncErr?.message || syncErr);
            setSyncStatus('error');
            setSyncMessage(syncErr?.message || 'Offline mode');
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
      if (client) {
        getCurrentUser()
          .then((activeUser) => {
            if (activeUser?.id) {
              pullCloudToLocal(client, activeUser.id, stateRef.current.settings)
                .then((updateRes) => {
                  if (updateRes.success && updateRes.updatedState && isMounted) {
                    applyCloudState(updateRes.updatedState, updateRes.syncedAt || new Date().toISOString());
                  }
                })
                .catch(() => {});
            }
          })
          .catch(() => {});
      }
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
          }
        } else if (res.error) {
          console.warn('[TreasuryContext] Cold start deep link authentication rejected:', res.error);
        }
      }
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', handleAppResume);
    }

    return () => {
      isMounted = false;
      appStateSub.remove();
      linkSub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('focus', handleAppResume);
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
    cloudAction?: (client: any) => Promise<void>
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

    const client = getSupabaseClient();
    if (client) {
      setSyncStatus('syncing');
      setSyncMessage('အလိုအလျောက် Cloud သို့ သိမ်းဆည်းနေပါသည်...');

      if (pushDebounceTimerRef.current) {
        clearTimeout(pushDebounceTimerRef.current);
      }

      pushDebounceTimerRef.current = setTimeout(async () => {
        try {
          isPushingRef.current = true;
          if (cloudAction) {
            await cloudAction(client);
          }
          const res = await pushLocalToCloud(next, client, user?.id);
          if (res.success) {
            setSyncStatus('synced');
            setSyncMessage(user ? `အလိုအလျောက် သိမ်းဆည်းပြီးပါပြီ (${user.email})` : 'Cloud သို့ အလိုအလျောက် သိမ်းဆည်းပြီးပါပြီ');
            const now = new Date().toISOString();
            setLastSyncedAt(now);
            await saveLastSyncedAt(now);
          } else {
            setSyncStatus('error');
            setSyncMessage(res.message);
          }
        } catch (err: any) {
          setSyncStatus('error');
          setSyncMessage(err.message || 'Auto sync failed');
        } finally {
          setTimeout(() => {
            isPushingRef.current = false;
          }, 1200);
        }
      }, 500);
    }
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
          theme_color_id: next.settings.themeColorId || 'indigo',
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
      }
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
      }
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
      }
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
      }
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
      }
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
            themeColorId: parsed.settings?.themeColorId || stateRef.current.settings.themeColorId || 'indigo',
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
      await resetDatabaseToDefaults();
      setState(INITIAL_STATE);
      stateRef.current = INITIAL_STATE;
      setLastSyncedAt(null);
      await clearLastSyncedAt();
      setSyncStatus('idle');
      setSyncMessage('Signed out');
    }
  };

  const syncNow = async (mode: 'push' | 'pull' = 'pull'): Promise<SyncResult> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Cloud database is not configured.' };
    }

    if (!user) {
      setSyncStatus('error');
      const msg = 'Cloud synchronization requires an authenticated account. Please sign in.';
      setSyncMessage(msg);
      return { success: false, message: msg };
    }

    setSyncStatus('syncing');
    setSyncMessage(mode === 'push' ? 'Pushing data to cloud...' : 'Pulling data from cloud...');

    try {
      if (mode === 'push') {
        const res = await pushLocalToCloud(state, client, user.id);
        if (res.success) {
          setSyncStatus('synced');
          setSyncMessage(`Successfully pushed to ${user.email}`);
          const now = new Date().toISOString();
          setLastSyncedAt(now);
          await saveLastSyncedAt(now);
        } else {
          setSyncStatus('error');
          setSyncMessage(res.message);
        }
        return res;
      } else {
        const res = await pullCloudToLocal(client, user.id, stateRef.current.settings);
        if (res.success && res.updatedState) {
          await applyCloudState(
            res.updatedState,
            new Date().toISOString(),
            user ? `Successfully pulled for ${user.email}` : 'Successfully pulled from Supabase'
          );
        } else {
          setSyncStatus('error');
          setSyncMessage(res.message);
        }
        return res;
      }
    } catch (err: any) {
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
        if (isPushingRef.current) return;
        if (realtimeDebounceTimerRef.current) {
          clearTimeout(realtimeDebounceTimerRef.current);
        }
        realtimeDebounceTimerRef.current = setTimeout(async () => {
          if (isPushingRef.current) return;
          const activeUser = await getCurrentUser();
          const updateRes = await pullCloudToLocal(client, activeUser?.id, stateRef.current.settings);
          if (updateRes.success && updateRes.updatedState) {
            await applyCloudState(updateRes.updatedState, new Date().toISOString());
          }
        }, 800);
      });
      syncNow('pull');
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
        themeColor,
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
  const { themeColor, settings, updateSettings } = useTreasury();
  const colorScheme = useColorScheme();
  return {
    themeColor,
    isDark: colorScheme === 'dark',
    themeColorId: (settings.themeColorId as ThemeColorId) || 'indigo',
    setThemeColor: async (themeColorId: ThemeColorId) => {
      await updateSettings({
        themeColorId,
      });
    },
  };
};

export const useTranslation = () => {
  const { language, setLanguage, t } = useTreasury();
  return { language, setLanguage, t };
};
