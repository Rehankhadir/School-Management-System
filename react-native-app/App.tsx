import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getCurrentProfileUser, loginWithPassword, logoutSupabase } from './src/services/authService';
import { createNotifications, saveAttendanceRecords, hasAttendanceForDate, getAttendanceForDate } from './src/services/schoolDataService';
import { deleteStudent, ensureParentCredentials, getStudents, saveStudent } from './src/services/studentService';
import {
  getAnnouncements,
  getExams,
  getFees,
  getHolidays,
  getLeaves,
  getMarks,
  getTeachers,
  getTimetable,
  saveAnnouncement,
  saveExam as persistExam,
  saveFee,
  saveLeave,
  saveMarks as persistMarks,
  saveTeacher,
  saveTimetable,
} from './src/services/schoolModulesService';
import {
  announcements as initialAnnouncements,
  classes,
  exams,
  fees as initialFees,
  holidays,
  leaves as initialLeaves,
  marks,
  monthlyFeeCollection,
  notifications,
  paymentModes,
  sections,
  subjects,
  teachers,
  timetable,
  weeklyAttendance,
  type Student,
  type Teacher,
  type LeaveRecord,
  type Fee,
  type PaymentRecord,
  type MarkEntry,
  type DayTimetable,
  type TimetableEntry,
  type ExamSchedule,
  type Holiday,
  type Notification,
  type Announcement,
  type UserRole,
} from '../src/data/mockData';

type Screen =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'attendance'
  | 'marks'
  | 'exams'
  | 'timetable'
  | 'holidays'
  | 'fees'
  | 'leaves'
  | 'announcements'
  | 'notifications'
  | 'reports'
  | 'profile'
  | 'studentDetail';

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  schoolName: string;
  token: string;
};

type AttendanceStatus = 'Present' | 'Absent' | 'Late';
type AssignedClass = { klass: string; section: string; label: string };
type ProgressExamRow = { exam: string; total: number; max: number; percent: number };
type ProgressSubjectRow = { subject: string; total: number; max: number; percent: number };
type ProgressMarkRow = { exam: string; subject: string; scored: number; maxMarks: number; percent: number; grade: string };
type ReportFilters = {
  klass: string;
  section: string;
  feeStatus: string;
  attendanceRange: string;
  exam: string;
  subject: string;
  leaveStatus: string;
  leaveType: string;
  applicantRole: string;
};

const defaultReportFilters: ReportFilters = {
  klass: '',
  section: '',
  feeStatus: '',
  attendanceRange: '',
  exam: '',
  subject: '',
  leaveStatus: '',
  leaveType: '',
  applicantRole: '',
};

const roleOptions = [
  { label: 'Admin', email: 'admin@school.com', password: 'admin123' },
  { label: 'Teacher', email: 'teacher@school.com', password: 'teacher123' },
  { label: 'Student', email: 'student@school.com', password: 'student123' },
  { label: 'Parent', email: 'parent@school.com', password: 'parent123' },
  { label: 'Accountant', email: 'accountant@school.com', password: 'account123' },
];

