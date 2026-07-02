import { supabase } from '@/lib/supabase';
import type {
  Announcement,
  DayTimetable,
  ExamSchedule,
  Fee,
  Holiday,
  LeaveRecord,
  MarkEntry,
  PaymentRecord,
  Teacher,
  TimetableEntry,
} from '@/data/mockData';

type Result<T> = { data: T; error: Error | null };

function notConfigured<T>(data: T): Result<T> {
  return { data, error: new Error('Supabase is not configured') };
}

function table(name: string) {
  return (supabase as any).from(name);
}

function teacherFromRow(row: any): Teacher {
  return {
    id: row.id,
    name: row.name,
    employeeId: row.employee_id,
    subjects: row.subjects || [],
    classAssigned: row.class_assigned,
    qualification: row.qualification,
    phone: row.phone,
    email: row.email,
    joinDate: row.join_date,
    salary: Number(row.salary || 0),
    status: row.status,
  };
}

function teacherToRow(teacher: Teacher) {
  return {
    id: teacher.id,
    name: teacher.name,
    employee_id: teacher.employeeId,
    subjects: teacher.subjects,
    class_assigned: teacher.classAssigned,
    qualification: teacher.qualification,
    phone: teacher.phone,
    email: teacher.email,
    join_date: teacher.joinDate,
    salary: teacher.salary,
    status: teacher.status,
  };
}

function feeFromRow(row: any): Fee {
  return {
    studentId: row.student_id,
    feeStructure: row.fee_structure || [],
    totalAmount: Number(row.total_amount || 0),
    amountPaid: Number(row.amount_paid || 0),
    balance: Number(row.balance || 0),
    dueDate: row.due_date,
    status: row.status,
    paymentHistory: (row.payment_history || []) as PaymentRecord[],
  };
}

function feeToRow(fee: Fee) {
  return {
    student_id: fee.studentId,
    fee_structure: fee.feeStructure,
    total_amount: fee.totalAmount,
    amount_paid: fee.amountPaid,
    balance: fee.balance,
    due_date: fee.dueDate,
    status: fee.status,
    payment_history: fee.paymentHistory,
    updated_at: new Date().toISOString(),
  };
}

function examFromRow(row: any): ExamSchedule {
  return {
    id: row.id,
    name: row.name,
    class: row.class,
    section: row.section || undefined,
    subject: row.subject || undefined,
    date: row.date,
    time: row.time || undefined,
  };
}

function examToRow(exam: ExamSchedule) {
  return {
    id: exam.id,
    name: exam.name,
    class: exam.class,
    section: exam.section || null,
    subject: exam.subject || null,
    date: exam.date,
    time: exam.time || null,
  };
}

function leaveFromRow(row: any): LeaveRecord {
  return {
    id: row.id,
    applicantId: row.applicant_id,
    applicantName: row.applicant_name,
    applicantRole: row.applicant_role,
    leaveType: row.leave_type,
    fromDate: row.from_date,
    toDate: row.to_date,
    days: Number(row.days || 0),
    reason: row.reason,
    status: row.status,
    appliedOn: row.applied_on,
    remarks: row.remarks || undefined,
  };
}

function leaveToRow(leave: LeaveRecord) {
  return {
    id: leave.id,
    applicant_id: leave.applicantId,
    applicant_name: leave.applicantName,
    applicant_role: leave.applicantRole,
    leave_type: leave.leaveType,
    from_date: leave.fromDate,
    to_date: leave.toDate,
    days: leave.days,
    reason: leave.reason,
    status: leave.status,
    applied_on: leave.appliedOn,
    remarks: leave.remarks || null,
  };
}

function announcementFromRow(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience || [],
    priority: row.priority,
    postedBy: row.posted_by,
    postedAt: row.posted_at,
    pinned: row.pinned,
  };
}

function announcementToRow(item: Announcement) {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    audience: item.audience,
    priority: item.priority,
    posted_by: item.postedBy,
    posted_at: item.postedAt,
    pinned: item.pinned,
  };
}

function holidayFromRow(row: any): Holiday {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    endDate: row.end_date || undefined,
    type: row.type,
    audience: row.audience,
    note: row.note,
  };
}

function markFromRow(row: any): MarkEntry {
  return {
    studentId: row.student_id,
    exam: row.exam,
    subject: row.subject,
    maxMarks: Number(row.max_marks || 0),
    scored: Number(row.scored || 0),
    grade: row.grade,
  };
}

function timetableFromRows(rows: any[]): Record<string, DayTimetable[]> {
  const grouped: Record<string, Record<string, TimetableEntry[]>> = {};
  rows.forEach((row) => {
    const key = `${row.class}${row.section}`;
    if (!grouped[key]) grouped[key] = {};
    if (!grouped[key][row.day]) grouped[key][row.day] = [];
    grouped[key][row.day].push({
      period: Number(row.period),
      time: row.time,
      subject: row.subject,
      teacher: row.teacher,
      isBreak: row.is_break,
    });
  });
  return Object.fromEntries(Object.entries(grouped).map(([key, days]) => [
    key,
    Object.entries(days).map(([day, periods]) => ({
      day,
      periods: periods.sort((a, b) => a.period - b.period),
    })),
  ]));
}

