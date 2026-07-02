import { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  Download,
  DollarSign,
  Eye,
  EyeOff,
  Filter,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Pencil,
  Plus,
  Search,
  ShieldX,
  Trash2,
  UserCircle,
  UserPlus,
  Users,
  Clock,
  X,
} from 'lucide-react';
import * as Papa from 'papaparse';
import {
  announcements as initialAnnouncements,
  attendanceRecords,
  classes,
  exams as initialExams,
  fees as initialFees,
  leaves as initialLeaves,
  marks as initialMarks,
  mockUsers,
  monthlyFeeCollection,
  notifications as initialNotifications,
  paymentModes,
  sections,
  students as initialStudents,
  subjects,
  teachers as initialTeachers,
  timetable,
  weeklyAttendance,
  type Announcement,
  type ExamSchedule,
  type Fee,
  type LeaveRecord,
  type Notification,
  type PaymentRecord,
  type Student,
  type Teacher,
  type UserRole,
} from '../../src/data/mockData';

type Screen =
  | 'dashboard'
  | 'students'
  | 'studentDetail'
  | 'teachers'
  | 'attendance'
  | 'marks'
  | 'exams'
  | 'timetable'
  | 'fees'
  | 'leaves'
  | 'announcements'
  | 'notifications'
  | 'reports'
  | 'profile';

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  schoolName: string;
  token: string;
};

const roleOptions = [
  { label: 'Admin', email: 'admin@school.com', password: 'admin123' },
  { label: 'Teacher', email: 'teacher@school.com', password: 'teacher123' },
  { label: 'Student', email: 'student@school.com', password: 'student123' },
  { label: 'Parent', email: 'parent@school.com', password: 'parent123' },
  { label: 'Accountant', email: 'accountant@school.com', password: 'account123' },
];

const navItems: { screen: Screen; label: string; icon: React.ReactNode; roles: UserRole[] }[] = [
  { screen: 'dashboard', label: 'Home', icon: <Home size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'students', label: 'Students', icon: <Users size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'teachers', label: 'Teachers', icon: <GraduationCap size={20} />, roles: ['admin', 'teacher'] },
  { screen: 'attendance', label: 'Attendance', icon: <CalendarCheck size={20} />, roles: ['admin', 'teacher', 'student', 'parent'] },
  { screen: 'marks', label: 'Marks', icon: <BookOpen size={20} />, roles: ['admin', 'teacher', 'student', 'parent'] },
  { screen: 'exams', label: 'Exams', icon: <ClipboardList size={20} />, roles: ['admin', 'teacher', 'student', 'parent'] },
  { screen: 'timetable', label: 'Timetable', icon: <CalendarCheck size={20} />, roles: ['admin', 'teacher', 'student', 'parent'] },
  { screen: 'fees', label: 'Fees', icon: <CreditCard size={20} />, roles: ['admin', 'student', 'parent', 'accountant'] },
  { screen: 'leaves', label: 'Leaves', icon: <FileText size={20} />, roles: ['admin', 'teacher', 'student', 'accountant'] },
  { screen: 'announcements', label: 'News', icon: <Megaphone size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'notifications', label: 'Alerts', icon: <Bell size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
  { screen: 'reports', label: 'Reports', icon: <Download size={20} />, roles: ['admin', 'accountant'] },
  { screen: 'profile', label: 'Profile', icon: <UserCircle size={20} />, roles: ['admin', 'teacher', 'student', 'parent', 'accountant'] },
];

const primaryTabs: Screen[] = ['dashboard', 'students', 'attendance', 'notifications', 'profile'];

function currency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function averageForStudent(studentId: string) {
  const rows = initialMarks.filter((m) => m.studentId === studentId);
  const scored = rows.reduce((sum, row) => sum + row.scored, 0);
  const max = rows.reduce((sum, row) => sum + row.maxMarks, 0);
  return max ? Math.round((scored / max) * 100) : 0;
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return <div className="avatar" style={{ width: size, height: size, fontSize: size > 48 ? 20 : 14 }}>{initials}</div>;
}

function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info' }) {
  return <span className={`badge ${tone}`}>{label}</span>;
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="sheetOverlay" role="dialog" aria-modal="true">
      <button className="sheetScrim" onClick={onClose} aria-label="Close" />
      <section className="sheet">
        <div className="sheetGrip" />
        <div className="sheetHeader">
          <h3>{title}</h3>
          <button className="iconButton" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="empty"><AlertCircle size={28} /><strong>{title}</strong><span>{body}</span></div>;
}

