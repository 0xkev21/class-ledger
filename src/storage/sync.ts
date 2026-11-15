import { SupabaseClient } from '@supabase/supabase-js';
import {
  AppDatabaseState,
  AppSettings,
  Event,
  EventRecord,
  Fine,
  Student,
  Subject,
} from '../types';

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
  try {
    // 1. Settings (if user is authenticated)
    if (userId && (local.settings.ecKbzpayName || local.settings.ecKbzpayPhone)) {
      const { error: settingsError } = await client.from('settings').upsert({
        user_id: userId,
        ec_kbzpay_name: local.settings.ecKbzpayName,
        ec_kbzpay_phone: local.settings.ecKbzpayPhone,
        updated_at: new Date().toISOString(),
      });
      if (settingsError) throw new Error(formatSyncError('settings', settingsError));
    }

    // 2. Students
    if (local.students.length > 0) {
      const studentRows = local.students.map((s) => ({
        id: s.id,
        user_id: userId || null,
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
        user_id: userId || null,
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
        user_id: userId || null,
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
        user_id: userId || null,
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
        user_id: userId || null,
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
  userId?: string
): Promise<SyncResult> {
  try {
    let stuQuery = client.from('students').select('*').order('name', { ascending: true });
    let subQuery = client.from('subjects').select('*').order('name', { ascending: true });
    let evQuery = client.from('events').select('*').order('created_at', { ascending: false });
    let recQuery = client.from('event_records').select('*').order('created_at', { ascending: false });
    let fineQuery = client.from('fines').select('*').order('created_at', { ascending: false });

    if (userId) {
      stuQuery = stuQuery.eq('user_id', userId);
      subQuery = subQuery.eq('user_id', userId);
      evQuery = evQuery.eq('user_id', userId);
      recQuery = recQuery.eq('user_id', userId);
      fineQuery = fineQuery.eq('user_id', userId);
    }

    const [stuRes, subRes, evRes, recRes, fineRes] = await Promise.all([
      stuQuery,
      subQuery,
      evQuery,
      recQuery,
      fineQuery,
    ]);

    if (stuRes.error) throw new Error(formatSyncError('students', stuRes.error));
    if (subRes.error) throw new Error(formatSyncError('subjects', subRes.error));
    if (evRes.error) throw new Error(formatSyncError('events', evRes.error));
    if (recRes.error) throw new Error(formatSyncError('event_records', recRes.error));
    if (fineRes.error) throw new Error(formatSyncError('fines', fineRes.error));

    let settings: AppSettings = { ecKbzpayName: '', ecKbzpayPhone: '' };
    if (userId) {
      try {
        const { data: settingsData } = await client
          .from('settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (settingsData) {
          settings = {
            ecKbzpayName: settingsData.ec_kbzpay_name || '',
            ecKbzpayPhone: settingsData.ec_kbzpay_phone || '',
          };
        }
      } catch {
        // Non-fatal if settings table is not yet created
      }
    }

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
