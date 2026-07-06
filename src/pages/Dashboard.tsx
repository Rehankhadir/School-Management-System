import { useAuth } from '@/context/AuthContext';
import { useStudents } from '@/context/StudentsContext';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';
import {
  Users, GraduationCap, DollarSign, AlertTriangle,
  UserPlus, CreditCard, Megaphone, FileText, Phone,
  BookOpen, CalendarCheck, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { monthlyFeeCollection, weeklyAttendance, announcements, marks, fees, notifications, leaves, exams } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'white', padding: '8px 16px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5' }}>₹{(payload[0].value / 1000).toFixed(0)}K</p>
      </div>
    );
  }
  return null;
};

const AttTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'white', padding: '8px 16px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)', padding: 24,
};

function AdminDashboard() {
  const { students } = useStudents();
  const navigate = useNavigate();
  const lowAttendance = students.filter((s) => s.attendancePercent < 80).slice(0, 5);
  const recentAnnouncements = announcements.slice(0, 4);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's your school overview." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Students" value={1240} icon={<Users size={24} color="#4f46e5" />} iconBg="bg-indigo-100" trend={{ value: 12, isUp: true }} delay={0} />
        <StatCard label="Total Teachers" value={86} icon={<GraduationCap size={24} color="#059669" />} iconBg="bg-emerald-100" trend={{ value: 4, isUp: true }} delay={1} />
        <StatCard label="Revenue This Month" value={580000} prefix="₹" icon={<DollarSign size={24} color="#d97706" />} iconBg="bg-amber-100" trend={{ value: 8, isUp: true }} delay={2} />
        <StatCard label="Pending Fees" value={245000} prefix="₹" icon={<AlertTriangle size={24} color="#e11d48" />} iconBg="bg-rose-100" trend={{ value: 3, isUp: false }} delay={3} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Monthly Fee Collection</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyFeeCollection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Weekly Attendance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[75, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<AttTooltip />} />
              <defs>
                <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={2} fill="url(#colorAtt)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Low Attendance Students</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lowAttendance.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 12 }} className="hover:bg-gray-50">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={s.name} size="sm" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Class {s.class}{s.section} · {s.attendancePercent}%</div>
                  </div>
                </div>
                <button style={{ padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#4f46e5' }} className="hover:bg-indigo-50">
                  <Phone size={16} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Recent Announcements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentAnnouncements.map((a) => (
              <div key={a.id} style={{ padding: 12, borderRadius: 12, border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge variant={a.priority === 'Urgent' ? 'danger' : a.priority === 'Important' ? 'warning' : 'neutral'} showDot>{a.priority}</Badge>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(a.postedAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{a.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{a.body.slice(0, 80)}...</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
          {[
            { icon: <UserPlus size={20} />, label: 'Add Student', color: '#eef2ff', textColor: '#4f46e5', path: '/students' },
            { icon: <CreditCard size={20} />, label: 'Record Payment', color: '#ecfdf5', textColor: '#059669', path: '/fees' },
            { icon: <Megaphone size={20} />, label: 'Post Announcement', color: '#fffbeb', textColor: '#d97706', path: '/announcements' },
            { icon: <FileText size={20} />, label: 'Generate Report', color: '#faf5ff', textColor: '#9333ea', path: '/reports' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: 16, borderRadius: 12, border: '1px solid #f3f4f6',
                cursor: 'pointer', background: 'white', transition: 'all 0.15s',
              }}
              className="hover:shadow-md"
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: action.color, color: action.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {action.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const { students } = useStudents();
  const teachingStudents = students.filter((student) => ['9', '10'].includes(student.class));
  const myLeaves = leaves.filter((leave) => leave.applicantId === user?.id && leave.applicantRole === 'Teacher' && leave.status !== 'Rejected');
  const usedLeaveDays = myLeaves.reduce((sum, leave) => sum + leave.days, 0);
  const maxLeaveDays = 18;
  const remainingLeaveDays = Math.max(0, maxLeaveDays - usedLeaveDays);
  const teacherAttendance = Math.max(70, 100 - usedLeaveDays * 1.5);

  const studentSummaries = teachingStudents
    .map((student) => {
      const studentMarks = marks.filter((mark) => mark.studentId === student.id);
      if (!studentMarks.length) return null;
      const averageScore = studentMarks.reduce((sum, mark) => sum + (mark.scored / mark.maxMarks) * 100, 0) / studentMarks.length;
      const lowSubjects = Array.from(new Set(studentMarks
        .filter((mark) => (mark.scored / mark.maxMarks) * 100 < 60)
        .map((mark) => mark.subject)
      ));
      const gradeBand = averageScore >= 90 ? 'A+' : averageScore >= 80 ? 'A' : averageScore >= 70 ? 'B' : averageScore >= 60 ? 'C' : averageScore >= 50 ? 'D' : 'F';
      return { student, averageScore, lowSubjects, gradeBand };
    })
    .filter((entry): entry is { student: typeof students[number]; averageScore: number; lowSubjects: string[]; gradeBand: string } => entry !== null);

  const classAverageScore = studentSummaries.length
    ? studentSummaries.reduce((sum, entry) => sum + entry.averageScore, 0) / studentSummaries.length
    : 0;

  const belowTargetCount = studentSummaries.filter((entry) => entry.averageScore < 60).length;

  const gradeDistribution = studentSummaries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.gradeBand] = (acc[entry.gradeBand] || 0) + 1;
    return acc;
  }, {});

  const weakSubjects = Object.entries(
    marks
      .filter((mark) => teachingStudents.some((student) => student.id === mark.studentId))
      .reduce<Record<string, { total: number; count: number }>>((acc, mark) => {
        const percent = (mark.scored / mark.maxMarks) * 100;
        if (!acc[mark.subject]) acc[mark.subject] = { total: 0, count: 0 };
        acc[mark.subject].total += percent;
        acc[mark.subject].count += 1;
        return acc;
      }, {})
  )
    .map(([subject, data]) => ({ subject, avg: data.total / data.count }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  const lowAttendanceStudents = teachingStudents
    .filter((student) => student.attendancePercent < 85)
    .slice(0, 4);

  const attentionStudents = studentSummaries
    .filter((entry) => entry.averageScore < 60)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 5);

  const recentAssessments = marks
    .filter((mark) => teachingStudents.some((student) => student.id === mark.studentId))
    .slice(-5)
    .reverse();

  const upcomingExams = exams
    .filter((e) => teachingStudents.some((s) => s.class === e.class))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((e) => `${e.name} - ${new Date(e.date).toLocaleDateString()}`);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Welcome back, Teacher!" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="My Classes" value={3} icon={<BookOpen size={24} color="#4f46e5" />} iconBg="bg-indigo-100" delay={0} />
        <StatCard label="Total Students" value={teachingStudents.length} icon={<Users size={24} color="#059669" />} iconBg="bg-emerald-100" delay={1} />
        <StatCard label="Teacher Attendance" value={Math.round(teacherAttendance)} suffix="%" icon={<CalendarCheck size={24} color="#d97706" />} iconBg="bg-amber-100" delay={2} />
        <StatCard label="Leaves Used" value={usedLeaveDays} suffix="days" icon={<Clock size={24} color="#9333ea" />} iconBg="bg-purple-100" delay={3} />
        <StatCard label="Leaves Available" value={remainingLeaveDays} suffix="days" icon={<Clock size={24} color="#10b981" />} iconBg="bg-emerald-100" delay={4} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Class Attendance Snapshot</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Average Attendance</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>{Math.round(teachingStudents.reduce((sum, student) => sum + student.attendancePercent, 0) / teachingStudents.length)}%</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Low Attendance</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#e11d48' }}>{lowAttendanceStudents.length}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lowAttendanceStudents.map((student) => (
              <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>{student.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e11d48' }}>{student.attendancePercent}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Weakest Subjects</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {weakSubjects.map((subject) => (
              <div key={subject.subject} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid #f3f4f6', backgroundColor: '#fff7ed' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{subject.subject}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{subject.avg.toFixed(0)}% average score</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>At-Risk Students</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {attentionStudents.length > 0 ? attentionStudents.map(({ student, averageScore, lowSubjects }) => (
              <div key={student.id} style={{ padding: 14, borderRadius: 14, border: '1px solid #f3f4f6', backgroundColor: '#fef2f2' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{student.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Class {student.class}{student.section}</div>
                  </div>
                  <Badge variant="danger">{averageScore.toFixed(0)}%</Badge>
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>Needs support in: {lowSubjects.length ? lowSubjects.join(', ') : 'multiple subjects'}</div>
              </div>
            )) : (
              <div style={{ padding: 16, borderRadius: 14, backgroundColor: '#f8fafc', color: '#475569' }}>No at-risk students detected in your current classes.</div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Grade Band Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['A+', 'A', 'B', 'C', 'D', 'F'].map((band) => (
              <div key={band} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 12, backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>{band}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{gradeDistribution[band] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Upcoming Assessments</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {upcomingExams.map((exam) => (
              <div key={exam} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid #f3f4f6', backgroundColor: '#eff6ff' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8' }}>{exam}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Recent Assessment Results</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentAssessments.map((result, index) => (
              <div key={`${result.studentId}-${index}`} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid #f3f4f6', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{result.subject}</span>
                  <span style={{ fontSize: 13, color: '#059669' }}>{result.scored}/{result.maxMarks}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{result.exam} · {students.find((student) => student.id === result.studentId)?.name || 'Student'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function StudentDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Welcome back, Student!" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Attendance" value={92} suffix="%" icon={<CalendarCheck size={24} color="#059669" />} iconBg="bg-emerald-100" delay={0} />
        <StatCard label="Total Subjects" value={8} icon={<BookOpen size={24} color="#4f46e5" />} iconBg="bg-indigo-100" delay={1} />
        <StatCard label="Fee Paid" value={40000} prefix="₹" icon={<DollarSign size={24} color="#d97706" />} iconBg="bg-amber-100" delay={2} />
        <StatCard label="Class Rank" value={5} icon={<Users size={24} color="#9333ea" />} iconBg="bg-purple-100" delay={3} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Upcoming Exams</h3>
          {['Final Exam - April 1', 'Practical Exam - April 10', 'Viva - April 15'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', border: '1px solid #f3f4f6', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
              <span style={{ fontSize: 14, color: '#374151' }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Recent Marks</h3>
          {[{ sub: 'Mathematics', marks: '22/25', grade: 'A' }, { sub: 'Science', marks: '20/25', grade: 'A' }, { sub: 'English', marks: '18/25', grade: 'B' }].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#374151' }}>{item.sub}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{item.marks}</span>
                <Badge variant={item.grade === 'A' ? 'success' : 'info'}>{item.grade}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ParentDashboard() {
  const { user } = useAuth();
  const { students } = useStudents();
  const child = students.find((student) => (
    student.guardianEmail.trim().toLowerCase() === (user?.email || '').trim().toLowerCase() ||
    student.guardianName.trim().toLowerCase() === (user?.name || '').trim().toLowerCase()
  )) || students[0];
  const childMarks = marks.filter((mark) => mark.studentId === child.id);
  const childAverage = childMarks.length
    ? childMarks.reduce((sum, mark) => sum + (mark.scored / mark.maxMarks) * 100, 0) / childMarks.length
    : 0;
  const childFee = fees.find((fee) => fee.studentId === child.id);
  const feeDue = childFee?.balance ?? 0;
  const feeStatusLabel = childFee?.status ?? 'Unknown';
  const childNotifications = notifications.filter((note) => note.forRole.includes('parent'));
  const unreadNotifications = childNotifications.filter((note) => !note.read).length;
  const recentGrades = childMarks
    .sort((a, b) => (a.exam > b.exam ? 1 : -1))
    .slice(-3)
    .reverse();
  const upcomingExams = exams
    .filter((e) => e.class === child.class && (!e.section || e.section === child.section))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  const nextExam = upcomingExams[0];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Track your child's progress" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Child's Attendance" value={child.attendancePercent} suffix="%" icon={<CalendarCheck size={24} color="#059669" />} iconBg="bg-emerald-100" delay={0} />
        <StatCard label="Fee Due" value={feeDue} prefix="₹" icon={<DollarSign size={24} color="#d97706" />} iconBg="bg-amber-100" delay={1} />
        <StatCard label="Avg Score" value={Math.round(childAverage)} suffix="%" icon={<GraduationCap size={24} color="#4f46e5" />} iconBg="bg-indigo-100" delay={2} />
        <StatCard label="Unread Alerts" value={unreadNotifications} icon={<Megaphone size={24} color="#9333ea" />} iconBg="bg-purple-100" delay={3} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Child Summary</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ padding: '14px 16px', borderRadius: 16, border: '1px solid #f3f4f6', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Name</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{child.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Class {child.class}{child.section}</div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 16, border: '1px solid #f3f4f6', backgroundColor: '#fff7ed' }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Fee Status</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{feeStatusLabel}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Next due: {childFee?.dueDate ?? 'N/A'}</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Performance Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Average score</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#4f46e5' }}>{Math.round(childAverage)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Next exam</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                {nextExam ? `${nextExam.name}${nextExam.subject ? ` - ${nextExam.subject}` : ''} - ${new Date(nextExam.date).toLocaleDateString()}` : 'No upcoming exam'}
              </span>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 14, backgroundColor: '#eef2ff' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>Recent grades</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {recentGrades.length ? recentGrades.map((grade, index) => (
                  <div key={`${grade.studentId}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155' }}>
                    <span>{grade.subject}</span>
                    <span>{grade.scored}/{grade.maxMarks}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: 13, color: '#64748b' }}>No recent grades available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Upcoming Exams</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {upcomingExams.map((exam) => (
              <div key={exam.id} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid #f3f4f6', backgroundColor: '#eff6ff' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8' }}>{exam.name}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Class {exam.class}{exam.section || ''} · {new Date(exam.date).toLocaleDateString()}</div>
              </div>
            ))}
            {!upcomingExams.length && (
              <div style={{ fontSize: 13, color: '#64748b' }}>No upcoming exams for Class {child.class}{child.section}.</div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Parent Notifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {childNotifications.slice(0, 4).map((note) => (
              <div key={note.id} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid #f3f4f6', backgroundColor: note.read ? '#f8fafc' : '#fff7ed' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{note.title}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{note.message}</div>
              </div>
            ))}
            {!childNotifications.length && (
              <div style={{ fontSize: 13, color: '#64748b' }}>No notifications for parents yet.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AccountantDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Financial overview" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Revenue This Month" value={580000} prefix="₹" icon={<DollarSign size={24} color="#059669" />} iconBg="bg-emerald-100" trend={{ value: 8, isUp: true }} delay={0} />
        <StatCard label="Pending Collections" value={245000} prefix="₹" icon={<AlertTriangle size={24} color="#d97706" />} iconBg="bg-amber-100" delay={1} />
        <StatCard label="Overdue Fees" value={5} icon={<AlertTriangle size={24} color="#e11d48" />} iconBg="bg-rose-100" delay={2} />
        <StatCard label="Total Students" value={1240} icon={<Users size={24} color="#4f46e5" />} iconBg="bg-indigo-100" delay={3} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Monthly Fee Collection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyFeeCollection}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </>
  );
}

export function DashboardPage() {
  const { role } = useAuth();
  switch (role) {
    case 'admin': return <AdminDashboard />;
    case 'teacher': return <TeacherDashboard />;
    case 'student': return <StudentDashboard />;
    case 'parent': return <ParentDashboard />;
    case 'accountant': return <AccountantDashboard />;
    default: return <AdminDashboard />;
  }
}