const navItems: Array<{ screen: Screen; label: string; icon: keyof typeof Ionicons.glyphMap; roles: UserRole[] }> = [
  { screen: 'dashboard', label: 'Home', icon: 'home-outline', roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'students', label: 'Students', icon: 'people-outline', roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'teachers', label: 'Teachers', icon: 'school-outline', roles: ['admin', 'teacher'] },
  { screen: 'attendance', label: 'Attendance', icon: 'calendar-check-outline' as any, roles: ['admin', 'teacher', 'student', 'parent'] },
  { screen: 'marks', label: 'Marks', icon: 'book-outline', roles: ['admin', 'teacher', 'student', 'parent'] },
  { screen: 'exams', label: 'Exams', icon: 'clipboard-outline', roles: ['admin', 'teacher', 'student', 'parent'] },
  { screen: 'timetable', label: 'Timetable', icon: 'time-outline', roles: ['admin', 'teacher', 'student', 'parent'] },
  { screen: 'holidays', label: 'Holidays', icon: 'calendar-outline', roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'fees', label: 'Fees', icon: 'card-outline', roles: ['admin', 'student', 'parent', 'accountant'] },
  { screen: 'leaves', label: 'Leaves', icon: 'document-text-outline', roles: ['admin', 'teacher', 'student', 'accountant'] },
  { screen: 'announcements', label: 'News', icon: 'megaphone-outline', roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'notifications', label: 'Alerts', icon: 'notifications-outline', roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'reports', label: 'Reports', icon: 'download-outline', roles: ['admin', 'teacher', 'accountant'] },
  { screen: 'profile', label: 'Profile', icon: 'person-circle-outline', roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
];

const primaryTabs: Screen[] = ['dashboard', 'students', 'attendance', 'notifications', 'profile'];

function currency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function averageForStudent(studentId: string) {
  const rows = marks.filter((mark) => mark.studentId === studentId);
  const scored = rows.reduce((sum, row) => sum + row.scored, 0);
  const max = rows.reduce((sum, row) => sum + row.maxMarks, 0);
  return max ? Math.round((scored / max) * 100) : 0;
}

function gradeForPercent(percent: number) {
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B';
  if (percent >= 60) return 'C';
  if (percent >= 50) return 'D';
  return 'F';
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildProgressCardHtml(student: Student, examRows: ProgressExamRow[], subjectRows: ProgressSubjectRow[], markRows: ProgressMarkRow[], overall: { total: number; max: number; percent: number }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const examTable = examRows.map((row) => `
    <tr>
      <td>${escapeHtml(row.exam)}</td>
      <td>${escapeHtml(row.total)}/${escapeHtml(row.max)}</td>
      <td>${escapeHtml(row.percent)}%</td>
      <td><span class="grade">${escapeHtml(gradeForPercent(row.percent))}</span></td>
    </tr>
  `).join('');
  const subjectTable = subjectRows.map((row) => `
    <tr>
      <td>${escapeHtml(row.subject)}</td>
      <td>${escapeHtml(row.total)}/${escapeHtml(row.max)}</td>
      <td>${escapeHtml(row.percent)}%</td>
      <td><div class="bar"><span style="width:${Math.min(100, row.percent)}%"></span></div></td>
    </tr>
  `).join('');
  const completeMarksByExam = examRows.map((examRow) => {
    const rows = markRows.filter((row) => row.exam === examRow.exam);
    const tableRows = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.subject)}</td>
        <td>${escapeHtml(row.scored)}/${escapeHtml(row.maxMarks)}</td>
        <td>${escapeHtml(row.percent)}%</td>
        <td><span class="grade">${escapeHtml(row.grade)}</span></td>
      </tr>
    `).join('');
    return `
      <div class="exam-block">
        <h3>${escapeHtml(examRow.exam)}</h3>
        <table><thead><tr><th>Subject</th><th>Score</th><th>Percentage</th><th>Grade</th></tr></thead><tbody>${tableRows}</tbody></table>
      </div>
    `;
  }).join('');
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 24px; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #f4f6fb; }
    .page { background: #fff; min-height: 100vh; border: 1px solid #e5e7eb; }
    .cover { background: linear-gradient(135deg, #4f46e5, #111827); color: #fff; padding: 30px 34px; position: relative; overflow: hidden; }
    .cover:after { content: ""; position: absolute; width: 240px; height: 240px; border-radius: 999px; right: -80px; top: -80px; background: rgba(255,255,255,.12); }
    .school { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; opacity: .82; }
    .title { font-size: 32px; font-weight: 800; margin-top: 8px; }
    .meta { font-size: 13px; opacity: .86; margin-top: 8px; }
    .student { display: flex; justify-content: space-between; gap: 18px; padding: 24px 34px; border-bottom: 1px solid #eef2ff; }
    .student h1 { margin: 0; font-size: 24px; }
    .student p { margin: 7px 0 0; color: #6b7280; font-size: 13px; }
    .score { text-align: right; }
    .score strong { color: #4f46e5; font-size: 38px; line-height: 1; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 22px 34px; }
    .metric { border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px; background: #f8fafc; }
    .metric b { font-size: 20px; }
    .metric span { display: block; margin-top: 5px; color: #6b7280; font-size: 11px; text-transform: uppercase; font-weight: 700; }
    .section { padding: 0 34px 22px; }
    .section h2 { font-size: 16px; margin: 10px 0 12px; }
    .exam-block { margin-bottom: 16px; }
    .exam-block h3 { margin: 0 0 8px; font-size: 14px; color: #4338ca; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
    th { background: #f8fafc; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; text-align: left; padding: 12px; }
    td { padding: 12px; border-top: 1px solid #eef2ff; font-size: 13px; }
    .grade { display: inline-block; min-width: 34px; text-align: center; border-radius: 999px; padding: 5px 9px; background: #eef2ff; color: #4338ca; font-weight: 800; }
    .bar { height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .bar span { display: block; height: 100%; background: linear-gradient(90deg, #10b981, #4f46e5); border-radius: 999px; }
    .footer { display: flex; justify-content: space-between; padding: 20px 34px 28px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <main class="page">
    <section class="cover">
      <div class="school">Sunrise Public School</div>
      <div class="title">Student Progress Card</div>
      <div class="meta">Complete academic performance across all exams</div>
    </section>
    <section class="student">
      <div>
        <h1>${escapeHtml(student.name)}</h1>
        <p>Class ${escapeHtml(student.class)}${escapeHtml(student.section)} | Roll ${escapeHtml(student.rollNo)} | Generated ${escapeHtml(today)}</p>
      </div>
      <div class="score">
        <strong>${escapeHtml(overall.percent)}%</strong>
        <p>Overall Grade ${escapeHtml(gradeForPercent(overall.percent))}</p>
      </div>
    </section>
    <section class="grid">
      <div class="metric"><b>${escapeHtml(overall.total)}/${escapeHtml(overall.max)}</b><span>Total Marks</span></div>
      <div class="metric"><b>${escapeHtml(examRows.length)}</b><span>Exams Covered</span></div>
      <div class="metric"><b>${escapeHtml(subjectRows.length)}</b><span>Subjects</span></div>
    </section>
    <section class="section">
      <h2>Exam Performance</h2>
      <table><thead><tr><th>Exam</th><th>Score</th><th>Percentage</th><th>Grade</th></tr></thead><tbody>${examTable}</tbody></table>
    </section>
    <section class="section">
      <h2>Complete Marks</h2>
      ${completeMarksByExam}
    </section>
    <section class="section">
      <h2>Subject Performance</h2>
      <table><thead><tr><th>Subject</th><th>Score</th><th>Average</th><th>Progress</th></tr></thead><tbody>${subjectTable}</tbody></table>
    </section>
    <section class="footer">
      <span>Prepared by School Management System</span>
      <span>Authorized academic progress summary</span>
    </section>
  </main>
</body>
</html>`;
}

function parseAssignedClasses(value: string): AssignedClass[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .map((label) => {
      const match = label.match(/^(\d{1,2})([A-D])$/i);
      return match ? { klass: match[1], section: match[2].toUpperCase(), label: `${match[1]}${match[2].toUpperCase()}` } : null;
    })
    .filter((item): item is AssignedClass => Boolean(item));
}

function isStudentLinkedToParent(student: Student, user: Pick<User, 'email' | 'name'>) {
  return (
    student.guardianEmail.trim().toLowerCase() === user.email.trim().toLowerCase() ||
    student.guardianName.trim().toLowerCase() === user.name.trim().toLowerCase()
  );
}

const attendanceMonths = [
  { label: 'Jan', name: 'January 2025', days: 31 },
  { label: 'Feb', name: 'February 2025', days: 28 },
  { label: 'Mar', name: 'March 2025', days: 31 },
  { label: 'Apr', name: 'April 2025', days: 30 },
  { label: 'May', name: 'May 2025', days: 31 },
  { label: 'Jun', name: 'June 2025', days: 30 },
];

function monthlyAttendanceFor(student: Student, monthIndex: number) {
  return Array.from({ length: attendanceMonths[monthIndex].days }, (_, index) => {
    const day = index + 1;
    const absentEvery = student.attendancePercent >= 90 ? 17 : student.attendancePercent >= 80 ? 11 : 7;
    const lateEvery = student.attendancePercent >= 90 ? 9 : 6;
    const signature = Number(student.rollNo || 0) + monthIndex + day;
    const status: AttendanceStatus = signature % absentEvery === 0 ? 'Absent' : signature % lateEvery === 0 ? 'Late' : 'Present';
    return { day, status };
  });
}

function subjectExamSchedule(exam: ExamSchedule) {
  if (exam.subject) {
    return [{
      subject: exam.subject,
      date: new Date(exam.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: exam.time || 'Time not set',
    }];
  }
  const start = new Date(exam.date);
  return subjects.slice(0, 6).map((subject, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      subject,
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: index < 3 ? '09:00 - 11:00' : '11:30 - 01:30',
    };
  });
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readableDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Select date';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function holidayDays(holiday: Holiday) {
  if (!holiday.endDate) return 1;
  const start = new Date(holiday.date).getTime();
  const end = new Date(holiday.endDate).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function holidayTone(type: Holiday['type']) {
  if (type === 'National') return { bg: '#eef2ff', text: '#4f46e5' };
  if (type === 'Festival') return { bg: '#fff7ed', text: '#d97706' };
  if (type === 'Vacation') return { bg: '#ecfdf5', text: '#059669' };
  if (type === 'School Event') return { bg: '#f5f3ff', text: '#9333ea' };
  return { bg: '#f8fafc', text: '#475569' };
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherList, setTeacherList] = useState<Teacher[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [sessionNotifications, setSessionNotifications] = useState<Notification[]>(notifications);
  const [timetableData, setTimetableData] = useState<Record<string, DayTimetable[]>>({});
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('s001');
  const [moduleOpen, setModuleOpen] = useState(false);
  const visibleNav = useMemo(() => navItems.filter((item) => user && item.roles.includes(user.role)), [user]);
  const activeTitle = navItems.find((item) => item.screen === screen)?.label || 'Student Profile';
  const visibleNotifications = user ? sessionNotifications.filter((note) => note.forRole.includes(user.role) && (!note.targetEmail || note.targetEmail === user.email.trim().toLowerCase())) : [];
  const unreadCount = visibleNotifications.filter((note) => !note.read).length;

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const { user: sessionUser } = await getCurrentProfileUser();
      if (!active) return;
      if (sessionUser) setUser(sessionUser);
      setAuthLoading(false);
    }

    restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDbStudents() {
      if (!user) {
        setStudents([]);
        return;
      }

      const { data, error } = await getStudents();
      if (!active) return;
      if (error) {
        Alert.alert('Supabase error', error.message || 'Unable to load students from the database.');
        setStudents([]);
        return;
      }
      setStudents(data);
      setSelectedStudentId((current) => data.some((student: Student) => student.id === current) ? current : data[0]?.id || '');
    }

    loadDbStudents();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let active = true;

    async function loadDbModules() {
      if (!user) {
        setTeacherList([]);
        setLeaveRecords([]);
        setTimetableData({});
        return;
      }

      const [teacherResult, leaveResult, timetableResult] = await Promise.all([
        getTeachers(),
        getLeaves(),
        getTimetable(),
      ]);
      if (!active) return;
      if (!teacherResult.error) setTeacherList(teacherResult.data);
      if (!leaveResult.error) setLeaveRecords(leaveResult.data);
      if (!timetableResult.error) setTimetableData(timetableResult.data);
    }

    loadDbModules();
    return () => { active = false; };
  }, [user?.id]);

  const navigate = (next: Screen, studentId?: string) => {
    if (studentId) setSelectedStudentId(studentId);
    setScreen(next);
    setModuleOpen(false);
  };

  const handleLogin = (nextUser: User) => {
    setScreen('dashboard');
    setSelectedStudentId('s001');
    setProfilePhotoUri(null);
    setModuleOpen(false);
    setUser(nextUser);
  };

  const handleLogout = async () => {
    await logoutSupabase();
    setScreen('dashboard');
    setSelectedStudentId('s001');
    setModuleOpen(false);
    setUser(null);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.loginShell}>
        <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
        <View style={[styles.loginHero, { flex: 1, justifyContent: 'center' }]}>
          <Text style={styles.loginSchool}>Sunrise Public School</Text>
          <Text style={styles.loginHeadline}>Loading secure session...</Text>
        </View>
    </SafeAreaView>
  );
}

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => setModuleOpen(true)}>
          <Ionicons name="menu-outline" size={24} color="#4b5563" />
        </Pressable>
        <View style={styles.topTitle}>
          <Text style={styles.schoolText}>{user.schoolName}</Text>
          <Text style={styles.titleText}>{screen === 'studentDetail' ? 'Student Profile' : activeTitle}</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => navigate('notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#4b5563" />
          {unreadCount > 0 ? <Text style={styles.badgeCount}>{unreadCount}</Text> : null}
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={[styles.contentInner, { paddingBottom: 80 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <RouteScreen
          user={user}
          screen={screen}
          navigate={navigate}
          students={students}
          setStudents={setStudents}
          teachers={teacherList}
          setTeachers={setTeacherList}
          leaveRecords={leaveRecords}
          setLeaveRecords={setLeaveRecords}
          sessionNotifications={sessionNotifications}
          setSessionNotifications={setSessionNotifications}
          timetableData={timetableData}
          setTimetableData={setTimetableData}
          profilePhotoUri={profilePhotoUri}
          setProfilePhotoUri={setProfilePhotoUri}
          selectedStudentId={selectedStudentId}
        />
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {primaryTabs.map((tab) => {
          const item = navItems.find((nav) => nav.screen === tab);
          if (!item || !item.roles.includes(user.role)) return null;
          const active = screen === tab;
          return (
            <Pressable key={tab} style={[styles.navItem, active && styles.navItemActive]} onPress={() => navigate(tab)}>
              <Ionicons name={item.icon as any} size={21} color={active ? '#4f46e5' : '#6b7280'} />
              <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={moduleOpen} transparent animationType="slide" onRequestClose={() => setModuleOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setModuleOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetGrip} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>All Modules</Text>
            <Pressable style={styles.iconButtonSmall} onPress={() => setModuleOpen(false)}>
              <Ionicons name="close-outline" size={24} color="#374151" />
            </Pressable>
          </View>
          <View style={styles.moduleGrid}>
            {visibleNav.map((item) => (
              <Pressable key={item.screen} style={[styles.moduleTile, screen === item.screen && styles.moduleTileActive]} onPress={() => navigate(item.screen)}>
                <Ionicons name={item.icon as any} size={22} color={screen === item.screen ? '#4f46e5' : '#374151'} />
                <Text style={[styles.moduleText, screen === item.screen && styles.moduleTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.moduleTile} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#e11d48" />
              <Text style={[styles.moduleText, { color: '#e11d48' }]}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickRole = (label: string) => {
    const role = roleOptions.find((option) => option.label === label);
    if (!role) return;
    setSelectedRole(label);
    setEmail(role.email);
    setPassword(role.password);
    setError('');
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    const { user, error } = await loginWithPassword(email, password);
    if (!user || error) {
      setError(error?.message || 'Invalid email or password');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onLogin(user);
  };

  return (
    <SafeAreaView style={styles.loginShell}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      <ScrollView style={styles.loginScroll} contentContainerStyle={styles.loginScrollInner} showsVerticalScrollIndicator={false}>
        <View style={styles.loginHero}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <View style={styles.loginHeroTop}>
            <View style={styles.brandMark}><Ionicons name="school-outline" size={30} color="#fff" /></View>
            <View style={styles.heroPill}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#c7d2fe" />
              <Text style={styles.heroPillText}>Secure portal</Text>
            </View>
          </View>
          <Text style={styles.loginSchool}>Sunrise Public School</Text>
          <Text style={styles.loginHeadline}>Mobile school management</Text>
        </View>
        <View style={styles.loginCard}>
          <View style={styles.loginCardHeader}>
            <View>
              <Text style={styles.loginCardTitle}>Welcome back</Text>
              <Text style={styles.loginCardSubtitle}>Select a role or enter credentials</Text>
            </View>
            <View style={styles.loginCardIcon}><Ionicons name="finger-print-outline" size={24} color="#4f46e5" /></View>
          </View>
          <Text style={styles.label}>Quick Login</Text>
          <View style={styles.chipRow}>
            {roleOptions.map((role) => (
              <Pressable key={role.label} style={[styles.chip, selectedRole === role.label && styles.chipActive]} onPress={() => pickRole(role.label)}>
                <Text style={[styles.chipText, selectedRole === role.label && styles.chipTextActive]}>{role.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Email</Text>
          <View style={styles.loginInputWrap}>
            <Ionicons name="mail-outline" size={18} color="#9ca3af" />
            <TextInput style={styles.loginInput} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="name@school.com" placeholderTextColor="#9ca3af" />
          </View>
          <Text style={styles.label}>Password</Text>
          <View style={styles.loginInputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
            <TextInput style={styles.loginInput} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="Password" placeholderTextColor="#9ca3af" />
            <Pressable style={styles.passwordTogglePremium} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
            </Pressable>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable style={[styles.loginButton, submitting && { opacity: 0.72 }]} onPress={submit}>
            <Text style={styles.primaryText}>{submitting ? 'Signing in...' : 'Sign In'}</Text>
            <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
          </Pressable>
          <Text style={styles.loginHint}>Quick-login fills seeded Supabase credentials for each role.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type RouteProps = {
  user: User;
  screen: Screen;
  navigate: (screen: Screen, studentId?: string) => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  leaveRecords: LeaveRecord[];
  setLeaveRecords: React.Dispatch<React.SetStateAction<LeaveRecord[]>>;
  sessionNotifications: Notification[];
  setSessionNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  timetableData: Record<string, DayTimetable[]>;
  setTimetableData: React.Dispatch<React.SetStateAction<Record<string, DayTimetable[]>>>;
  profilePhotoUri: string | null;
  setProfilePhotoUri: React.Dispatch<React.SetStateAction<string | null>>;
  selectedStudentId: string;
};

function RouteScreen(props: RouteProps) {
  switch (props.screen) {
    case 'students': return <StudentsScreen {...props} />;
    case 'studentDetail': return <StudentDetailScreen {...props} />;
    case 'teachers': return <TeachersScreen user={props.user} teachers={props.teachers} setTeachers={props.setTeachers} />;
    case 'attendance': return <AttendanceScreen {...props} />;
    case 'marks': return <MarksScreen user={props.user} students={props.students} />;
    case 'exams': return <ExamsScreen user={props.user} students={props.students} />;
    case 'timetable': return <TimetableScreen user={props.user} timetableData={props.timetableData} setTimetableData={props.setTimetableData} />;
    case 'holidays': return <HolidaysScreen />;
    case 'fees': return <FeesScreen user={props.user} students={props.students} />;
    case 'leaves': return <LeavesScreen user={props.user} leaveRecords={props.leaveRecords} setLeaveRecords={props.setLeaveRecords} />;
    case 'announcements': return <AnnouncementsScreen />;
    case 'notifications': return <NotificationsScreen user={props.user} sessionNotifications={props.sessionNotifications} setSessionNotifications={props.setSessionNotifications} />;
    case 'reports': return <ReportsScreen students={props.students} userRole={props.user.role} />;
    case 'profile': return <ProfileScreen user={props.user} profilePhotoUri={props.profilePhotoUri} setProfilePhotoUri={props.setProfilePhotoUri} />;
    default: return <DashboardScreen {...props} />;
  }
}

function DashboardScreen({ user, navigate, students, leaveRecords, sessionNotifications }: RouteProps) {
  const lowAttendance = students.filter((student) => student.attendancePercent < 80).slice(0, 5);

  if (user.role === 'student') {
    return (
      <View style={styles.stack}>
        <DashboardHeader title="Dashboard" subtitle="Welcome back, Student!" />
        <MetricGrid metrics={[
          ['Attendance', '92%', 'calendar-check'],
          ['Total Subjects', '8', 'book-open-page-variant'],
          ['Fee Paid', currency(40000), 'cash'],
          ['Class Rank', '5', 'account-group'],
        ]} />
        <Card title="Upcoming Exams">
          {['Final Exam - April 1', 'Practical Exam - April 10', 'Viva - April 15'].map((item) => <InfoRow key={item} title={item} subtitle="Exam schedule" />)}
        </Card>
        <Card title="Recent Marks">
          {[
            ['Mathematics', '22/25', 'A'],
            ['Science', '20/25', 'A'],
            ['English', '18/25', 'B'],
          ].map(([subject, score, grade]) => <InfoRow key={subject} title={subject} subtitle={score} right={grade} />)}
        </Card>
      </View>
    );
  }

  if (user.role === 'parent') {
    const child = students.find((student) => isStudentLinkedToParent(student, user)) || students[0];
    if (!child) {
      return (
        <View style={styles.stack}>
          <DashboardHeader title="Dashboard" subtitle="Track your child's progress" />
          <Card title="No child linked">
            <Text style={styles.muted}>No student record is linked to this parent account.</Text>
          </Card>
        </View>
      );
    }
    const childMarks = marks.filter((mark) => mark.studentId === child.id);
    const avg = childMarks.length ? childMarks.reduce((sum, mark) => sum + (mark.scored / mark.maxMarks) * 100, 0) / childMarks.length : 0;
    const childFee = initialFees.find((fee) => fee.studentId === child.id);
    const parentNotes = sessionNotifications.filter((note) => note.forRole.includes('parent') && (!note.targetEmail || note.targetEmail === user.email.trim().toLowerCase()));
    const recentGrades = [...childMarks].sort((a, b) => (a.exam > b.exam ? 1 : -1)).slice(-3).reverse();
    const upcomingChildExams = exams
      .filter((exam) => exam.class === child.class && (!exam.section || exam.section === child.section))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    return (
      <View style={styles.stack}>
        <DashboardHeader title="Dashboard" subtitle="Track your child's progress" />
        <MetricGrid metrics={[
          ["Child's Attendance", `${child.attendancePercent}%`, 'calendar-check'],
          ['Fee Due', currency(childFee?.balance || 0), 'cash'],
          ['Avg Score', `${Math.round(avg)}%`, 'school'],
          ['Unread Alerts', String(parentNotes.filter((note) => !note.read).length), 'bell'],
        ]} />
        <Card title="Child Summary">
          <InfoRow title={child.name} subtitle={`Class ${child.class}${child.section}`} right={childFee?.status || 'Unknown'} />
          <InfoRow title="Next due" subtitle={childFee?.dueDate || 'N/A'} />
        </Card>
        <Card title="Performance Overview">
          <InfoRow title="Average score" subtitle={`${Math.round(avg)}%`} right="Score" />
          <InfoRow title="Next exam" subtitle={upcomingChildExams[0] ? `${upcomingChildExams[0].name} - ${new Date(upcomingChildExams[0].date).toLocaleDateString()}` : 'No upcoming exam'} />
          {recentGrades.length ? recentGrades.map((grade, index) => (
            <InfoRow key={`${grade.studentId}-${index}`} title={grade.subject} subtitle={grade.exam} right={`${grade.scored}/${grade.maxMarks}`} />
          )) : <Text style={styles.muted}>No recent grades available.</Text>}
        </Card>
        <Card title="Upcoming Exams">
          {upcomingChildExams.length ? upcomingChildExams.map((exam) => <InfoRow key={exam.id} title={exam.name} subtitle={new Date(exam.date).toLocaleDateString()} right={`Class ${exam.class}${exam.section || ''}`} />) : <Text style={styles.muted}>No upcoming exams for Class {child.class}{child.section}.</Text>}
        </Card>
        <Card title="Parent Notifications">
          {parentNotes.slice(0, 4).map((note) => <InfoRow key={note.id} title={note.title} subtitle={note.message} right={note.read ? 'Read' : 'New'} />)}
        </Card>
      </View>
    );
  }

  if (user.role === 'teacher') {
    const teachingStudents = students.filter((student) => ['9', '10'].includes(student.class));
    const myLeaves = leaveRecords.filter((leave) => (leave.applicantId === user.id || leave.applicantName === user.name) && leave.applicantRole === 'Teacher' && leave.status !== 'Rejected');
    const pendingLeaves = leaveRecords.filter((leave) => (leave.applicantId === user.id || leave.applicantName === user.name) && leave.applicantRole === 'Teacher' && leave.status === 'Pending');
    const usedLeaveDays = myLeaves.reduce((sum, leave) => sum + leave.days, 0);
    const maxLeaveDays = 18;
    const remainingLeaveDays = Math.max(0, maxLeaveDays - usedLeaveDays);
    const studentSummaries = teachingStudents
      .map((student) => {
        const studentMarks = marks.filter((mark) => mark.studentId === student.id);
        if (!studentMarks.length) return null;
        const averageScore = studentMarks.reduce((sum, mark) => sum + (mark.scored / mark.maxMarks) * 100, 0) / studentMarks.length;
        const lowSubjects = Array.from(new Set(studentMarks.filter((mark) => (mark.scored / mark.maxMarks) * 100 < 60).map((mark) => mark.subject)));
        const grade = averageScore >= 90 ? 'A+' : averageScore >= 80 ? 'A' : averageScore >= 70 ? 'B' : averageScore >= 60 ? 'C' : averageScore >= 50 ? 'D' : 'F';
        return { student, averageScore, lowSubjects, grade };
      })
      .filter((entry): entry is { student: Student; averageScore: number; lowSubjects: string[]; grade: string } => entry !== null);
    const classAvgScore = studentSummaries.length
      ? Math.round(studentSummaries.reduce((sum, e) => sum + e.averageScore, 0) / studentSummaries.length)
      : 0;
    const lowAttendanceStudents = teachingStudents.filter((student) => student.attendancePercent < 85).slice(0, 5);
    const atRiskStudents = studentSummaries.filter((e) => e.averageScore < 60).sort((a, b) => a.averageScore - b.averageScore).slice(0, 5);
    const gradeDistribution = studentSummaries.reduce<Record<string, number>>((acc, e) => { acc[e.grade] = (acc[e.grade] || 0) + 1; return acc; }, {});
    const upcomingExams = exams
      .filter((exam) => teachingStudents.some((student) => student.class === exam.class))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    const recentMarksFiltered = marks.filter((mark) => teachingStudents.some((student) => student.id === mark.studentId));
    const latestExamName = recentMarksFiltered.length ? recentMarksFiltered[recentMarksFiltered.length - 1].exam : '';
    const latestExamMarks = recentMarksFiltered.filter((m) => m.exam === latestExamName);
    const sortedLatest = [...latestExamMarks].sort((a, b) => (b.scored / b.maxMarks) - (a.scored / a.maxMarks));
    const topPerformers = sortedLatest.slice(0, 3);
    const needsImprovement = sortedLatest.slice(-3).reverse();
    const lowestAttendance = [...teachingStudents].sort((a, b) => a.attendancePercent - b.attendancePercent).slice(0, 5);

    return (
      <View style={styles.stack}>
        <DashboardHeader title="Dashboard" subtitle={`Welcome, ${user.name?.split(' ')[0] || 'Teacher'}!`} />

        <View style={styles.quickGrid}>
          <QuickAction label="Mark Attendance" icon="calendar" onPress={() => navigate('attendance')} />
          <QuickAction label="Enter Marks" icon="document-text" onPress={() => navigate('marks')} />
          <QuickAction label="View Students" icon="people" onPress={() => navigate('students')} />
          <QuickAction label="Apply Leave" icon="time" onPress={() => navigate('leaves')} />
          <QuickAction label="View Reports" icon="bar-chart" onPress={() => navigate('reports')} />
          <QuickAction label="Timetable" icon="calendar-outline" onPress={() => navigate('timetable')} />
        </View>

        <MetricGrid metrics={[
          ['My Students', String(teachingStudents.length), 'account-group'],
          ['Class Average', `${classAvgScore}%`, 'school'],
          ['Low Attendance', String(lowAttendanceStudents.length), 'alert-circle'],
          ['Leaves Left', `${remainingLeaveDays}/${maxLeaveDays}`, 'clock-outline'],
        ]} />

        <Card title="Recent Results">
          {latestExamName ? <Text style={[styles.muted, { marginBottom: 8, fontSize: 11 }]}>{latestExamName}</Text> : null}
          {topPerformers.length > 0 && (
            <>
              <Text style={[styles.muted, { fontSize: 11, fontWeight: '600', color: '#059669', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 }]}>Top Performers</Text>
              {topPerformers.map((m, i) => {
                const stu = teachingStudents.find((s) => s.id === m.studentId);
                return <InfoRow key={i} title={stu?.name || m.studentId} subtitle={`${m.subject} · Class ${stu?.class}${stu?.section}`} right={`${m.scored}/${m.maxMarks}`} />;
              })}
            </>
          )}
          {needsImprovement.length > 0 && (
            <>
              <Text style={[styles.muted, { fontSize: 11, fontWeight: '600', color: '#d97706', marginTop: 10, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 }]}>Needs Improvement</Text>
              {needsImprovement.map((m, i) => {
                const stu = teachingStudents.find((s) => s.id === m.studentId);
                return <InfoRow key={i} title={stu?.name || m.studentId} subtitle={`${m.subject} · Class ${stu?.class}${stu?.section}`} right={`${m.scored}/${m.maxMarks}`} />;
              })}
            </>
          )}
          {topPerformers.length === 0 && <Text style={styles.muted}>No recent assessment data</Text>}
        </Card>

        <Card title="Upcoming Assessments">
          {upcomingExams.length ? upcomingExams.map((exam) => (
            <InfoRow key={exam.id} title={exam.name} subtitle={`Class ${exam.class}${exam.section || ''} ${exam.subject ? `· ${exam.subject}` : ''}`} right={new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
          )) : <Text style={styles.muted}>No upcoming assessments</Text>}
        </Card>

        <Card title="Grade Distribution">
          {(['A+', 'A', 'B', 'C', 'D', 'F'] as const).map((band) => (
            <InfoRow key={band} title={band} subtitle={`${gradeDistribution[band] || 0} students`} right={`${studentSummaries.length ? Math.round(((gradeDistribution[band] || 0) / studentSummaries.length) * 100) : 0}%`} />
          ))}
        </Card>

        <Card title="Attendance Snapshot">
          {lowestAttendance.map((s) => (
            <InfoRow key={s.id} title={s.name} subtitle={`Class ${s.class}${s.section} · Roll ${s.rollNo}`} right={`${s.attendancePercent}%`} />
          ))}
          {lowestAttendance.length === 0 && <Text style={styles.muted}>All students have good attendance!</Text>}
        </Card>

        <Card title="Students Needing Attention">
          {lowAttendanceStudents.slice(0, 3).map((s) => (
            <InfoRow key={s.id} title={s.name} subtitle={`Class ${s.class}${s.section} · Attendance`} right={`${s.attendancePercent}%`} />
          ))}
          {atRiskStudents.slice(0, 3).map((e) => (
            <InfoRow key={e.student.id} title={e.student.name} subtitle={`Class ${e.student.class}${e.student.section} · Marks`} right={`${e.averageScore.toFixed(0)}%`} />
          ))}
          {lowAttendanceStudents.length === 0 && atRiskStudents.length === 0 && <Text style={styles.muted}>All students are doing well!</Text>}
        </Card>
      </View>
    );
  }

  if (user.role === 'accountant') {
    return (
      <View style={styles.stack}>
        <DashboardHeader title="Dashboard" subtitle="Financial overview" />
        <MetricGrid metrics={[
          ['Revenue This Month', currency(580000), 'cash'],
          ['Pending Collections', currency(245000), 'alert-triangle'],
          ['Overdue Fees', '5', 'alert-circle'],
          ['Total Students', '1240', 'account-group'],
        ]} />
        <Card title="Monthly Fee Collection"><FeeBars /></Card>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <DashboardHeader title="Dashboard" subtitle="Welcome back! Here's your school overview." />
      <MetricGrid metrics={[
        ['Total Students', '1240', 'account-group'],
        ['Total Teachers', '86', 'school'],
        ['Revenue This Month', currency(580000), 'cash'],
        ['Pending Fees', currency(245000), 'alert-triangle'],
      ]} />
      <Card title="Monthly Fee Collection"><FeeBars /></Card>
      <Card title="Weekly Attendance"><AttendanceLine /></Card>
      <Card title="Low Attendance Students">
        {lowAttendance.map((student) => <InfoRow key={student.id} title={student.name} subtitle={`Class ${student.class}${student.section}`} right={`${student.attendancePercent}%`} />)}
      </Card>
      <Card title="Recent Announcements">
        {initialAnnouncements.slice(0, 4).map((item) => <InfoRow key={item.id} title={item.title} subtitle={item.body.slice(0, 72)} right={item.priority} />)}
      </Card>
      <Card title="Quick Actions">
        <View style={styles.quickGrid}>
          <QuickAction label="Add Student" icon="person-add-outline" onPress={() => navigate('students')} />
          <QuickAction label="Record Payment" icon="card-outline" onPress={() => navigate('fees')} />
          <QuickAction label="Post News" icon="megaphone-outline" onPress={() => navigate('announcements')} />
          <QuickAction label="Report" icon="download-outline" onPress={() => navigate('reports')} />
        </View>
      </Card>
    </View>
  );
}

function StudentsScreen({ user, navigate, students, setStudents }: RouteProps) {
  const [query, setQuery] = useState('');
  const [klass, setKlass] = useState('');
  const [section, setSection] = useState('');
  const [fee, setFee] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const visibleStudents = user.role === 'parent'
    ? students.filter((student) => student.guardianEmail === user.email)
    : students;
  const filtered = visibleStudents.filter((student) => {
    const search = !query || student.name.toLowerCase().includes(query.toLowerCase()) || student.rollNo.includes(query);
    return search && (!klass || student.class === klass) && (!section || student.section === section) && (!fee || student.feeStatus === fee);
  });
  const canManage = user.role === 'admin';
  const canViewActions = user.role === 'admin' || user.role === 'teacher';

  const removeStudent = (student: Student) => {
    Alert.alert('Delete student', `Delete ${student.name}? This will remove the record from Supabase.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteStudent(student.id);
          if (error) {
            Alert.alert('Supabase error', error.message || 'Unable to delete student.');
            return;
          }
          setStudents((prev) => prev.filter((item) => item.id !== student.id));
        },
      },
    ]);
  };

  const persistStudent = async (student: Student) => {
    const isCreating = !editingStudent;
    const { data, error } = await saveStudent(student);
    if (error || !data) {
      Alert.alert('Supabase error', error?.message || 'Unable to save student.');
      return;
    }
    if (isCreating) {
      const { data: credentials, error: credentialsError } = await ensureParentCredentials(data);
      if (credentialsError) {
        Alert.alert('Student saved', `Parent login was not created: ${credentialsError.message}`);
      } else if (credentials?.created) {
        Alert.alert(
          'Parent login created',
          `Email: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}`
        );
      } else if (credentials) {
        Alert.alert('Student saved', credentials.message);
      }
    }
    setStudents((prev) => editingStudent ? prev.map((item) => item.id === data.id ? data : item) : [data, ...prev]);
    setStudentFormOpen(false);
    setEditingStudent(null);
  };

  return (
    <View style={styles.stack}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput style={styles.searchInput} placeholder="Search students or roll" value={query} onChangeText={setQuery} />
        </View>
        <Pressable style={[styles.filterButton, (klass || section || fee) && styles.filterButtonActive]} onPress={() => setFilterOpen(true)}>
          <Ionicons name="filter-outline" size={22} color={(klass || section || fee) ? '#4f46e5' : '#4b5563'} />
          {(klass || section || fee) ? <Text style={styles.filterCount}>{[klass, section, fee].filter(Boolean).length}</Text> : null}
        </Pressable>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{user.role === 'parent' ? 'My Child' : `${filtered.length} students`}</Text>
        {canManage ? <Pressable style={styles.smallButton} onPress={() => setStudentFormOpen(true)}><Text style={styles.smallButtonText}>Add</Text></Pressable> : null}
      </View>
      {!filtered.length && user.role === 'parent' ? <Card title="No child linked"><Text style={styles.muted}>No student record is linked to this parent account.</Text></Card> : null}
      {filtered.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          canManage={canManage}
          canViewActions={canViewActions}
          onOpen={() => navigate('studentDetail', student.id)}
          onEdit={() => { setEditingStudent(student); setStudentFormOpen(true); }}
          onDelete={() => removeStudent(student)}
        />
      ))}
      <FilterSheet
        visible={filterOpen}
        klass={klass}
        section={section}
        fee={fee}
        setKlass={setKlass}
        setSection={setSection}
        setFee={setFee}
        onClose={() => setFilterOpen(false)}
      />
      <StudentFormSheet
        visible={studentFormOpen}
        student={editingStudent}
        onClose={() => { setStudentFormOpen(false); setEditingStudent(null); }}
        onSave={persistStudent}
      />
    </View>
  );
}

function StudentCard({ student, canManage, canViewActions, onOpen, onEdit, onDelete }: { student: Student; canManage: boolean; canViewActions: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const feeTone = student.feeStatus === 'Paid' ? styles.badgeGood : student.feeStatus === 'Overdue' ? styles.badgeBad : styles.badgeWarn;
  const attendanceTone = student.attendancePercent >= 85 ? '#059669' : student.attendancePercent >= 75 ? '#d97706' : '#e11d48';
  const callGuardian = () => {
    if (!student.guardianPhone) {
      Alert.alert('Phone unavailable', 'Guardian phone number is not available for this student.');
      return;
    }
    Linking.openURL(`tel:${student.guardianPhone}`);
  };
  return (
    <View style={styles.studentCard}>
      <Pressable style={styles.studentCardMain} onPress={onOpen}>
        <View style={styles.studentTop}>
          <Avatar name={student.name} size={50} />
          <View style={styles.studentIdentity}>
            <Text style={styles.studentName} numberOfLines={1}>{student.name}</Text>
            <Text style={styles.studentMeta}>Roll {student.rollNo} - Class {student.class}{student.section}</Text>
          </View>
          <View style={[styles.statusBadge, feeTone]}><Text style={styles.statusText}>{student.feeStatus}</Text></View>
        </View>
        <View style={styles.studentStats}>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Attendance</Text>
            <Text style={[styles.statValue, { color: attendanceTone }]}>{student.attendancePercent}%</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Guardian</Text>
            <Text style={styles.statValue} numberOfLines={1}>{student.guardianName || 'Not set'}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${student.attendancePercent}%` }]} /></View>
        <View style={styles.studentFooter}>
          <View style={styles.guardianCallRow}>
            <Text style={styles.footerText}>{student.guardianPhone}</Text>
            <Pressable style={styles.callButton} onPress={callGuardian}>
              <Ionicons name="call-outline" size={15} color="#059669" />
              <Text style={styles.callButtonText}>Call</Text>
            </Pressable>
          </View>
          <Text style={styles.viewText}>View profile</Text>
        </View>
      </Pressable>
      {canViewActions ? (
        <View style={styles.studentActions}>
          <Pressable style={styles.studentAction} onPress={onOpen}><Ionicons name="eye-outline" size={16} color="#4f46e5" /><Text style={[styles.actionText, { color: '#4f46e5' }]}>View</Text></Pressable>
          {canManage ? <Pressable style={styles.studentAction} onPress={onEdit}><Ionicons name="pencil-outline" size={16} color="#374151" /><Text style={styles.actionText}>Edit</Text></Pressable> : null}
          {canManage ? <Pressable style={styles.studentAction} onPress={onDelete}><Ionicons name="trash-outline" size={16} color="#e11d48" /><Text style={[styles.actionText, { color: '#e11d48' }]}>Delete</Text></Pressable> : null}
        </View>
      ) : null}
    </View>
  );
}

function StudentFormSheet({ visible, student, onClose, onSave }: { visible: boolean; student: Student | null; onClose: () => void; onSave: (student: Student) => Promise<void> | void }) {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [klass, setKlass] = useState('9');
  const [section, setSection] = useState('A');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [address, setAddress] = useState('');
  const isEditing = Boolean(student);

  const reset = () => {
    setName(student?.name || '');
    setRollNo(student?.rollNo || '');
    setKlass(student?.class || '9');
    setSection(student?.section || 'A');
    setGender(student?.gender || 'Male');
    setDob(student?.dob || '');
    setGuardianName(student?.guardianName || '');
    setGuardianPhone(student?.guardianPhone || '');
    setGuardianEmail(student?.guardianEmail || '');
    setAddress(student?.address || '');
  };
  const clearForm = () => {
    setName('');
    setRollNo('');
    setKlass('9');
    setSection('A');
    setGender('Male');
    setDob('');
    setGuardianName('');
    setGuardianPhone('');
    setGuardianEmail('');
    setAddress('');
  };

  useEffect(() => {
    if (visible) reset();
  }, [visible, student]);

  const save = async () => {
    if (!name.trim() || !guardianName.trim() || !guardianPhone.trim()) {
      Alert.alert('Missing details', 'Please enter student name, guardian name, and guardian phone.');
      return;
    }
    const nextStudent: Student = {
      id: student?.id || `s${Date.now()}`,
      name: name.trim(),
      rollNo: rollNo.trim() || String(Math.floor(Math.random() * 900) + 100),
      class: klass,
      section,
      dob: dob.trim() || '2010-01-01',
      gender,
      bloodGroup: student?.bloodGroup || 'B+',
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      guardianEmail: guardianEmail.trim(),
      address: address.trim(),
      photo: student?.photo || null,
      admissionDate: student?.admissionDate || new Date().toISOString().split('T')[0],
      feeStatus: student?.feeStatus || 'Due',
      attendancePercent: student?.attendancePercent || 90,
    };
    await onSave(nextStudent);
  };

  const close = () => {
    clearForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.modalScrim} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.sheetGrip} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{isEditing ? 'Edit student' : 'Add student'}</Text>
          <Pressable style={styles.iconButtonSmall} onPress={close}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          <Text style={styles.label}>Student Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />
          <Text style={styles.label}>Roll Number</Text>
          <TextInput style={styles.input} value={rollNo} onChangeText={setRollNo} placeholder="Auto-generated if empty" />
          <ChoiceGroup label="Class" value={klass} options={classes} onChange={setKlass} allLabel="Default class" />
          <ChoiceGroup label="Section" value={section} options={sections} onChange={setSection} allLabel="Default section" />
          <ChoiceGroup label="Gender" value={gender} options={['Male', 'Female', 'Other']} onChange={setGender} allLabel="Not set" />
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />
          <Text style={styles.label}>Guardian Name</Text>
          <TextInput style={styles.input} value={guardianName} onChangeText={setGuardianName} placeholder="Guardian name" />
          <Text style={styles.label}>Guardian Phone</Text>
          <TextInput style={styles.input} value={guardianPhone} onChangeText={setGuardianPhone} placeholder="Phone number" keyboardType="phone-pad" />
          <Text style={styles.label}>Guardian Email</Text>
          <TextInput style={styles.input} value={guardianEmail} onChangeText={setGuardianEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Address</Text>
          <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="Address" multiline />
          <View style={styles.sheetActions}>
            <Pressable style={styles.ghostButton} onPress={reset}><Text style={styles.ghostText}>Reset</Text></Pressable>
            <Pressable style={styles.applyButton} onPress={save}><Text style={styles.applyText}>{isEditing ? 'Update student' : 'Save student'}</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function FilterSheet(props: {
  visible: boolean;
  klass: string;
  section: string;
  fee: string;
  setKlass: (value: string) => void;
  setSection: (value: string) => void;
  setFee: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable style={styles.modalScrim} onPress={props.onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetGrip} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filter students</Text>
          <Pressable style={styles.iconButtonSmall} onPress={props.onClose}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
        </View>
        <ChoiceGroup label="Class" value={props.klass} options={classes} onChange={props.setKlass} allLabel="All classes" />
        <ChoiceGroup label="Section" value={props.section} options={sections} onChange={props.setSection} allLabel="All sections" />
        <ChoiceGroup label="Fee" value={props.fee} options={['Paid', 'Partially Paid', 'Due', 'Overdue']} onChange={props.setFee} allLabel="All fee statuses" />
        <View style={styles.sheetActions}>
          <Pressable style={styles.ghostButton} onPress={() => { props.setKlass(''); props.setSection(''); props.setFee(''); }}><Text style={styles.ghostText}>Clear filters</Text></Pressable>
          <Pressable style={styles.applyButton} onPress={props.onClose}><Text style={styles.applyText}>Apply filters</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ChoiceGroup({ label, value, options, onChange, allLabel }: { label: string; value: string; options: string[]; onChange: (value: string) => void; allLabel: string }) {
  return (
    <View style={styles.choiceGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        <Pressable style={[styles.chip, !value && styles.chipActive]} onPress={() => onChange('')}><Text style={[styles.chipText, !value && styles.chipTextActive]}>{allLabel}</Text></Pressable>
        {options.map((option) => (
          <Pressable key={option} style={[styles.chip, value === option && styles.chipActive]} onPress={() => onChange(option)}>
            <Text style={[styles.chipText, value === option && styles.chipTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type ActiveFilter = false | '' | { label: string; onClear: () => void };
type FilterGroup = { label: string; value: string; options: string[]; onChange: (value: string) => void; allLabel: string };

function FilterHeader({ title, activeCount, onOpen }: { title: string; activeCount: number; onOpen: () => void }) {
  return (
    <View style={styles.filterHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable style={[styles.filterButton, activeCount > 0 && styles.filterButtonActive]} onPress={onOpen}>
        <Ionicons name="filter-outline" size={22} color={activeCount > 0 ? '#4f46e5' : '#4b5563'} />
        {activeCount > 0 ? <Text style={styles.filterCount}>{activeCount}</Text> : null}
      </Pressable>
    </View>
  );
}

function ActiveFilterChips({ filters }: { filters: ActiveFilter[] }) {
  const active = filters.filter((filter): filter is { label: string; onClear: () => void } => Boolean(filter));
  if (!active.length) return null;
  return (
    <View style={styles.activeFilterRow}>
      {active.map((filter) => (
        <Pressable key={filter.label} style={styles.activeFilterChip} onPress={filter.onClear}>
          <Text style={styles.activeFilterText}>{filter.label}</Text>
          <Ionicons name="close-outline" size={14} color="#4338ca" />
        </Pressable>
      ))}
    </View>
  );
}

function GenericFilterSheet({ visible, title, groups, onClear, onClose }: { visible: boolean; title: string; groups: FilterGroup[]; onClear: () => void; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalScrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetGrip} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable style={styles.iconButtonSmall} onPress={onClose}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
        </View>
        {groups.map((group) => <ChoiceGroup key={group.label} {...group} />)}
        <View style={styles.sheetActions}>
          <Pressable style={styles.ghostButton} onPress={onClear}><Text style={styles.ghostText}>Clear filters</Text></Pressable>
          <Pressable style={styles.applyButton} onPress={onClose}><Text style={styles.applyText}>Apply filters</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

function StudentDetailScreen({ selectedStudentId, students }: RouteProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const student = students.find((item) => item.id === selectedStudentId);
  if (!student) return <Card title="Student not found"><Text style={styles.muted}>Please select another student.</Text></Card>;
  const fee = initialFees.find((item) => item.studentId === student.id);
  const studentMarks = marks.filter((mark) => mark.studentId === student.id);
  const presentCount = Math.round((student.attendancePercent / 100) * 24);
  const absentCount = Math.max(0, 24 - presentCount - 2);
  const lateCount = 2;
  const examNames = Array.from(new Set(studentMarks.map((mark) => mark.exam)));
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'marks', label: 'Marks' },
    { id: 'fees', label: 'Fees' },
    { id: 'documents', label: 'Documents' },
  ];
  return (
    <View style={styles.stack}>
      <View style={styles.studentDetailHero}>
        <View style={styles.profileCover} />
        <Avatar name={student.name} size={86} />
        <Text style={styles.profileName}>{student.name}</Text>
        <Text style={styles.profileMeta}>Roll No: {student.rollNo}</Text>
        <View style={styles.profileRoleRow}>
          <Text style={styles.profileRoleBadge}>Class {student.class}-{student.section}</Text>
          <Text style={[styles.profileRoleBadge, student.feeStatus === 'Paid' ? styles.detailBadgeGood : student.feeStatus === 'Overdue' ? styles.detailBadgeBad : styles.detailBadgeWarn]}>{student.feeStatus}</Text>
        </View>
        <View style={styles.detailMetricGrid}>
          <View style={styles.detailMetric}><Text style={styles.detailMetricValue}>{student.attendancePercent}%</Text><Text style={styles.statLabel}>Attendance</Text></View>
          <View style={styles.detailMetric}><Text style={styles.detailMetricValue}>{currency(fee?.totalAmount || 0)}</Text><Text style={styles.statLabel}>Total Fees</Text></View>
          <View style={styles.detailMetric}><Text style={[styles.detailMetricValue, { color: '#059669' }]}>{currency(fee?.amountPaid || 0)}</Text><Text style={styles.statLabel}>Paid</Text></View>
          <View style={styles.detailMetric}><Text style={[styles.detailMetricValue, { color: '#e11d48' }]}>{currency(fee?.balance || 0)}</Text><Text style={styles.statLabel}>Balance</Text></View>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
        {tabs.map((tab) => (
          <Pressable key={tab.id} style={[styles.detailTab, activeTab === tab.id && styles.detailTabActive]} onPress={() => setActiveTab(tab.id)}>
            <Text style={[styles.detailTabText, activeTab === tab.id && styles.detailTabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeTab === 'profile' ? (
        <Card title="Personal Information">
          <InfoRow title="Date of Birth" subtitle={student.dob} />
          <InfoRow title="Gender" subtitle={student.gender} />
          <InfoRow title="Blood Group" subtitle={student.bloodGroup} />
          <InfoRow title="Admission Date" subtitle={student.admissionDate} />
          <InfoRow title="Guardian Name" subtitle={student.guardianName} />
          <InfoRow title="Phone" subtitle={student.guardianPhone} />
          <InfoRow title="Email" subtitle={student.guardianEmail} />
          <InfoRow title="Address" subtitle={student.address} />
        </Card>
      ) : null}

      {activeTab === 'attendance' ? (
        <View style={styles.stack}>
          <MetricGrid metrics={[
            ['Present', String(presentCount), 'check-circle'],
            ['Absent', String(absentCount), 'close-circle'],
            ['Late', String(lateCount), 'clock-outline'],
            ['Attendance', `${student.attendancePercent}%`, 'calendar-check'],
          ]} />
          <Card title="February 2025">
            <View style={styles.attendanceCalendarGrid}>
              {Array.from({ length: 28 }, (_, index) => {
                const dayNumber = index + 1;
                const status = dayNumber % 13 === 0 ? 'Absent' : dayNumber % 7 === 0 ? 'Late' : 'Present';
                return (
                  <View key={dayNumber} style={[styles.calendarDay, status === 'Present' ? styles.calendarPresent : status === 'Absent' ? styles.calendarAbsent : styles.calendarLate]}>
                    <Text style={styles.calendarDayText}>{dayNumber}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      ) : null}

      {activeTab === 'marks' ? (
        <View style={styles.stack}>
          <Card title="Performance Across Exams">
            {['Unit Test 1', 'Unit Test 2', 'Mid Term'].map((exam) => {
              const rows = studentMarks.filter((mark) => mark.exam === exam);
              const total = rows.reduce((sum, row) => sum + row.scored, 0);
              const max = rows.reduce((sum, row) => sum + row.maxMarks, 0);
              const percent = max ? Math.round((total / max) * 100) : 0;
              return <InfoRow key={exam} title={exam} subtitle={`${percent}% overall`} right={`${total}/${max}`} />;
            })}
          </Card>
          {examNames.map((exam) => (
            <Card key={exam} title={exam}>
              {studentMarks.filter((mark) => mark.exam === exam).map((mark) => (
                <InfoRow key={`${exam}-${mark.subject}`} title={mark.subject} subtitle={`${Math.round((mark.scored / mark.maxMarks) * 100)}%`} right={`${mark.scored}/${mark.maxMarks}`} />
              ))}
            </Card>
          ))}
        </View>
      ) : null}

      {activeTab === 'fees' && fee ? (
        <View style={styles.stack}>
          <Card title="Fee Structure">
            {fee.feeStructure.map((item) => <InfoRow key={item.item} title={item.item} subtitle={currency(item.amount)} />)}
            <InfoRow title="Total" subtitle={currency(fee.totalAmount)} />
          </Card>
          <Card title="Payment History">
            {fee.paymentHistory.length ? fee.paymentHistory.map((payment) => (
              <InfoRow key={payment.id} title={currency(payment.amount)} subtitle={`${payment.mode} - ${payment.receiptNo}`} right={payment.date} />
            )) : <Text style={styles.muted}>No payments recorded yet.</Text>}
          </Card>
        </View>
      ) : null}

      {activeTab === 'documents' ? (
        <Card title="Documents">
          <View style={styles.documentsEmpty}>
            <Ionicons name="folder-open-outline" size={36} color="#9ca3af" />
            <Text style={styles.sectionTitle}>No Documents</Text>
            <Text style={styles.muted}>Upload documents for this student</Text>
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function TeachersScreen({ user, teachers, setTeachers }: { user: User; teachers: Teacher[]; setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>> }) {
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');
  const [assignedClass, setAssignedClass] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const canManage = user.role === 'admin';
  const filtered = teachers.filter((teacher) => (
    (!subject || teacher.subjects.includes(subject)) &&
    (!status || teacher.status === status) &&
    (!assignedClass || teacher.classAssigned.split(', ').some((item) => item.startsWith(assignedClass)))
  ));

  return (
    <View style={styles.stack}>
      <View style={styles.filterHeader}>
        <Text style={styles.sectionTitle}>{filtered.length} teachers</Text>
        <View style={styles.headerActions}>
          {canManage ? <Pressable style={styles.smallButton} onPress={() => setFormOpen(true)}><Text style={styles.smallButtonText}>Add</Text></Pressable> : null}
          <Pressable style={[styles.filterButton, [subject, status, assignedClass].filter(Boolean).length > 0 && styles.filterButtonActive]} onPress={() => setFilterOpen(true)}>
            <Ionicons name="filter-outline" size={22} color={[subject, status, assignedClass].filter(Boolean).length > 0 ? '#4f46e5' : '#4b5563'} />
            {[subject, status, assignedClass].filter(Boolean).length > 0 ? <Text style={styles.filterCount}>{[subject, status, assignedClass].filter(Boolean).length}</Text> : null}
          </Pressable>
        </View>
      </View>
      <ActiveFilterChips filters={[
        subject && { label: subject, onClear: () => setSubject('') },
        status && { label: status, onClear: () => setStatus('') },
        assignedClass && { label: `Class ${assignedClass}`, onClear: () => setAssignedClass('') },
      ]} />
      {filtered.map((teacher) => (
        <Card key={teacher.id} title={teacher.name}>
          <InfoRow title={teacher.employeeId} subtitle={teacher.qualification} right={teacher.status} />
          <InfoRow title="Class assigned" subtitle={teacher.classAssigned} right={currency(teacher.salary)} />
          <Text style={styles.muted}>{teacher.subjects.join(', ')}</Text>
        </Card>
      ))}
      <GenericFilterSheet
        visible={filterOpen}
        title="Filter teachers"
        onClose={() => setFilterOpen(false)}
        onClear={() => { setSubject(''); setStatus(''); setAssignedClass(''); }}
        groups={[
          { label: 'Subject', value: subject, options: ['Mathematics', 'Science', 'Hindi', 'English', 'Social Studies', 'Computer Science', 'Physical Education', 'Sanskrit'], onChange: setSubject, allLabel: 'All subjects' },
          { label: 'Status', value: status, options: ['Active', 'On Leave', 'Inactive'], onChange: setStatus, allLabel: 'All statuses' },
          { label: 'Class', value: assignedClass, options: classes, onChange: setAssignedClass, allLabel: 'All classes' },
        ]}
      />
      <TeacherFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={async (teacher) => {
          const { data, error } = await saveTeacher(teacher);
          if (error || !data) {
            Alert.alert('Supabase error', error?.message || 'Unable to save teacher.');
            return;
          }
          setTeachers((prev) => [data, ...prev]);
          setFormOpen(false);
        }}
      />
    </View>
  );
}

function TeacherFormSheet({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (teacher: Teacher) => Promise<void> | void }) {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [qualification, setQualification] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState<Teacher['status']>('Active');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const subjectOptions = ['Mathematics', 'Science', 'Hindi', 'English', 'Social Studies', 'Computer Science', 'Physical Education', 'Sanskrit'];
  const classOptions = ['7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'];

  const reset = () => {
    setName('');
    setEmployeeId('');
    setAssignedClasses([]);
    setQualification('');
    setPhone('');
    setEmail('');
    setSalary('');
    setStatus('Active');
    setSelectedSubjects([]);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => prev.includes(subject) ? prev.filter((item) => item !== subject) : [...prev, subject]);
  };

  const toggleAssignedClass = (className: string) => {
    setAssignedClasses((prev) => prev.includes(className) ? prev.filter((item) => item !== className) : [...prev, className]);
  };

  const save = async () => {
    if (!name.trim() || !employeeId.trim() || assignedClasses.length === 0) {
      Alert.alert('Missing details', 'Please enter teacher name, employee ID, and select at least one class.');
      return;
    }
    const teacher: Teacher = {
      id: `t${Date.now()}`,
      name: name.trim(),
      employeeId: employeeId.trim(),
      subjects: selectedSubjects.length ? selectedSubjects : ['Mathematics'],
      classAssigned: assignedClasses.join(', '),
      qualification: qualification.trim() || 'Not specified',
      phone: phone.trim(),
      email: email.trim(),
      joinDate: new Date().toISOString().split('T')[0],
      salary: Number(salary) || 0,
      status,
    };
    await onSave(teacher);
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalScrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetGrip} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Add teacher</Text>
          <Pressable style={styles.iconButtonSmall} onPress={onClose}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          <Text style={styles.label}>Teacher Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />
          <Text style={styles.label}>Employee ID</Text>
          <TextInput style={styles.input} value={employeeId} onChangeText={setEmployeeId} placeholder="EMP001" />
          <Text style={styles.label}>Classes Assigned</Text>
          <View style={styles.chipRow}>
            {classOptions.map((className) => (
              <Pressable key={className} style={[styles.chip, assignedClasses.includes(className) && styles.chipActive]} onPress={() => toggleAssignedClass(className)}>
                <Text style={[styles.chipText, assignedClasses.includes(className) && styles.chipTextActive]}>{className}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Qualification</Text>
          <TextInput style={styles.input} value={qualification} onChangeText={setQualification} placeholder="M.Sc Mathematics" />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Salary</Text>
          <TextInput style={styles.input} value={salary} onChangeText={setSalary} placeholder="45000" keyboardType="numeric" />
          <ChoiceGroup label="Status" value={status} options={['Active', 'On Leave', 'Inactive']} onChange={(value) => setStatus((value || 'Active') as Teacher['status'])} allLabel="Active" />
          <Text style={styles.label}>Subjects</Text>
          <View style={styles.chipRow}>
            {subjectOptions.map((subject) => (
              <Pressable key={subject} style={[styles.chip, selectedSubjects.includes(subject) && styles.chipActive]} onPress={() => toggleSubject(subject)}>
                <Text style={[styles.chipText, selectedSubjects.includes(subject) && styles.chipTextActive]}>{subject}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.sheetActions}>
            <Pressable style={styles.ghostButton} onPress={reset}><Text style={styles.ghostText}>Reset</Text></Pressable>
            <Pressable style={styles.applyButton} onPress={save}><Text style={styles.applyText}>Save teacher</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function AdminOverviewTab({ students, onNavigate }: { students: Student[]; onNavigate?: (tab: string) => void }) {
  const submitted = mockPendingSubmissions.filter((p) => p.status === 'Submitted').length;
  const pending = mockPendingSubmissions.filter((p) => p.status === 'Pending').length;
  const lowAtt = students.filter((s) => s.attendancePercent < 75).length;

  return (
    <View style={styles.stack}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[
          { label: 'Students', value: String(students.length), icon: 'account-group' as any, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Submitted', value: String(submitted), icon: 'check-circle' as any, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Pending', value: String(pending), icon: 'clock-outline' as any, color: '#ea580c', bg: '#fff7ed' },
          { label: 'Low Att.', value: String(lowAtt), icon: 'alert-circle' as any, color: '#dc2626', bg: '#fef2f2' },
        ].map((card) => (
          <View key={card.label} style={{ flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: card.bg, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={card.icon} size={20} color={card.color} />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{card.value}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>{card.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <Card title="Submission Status">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {mockPendingSubmissions.map((cls) => (
            <View key={cls.classSection} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: cls.status === 'Submitted' ? '#f0fdf4' : '#fef2f2', alignItems: 'center', minWidth: 56 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: cls.status === 'Submitted' ? '#16a34a' : '#ef4444' }}>{cls.classSection}</Text>
              <MaterialCommunityIcons name={cls.status === 'Submitted' ? 'check-circle' : 'clock-outline'} size={14} color={cls.status === 'Submitted' ? '#22c55e' : '#ea580c'} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#dcfce7' }} />
            <Text style={{ fontSize: 12, color: '#6b7280' }}>{submitted} Submitted</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#fee2e2' }} />
            <Text style={{ fontSize: 12, color: '#6b7280' }}>{pending} Pending</Text>
          </View>
        </View>
      </Card>

      <Card title="Quick Actions">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Chase Teachers', subtitle: `${pending} pending`, icon: 'send' as any, color: '#ea580c', bg: '#fff7ed', tab: 'pending' },
            { label: 'Override', subtitle: 'Correct records', icon: 'shield-checkmark' as any, color: '#4f46e5', bg: '#eef2ff', tab: 'override' },
            { label: 'Absentee Alerts', subtitle: `${lowAtt} flagged`, icon: 'bell-alert' as any, color: '#dc2626', bg: '#fef2f2', tab: 'alerts' },
          ].map((action) => (
            <Pressable key={action.label} style={{ flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f5f9' }} onPress={() => onNavigate?.(action.tab)}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: action.bg, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={action.icon} size={18} color={action.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{action.label}</Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>{action.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card title="All Classes">
        {mockPendingSubmissions.map((cls) => (
          <View key={cls.classSection} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{cls.className}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>{cls.teacherName} · {cls.studentCount} students</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable
                onPress={() => Linking.openURL(`tel:${cls.teacherPhone}`)}
                style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="call" size={14} color="#16a34a" />
              </Pressable>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, backgroundColor: cls.status === 'Submitted' ? '#f0fdf4' : '#fef2f2' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: cls.status === 'Submitted' ? '#16a34a' : '#ef4444' }}>{cls.status}</Text>
                </View>
                {cls.submittedAt && (
                  <Text style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(cls.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

function AdminPendingTab() {
  const pendingList = mockPendingSubmissions.filter((p) => p.status === 'Pending');
  const submittedList = mockPendingSubmissions.filter((p) => p.status === 'Submitted');

  return (
    <View style={styles.stack}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[styles.metric, { flex: 1, borderLeftWidth: 3, borderLeftColor: '#22c55e' }]}>
          <Text style={styles.metricLabel}>Submitted</Text>
          <Text style={[styles.metricValue, { color: '#22c55e' }]}>{submittedList.length}</Text>
        </View>
        <View style={[styles.metric, { flex: 1, borderLeftWidth: 3, borderLeftColor: '#ef4444' }]}>
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={[styles.metricValue, { color: '#ef4444' }]}>{pendingList.length}</Text>
        </View>
      </View>
      <Card title="Pending Submissions">
        {pendingList.map((cls) => (
          <View key={cls.classSection} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{cls.className}</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>{cls.teacherName} · {cls.studentCount} students</Text>
              </View>
              <Pressable
                onPress={() => Linking.openURL(`tel:${cls.teacherPhone}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }}
              >
                <Ionicons name="call" size={14} color="#16a34a" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#16a34a' }}>Call</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Card>
      <Card title="Submitted Classes">
        {submittedList.map((cls) => (
          <InfoRow key={cls.classSection} title={cls.className} subtitle={`${cls.teacherName} · ${cls.submittedAt ? new Date(cls.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}`} right="Done" />
        ))}
      </Card>
    </View>
  );
}

function AdminOverrideTab({ students, user }: { students: Student[]; user: User }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLog, setAuditLog] = useState(mockOverrideAuditLog);
  const [overrideStatus, setOverrideStatus] = useState<'Present' | 'Absent' | 'Late'>('Present');
  const [overrideReason, setOverrideReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNo.includes(q) || `${s.class}${s.section}`.toLowerCase().includes(q)).slice(0, 8);
  }, [students, searchQuery]);

  return (
    <View style={styles.stack}>
      <Card title="Search Student">
        <View style={styles.loginInputWrap}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput style={styles.loginInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by name, roll no, or class..." placeholderTextColor="#9ca3af" />
        </View>
        {filtered.map((s) => (
          <Pressable key={s.id} onPress={() => { setSelectedStudent(s); setSearchQuery(''); setShowForm(false); }} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{s.name}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>Class {s.class}{s.section} · Roll {s.rollNo}</Text>
          </Pressable>
        ))}
      </Card>
      {selectedStudent && (
        <Card title={selectedStudent.name}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Class {selectedStudent.class}{selectedStudent.section} · Roll {selectedStudent.rollNo} · {selectedStudent.attendancePercent}% attendance</Text>
          <Text style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>Tap a day on the calendar to override attendance.</Text>
          <Pressable style={[styles.fullWidthButton, { backgroundColor: '#4f46e5' }]} onPress={() => setShowForm(!showForm)}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.primaryText}>{showForm ? 'Cancel' : 'Override Attendance'}</Text>
          </Pressable>
          {showForm && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>New Status</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {(['Present', 'Absent', 'Late'] as const).map((s) => (
                  <Pressable key={s} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: overrideStatus === s ? (s === 'Present' ? '#dcfce7' : s === 'Absent' ? '#fee2e2' : '#fef3c7') : '#f9fafb', borderWidth: 1, borderColor: overrideStatus === s ? (s === 'Present' ? '#22c55e' : s === 'Absent' ? '#ef4444' : '#f59e0b') : '#e5e7eb' }} onPress={() => setOverrideStatus(s)}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: overrideStatus === s ? (s === 'Present' ? '#166534' : s === 'Absent' ? '#991b1b' : '#92400e') : '#6b7280' }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Reason</Text>
              <TextInput style={[styles.loginInput, { minHeight: 60 }]} value={overrideReason} onChangeText={setOverrideReason} multiline placeholder="e.g., Parent called - was present" placeholderTextColor="#9ca3af" />
              <Pressable style={[styles.fullWidthButton, { backgroundColor: overrideReason ? '#4f46e5' : '#e5e7eb', marginTop: 12 }]} onPress={() => {
                if (!overrideReason || !selectedStudent) return;
                setAuditLog((prev) => [{ id: `ov-${Date.now()}`, studentId: selectedStudent.id, studentName: selectedStudent.name, classSection: `${selectedStudent.class}${selectedStudent.section}`, date: new Date().toISOString().slice(0, 10), originalStatus: 'Not Taken', newStatus: overrideStatus, reason: overrideReason, overriddenBy: user.name, overriddenAt: new Date().toISOString() }, ...prev]);
                setShowForm(false);
                setOverrideReason('');
                Alert.alert('Override saved', `${selectedStudent.name}'s attendance changed to ${overrideStatus}.`);
              }}>
                <Text style={styles.primaryText}>Save Override</Text>
              </Pressable>
            </View>
          )}
        </Card>
      )}
      <Card title="Override Audit Log">
        <Pressable onPress={() => setShowAuditLog(!showAuditLog)}>
          <Text style={{ fontSize: 13, color: '#4f46e5', fontWeight: '500' }}>{showAuditLog ? 'Hide' : 'Show'} Log</Text>
        </Pressable>
        {showAuditLog && auditLog.map((entry) => (
          <View key={entry.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{entry.studentName} · Class {entry.classSection}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>{entry.originalStatus} → {entry.newStatus} on {entry.date}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>"{entry.reason}"</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>by {entry.overriddenBy}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function AdminAlertsTab({ students }: { students: Student[] }) {
  const lowStudents = useMemo(() => students.filter((s) => s.attendancePercent < 75).sort((a, b) => a.attendancePercent - b.attendancePercent), [students]);
  const critical = students.filter((s) => s.attendancePercent < 60).length;
  const warning = students.filter((s) => s.attendancePercent >= 60 && s.attendancePercent < 75).length;

  return (
    <View style={styles.stack}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[styles.metric, { flex: 1, borderLeftWidth: 3, borderLeftColor: '#dc2626' }]}>
          <Text style={styles.metricLabel}>Critical (&lt;60%)</Text>
          <Text style={[styles.metricValue, { color: '#dc2626' }]}>{critical}</Text>
        </View>
        <View style={[styles.metric, { flex: 1, borderLeftWidth: 3, borderLeftColor: '#ea580c' }]}>
          <Text style={styles.metricLabel}>Warning (60-75%)</Text>
          <Text style={[styles.metricValue, { color: '#ea580c' }]}>{warning}</Text>
        </View>
      </View>
      <Card title="Students Below 75%">
        {lowStudents.map((s) => (
          <View key={s.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{s.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Parent: {s.guardianName}</Text>
                {s.guardianPhone ? (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${s.guardianPhone}`)}
                    style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="call" size={12} color="#16a34a" />
                  </Pressable>
                ) : null}
              </View>
            </View>
            <View style={{ backgroundColor: s.attendancePercent < 60 ? '#fee2e2' : '#fff7ed', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontWeight: '700', fontSize: 13, color: s.attendancePercent < 60 ? '#dc2626' : '#ea580c' }}>{s.attendancePercent}%</Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const mockPendingSubmissions = [
  { classSection: '1A', className: 'Class 1A', teacherName: 'Ananya Iyer', teacherPhone: '9876500017', status: 'Submitted' as const, submittedAt: '2025-03-01T08:45:00', studentCount: 3 },
  { classSection: '1B', className: 'Class 1B', teacherName: 'Ananya Iyer', teacherPhone: '9876500017', status: 'Pending' as const, studentCount: 2 },
  { classSection: '2A', className: 'Class 2A', teacherName: 'Ananya Iyer', teacherPhone: '9876500017', status: 'Submitted' as const, submittedAt: '2025-03-01T08:50:00', studentCount: 1 },
  { classSection: '2B', className: 'Class 2B', teacherName: 'Ananya Iyer', teacherPhone: '9876500017', status: 'Pending' as const, studentCount: 1 },
  { classSection: '3A', className: 'Class 3A', teacherName: 'Mohan Krishnan', teacherPhone: '9876500018', status: 'Submitted' as const, submittedAt: '2025-03-01T08:55:00', studentCount: 1 },
  { classSection: '3B', className: 'Class 3B', teacherName: 'Mohan Krishnan', teacherPhone: '9876500018', status: 'Pending' as const, studentCount: 1 },
  { classSection: '4A', className: 'Class 4A', teacherName: 'Mohan Krishnan', teacherPhone: '9876500018', status: 'Submitted' as const, submittedAt: '2025-03-01T09:00:00', studentCount: 1 },
  { classSection: '4B', className: 'Class 4B', teacherName: 'Mohan Krishnan', teacherPhone: '9876500018', status: 'Pending' as const, studentCount: 1 },
  { classSection: '5A', className: 'Class 5A', teacherName: 'Farah Siddiqui', teacherPhone: '9876500019', status: 'Submitted' as const, submittedAt: '2025-03-01T09:05:00', studentCount: 1 },
  { classSection: '5B', className: 'Class 5B', teacherName: 'Farah Siddiqui', teacherPhone: '9876500019', status: 'Pending' as const, studentCount: 1 },
  { classSection: '6A', className: 'Class 6A', teacherName: 'Farah Siddiqui', teacherPhone: '9876500019', status: 'Submitted' as const, submittedAt: '2025-03-01T09:10:00', studentCount: 1 },
  { classSection: '6B', className: 'Class 6B', teacherName: 'Farah Siddiqui', teacherPhone: '9876500019', status: 'Pending' as const, studentCount: 1 },
  { classSection: '7A', className: 'Class 7A', teacherName: 'Meena Kumari', teacherPhone: '9876500005', status: 'Submitted' as const, submittedAt: '2025-03-01T09:15:00', studentCount: 2 },
  { classSection: '7B', className: 'Class 7B', teacherName: 'Ramesh Yadav', teacherPhone: '9876500010', status: 'Submitted' as const, submittedAt: '2025-03-01T09:20:00', studentCount: 2 },
  { classSection: '8A', className: 'Class 8A', teacherName: 'Sunita Devi', teacherPhone: '9876500003', status: 'Submitted' as const, submittedAt: '2025-03-01T09:25:00', studentCount: 3 },
  { classSection: '8B', className: 'Class 8B', teacherName: 'Kavitha Nair', teacherPhone: '9876500009', status: 'Pending' as const, studentCount: 3 },
  { classSection: '9A', className: 'Class 9A', teacherName: 'Priya Sharma', teacherPhone: '9876500001', status: 'Submitted' as const, submittedAt: '2025-03-01T08:45:00', studentCount: 5 },
  { classSection: '9B', className: 'Class 9B', teacherName: 'Leena D Souza', teacherPhone: '9876500015', status: 'Pending' as const, studentCount: 2 },
  { classSection: '10A', className: 'Class 10A', teacherName: 'Amit Verma', teacherPhone: '9876500002', status: 'Submitted' as const, submittedAt: '2025-03-01T08:40:00', studentCount: 3 },
  { classSection: '10B', className: 'Class 10B', teacherName: 'Nisha Menon', teacherPhone: '9876500013', status: 'Pending' as const, studentCount: 3 },
  { classSection: '11A', className: 'Class 11A', teacherName: 'Vijay Kumar', teacherPhone: '9876500006', status: 'Submitted' as const, submittedAt: '2025-03-01T08:35:00', studentCount: 2 },
  { classSection: '11B', className: 'Class 11B', teacherName: 'Pooja Bhatt', teacherPhone: '9876500011', status: 'Submitted' as const, submittedAt: '2025-03-01T08:30:00', studentCount: 2 },
  { classSection: '12A', className: 'Class 12A', teacherName: 'Suresh Raina', teacherPhone: '9876500008', status: 'Submitted' as const, submittedAt: '2025-03-01T08:25:00', studentCount: 4 },
  { classSection: '12B', className: 'Class 12B', teacherName: 'Deepak Hooda', teacherPhone: '9876500012', status: 'Submitted' as const, submittedAt: '2025-03-01T08:20:00', studentCount: 3 },
];

const mockOverrideAuditLog = [
  { id: 'ov001', studentId: 's001', studentName: 'Arjun Singh', classSection: '9A', date: '2025-02-28', originalStatus: 'Absent', newStatus: 'Present', reason: 'Parent called - was present, marked absent by mistake', overriddenBy: 'Ravi Kumar', overriddenAt: '2025-02-28T14:30:00' },
  { id: 'ov002', studentId: 's004', studentName: 'Ananya Gupta', classSection: '9B', date: '2025-02-27', originalStatus: 'Present', newStatus: 'Absent', reason: 'Teacher requested correction - student left early', overriddenBy: 'Ravi Kumar', overriddenAt: '2025-02-27T16:00:00' },
];

function AttendanceScreen({ user, students, setStudents, teachers, setSessionNotifications }: RouteProps) {
  const [klass, setKlass] = useState('');
  const [section, setSection] = useState('');
  const [range, setRange] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [lastSubmission, setLastSubmission] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const isAdmin = user.role === 'admin';
  const [adminTab, setAdminTab] = useState('overview');
  const currentTeacher = teachers.find((teacher) => teacher.email === user.email || teacher.name === user.name);
  const teacherClassOptions = useMemo(() => currentTeacher ? parseAssignedClasses(currentTeacher.classAssigned) : [], [currentTeacher]);
  const visibleStudents = user.role === 'parent'
    ? students.filter((student) => isStudentLinkedToParent(student, user))
    : students;
  const filtered = visibleStudents.filter((student) => (
    (!klass || student.class === klass) &&
    (!section || student.section === section) &&
    (!range || (range === 'Below 75%' ? student.attendancePercent < 75 : range === '75% - 85%' ? student.attendancePercent >= 75 && student.attendancePercent < 85 : student.attendancePercent >= 85))
  ));
  const averageAttendance = visibleStudents.length
    ? Math.round(visibleStudents.reduce((sum, student) => sum + student.attendancePercent, 0) / visibleStudents.length)
    : 0;
  const lowAttendanceCount = visibleStudents.filter((student) => student.attendancePercent < 75).length;
  const strongAttendanceCount = visibleStudents.filter((student) => student.attendancePercent >= 95).length;
  const parentChild = user.role === 'parent' ? visibleStudents[0] : null;
  const parentMonthRows = parentChild ? monthlyAttendanceFor(parentChild, selectedMonth) : [];
  const monthSummary = parentMonthRows.reduce((acc, row) => {
    acc[row.status] += 1;
    return acc;
  }, { Present: 0, Absent: 0, Late: 0 } as Record<AttendanceStatus, number>);
  const canSubmitAttendance = user.role === 'teacher';
  const submitAttendance = async (records: Record<string, AttendanceStatus>, meta: { klass: string; section: string; date: string }) => {
    const summary = Object.values(records).reduce((acc, status) => {
      acc[status] += 1;
      return acc;
    }, { Present: 0, Absent: 0, Late: 0 } as Record<AttendanceStatus, number>);

    setStudents((prev) => prev.map((student) => {
      const status = records[student.id];
      if (!status) return student;
      const nextPercent = status === 'Present'
        ? Math.min(100, student.attendancePercent + 1)
        : status === 'Absent'
          ? Math.max(0, student.attendancePercent - 2)
          : status === 'Late'
            ? Math.max(0, student.attendancePercent - 1)
          : student.attendancePercent;
      return { ...student, attendancePercent: nextPercent };
    }));
    await saveAttendanceRecords(students
      .filter((student) => records[student.id])
      .map((student) => ({
        id: `att-${student.id}-${meta.date}`,
        student_id: student.id,
        class: student.class,
        section: student.section,
        date: meta.date,
        status: records[student.id],
        marked_by: null,
      })));
    const absentAlerts: Notification[] = students
      .filter((student) => records[student.id] === 'Absent')
      .map((student) => ({
        id: `absent-${student.id}-${meta.date}-${Date.now()}`,
        type: 'attendance',
        title: 'Absent Today',
        message: `${student.name} was marked absent for Class ${student.class}${student.section} on ${meta.date}.`,
        time: new Date().toISOString(),
        read: false,
        forRole: ['parent'],
        targetEmail: student.guardianEmail.trim().toLowerCase(),
      }));
    if (absentAlerts.length) {
      await createNotifications(absentAlerts.map((alert) => ({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        time: alert.time,
        read: alert.read,
        for_role: alert.forRole,
        target_email: alert.targetEmail || null,
      })));
      setSessionNotifications((prev) => [...absentAlerts, ...prev]);
    }
    setLastSubmission(`Class ${meta.klass}${meta.section} submitted for ${meta.date} (${summary.Present} present, ${summary.Absent} absent, ${summary.Late} late)`);
    setSubmissionOpen(false);
    Alert.alert('Attendance submitted', `Class ${meta.klass}${meta.section} attendance has been recorded.`);
  };

  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: 'view-dashboard-outline' as any },
    { id: 'mark', label: 'Mark', icon: 'checkbox-marked-circle-outline' as any },
    { id: 'pending', label: 'Pending', icon: 'clock-outline' as any },
    { id: 'override', label: 'Override', icon: 'shield-edit-outline' as any },
    { id: 'alerts', label: 'Absentees', icon: 'account-alert-outline' as any },
  ];

  if (isAdmin) {
    return (
      <View style={styles.stack}>
        <DashboardHeader title="Attendance Control" subtitle="Manage attendance across all classes" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, marginBottom: 12 }}>
          {adminTabs.map((tab) => {
            const active = adminTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={{ minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: active ? '#4f46e5' : '#fff', borderWidth: 1, borderColor: active ? '#4f46e5' : '#e5e7eb' }}
                onPress={() => setAdminTab(tab.id)}
              >
                <MaterialCommunityIcons name={tab.icon} size={20} color={active ? '#fff' : '#6b7280'} style={{ marginBottom: 2 }} />
                <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#fff' : '#6b7280', textAlign: 'center' }}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView>
          {adminTab === 'overview' && <AdminOverviewTab students={students} onNavigate={setAdminTab} />}
          {adminTab === 'mark' && (
            <View style={styles.stack}>
              <Card title="Mark Attendance">
                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Class</Text>
                    <View style={styles.chipRow}>
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((c) => (
                        <Pressable key={c} style={[styles.chip, klass === c && styles.chipActive]} onPress={() => { setKlass(c); setLoaded(false); }}>
                          <Text style={[styles.chipText, klass === c && styles.chipTextActive]}>{c}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Section</Text>
                    <View style={styles.chipRow}>
                      {['A', 'B', 'C', 'D'].map((s) => (
                        <Pressable key={s} style={[styles.chip, section === s && styles.chipActive]} onPress={() => { setSection(s); setLoaded(false); }}>
                          <Text style={[styles.chipText, section === s && styles.chipTextActive]}>{s}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <Pressable style={[styles.fullWidthButton, { opacity: klass && section ? 1 : 0.5 }]} disabled={!klass || !section} onPress={() => setLoaded(true)}>
                    <Ionicons name="search" size={18} color="#fff" />
                    <Text style={styles.primaryText}>Load Students</Text>
                  </Pressable>
                </View>
              </Card>
              {loaded && klass && section && (
                <>
                  <FilterHeader title={`${filtered.length} students in ${klass}${section}`} activeCount={0} onOpen={() => {}} />
                  {filtered.map((student) => {
                    const status = attendance[student.id];
                    return (
                      <View key={student.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{student.name}</Text>
                          <Text style={{ fontSize: 12, color: '#6b7280' }}>Roll {student.rollNo}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {(['Present', 'Absent', 'Late'] as const).map((s) => (
                            <Pressable
                              key={s}
                              style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: status === s ? (s === 'Present' ? '#059669' : s === 'Absent' ? '#e11d48' : '#d97706') : '#e5e7eb', backgroundColor: status === s ? (s === 'Present' ? '#059669' : s === 'Absent' ? '#e11d48' : '#d97706') : '#fff' }}
                              onPress={() => setAttendance((prev) => ({ ...prev, [student.id]: s }))}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '600', color: status === s ? '#fff' : '#4b5563' }}>{s}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                  {filtered.length > 0 && (
                    <Pressable style={[styles.fullWidthButton, { marginTop: 8 }]} onPress={() => {
                      Alert.alert('Attendance submitted', `Class ${klass}${section} attendance has been recorded.`);
                      setLoaded(false);
                      setAttendance({});
                    }}>
                      <Text style={styles.primaryText}>Submit Attendance</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}
          {adminTab === 'pending' && <AdminPendingTab />}
          {adminTab === 'override' && <AdminOverrideTab students={students} user={user} />}
          {adminTab === 'alerts' && <AdminAlertsTab students={students} />}
        </ScrollView>
        <GenericFilterSheet visible={filterOpen} title="Filter attendance" onClose={() => setFilterOpen(false)} onClear={() => { setKlass(''); setSection(''); setRange(''); }} groups={[{ label: 'Class', value: klass, options: classes, onChange: setKlass, allLabel: 'All classes' }, { label: 'Section', value: section, options: sections, onChange: setSection, allLabel: 'All sections' }, { label: 'Attendance', value: range, options: ['Below 75%', '75% - 85%', '85% and above'], onChange: setRange, allLabel: 'All attendance' }]} />
        <AttendanceSubmissionSheet visible={submissionOpen} students={students} assignedClasses={teacherClassOptions} onClose={() => setSubmissionOpen(false)} onSubmit={submitAttendance} />
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {user.role === 'parent' ? (
        <View style={styles.stack}>
          <MetricGrid metrics={[
            ['Attendance', `${averageAttendance}%`, 'calendar-check'],
            ['Below 75%', String(lowAttendanceCount), 'alert-circle'],
            ['95%+', String(strongAttendanceCount), 'star-circle'],
            ['Linked Children', String(visibleStudents.length), 'account-child'],
          ]} />
          {parentChild ? (
            <Card title="Month-wise Attendance">
              <View style={styles.monthSelector}>
                {attendanceMonths.map((month, index) => (
                  <Pressable key={month.label} style={[styles.monthChip, selectedMonth === index && styles.monthChipActive]} onPress={() => setSelectedMonth(index)}>
                    <Text style={[styles.monthChipText, selectedMonth === index && styles.monthChipTextActive]}>{month.label}</Text>
                  </Pressable>
                ))}
              </View>
              <InfoRow title={parentChild.name} subtitle={`${attendanceMonths[selectedMonth].name} - Class ${parentChild.class}${parentChild.section}`} right={`${parentChild.attendancePercent}%`} />
              <View style={styles.monthSummaryGrid}>
                <View style={[styles.monthSummaryTile, styles.monthPresentTile]}><Text style={styles.monthSummaryValue}>{monthSummary.Present}</Text><Text style={styles.monthSummaryLabel}>Present</Text></View>
                <View style={[styles.monthSummaryTile, styles.monthAbsentTile]}><Text style={styles.monthSummaryValue}>{monthSummary.Absent}</Text><Text style={styles.monthSummaryLabel}>Absent</Text></View>
                <View style={[styles.monthSummaryTile, styles.monthLateTile]}><Text style={styles.monthSummaryValue}>{monthSummary.Late}</Text><Text style={styles.monthSummaryLabel}>Late</Text></View>
              </View>
              <View style={styles.attendanceCalendarGrid}>
                {parentMonthRows.map((row) => (
                  <View key={`${selectedMonth}-${row.day}`} style={[styles.calendarDay, row.status === 'Present' ? styles.calendarPresent : row.status === 'Absent' ? styles.calendarAbsent : styles.calendarLate]}>
                    <Text style={styles.calendarDayText}>{row.day}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} /><Text style={styles.muted}>Present</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={styles.muted}>Absent</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} /><Text style={styles.muted}>Late</Text></View>
              </View>
            </Card>
          ) : null}
        </View>
      ) : (
        <Card title="Weekly Attendance"><AttendanceLine /></Card>
      )}
      {canSubmitAttendance ? (
        <Card title="Submit Class Attendance">
          <InfoRow title="Teacher entry" subtitle={lastSubmission || 'Mark daily attendance for one class section'} right={lastSubmission ? 'Done' : 'Ready'} />
          <Pressable style={styles.fullWidthButton} onPress={() => setSubmissionOpen(true)}>
            <Ionicons name="checkbox-outline" size={18} color="#fff" />
            <Text style={styles.primaryText}>Open Attendance Register</Text>
          </Pressable>
        </Card>
      ) : null}
      <FilterHeader
        title={`${filtered.length} attendance records`}
        activeCount={[klass, section, range].filter(Boolean).length}
        onOpen={() => setFilterOpen(true)}
      />
      <ActiveFilterChips filters={[
        klass && { label: `Class ${klass}`, onClear: () => setKlass('') },
        section && { label: `Section ${section}`, onClear: () => setSection('') },
        range && { label: range, onClear: () => setRange('') },
      ]} />
      {filtered.slice(0, 12).map((student) => <InfoRow key={student.id} title={student.name} subtitle={`Class ${student.class}${student.section}`} right={`${student.attendancePercent}%`} />)}
      {!filtered.length && user.role === 'parent' ? <Card title="No child linked"><Text style={styles.muted}>No attendance record is linked to this parent account.</Text></Card> : null}
      <GenericFilterSheet
        visible={filterOpen}
        title="Filter attendance"
        onClose={() => setFilterOpen(false)}
        onClear={() => { setKlass(''); setSection(''); setRange(''); }}
        groups={[
          { label: 'Class', value: klass, options: classes, onChange: setKlass, allLabel: 'All classes' },
          { label: 'Section', value: section, options: sections, onChange: setSection, allLabel: 'All sections' },
          { label: 'Attendance', value: range, options: ['Below 75%', '75% - 85%', '85% and above'], onChange: setRange, allLabel: 'All attendance' },
        ]}
      />
      <AttendanceSubmissionSheet
        visible={submissionOpen}
        students={students}
        assignedClasses={teacherClassOptions}
        onClose={() => setSubmissionOpen(false)}
        onSubmit={submitAttendance}
      />
    </View>
  );
}

function AttendanceSubmissionSheet({
  visible,
  students,
  assignedClasses,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  students: Student[];
  assignedClasses: AssignedClass[];
  onClose: () => void;
  onSubmit: (records: Record<string, AttendanceStatus>, meta: { klass: string; section: string; date: string }) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const firstAssigned = assignedClasses[0];
  const [klass, setKlass] = useState(firstAssigned?.klass || '');
  const [section, setSection] = useState(firstAssigned?.section || '');
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const roster = students.filter((student) => student.class === klass && student.section === section);
  const setStatus = (studentId: string, status: AttendanceStatus) => setStatuses((prev) => ({ ...prev, [studentId]: status }));
  const selectAssignedClass = (item: AssignedClass) => {
    setKlass(item.klass);
    setSection(item.section);
    setStatuses({});
    setAlreadySubmitted(false);
  };
  useEffect(() => {
    const first = assignedClasses[0];
    setKlass(first?.klass || '');
    setSection(first?.section || '');
    setStatuses({});
    setAlreadySubmitted(false);
  }, [assignedClasses, visible]);

  useEffect(() => {
    if (!visible || !klass || !section) return;
    const dateToCheck = attendanceDate || today;
    let cancelled = false;
    (async () => {
      setChecking(true);
      const { exists } = await hasAttendanceForDate(dateToCheck, `${klass}-${section}`);
      if (cancelled) return;
      setAlreadySubmitted(exists);
      if (exists) {
        const { data } = await getAttendanceForDate(dateToCheck, `${klass}-${section}`);
        if (!cancelled && data) {
          const loaded: Record<string, AttendanceStatus> = {};
          data.forEach((row: any) => { loaded[row.student_id] = row.status; });
          setStatuses(loaded);
        }
      }
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [visible, klass, section, attendanceDate]);

  const submit = async () => {
    if (!assignedClasses.length) {
      Alert.alert('No assigned class', 'No class has been assigned to this teacher yet.');
      return;
    }
    if (!roster.length) {
      Alert.alert('No students found', `There are no students in Class ${klass}${section}.`);
      return;
    }
    const dateToCheck = attendanceDate || today;
    const { exists } = await hasAttendanceForDate(dateToCheck, `${klass}-${section}`);
    if (exists) {
      Alert.alert('Already submitted', `Attendance for Class ${klass}${section} on ${dateToCheck} has already been submitted.`);
      return;
    }
    const records = roster.reduce((acc, student) => {
      acc[student.id] = statuses[student.id] || 'Present';
      return acc;
    }, {} as Record<string, AttendanceStatus>);
    onSubmit(records, { klass, section, date: dateToCheck });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalScrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetGrip} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Submit attendance</Text>
          <Pressable onPress={onClose}><Ionicons name="close-outline" size={26} color="#111827" /></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          <Text style={styles.label}>Assigned classes</Text>
          <View style={styles.chipRow}>
            {assignedClasses.map((item) => (
              <Pressable key={item.label} style={[styles.chip, klass === item.klass && section === item.section && styles.chipActive]} onPress={() => selectAssignedClass(item)}>
                <Text style={[styles.chipText, klass === item.klass && section === item.section && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Date</Text>
          <TextInput style={styles.input} value={attendanceDate} onChangeText={setAttendanceDate} placeholder="YYYY-MM-DD" />
          {checking && <Text style={styles.muted}>Checking attendance...</Text>}
          {alreadySubmitted && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderColor: '#6EE7B7', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={{ color: '#065F46', marginLeft: 6, fontSize: 13, fontWeight: '500' }}>
                Attendance already submitted for this class on {attendanceDate}
              </Text>
            </View>
          )}
          <View style={styles.attendanceRegisterHeader}>
            <Text style={styles.sectionTitle}>{roster.length} students</Text>
            <Text style={styles.muted}>Default status is Present</Text>
          </View>
          {!assignedClasses.length ? <Text style={styles.muted}>No class has been assigned to this teacher.</Text> : null}
          {roster.map((student) => {
            const current = statuses[student.id] || 'Present';
            return (
              <View key={student.id} style={styles.attendanceStudentRow}>
                <View style={styles.infoMain}>
                  <Text style={styles.infoTitle}>{student.name}</Text>
                    <Text style={styles.infoSubtitle}>Roll {student.rollNo} - Current {student.attendancePercent}%</Text>
                </View>
                <View style={styles.statusPills}>
                  {(['Present', 'Absent', 'Late'] as AttendanceStatus[]).map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.statusPill,
                        current === status && styles.statusPillActive,
                        current === status && status === 'Present' && styles.statusPresent,
                        current === status && status === 'Absent' && styles.statusAbsent,
                        current === status && status === 'Late' && styles.statusLate,
                      ]}
                      onPress={() => !alreadySubmitted && setStatus(student.id, status)}
                    >
                      <Text style={[styles.statusPillText, current === status && styles.statusPillTextActive]}>{status[0]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
          <View style={styles.sheetActions}>
            {alreadySubmitted ? (
              <Pressable style={styles.applyButton} onPress={onClose}><Text style={styles.applyText}>Close</Text></Pressable>
            ) : (
              <>
                <Pressable style={styles.ghostButton} onPress={() => setStatuses({})}><Text style={styles.ghostText}>Reset</Text></Pressable>
                <Pressable style={styles.applyButton} onPress={submit}><Text style={styles.applyText}>Submit</Text></Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function MarksScreen({ user, students }: { user: User; students: Student[] }) {
  const [markData, setMarkData] = useState<MarkEntry[]>([]);
  const [klass, setKlass] = useState('');
  const [section, setSection] = useState('');
  const [scoreRange, setScoreRange] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [markSheetOpen, setMarkSheetOpen] = useState(false);
  const [markExam, setMarkExam] = useState('Unit Test 1');
  const [markSubject, setMarkSubject] = useState('Mathematics');
  const [markClass, setMarkClass] = useState('9');
  const [markSection, setMarkSection] = useState('A');
  const [markScores, setMarkScores] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    async function loadMarks() {
      const { data, error } = await getMarks();
      if (!active) return;
      if (error) {
        Alert.alert('Supabase error', error.message || 'Unable to load marks.');
        return;
      }
      setMarkData(data);
    }
    loadMarks();
    return () => { active = false; };
  }, []);
  const isParent = user.role === 'parent';
  const canManageMarks = user.role === 'admin' || user.role === 'teacher';
  const currentTeacher = user.role === 'teacher' ? teachers.find((teacher) => teacher.email === user.email || teacher.name === user.name) : null;
  const assignedClasses = currentTeacher ? parseAssignedClasses(currentTeacher.classAssigned) : [];
  const markClassOptions = user.role === 'teacher' ? assignedClasses : classes.flatMap((klassValue) => sections.map((sectionValue) => ({ klass: klassValue, section: sectionValue, label: `${klassValue}${sectionValue}` })));
  const markClassValues = Array.from(new Set(markClassOptions.map((item) => item.klass)));
  const markSectionValues = Array.from(new Set(markClassOptions.filter((item) => item.klass === markClass).map((item) => item.section)));
  const markSubjectOptions = user.role === 'teacher' && currentTeacher?.subjects.length ? currentTeacher.subjects : subjects;
  const teacherClassMatch = (student: Student) => !assignedClasses.length || assignedClasses.some((item) => item.klass === student.class && item.section === student.section);
  const visibleStudents = isParent
    ? students.filter((student) => isStudentLinkedToParent(student, user))
    : user.role === 'teacher'
      ? students.filter(teacherClassMatch)
    : students;
  const examOptions = Array.from(new Set(markData.map((mark) => mark.exam)));
  const scoreAverage = (studentId: string) => {
    const rows = markData.filter((mark) => mark.studentId === studentId);
    const scored = rows.reduce((sum, row) => sum + row.scored, 0);
    const max = rows.reduce((sum, row) => sum + row.maxMarks, 0);
    return max ? Math.round((scored / max) * 100) : 0;
  };
  const filtered = visibleStudents.filter((student) => {
    const avg = scoreAverage(student.id);
    return (
      (!klass || student.class === klass) &&
      (!section || student.section === section) &&
      (!scoreRange || (scoreRange === 'Below 60%' ? avg < 60 : scoreRange === '60% - 80%' ? avg >= 60 && avg < 80 : avg >= 80))
    );
  });
  const parentStudentIds = filtered.map((student) => student.id);
  const parentMarks = markData.filter((mark) => parentStudentIds.includes(mark.studentId) && (!examFilter || mark.exam === examFilter));
  const parentExamNames = examFilter ? [examFilter] : examOptions;
  const progressStudent = isParent ? visibleStudents[0] : null;
  const progressRows = progressStudent ? markData.filter((mark) => mark.studentId === progressStudent.id) : [];
  const progressExamRows = examOptions.map((exam) => {
    const rows = progressRows.filter((mark) => mark.exam === exam);
    const total = rows.reduce((sum, mark) => sum + mark.scored, 0);
    const max = rows.reduce((sum, mark) => sum + mark.maxMarks, 0);
    return { exam, total, max, percent: max ? Math.round((total / max) * 100) : 0 };
  });
  const progressSubjects = Array.from(new Set(progressRows.map((mark) => mark.subject))).map((subject) => {
    const rows = progressRows.filter((mark) => mark.subject === subject);
    const total = rows.reduce((sum, mark) => sum + mark.scored, 0);
    const max = rows.reduce((sum, mark) => sum + mark.maxMarks, 0);
    return { subject, percent: max ? Math.round((total / max) * 100) : 0, total, max };
  });
  const progressMarkRows = progressRows.map((mark) => ({
    exam: mark.exam,
    subject: mark.subject,
    scored: mark.scored,
    maxMarks: mark.maxMarks,
    percent: Math.round((mark.scored / mark.maxMarks) * 100),
    grade: mark.grade || gradeForPercent(Math.round((mark.scored / mark.maxMarks) * 100)),
  }));
  const progressTotal = progressExamRows.reduce((sum, row) => sum + row.total, 0);
  const progressMax = progressExamRows.reduce((sum, row) => sum + row.max, 0);
  const progressPercent = progressMax ? Math.round((progressTotal / progressMax) * 100) : 0;
  const markRoster = students.filter((student) => student.class === markClass && student.section === markSection && (user.role !== 'teacher' || teacherClassMatch(student)));
  const markMaxMarks = markExam.includes('Unit') ? 25 : 100;
  const loadMarkScores = (klassValue = markClass, sectionValue = markSection, examValue = markExam, subjectValue = markSubject) => {
    const roster = students.filter((student) => student.class === klassValue && student.section === sectionValue && (user.role !== 'teacher' || teacherClassMatch(student)));
    const next: Record<string, string> = {};
    roster.forEach((student) => {
      const existing = markData.find((mark) => mark.studentId === student.id && mark.exam === examValue && mark.subject === subjectValue);
      next[student.id] = existing ? String(existing.scored) : '';
    });
    setMarkScores(next);
  };
  useEffect(() => {
    if (!canManageMarks) return;
    const firstClass = markClassOptions[0];
    const nextClass = markClassOptions.some((item) => item.klass === markClass && item.section === markSection) ? markClass : firstClass?.klass || markClass;
    const nextSection = markClassOptions.some((item) => item.klass === markClass && item.section === markSection) ? markSection : firstClass?.section || markSection;
    const nextSubject = markSubjectOptions.includes(markSubject) ? markSubject : markSubjectOptions[0] || markSubject;
    if (nextClass !== markClass) setMarkClass(nextClass);
    if (nextSection !== markSection) setMarkSection(nextSection);
    if (nextSubject !== markSubject) setMarkSubject(nextSubject);
  }, [canManageMarks, markClassOptions.map((item) => item.label).join('|'), markSubjectOptions.join('|'), markClass, markSection, markSubject]);
  useEffect(() => {
    if (!canManageMarks) return;
    loadMarkScores(markClass, markSection, markExam, markSubject);
  }, [canManageMarks, markClass, markSection, markExam, markSubject, markData]);
  const openMarkSheet = () => {
    const firstAssigned = user.role === 'teacher' ? assignedClasses[0] : null;
    const nextClass = firstAssigned?.klass || markClass;
    const nextSection = firstAssigned?.section || markSection;
    setMarkClass(nextClass);
    setMarkSection(nextSection);
    loadMarkScores(nextClass, nextSection, markExam, markSubject);
    setMarkSheetOpen(true);
  };
  const saveMarks = async () => {
    const updatedRows: MarkEntry[] = markRoster.map((student) => {
      const scored = Math.max(0, Math.min(markMaxMarks, Number(markScores[student.id]) || 0));
      const percent = Math.round((scored / markMaxMarks) * 100);
      return { studentId: student.id, exam: markExam, subject: markSubject, maxMarks: markMaxMarks, scored, grade: gradeForPercent(percent) };
    });
    const { data, error } = await persistMarks(updatedRows);
    if (error) {
      Alert.alert('Supabase error', error.message || 'Unable to save marks.');
      return;
    }
    setMarkData((prev) => {
      const changed = new Set(data.map((mark) => `${mark.studentId}-${mark.exam}-${mark.subject}`));
      return [...prev.filter((mark) => !changed.has(`${mark.studentId}-${mark.exam}-${mark.subject}`)), ...data];
    });
    setMarkSheetOpen(false);
    Alert.alert('Marks updated', `${markSubject} marks saved for Class ${markClass}${markSection}.`);
  };
  const generateProgressPdf = async () => {
    if (!progressStudent) {
      Alert.alert('No child linked', 'No linked child was found for this parent account.');
      return;
    }
    try {
      const html = buildProgressCardHtml(progressStudent, progressExamRows, progressSubjects, progressMarkRows, { total: progressTotal, max: progressMax, percent: progressPercent });
      const file = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${progressStudent.name} Progress Card`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Progress card created', file.uri);
      }
    } catch {
      Alert.alert('PDF failed', 'Unable to generate the progress card PDF right now.');
    }
  };

  if (isParent) {
    return (
      <View style={styles.stack}>
        <FilterHeader title={`${filtered.length} child mark record`} activeCount={[examFilter, scoreRange].filter(Boolean).length} onOpen={() => setFilterOpen(true)} />
        <ActiveFilterChips filters={[
          examFilter && { label: examFilter, onClear: () => setExamFilter('') },
          scoreRange && { label: scoreRange, onClear: () => setScoreRange('') },
        ]} />
        {progressStudent ? (
          <Pressable style={styles.fullWidthButton} onPress={generateProgressPdf}>
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.primaryText}>Generate Progress Card</Text>
          </Pressable>
        ) : null}
        {filtered.map((student) => (
          <View key={student.id} style={styles.stack}>
            <Card title={student.name}>
              <InfoRow title="Average Score" subtitle={`Class ${student.class}${student.section}`} right={`${scoreAverage(student.id)}%`} />
            </Card>
            {parentExamNames.map((exam) => {
              const rows = parentMarks.filter((mark) => mark.studentId === student.id && mark.exam === exam);
              const total = rows.reduce((sum, mark) => sum + mark.scored, 0);
              const max = rows.reduce((sum, mark) => sum + mark.maxMarks, 0);
              const percent = max ? Math.round((total / max) * 100) : 0;
              return (
                <Card key={`${student.id}-${exam}`} title={exam}>
                  {rows.length ? rows.map((mark) => (
                    <InfoRow
                      key={`${mark.exam}-${mark.subject}`}
                      title={mark.subject}
                      subtitle={`${Math.round((mark.scored / mark.maxMarks) * 100)}%${mark.grade ? ` - Grade ${mark.grade}` : ''}`}
                      right={`${mark.scored}/${mark.maxMarks}`}
                    />
                  )) : <Text style={styles.muted}>No marks recorded for this exam.</Text>}
                  {rows.length ? <InfoRow title="Total" subtitle={`${percent}% overall`} right={`${total}/${max}`} /> : null}
                </Card>
              );
            })}
          </View>
        ))}
        {!filtered.length ? <Card title="No marks linked"><Text style={styles.muted}>No marks are linked to this parent account.</Text></Card> : null}
        <GenericFilterSheet
          visible={filterOpen}
          title="Filter marks"
          onClose={() => setFilterOpen(false)}
          onClear={() => { setExamFilter(''); setScoreRange(''); }}
          groups={[
            { label: 'Exam', value: examFilter, options: examOptions, onChange: setExamFilter, allLabel: 'All exams' },
            { label: 'Average Score', value: scoreRange, options: ['Below 60%', '60% - 80%', '80% and above'], onChange: setScoreRange, allLabel: 'All scores' },
          ]}
        />
        <Modal visible={progressOpen} transparent animationType="slide" onRequestClose={() => setProgressOpen(false)}>
          <Pressable style={styles.modalScrim} onPress={() => setProgressOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetGrip} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Progress Card</Text>
              <Pressable style={styles.iconButtonSmall} onPress={() => setProgressOpen(false)}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
            </View>
            {progressStudent ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
                <View style={styles.progressCardHero}>
                  <Avatar name={progressStudent.name} size={64} />
                  <Text style={styles.profileName}>{progressStudent.name}</Text>
                  <Text style={styles.profileMeta}>Class {progressStudent.class}{progressStudent.section} - Roll {progressStudent.rollNo}</Text>
                  <View style={styles.detailMetricGrid}>
                    <View style={styles.detailMetric}><Text style={styles.detailMetricValue}>{progressPercent}%</Text><Text style={styles.statLabel}>Overall</Text></View>
                    <View style={styles.detailMetric}><Text style={styles.detailMetricValue}>{progressTotal}/{progressMax}</Text><Text style={styles.statLabel}>Total Marks</Text></View>
                  </View>
                </View>
                <Card title="Exam Performance">
                  {progressExamRows.map((row) => (
                    <InfoRow key={row.exam} title={row.exam} subtitle={`${row.percent}% overall`} right={`${row.total}/${row.max}`} />
                  ))}
                </Card>
                <Card title="Subject Performance">
                  {progressSubjects.map((row) => (
                    <InfoRow key={row.subject} title={row.subject} subtitle={`${row.percent}% average`} right={`${row.total}/${row.max}`} />
                  ))}
                </Card>
              </ScrollView>
            ) : <Text style={styles.muted}>No linked child found for this parent account.</Text>}
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <FilterHeader title={`${filtered.length} mark records`} activeCount={[klass, section, scoreRange].filter(Boolean).length} onOpen={() => setFilterOpen(true)} />
      {canManageMarks ? (
        <Card title="Add / Update Marks">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.markFilterRow}>
            <View style={styles.markFilterBlock}>
              <Text style={styles.label}>Exam</Text>
              <View style={styles.markFilterChips}>
                {['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam'].map((item) => (
                  <Pressable key={item} style={[styles.markMiniChip, markExam === item && styles.chipActive]} onPress={() => setMarkExam(item)}>
                    <Text style={[styles.chipText, markExam === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.markFilterBlockSmall}>
              <Text style={styles.label}>Class</Text>
              <View style={styles.markFilterChips}>
                {markClassValues.map((item) => (
                  <Pressable key={item} style={[styles.markMiniChip, markClass === item && styles.chipActive]} onPress={() => {
                    const nextSection = markClassOptions.find((option) => option.klass === item)?.section || markSection;
                    setMarkClass(item);
                    setMarkSection(nextSection);
                  }}>
                    <Text style={[styles.chipText, markClass === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.markFilterBlockSmall}>
              <Text style={styles.label}>Section</Text>
              <View style={styles.markFilterChips}>
                {markSectionValues.map((item) => (
                  <Pressable key={item} style={[styles.markMiniChip, markSection === item && styles.chipActive]} onPress={() => setMarkSection(item)}>
                    <Text style={[styles.chipText, markSection === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.markFilterBlock}>
              <Text style={styles.label}>Subject</Text>
              <View style={styles.markFilterChips}>
                {markSubjectOptions.map((item) => (
                  <Pressable key={item} style={[styles.markMiniChip, markSubject === item && styles.chipActive]} onPress={() => setMarkSubject(item)}>
                    <Text style={[styles.chipText, markSubject === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.markEntryHeader}>
            <View>
              <Text style={styles.infoTitle}>Class {markClass}{markSection} - {markSubject}</Text>
              <Text style={styles.infoSubtitle}>{markExam} | Maximum marks: {markMaxMarks}</Text>
            </View>
            <Pressable style={styles.reportFilterButton} onPress={() => loadMarkScores()}>
              <Ionicons name="refresh-outline" size={17} color="#4f46e5" />
            </Pressable>
          </View>
          {markRoster.map((student) => {
            const score = Number(markScores[student.id]) || 0;
            const percent = Math.round((score / markMaxMarks) * 100);
            return (
              <View key={student.id} style={styles.markEntryRow}>
                <View style={styles.infoMain}>
                  <Text style={styles.infoTitle}>{student.name}</Text>
                  <Text style={styles.infoSubtitle}>Roll {student.rollNo} - {percent}%</Text>
                </View>
                <TextInput style={[styles.input, styles.markScoreInput]} value={markScores[student.id] || ''} keyboardType="numeric" placeholder="0" onChangeText={(value) => setMarkScores((prev) => ({ ...prev, [student.id]: value }))} />
              </View>
            );
          })}
          {!markRoster.length ? <Text style={styles.muted}>No students available for this class section.</Text> : null}
          <Pressable style={styles.fullWidthButton} onPress={saveMarks}>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.primaryText}>Save Marks</Text>
          </Pressable>
        </Card>
      ) : null}
      <ActiveFilterChips filters={[
        klass && { label: `Class ${klass}`, onClear: () => setKlass('') },
        section && { label: `Section ${section}`, onClear: () => setSection('') },
        scoreRange && { label: scoreRange, onClear: () => setScoreRange('') },
      ]} />
      {filtered.slice(0, 12).map((student) => <Card key={student.id} title={student.name}><InfoRow title="Average Score" subtitle={`Class ${student.class}${student.section}`} right={`${scoreAverage(student.id)}%`} /></Card>)}
      {!filtered.length && user.role === 'parent' ? <Card title="No marks linked"><Text style={styles.muted}>No marks are linked to this parent account.</Text></Card> : null}
      <GenericFilterSheet
        visible={filterOpen}
        title="Filter marks"
        onClose={() => setFilterOpen(false)}
        onClear={() => { setKlass(''); setSection(''); setScoreRange(''); }}
        groups={[
          { label: 'Class', value: klass, options: classes, onChange: setKlass, allLabel: 'All classes' },
          { label: 'Section', value: section, options: sections, onChange: setSection, allLabel: 'All sections' },
          { label: 'Average Score', value: scoreRange, options: ['Below 60%', '60% - 80%', '80% and above'], onChange: setScoreRange, allLabel: 'All scores' },
        ]}
      />
      <Modal visible={markSheetOpen} transparent animationType="slide" onRequestClose={() => setMarkSheetOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setMarkSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetGrip} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add / Update Marks</Text>
            <Pressable style={styles.iconButtonSmall} onPress={() => setMarkSheetOpen(false)}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            <ChoiceGroup label="Exam" value={markExam} options={['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam']} onChange={(value) => { const next = value || 'Unit Test 1'; setMarkExam(next); loadMarkScores(markClass, markSection, next, markSubject); }} allLabel="Unit Test 1" />
            <ChoiceGroup label="Subject" value={markSubject} options={subjects} onChange={(value) => { const next = value || 'Mathematics'; setMarkSubject(next); loadMarkScores(markClass, markSection, markExam, next); }} allLabel="Mathematics" />
            <Text style={styles.label}>Class section</Text>
            <View style={styles.chipRow}>
              {(user.role === 'teacher' ? assignedClasses : classes.flatMap((klassValue) => sections.map((sectionValue) => ({ klass: klassValue, section: sectionValue, label: `${klassValue}${sectionValue}` })))).map((item) => (
                <Pressable key={item.label} style={[styles.chip, markClass === item.klass && markSection === item.section && styles.chipActive]} onPress={() => { setMarkClass(item.klass); setMarkSection(item.section); loadMarkScores(item.klass, item.section, markExam, markSubject); }}>
                  <Text style={[styles.chipText, markClass === item.klass && markSection === item.section && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.muted}>Maximum marks: {markMaxMarks}</Text>
            {markRoster.map((student) => (
              <View key={student.id} style={styles.attendanceStudentRow}>
                <View style={styles.infoMain}>
                  <Text style={styles.infoTitle}>{student.name}</Text>
                  <Text style={styles.infoSubtitle}>Roll {student.rollNo} - Class {student.class}{student.section}</Text>
                </View>
                <TextInput style={[styles.input, { width: 86, textAlign: 'center' }]} value={markScores[student.id] || ''} keyboardType="numeric" placeholder="0" onChangeText={(value) => setMarkScores((prev) => ({ ...prev, [student.id]: value }))} />
              </View>
            ))}
            {!markRoster.length ? <Text style={styles.muted}>No students available for this class section.</Text> : null}
            <View style={styles.sheetActions}>
              <Pressable style={styles.ghostButton} onPress={() => loadMarkScores()}><Text style={styles.ghostText}>Reset</Text></Pressable>
              <Pressable style={styles.applyButton} onPress={saveMarks}><Text style={styles.applyText}>Save Marks</Text></Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function ExamsScreen({ user, students }: { user: User; students: Student[] }) {
  const [examData, setExamData] = useState<ExamSchedule[]>([]);
  const [klass, setKlass] = useState('');
  const [section, setSection] = useState('');
  const [examName, setExamName] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [examSheetOpen, setExamSheetOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({ name: 'Unit Test 1', subject: 'Mathematics', class: '9', section: 'A', date: '2025-04-01', time: '09:00 - 11:00' });
  useEffect(() => {
    let active = true;
    async function loadExams() {
      const { data, error } = await getExams();
      if (!active) return;
      if (error) {
        Alert.alert('Supabase error', error.message || 'Unable to load exams.');
        return;
      }
      setExamData(data);
    }
    loadExams();
    return () => { active = false; };
  }, []);
  const examNames = Array.from(new Set(examData.map((exam) => exam.name)));
  const isParent = user.role === 'parent';
  const canManageExams = user.role === 'admin' || user.role === 'teacher';
  const currentTeacher = user.role === 'teacher' ? teachers.find((teacher) => teacher.email === user.email || teacher.name === user.name) : null;
  const assignedClasses = currentTeacher ? parseAssignedClasses(currentTeacher.classAssigned) : [];
  const teacherExamClassOptions = user.role === 'teacher' ? assignedClasses : classes.flatMap((klassValue) => sections.map((sectionValue) => ({ klass: klassValue, section: sectionValue, label: `${klassValue}${sectionValue}` })));
  const linkedChildren = isParent ? students.filter((student) => isStudentLinkedToParent(student, user)) : [];
  const visibleExams = isParent
    ? examData.filter((exam) => linkedChildren.some((student) => exam.class === student.class && (!exam.section || exam.section === student.section)))
    : user.role === 'teacher'
      ? examData.filter((exam) => !assignedClasses.length || assignedClasses.some((item) => exam.class === item.klass && (!exam.section || exam.section === item.section)))
      : examData;
  const filtered = visibleExams.filter((exam) => (
    (!klass || exam.class === klass) &&
    (!section || exam.section === section) &&
    (!examName || exam.name === examName)
  )).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const examGroups = filtered.reduce<Array<{ date: string; exams: ExamSchedule[] }>>((groups, exam) => {
    const existing = groups.find((group) => group.date === exam.date);
    if (existing) existing.exams.push(exam);
    else groups.push({ date: exam.date, exams: [exam] });
    return groups;
  }, []);
  const openExamSheet = (exam?: ExamSchedule) => {
    const firstClass = teacherExamClassOptions[0] || { klass: '9', section: 'A', label: '9A' };
    setEditingExamId(exam?.id || null);
    setExamForm({
      name: exam?.name || 'Unit Test 1',
      subject: exam?.subject || subjects[0],
      class: exam?.class || firstClass.klass,
      section: exam?.section || firstClass.section,
      date: exam?.date || new Date().toISOString().slice(0, 10),
      time: exam?.time || '09:00 - 11:00',
    });
    setExamSheetOpen(true);
  };
  const saveExam = async () => {
    if (!examForm.subject || !examForm.date || !examForm.time.trim()) {
      Alert.alert('Missing details', 'Please select subject, date, and time for this exam.');
      return;
    }
    const nextExam: ExamSchedule = {
      id: editingExamId || `e${Date.now()}`,
      name: examForm.name.trim() || 'Untitled Exam',
      subject: examForm.subject,
      class: examForm.class,
      section: examForm.section,
      date: examForm.date || new Date().toISOString().slice(0, 10),
      time: examForm.time.trim(),
    };
    const { data, error } = await persistExam(nextExam);
    if (error || !data) {
      Alert.alert('Supabase error', error?.message || 'Unable to save exam.');
      return;
    }
    setExamData((prev) => editingExamId ? prev.map((exam) => exam.id === data.id ? data : exam) : [data, ...prev]);
    setExamSheetOpen(false);
    Alert.alert(editingExamId ? 'Exam updated' : 'Exam added', `${nextExam.name} saved for Class ${nextExam.class}${nextExam.section || ''}.`);
  };

  return (
    <View style={styles.stack}>
      <FilterHeader title={isParent ? `${filtered.length} child exams` : `${filtered.length} exams`} activeCount={(isParent ? [examName] : [klass, section, examName]).filter(Boolean).length} onOpen={() => setFilterOpen(true)} />
      {canManageExams ? (
        <Pressable style={styles.fullWidthButton} onPress={() => openExamSheet()}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.primaryText}>Add Upcoming Exam</Text>
        </Pressable>
      ) : null}
      <ActiveFilterChips filters={[
        !isParent && klass && { label: `Class ${klass}`, onClear: () => setKlass('') },
        !isParent && section && { label: `Section ${section}`, onClear: () => setSection('') },
        examName && { label: examName, onClear: () => setExamName('') },
      ]} />
      <View style={styles.examTimeline}>
        {examGroups.map((group) => (
          <View key={group.date} style={styles.examDayGroup}>
            <View style={styles.examDatePill}>
              <Text style={styles.examDateDay}>{new Date(group.date).toLocaleDateString('en-IN', { day: '2-digit' })}</Text>
              <Text style={styles.examDateMonth}>{new Date(group.date).toLocaleDateString('en-IN', { month: 'short' })}</Text>
            </View>
            <View style={styles.examDayContent}>
              <Text style={styles.examDayTitle}>{new Date(group.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric' })}</Text>
              {group.exams.map((exam) => (
                <View key={exam.id} style={styles.examPeriodCard}>
                  <View style={styles.periodLine}>
                    <View style={styles.periodDot} />
                    <View style={styles.periodConnector} />
                  </View>
                  <View style={styles.periodContent}>
                    <View style={styles.periodTopRow}>
                      <Text style={styles.periodSubject}>{exam.name}</Text>
                      <Text style={styles.periodTime}>Class {exam.class}{exam.section || ''}</Text>
                    </View>
                    <Text style={styles.periodTeacher}>{exam.subject ? `${exam.subject} paper` : 'Subject-wise exam schedule'}</Text>
                    <View style={styles.examSubjectList}>
                      {subjectExamSchedule(exam).map((item) => (
                        <View key={`${exam.id}-${item.subject}`} style={styles.examSubjectRow}>
                          <View style={styles.examSubjectDot} />
                          <View style={styles.examSubjectMain}>
                            <Text style={styles.examSubjectName}>{item.subject}</Text>
                            <Text style={styles.examSubjectDate}>{item.date}</Text>
                          </View>
                          <Text style={styles.examSubjectTime}>{item.time}</Text>
                        </View>
                      ))}
                    </View>
                    {canManageExams ? (
                      <Pressable style={styles.periodEditButton} onPress={() => openExamSheet(exam)}>
                        <Ionicons name="create-outline" size={17} color="#4f46e5" />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      {!filtered.length && isParent ? <Card title="No exams scheduled"><Text style={styles.muted}>No upcoming exams are linked to this parent account.</Text></Card> : null}
      <GenericFilterSheet
        visible={filterOpen}
        title="Filter exams"
        onClose={() => setFilterOpen(false)}
        onClear={() => { setKlass(''); setSection(''); setExamName(''); }}
        groups={[
          ...(!isParent ? [
          { label: 'Class', value: klass, options: classes, onChange: setKlass, allLabel: 'All classes' },
          { label: 'Section', value: section, options: sections, onChange: setSection, allLabel: 'All sections' },
          ] : []),
          { label: 'Exam', value: examName, options: examNames, onChange: setExamName, allLabel: 'All exams' },
        ]}
      />
      <Modal visible={examSheetOpen} transparent animationType="slide" onRequestClose={() => setExamSheetOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setExamSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetGrip} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{editingExamId ? 'Update exam' : 'Add exam'}</Text>
            <Pressable style={styles.iconButtonSmall} onPress={() => setExamSheetOpen(false)}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            <ChoiceGroup label="Exam" value={examForm.name} options={['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam', 'Practical Assessment']} onChange={(value) => setExamForm((prev) => ({ ...prev, name: value || 'Unit Test 1' }))} allLabel="Unit Test 1" />
            <ChoiceGroup label="Subject" value={examForm.subject} options={subjects} onChange={(value) => setExamForm((prev) => ({ ...prev, subject: value || subjects[0] }))} allLabel={subjects[0]} />
            <Text style={styles.label}>Class section</Text>
            <View style={styles.chipRow}>
              {teacherExamClassOptions.map((item) => (
                <Pressable key={item.label} style={[styles.chip, examForm.class === item.klass && examForm.section === item.section && styles.chipActive]} onPress={() => setExamForm((prev) => ({ ...prev, class: item.klass, section: item.section }))}>
                  <Text style={[styles.chipText, examForm.class === item.klass && examForm.section === item.section && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Date</Text>
            <Pressable style={styles.datePickerField} onPress={() => setDatePickerOpen(true)}>
              <Ionicons name="calendar-outline" size={18} color="#4f46e5" />
              <View style={styles.datePickerTextWrap}>
                <Text style={styles.datePickerValue}>{readableDate(examForm.date)}</Text>
                <Text style={styles.datePickerHint}>{examForm.date}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#94a3b8" />
            </Pressable>
            <Text style={styles.label}>Time</Text>
            <TextInput style={styles.input} value={examForm.time} onChangeText={(time) => setExamForm((prev) => ({ ...prev, time }))} placeholder="09:00 - 11:00" />
            <View style={styles.sheetActions}>
              <Pressable style={styles.ghostButton} onPress={() => setExamSheetOpen(false)}><Text style={styles.ghostText}>Cancel</Text></Pressable>
              <Pressable style={styles.applyButton} onPress={saveExam}><Text style={styles.applyText}>Save Exam</Text></Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
      <ExamDatePicker
        visible={datePickerOpen}
        value={examForm.date}
        onClose={() => setDatePickerOpen(false)}
        onSelect={(date) => {
          setExamForm((prev) => ({ ...prev, date }));
          setDatePickerOpen(false);
        }}
      />
    </View>
  );
}

function ExamDatePicker({
  visible,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (date: string) => void;
}) {
  const initial = new Date(value);
  const [viewDate, setViewDate] = useState(Number.isNaN(initial.getTime()) ? new Date() : initial);
  useEffect(() => {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) setViewDate(parsed);
  }, [value, visible]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const selectedIso = value;
  const moveMonth = (offset: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalScrim} onPress={onClose} />
      <View style={styles.calendarSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select exam date</Text>
          <Pressable style={styles.iconButtonSmall} onPress={onClose}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
        </View>
        <View style={styles.calendarNav}>
          <Pressable style={styles.calendarNavButton} onPress={() => moveMonth(-1)}><Ionicons name="chevron-back-outline" size={20} color="#4f46e5" /></Pressable>
          <Text style={styles.calendarMonth}>{viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
          <Pressable style={styles.calendarNavButton} onPress={() => moveMonth(1)}><Ionicons name="chevron-forward-outline" size={20} color="#4f46e5" /></Pressable>
        </View>
        <View style={styles.calendarWeekRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.calendarWeekText}>{day}</Text>)}
        </View>
        <View style={styles.calendarGrid}>
          {calendarCells.map((day, index) => {
            if (!day) return <View key={`blank-${index}`} style={styles.examCalendarDayBlank} />;
            const nextDate = new Date(year, month, day);
            const iso = formatIsoDate(nextDate);
            const selected = iso === selectedIso;
            return (
              <Pressable key={iso} style={[styles.examCalendarDay, selected && styles.examCalendarDayActive]} onPress={() => onSelect(iso)}>
                <Text style={[styles.examCalendarDayText, selected && styles.examCalendarDayTextActive]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function TimetableScreen({
  user,
  timetableData,
  setTimetableData,
}: {
  user: User;
  timetableData: Record<string, DayTimetable[]>;
  setTimetableData: React.Dispatch<React.SetStateAction<Record<string, DayTimetable[]>>>;
}) {
  const [klass, setKlass] = useState('9');
  const [section, setSection] = useState('A');
  const [day, setDay] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<{ day: string; period: TimetableEntry } | null>(null);
  const timetableKey = `${klass}${section}`;
  const schedule = timetableData[timetableKey] || timetableData['9A'];
  const selectedDay = day || schedule[0]?.day || 'Monday';
  const selectedSchedule = schedule.find((item) => item.day === selectedDay) || schedule[0];
  const studyPeriods = selectedSchedule?.periods.filter((period) => !period.isBreak).length || 0;
  const breakPeriods = selectedSchedule?.periods.filter((period) => period.isBreak).length || 0;
  const canEdit = user.role === 'admin' || user.role === 'teacher';
  const updatePeriod = async (nextPeriod: TimetableEntry) => {
    const editDay = editingPeriod?.day || selectedDay;
    const baseSchedule = timetableData[timetableKey] || timetableData['9A'];
    const nextData = {
      ...timetableData,
      [timetableKey]: baseSchedule.map((item) => (
        item.day === editDay
          ? { ...item, periods: item.periods.map((period) => period.period === nextPeriod.period ? nextPeriod : period) }
          : item
      )),
    };
    const { error } = await saveTimetable(nextData);
    if (error) {
      Alert.alert('Supabase error', error.message || 'Unable to save timetable.');
      return;
    }
    setTimetableData(nextData);
    setEditingPeriod(null);
  };

  return (
    <View style={styles.stack}>
      <FilterHeader title={`Class ${klass}${section} timetable`} activeCount={[klass !== '9' ? klass : '', section !== 'A' ? section : ''].filter(Boolean).length} onOpen={() => setFilterOpen(true)} />
      <ActiveFilterChips filters={[
        klass !== '9' && { label: `Class ${klass}`, onClear: () => setKlass('9') },
        section !== 'A' && { label: `Section ${section}`, onClear: () => setSection('A') },
      ]} />
      <View style={styles.timetableHero}>
        <View style={styles.timetableHeroIcon}><Ionicons name="calendar-outline" size={24} color="#4f46e5" /></View>
        <View style={styles.infoMain}>
          <Text style={styles.timetableHeroTitle}>Class {klass}{section}</Text>
          <Text style={styles.timetableHeroMeta}>{selectedDay} - {studyPeriods} classes, {breakPeriods} breaks</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
        {schedule.map((item) => {
          const active = item.day === selectedDay;
          return (
            <Pressable key={item.day} style={[styles.dayTab, active && styles.dayTabActive]} onPress={() => setDay(item.day)}>
              <Text style={[styles.dayTabShort, active && styles.dayTabTextActive]}>{item.day.slice(0, 3)}</Text>
              <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>{item.day}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.timetableSectionHeader}>
        <Text style={styles.sectionTitle}>{selectedDay} Schedule</Text>
        <Text style={styles.muted}>{selectedSchedule?.periods.length || 0} periods</Text>
      </View>
      {selectedSchedule?.periods.map((period) => (
        <View key={`${selectedDay}-${period.period}`} style={[styles.periodCard, period.isBreak && styles.periodBreakCard]}>
          <View style={[styles.periodNumber, period.isBreak && styles.periodBreakNumber]}>
            <Text style={[styles.periodNumberText, period.isBreak && styles.periodBreakText]}>{period.period}</Text>
          </View>
          <View style={styles.periodLine}>
            <View style={[styles.periodDot, period.isBreak && styles.periodBreakDot]} />
            <View style={styles.periodConnector} />
          </View>
          <View style={styles.periodContent}>
            <View style={styles.periodTopRow}>
              <Text style={[styles.periodSubject, period.isBreak && styles.periodBreakSubject]}>{period.subject}</Text>
              <Text style={styles.periodTime}>{period.time}</Text>
            </View>
            <View style={styles.periodMetaRow}>
              <Ionicons name={period.isBreak ? 'cafe-outline' : 'person-outline'} size={15} color={period.isBreak ? '#d97706' : '#6b7280'} />
              <Text style={[styles.periodTeacher, period.isBreak && styles.periodBreakTeacher]}>{period.teacher || 'Break time'}</Text>
            </View>
          </View>
          {canEdit ? (
            <Pressable style={styles.periodEditButton} onPress={() => setEditingPeriod({ day: selectedDay, period })}>
              <Ionicons name="create-outline" size={17} color="#4f46e5" />
            </Pressable>
          ) : null}
        </View>
      ))}
      <GenericFilterSheet
        visible={filterOpen}
        title="Filter timetable"
        onClose={() => setFilterOpen(false)}
        onClear={() => { setKlass('9'); setSection('A'); setDay(''); }}
        groups={[
          { label: 'Class', value: klass, options: classes, onChange: setKlass, allLabel: 'Default class' },
          { label: 'Section', value: section, options: sections, onChange: setSection, allLabel: 'Default section' },
        ]}
      />
      <TimetableEditSheet
        visible={!!editingPeriod}
        period={editingPeriod?.period || null}
        day={editingPeriod?.day || selectedDay}
        classLabel={`Class ${klass}${section}`}
        onClose={() => setEditingPeriod(null)}
        onSave={updatePeriod}
      />
    </View>
  );
}

function TimetableEditSheet({
  visible,
  period,
  day,
  classLabel,
  onClose,
  onSave,
}: {
  visible: boolean;
  period: TimetableEntry | null;
  day: string;
  classLabel: string;
  onClose: () => void;
  onSave: (period: TimetableEntry) => void;
}) {
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [time, setTime] = useState('');
  const [isBreak, setIsBreak] = useState('No');
  const teacherNames = teachers.map((item) => item.name);

  useEffect(() => {
    setSubject(period?.subject || '');
    setTeacher(period?.teacher || '');
    setTime(period?.time || '');
    setIsBreak(period?.isBreak ? 'Yes' : 'No');
  }, [period]);

  const save = () => {
    if (!period || !subject.trim() || !time.trim()) {
      Alert.alert('Missing details', 'Please enter subject and time.');
      return;
    }
    const breakPeriod = isBreak === 'Yes';
    onSave({
      ...period,
      subject: subject.trim(),
      teacher: breakPeriod ? '' : teacher.trim(),
      time: time.trim(),
      isBreak: breakPeriod,
    });
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalScrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetGrip} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Update timetable</Text>
          <Pressable style={styles.iconButtonSmall} onPress={onClose}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          <Text style={styles.muted}>{classLabel} - {day} - Period {period?.period}</Text>
          <ChoiceGroup label="Break Period" value={isBreak} options={['Yes', 'No']} onChange={(value) => setIsBreak(value || 'No')} allLabel="No" />
          <Text style={styles.label}>Subject</Text>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Subject or break name" />
          <View style={styles.chipRow}>
            {subjects.slice(0, 8).map((item) => (
              <Pressable key={item} style={[styles.chip, subject === item && styles.chipActive]} onPress={() => setSubject(item)}>
                <Text style={[styles.chipText, subject === item && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          {isBreak === 'No' ? (
            <>
              <Text style={styles.label}>Teacher</Text>
              <TextInput style={styles.input} value={teacher} onChangeText={setTeacher} placeholder="Teacher name" />
              <View style={styles.chipRow}>
                {teacherNames.slice(0, 8).map((item) => (
                  <Pressable key={item} style={[styles.chip, teacher === item && styles.chipActive]} onPress={() => setTeacher(item)}>
                    <Text style={[styles.chipText, teacher === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          <Text style={styles.label}>Time</Text>
          <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="8:00 - 8:45" />
          <View style={styles.sheetActions}>
            <Pressable style={styles.ghostButton} onPress={onClose}><Text style={styles.ghostText}>Cancel</Text></Pressable>
            <Pressable style={styles.applyButton} onPress={save}><Text style={styles.applyText}>Save</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function FeesScreen({ user, students }: { user: User; students: Student[] }) {
  const canRecord = user.role === 'admin' || user.role === 'accountant';
  const [feesData, setFeesData] = useState<Fee[]>([]);
  const [query, setQuery] = useState('');
  const [klass, setKlass] = useState('');
  const [status, setStatus] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payRemarks, setPayRemarks] = useState('');
  const [fullPay, setFullPay] = useState(false);
  useEffect(() => {
    let active = true;
    async function loadFees() {
      const { data, error } = await getFees();
      if (!active) return;
      if (error) {
        Alert.alert('Supabase error', error.message || 'Unable to load fees.');
        return;
      }
      setFeesData(data);
    }
    loadFees();
    return () => { active = false; };
  }, []);
  const linkedStudentIds = user.role === 'parent'
    ? students.filter((student) => isStudentLinkedToParent(student, user)).map((student) => student.id)
    : null;
  const defaultFeeStructure = useMemo(() => [
    { item: 'Tuition Fee', amount: 25000 },
    { item: 'Transport Fee', amount: 8000 },
    { item: 'Library Fee', amount: 2000 },
    { item: 'Lab Fee', amount: 3000 },
    { item: 'Activity Fee', amount: 2000 },
  ], []);
  const createDefaultFee = (student: Student): Fee => ({
    studentId: student.id,
    feeStructure: defaultFeeStructure,
    totalAmount: 40000,
    amountPaid: student.feeStatus === 'Paid' ? 40000 : student.feeStatus === 'Partially Paid' ? 25000 : 0,
    balance: student.feeStatus === 'Paid' ? 0 : student.feeStatus === 'Partially Paid' ? 15000 : 40000,
    dueDate: '2026-03-31',
    status: student.feeStatus,
    paymentHistory: [],
  });
  const visibleStudents = linkedStudentIds
    ? students.filter((student) => linkedStudentIds.includes(student.id))
    : students;
  const feeByStudentId = new Map(feesData.map((fee) => [fee.studentId, fee]));
  const visibleFeesData = visibleStudents.map((student) => feeByStudentId.get(student.id) || createDefaultFee(student));
  const totalCollected = visibleFeesData.reduce((sum, fee) => sum + fee.amountPaid, 0);
  const totalPending = visibleFeesData.reduce((sum, fee) => sum + fee.balance, 0);
  const overdueCount = visibleFeesData.filter((fee) => fee.status === 'Overdue').length;
  const paymentCount = visibleFeesData.reduce((sum, fee) => sum + fee.paymentHistory.length, 0);
  const filtered = visibleFeesData.filter((fee) => {
    const student = students.find((item) => item.id === fee.studentId);
    return (
      (!query || student?.name.toLowerCase().includes(query.toLowerCase())) &&
      (!klass || student?.class === klass) &&
      (!status || fee.status === status)
    );
  });
  const currentFee = paymentTarget ? visibleFeesData.find((fee) => fee.studentId === paymentTarget) : null;
  const currentStudent = paymentTarget ? students.find((student) => student.id === paymentTarget) : null;
  const historyFee = historyTarget ? visibleFeesData.find((fee) => fee.studentId === historyTarget) : null;
  const historyStudent = historyTarget ? students.find((student) => student.id === historyTarget) : null;
  const openPayment = (studentId: string) => {
    setPaymentTarget(studentId);
    setPayAmount('');
    setPayMode('Cash');
    setPayRemarks('');
    setFullPay(false);
  };
  const recordPayment = async () => {
    if (!currentFee || !paymentTarget) return;
    const amount = fullPay ? currentFee.balance : Number(payAmount);
    if (!amount || amount <= 0 || amount > currentFee.balance) {
      Alert.alert('Invalid amount', 'Please enter a valid payment amount.');
      return;
    }
    const receipt: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount,
      mode: payMode,
      receiptNo: `RCP-2025-${Math.floor(Math.random() * 9000) + 1000}`,
      recordedBy: user.role,
      remarks: payRemarks,
    };
    const amountPaid = currentFee.amountPaid + amount;
    const nextBalance = Math.max(0, currentFee.balance - amount);
    const nextFee: Fee = {
      ...currentFee,
      amountPaid,
      balance: nextBalance,
      status: nextBalance <= 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Due',
      paymentHistory: [...currentFee.paymentHistory, receipt],
    };
    const { data, error } = await saveFee(nextFee);
    if (error || !data) {
      Alert.alert('Supabase error', error?.message || 'Unable to save payment.');
      return;
    }
    setFeesData((prev) => prev.some((fee) => fee.studentId === data.studentId)
      ? prev.map((fee) => fee.studentId === data.studentId ? data : fee)
      : [data, ...prev]);
    setPaymentTarget(null);
    Alert.alert('Payment Receipt', `Receipt No: ${receipt.receiptNo}\nAmount: ${currency(receipt.amount)}\nMode: ${receipt.mode}`);
  };

  return (
    <View style={styles.stack}>
      <DashboardHeader title="Fee Management" subtitle={user.role === 'parent' ? "Track your child's fee details" : 'Track and manage student fees'} />
      <MetricGrid metrics={[
        ['Total Collected', currency(totalCollected), 'trending-up'],
        ['Pending Amount', currency(totalPending), 'cash'],
        ['Overdue Count', String(overdueCount), 'alert-triangle'],
        user.role === 'parent' ? ['Payments', String(paymentCount), 'receipt'] : ['This Month', currency(580000), 'card-outline'],
      ]} />
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput style={styles.searchInput} placeholder="Search by student name" value={query} onChangeText={setQuery} />
        </View>
        <Pressable style={[styles.filterButton, (klass || status) && styles.filterButtonActive]} onPress={() => setFilterOpen(true)}>
          <Ionicons name="filter-outline" size={22} color={(klass || status) ? '#4f46e5' : '#4b5563'} />
        </Pressable>
      </View>
      <ActiveFilterChips filters={[
        klass && { label: `Class ${klass}`, onClear: () => setKlass('') },
        status && { label: status, onClear: () => setStatus('') },
      ]} />
      {filtered.map((fee) => {
        const student = students.find((item) => item.id === fee.studentId);
        const feeTone = fee.status === 'Paid' ? styles.badgeGood : fee.status === 'Overdue' ? styles.badgeBad : styles.badgeWarn;
        return (
          <View key={fee.studentId} style={styles.feeCard}>
            <View style={styles.feeStudentRow}>
              <Avatar name={student?.name || 'Student'} size={44} />
              <View style={styles.infoMain}>
                <Text style={styles.infoTitle}>{student?.name || 'Student'}</Text>
                <Text style={styles.infoSubtitle}>Class {student?.class}-{student?.section}</Text>
              </View>
              <View style={[styles.statusBadge, feeTone]}><Text style={styles.statusText}>{fee.status}</Text></View>
            </View>
            <View style={styles.feeAmountGrid}>
              <View style={styles.feeAmountTile}><Text style={styles.statLabel}>Total Fee</Text><Text style={styles.feeAmountText}>{currency(fee.totalAmount)}</Text></View>
              <View style={styles.feeAmountTile}><Text style={styles.statLabel}>Paid</Text><Text style={[styles.feeAmountText, { color: '#059669' }]}>{currency(fee.amountPaid)}</Text></View>
              <View style={styles.feeAmountTile}><Text style={styles.statLabel}>Balance</Text><Text style={[styles.feeAmountText, { color: fee.balance > 0 ? '#e11d48' : '#059669' }]}>{currency(fee.balance)}</Text></View>
            </View>
            <InfoRow title="Due Date" subtitle={fee.dueDate} right={`${fee.paymentHistory.length} payments`} />
            {canRecord ? (
              <View style={styles.feeActions}>
                {fee.balance > 0 ? <Pressable style={styles.feePayButton} onPress={() => openPayment(fee.studentId)}><Text style={styles.feePayText}>Pay</Text></Pressable> : null}
                <Pressable style={styles.feeHistoryButton} onPress={() => setHistoryTarget(fee.studentId)}><Ionicons name="eye-outline" size={16} color="#4f46e5" /><Text style={styles.exportText}>History</Text></Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
      {!filtered.length && user.role === 'parent' ? <Card title="No fee record linked"><Text style={styles.muted}>No fee details are linked to this parent account.</Text></Card> : null}
      <GenericFilterSheet
        visible={filterOpen}
        title="Filter fees"
        onClose={() => setFilterOpen(false)}
        onClear={() => { setKlass(''); setStatus(''); }}
        groups={[
          { label: 'Class', value: klass, options: classes, onChange: setKlass, allLabel: 'All classes' },
          { label: 'Fee Status', value: status, options: ['Paid', 'Partially Paid', 'Due', 'Overdue'], onChange: setStatus, allLabel: 'All statuses' },
        ]}
      />
      <Modal visible={!!paymentTarget} transparent animationType="slide" onRequestClose={() => setPaymentTarget(null)}>
        <Pressable style={styles.modalScrim} onPress={() => setPaymentTarget(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetGrip} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Record Payment</Text>
            <Pressable style={styles.iconButtonSmall} onPress={() => setPaymentTarget(null)}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
          </View>
          {currentFee ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <Text style={styles.muted}>{currentStudent?.name} - Class {currentStudent?.class}-{currentStudent?.section}</Text>
              <View style={styles.feeAmountGrid}>
                <View style={styles.feeAmountTile}><Text style={styles.statLabel}>Total</Text><Text style={styles.feeAmountText}>{currency(currentFee.totalAmount)}</Text></View>
                <View style={styles.feeAmountTile}><Text style={styles.statLabel}>Paid</Text><Text style={[styles.feeAmountText, { color: '#059669' }]}>{currency(currentFee.amountPaid)}</Text></View>
                <View style={styles.feeAmountTile}><Text style={styles.statLabel}>Balance</Text><Text style={[styles.feeAmountText, { color: '#e11d48' }]}>{currency(currentFee.balance)}</Text></View>
              </View>
              <View style={styles.feeActions}>
                <Pressable style={[styles.feeToggleButton, fullPay && styles.feeToggleActive]} onPress={() => { setFullPay(true); setPayAmount(String(currentFee.balance)); }}><Text style={[styles.feeToggleText, fullPay && styles.feeToggleTextActive]}>Mark Fully Paid</Text></Pressable>
                <Pressable style={[styles.feeToggleButton, !fullPay && styles.feeToggleActive]} onPress={() => { setFullPay(false); setPayAmount(''); }}><Text style={[styles.feeToggleText, !fullPay && styles.feeToggleTextActive]}>Partial Payment</Text></Pressable>
              </View>
              {!fullPay ? (
                <>
                  <Text style={styles.label}>Amount</Text>
                  <TextInput style={styles.input} value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" placeholder="Enter amount" />
                </>
              ) : null}
              <ChoiceGroup label="Payment Mode" value={payMode} options={paymentModes} onChange={(value) => setPayMode(value || 'Cash')} allLabel="Cash" />
              <Text style={styles.label}>Remarks</Text>
              <TextInput style={[styles.input, styles.textArea]} value={payRemarks} onChangeText={setPayRemarks} multiline placeholder="Optional remarks" />
              <View style={styles.sheetActions}>
                <Pressable style={styles.ghostButton} onPress={() => setPaymentTarget(null)}><Text style={styles.ghostText}>Cancel</Text></Pressable>
                <Pressable style={styles.applyButton} onPress={recordPayment}><Text style={styles.applyText}>Save Payment</Text></Pressable>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
      <Modal visible={!!historyTarget} transparent animationType="slide" onRequestClose={() => setHistoryTarget(null)}>
        <Pressable style={styles.modalScrim} onPress={() => setHistoryTarget(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetGrip} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Payment History</Text>
            <Pressable style={styles.iconButtonSmall} onPress={() => setHistoryTarget(null)}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            <Text style={styles.muted}>{historyStudent?.name || 'Student'}</Text>
            {historyFee?.paymentHistory.length ? historyFee.paymentHistory.map((payment) => (
              <View key={payment.id} style={styles.paymentHistoryRow}>
                <View style={styles.paymentDot} />
                <View style={styles.infoMain}>
                  <Text style={styles.infoTitle}>{currency(payment.amount)}</Text>
                  <Text style={styles.infoSubtitle}>{payment.mode} - Receipt: {payment.receiptNo}</Text>
                </View>
                <Text style={styles.infoRight}>{payment.date}</Text>
              </View>
            )) : <Text style={styles.muted}>No payments recorded yet.</Text>}
            {historyFee ? (
              <Card title="Summary">
                <InfoRow title="Total Paid" subtitle={currency(historyFee.amountPaid)} />
                <InfoRow title="Balance Due" subtitle={currency(historyFee.balance)} />
              </Card>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function LeavesScreen({
  user,
  leaveRecords,
  setLeaveRecords,
}: {
  user: User;
  leaveRecords: LeaveRecord[];
  setLeaveRecords: React.Dispatch<React.SetStateAction<LeaveRecord[]>>;
}) {
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [role, setRole] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const canReviewTeacherLeaves = user.role === 'admin';
  const canApplyLeave = user.role === 'teacher';
  const pendingTeacherLeaves = leaveRecords.filter((leave) => leave.applicantRole === 'Teacher' && leave.status === 'Pending').length;
  const visibleLeaveRecords = canReviewTeacherLeaves ? leaveRecords : leaveRecords.filter((leave) => leave.applicantId === user.id || leave.applicantName === user.name);
  const updateLeaveStatus = async (leaveId: string, nextStatus: LeaveRecord['status']) => {
    const current = leaveRecords.find((leave) => leave.id === leaveId);
    if (!current) return;
    const nextLeave: LeaveRecord = { ...current, status: nextStatus, remarks: nextStatus === 'Approved' ? 'Approved by admin' : 'Rejected by admin' };
    const { data, error } = await saveLeave(nextLeave);
    if (error || !data) {
      Alert.alert('Supabase error', error?.message || 'Unable to update leave request.');
      return;
    }
    setLeaveRecords((prev) => prev.map((leave) => leave.id === data.id ? data : leave));
    Alert.alert(`Leave ${nextStatus.toLowerCase()}`, `The teacher leave request has been ${nextStatus.toLowerCase()}.`);
  };
  const applyLeave = async (leave: LeaveRecord) => {
    const { data, error } = await saveLeave(leave);
    if (error || !data) {
      Alert.alert('Supabase error', error?.message || 'Unable to submit leave request.');
      return;
    }
    setLeaveRecords((prev) => [data, ...prev]);
    setApplicationOpen(false);
    Alert.alert('Leave submitted', 'Your leave request has been submitted for admin approval.');
  };
  const filtered = visibleLeaveRecords.filter((leave) => (
    (!status || leave.status === status) &&
    (!type || leave.leaveType === type) &&
    (!role || leave.applicantRole === role)
  ));

  return (
    <View style={styles.stack}>
      {canReviewTeacherLeaves ? (
        <View style={styles.leaveReviewHero}>
          <View style={styles.leaveReviewIcon}><Ionicons name="document-text-outline" size={24} color="#4f46e5" /></View>
          <View style={styles.infoMain}>
            <Text style={styles.timetableHeroTitle}>Teacher Leave Review</Text>
            <Text style={styles.timetableHeroMeta}>{pendingTeacherLeaves} pending teacher requests</Text>
          </View>
        </View>
      ) : null}
      {canApplyLeave ? (
        <View style={styles.leaveReviewHero}>
          <View style={styles.leaveReviewIcon}><Ionicons name="add-circle-outline" size={24} color="#4f46e5" /></View>
          <View style={styles.infoMain}>
            <Text style={styles.timetableHeroTitle}>My Leave Applications</Text>
            <Text style={styles.timetableHeroMeta}>Apply leave and track approval status</Text>
          </View>
          <Pressable style={styles.leaveHeroButton} onPress={() => setApplicationOpen(true)}>
            <Ionicons name="add-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : null}
      <FilterHeader title={`${filtered.length} leave requests`} activeCount={[status, type, role].filter(Boolean).length} onOpen={() => setFilterOpen(true)} />
      <ActiveFilterChips filters={[
        status && { label: status, onClear: () => setStatus('') },
        type && { label: type, onClear: () => setType('') },
        role && { label: role, onClear: () => setRole('') },
      ]} />
      {filtered.map((leave) => {
        const canAct = canReviewTeacherLeaves && leave.applicantRole === 'Teacher' && leave.status === 'Pending';
        return (
          <Card key={leave.id} title={leave.applicantName}>
            <InfoRow title={leave.leaveType} subtitle={`${leave.fromDate} to ${leave.toDate}`} right={leave.status} />
            <InfoRow title={`${leave.days} day${leave.days > 1 ? 's' : ''}`} subtitle={`Applied on ${leave.appliedOn}`} right={leave.applicantRole} />
            <Text style={styles.muted}>{leave.reason}</Text>
            {leave.remarks ? <Text style={styles.leaveRemark}>{leave.remarks}</Text> : null}
            {canAct ? (
              <View style={styles.leaveActions}>
                <Pressable style={[styles.leaveActionButton, styles.leaveApproveButton]} onPress={() => updateLeaveStatus(leave.id, 'Approved')}>
                  <Ionicons name="checkmark-outline" size={17} color="#059669" />
                  <Text style={styles.leaveApproveText}>Approve</Text>
                </Pressable>
                <Pressable style={[styles.leaveActionButton, styles.leaveRejectButton]} onPress={() => updateLeaveStatus(leave.id, 'Rejected')}>
                  <Ionicons name="close-outline" size={18} color="#e11d48" />
                  <Text style={styles.leaveRejectText}>Reject</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        );
      })}
      <GenericFilterSheet
        visible={filterOpen}
        title="Filter leaves"
        onClose={() => setFilterOpen(false)}
        onClear={() => { setStatus(''); setType(''); setRole(''); }}
        groups={[
          { label: 'Status', value: status, options: ['Pending', 'Approved', 'Rejected'], onChange: setStatus, allLabel: 'All statuses' },
          { label: 'Leave Type', value: type, options: ['Sick', 'Casual', 'Emergency', 'Other'], onChange: setType, allLabel: 'All leave types' },
          { label: 'Applicant', value: role, options: ['Teacher', 'Student', 'admin', 'teacher', 'student', 'accountant'], onChange: setRole, allLabel: 'All applicants' },
        ]}
      />
      <LeaveApplicationSheet
        visible={applicationOpen}
        user={user}
        onClose={() => setApplicationOpen(false)}
        onSubmit={applyLeave}
      />
    </View>
  );
}

function LeaveApplicationSheet({
  visible,
  user,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSubmit: (leave: LeaveRecord) => void;
}) {
  const [leaveType, setLeaveType] = useState('Sick');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const reset = () => {
    setLeaveType('Sick');
    setFromDate('');
    setToDate('');
    setReason('');
  };
  const submit = () => {
    if (!fromDate || !toDate || !reason.trim()) {
      Alert.alert('Missing details', 'Please enter from date, to date, and reason.');
      return;
    }
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const days = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;
    if (!Number.isFinite(days) || days <= 0) {
      Alert.alert('Invalid dates', 'Please enter a valid date range.');
      return;
    }
    onSubmit({
      id: `l${Date.now()}`,
      applicantId: user.id,
      applicantName: user.name,
      applicantRole: 'Teacher',
      leaveType,
      fromDate,
      toDate,
      days,
      reason: reason.trim(),
      status: 'Pending',
      appliedOn: new Date().toISOString().slice(0, 10),
    });
    reset();
  };
  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.modalScrim} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.sheetGrip} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Apply for leave</Text>
          <Pressable style={styles.iconButtonSmall} onPress={close}><Ionicons name="close-outline" size={24} color="#374151" /></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          <ChoiceGroup label="Leave Type" value={leaveType} options={['Sick', 'Casual', 'Emergency', 'Other']} onChange={(value) => setLeaveType(value || 'Sick')} allLabel="Sick" />
          <Text style={styles.label}>From</Text>
          <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
          <Text style={styles.label}>To</Text>
          <TextInput style={styles.input} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
          <Text style={styles.label}>Reason</Text>
          <TextInput style={[styles.input, styles.textArea]} value={reason} onChangeText={setReason} placeholder="Reason for leave" multiline />
          <View style={styles.sheetActions}>
            <Pressable style={styles.ghostButton} onPress={reset}><Text style={styles.ghostText}>Reset</Text></Pressable>
            <Pressable style={styles.applyButton} onPress={submit}><Text style={styles.applyText}>Submit</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function HolidaysScreen() {
  const [holidayRows, setHolidayRows] = useState<Holiday[]>([]);
  const [month, setMonth] = useState('All');
  const [type, setType] = useState<'All' | Holiday['type']>('All');
  const months = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const types: Array<'All' | Holiday['type']> = ['All', 'National', 'Festival', 'School Event', 'Vacation', 'Optional'];
  useEffect(() => {
    let active = true;
    async function loadHolidays() {
      const { data, error } = await getHolidays();
      if (!active) return;
      if (error) {
        Alert.alert('Supabase error', error.message || 'Unable to load holidays.');
        return;
      }
      setHolidayRows(data);
    }
    loadHolidays();
    return () => { active = false; };
  }, []);
  const sorted = [...holidayRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const filtered = sorted.filter((holiday) => {
    const holidayMonth = new Date(holiday.date).getMonth() + 1;
    const monthMatches = month === 'All' || holidayMonth === months.indexOf(month);
    const typeMatches = type === 'All' || holiday.type === type;
    return monthMatches && typeMatches;
  });
  const nextHoliday = sorted.find((holiday) => new Date(holiday.endDate || holiday.date).getTime() >= new Date().getTime()) || sorted[0];
  const totalDays = filtered.reduce((sum, holiday) => sum + holidayDays(holiday), 0);
  const vacationCount = filtered.filter((holiday) => holiday.type === 'Vacation').length;

  return (
    <View style={styles.stack}>
      <DashboardHeader title="Holidays" subtitle="School holidays and vacation calendar" />
      <MetricGrid metrics={[
        ['Holidays', String(filtered.length), 'calendar-month'],
        ['Total Days', String(totalDays), 'clock-outline'],
        ['Vacations', String(vacationCount), 'beach'],
      ]} />

      {nextHoliday ? (
        <View style={styles.holidayHero}>
          <View style={styles.holidayHeroIcon}>
            <Ionicons name="calendar-outline" size={24} color="#fff" />
          </View>
          <View style={styles.infoMain}>
            <Text style={styles.holidayHeroLabel}>Next Holiday</Text>
            <Text style={styles.holidayHeroTitle}>{nextHoliday.title}</Text>
            <Text style={styles.holidayHeroDate}>
              {readableDate(nextHoliday.date)}{nextHoliday.endDate ? ` - ${readableDate(nextHoliday.endDate)}` : ''}
            </Text>
          </View>
          <Text style={styles.holidayDaysBadge}>{holidayDays(nextHoliday)}d</Text>
        </View>
      ) : null}

      <View style={styles.filterCard}>
        <Text style={styles.label}>Month</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {months.map((item) => (
            <Pressable key={item} style={[styles.chip, month === item && styles.chipActive]} onPress={() => setMonth(item)}>
              <Text style={[styles.chipText, month === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.label}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {types.map((item) => (
            <Pressable key={item} style={[styles.chip, type === item && styles.chipActive]} onPress={() => setType(item)}>
              <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {filtered.map((holiday) => {
        const tone = holidayTone(holiday.type);
        return (
          <View key={holiday.id} style={styles.holidayCard}>
            <View style={styles.holidayDateTile}>
              <Text style={styles.holidayDateDay}>{new Date(holiday.date).toLocaleDateString('en-IN', { day: '2-digit' })}</Text>
              <Text style={styles.holidayDateMonth}>{new Date(holiday.date).toLocaleDateString('en-IN', { month: 'short' })}</Text>
            </View>
            <View style={styles.infoMain}>
              <View style={styles.periodTopRow}>
                <Text style={styles.holidayTitle}>{holiday.title}</Text>
                <Text style={[styles.holidayTypeBadge, { backgroundColor: tone.bg, color: tone.text }]}>{holiday.type}</Text>
              </View>
              <Text style={styles.holidayDateText}>
                {readableDate(holiday.date)}{holiday.endDate ? ` - ${readableDate(holiday.endDate)}` : ''}
              </Text>
              <Text style={styles.holidayNote}>{holiday.note}</Text>
              <View style={styles.holidayFooter}>
                <Text style={styles.muted}>{holiday.audience}</Text>
                <Text style={styles.infoRight}>{holidayDays(holiday)} day{holidayDays(holiday) > 1 ? 's' : ''}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {!filtered.length ? (
        <Card title="No holidays"><Text style={styles.muted}>No holidays match the selected filters.</Text></Card>
      ) : null}
    </View>
  );
}

function AnnouncementsScreen() {
  const [items, setItems] = useState<Announcement[]>([]);
  useEffect(() => {
    let active = true;
    async function loadAnnouncements() {
      const { data, error } = await getAnnouncements();
      if (!active) return;
      if (error) {
        Alert.alert('Supabase error', error.message || 'Unable to load announcements.');
        return;
      }
      setItems(data);
    }
    loadAnnouncements();
    return () => { active = false; };
  }, []);
  return <View style={styles.stack}>{items.map((item) => <Card key={item.id} title={item.title}><Text style={styles.bodyText}>{item.body}</Text><InfoRow title="Priority" subtitle={item.priority} right={item.postedBy} /></Card>)}</View>;
}

function NotificationsScreen({
  user,
  sessionNotifications,
  setSessionNotifications,
}: {
  user: User;
  sessionNotifications: Notification[];
  setSessionNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}) {
  const visible = sessionNotifications.filter((note) => note.forRole.includes(user.role) && (!note.targetEmail || note.targetEmail === user.email.trim().toLowerCase()));
  const markRead = (id: string) => setSessionNotifications((prev) => prev.map((note) => note.id === id ? { ...note, read: true } : note));
  return (
    <View style={styles.stack}>
      {visible.map((note) => (
        <Pressable key={note.id} onPress={() => markRead(note.id)}>
          <Card title={note.title}>
            <Text style={styles.bodyText}>{note.message}</Text>
            <InfoRow title={note.type} subtitle={new Date(note.time).toLocaleDateString()} right={note.read ? 'Read' : 'New'} />
          </Card>
        </Pressable>
      ))}
      {!visible.length ? <Card title="No notifications"><Text style={styles.muted}>You're all caught up.</Text></Card> : null}
    </View>
  );
}

function ReportsScreen({ students, userRole }: { students: Student[]; userRole: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>(defaultReportFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const reportTypes = [
    { id: 'attendance', title: 'Attendance Report', desc: 'Class-wise attendance statistics', icon: 'calendar-check', bg: '#d1fae5', text: '#059669' },
    { id: 'marks', title: 'Marks Report', desc: 'Exam-wise marks analysis', icon: 'book-open-page-variant', bg: '#e0e7ff', text: '#4f46e5' },
    { id: 'leave', title: 'Leave Report', desc: 'Staff and student leave records', icon: 'file-document-outline', bg: '#ede9fe', text: '#7c3aed' },
    ...(userRole !== 'teacher' ? [{ id: 'fee', title: 'Fee Collection Report', desc: 'Monthly fee collection summary', icon: 'cash', bg: '#fef3c7', text: '#d97706' }] : []),
  ];

  const handleGenerate = (id: string) => {
    setSelected(id);
    setLoading(true);
    setGenerated(false);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 700);
  };

  const rows = getFilteredReportRows(selected, filters, students);
  const selectedType = reportTypes.find((report) => report.id === selected);
  const activeFilters = [
    filters.klass && { label: `Class ${filters.klass}`, onClear: () => setFilters((prev) => ({ ...prev, klass: '' })) },
    filters.section && { label: `Section ${filters.section}`, onClear: () => setFilters((prev) => ({ ...prev, section: '' })) },
    filters.feeStatus && { label: filters.feeStatus, onClear: () => setFilters((prev) => ({ ...prev, feeStatus: '' })) },
    filters.attendanceRange && { label: filters.attendanceRange, onClear: () => setFilters((prev) => ({ ...prev, attendanceRange: '' })) },
    filters.exam && { label: filters.exam, onClear: () => setFilters((prev) => ({ ...prev, exam: '' })) },
    filters.subject && { label: filters.subject, onClear: () => setFilters((prev) => ({ ...prev, subject: '' })) },
    filters.leaveStatus && { label: filters.leaveStatus, onClear: () => setFilters((prev) => ({ ...prev, leaveStatus: '' })) },
    filters.leaveType && { label: filters.leaveType, onClear: () => setFilters((prev) => ({ ...prev, leaveType: '' })) },
    filters.applicantRole && { label: filters.applicantRole, onClear: () => setFilters((prev) => ({ ...prev, applicantRole: '' })) },
  ];

  const exportReport = () => {
    if (!selected) return;
    const csv = toCSV(rows);
    Alert.alert(`${selected}_report.csv`, `CSV generated with ${rows.length} rows.\n\n${csv.slice(0, 220)}${csv.length > 220 ? '...' : ''}`);
  };

  return (
    <View style={styles.stack}>
      <DashboardHeader title="Reports" subtitle="Generate and export school reports" />
      <View style={styles.reportGrid}>
        {reportTypes.map((report) => {
          const active = selected === report.id;
          return (
            <Pressable key={report.id} style={[styles.reportTypeCard, active && styles.reportTypeActive]} onPress={() => handleGenerate(report.id)}>
              <View style={[styles.reportIconWrap, { backgroundColor: report.bg }]}>
                <MaterialCommunityIcons name={report.icon as any} size={24} color={report.text} />
              </View>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDesc}>{report.desc}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <Card title={selectedType?.title || 'Report'}>
          <View style={styles.reportCardHeader}>
            <Text style={styles.muted}>{generated ? `${rows.length} rows generated` : loading ? 'Generating report...' : 'Select a report'}</Text>
            <View style={styles.headerActions}>
              <Pressable style={styles.reportFilterButton} onPress={() => setFilterOpen(true)}>
                <Ionicons name="filter-outline" size={17} color="#4f46e5" />
              </Pressable>
              {generated ? (
                <Pressable style={styles.exportButton} onPress={exportReport}>
                  <Ionicons name="download-outline" size={16} color="#4f46e5" />
                  <Text style={styles.exportText}>Export CSV</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <ActiveFilterChips filters={activeFilters} />

          {loading ? (
            <View style={styles.reportSkeletonList}>
              {Array.from({ length: 5 }).map((_, index) => <View key={index} style={styles.reportSkeleton} />)}
            </View>
          ) : generated ? (
            <View style={styles.stack}>
              {selected === 'fee' ? <FeeBars /> : null}
              <View style={styles.reportTable}>
                <View style={styles.reportTableHeader}>
                  {Object.keys(rows[0] || {}).slice(0, 4).map((key) => <Text key={key} style={styles.reportHeadCell}>{key}</Text>)}
                </View>
                {rows.slice(0, 15).map((row, index) => (
                  <View key={index} style={[styles.reportTableRow, index % 2 === 1 && styles.reportTableRowAlt]}>
                    {Object.values(row).slice(0, 4).map((value, valueIndex) => (
                      <Text key={valueIndex} style={[styles.reportCell, valueIndex === 0 && styles.reportCellStrong]} numberOfLines={2}>{String(value)}</Text>
                    ))}
                  </View>
                ))}
              </View>
              {!rows.length ? <Text style={styles.muted}>No records match the selected filters.</Text> : null}
            </View>
          ) : null}
          <ReportFilterSheet
            visible={filterOpen}
            selected={selected}
            filters={filters}
            setFilters={setFilters}
            onClose={() => setFilterOpen(false)}
          />
        </Card>
      ) : null}
    </View>
  );
}

function ReportFilterSheet({
  visible,
  selected,
  filters,
  setFilters,
  onClose,
}: {
  visible: boolean;
  selected: string | null;
  filters: ReportFilters;
  setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
  onClose: () => void;
}) {
  const examOptions = Array.from(new Set(marks.map((mark) => mark.exam)));
  const subjectOptions = Array.from(new Set(marks.map((mark) => mark.subject)));
  const setValue = (key: keyof ReportFilters) => (value: string) => setFilters((prev) => ({ ...prev, [key]: value }));
  const groups: FilterGroup[] = [];

  if (selected !== 'leave') {
    groups.push(
      { label: 'Class', value: filters.klass, options: classes, onChange: setValue('klass'), allLabel: 'All classes' },
      { label: 'Section', value: filters.section, options: sections, onChange: setValue('section'), allLabel: 'All sections' },
    );
  }
  if (selected === 'attendance') groups.push({ label: 'Attendance', value: filters.attendanceRange, options: ['Below 75%', '75% - 85%', '85% and above'], onChange: setValue('attendanceRange'), allLabel: 'All attendance' });
  if (selected === 'fee') groups.push({ label: 'Fee Status', value: filters.feeStatus, options: ['Paid', 'Partially Paid', 'Due', 'Overdue'], onChange: setValue('feeStatus'), allLabel: 'All statuses' });
  if (selected === 'marks') {
    groups.push(
      { label: 'Exam', value: filters.exam, options: examOptions, onChange: setValue('exam'), allLabel: 'All exams' },
      { label: 'Subject', value: filters.subject, options: subjectOptions, onChange: setValue('subject'), allLabel: 'All subjects' },
    );
  }
  if (selected === 'leave') {
    groups.push(
      { label: 'Status', value: filters.leaveStatus, options: ['Pending', 'Approved', 'Rejected'], onChange: setValue('leaveStatus'), allLabel: 'All statuses' },
      { label: 'Leave Type', value: filters.leaveType, options: ['Sick', 'Casual', 'Emergency', 'Other'], onChange: setValue('leaveType'), allLabel: 'All types' },
      { label: 'Applicant', value: filters.applicantRole, options: ['Teacher', 'Student'], onChange: setValue('applicantRole'), allLabel: 'All applicants' },
    );
  }

  return (
    <GenericFilterSheet
      visible={visible}
      title="Filter report"
      onClose={onClose}
      onClear={() => setFilters(defaultReportFilters)}
      groups={groups}
    />
  );
}

function reportAttendanceMatches(value: number, range: string) {
  if (!range) return true;
  if (range === 'Below 75%') return value < 75;
  if (range === '75% - 85%') return value >= 75 && value < 85;
  return value >= 85;
}

function getFilteredReportRows(selected: string | null, filters: ReportFilters, students: Student[]): Array<Record<string, string | number>> {
  const filteredStudents = students.filter((student) => (
    (!filters.klass || student.class === filters.klass) &&
    (!filters.section || student.section === filters.section)
  ));

  if (selected === 'fee') {
    return initialFees
      .map((fee) => ({ fee, student: students.find((item) => item.id === fee.studentId) }))
      .filter(({ fee, student }) => student && (!filters.klass || student.class === filters.klass) && (!filters.section || student.section === filters.section) && (!filters.feeStatus || fee.status === filters.feeStatus))
      .map(({ fee, student }) => ({ Name: student!.name, Class: `${student!.class}-${student!.section}`, Status: fee.status, Balance: fee.balance }));
  }
  if (selected === 'leave') {
    return initialLeaves
      .filter((leave) => (!filters.leaveStatus || leave.status === filters.leaveStatus) && (!filters.leaveType || leave.leaveType === filters.leaveType) && (!filters.applicantRole || leave.applicantRole === filters.applicantRole))
      .map((leave) => ({ Name: leave.applicantName, Role: leave.applicantRole, Type: leave.leaveType, Status: leave.status }));
  }
  if (selected === 'marks') {
    return marks
      .map((mark) => ({ mark, student: students.find((item) => item.id === mark.studentId) }))
      .filter(({ mark, student }) => student && (!filters.klass || student.class === filters.klass) && (!filters.section || student.section === filters.section) && (!filters.exam || mark.exam === filters.exam) && (!filters.subject || mark.subject === filters.subject))
      .map(({ mark, student }) => ({ Name: student!.name, Class: `${student!.class}-${student!.section}`, Exam: mark.exam, Subject: mark.subject, Score: `${mark.scored}/${mark.maxMarks}` }));
  }
  return filteredStudents
    .filter((student) => reportAttendanceMatches(student.attendancePercent, filters.attendanceRange))
    .map((student) => ({ Name: student.name, Class: `${student.class}-${student.section}`, 'Attendance %': student.attendancePercent }));
}

function getReportRows(selected: string | null, students: Student[]): Array<Record<string, string | number>> {
  if (selected === 'fee') {
    return monthlyFeeCollection.map((item) => ({ Month: item.month, 'Amount (₹)': item.amount }));
  }
  if (selected === 'leave') {
    return initialLeaves.map((leave) => ({ Name: leave.applicantName, Type: leave.leaveType, Status: leave.status }));
  }
  if (selected === 'marks') {
    return students.map((student) => ({ Name: student.name, Class: `${student.class}-${student.section}`, 'Average %': averageForStudent(student.id) }));
  }
  return students.map((student) => ({ Name: student.name, Class: `${student.class}-${student.section}`, 'Attendance %': student.attendancePercent }));
}

function toCSV(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

function ProfileScreen({
  user,
  profilePhotoUri,
  setProfilePhotoUri,
}: {
  user: User;
  profilePhotoUri: string | null;
  setProfilePhotoUri: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [form, setForm] = useState({ name: user.name, phone: '9876543210', dob: '1985-05-15', address: '42, MG Road, New Delhi' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [saved, setSaved] = useState(false);
  const strength = passwordForm.newPassword.length > 8 ? (passwordForm.newPassword.length > 12 ? 3 : 2) : passwordForm.newPassword.length > 4 ? 1 : 0;
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#e11d48', '#d97706', '#34d399', '#059669'];
  const activities = [
    { action: 'Marked attendance for Class 9A', time: '2 hours ago' },
    { action: 'Recorded payment for Arjun Singh', time: '5 hours ago' },
    { action: 'Posted announcement: Exam Schedule', time: '1 day ago' },
    { action: 'Added new student: Zara Hussain', time: '2 days ago' },
    { action: 'Generated fee collection report', time: '3 days ago' },
  ];
  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.stack}>
      <View style={styles.profileHero}>
        <View style={styles.profileCover} />
        <View style={styles.profilePhotoWrap}>
          {profilePhotoUri ? (
            <Image source={{ uri: profilePhotoUri }} style={styles.profilePhoto} />
          ) : (
            <Avatar name={user.name} size={86} />
          )}
          <Pressable style={styles.profilePhotoEdit} onPress={pickProfilePhoto}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.profileName}>{form.name}</Text>
        <View style={styles.profileRoleRow}>
          <Text style={styles.profileRoleBadge}>{user.role}</Text>
          <Text style={styles.profileMeta}>{user.email}</Text>
        </View>
        <View style={styles.profilePhotoActions}>
          <Pressable style={styles.profileUploadButton} onPress={pickProfilePhoto}>
            <Ionicons name="image-outline" size={17} color="#4f46e5" />
            <Text style={styles.profileUploadText}>{profilePhotoUri ? 'Change photo' : 'Upload photo'}</Text>
          </Pressable>
          {profilePhotoUri ? (
            <Pressable style={styles.profileRemoveButton} onPress={() => setProfilePhotoUri(null)}>
              <Ionicons name="trash-outline" size={16} color="#e11d48" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Card title="Personal Information">
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(name) => { setSaved(false); setForm((prev) => ({ ...prev, name })); }} />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={(phone) => { setSaved(false); setForm((prev) => ({ ...prev, phone })); }} keyboardType="phone-pad" />
        <Text style={styles.label}>Date of Birth</Text>
        <TextInput style={styles.input} value={form.dob} onChangeText={(dob) => { setSaved(false); setForm((prev) => ({ ...prev, dob })); }} placeholder="YYYY-MM-DD" />
        <Text style={styles.label}>Address</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.address} onChangeText={(address) => { setSaved(false); setForm((prev) => ({ ...prev, address })); }} multiline />
        <Pressable style={styles.profilePrimaryButton} onPress={() => setSaved(true)}>
          <Text style={styles.primaryText}>{saved ? 'Saved' : 'Save Changes'}</Text>
          {saved ? <Ionicons name="checkmark-outline" size={17} color="#fff" /> : null}
        </Pressable>
      </Card>

      <Card title="Account Information">
        <InfoRow title="Email" subtitle={user.email} />
        <InfoRow title="Role" subtitle={user.role} />
        <InfoRow title="School" subtitle={user.schoolName} />
        <InfoRow title="Last Login" subtitle="Today, 9:30 AM" />
      </Card>

      <Card title="Change Password">
        <Text style={styles.label}>Old Password</Text>
        <TextInput style={styles.input} value={passwordForm.oldPassword} onChangeText={(oldPassword) => setPasswordForm((prev) => ({ ...prev, oldPassword }))} secureTextEntry />
        <Text style={styles.label}>New Password</Text>
        <TextInput style={styles.input} value={passwordForm.newPassword} onChangeText={(newPassword) => setPasswordForm((prev) => ({ ...prev, newPassword }))} secureTextEntry />
        {passwordForm.newPassword ? (
          <View style={styles.passwordStrength}>
            <View style={styles.passwordStrengthBars}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={[styles.passwordStrengthBar, index < strength && { backgroundColor: strengthColors[Math.max(0, strength - 1)] }]} />
              ))}
            </View>
            <Text style={styles.muted}>{strengthLabels[strength]}</Text>
          </View>
        ) : null}
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput style={styles.input} value={passwordForm.confirmPassword} onChangeText={(confirmPassword) => setPasswordForm((prev) => ({ ...prev, confirmPassword }))} secureTextEntry />
        <Pressable style={styles.profilePrimaryButton} onPress={() => Alert.alert('Password update', 'Password update can be connected to your API here.')}>
          <Text style={styles.primaryText}>Update Password</Text>
        </Pressable>
      </Card>

      <Card title="Recent Activity">
        {activities.map((item) => (
          <View key={`${item.action}-${item.time}`} style={styles.activityRow}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>{item.action}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.dashboardHeader}><Text style={styles.dashboardTitle}>{title}</Text><Text style={styles.dashboardSubtitle}>{subtitle}</Text></View>;
}

function MetricGrid({ metrics }: { metrics: Array<[string, string, string]> }) {
  return (
    <View style={styles.metricGrid}>
      {metrics.map(([label, value, icon]) => (
        <View key={label} style={styles.metric}>
          <MaterialCommunityIcons name={icon as any} size={22} color="#4f46e5" />
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={styles.metricValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>;
}

function InfoRow({ title, subtitle, right }: { title: string; subtitle: string; right?: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoMain}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      {right ? <Text style={styles.infoRight}>{right}</Text> : null}
    </View>
  );
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: Math.max(14, size / 3) }]}><Text style={[styles.avatarText, { fontSize: size > 56 ? 22 : 14 }]}>{initials(name)}</Text></View>;
}

function QuickAction({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable style={styles.quickTile} onPress={onPress}><Ionicons name={icon} size={22} color="#4f46e5" /><Text style={styles.quickText}>{label}</Text></Pressable>;
}

function FeeBars() {
  const max = Math.max(...monthlyFeeCollection.map((item) => item.amount));
  return <View style={styles.feeBars}>{monthlyFeeCollection.map((item) => <View key={item.month} style={styles.feeBarItem}><View style={[styles.feeBar, { height: Math.max(18, (item.amount / max) * 130) }]} /><Text style={styles.chartLabel}>{item.month}</Text></View>)}</View>;
}

function AttendanceLine() {
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 170;
  const labelHeight = 24;
  const padX = 16;
  const padTop = 18;
  const minY = 75;
  const maxY = 100;
  const plotHeight = chartHeight - labelHeight - padTop;
  const usableWidth = Math.max(0, chartWidth - padX * 2);
  const points = weeklyAttendance.map((item, index) => {
    const x = padX + (usableWidth * index) / Math.max(1, weeklyAttendance.length - 1);
    const y = padTop + ((maxY - item.percentage) / (maxY - minY)) * plotHeight;
    return { ...item, x, y };
  });
  const handleLayout = (event: LayoutChangeEvent) => setChartWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.nativeLineChart} onLayout={handleLayout}>
      {chartWidth > 0 ? (
        <>
          {[75, 80, 85, 90, 95, 100].map((tick) => {
            const top = padTop + ((maxY - tick) / (maxY - minY)) * plotHeight;
            return <View key={tick} style={[styles.chartGridLine, { top }]} />;
          })}
          <View style={[styles.attendanceArea, { left: padX, right: padX, top: Math.min(...points.map((point) => point.y)) + 8, height: chartHeight - labelHeight - Math.min(...points.map((point) => point.y)) - 8 }]} />
          {points.slice(0, -1).map((point, index) => {
            const next = points[index + 1];
            const dx = next.x - point.x;
            const dy = next.y - point.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = `${Math.atan2(dy, dx)}rad`;
            return (
              <View
                key={`${point.day}-${next.day}`}
                style={[
                  styles.chartLineSegment,
                  {
                    left: point.x,
                    top: point.y,
                    width: length,
                    transform: [{ rotate: angle }],
                  },
                ]}
              />
            );
          })}
          {points.map((point) => (
            <View key={point.day}>
              <Text style={[styles.lineValue, { left: point.x - 18, top: Math.max(0, point.y - 24) }]}>{point.percentage}%</Text>
              <View style={[styles.linePoint, { left: point.x - 6, top: point.y - 6 }]} />
              <Text style={[styles.lineDay, { left: point.x - 14, top: chartHeight - 18 }]}>{point.day}</Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 110 },
  stack: { gap: 16 },
  topBar: {
    height: 76,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topTitle: { flex: 1 },
  schoolText: { fontSize: 12, color: '#6b7280' },
  titleText: { fontSize: 20, fontWeight: '700', color: '#111827' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  iconButtonSmall: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' },
  badgeCount: { position: 'absolute', top: 2, right: 0, backgroundColor: '#e11d48', color: '#fff', borderRadius: 10, minWidth: 18, height: 18, textAlign: 'center', fontSize: 11, fontWeight: '700', overflow: 'hidden' },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 5,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navItem: { flex: 1, minHeight: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navItemActive: { backgroundColor: '#eef2ff' },
  navText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  navTextActive: { color: '#4f46e5' },
  loginShell: { flex: 1, backgroundColor: '#f8fafc' },
  loginScroll: { flex: 1, backgroundColor: '#f8fafc' },
  loginScrollInner: { flexGrow: 1, paddingBottom: 36 },
  loginHero: {
    minHeight: 270,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroGlowOne: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(129,140,248,0.42)', top: -70, right: -60 },
  heroGlowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(16,185,129,0.2)', bottom: 34, left: -70 },
  loginHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  heroPill: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroPillText: { color: '#e0e7ff', fontSize: 12, fontWeight: '700' },
  loginSchool: { color: '#c7d2fe', fontSize: 15, fontWeight: '700', marginBottom: 5 },
  loginHeadline: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '900', maxWidth: 340 },
  loginSubhead: { color: '#e0e7ff', fontSize: 14, lineHeight: 20, marginTop: 10, maxWidth: 340 },
  loginCard: {
    margin: 16,
    marginTop: 14,
    padding: 20,
    borderRadius: 26,
    backgroundColor: '#fff',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 34,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  loginCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  loginCardTitle: { color: '#111827', fontSize: 22, fontWeight: '900' },
  loginCardSubtitle: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  loginCardIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 12, color: '#111827', backgroundColor: '#fff' },
  textArea: { minHeight: 86, paddingTop: 12, textAlignVertical: 'top' },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  passwordToggle: { position: 'absolute', right: 4, top: 4, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  loginInputWrap: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  loginInput: { flex: 1, minHeight: 48, color: '#111827', fontSize: 14 },
  passwordTogglePremium: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#e11d48', fontWeight: '600' },
  primaryButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  fullWidthButton: { minHeight: 48, borderRadius: 15, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  loginButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 6,
    marginTop: 2,
  },
  loginHint: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 2 },
  dashboardHeader: { paddingHorizontal: 2 },
  dashboardTitle: { fontSize: 25, color: '#111827', fontWeight: '800' },
  dashboardSubtitle: { color: '#6b7280', fontSize: 14 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flex: 1, minWidth: 90, minHeight: 108, borderRadius: 18, backgroundColor: '#fff', padding: 14, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOpacity: 0.07, shadowRadius: 18, elevation: 3 },
  metricLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600', marginTop: 8 },
  metricValue: { color: '#111827', fontSize: 18, fontWeight: '800', marginTop: 5 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOpacity: 0.075, shadowRadius: 20, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  infoMain: { flex: 1 },
  infoTitle: { color: '#111827', fontWeight: '700', fontSize: 14 },
  infoSubtitle: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  infoRight: { color: '#4b5563', fontSize: 12, fontWeight: '700', maxWidth: 110, textAlign: 'right' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  quickTile: { width: '48%', minHeight: 82, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', gap: 8 },
  quickText: { color: '#374151', fontWeight: '700', fontSize: 12 },
  feeBars: { height: 170, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  feeBarItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  feeBar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: '#6366f1' },
  chartLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '700' },
  nativeLineChart: { height: 170, position: 'relative', overflow: 'hidden' },
  chartGridLine: { position: 'absolute', left: 16, right: 16, height: 1, backgroundColor: '#f1f5f9' },
  attendanceArea: { position: 'absolute', backgroundColor: 'rgba(16,185,129,0.08)', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  chartLineSegment: {
    position: 'absolute',
    height: 3,
    borderRadius: 999,
    backgroundColor: '#10b981',
    transformOrigin: '0px 1.5px' as any,
  },
  lineValue: { position: 'absolute', width: 36, textAlign: 'center', color: '#059669', fontWeight: '700', fontSize: 11 },
  linePoint: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff' },
  lineDay: { position: 'absolute', width: 28, textAlign: 'center', color: '#9ca3af', fontSize: 10, fontWeight: '700' },
  attendanceRegisterHeader: { marginTop: 6, gap: 2 },
  attendanceStudentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statusPills: { flexDirection: 'row', gap: 5 },
  statusPill: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  statusPillActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  statusPresent: { backgroundColor: '#10b981', borderColor: '#10b981' },
  statusAbsent: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  statusLate: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  statusPillText: { color: '#6b7280', fontSize: 12, fontWeight: '800' },
  statusPillTextActive: { color: '#fff' },
  timetableHero: { minHeight: 86, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2ff', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 18, elevation: 3 },
  timetableHeroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  timetableHeroTitle: { color: '#111827', fontSize: 20, fontWeight: '900' },
  timetableHeroMeta: { color: '#6b7280', fontSize: 13, fontWeight: '600', marginTop: 3 },
  dayTabs: { gap: 8, paddingRight: 4 },
  dayTab: { width: 78, minHeight: 66, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', gap: 3 },
  dayTabActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOpacity: 0.22, shadowRadius: 14, elevation: 5 },
  dayTabShort: { color: '#111827', fontSize: 15, fontWeight: '900' },
  dayTabText: { color: '#6b7280', fontSize: 11, fontWeight: '700' },
  dayTabTextActive: { color: '#fff' },
  timetableSectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  periodCard: { minHeight: 86, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#0f172a', shadowOpacity: 0.055, shadowRadius: 14, elevation: 2 },
  periodBreakCard: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  periodNumber: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  periodBreakNumber: { backgroundColor: '#ffedd5' },
  periodNumberText: { color: '#4f46e5', fontSize: 15, fontWeight: '900' },
  periodBreakText: { color: '#d97706' },
  periodLine: { width: 14, alignItems: 'center', alignSelf: 'stretch' },
  periodDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4f46e5', marginTop: 18 },
  periodBreakDot: { backgroundColor: '#f59e0b' },
  periodConnector: { flex: 1, width: 2, backgroundColor: '#e5e7eb', marginTop: 5 },
  periodContent: { flex: 1, gap: 8 },
  periodTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  periodSubject: { flex: 1, color: '#111827', fontSize: 16, fontWeight: '800' },
  periodBreakSubject: { color: '#92400e' },
  periodTime: { color: '#4f46e5', fontSize: 12, fontWeight: '800', backgroundColor: '#eef2ff', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  periodMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  periodTeacher: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  periodBreakTeacher: { color: '#b45309' },
  periodEditButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', alignItems: 'center', justifyContent: 'center' },
  examTimeline: { gap: 14 },
  examDayGroup: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  examDatePill: { width: 58, borderRadius: 18, backgroundColor: '#4f46e5', paddingVertical: 10, alignItems: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
  examDateDay: { color: '#fff', fontSize: 20, fontWeight: '900' },
  examDateMonth: { color: '#c7d2fe', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  examDayContent: { flex: 1, gap: 10 },
  examDayTitle: { color: '#111827', fontSize: 15, fontWeight: '900' },
  examPeriodCard: { minHeight: 82, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#0f172a', shadowOpacity: 0.055, shadowRadius: 14, elevation: 2 },
  examSubjectList: { gap: 8, marginTop: 2, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  examSubjectRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 9 },
  examSubjectDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#4f46e5' },
  examSubjectMain: { flex: 1, minWidth: 0 },
  examSubjectName: { color: '#111827', fontSize: 13, fontWeight: '900' },
  examSubjectDate: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 2 },
  examSubjectTime: { color: '#0f766e', fontSize: 11, fontWeight: '900', backgroundColor: '#ccfbf1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  markFilterRow: { gap: 10, paddingRight: 8 },
  markFilterBlock: { width: 210, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#eef2ff', padding: 10, gap: 7 },
  markFilterBlockSmall: { width: 128, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#eef2ff', padding: 10, gap: 7 },
  markFilterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  markMiniChip: { minHeight: 30, borderRadius: 999, paddingHorizontal: 9, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  markEntryHeader: { borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#eef2ff', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  markEntryRow: { minHeight: 58, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  markScoreInput: { width: 82, textAlign: 'center', paddingHorizontal: 8 },
  datePickerField: { minHeight: 56, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePickerTextWrap: { flex: 1 },
  datePickerValue: { color: '#111827', fontSize: 14, fontWeight: '900' },
  datePickerHint: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 2 },
  calendarSheet: { position: 'absolute', left: 16, right: 16, top: '18%', borderRadius: 24, backgroundColor: '#fff', padding: 18, gap: 14, shadowColor: '#0f172a', shadowOpacity: 0.22, shadowRadius: 30, elevation: 12 },
  calendarNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarNavButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  calendarMonth: { color: '#111827', fontSize: 16, fontWeight: '900' },
  calendarWeekRow: { flexDirection: 'row' },
  calendarWeekText: { flex: 1, textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: '900' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  examCalendarDayBlank: { width: `${100 / 7}%`, height: 40 },
  examCalendarDay: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  examCalendarDayActive: { backgroundColor: '#4f46e5' },
  examCalendarDayText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  examCalendarDayTextActive: { color: '#fff' },
  holidayHero: { borderRadius: 24, backgroundColor: '#4f46e5', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#4f46e5', shadowOpacity: 0.22, shadowRadius: 18, elevation: 6 },
  holidayHeroIcon: { width: 46, height: 46, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  holidayHeroLabel: { color: '#c7d2fe', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  holidayHeroTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 2 },
  holidayHeroDate: { color: '#e0e7ff', fontSize: 12, fontWeight: '700', marginTop: 3 },
  holidayDaysBadge: { color: '#4f46e5', backgroundColor: '#fff', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '900' },
  filterCard: { borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2ff', padding: 14, gap: 8, shadowColor: '#0f172a', shadowOpacity: 0.055, shadowRadius: 14, elevation: 2 },
  holidayCard: { borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', padding: 14, flexDirection: 'row', gap: 12, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  holidayDateTile: { width: 56, height: 64, borderRadius: 18, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  holidayDateDay: { color: '#4f46e5', fontSize: 21, fontWeight: '900' },
  holidayDateMonth: { color: '#6366f1', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  holidayTitle: { flex: 1, color: '#111827', fontSize: 15, fontWeight: '900' },
  holidayTypeBadge: { fontSize: 10, fontWeight: '900', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  holidayDateText: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  holidayNote: { color: '#475569', fontSize: 13, lineHeight: 19 },
  holidayFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  feeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOpacity: 0.07, shadowRadius: 18, elevation: 3, gap: 12 },
  feeStudentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feeAmountGrid: { flexDirection: 'row', gap: 8 },
  feeAmountTile: { flex: 1, borderRadius: 14, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', padding: 10 },
  feeAmountText: { color: '#111827', fontSize: 13, fontWeight: '900', marginTop: 4 },
  feeActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  feePayButton: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  feePayText: { color: '#4f46e5', fontSize: 13, fontWeight: '900' },
  feeHistoryButton: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: '#c7d2fe', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  feeToggleButton: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  feeToggleActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  feeToggleText: { color: '#4b5563', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  feeToggleTextActive: { color: '#fff' },
  paymentHistoryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f3f4f6', backgroundColor: '#fff' },
  paymentDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#d1fae5', borderWidth: 9, borderColor: '#ecfdf5' },
  leaveReviewHero: { minHeight: 82, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2ff', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 18, elevation: 3 },
  leaveReviewIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  leaveHeroButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  leaveRemark: { color: '#6b7280', fontSize: 12, fontWeight: '600', marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: '#f8fafc' },
  leaveActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  leaveActionButton: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  leaveApproveButton: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  leaveRejectButton: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  leaveApproveText: { color: '#059669', fontSize: 13, fontWeight: '800' },
  leaveRejectText: { color: '#e11d48', fontSize: 13, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: '#111827' },
  filterButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  filterCount: { position: 'absolute', top: -5, right: -5, minWidth: 19, height: 19, borderRadius: 10, backgroundColor: '#4f46e5', color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: '700', overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  activeFilterChip: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeFilterText: { color: '#4338ca', fontSize: 12, fontWeight: '700' },
  smallButton: { minHeight: 38, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#4f46e5', justifyContent: 'center' },
  smallButtonText: { color: '#fff', fontWeight: '700' },
  studentCard: { borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', shadowColor: '#0f172a', shadowOpacity: 0.075, shadowRadius: 20, elevation: 4 },
  studentCardMain: { padding: 16, gap: 14 },
  studentTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentIdentity: { flex: 1 },
  studentName: { color: '#111827', fontSize: 16, fontWeight: '800' },
  studentMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  badgeGood: { backgroundColor: '#d1fae5' },
  badgeWarn: { backgroundColor: '#fef3c7' },
  badgeBad: { backgroundColor: '#ffe4e6' },
  studentStats: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, borderRadius: 16, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', padding: 12 },
  statLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { color: '#111827', fontSize: 14, fontWeight: '800', marginTop: 4 },
  progressTrack: { height: 7, borderRadius: 999, backgroundColor: '#e5e7eb', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#4f46e5' },
  studentFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guardianCallRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  footerText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  callButton: { minHeight: 30, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', alignItems: 'center', gap: 5 },
  callButtonText: { color: '#059669', fontSize: 12, fontWeight: '800' },
  viewText: { color: '#4f46e5', fontSize: 12, fontWeight: '700' },
  studentActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#f1f5f9', gap: 1 },
  studentAction: { flex: 1, minHeight: 44, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  actionText: { color: '#374151', fontSize: 13, fontWeight: '700' },
  studentDetailHero: { borderRadius: 24, padding: 18, paddingTop: 74, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 22, elevation: 5 },
  detailBadgeGood: { backgroundColor: '#d1fae5', color: '#047857' },
  detailBadgeBad: { backgroundColor: '#ffe4e6', color: '#be123c' },
  detailBadgeWarn: { backgroundColor: '#fef3c7', color: '#b45309' },
  detailMetricGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  detailMetric: { width: '48.3%', minHeight: 74, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#eef2ff', padding: 12 },
  detailMetricValue: { color: '#111827', fontSize: 17, fontWeight: '900', marginBottom: 4 },
  detailTab: { minHeight: 42, borderRadius: 999, paddingHorizontal: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  detailTabActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
  detailTabText: { color: '#4b5563', fontSize: 13, fontWeight: '800' },
  detailTabTextActive: { color: '#fff' },
  attendanceCalendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  calendarDay: { width: '12.1%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  calendarPresent: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  calendarAbsent: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  calendarLate: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  calendarDayText: { color: '#111827', fontSize: 12, fontWeight: '800' },
  monthSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  monthChip: { minHeight: 34, minWidth: 48, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  monthChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  monthChipText: { color: '#4b5563', fontSize: 12, fontWeight: '800' },
  monthChipTextActive: { color: '#fff' },
  monthSummaryGrid: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  monthSummaryTile: { flex: 1, borderRadius: 14, padding: 10, borderWidth: 1 },
  monthPresentTile: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  monthAbsentTile: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  monthLateTile: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  monthSummaryValue: { color: '#111827', fontSize: 18, fontWeight: '900' },
  monthSummaryLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  progressCardHero: { borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#eef2ff', padding: 16, alignItems: 'center' },
  documentsEmpty: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,24,39,0.48)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#fff', padding: 16, paddingBottom: 28, maxHeight: '82%' },
  sheetGrip: { width: 44, height: 5, borderRadius: 999, backgroundColor: '#cbd5e1', alignSelf: 'center', marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
  formScroll: { gap: 10, paddingBottom: 12 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moduleTile: { width: '48.5%', minHeight: 82, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', gap: 8 },
  moduleTileActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  moduleText: { color: '#374151', fontWeight: '700', fontSize: 12 },
  moduleTextActive: { color: '#4f46e5' },
  choiceGroup: { marginBottom: 16 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  ghostButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: '#4f46e5', fontWeight: '700' },
  applyButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  applyText: { color: '#fff', fontWeight: '700' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  reportTypeCard: {
    width: '48%',
    minHeight: 150,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.075,
    shadowRadius: 18,
    elevation: 3,
  },
  reportTypeActive: { borderWidth: 2, borderColor: '#c7d2fe', backgroundColor: '#f8faff' },
  reportIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  reportTitle: { color: '#111827', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  reportDesc: { color: '#6b7280', fontSize: 12, lineHeight: 16 },
  reportCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 },
  reportFilterButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#c7d2fe', alignItems: 'center', justifyContent: 'center' },
  exportButton: { minHeight: 34, borderRadius: 10, backgroundColor: '#eef2ff', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  exportText: { color: '#4f46e5', fontSize: 12, fontWeight: '700' },
  reportSkeletonList: { gap: 10 },
  reportSkeleton: { height: 18, borderRadius: 999, backgroundColor: '#f3f4f6' },
  reportTable: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  reportTableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  reportHeadCell: { flex: 1, color: '#9ca3af', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', padding: 10 },
  reportTableRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  reportTableRowAlt: { backgroundColor: '#fafafa' },
  reportCell: { flex: 1, color: '#6b7280', fontSize: 12, padding: 10 },
  reportCellStrong: { color: '#111827', fontWeight: '700' },
  avatar: { backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  profileHero: { borderRadius: 22, padding: 20, paddingTop: 72, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  profileCover: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, backgroundColor: '#4f46e5' },
  profilePhotoWrap: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  profilePhoto: { width: 96, height: 96, borderRadius: 32, backgroundColor: '#eef2ff' },
  profilePhotoEdit: { position: 'absolute', right: -2, bottom: -2, width: 34, height: 34, borderRadius: 13, backgroundColor: '#4f46e5', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  profileName: { color: '#111827', fontSize: 22, fontWeight: '800', marginTop: 10 },
  profileRoleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  profileRoleBadge: { borderRadius: 999, backgroundColor: '#eef2ff', color: '#4f46e5', paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  profileMeta: { color: '#6b7280', fontSize: 13, marginTop: 3 },
  profilePhotoActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  profileUploadButton: { minHeight: 38, borderRadius: 14, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  profileUploadText: { color: '#4f46e5', fontSize: 13, fontWeight: '800' },
  profileRemoveButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', alignItems: 'center', justifyContent: 'center' },
  profilePrimaryButton: { alignSelf: 'flex-start', minHeight: 42, borderRadius: 14, backgroundColor: '#4f46e5', paddingHorizontal: 14, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 7 },
  passwordStrength: { gap: 5 },
  passwordStrengthBars: { flexDirection: 'row', gap: 4 },
  passwordStrengthBar: { flex: 1, height: 4, borderRadius: 999, backgroundColor: '#e5e7eb' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#818cf8' },
  activityText: { flex: 1, color: '#374151', fontSize: 13, fontWeight: '600' },
  activityTime: { color: '#9ca3af', fontSize: 11, fontWeight: '700' },
  bodyText: { color: '#4b5563', lineHeight: 20 },
  muted: { color: '#6b7280', fontSize: 13 },
});
