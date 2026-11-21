import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_THEME_COLOR_ID } from '../theme/themeColors';
import {
  AppDatabaseState,
  AppSettings,
  Event,
  EventRecord,
  Fine,
  Student,
  Subject,
} from '../types';

const SYNC_QUEUE_KEY = '@ec_treasury_sync_queue_v1';

export type SyncTable = 'students' | 'subjects' | 'events' | 'event_records' | 'fines';

export interface PendingDelete {
  table: SyncTable;
  id: string;
}

export interface SyncQueueState {
  hasPendingPush: boolean;
  pendingDeletes: PendingDelete[];
}

const EMPTY_SYNC_QUEUE: SyncQueueState = {
  hasPendingPush: false,
  pendingDeletes: [],
};

export async function loadSyncQueue(): Promise<SyncQueueState> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return EMPTY_SYNC_QUEUE;
    const parsed = JSON.parse(raw);
    return {
      hasPendingPush: Boolean(parsed?.hasPendingPush),
      pendingDeletes: Array.isArray(parsed?.pendingDeletes) ? parsed.pendingDeletes : [],
    };
  } catch {
    return EMPTY_SYNC_QUEUE;
  }
}

export async function saveSyncQueue(queue: SyncQueueState): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to persist sync queue:', err);
  }
}

export async function markPendingPush(): Promise<SyncQueueState> {
  const current = await loadSyncQueue();
  const next: SyncQueueState = { ...current, hasPendingPush: true };
  await saveSyncQueue(next);
  return next;
}

export async function enqueuePendingDelete(
  table: SyncTable,
  id: string
): Promise<SyncQueueState> {
  const current = await loadSyncQueue();
  const exists = current.pendingDeletes.some((d) => d.table === table && d.id === id);
  const pendingDeletes = exists
    ? current.pendingDeletes
    : [...current.pendingDeletes, { table, id }];
  const next: SyncQueueState = { hasPendingPush: true, pendingDeletes };
  await saveSyncQueue(next);
  return next;
}

export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch {
    // ignore
  }
}

export function isNetworkError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('offline') ||
    msg.includes('internet') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound')
  );
}

export interface SyncResult {
  success: boolean;
  message: string;
  syncedAt?: string;
  updatedState?: AppDatabaseState;
}

/**
 * Normalizes error messages from PostgREST/Supabase into actionable descriptions
 */
function formatSyncError(tableName: string, error: any): string {
  const msg = error?.message || String(error || '');
  const code = error?.code || '';

  if (
    code === '42P01' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  ) {
    return `Supabase database တွင် '${tableName}' ဇယား မရှိသေးပါ။ ကျေးဇူးပြု၍ Supabase SQL Editor တွင် supabase/schema.sql ကို Run ပေးပါ။ (Missing '${tableName}' table in Supabase)`;
  }

  return `${tableName} sync failed: ${msg}`;
}

/**
 * Pushes entire local database state to Supabase PostgreSQL cloud tables via upsert.
 */
