import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabaseTypes';

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

export async function getAttendanceByStudent(studentId: string, startDate: string, endDate: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any)
    .from('attendance_records')
    .select('date, status')
    .eq('student_id', studentId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
}

export async function hasAttendanceForDate(date: string, classSection: string) {
  if (!supabase) return { exists: false, error: new Error('Supabase is not configured') };
  const [cls, sec] = classSection.split('-');
  const { count, error } = await (supabase as any)
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('date', date)
    .eq('class', cls)
    .eq('section', sec);
  return { exists: !error && (count ?? 0) > 0, error };
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
