import { useState, useEffect, useMemo } from 'react';
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
import { getTeachers, getLeaves, getMarks, getTimetable, getExams } from '@/services/schoolModulesService';

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
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<{ klass: string; section: string; label: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [teacherLeaves, setTeacherLeaves] = useState<any[]>([]);
  const [teacherMarks, setTeacherMarks] = useState<any[]>([]);
  const [timetableData, setTimetableData] = useState<Record<string, any>>({});
  const [examsData, setExamsData] = useState<any[]>([]);

  const parseAssignedClasses = (value: string) =>
    value.split(',').map((s) => s.trim()).map((label) => {
      const m = label.match(/^(\d{1,2})([A-D])$/i);
      return m ? { klass: m[1], section: m[2].toUpperCase(), label } : null;
    }).filter(Boolean) as { klass: string; section: string; label: string }[];

  useEffect(() => {
    if (user?.email || user?.name) {
      getTeachers().then(({ data }) => {
        const t = data.find((te: any) => te.email === user?.email || te.name === user?.name);
        if (t) {
          setTeacherData(t);
          const parsed = parseAssignedClasses(t.classAssigned);
          setAssignedClasses(parsed);
          if (parsed.length > 0) setSelectedClass(`${parsed[0].klass}-${parsed[0].section}`);
        }
      });
    }
    getLeaves().then(({ data }) => setTeacherLeaves(data));
    getMarks().then(({ data }) => setTeacherMarks(data));
    getTimetable().then(({ data }) => setTimetableData(data));
    getExams().then(({ data }) => setExamsData(data));
  }, [user?.email, user?.name]);

  const teachingStudents = useMemo(() => {
    if (assignedClasses.length === 0) return students.filter((s) => ['9', '10'].includes(s.class));
    const classKeys = assignedClasses.map((c) => `${c.klass}${c.section}`);
    return students.filter((s) => classKeys.includes(`${s.class}${s.section}`));
  }, [students, assignedClasses]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return teachingStudents;
    const [k, s] = selectedClass.split('-');
    return teachingStudents.filter((st) => st.class === k && st.section === s);
  }, [teachingStudents, selectedClass]);

  const myLeaves = teacherLeaves.filter((l: any) => l.applicantId === user?.id && l.applicantRole === 'Teacher' && l.status !== 'Rejected');
  const pendingLeaves = teacherLeaves.filter((l: any) => l.applicantId === user?.id && l.applicantRole === 'Teacher' && l.status === 'Pending');
  const usedLeaveDays = myLeaves.reduce((sum: number, l: any) => sum + l.days, 0);
  const maxLeaveDays = 18;
  const remainingLeaveDays = Math.max(0, maxLeaveDays - usedLeaveDays);

  const studentSummaries = useMemo(() => {
    return teachingStudents.map((student) => {
      const sm = teacherMarks.filter((m: any) => m.studentId === student.id);
      if (!sm.length) return null;
      const avg = sm.reduce((sum: number, m: any) => sum + (m.scored / m.maxMarks) * 100, 0) / sm.length;
      const lowSubjects = [...new Set(sm.filter((m: any) => (m.scored / m.maxMarks) * 100 < 60).map((m: any) => m.subject))];
      const grade = avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
      return { student, averageScore: avg, lowSubjects, grade };
    }).filter(Boolean);
  }, [teachingStudents, teacherMarks]);

  const classAvgScore = studentSummaries.length
    ? studentSummaries.reduce((s: number, e: any) => s + e.averageScore, 0) / studentSummaries.length
    : 0;

  const lowAttendanceStudents = filteredStudents.filter((s) => s.attendancePercent < 85);
  const atRiskStudents = studentSummaries.filter((e: any) => e.averageScore < 60).sort((a: any, b: any) => a.averageScore - b.averageScore).slice(0, 5);

  const subjectAvgData = useMemo(() => {
    const teacherSubjects = teacherData?.subjects || [];
    const subjMap: Record<string, { total: number; count: number }> = {};
    teachingStudents.forEach((student) => {
      teacherMarks.filter((m: any) => m.studentId === student.id && teacherSubjects.includes(m.subject)).forEach((m: any) => {
        if (!subjMap[m.subject]) subjMap[m.subject] = { total: 0, count: 0 };
        subjMap[m.subject].total += (m.scored / m.maxMarks) * 100;
        subjMap[m.subject].count += 1;
      });
    });
    return Object.entries(subjMap)
      .map(([subject, d]) => ({ subject, avg: Math.round(d.total / d.count) }))
      .sort((a, b) => a.avg - b.avg);
  }, [teachingStudents, teacherMarks, teacherData]);

  const attendanceTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const idx = (now.getMonth() - 5 + i + 12) % 12;
      const monthStudents = teachingStudents.filter((s) => s.attendancePercent > 0);
      const base = monthStudents.length ? monthStudents.reduce((sum, s) => sum + s.attendancePercent, 0) / monthStudents.length : 85;
      const jitter = (Math.sin(i * 1.7) * 4);
      return { month: months[idx], attendance: Math.round(Math.min(100, Math.max(60, base + jitter - (5 - i) * 1.2))) };
    });
  }, [teachingStudents]);

  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todayTimetable = useMemo(() => {
    const key = selectedClass || (assignedClasses[0] ? `${assignedClasses[0].klass}${assignedClasses[0].section}` : '9A');
    const days = timetableData[key] || [];
    const today = days.find((d: any) => d.day === todayName);
    return today ? today.periods : [];
  }, [timetableData, selectedClass, assignedClasses, todayName]);

  const totalStudents = teachingStudents.length;

  const recentAssessments = useMemo(() => {
    const studentIds = new Set(teachingStudents.map((s) => s.id));
    const recent = teacherMarks.filter((m: any) => studentIds.has(m.studentId));
    const grouped: Record<string, { student: any; subject: string; scored: number; maxMarks: number; exam: string }[]> = {};
    recent.forEach((m: any) => {
      const key = `${m.exam}-${m.studentId}`;
      if (!grouped[m.exam]) grouped[m.exam] = [];
      const student = teachingStudents.find((s) => s.id === m.studentId);
      if (student) grouped[m.exam].push({ student, subject: m.subject, scored: m.scored, maxMarks: m.maxMarks, exam: m.exam });
    });
    const latestExam = Object.keys(grouped).pop();
    const entries = latestExam ? grouped[latestExam] : [];
    const sorted = entries.sort((a, b) => (b.scored / b.maxMarks) - (a.scored / a.maxMarks));
    return { top: sorted.slice(0, 3), needsImprovement: sorted.slice(-3).reverse(), examName: latestExam || '' };
  }, [teachingStudents, teacherMarks]);

  const upcomingExams = useMemo(() => {
    const classKeys = assignedClasses.map((c) => c.klass);
    const today = new Date().toISOString().slice(0, 10);
    return examsData
      .filter((e: any) => classKeys.includes(e.class) && e.date >= today)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [examsData, assignedClasses]);

  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    studentSummaries.forEach((e: any) => { dist[e.grade] = (dist[e.grade] || 0) + 1; });
    return dist;
  }, [studentSummaries]);

  const lowestAttendance = useMemo(() => {
    return [...filteredStudents].sort((a, b) => a.attendancePercent - b.attendancePercent).slice(0, 5);
  }, [filteredStudents]);

  return (
    <>
      <PageHeader
        title={`Welcome, ${teacherData?.name?.split(' ')[0] || 'Teacher'}!`}
        subtitle={`${assignedClasses.map((c) => `Class ${c.label}`).join(', ') || 'Classes 9 & 10'} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Mark Attendance', icon: <CalendarCheck size={20} />, color: '#4f46e5', bg: '#eef2ff', path: '/attendance' },
          { label: 'Enter Marks', icon: <FileText size={20} />, color: '#059669', bg: '#ecfdf5', path: '/marks' },
          { label: 'View Students', icon: <Users size={20} />, color: '#d97706', bg: '#fffbeb', path: '/students' },
          { label: 'Apply Leave', icon: <Clock size={20} />, color: '#9333ea', bg: '#f5f3ff', path: '/leaves' },
          { label: 'View Reports', icon: <GraduationCap size={20} />, color: '#0891b2', bg: '#ecfeff', path: '/reports' },
          { label: 'Timetable', icon: <BookOpen size={20} />, color: '#be123c', bg: '#fff1f2', path: '/timetable' },
        ].map((action) => (
          <motion.div
            key={action.label}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(action.path)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 16px', borderRadius: 12, backgroundColor: action.bg,
              border: `1px solid ${action.color}15`, cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ color: action.color }}>{action.icon}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: action.color }}>{action.label}</span>
          </motion.div>
        ))}
      </div>

      {assignedClasses.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedClass('')}
            style={{
              padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${!selectedClass ? '#4f46e5' : '#e5e7eb'}`,
              backgroundColor: !selectedClass ? '#4f46e5' : 'white',
              color: !selectedClass ? 'white' : '#374151',
            }}
          >All Classes</button>
          {assignedClasses.map((c) => (
            <button
              key={c.label}
              onClick={() => setSelectedClass(`${c.klass}-${c.section}`)}
              style={{
                padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${selectedClass === `${c.klass}-${c.section}` ? '#4f46e5' : '#e5e7eb'}`,
                backgroundColor: selectedClass === `${c.klass}-${c.section}` ? '#4f46e5' : 'white',
                color: selectedClass === `${c.klass}-${c.section}` ? 'white' : '#374151',
              }}
            >Class {c.label}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="My Students" value={totalStudents} icon={<Users size={24} color="#4f46e5" />} iconBg="bg-indigo-100" delay={0} />
        <StatCard label="Class Average" value={Math.round(classAvgScore)} suffix="%" icon={<GraduationCap size={24} color="#059669" />} iconBg="bg-emerald-100" delay={1} />
        <StatCard label="Low Attendance" value={lowAttendanceStudents.length} icon={<AlertTriangle size={24} color="#e11d48" />} iconBg="bg-rose-100" delay={2} />
        <StatCard label="Leaves Left" value={remainingLeaveDays} suffix={`/ ${maxLeaveDays}`} icon={<Clock size={24} color="#9333ea" />} iconBg="bg-purple-100" delay={3} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ ...cardStyle, padding: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Today's Schedule</h3>
          {todayTimetable.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayTimetable.map((p: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  borderRadius: 10, backgroundColor: p.isBreak ? '#f8fafc' : '#f8fafc',
                  borderLeft: `3px solid ${p.isBreak ? '#d1d5db' : '#4f46e5'}`,
                }}>
                  <div style={{ minWidth: 55 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>P{p.period}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{p.time}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{p.isBreak ? 'Break' : p.subject}</div>
                    {!p.isBreak && <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.teacher}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No timetable for today</div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Leave Summary</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/leaves')}
              style={{
                fontSize: 12, fontWeight: 600, color: '#4f46e5', backgroundColor: '#eef2ff',
                border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              }}
            >+ Apply</motion.button>
          </div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#ecfdf5', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>{remainingLeaveDays}</div>
              <div style={{ fontSize: 11, color: '#065f46', marginTop: 4 }}>Remaining</div>
            </div>
            <div style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#fef2f2', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#e11d48' }}>{usedLeaveDays}</div>
              <div style={{ fontSize: 11, color: '#9f1239', marginTop: 4 }}>Used</div>
            </div>
            <div style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#fffbeb', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{pendingLeaves.length}</div>
              <div style={{ fontSize: 11, color: '#92400e', marginTop: 4 }}>Pending</div>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${(usedLeaveDays / maxLeaveDays) * 100}%`,
              backgroundColor: usedLeaveDays > 14 ? '#e11d48' : usedLeaveDays > 10 ? '#d97706' : '#059669',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
            <span>{usedLeaveDays} of {maxLeaveDays} days</span>
            <span>{remainingLeaveDays} left</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ ...cardStyle, padding: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={attendanceTrendData}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#cbd5e1" />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} stroke="#cbd5e1" />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'white', padding: '8px 14px', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>{label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>{payload[0].value}%</p>
                </div>
              ) : null} />
              <Area type="monotone" dataKey="attendance" stroke="#4f46e5" strokeWidth={2.5} fill="url(#attGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, padding: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>My Subjects</h3>
          {subjectAvgData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {subjectAvgData.map((s) => (
                <div key={s.subject}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{s.subject}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.avg >= 70 ? '#059669' : s.avg >= 50 ? '#d97706' : '#e11d48' }}>{s.avg}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.avg}%` }}
                      transition={{ duration: 0.8 }}
                      style={{
                        height: '100%', borderRadius: 4,
                        backgroundColor: s.avg >= 70 ? '#059669' : s.avg >= 50 ? '#d97706' : '#e11d48',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No subject data</div>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 28, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Students Needing Attention</h3>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{lowAttendanceStudents.length + atRiskStudents.length} students</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {lowAttendanceStudents.slice(0, 4).map((s) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 12, backgroundColor: '#fef2f2', border: '1px solid #fecdd3',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Class {s.class}{s.section} · Attendance</div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#e11d48' }}>{s.attendancePercent}%</span>
            </div>
          ))}
          {atRiskStudents.slice(0, 4).map((e: any) => (
            <div key={e.student.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 12, backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{e.student.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Class {e.student.class}{e.student.section} · Marks</div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>{e.averageScore.toFixed(0)}%</span>
            </div>
          ))}
          {lowAttendanceStudents.length === 0 && atRiskStudents.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center', color: '#059669', fontSize: 14, backgroundColor: '#ecfdf5', borderRadius: 12 }}>
              All students are doing well!
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ ...cardStyle, padding: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>
            Recent Results {recentAssessments.examName && <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>· {recentAssessments.examName}</span>}
          </h3>
          {recentAssessments.top.length > 0 ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Top Performers</div>
                {recentAssessments.top.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, backgroundColor: '#ecfdf5', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', minWidth: 18 }}>{i + 1}.</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{entry.student.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{entry.subject} · Class {entry.student.class}{entry.student.section}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{entry.scored}/{entry.maxMarks}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Needs Improvement</div>
                {recentAssessments.needsImprovement.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, backgroundColor: '#fff7ed', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{entry.student.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{entry.subject} · Class {entry.student.class}{entry.student.section}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>{entry.scored}/{entry.maxMarks}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No recent assessment data</div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Upcoming Assessments</h3>
          {upcomingExams.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingExams.map((exam: any) => (
                <div key={exam.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, backgroundColor: '#eff6ff', borderLeft: '3px solid #4f46e5' }}>
                  <div style={{ minWidth: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>{new Date(exam.date).getDate()}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>{new Date(exam.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{exam.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Class {exam.class}{exam.section || ''} {exam.subject ? `· ${exam.subject}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No upcoming assessments</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ ...cardStyle, padding: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Grade Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['A+', 'A', 'B', 'C', 'D', 'F'] as const).map((band) => {
              const count = gradeDistribution[band] || 0;
              const pct = studentSummaries.length ? (count / studentSummaries.length) * 100 : 0;
              const colors: Record<string, string> = { 'A+': '#059669', 'A': '#10b981', 'B': '#4f46e5', 'C': '#d97706', 'D': '#f97316', 'F': '#e11d48' };
              return (
                <div key={band} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', minWidth: 28 }}>{band}</span>
                  <div style={{ flex: 1, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      style={{ height: '100%', borderRadius: 12, backgroundColor: colors[band] }}
                    />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', minWidth: 32, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Attendance Snapshot</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
            {lowestAttendance.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Class {s.class}{s.section} · Roll {s.rollNo}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, width: `${s.attendancePercent}%`,
                      backgroundColor: s.attendancePercent >= 75 ? '#059669' : s.attendancePercent >= 60 ? '#d97706' : '#e11d48',
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: s.attendancePercent >= 75 ? '#059669' : s.attendancePercent >= 60 ? '#d97706' : '#e11d48', minWidth: 40, textAlign: 'right' }}>{s.attendancePercent}%</span>
                </div>
              </div>
            ))}
            {lowestAttendance.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#059669', fontSize: 13 }}>All students have good attendance!</div>
            )}
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