function timetableToRows(data: Record<string, DayTimetable[]>) {
  return Object.entries(data).flatMap(([key, days]) => {
    const match = key.match(/^(\d{1,2})([A-D])$/i);
    const klass = match?.[1] || key.slice(0, -1);
    const section = match?.[2]?.toUpperCase() || key.slice(-1);
    return days.flatMap((day) => day.periods.map((period) => ({
      id: `${klass}${section}-${day.day}-${period.period}`.replace(/\s+/g, '-').toLowerCase(),
      class: klass,
      section,
      day: day.day,
      period: period.period,
      time: period.time,
      subject: period.subject,
      teacher: period.teacher,
      is_break: Boolean(period.isBreak),
      updated_at: new Date().toISOString(),
    })));
  });
}

export async function getTeachers(): Promise<Result<Teacher[]>> {
  if (!supabase) return notConfigured([]);
  const { data, error } = await table('teachers').select('*').order('name');
  return { data: error ? [] : (data || []).map(teacherFromRow), error };
}

export async function saveTeacher(teacher: Teacher): Promise<Result<Teacher | null>> {
  if (!supabase) return notConfigured(null);
  const { data, error } = await table('teachers').upsert(teacherToRow(teacher), { onConflict: 'id' }).select().single();
  return { data: data ? teacherFromRow(data) : null, error };
}

export async function getFees(): Promise<Result<Fee[]>> {
  if (!supabase) return notConfigured([]);
  const { data, error } = await table('fees').select('*').order('due_date', { ascending: true });
  return { data: error ? [] : (data || []).map(feeFromRow), error };
}

export async function saveFee(fee: Fee): Promise<Result<Fee | null>> {
  if (!supabase) return notConfigured(null);
  const { data, error } = await table('fees').upsert(feeToRow(fee), { onConflict: 'student_id' }).select().single();
  return { data: data ? feeFromRow(data) : null, error };
}

export async function getExams(): Promise<Result<ExamSchedule[]>> {
  if (!supabase) return notConfigured([]);
  const { data, error } = await table('exams').select('*').order('date', { ascending: true });
  return { data: error ? [] : (data || []).map(examFromRow), error };
}

export async function saveExam(exam: ExamSchedule): Promise<Result<ExamSchedule | null>> {
  if (!supabase) return notConfigured(null);
  const { data, error } = await table('exams').upsert(examToRow(exam), { onConflict: 'id' }).select().single();
  return { data: data ? examFromRow(data) : null, error };
}

export async function getTimetable(): Promise<Result<Record<string, DayTimetable[]>>> {
  if (!supabase) return notConfigured({});
  const { data, error } = await table('timetable_entries').select('*').order('class').order('section').order('period');
  return { data: error ? {} : timetableFromRows(data || []), error };
}

export async function saveTimetable(data: Record<string, DayTimetable[]>): Promise<Result<Record<string, DayTimetable[]>>> {
  if (!supabase) return notConfigured({});
  const { error } = await table('timetable_entries').upsert(timetableToRows(data), { onConflict: 'class,section,day,period' });
  return { data, error };
}

export async function getLeaves(): Promise<Result<LeaveRecord[]>> {
  if (!supabase) return notConfigured([]);
  const { data, error } = await table('leaves').select('*').order('applied_on', { ascending: false });
  return { data: error ? [] : (data || []).map(leaveFromRow), error };
}

export async function saveLeave(leave: LeaveRecord): Promise<Result<LeaveRecord | null>> {
  if (!supabase) return notConfigured(null);
  const { data, error } = await table('leaves').upsert(leaveToRow(leave), { onConflict: 'id' }).select().single();
  return { data: data ? leaveFromRow(data) : null, error };
}

export async function getAnnouncements(): Promise<Result<Announcement[]>> {
  if (!supabase) return notConfigured([]);
  const { data, error } = await table('announcements').select('*').order('pinned', { ascending: false }).order('posted_at', { ascending: false });
  return { data: error ? [] : (data || []).map(announcementFromRow), error };
}

export async function saveAnnouncement(item: Announcement): Promise<Result<Announcement | null>> {
  if (!supabase) return notConfigured(null);
  const { data, error } = await table('announcements').upsert(announcementToRow(item), { onConflict: 'id' }).select().single();
  return { data: data ? announcementFromRow(data) : null, error };
}

export async function getHolidays(): Promise<Result<Holiday[]>> {
  if (!supabase) return notConfigured([]);
  const { data, error } = await table('holidays').select('*').order('date', { ascending: true });
  return { data: error ? [] : (data || []).map(holidayFromRow), error };
}

export async function getMarks(): Promise<Result<MarkEntry[]>> {
  if (!supabase) return notConfigured([]);
  const { data, error } = await table('marks').select('*').order('exam').order('subject');
  return { data: error ? [] : (data || []).map(markFromRow), error };
}

export async function saveMarks(rows: MarkEntry[]): Promise<Result<MarkEntry[]>> {
  if (!supabase) return notConfigured([]);
  const payload = rows.map((row) => ({
    id: `mark-${row.studentId}-${row.exam.replace(/\s+/g, '-').toLowerCase()}-${row.subject.replace(/\s+/g, '-').toLowerCase()}`,
    student_id: row.studentId,
    exam: row.exam,
    subject: row.subject,
    max_marks: row.maxMarks,
    scored: row.scored,
    grade: row.grade,
  }));
  const { data, error } = await table('marks').upsert(payload, { onConflict: 'student_id,exam,subject' }).select();
  return { data: error ? [] : (data || []).map(markFromRow), error };
}