export default function App() {
  const storedUser = localStorage.getItem('sms_mobile_user');
  const [user, setUser] = useState<User | null>(() => storedUser ? JSON.parse(storedUser) : null);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('s001');
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [fees, setFees] = useState<Fee[]>(initialFees);
  const [leaves, setLeaves] = useState<LeaveRecord[]>(initialLeaves);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [exams, setExams] = useState<ExamSchedule[]>(initialExams);

  const role = user?.role;
  const visibleNav = useMemo(() => navItems.filter((item) => role && item.roles.includes(role)), [role]);
  const activeTitle = navItems.find((item) => item.screen === screen)?.label || 'School';
  const unreadCount = notifications.filter((n) => role && n.forRole.includes(role) && !n.read).length;

  const navigate = (next: Screen, studentId?: string) => {
    if (studentId) setSelectedStudentId(studentId);
    setScreen(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = () => {
    localStorage.removeItem('sms_mobile_user');
    setUser(null);
    setScreen('dashboard');
  };

  if (!user) return <LoginScreen onLogin={setUser} />;

  const canAccess = visibleNav.some((item) => item.screen === screen) || screen === 'studentDetail';

  return (
    <div className="appShell">
      <header className="topBar">
        <button className="iconButton" onClick={() => setMenuOpen(true)} aria-label="Open modules"><Menu size={22} /></button>
        <div>
          <p>{user.schoolName}</p>
          <h1>{screen === 'studentDetail' ? 'Student Profile' : activeTitle}</h1>
        </div>
        <button className="notificationButton" onClick={() => navigate('notifications')} aria-label="Notifications">
          <Bell size={21} />
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
      </header>

      <main className="content">
        {!canAccess ? (
          <Unauthorized onBack={() => navigate('dashboard')} />
        ) : (
          <MobileRoutes
            user={user}
            screen={screen}
            navigate={navigate}
            students={students}
            setStudents={setStudents}
            selectedStudentId={selectedStudentId}
            teachers={teachers}
            setTeachers={setTeachers}
            fees={fees}
            setFees={setFees}
            leaves={leaves}
            setLeaves={setLeaves}
            announcements={announcements}
            setAnnouncements={setAnnouncements}
            notifications={notifications}
            setNotifications={setNotifications}
            exams={exams}
            setExams={setExams}
          />
        )}
      </main>

      <nav className="bottomNav" aria-label="Primary navigation">
        {primaryTabs.map((tab) => {
          const item = navItems.find((n) => n.screen === tab);
          if (!item || !role || !item.roles.includes(role)) return null;
          const active = screen === tab;
          return (
            <button key={tab} className={active ? 'active' : ''} onClick={() => navigate(tab)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {menuOpen && (
        <Sheet title="All Modules" onClose={() => setMenuOpen(false)}>
          <div className="moduleGrid">
            {visibleNav.map((item) => (
              <button key={item.screen} className={screen === item.screen ? 'module active' : 'module'} onClick={() => navigate(item.screen)}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <button className="module danger" onClick={logout}><LogOut size={20} /><span>Logout</span></button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pickRole = (label: string) => {
    const picked = roleOptions.find((r) => r.label === label);
    if (!picked) return;
    setSelected(label);
    setEmail(picked.email);
    setPassword(picked.password);
    setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 500));
    const found = mockUsers.find((item) => item.email === email && item.password === password);
    setLoading(false);
    if (!found) {
      setError('Invalid email or password');
      return;
    }
    const user = { ...found, token: `mock-jwt-token-${found.id}` };
    localStorage.setItem('sms_mobile_user', JSON.stringify(user));
    onLogin(user);
  };

  return (
    <main className="loginScreen">
      <section className="loginHero">
        <div className="brandMark"><GraduationCap size={30} /></div>
        <p>Sunrise Public School</p>
        <h1>Mobile school management</h1>
      </section>
      <form className="loginCard" onSubmit={submit}>
        <label>Quick login</label>
        <div className="chips">
          {roleOptions.map((role) => <button type="button" key={role.label} className={selected === role.label ? 'selected' : ''} onClick={() => pickRole(role.label)}>{role.label}</button>)}
        </div>
        <label>Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        <label>Password</label>
        <div className="passwordInput">
          <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {error && <p className="errorText">{error}</p>}
        <button className="primaryButton" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </main>
  );
}

type RouteProps = {
  user: User;
  screen: Screen;
  navigate: (screen: Screen, studentId?: string) => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedStudentId: string;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  fees: Fee[];
  setFees: React.Dispatch<React.SetStateAction<Fee[]>>;
  leaves: LeaveRecord[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRecord[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  exams: ExamSchedule[];
  setExams: React.Dispatch<React.SetStateAction<ExamSchedule[]>>;
};

function MobileRoutes(props: RouteProps) {
  switch (props.screen) {
    case 'students': return <StudentsScreen {...props} />;
    case 'studentDetail': return <StudentDetailScreen {...props} />;
    case 'teachers': return <TeachersScreen {...props} />;
    case 'attendance': return <AttendanceScreen user={props.user} students={props.students} />;
    case 'marks': return <MarksScreen user={props.user} students={props.students} />;
    case 'exams': return <ExamsScreen user={props.user} exams={props.exams} setExams={props.setExams} />;
    case 'timetable': return <TimetableScreen user={props.user} />;
    case 'fees': return <FeesScreen user={props.user} students={props.students} fees={props.fees} setFees={props.setFees} />;
    case 'leaves': return <LeavesScreen user={props.user} leaves={props.leaves} setLeaves={props.setLeaves} />;
    case 'announcements': return <AnnouncementsScreen user={props.user} announcements={props.announcements} setAnnouncements={props.setAnnouncements} />;
    case 'notifications': return <NotificationsScreen user={props.user} notifications={props.notifications} setNotifications={props.setNotifications} />;
    case 'reports': return <ReportsScreen students={props.students} />;
    case 'profile': return <ProfileScreen user={props.user} />;
    default: return <DashboardScreen {...props} />;
  }
}

function Unauthorized({ onBack }: { onBack: () => void }) {
  return (
    <section className="centerState">
      <ShieldX size={46} />
      <h2>Not authorized</h2>
      <p>You do not have permission to access this module.</p>
      <button className="primaryButton" onClick={onBack}>Back to dashboard</button>
    </section>
  );
}

function DashboardScreen({ user, navigate, students, teachers, fees, leaves, announcements, notifications, exams }: RouteProps) {
  const lowAttendance = students.filter((s) => s.attendancePercent < 80).slice(0, 5);

  if (user.role === 'teacher') {
    const teachingStudents = students.filter((student) => ['9', '10'].includes(student.class));
    const myLeaves = leaves.filter((leave) => leave.applicantId === user.id && leave.applicantRole === 'Teacher' && leave.status !== 'Rejected');
    const usedLeaveDays = myLeaves.reduce((sum, leave) => sum + leave.days, 0);
    const remainingLeaveDays = Math.max(0, 18 - usedLeaveDays);
    const teacherAttendance = Math.max(70, 100 - usedLeaveDays * 1.5);
    const summaries = teachingStudents
      .map((student) => {
        const studentMarks = initialMarks.filter((mark) => mark.studentId === student.id);
        if (!studentMarks.length) return null;
        const averageScore = studentMarks.reduce((sum, mark) => sum + (mark.scored / mark.maxMarks) * 100, 0) / studentMarks.length;
        const lowSubjects = Array.from(new Set(studentMarks.filter((mark) => (mark.scored / mark.maxMarks) * 100 < 60).map((mark) => mark.subject)));
        const gradeBand = averageScore >= 90 ? 'A+' : averageScore >= 80 ? 'A' : averageScore >= 70 ? 'B' : averageScore >= 60 ? 'C' : averageScore >= 50 ? 'D' : 'F';
        return { student, averageScore, lowSubjects, gradeBand };
      })
      .filter((entry): entry is { student: Student; averageScore: number; lowSubjects: string[]; gradeBand: string } => entry !== null);
    const lowAttendanceStudents = teachingStudents.filter((student) => student.attendancePercent < 85).slice(0, 4);
    const weakSubjects = Object.entries(
      initialMarks
        .filter((mark) => teachingStudents.some((student) => student.id === mark.studentId))
        .reduce<Record<string, { total: number; count: number }>>((acc, mark) => {
          const percent = (mark.scored / mark.maxMarks) * 100;
          if (!acc[mark.subject]) acc[mark.subject] = { total: 0, count: 0 };
          acc[mark.subject].total += percent;
          acc[mark.subject].count += 1;
          return acc;
        }, {}),
    ).map(([subject, data]) => ({ subject, avg: data.total / data.count })).sort((a, b) => a.avg - b.avg).slice(0, 3);
    const attentionStudents = summaries.filter((entry) => entry.averageScore < 60).sort((a, b) => a.averageScore - b.averageScore).slice(0, 5);
    const gradeDistribution = summaries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.gradeBand] = (acc[entry.gradeBand] || 0) + 1;
      return acc;
    }, {});
    const recentAssessments = initialMarks.filter((mark) => teachingStudents.some((student) => student.id === mark.studentId)).slice(-5).reverse();
    const upcomingExams = exams.filter((exam) => teachingStudents.some((student) => student.class === exam.class)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

    return (
      <div className="stack">
        <DashboardHeader title="Dashboard" subtitle="Welcome back, Teacher!" />
        <div className="metricGrid">
          <Metric label="My Classes" value={3} icon={<BookOpen size={20} />} />
          <Metric label="Total Students" value={teachingStudents.length} icon={<Users size={20} />} />
          <Metric label="Teacher Attendance" value={`${Math.round(teacherAttendance)}%`} icon={<CalendarCheck size={20} />} />
          <Metric label="Leaves Used" value={`${usedLeaveDays} days`} icon={<Clock size={20} />} />
          <Metric label="Leaves Available" value={`${remainingLeaveDays} days`} icon={<Clock size={20} />} />
        </div>
        <section className="card">
          <div className="sectionTitle"><h2>Class Attendance Snapshot</h2></div>
          <div className="metricGrid"><Metric label="Average Attendance" value={`${Math.round(teachingStudents.reduce((sum, s) => sum + s.attendancePercent, 0) / teachingStudents.length)}%`} icon={<CalendarCheck size={18} />} /><Metric label="Low Attendance" value={lowAttendanceStudents.length} icon={<AlertTriangle size={18} />} /></div>
          {lowAttendanceStudents.map((student) => <ListRow key={student.id} title={student.name} meta={`Class ${student.class}${student.section}`} right={`${student.attendancePercent}%`} />)}
        </section>
        <section className="card"><div className="sectionTitle"><h2>Weakest Subjects</h2></div>{weakSubjects.map((item) => <ListRow key={item.subject} title={item.subject} meta={`${item.avg.toFixed(0)}% average score`} />)}</section>
        <section className="card"><div className="sectionTitle"><h2>At-Risk Students</h2></div>{attentionStudents.length ? attentionStudents.map(({ student, averageScore, lowSubjects }) => <ListRow key={student.id} title={student.name} meta={`Needs support in: ${lowSubjects.length ? lowSubjects.join(', ') : 'multiple subjects'}`} right={`${averageScore.toFixed(0)}%`} />) : <p className="muted">No at-risk students detected in your current classes.</p>}</section>
        <section className="card"><div className="sectionTitle"><h2>Grade Band Distribution</h2></div>{['A+', 'A', 'B', 'C', 'D', 'F'].map((band) => <ListRow key={band} title={band} meta="Grade band" right={String(gradeDistribution[band] || 0)} />)}</section>
        <section className="card"><div className="sectionTitle"><h2>Upcoming Assessments</h2></div>{upcomingExams.map((exam) => <ListRow key={exam.id} title={exam.name} meta={`Class ${exam.class}${exam.section || ''}`} right={new Date(exam.date).toLocaleDateString()} />)}</section>
        <section className="card"><div className="sectionTitle"><h2>Recent Assessment Results</h2></div>{recentAssessments.map((result, index) => <ListRow key={`${result.studentId}-${index}`} title={result.subject} meta={`${result.exam} - ${students.find((student) => student.id === result.studentId)?.name || 'Student'}`} right={`${result.scored}/${result.maxMarks}`} />)}</section>
      </div>
    );
  }

  if (user.role === 'student') {
    return (
      <div className="stack">
        <DashboardHeader title="Dashboard" subtitle="Welcome back, Student!" />
        <div className="metricGrid">
          <Metric label="Attendance" value="92%" icon={<CalendarCheck size={20} />} onClick={() => navigate('attendance')} />
          <Metric label="Total Subjects" value={8} icon={<BookOpen size={20} />} onClick={() => navigate('marks')} />
          <Metric label="Fee Paid" value={currency(40000)} icon={<DollarSign size={20} />} onClick={() => navigate('fees')} />
          <Metric label="Class Rank" value={5} icon={<Users size={20} />} />
        </div>
        <section className="card"><div className="sectionTitle"><h2>Upcoming Exams</h2></div>{['Final Exam - April 1', 'Practical Exam - April 10', 'Viva - April 15'].map((item, i) => <ListRow key={item} title={item} meta={`Exam ${i + 1}`} />)}</section>
        <section className="card"><div className="sectionTitle"><h2>Recent Marks</h2></div>{[{ sub: 'Mathematics', marks: '22/25', grade: 'A' }, { sub: 'Science', marks: '20/25', grade: 'A' }, { sub: 'English', marks: '18/25', grade: 'B' }].map((item) => <ListRow key={item.sub} title={item.sub} meta={item.marks} right={item.grade} />)}</section>
      </div>
    );
  }

  if (user.role === 'parent') {
    const child = students.find((student) => student.guardianEmail === user.email) || students[0];
    const childMarks = initialMarks.filter((mark) => mark.studentId === child.id);
    const childAverage = childMarks.length ? childMarks.reduce((sum, mark) => sum + (mark.scored / mark.maxMarks) * 100, 0) / childMarks.length : 0;
    const childFee = fees.find((fee) => fee.studentId === child.id);
    const childNotifications = notifications.filter((note) => note.forRole.includes('parent'));
    const recentGrades = childMarks.sort((a, b) => (a.exam > b.exam ? 1 : -1)).slice(-3).reverse();
    const upcomingExams = exams.filter((exam) => exam.class === child.class).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
    return (
      <div className="stack">
        <DashboardHeader title="Dashboard" subtitle="Track your child's progress" />
        <div className="metricGrid">
          <Metric label="Child's Attendance" value={`${child.attendancePercent}%`} icon={<CalendarCheck size={20} />} />
          <Metric label="Fee Due" value={currency(childFee?.balance || 0)} icon={<DollarSign size={20} />} />
          <Metric label="Avg Score" value={`${Math.round(childAverage)}%`} icon={<GraduationCap size={20} />} />
          <Metric label="Unread Alerts" value={childNotifications.filter((note) => !note.read).length} icon={<Megaphone size={20} />} />
        </div>
        <section className="card"><div className="sectionTitle"><h2>Child Summary</h2></div><ListRow title="Name" meta={`${child.name} - Class ${child.class}${child.section}`} /><ListRow title="Fee Status" meta={childFee?.status || 'Unknown'} right={childFee?.dueDate || 'N/A'} /></section>
        <section className="card"><div className="sectionTitle"><h2>Performance Overview</h2></div><ListRow title="Average score" meta={`${Math.round(childAverage)}%`} /><ListRow title="Next exam" meta={upcomingExams[0] ? `${upcomingExams[0].name} - ${new Date(upcomingExams[0].date).toLocaleDateString()}` : 'No exam'} />{recentGrades.map((grade, index) => <ListRow key={`${grade.studentId}-${index}`} title={grade.subject} meta="Recent grade" right={`${grade.scored}/${grade.maxMarks}`} />)}</section>
        <section className="card"><div className="sectionTitle"><h2>Upcoming Exams</h2></div>{upcomingExams.map((exam) => <ListRow key={exam.id} title={exam.name} meta={`Class ${exam.class}${exam.section || ''}`} right={new Date(exam.date).toLocaleDateString()} />)}</section>
        <section className="card"><div className="sectionTitle"><h2>Parent Notifications</h2></div>{childNotifications.slice(0, 4).map((note) => <ListRow key={note.id} title={note.title} meta={note.message} right={note.read ? 'Read' : 'New'} />)}</section>
      </div>
    );
  }

  if (user.role === 'accountant') {
    return (
      <div className="stack">
        <DashboardHeader title="Dashboard" subtitle="Financial overview" />
        <div className="metricGrid">
          <Metric label="Revenue This Month" value={currency(580000)} icon={<DollarSign size={20} />} />
          <Metric label="Pending Collections" value={currency(245000)} icon={<AlertTriangle size={20} />} />
          <Metric label="Overdue Fees" value={5} icon={<AlertTriangle size={20} />} />
          <Metric label="Total Students" value={1240} icon={<Users size={20} />} />
        </div>
        <section className="card"><div className="sectionTitle"><h2>Monthly Fee Collection</h2></div><FeeChart /></section>
      </div>
    );
  }

  return (
    <div className="stack">
      <DashboardHeader title="Dashboard" subtitle="Welcome back! Here's your school overview." />
      <div className="metricGrid">
        <Metric label="Total Students" value={1240} icon={<Users size={20} />} onClick={() => navigate('students')} />
        <Metric label="Total Teachers" value={86} icon={<GraduationCap size={20} />} onClick={() => navigate('teachers')} />
        <Metric label="Revenue This Month" value={currency(580000)} icon={<DollarSign size={20} />} onClick={() => navigate('fees')} />
        <Metric label="Pending Fees" value={currency(245000)} icon={<AlertTriangle size={20} />} onClick={() => navigate('fees')} />
      </div>
      <section className="card"><div className="sectionTitle"><h2>Monthly Fee Collection</h2></div><FeeChart /></section>
      <section className="card"><div className="sectionTitle"><h2>Weekly Attendance</h2></div><AttendanceChart /></section>
      <section className="card"><div className="sectionTitle"><h2>Low Attendance Students</h2></div>{lowAttendance.map((student) => <StudentSummary key={student.id} student={student} compact onOpen={() => navigate('studentDetail', student.id)} />)}</section>
      <section className="card"><div className="sectionTitle"><h2>Recent Announcements</h2></div>{announcements.slice(0, 4).map((item) => <ListRow key={item.id} title={item.title} meta={`${item.body.slice(0, 80)}...`} right={item.priority} />)}</section>
      <section className="card">
        <div className="sectionTitle"><h2>Quick Actions</h2></div>
        <div className="moduleGrid">
          <button className="module" onClick={() => navigate('students')}><UserPlus size={20} /><span>Add Student</span></button>
          <button className="module" onClick={() => navigate('fees')}><CreditCard size={20} /><span>Record Payment</span></button>
          <button className="module" onClick={() => navigate('announcements')}><Megaphone size={20} /><span>Post Announcement</span></button>
          <button className="module" onClick={() => navigate('reports')}><FileText size={20} /><span>Generate Report</span></button>
        </div>
      </section>
    </div>
  );
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="dashboardHeader">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </section>
  );
}

function FeeChart() {
  const max = Math.max(...monthlyFeeCollection.map((item) => item.amount));
  return (
    <div className="feeBars">
      {monthlyFeeCollection.map((item) => (
        <div key={item.month}>
          <span style={{ height: `${Math.max(12, (item.amount / max) * 100)}%` }} />
          <em>{item.month}</em>
        </div>
      ))}
    </div>
  );
}

function AttendanceChart() {
  const width = 320;
  const height = 180;
  const padX = 18;
  const padY = 18;
  const minY = 75;
  const maxY = 100;
  const points = weeklyAttendance.map((day, index) => {
    const x = padX + (index * (width - padX * 2)) / (weeklyAttendance.length - 1);
    const y = padY + ((maxY - day.percentage) / (maxY - minY)) * (height - padY * 2 - 24);
    return { ...day, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY - 24} L ${points[0].x} ${height - padY - 24} Z`;

  return (
    <div className="lineChart" aria-label="Weekly attendance line chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="mobileAttendanceArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="95%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[75, 80, 85, 90, 95, 100].map((tick) => {
          const y = padY + ((maxY - tick) / (maxY - minY)) * (height - padY * 2 - 24);
          return <line key={tick} x1={padX} x2={width - padX} y1={y} y2={y} className="gridLine" />;
        })}
        <path d={areaPath} className="areaPath" />
        <path d={linePath} className="linePath" />
        {points.map((point) => (
          <g key={point.day}>
            <circle cx={point.x} cy={point.y} r="4" className="lineDot" />
            <text x={point.x} y={height - 8} textAnchor="middle" className="axisText">{point.day}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Metric({ label, value, icon, onClick }: { label: string; value: string | number; icon: React.ReactNode; onClick?: () => void }) {
  return <button className="metric" onClick={onClick}>{icon}<span>{label}</span><strong>{value}</strong></button>;
}

function ListRow({ title, meta, right }: { title: string; meta: string; right?: string }) {
  return <div className="listRow"><div><strong>{title}</strong><span>{meta}</span></div>{right && <em>{right}</em>}</div>;
}

function StudentSummary({ student, onOpen, compact = false }: { student: Student; onOpen: () => void; compact?: boolean }) {
  const tone = student.feeStatus === 'Paid' ? 'good' : student.feeStatus === 'Overdue' ? 'bad' : 'warn';
  return (
    <button className={compact ? 'studentRow compact' : 'studentRow'} onClick={onOpen}>
      <Avatar name={student.name} />
      <div>
        <strong>{student.name}</strong>
        <span>Class {student.class}{student.section} - Roll {student.rollNo}</span>
      </div>
      <div className="studentStats">
        <Badge label={`${student.attendancePercent}%`} tone={student.attendancePercent >= 85 ? 'good' : 'warn'} />
        <Badge label={student.feeStatus} tone={tone} />
      </div>
    </button>
  );
}

function StudentsScreen({ user, students, setStudents, navigate }: RouteProps) {
  const canManage = user.role === 'admin';
  const [query, setQuery] = useState('');
  const [klass, setKlass] = useState('');
  const [section, setSection] = useState('');
  const [fee, setFee] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = students.filter((student) => {
    const matchesQuery = !query || student.name.toLowerCase().includes(query.toLowerCase()) || student.rollNo.includes(query);
    return matchesQuery && (!klass || student.class === klass) && (!section || student.section === section) && (!fee || student.feeStatus === fee);
  });

  const remove = (student: Student) => {
    if (confirm(`Delete ${student.name}?`)) setStudents((prev) => prev.filter((item) => item.id !== student.id));
  };

  return (
    <div className="stack">
      <div className="searchFilterRow">
        <SearchBox value={query} onChange={setQuery} placeholder="Search students or roll number" />
        <button className={(klass || section || fee) ? 'filterButton active' : 'filterButton'} onClick={() => setShowFilters(true)} aria-label="Open filters">
          <Filter size={19} />
          {(klass || section || fee) && <span>{[klass, section, fee].filter(Boolean).length}</span>}
        </button>
      </div>
      {(klass || section || fee) && (
        <div className="activeFilters">
          {klass && <button onClick={() => setKlass('')}>Class {klass}<X size={12} /></button>}
          {section && <button onClick={() => setSection('')}>Section {section}<X size={12} /></button>}
          {fee && <button onClick={() => setFee('')}>{fee}<X size={12} /></button>}
        </div>
      )}
      <div className="sectionTitle"><h2>{filtered.length} students</h2>{canManage && <button className="smallPrimary" onClick={() => setEditing(blankStudent())}><Plus size={16} />Add</button>}</div>
      {filtered.map((student) => (
        <article className="studentCard" key={student.id}>
          <button className="studentCardMain" onClick={() => navigate('studentDetail', student.id)}>
            <div className="studentCardTop">
              <Avatar name={student.name} size={50} />
              <div className="studentIdentity">
                <strong>{student.name}</strong>
                <span>Roll {student.rollNo} - Class {student.class}{student.section}</span>
              </div>
              <Badge label={student.feeStatus} tone={student.feeStatus === 'Paid' ? 'good' : student.feeStatus === 'Overdue' ? 'bad' : 'warn'} />
            </div>
            <div className="studentCardStats">
              <div>
                <span>Attendance</span>
                <strong className={student.attendancePercent >= 85 ? 'goodText' : student.attendancePercent >= 75 ? 'warnText' : 'badText'}>{student.attendancePercent}%</strong>
              </div>
              <div>
                <span>Guardian</span>
                <strong>{student.guardianName || 'Not set'}</strong>
              </div>
            </div>
            <div className="attendanceProgress" aria-label={`Attendance ${student.attendancePercent}%`}>
              <span style={{ width: `${student.attendancePercent}%` }} />
            </div>
            <div className="studentCardFooter">
              <span>{student.guardianPhone}</span>
              <span>View profile</span>
            </div>
          </button>
          {canManage && (
            <div className="studentCardActions">
              <button onClick={() => setEditing(student)}><Pencil size={16} />Edit</button>
              <button className="dangerText" onClick={() => remove(student)}><Trash2 size={16} />Delete</button>
            </div>
          )}
        </article>
      ))}
      {filtered.length === 0 && <Empty title="No students found" body="Adjust filters or add a new student." />}
      {editing && <StudentForm student={editing} onClose={() => setEditing(null)} onSave={(next) => {
        setStudents((prev) => prev.some((student) => student.id === next.id) ? prev.map((student) => student.id === next.id ? next : student) : [next, ...prev]);
        setEditing(null);
      }} />}
      {showFilters && (
        <Sheet title="Filter students" onClose={() => setShowFilters(false)}>
          <div className="formGrid">
            <label>Class</label>
            <select value={klass} onChange={(e) => setKlass(e.target.value)}><option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
            <label>Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)}><option value="">All sections</option>{sections.map((s) => <option key={s}>{s}</option>)}</select>
            <label>Fee</label>
            <select value={fee} onChange={(e) => setFee(e.target.value)}><option value="">All fee statuses</option>{['Paid', 'Partially Paid', 'Due', 'Overdue'].map((s) => <option key={s}>{s}</option>)}</select>
          </div>
          <div className="sheetActions">
            <button className="smallGhost" onClick={() => { setKlass(''); setSection(''); setFee(''); }}>Clear filters</button>
            <button className="smallPrimary" onClick={() => setShowFilters(false)}>Apply filters</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function blankStudent(): Student {
  return {
    id: `s${Date.now()}`,
    name: '',
    rollNo: '',
    class: '9',
    section: 'A',
    dob: '',
    gender: 'Male',
    bloodGroup: 'B+',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    photo: null,
    admissionDate: new Date().toISOString().split('T')[0],
    feeStatus: 'Due',
    attendancePercent: 90,
  };
}

function StudentForm({ student, onSave, onClose }: { student: Student; onSave: (student: Student) => void; onClose: () => void }) {
  const [form, setForm] = useState<Student>(student);
  return (
    <Sheet title={student.name ? 'Edit student' : 'Add student'} onClose={onClose}>
      <div className="formGrid">
        <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Roll number" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
        <select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>{classes.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>{sections.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select>
        <input placeholder="Guardian name" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
        <input placeholder="Guardian phone" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
        <input placeholder="Guardian email" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} />
        <textarea placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <button className="primaryButton" disabled={!form.name} onClick={() => onSave(form)}>Save student</button>
    </Sheet>
  );
}

function StudentDetailScreen({ selectedStudentId, students, navigate, fees }: RouteProps) {
  const student = students.find((item) => item.id === selectedStudentId);
  const [tab, setTab] = useState('profile');
  if (!student) return <Empty title="Student not found" body="Return to the students list and select another profile." />;
  const rows = initialMarks.filter((mark) => mark.studentId === student.id);
  const records = attendanceRecords.filter((record) => record.studentId === student.id);
  const fee = fees.find((entry) => entry.studentId === student.id);
  const present = records.filter((record) => record.status === 'Present').length;

  return (
    <div className="stack">
      <button className="backButton" onClick={() => navigate('students')}><ChevronLeft size={18} />Students</button>
      <section className="profileHero">
        <Avatar name={student.name} size={64} />
        <h2>{student.name}</h2>
        <p>Class {student.class}{student.section} - Roll {student.rollNo}</p>
      </section>
      <div className="tabs">{['profile', 'attendance', 'marks', 'fees', 'documents'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === 'profile' && <section className="card detailGrid">
        <ListRow title="Guardian" meta={student.guardianName} right={student.guardianPhone} />
        <ListRow title="Email" meta={student.guardianEmail} />
        <ListRow title="DOB" meta={student.dob} right={student.bloodGroup} />
        <ListRow title="Address" meta={student.address} />
      </section>}
      {tab === 'attendance' && <section className="card">
        <div className="metricGrid three"><Metric label="Present" value={present} icon={<Check size={18} />} /><Metric label="Absent" value={records.filter((r) => r.status === 'Absent').length} icon={<X size={18} />} /><Metric label="Late" value={records.filter((r) => r.status === 'Late').length} icon={<AlertCircle size={18} />} /></div>
        <div className="calendarGrid">{Array.from({ length: 28 }, (_, i) => {
          const date = `2025-02-${String(i + 1).padStart(2, '0')}`;
          const record = records.find((entry) => entry.date === date);
          return <span key={date} className={record?.status?.toLowerCase() || 'empty'}>{i + 1}</span>;
        })}</div>
      </section>}
      {tab === 'marks' && <section className="card">{['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam'].map((exam) => {
        const examRows = rows.filter((row) => row.exam === exam);
        return <ListRow key={exam} title={exam} meta={`${examRows.length} subjects`} right={`${Math.round(examRows.reduce((s, r) => s + r.scored, 0) / Math.max(1, examRows.reduce((s, r) => s + r.maxMarks, 0)) * 100)}%`} />;
      })}</section>}
      {tab === 'fees' && <section className="card">
        <ListRow title="Total fee" meta={currency(fee?.totalAmount || 0)} />
        <ListRow title="Paid" meta={currency(fee?.amountPaid || 0)} right={fee?.status} />
        <ListRow title="Balance" meta={currency(fee?.balance || 0)} right={fee?.dueDate} />
      </section>}
      {tab === 'documents' && <section className="card"><ListRow title="Admission form" meta="Verified" right="PDF" /><ListRow title="Birth certificate" meta="Verified" right="PDF" /><ListRow title="Transfer certificate" meta="Not uploaded" right="-" /></section>}
    </div>
  );
}

function TeachersScreen({ user, teachers, setTeachers }: RouteProps) {
  const canManage = user.role === 'admin' || user.role === 'teacher';
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Teacher | null>(null);
  const filtered = teachers.filter((teacher) => !query || teacher.name.toLowerCase().includes(query.toLowerCase()) || teacher.employeeId.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="stack">
      <SearchBox value={query} onChange={setQuery} placeholder="Search teachers" />
      <div className="sectionTitle"><h2>{filtered.length} teachers</h2>{canManage && <button className="smallPrimary" onClick={() => setEditing(blankTeacher())}><Plus size={16} />Add</button>}</div>
      {filtered.map((teacher) => <article className="card teacherCard" key={teacher.id}>
        <div className="rowHeader"><Avatar name={teacher.name} /><div><h3>{teacher.name}</h3><p>{teacher.employeeId} - {teacher.qualification}</p></div><Badge label={teacher.status} tone={teacher.status === 'Active' ? 'good' : 'warn'} /></div>
        <div className="tagRow">{teacher.subjects.map((subject) => <span key={subject}>{subject}</span>)}</div>
        <ListRow title="Class assigned" meta={teacher.classAssigned} right={currency(teacher.salary)} />
        {canManage && <div className="cardActions"><button onClick={() => setEditing(teacher)}><Pencil size={16} />Edit</button></div>}
      </article>)}
      {editing && <TeacherForm teacher={editing} onClose={() => setEditing(null)} onSave={(next) => {
        setTeachers((prev) => prev.some((item) => item.id === next.id) ? prev.map((item) => item.id === next.id ? next : item) : [next, ...prev]);
        setEditing(null);
      }} />}
    </div>
  );
}

function blankTeacher(): Teacher {
  return { id: `t${Date.now()}`, name: '', employeeId: '', subjects: [], classAssigned: '', qualification: '', phone: '', email: '', joinDate: '', salary: 0, status: 'Active' };
}

function TeacherForm({ teacher, onClose, onSave }: { teacher: Teacher; onClose: () => void; onSave: (teacher: Teacher) => void }) {
  const [form, setForm] = useState<Teacher>(teacher);
  return <Sheet title={teacher.name ? 'Edit teacher' : 'Add teacher'} onClose={onClose}>
    <div className="formGrid">
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
      <input placeholder="Class assigned" value={form.classAssigned} onChange={(e) => setForm({ ...form, classAssigned: e.target.value })} />
      <input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="number" placeholder="Salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
    </div>
    <div className="tagPicker">{subjects.map((subject) => <button key={subject} className={form.subjects.includes(subject) ? 'selected' : ''} onClick={() => setForm({ ...form, subjects: form.subjects.includes(subject) ? form.subjects.filter((item) => item !== subject) : [...form.subjects, subject] })}>{subject}</button>)}</div>
    <button className="primaryButton" disabled={!form.name} onClick={() => onSave(form)}>Save teacher</button>
  </Sheet>;
}

function AttendanceScreen({ user, students }: { user: User; students: Student[] }) {
  const canMark = user.role === 'admin' || user.role === 'teacher';
  const [mode, setMode] = useState(canMark ? 'mark' : 'report');
  const [klass, setKlass] = useState('9');
  const [section, setSection] = useState('A');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const classStudents = students.filter((student) => student.class === klass && student.section === section);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const loaded = Object.keys(attendance).length > 0;
  const setAll = (status: string) => setAttendance(Object.fromEntries(classStudents.map((student) => [student.id, status])));

  return <div className="stack">
    <div className="tabs"><button className={mode === 'mark' ? 'active' : ''} disabled={!canMark} onClick={() => setMode('mark')}>Mark</button><button className={mode === 'report' ? 'active' : ''} onClick={() => setMode('report')}>Reports</button></div>
    {mode === 'mark' && <section className="card">
      <div className="formGrid compact"><select value={klass} onChange={(e) => setKlass(e.target.value)}>{classes.map((c) => <option key={c}>{c}</option>)}</select><select value={section} onChange={(e) => setSection(e.target.value)}>{sections.map((s) => <option key={s}>{s}</option>)}</select><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <button className="primaryButton" onClick={() => setAll('Present')}>Load students</button>
      {loaded && <><div className="actionRow"><button onClick={() => setAll('Present')}>All present</button><button onClick={() => setAll('Absent')}>All absent</button><button onClick={() => setAll('Late')}>All late</button></div>{classStudents.map((student) => <div className="attendanceRow" key={student.id}><div><strong>{student.name}</strong><span>Roll {student.rollNo}</span></div>{['Present', 'Absent', 'Late'].map((status) => <button key={status} className={attendance[student.id] === status ? status.toLowerCase() : ''} onClick={() => setAttendance({ ...attendance, [student.id]: status })}>{status[0]}</button>)}</div>)}<button className="primaryButton">Submit attendance for {date}</button></>}
    </section>}
    {mode === 'report' && <section className="card">
      <div className="sectionTitle"><h2>Weekly trend</h2><button className="smallGhost" onClick={() => downloadCSV('attendance_report.csv', students.map((s) => ({ Name: s.name, RollNo: s.rollNo, Class: `${s.class}${s.section}`, Attendance: s.attendancePercent })))}><Download size={15} />CSV</button></div>
      <div className="bars">{weeklyAttendance.map((day) => <div key={day.day}><span style={{ height: `${day.percentage}%` }} /><em>{day.day}</em></div>)}</div>
      {students.slice(0, 10).map((student) => <ListRow key={student.id} title={student.name} meta={`Class ${student.class}${student.section}`} right={`${student.attendancePercent}%`} />)}
    </section>}
  </div>;
}

function MarksScreen({ user, students }: { user: User; students: Student[] }) {
  const canEnter = user.role === 'admin' || user.role === 'teacher';
  const [mode, setMode] = useState(canEnter ? 'enter' : 'view');
  const [exam, setExam] = useState('Unit Test 1');
  const [klass, setKlass] = useState('9');
  const [section, setSection] = useState('A');
  const [subject, setSubject] = useState('Mathematics');
  const [scores, setScores] = useState<Record<string, number>>({});
  const classStudents = students.filter((student) => student.class === klass && student.section === section);
  const maxMarks = exam.includes('Unit') ? 25 : 100;
  const load = () => setScores(Object.fromEntries(classStudents.map((student) => [student.id, initialMarks.find((m) => m.studentId === student.id && m.exam === exam && m.subject === subject)?.scored || 0])));

  return <div className="stack">
    <div className="tabs"><button className={mode === 'enter' ? 'active' : ''} disabled={!canEnter} onClick={() => setMode('enter')}>Enter</button><button className={mode === 'view' ? 'active' : ''} onClick={() => setMode('view')}>View</button></div>
    <section className="card">
      <div className="formGrid compact"><select value={exam} onChange={(e) => setExam(e.target.value)}>{['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam'].map((x) => <option key={x}>{x}</option>)}</select><select value={klass} onChange={(e) => setKlass(e.target.value)}>{classes.map((c) => <option key={c}>{c}</option>)}</select><select value={section} onChange={(e) => setSection(e.target.value)}>{sections.map((s) => <option key={s}>{s}</option>)}</select>{mode === 'enter' && <select value={subject} onChange={(e) => setSubject(e.target.value)}>{subjects.map((s) => <option key={s}>{s}</option>)}</select>}</div>
      {mode === 'enter' ? <><button className="primaryButton" onClick={load}>Load marks</button>{Object.keys(scores).length > 0 && classStudents.map((student) => <div className="scoreRow" key={student.id}><div><strong>{student.name}</strong><span>Max {maxMarks}</span></div><input type="number" min={0} max={maxMarks} value={scores[student.id]} onChange={(e) => setScores({ ...scores, [student.id]: Number(e.target.value) })} /><Badge label={`${Math.round(((scores[student.id] || 0) / maxMarks) * 100)}%`} tone="info" /></div>)}{Object.keys(scores).length > 0 && <button className="primaryButton">Save marks</button>}</> : classStudents.map((student) => <ListRow key={student.id} title={student.name} meta={`Class ${student.class}${student.section}`} right={`${averageForStudent(student.id)}%`} />)}
    </section>
  </div>;
}

function ExamsScreen({ user, exams, setExams }: { user: User; exams: ExamSchedule[]; setExams: React.Dispatch<React.SetStateAction<ExamSchedule[]>> }) {
  const canManage = user.role === 'admin' || user.role === 'teacher';
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ExamSchedule | null>(null);
  const filtered = exams.filter((exam) => !query || `${exam.name} ${exam.class} ${exam.section} ${exam.description}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="stack"><SearchBox value={query} onChange={setQuery} placeholder="Search exams" /><div className="sectionTitle"><h2>{filtered.length} exams</h2>{canManage && <button className="smallPrimary" onClick={() => setEditing({ id: `e${Date.now()}`, name: '', class: '9', section: 'A', date: '', description: '' })}><Plus size={16} />Add</button>}</div>{filtered.map((exam) => <article className="card" key={exam.id}><ListRow title={exam.name} meta={`Class ${exam.class}${exam.section || ''} - ${exam.description || 'No description'}`} right={exam.date} />{canManage && <div className="cardActions"><button onClick={() => setEditing(exam)}><Pencil size={16} />Edit</button><button className="dangerText" onClick={() => setExams((prev) => prev.filter((item) => item.id !== exam.id))}><Trash2 size={16} />Delete</button></div>}</article>)}{editing && <ExamForm exam={editing} onClose={() => setEditing(null)} onSave={(next) => { setExams((prev) => prev.some((item) => item.id === next.id) ? prev.map((item) => item.id === next.id ? next : item) : [next, ...prev]); setEditing(null); }} />}</div>;
}

function ExamForm({ exam, onClose, onSave }: { exam: ExamSchedule; onClose: () => void; onSave: (exam: ExamSchedule) => void }) {
  const [form, setForm] = useState(exam);
  return <Sheet title={exam.name ? 'Edit exam' : 'Add exam'} onClose={onClose}><div className="formGrid"><input placeholder="Exam name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>{classes.map((c) => <option key={c}>{c}</option>)}</select><select value={form.section || ''} onChange={(e) => setForm({ ...form, section: e.target.value })}>{sections.map((s) => <option key={s}>{s}</option>)}</select><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><textarea placeholder="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><button className="primaryButton" disabled={!form.name || !form.date} onClick={() => onSave(form)}>Save exam</button></Sheet>;
}

function TimetableScreen({ user }: { user: User }) {
  const [klass, setKlass] = useState('9');
  const [section, setSection] = useState('A');
  const [editMode, setEditMode] = useState(false);
  const key = `${klass}${section}`;
  const schedule = timetable[key] || timetable['9A'];
  return <div className="stack"><section className="card"><div className="formGrid compact"><select value={klass} onChange={(e) => setKlass(e.target.value)}>{classes.map((c) => <option key={c}>{c}</option>)}</select><select value={section} onChange={(e) => setSection(e.target.value)}>{sections.map((s) => <option key={s}>{s}</option>)}</select></div>{(user.role === 'admin' || user.role === 'teacher') && <button className="primaryButton" onClick={() => setEditMode(!editMode)}>{editMode ? 'Save timetable' : 'Edit timetable'}</button>}</section>{schedule.map((day) => <section className="card timetableDay" key={day.day}><div className="sectionTitle"><h2>{day.day}</h2></div>{day.periods.map((period) => <div className={period.isBreak ? 'period break' : 'period'} key={`${day.day}-${period.period}`}><strong>{period.time}</strong><div><span>{period.subject}</span><em>{period.teacher || 'Break time'}</em></div>{editMode && <Pencil size={15} />}</div>)}</section>)}</div>;
}

function FeesScreen({ user, students, fees, setFees }: { user: User; students: Student[]; fees: Fee[]; setFees: React.Dispatch<React.SetStateAction<Fee[]>> }) {
  const canRecord = user.role === 'admin' || user.role === 'accountant';
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [paymentFor, setPaymentFor] = useState<Fee | null>(null);
  const filtered = fees.filter((fee) => {
    const student = students.find((s) => s.id === fee.studentId);
    return (!query || student?.name.toLowerCase().includes(query.toLowerCase())) && (!status || fee.status === status);
  });
  const collected = fees.reduce((sum, fee) => sum + fee.amountPaid, 0);
  const pending = fees.reduce((sum, fee) => sum + fee.balance, 0);
  return <div className="stack"><div className="metricGrid"><Metric label="Collected" value={currency(collected)} icon={<CreditCard size={18} />} /><Metric label="Pending" value={currency(pending)} icon={<AlertCircle size={18} />} /></div><SearchBox value={query} onChange={setQuery} placeholder="Search fee records" /><div className="filterBar"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All status</option>{['Paid', 'Partially Paid', 'Due', 'Overdue'].map((x) => <option key={x}>{x}</option>)}</select></div>{filtered.map((fee) => { const student = students.find((s) => s.id === fee.studentId); return <article className="card" key={fee.studentId}><ListRow title={student?.name || 'Student'} meta={`Paid ${currency(fee.amountPaid)} of ${currency(fee.totalAmount)}`} right={fee.status} /><div className="progress"><span style={{ width: `${(fee.amountPaid / fee.totalAmount) * 100}%` }} /></div><ListRow title="Balance" meta={currency(fee.balance)} right={fee.dueDate} /><div className="cardActions"><button onClick={() => alert(fee.paymentHistory.map((p) => `${p.receiptNo}: ${currency(p.amount)}`).join('\n') || 'No payments yet')}>History</button>{canRecord && fee.balance > 0 && <button onClick={() => setPaymentFor(fee)}>Record payment</button>}</div></article>; })}{paymentFor && <PaymentSheet fee={paymentFor} student={students.find((s) => s.id === paymentFor.studentId)} user={user} onClose={() => setPaymentFor(null)} onSave={(updated) => { setFees((prev) => prev.map((fee) => fee.studentId === updated.studentId ? updated : fee)); setPaymentFor(null); }} />}</div>;
}

function PaymentSheet({ fee, student, user, onClose, onSave }: { fee: Fee; student?: Student; user: User; onClose: () => void; onSave: (fee: Fee) => void }) {
  const [amount, setAmount] = useState(fee.balance);
  const [mode, setMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const save = () => {
    const paid = Math.min(amount, fee.balance);
    const receipt: PaymentRecord = { id: `pay-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: paid, mode, receiptNo: `RCP-${Math.floor(Math.random() * 9000) + 1000}`, recordedBy: user.role, remarks };
    const balance = fee.balance - paid;
    onSave({ ...fee, amountPaid: fee.amountPaid + paid, balance, status: balance === 0 ? 'Paid' : 'Partially Paid', paymentHistory: [receipt, ...fee.paymentHistory] });
  };
  return <Sheet title={`Payment - ${student?.name || 'Student'}`} onClose={onClose}><div className="formGrid"><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><select value={mode} onChange={(e) => setMode(e.target.value)}>{paymentModes.map((m) => <option key={m}>{m}</option>)}</select><textarea placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div><button className="primaryButton" onClick={save}>Save payment</button></Sheet>;
}

function LeavesScreen({ user, leaves, setLeaves }: { user: User; leaves: LeaveRecord[]; setLeaves: React.Dispatch<React.SetStateAction<LeaveRecord[]>> }) {
  const canApprove = user.role === 'admin';
  const [tab, setTab] = useState(canApprove ? 'pending' : 'my');
  const [showForm, setShowForm] = useState(false);
  const shown = tab === 'pending' ? leaves.filter((l) => l.status === 'Pending') : tab === 'my' ? leaves.filter((l) => l.applicantName === user.name) : leaves;
  const updateStatus = (id: string, status: 'Approved' | 'Rejected') => setLeaves((prev) => prev.map((leave) => leave.id === id ? { ...leave, status } : leave));
  return <div className="stack"><div className="tabs">{canApprove && <button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>Pending</button>}{canApprove && <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>All</button>}<button className={tab === 'my' ? 'active' : ''} onClick={() => setTab('my')}>Mine</button></div>{user.role !== 'parent' && <button className="primaryButton" onClick={() => setShowForm(true)}><Plus size={17} />Apply for leave</button>}{shown.map((leave) => <article className="card" key={leave.id}><ListRow title={leave.applicantName} meta={`${leave.leaveType} - ${leave.fromDate} to ${leave.toDate}`} right={`${leave.days}d`} /><p className="muted">{leave.reason}</p><div className="cardActions"><Badge label={leave.status} tone={leave.status === 'Approved' ? 'good' : leave.status === 'Rejected' ? 'bad' : 'warn'} />{canApprove && leave.status === 'Pending' && <><button onClick={() => updateStatus(leave.id, 'Approved')}>Approve</button><button className="dangerText" onClick={() => updateStatus(leave.id, 'Rejected')}>Reject</button></>}</div></article>)}{showForm && <LeaveForm user={user} onClose={() => setShowForm(false)} onSave={(leave) => { setLeaves((prev) => [leave, ...prev]); setShowForm(false); }} />}</div>;
}

function LeaveForm({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (leave: LeaveRecord) => void }) {
  const [form, setForm] = useState({ leaveType: 'Sick', fromDate: '', toDate: '', reason: '' });
  const submit = () => {
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1);
    onSave({ id: `l${Date.now()}`, applicantId: user.id, applicantName: user.name, applicantRole: user.role, leaveType: form.leaveType, fromDate: form.fromDate, toDate: form.toDate, days, reason: form.reason, status: 'Pending', appliedOn: new Date().toISOString().split('T')[0] });
  };
  return <Sheet title="Apply for leave" onClose={onClose}><div className="formGrid"><select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>{['Sick', 'Casual', 'Emergency', 'Other'].map((x) => <option key={x}>{x}</option>)}</select><input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} /><input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} /><textarea placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div><button className="primaryButton" disabled={!form.fromDate || !form.toDate || !form.reason} onClick={submit}>Submit request</button></Sheet>;
}

function AnnouncementsScreen({ user, announcements, setAnnouncements }: { user: User; announcements: Announcement[]; setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>> }) {
  const [showForm, setShowForm] = useState(false);
  const sorted = [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  return <div className="stack">{user.role === 'admin' && <button className="primaryButton" onClick={() => setShowForm(true)}><Plus size={17} />Post announcement</button>}{sorted.map((item) => <article className={item.pinned ? 'card announcement pinned' : 'card announcement'} key={item.id}><div className="sectionTitle"><h2>{item.title}</h2><Badge label={item.priority} tone={item.priority === 'Urgent' ? 'bad' : item.priority === 'Important' ? 'warn' : 'neutral'} /></div><p>{item.body}</p><div className="tagRow">{item.audience.map((audience) => <span key={audience}>{audience}</span>)}</div><small>Posted by {item.postedBy}</small></article>)}{showForm && <AnnouncementForm onClose={() => setShowForm(false)} onSave={(item) => { setAnnouncements((prev) => [item, ...prev]); setShowForm(false); }} />}</div>;
}

function AnnouncementForm({ onClose, onSave }: { onClose: () => void; onSave: (announcement: Announcement) => void }) {
  const [form, setForm] = useState({ title: '', body: '', priority: 'Normal' as Announcement['priority'], audience: ['All'] });
  return <Sheet title="New announcement" onClose={onClose}><div className="formGrid"><input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><textarea placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Announcement['priority'] })}><option>Normal</option><option>Important</option><option>Urgent</option></select></div><div className="tagPicker">{['All', 'Students', 'Parents', 'Teachers'].map((audience) => <button key={audience} className={form.audience.includes(audience) ? 'selected' : ''} onClick={() => setForm({ ...form, audience: form.audience.includes(audience) ? form.audience.filter((x) => x !== audience) : [...form.audience, audience] })}>{audience}</button>)}</div><button className="primaryButton" disabled={!form.title || !form.body} onClick={() => onSave({ id: `a${Date.now()}`, title: form.title, body: form.body, audience: form.audience, priority: form.priority, postedBy: 'Admin', postedAt: new Date().toISOString(), pinned: false })}>Post</button></Sheet>;
}

function NotificationsScreen({ user, notifications, setNotifications }: { user: User; notifications: Notification[]; setNotifications: React.Dispatch<React.SetStateAction<Notification[]>> }) {
  const [tab, setTab] = useState('all');
  const roleNotes = notifications.filter((note) => note.forRole.includes(user.role));
  const filtered = tab === 'all' ? roleNotes : tab === 'unread' ? roleNotes.filter((note) => !note.read) : roleNotes.filter((note) => note.type === tab);
  const markRead = (id: string) => setNotifications((prev) => prev.map((note) => note.id === id ? { ...note, read: true } : note));
  return <div className="stack"><div className="tabs scroll">{['all', 'unread', 'fee', 'attendance', 'announcement', 'leave', 'general'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div><button className="smallGhost" onClick={() => setNotifications((prev) => prev.map((note) => note.forRole.includes(user.role) ? { ...note, read: true } : note))}>Mark all read</button>{filtered.map((note) => <article className={note.read ? 'card notification' : 'card notification unread'} key={note.id} onClick={() => markRead(note.id)}><div className="sectionTitle"><h2>{note.title}</h2><Badge label={note.type} tone={note.read ? 'neutral' : 'info'} /></div><p>{note.message}</p><small>{new Date(note.time).toLocaleString()}</small></article>)}</div>;
}

function ReportsScreen({ students }: { students: Student[] }) {
  const [selected, setSelected] = useState('fee');
  const reportRows = selected === 'fee' ? monthlyFeeCollection.map((m) => ({ Month: m.month, Amount: m.amount })) : selected === 'attendance' ? students.map((s) => ({ Name: s.name, Attendance: s.attendancePercent })) : students.map((s) => ({ Name: s.name, Class: `${s.class}${s.section}`, Average: averageForStudent(s.id) }));
  return <div className="stack"><div className="moduleGrid three">{[{ id: 'fee', label: 'Fee' }, { id: 'attendance', label: 'Attendance' }, { id: 'marks', label: 'Marks' }].map((item) => <button className={selected === item.id ? 'module active' : 'module'} key={item.id} onClick={() => setSelected(item.id)}><Download size={19} /><span>{item.label}</span></button>)}</div><section className="card"><div className="sectionTitle"><h2>{selected} report</h2><button className="smallPrimary" onClick={() => downloadCSV(`${selected}_report.csv`, reportRows)}><Download size={15} />Export</button></div>{reportRows.slice(0, 8).map((row, index) => <ListRow key={index} title={String(Object.values(row)[0])} meta={Object.entries(row).slice(1).map(([k, v]) => `${k}: ${v}`).join(' - ')} />)}</section></div>;
}

function ProfileScreen({ user }: { user: User }) {
  const [profile, setProfile] = useState({ name: user.name, phone: '9876543210', dob: '1985-05-15', address: '42, MG Road, New Delhi' });
  const [password, setPassword] = useState({ old: '', next: '', confirm: '' });
  return <div className="stack"><section className="profileHero"><Avatar name={profile.name} size={72} /><h2>{profile.name}</h2><p>{user.email}</p><Badge label={user.role} tone="info" /></section><section className="card formGrid"><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /><input type="date" value={profile.dob} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} /><textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /><button className="primaryButton">Save profile</button></section><section className="card formGrid"><input type="password" placeholder="Old password" value={password.old} onChange={(e) => setPassword({ ...password, old: e.target.value })} /><input type="password" placeholder="New password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} /><input type="password" placeholder="Confirm password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} /><div className="progress"><span style={{ width: `${Math.min(100, password.next.length * 8)}%` }} /></div><button className="primaryButton" disabled={!password.next || password.next !== password.confirm}>Update password</button></section></div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="searchBox"><Search size={18} /><input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>;
}
