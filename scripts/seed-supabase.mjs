import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const root = process.cwd();
const mockDataPath = path.join(root, 'src', 'data', 'mockData.ts');

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function extractArray(source, exportName, exported = true) {
  const marker = `${exported ? 'export ' : ''}const ${exportName}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Could not find ${exportName}`);
  const assignmentIndex = source.indexOf('=', markerIndex);
  const start = source.indexOf('[', assignmentIndex);
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) inString = false;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      quote = char;
      continue;
    }
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1).replace(/ as const/g, '');
  }
  throw new Error(`Could not parse ${exportName}`);
}

function extractObject(source, exportName) {
  const marker = `export const ${exportName}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Could not find ${exportName}`);
  const assignmentIndex = source.indexOf('=', markerIndex);
  const start = source.indexOf('{', assignmentIndex);
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) inString = false;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1).replace(/ as const/g, '');
  }
  throw new Error(`Could not parse ${exportName}`);
}

function loadArray(source, exportName, exported = true) {
  return Function(`return (${extractArray(source, exportName, exported)});`)();
}

function loadObject(source, exportName, prelude = '') {
  return Function(`${prelude}; return (${extractObject(source, exportName)});`)();
}

function gradeFor(scored, maxMarks) {
  const pct = (scored / maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function deterministicScore(studentIndex, examIndex, subjectIndex, maxMarks) {
  const min = Math.floor(maxMarks * 0.5);
  const spread = Math.floor(maxMarks * 0.4);
  return min + ((studentIndex * 7 + examIndex * 5 + subjectIndex * 3) % Math.max(1, spread));
}

function chunk(items, size = 500) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

const env = { ...readEnv(path.join(root, '.env')), ...process.env };
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.');
  console.error('Add SUPABASE_SERVICE_ROLE_KEY from Supabase Project Settings -> API -> service_role key.');
  process.exit(1);
}

const source = fs.readFileSync(mockDataPath, 'utf8');
const mockUsers = loadArray(source, 'mockUsers');
const students = loadArray(source, 'students');
const teachers = loadArray(source, 'teachers');
const holidays = loadArray(source, 'holidays');
const notifications = loadArray(source, 'notifications');
const leaves = loadArray(source, 'leaves');
const announcements = loadArray(source, 'announcements');
const exams = loadArray(source, 'exams');
const periodTimes = loadArray(source, 'periodTimes', false);
const timetable = loadObject(source, 'timetable', `const periodTimes = ${JSON.stringify(periodTimes)}`);

const examTypes = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam'];
const subjectsForMarks = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science'];
const marks = students.flatMap((student, studentIndex) => (
  examTypes.flatMap((exam, examIndex) => (
    subjectsForMarks.map((subject, subjectIndex) => {
      const maxMarks = exam.includes('Unit') ? 25 : 100;
      const scored = deterministicScore(studentIndex, examIndex, subjectIndex, maxMarks);
      return {
        id: `mark-${student.id}-${exam.replace(/\s+/g, '-').toLowerCase()}-${subject.replace(/\s+/g, '-').toLowerCase()}`,
        student_id: student.id,
        exam,
        subject,
        max_marks: maxMarks,
        scored,
        grade: gradeFor(scored, maxMarks),
        updated_by: null,
      };
    })
  ))
));

const fees = students.map((student, index) => ({
  student_id: student.id,
  fee_structure: [
    { item: 'Tuition Fee', amount: 25000 },
    { item: 'Transport Fee', amount: 8000 },
    { item: 'Library Fee', amount: 2000 },
    { item: 'Lab Fee', amount: 3000 },
    { item: 'Activity Fee', amount: 2000 },
  ],
  total_amount: 40000,
  amount_paid: student.feeStatus === 'Paid' ? 40000 : student.feeStatus === 'Partially Paid' ? 25000 : 0,
  balance: student.feeStatus === 'Paid' ? 0 : student.feeStatus === 'Partially Paid' ? 15000 : 40000,
  due_date: '2025-03-31',
  status: student.feeStatus,
  payment_history: student.feeStatus === 'Paid'
    ? [{ id: `pay-${index}-1`, date: '2025-01-15', amount: 40000, mode: 'Online Transfer', receiptNo: `RCP-2025-${String(index + 1).padStart(4, '0')}`, recordedBy: 'Admin' }]
    : student.feeStatus === 'Partially Paid'
      ? [
        { id: `pay-${index}-1`, date: '2025-01-10', amount: 15000, mode: 'Cash', receiptNo: `RCP-2025-${String(index + 1).padStart(4, '0')}`, recordedBy: 'Admin' },
        { id: `pay-${index}-2`, date: '2025-02-15', amount: 10000, mode: 'Online Transfer', receiptNo: `RCP-2025-${String(index + 30).padStart(4, '0')}`, recordedBy: 'Admin' },
      ]
      : [],
}));

const timetableRows = Object.entries(timetable).flatMap(([key, days]) => {
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
  })));
});

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

async function upsertTable(table, rows, onConflict) {
  for (const rowsChunk of chunk(rows)) {
    const { error } = await supabase.from(table).upsert(rowsChunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`Seeded ${rows.length} ${table}`);
}

async function seedAuthUsers() {
  for (const user of mockUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        role: user.role,
      },
    });

    const alreadyExists = error?.message?.toLowerCase().includes('already');
    let authUser = data?.user;
    if (error && !alreadyExists) throw new Error(`auth ${user.email}: ${error.message}`);
    if (!authUser) {
      const { data: listed, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      authUser = listed.users.find((item) => item.email === user.email);
    }
    if (!authUser) throw new Error(`Could not resolve auth user ${user.email}`);

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authUser.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school_name: user.schoolName || 'Sunrise Public School',
      avatar_url: user.avatar,
    }, { onConflict: 'email' });
    if (profileError) throw new Error(`profile ${user.email}: ${profileError.message}`);
  }
  console.log(`Seeded ${mockUsers.length} auth users/profiles`);
}

async function main() {
  await seedAuthUsers();
  await upsertTable('students', students.map((student) => ({
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
    guardian_email: student.guardianEmail,
    address: student.address,
    photo_url: student.photo,
    admission_date: student.admissionDate,
    fee_status: student.feeStatus,
    attendance_percent: student.attendancePercent,
  })), 'id');
  await upsertTable('teachers', teachers.map((teacher) => ({
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
  })), 'id');
  await upsertTable('holidays', holidays.map((holiday) => ({
    id: holiday.id,
    title: holiday.title,
    date: holiday.date,
    end_date: holiday.endDate || null,
    type: holiday.type,
    audience: holiday.audience,
    note: holiday.note,
  })), 'id');
  await upsertTable('notifications', notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    time: notification.time,
    read: notification.read,
    for_role: notification.forRole,
    target_email: notification.targetEmail || null,
  })), 'id');
  await upsertTable('marks', marks, 'student_id,exam,subject');
  await upsertTable('fees', fees, 'student_id');
  await upsertTable('exams', exams.map((exam) => ({
    id: exam.id,
    name: exam.name,
    class: exam.class,
    section: exam.section || null,
    subject: exam.subject || null,
    date: exam.date,
    time: exam.time || null,
    created_by: null,
  })), 'id');
  await upsertTable('timetable_entries', timetableRows, 'class,section,day,period');
  await upsertTable('leaves', leaves.map((leave) => ({
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
    updated_by: null,
  })), 'id');
  await upsertTable('announcements', announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    priority: announcement.priority,
    posted_by: announcement.postedBy,
    posted_at: announcement.postedAt,
    pinned: announcement.pinned,
  })), 'id');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