export async function pushLocalToCloud(
  local: AppDatabaseState,
  client: SupabaseClient,
  userId?: string
): Promise<SyncResult> {
  if (!userId) {
    return {
      success: false,
      message: 'Cloud sync requires an authenticated user account.',
    };
  }

  try {
    // 1. Settings (for authenticated user)
    try {
      const payload: Record<string, any> = {
        user_id: userId,
        ec_kbzpay_name: local.settings.ecKbzpayName || '',
        ec_kbzpay_phone: local.settings.ecKbzpayPhone || '',
        updated_at: new Date().toISOString(),
      };
      if (local.settings.themeColorId) {
        payload.theme_color_id = local.settings.themeColorId;
      }
      if (local.settings.language) {
        payload.language = local.settings.language;
      }

      const { error: settingsError } = await client.from('settings').upsert(payload);
      if (settingsError) {
        // If remote schema does not have theme_color_id or language columns yet, fallback gracefully
        await client.from('settings').upsert({
          user_id: userId,
          ec_kbzpay_name: local.settings.ecKbzpayName || '',
          ec_kbzpay_phone: local.settings.ecKbzpayPhone || '',
          updated_at: new Date().toISOString(),
        });
      }
    } catch (settingsErr) {
      console.warn('Non-fatal settings sync warning:', settingsErr);
    }

    // 2. Students
    if (local.students.length > 0) {
      const studentRows = local.students.map((s) => ({
        id: s.id,
        user_id: userId,
        name: s.name,
        roll_number: s.rollNumber || null,
        phone: s.phone || null,
        created_at: s.createdAt,
      }));
      const { error: stuError } = await client.from('students').upsert(studentRows);
      if (stuError) throw new Error(formatSyncError('students', stuError));
    }

    // 3. Subjects
    if (local.subjects.length > 0) {
      const subjectRows = local.subjects.map((sub) => ({
        id: sub.id,
        user_id: userId,
        name: sub.name,
        created_at: sub.createdAt,
      }));
      const { error: subError } = await client.from('subjects').upsert(subjectRows);
      if (subError) throw new Error(formatSyncError('subjects', subError));
    }

    // 4. Events
    if (local.events.length > 0) {
      const eventRows = local.events.map((e) => ({
        id: e.id,
        user_id: userId,
        name: e.name,
        type: e.type,
        fixed_amount: e.fixedAmount ?? null,
        due_date: e.dueDate || null,
        extra_note: e.extraNote || null,
        created_at: e.createdAt,
      }));
      const { error: evError } = await client.from('events').upsert(eventRows);
      if (evError) throw new Error(formatSyncError('events', evError));
    }

    // 5. Event Records
    if (local.eventRecords.length > 0) {
      const recordRows = local.eventRecords.map((r) => ({
        id: r.id,
        user_id: userId,
        event_id: r.eventId,
        student_id: r.studentId,
        amount: r.amount,
        is_paid: r.isPaid,
        created_at: r.createdAt,
      }));
      const { error: recError } = await client.from('event_records').upsert(recordRows);
      if (recError) throw new Error(formatSyncError('event_records', recError));
    }

    // 6. Fines
    if (local.fines.length > 0) {
      const fineRows = local.fines.map((f) => ({
        id: f.id,
        user_id: userId,
        subject_id: f.subjectId,
        student_id: f.studentId,
        reason: f.reason,
        date: f.date,
        amount: f.amount,
        is_paid: f.isPaid,
        created_at: f.createdAt,
      }));
      const { error: fineError } = await client.from('fines').upsert(fineRows);
      if (fineError) throw new Error(formatSyncError('fines', fineError));
    }

    return {
      success: true,
      message: 'ဒေတာများကို Cloud ပေါ်သို့ အောင်မြင်စွာ တင်ပြီးပါပြီ!',
      syncedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Push sync failed',
    };
  }
}

/**
 * Pulls all data from Supabase cloud tables into the local state format.
 */
export async function pullCloudToLocal(
  client: SupabaseClient,
  userId?: string,
  currentSettings?: AppSettings
): Promise<SyncResult> {
  if (!userId) {
    return {
      success: false,
      message: 'Cloud sync requires an authenticated user account.',
    };
  }

  try {
    const [stuRes, subRes, evRes, recRes, fineRes] = await Promise.all([
      client.from('students').select('*').eq('user_id', userId).order('name', { ascending: true }),
      client.from('subjects').select('*').eq('user_id', userId).order('name', { ascending: true }),
      client.from('events').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      client.from('event_records').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      client.from('fines').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    if (stuRes.error) throw new Error(formatSyncError('students', stuRes.error));
    if (subRes.error) throw new Error(formatSyncError('subjects', subRes.error));
    if (evRes.error) throw new Error(formatSyncError('events', evRes.error));
    if (recRes.error) throw new Error(formatSyncError('event_records', recRes.error));
    if (fineRes.error) throw new Error(formatSyncError('fines', fineRes.error));

    let cloudSettings: Partial<AppSettings> = {};

    if (userId) {
      try {
        const { data: settingsData } = await client
          .from('settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (settingsData) {
          const rawTheme = settingsData.theme_color_id;
          cloudSettings = {
            ecKbzpayName: settingsData.ec_kbzpay_name || '',
            ecKbzpayPhone: settingsData.ec_kbzpay_phone || '',
            ...(rawTheme && rawTheme !== 'custom' ? { themeColorId: rawTheme as any } : {}),
            ...(settingsData.language ? { language: settingsData.language as any } : {}),
          };
        }
      } catch {
        // Non-fatal if settings table is not yet created
      }
    }

    const settings: AppSettings = {
      ecKbzpayName: cloudSettings.ecKbzpayName ?? currentSettings?.ecKbzpayName ?? '',
      ecKbzpayPhone: cloudSettings.ecKbzpayPhone ?? currentSettings?.ecKbzpayPhone ?? '',
      themeColorId:
        currentSettings?.themeColorId ?? cloudSettings.themeColorId ?? DEFAULT_THEME_COLOR_ID,
      themeMode: currentSettings?.themeMode ?? 'system',
      language: currentSettings?.language ?? cloudSettings.language ?? 'my',
    };

    const students: Student[] = (stuRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      rollNumber: row.roll_number || undefined,
      phone: row.phone || undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }));

    const subjects: Subject[] = (subRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at || new Date().toISOString(),
    }));

    const events: Event[] = (evRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      fixedAmount: row.fixed_amount ?? undefined,
      dueDate: row.due_date || undefined,
      extraNote: row.extra_note || undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }));

    const eventRecords: EventRecord[] = (recRes.data || []).map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      studentId: row.student_id,
      amount: row.amount,
      isPaid: Boolean(row.is_paid),
      createdAt: row.created_at || new Date().toISOString(),
    }));

    const fines: Fine[] = (fineRes.data || []).map((row: any) => ({
      id: row.id,
      subjectId: row.subject_id,
      studentId: row.student_id,
      reason: row.reason,
      date: row.date,
      amount: row.amount,
      isPaid: Boolean(row.is_paid),
      createdAt: row.created_at || new Date().toISOString(),
    }));

    const syncedAt = new Date().toISOString();
    const updatedState: AppDatabaseState = {
      settings,
      students,
      subjects,
      events,
      eventRecords,
      fines,
      version: 2,
    };

    return {
      success: true,
      message: 'Cloud မှ စာရင်းများကို အောင်မြင်စွာ ရယူပြီးပါပြီ!',
      syncedAt,
      updatedState,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Pull sync failed',
    };
  }
}

