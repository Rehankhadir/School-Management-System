import { supabase } from '../lib/supabase';
import type { Student } from '../../../src/data/mockData';
import type { Database } from '../../../src/lib/supabaseTypes';

type StudentRow = Database['public']['Tables']['students']['Row'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];

export function studentFromRow(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    rollNo: row.roll_no,
    class: row.class,
    section: row.section,
    dob: row.dob,
    gender: row.gender,
    bloodGroup: row.blood_group,
    guardianName: row.guardian_name,
    guardianPhone: row.guardian_phone,
    guardianEmail: row.guardian_email,
    address: row.address,
    photo: row.photo_url,
    admissionDate: row.admission_date,
    feeStatus: row.fee_status,
    attendancePercent: Number(row.attendance_percent || 0),
  };
}

export function studentToRow(student: Student): StudentInsert {
  return {
    id: student.id,
    name: student.name,
    roll_no: student.rollNo,
    class: student.class,
    section: student.section,
    dob: student.dob,
    gender: student.gender,
    blood_group: student.bloodGroup,
    guardian_name: student.guardianName,
    guardian_phone: student.guardianPhone,
    guardian_email: student.guardianEmail.trim().toLowerCase(),
    address: student.address,
    photo_url: student.photo,
    admission_date: student.admissionDate,
    fee_status: student.feeStatus,
    attendance_percent: student.attendancePercent,
  };
}

export async function getStudents() {
  if (!supabase) return { data: [] as Student[], error: new Error('Supabase is not configured') };

  const { data, error } = await (supabase as any)
    .from('students')
    .select('*')
    .order('class', { ascending: true })
    .order('section', { ascending: true })
    .order('roll_no', { ascending: true });

  return { data: error ? [] : (data || []).map(studentFromRow), error };
}

export async function saveStudent(student: Student) {
  if (!supabase) return { data: null as Student | null, error: new Error('Supabase is not configured') };

  const { data, error } = await (supabase as any)
    .from('students')
    .upsert(studentToRow(student), { onConflict: 'id' })
    .select()
    .single();

  return { data: data ? studentFromRow(data) : null, error };
}

export async function deleteStudent(id: string) {
  if (!supabase) return { error: new Error('Supabase is not configured') };

  const { error } = await (supabase as any)
    .from('students')
    .delete()
    .eq('id', id);

  return { error };
}

export type ParentCredentialsResult = {
  created: boolean;
  email: string;
  temporaryPassword: string | null;
  message: string;
};

export async function ensureParentCredentials(student: Student) {
  if (!supabase) return { data: null as ParentCredentialsResult | null, error: new Error('Supabase is not configured') };

  if (!student.guardianEmail?.trim()) {
    return { data: null, error: null };
  }

  const { data, error } = await (supabase as any).functions.invoke('create-parent-user', {
    body: {
      guardianEmail: student.guardianEmail,
      guardianName: student.guardianName,
      schoolName: 'Sunrise Public School',
    },
  });

  return { data, error };
}
