import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const root = process.cwd();

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

const env = { ...readEnv(path.join(root, '.env')), ...process.env };
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periodTimes = [
  '09:00 AM - 09:45 AM',
  '09:45 AM - 10:30 AM',
  '10:30 AM - 10:45 AM',
  '10:45 AM - 11:30 AM',
  '11:30 AM - 12:15 PM',
  '12:15 PM - 01:00 PM',
  '01:00 PM - 01:45 PM',
  '01:45 PM - 02:30 PM',
];

const classPlans = {
  '6A': [
    ['English', 'Mathematics', 'Short Break', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Sports'],
    ['Mathematics', 'Science', 'Short Break', 'English', 'Hindi', 'Art', 'Social Studies', 'Library'],
    ['Science', 'English', 'Short Break', 'Mathematics', 'Computer Science', 'Hindi', 'Social Studies', 'Music'],
    ['Social Studies', 'Hindi', 'Short Break', 'Science', 'English', 'Mathematics', 'Computer Science', 'Sports'],
    ['English', 'Mathematics', 'Short Break', 'Science Lab', 'Social Studies', 'Hindi', 'Art', 'Library'],
  ],
  '7A': [
    ['Mathematics', 'Science', 'Short Break', 'English', 'Social Studies', 'Hindi', 'Computer Science', 'Sports'],
    ['English', 'Mathematics', 'Short Break', 'Science Lab', 'Hindi', 'Social Studies', 'Art', 'Library'],
    ['Science', 'Social Studies', 'Short Break', 'Mathematics', 'English', 'Computer Science', 'Hindi', 'Music'],
    ['Hindi', 'English', 'Short Break', 'Science', 'Mathematics', 'Social Studies', 'Computer Science', 'Sports'],
    ['Mathematics', 'Science', 'Short Break', 'English', 'Social Studies', 'Art', 'Hindi', 'Library'],
  ],
  '8A': [
    ['Science', 'Mathematics', 'Short Break', 'English', 'Computer Science', 'Social Studies', 'Hindi', 'Sports'],
    ['Mathematics', 'English', 'Short Break', 'Science Lab', 'Social Studies', 'Hindi', 'Computer Science', 'Library'],
    ['English', 'Science', 'Short Break', 'Mathematics', 'Hindi', 'Computer Science', 'Social Studies', 'Music'],
    ['Social Studies', 'Mathematics', 'Short Break', 'Science', 'English', 'Hindi', 'Art', 'Sports'],
    ['Science', 'English', 'Short Break', 'Mathematics', 'Computer Science', 'Social Studies', 'Hindi', 'Library'],
  ],
  '9A': [
    ['Mathematics', 'Physics', 'Short Break', 'Chemistry', 'English', 'Biology', 'Computer Science', 'Sports'],
    ['English', 'Mathematics', 'Short Break', 'Biology Lab', 'Physics', 'Chemistry', 'Social Studies', 'Library'],
    ['Chemistry', 'English', 'Short Break', 'Mathematics', 'Physics Lab', 'Biology', 'Computer Science', 'Music'],
    ['Physics', 'Biology', 'Short Break', 'Chemistry', 'Mathematics', 'English', 'Social Studies', 'Sports'],
    ['Mathematics', 'Chemistry', 'Short Break', 'English', 'Biology', 'Physics', 'Computer Science', 'Library'],
  ],
  '10A': [
    ['Mathematics', 'Physics', 'Short Break', 'Chemistry', 'English', 'Biology', 'Computer Science', 'Sports'],
    ['Chemistry', 'English', 'Short Break', 'Mathematics', 'Physics Lab', 'Biology', 'Social Studies', 'Library'],
    ['Biology', 'Mathematics', 'Short Break', 'Chemistry Lab', 'English', 'Physics', 'Computer Science', 'Music'],
    ['English', 'Physics', 'Short Break', 'Mathematics', 'Biology', 'Chemistry', 'Social Studies', 'Sports'],
    ['Mathematics', 'Chemistry', 'Short Break', 'English', 'Physics', 'Biology', 'Computer Science', 'Library'],
  ],
};

const teacherBySubject = {
  English: 'Nisha Sharma',
  Mathematics: 'Arjun Mehta',
  Science: 'Priya Nair',
  'Science Lab': 'Priya Nair',
  Physics: 'Rahul Verma',
  'Physics Lab': 'Rahul Verma',
  Chemistry: 'Meera Iyer',
  'Chemistry Lab': 'Meera Iyer',
  Biology: 'Sana Khan',
  'Biology Lab': 'Sana Khan',
  Hindi: 'Kavita Rao',
  'Social Studies': 'Vikram Singh',
  'Computer Science': 'Anita Das',
  Art: 'Pooja Menon',
  Music: 'Nisha Sharma',
  Library: 'Library Staff',
  Sports: 'Sports Coach',
  'Short Break': '',
};

const rows = Object.entries(classPlans).flatMap(([classSection, weeklyPlan]) => {
  const klass = classSection.slice(0, -1);
  const section = classSection.slice(-1);

  return weeklyPlan.flatMap((subjects, dayIndex) =>
    subjects.map((subject, subjectIndex) => ({
      id: `tt-${klass}${section}-${days[dayIndex].toLowerCase()}-${subjectIndex + 1}`,
      class: klass,
      section,
      day: days[dayIndex],
      period: subjectIndex + 1,
      time: periodTimes[subjectIndex],
      subject,
      teacher: teacherBySubject[subject] || '',
      is_break: subject === 'Short Break',
      updated_by: null,
      updated_at: new Date().toISOString(),
    })),
  );
});

const { error } = await supabase
  .from('timetable_entries')
  .upsert(rows, { onConflict: 'class,section,day,period' });

if (error) {
  console.error(`Failed to seed timetable_entries: ${error.message}`);
  process.exit(1);
}

console.log(`Seeded ${rows.length} timetable entries.`);
console.log('Classes seeded:', Object.keys(classPlans).join(', '));