export async function deleteStudentFromCloud(
  studentId: string,
  client: SupabaseClient
): Promise<void> {
  try {
    await client.from('students').delete().eq('id', studentId);
  } catch (err) {
    console.error(`Failed to delete student ${studentId} from cloud:`, err);
  }
}

export async function deleteSubjectFromCloud(
  subjectId: string,
  client: SupabaseClient
): Promise<void> {
  try {
    await client.from('subjects').delete().eq('id', subjectId);
  } catch (err) {
    console.error(`Failed to delete subject ${subjectId} from cloud:`, err);
  }
}

export async function deleteEventFromCloud(
  eventId: string,
  client: SupabaseClient
): Promise<void> {
  try {
    await client.from('events').delete().eq('id', eventId);
  } catch (err) {
    console.error(`Failed to delete event ${eventId} from cloud:`, err);
  }
}

export async function deleteEventRecordFromCloud(
  recordId: string,
  client: SupabaseClient
): Promise<void> {
  try {
    await client.from('event_records').delete().eq('id', recordId);
  } catch (err) {
    console.error(`Failed to delete event record ${recordId} from cloud:`, err);
  }
}

export async function deleteFineFromCloud(
  fineId: string,
  client: SupabaseClient
): Promise<void> {
  try {
    await client.from('fines').delete().eq('id', fineId);
  } catch (err) {
    console.error(`Failed to delete fine ${fineId} from cloud:`, err);
  }
}

export async function flushPendingDeletes(
  client: SupabaseClient,
  pendingDeletes: PendingDelete[]
): Promise<{ remaining: PendingDelete[]; error?: string }> {
  const remaining: PendingDelete[] = [];
  let lastError: string | undefined;

  for (const item of pendingDeletes) {
    try {
      const { error } = await client.from(item.table).delete().eq('id', item.id);
      if (error) {
        remaining.push(item);
        lastError = error.message;
      }
    } catch (err: any) {
      remaining.push(item);
      lastError = err?.message || 'Delete failed';
    }
  }

  return { remaining, error: lastError };
}

