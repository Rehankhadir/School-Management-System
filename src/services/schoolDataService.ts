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

export async function getAttendanceByDateRange(startDate: string, endDate: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any)
    .from('attendance_records')
    .select('id, student_id, class, section, date, status, marked_by')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
}

export async function updateAttendanceRecord(id: string, status: string, reason: string, overriddenBy: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  const now = new Date().toISOString();
  return (supabase as any)
    .from('attendance_records')
    .update({ status, marked_by: overriddenBy })
    .eq('id', id)
    .select();
}

export async function getAttendanceStatsForDate(date: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  const { data, error } = await (supabase as any)
    .from('attendance_records')
    .select('class, section, status')
    .eq('date', date);
  if (error || !data) return { data: null, error };

  const classMap = new Map<string, { present: number; absent: number; late: number; total: number }>();
  data.forEach((row: { class: string; section: string; status: string }) => {
    const key = `${row.class}${row.section}`;
    if (!classMap.has(key)) classMap.set(key, { present: 0, absent: 0, late: 0, total: 0 });
    const stats = classMap.get(key)!;
    stats.total++;
    if (row.status === 'Present') stats.present++;
    else if (row.status === 'Absent') stats.absent++;
    else if (row.status === 'Late') stats.late++;
  });

  return { data: Array.from(classMap.entries()).map(([key, stats]) => ({
    classSection: key,
    ...stats,
  })), error: null };
}

export async function getChronicAbsentees(threshold: number = 75) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  const { data, error } = await (supabase as any)
    .from('students')
    .select('id, name, class, section, guardian_name, guardian_email, attendance_percent')
    .lt('attendance_percent', threshold)
    .order('attendance_percent', { ascending: true });
  return { data, error };
}

export async function sendAttendanceOverrideNotification(studentId: string, studentName: string, date: string, newStatus: string, reason: string, parentEmail: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any).from('notifications').insert({
    id: `override-${studentId}-${date}-${Date.now()}`,
    type: 'attendance',
    title: 'Attendance Corrected',
    message: `${studentName}'s attendance for ${date} has been changed to ${newStatus}. Reason: ${reason}`,
    time: new Date().toISOString(),
    read: false,
    for_role: ['parent'],
    target_email: parentEmail,
  }).select();
}

export async function sendAbsenteeAlertToParent(studentId: string, studentName: string, attendancePercent: number, parentEmail: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any).from('notifications').insert({
    id: `absentee-alert-${studentId}-${Date.now()}`,
    type: 'attendance',
    title: 'Low Attendance Alert',
    message: `${studentName}'s attendance has dropped to ${attendancePercent}%. Please ensure regular attendance.`,
    time: new Date().toISOString(),
    read: false,
    for_role: ['parent'],
    target_email: parentEmail,
  }).select();
}

export async function getTeacherAttendance(teacherId: string, date: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any)
    .from('teacher_attendance')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('date', date)
    .maybeSingle();
}

export async function saveTeacherAttendance(record: { teacher_id: string; date: string; status: string; marked_at: string }) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any)
    .from('teacher_attendance')
    .upsert(record, { onConflict: 'teacher_id,date' })
    .select()
    .single();
}

export async function getTeacherAttendanceRange(teacherId: string, startDate: string, endDate: string) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return (supabase as any)
    .from('teacher_attendance')
    .select('*')
    .eq('teacher_id', teacherId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
}
