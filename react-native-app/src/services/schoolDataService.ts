import { supabase } from '../lib/supabase';
import type { Database } from '../../../src/lib/supabaseTypes';

type AttendanceInsert = Database['public']['Tables']['attendance_records']['Insert'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export async function saveAttendanceRecords(records: AttendanceInsert[]) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any)
    .from('attendance_records')
    .upsert(records, { onConflict: 'student_id,date' })
    .select();
}

export async function createNotifications(records: NotificationInsert[]) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any).from('notifications').insert(records).select();
}

export async function getNotifications() {
  if (!supabase) return { data: [], error: new Error('Supabase is not configured') };
  return (supabase as any)
    .from('notifications')
    .select('*')
    .order('time', { ascending: false });
}

export async function markNotificationRead(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any).from('notifications').update({ read: true }).eq('id', id).select();
}