function mergeById<T extends { id: string }>(
  cloudItems: T[],
  localItems: T[],
  deletedIds: Set<string>,
  preferLocal: boolean
): T[] {
  const map = new Map<string, T>();

  if (preferLocal) {
    for (const item of cloudItems) {
      if (!deletedIds.has(item.id)) map.set(item.id, item);
    }
    for (const item of localItems) {
      if (!deletedIds.has(item.id)) map.set(item.id, item);
    }
  } else {
    for (const item of localItems) {
      if (!deletedIds.has(item.id)) map.set(item.id, item);
    }
    for (const item of cloudItems) {
      if (!deletedIds.has(item.id)) map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}

/**
 * Auto-merges local and cloud datasets by record ID while respecting pending offline deletions.
 */
export function mergeLocalAndCloudState(
  local: AppDatabaseState,
  cloud: AppDatabaseState,
  pendingDeletes: PendingDelete[],
  preferLocalOnConflict: boolean
): AppDatabaseState {
  const deletedByTable = new Map<SyncTable, Set<string>>();
  for (const del of pendingDeletes) {
    let set = deletedByTable.get(del.table);
    if (!set) {
      set = new Set<string>();
      deletedByTable.set(del.table, set);
    }
    set.add(del.id);
  }

  const getDeleted = (table: SyncTable) => deletedByTable.get(table) ?? new Set<string>();

  const students = mergeById(
    cloud.students,
    local.students,
    getDeleted('students'),
    preferLocalOnConflict
  );
  const subjects = mergeById(
    cloud.subjects,
    local.subjects,
    getDeleted('subjects'),
    preferLocalOnConflict
  );
  const events = mergeById(
    cloud.events,
    local.events,
    getDeleted('events'),
    preferLocalOnConflict
  );
  const eventRecords = mergeById(
    cloud.eventRecords,
    local.eventRecords,
    getDeleted('event_records'),
    preferLocalOnConflict
  );
  const fines = mergeById(
    cloud.fines,
    local.fines,
    getDeleted('fines'),
    preferLocalOnConflict
  );

  const settings: AppSettings = {
    ecKbzpayName: preferLocalOnConflict
      ? local.settings.ecKbzpayName || cloud.settings.ecKbzpayName || ''
      : cloud.settings.ecKbzpayName || local.settings.ecKbzpayName || '',
    ecKbzpayPhone: preferLocalOnConflict
      ? local.settings.ecKbzpayPhone || cloud.settings.ecKbzpayPhone || ''
      : cloud.settings.ecKbzpayPhone || local.settings.ecKbzpayPhone || '',
    themeColorId:
      local.settings.themeColorId || cloud.settings.themeColorId || DEFAULT_THEME_COLOR_ID,
    themeMode: local.settings.themeMode || 'system',
    language: local.settings.language || cloud.settings.language || 'my',
  };

  return {
    settings,
    students,
    subjects,
    events,
    eventRecords,
    fines,
    version: 2,
  };
}

/**
 * Bidirectional auto-merge sync:
 * 1. Flushes any pending offline deletions
 * 2. Pulls cloud data
 * 3. Merges local + cloud by ID (local wins on conflicts if there were pending offline edits)
 * 4. Pushes merged state to cloud if local had pending edits or local-only records
 */
export async function syncWithCloud(
  local: AppDatabaseState,
  client: SupabaseClient,
  userId?: string
): Promise<SyncResult> {
  if (!userId) {
    return {
      success: false,
      message: 'Cloud sync requires an authenticated user account.',
    };
  }

  try {
    const queue = await loadSyncQueue();

    if (queue.pendingDeletes.length > 0) {
      const delRes = await flushPendingDeletes(client, queue.pendingDeletes);
      if (delRes.remaining.length > 0) {
        await saveSyncQueue({ ...queue, pendingDeletes: delRes.remaining });
        return {
          success: false,
          message: delRes.error || 'Failed to sync pending deletions.',
        };
      }
      queue.pendingDeletes = [];
      await saveSyncQueue(queue);
    }

    const pullRes = await pullCloudToLocal(client, userId, local.settings);
    if (!pullRes.success || !pullRes.updatedState) {
      return pullRes;
    }

    const cloud = pullRes.updatedState;
    const merged = mergeLocalAndCloudState(
      local,
      cloud,
      queue.pendingDeletes,
      queue.hasPendingPush
    );

    const hasLocalOnlyRecords =
      merged.students.length > cloud.students.length ||
      merged.subjects.length > cloud.subjects.length ||
      merged.events.length > cloud.events.length ||
      merged.eventRecords.length > cloud.eventRecords.length ||
      merged.fines.length > cloud.fines.length;

    if (queue.hasPendingPush || hasLocalOnlyRecords) {
      const pushRes = await pushLocalToCloud(merged, client, userId);
      if (!pushRes.success) {
        return {
          success: false,
          message: pushRes.message,
          updatedState: merged,
        };
      }
      await clearSyncQueue();
    } else {
      await clearSyncQueue();
    }

    return {
      success: true,
      message: 'Synced local and cloud data.',
      syncedAt: new Date().toISOString(),
      updatedState: merged,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Sync failed',
    };
  }
}

export function subscribeToTreasuryRealtime(
  client: SupabaseClient,
  onChange: () => void
): () => void {
  try {
    const channel = client
      .channel('ec_treasury_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_records' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fines' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subjects' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => onChange()
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}
