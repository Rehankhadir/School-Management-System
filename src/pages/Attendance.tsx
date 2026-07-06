import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStudents } from '@/context/StudentsContext';
import { classes, sections, notifications as initialNotifications, type Notification, type Student } from '@/data/mockData';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { motion } from 'framer-motion';
import { Check, X, Clock, Download, RefreshCw } from 'lucide-react';
import * as Papa from 'papaparse';
import { createNotifications, saveAttendanceRecords, getAttendanceByStudent, hasAttendanceForDate } from '@/services/schoolDataService';
import { getTeachers } from '@/services/schoolModulesService';
import { isSupabaseConfigured } from '@/lib/supabase';

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | null;
const ATTENDANCE_SESSION_KEY = 'school.session.attendance';
const NOTIFICATIONS_SESSION_KEY = 'school.session.notifications';
const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
const selectS: React.CSSProperties = { padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function buildAttendanceMonths() {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  return Array.from({ length: currentMonth + 1 }, (_, i) => ({
    label: MONTH_LABELS[i],
    name: `${MONTH_NAMES[i]} ${year}`,
    days: getDaysInMonth(year, i),
    year,
    month: i,
  }));
}

function isFutureDay(year: number, month: number, day: number) {
  const now = new Date();
  const date = new Date(year, month, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date > today;
}

function isSunday(year: number, month: number, day: number) {
  return new Date(year, month, day).getDay() === 0;
}

function parseAssignedClasses(value: string): { klass: string; section: string }[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .map((label) => {
      const match = label.match(/^(\d{1,2})([A-D])$/i);
      return match ? { klass: match[1], section: match[2].toUpperCase() } : null;
    })
    .filter((item): item is { klass: string; section: string } => Boolean(item));
}

function monthlyAttendanceFor(student: Student, monthIndex: number) {
  const months = buildAttendanceMonths();
  return Array.from({ length: months[monthIndex].days }, (_, index) => {
    const day = index + 1;
    const absentEvery = student.attendancePercent >= 90 ? 17 : student.attendancePercent >= 80 ? 11 : 7;
    const lateEvery = student.attendancePercent >= 90 ? 9 : 6;
    const signature = Number(student.rollNo || 0) + monthIndex + day;
    const status = signature % absentEvery === 0 ? 'Absent' : signature % lateEvery === 0 ? 'Late' : 'Present';
    return { day, status };
  });
}

export function AttendancePage() {
  const { role, user } = useAuth();
  const { students } = useStudents();
  const canMark = role === 'admin' || role === 'teacher';
  const [activeTab, setActiveTab] = useState(canMark ? 'mark' : 'reports');
  const [selClass, setSelClass] = useState('9');
  const [selSection, setSelSection] = useState('A');
  const [selDate, setSelDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [monthRecords, setMonthRecords] = useState<{ day: number; status: 'Present' | 'Absent' | 'Late' }[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [assignedClasses, setAssignedClasses] = useState<{ klass: string; section: string }[]>([]);

  const isParent = String(role || user?.role || '').toLowerCase() === 'parent';
  const parentEmail = (user?.email || '').trim().toLowerCase();
  const parentName = (user?.name || '').trim().toLowerCase();
  const visibleStudents = isParent
    ? students.filter((s) => (
      s.guardianEmail.trim().toLowerCase() === parentEmail ||
      s.guardianName.trim().toLowerCase() === parentName
    ))
    : students;
  const classStudents = visibleStudents.filter((s) => s.class === selClass && s.section === selSection);
  const parentChild = isParent ? visibleStudents[0] : null;
  const parentMonthRows = monthRecords || (parentChild ? monthlyAttendanceFor(parentChild, selectedMonth) : []);
  const months = buildAttendanceMonths();
  const { year: selectedYear, month: selectedMonthNum } = months[selectedMonth];
  const monthSummary = parentMonthRows.reduce((acc, row) => {
    if (!isFutureDay(selectedYear, selectedMonthNum, row.day) && !isSunday(selectedYear, selectedMonthNum, row.day)) {
      acc[row.status] += 1;
    }
    return acc;
  }, { Present: 0, Absent: 0, Late: 0 } as Record<'Present' | 'Absent' | 'Late', number>);

  const computedStats = (() => {
    if (isParent && parentChild) {
      const present = monthSummary.Present;
      const absent = monthSummary.Absent;
      const late = monthSummary.Late;
      const counted = present + absent + late;
      const pct = counted > 0 ? Math.round((present / counted) * 100) : 0;
      return { averageAttendance: pct, below75Count: pct < 75 ? 1 : 0, perfectAttendanceCount: pct >= 95 ? 1 : 0 };
    }
    return {
      averageAttendance: visibleStudents.length ? Math.round(visibleStudents.reduce((sum, s) => sum + s.attendancePercent, 0) / visibleStudents.length) : 0,
      below75Count: visibleStudents.filter((s) => s.attendancePercent < 75).length,
      perfectAttendanceCount: visibleStudents.filter((s) => s.attendancePercent >= 95).length,
    };
  })();
  const averageAttendance = computedStats.averageAttendance;
  const below75Count = computedStats.below75Count;
  const perfectAttendanceCount = computedStats.perfectAttendanceCount;
  const presentCount = Object.values(attendance).filter((a) => a === 'Present').length;
  const absentCount = Object.values(attendance).filter((a) => a === 'Absent').length;
  const lateCount = Object.values(attendance).filter((a) => a === 'Late').length;

  const readSessionAttendance = () => {
    try {
      return JSON.parse(sessionStorage.getItem(ATTENDANCE_SESSION_KEY) || '{}') as Record<string, Record<string, AttendanceStatus>>;
    } catch {
      return {};
    }
  };
  const loadStudents = async () => {
    const parts = selDate.split('-');
    if (isSunday(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))) return;
    const key = `${selClass}-${selSection}-${selDate}`;
    const sessionRows = readSessionAttendance();
    const init: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => { init[s.id] = sessionRows[key]?.[s.id] || null; });
    setAttendance(init);
    setLoaded(true);

    if (sessionRows[key]) {
      setSubmitted(true);
      return;
    }

    if (isSupabaseConfigured) {
      const { exists } = await hasAttendanceForDate(selDate, `${selClass}-${selSection}`);
      if (exists) {
        setSubmitted(true);
        return;
      }
    }

    setSubmitted(false);
  };
  const selectedIsSunday = (() => {
    const parts = selDate.split('-');
    return isSunday(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  })();
  const markAll = (status: AttendanceStatus) => { const u: Record<string, AttendanceStatus> = {}; Object.keys(attendance).forEach((id) => { u[id] = status; }); setAttendance(u); };
  const submitAttendance = async () => {
    const parts = selDate.split('-');
    if (isSunday(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))) return;
    const key = `${selClass}-${selSection}-${selDate}`;
    const sessionRows = readSessionAttendance();
    sessionRows[key] = attendance;
    sessionStorage.setItem(ATTENDANCE_SESSION_KEY, JSON.stringify(sessionRows));
    await saveAttendanceRecords(classStudents
      .filter((student) => attendance[student.id])
      .map((student) => ({
        id: `att-${student.id}-${selDate}`,
        student_id: student.id,
        class: student.class,
        section: student.section,
        date: selDate,
        status: attendance[student.id] as 'Present' | 'Absent' | 'Late',
        marked_by: null,
      })));

    const absentStudents = classStudents.filter((student) => attendance[student.id] === 'Absent');
    const existingNotifications = (() => {
      try {
        return JSON.parse(sessionStorage.getItem(NOTIFICATIONS_SESSION_KEY) || JSON.stringify(initialNotifications)) as Notification[];
      } catch {
        return [...initialNotifications];
      }
    })();
    const absentAlerts: Notification[] = absentStudents.map((student) => ({
      id: `absent-${student.id}-${selDate}-${Date.now()}`,
      type: 'attendance',
      title: 'Absent Today',
      message: `${student.name} was marked absent for Class ${student.class}${student.section} on ${selDate}.`,
      time: new Date().toISOString(),
      read: false,
      forRole: ['parent'],
      targetEmail: student.guardianEmail.trim().toLowerCase(),
    }));
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
    sessionStorage.setItem(NOTIFICATIONS_SESSION_KEY, JSON.stringify([...absentAlerts, ...existingNotifications]));
    window.dispatchEvent(new Event('school-notifications-updated'));
    setSubmitted(true);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    setLoaded(false);
    setSubmitted(false);
    setAttendance({});
  }, [selClass, selDate, selSection]);

  useEffect(() => {
    if (!isSupabaseConfigured || role !== 'teacher') return;
    getTeachers().then(({ data }) => {
      const teacher = data.find((t) => t.email === user?.email || t.name === user?.name);
      if (teacher) {
        const parsed = parseAssignedClasses(teacher.classAssigned);
        setAssignedClasses(parsed);
        if (parsed.length > 0) {
          setSelClass(parsed[0].klass);
          setSelSection(parsed[0].section);
        }
      }
    });
  }, [role, user?.email, user?.name]);

  const fetchMonthRecords = useCallback(() => {
    if (!isParent || !parentChild) return;
    const months = buildAttendanceMonths();
    const { year, month, days } = months[selectedMonth];
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(days).padStart(2, '0')}`;

    if (!isSupabaseConfigured) {
      setMonthRecords(monthlyAttendanceFor(parentChild, selectedMonth));
      return;
    }

    getAttendanceByStudent(parentChild.id, startDate, endDate).then(({ data }) => {
      if (data && data.length > 0) {
        const recordsByDay = new Map(data.map((r: { date: string; status: string }) => {
          const day = Number(r.date.split('-')[2]);
          return [day, r.status as 'Present' | 'Absent' | 'Late'];
        }));
        setMonthRecords(Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          status: recordsByDay.get(i + 1) || 'Present',
        })));
      } else {
        setMonthRecords(monthlyAttendanceFor(parentChild, selectedMonth));
      }
    }).catch(() => {
      setMonthRecords(monthlyAttendanceFor(parentChild, selectedMonth));
    });
  }, [isParent, parentChild, selectedMonth]);

  useEffect(() => {
    fetchMonthRecords();
  }, [fetchMonthRecords, refreshKey]);

  useEffect(() => {
    if (!isParent) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchMonthRecords();
    };
    window.addEventListener('school-notifications-updated', fetchMonthRecords);
    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('school-notifications-updated', fetchMonthRecords);
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isParent, fetchMonthRecords]);

  const exportCSV = () => {
    const data = visibleStudents.map((s) => ({ Name: s.name, RollNo: s.rollNo, Class: `${s.class}-${s.section}`, 'Attendance %': s.attendancePercent }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'attendance_report.csv'; a.click();
  };

  const tabs = canMark ? [{ id: 'mark', label: 'Mark Attendance' }, { id: 'reports', label: 'View Reports' }] : [{ id: 'reports', label: 'View Reports' }];

  const isTeacher = role === 'teacher';
  const availableClasses = isTeacher && assignedClasses.length > 0
    ? [...new Set(assignedClasses.map((c) => c.klass))]
    : classes;
  const availableSections = isTeacher && assignedClasses.length > 0
    ? [...new Set(assignedClasses.filter((c) => c.klass === selClass).map((c) => c.section))]
    : sections;

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark and manage student attendance" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />

      <div style={{ marginTop: 24 }}>
        {activeTab === 'mark' && canMark && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ ...cs, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Class</label><select value={selClass} onChange={(e) => { setSelClass(e.target.value); setLoaded(false); }} style={selectS}>{availableClasses.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Section</label><select value={selSection} onChange={(e) => { setSelSection(e.target.value); setLoaded(false); }} style={selectS}>{availableSections.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Date</label><input type="date" value={selDate} onChange={(e) => setSelDate(e.target.value)} style={selectS} /></div>
                <button onClick={loadStudents} disabled={selectedIsSunday} style={{ padding: '8px 16px', backgroundColor: selectedIsSunday ? '#d1d5db' : '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: selectedIsSunday ? 'not-allowed' : 'pointer' }}>Load Students</button>
              </div>
              {selectedIsSunday && (
                <p style={{ fontSize: 13, color: '#e11d48', marginTop: 8 }}>Attendance cannot be marked on Sundays.</p>
              )}
            </div>

            {loaded && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => markAll('Present')} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Mark All Present</button>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#059669' }}>{presentCount} Present</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#e11d48' }}>{absentCount} Absent</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#d97706' }}>{lateCount} Late</span>
                </div>

                <div style={{ ...cs, overflow: 'hidden', marginBottom: 16 }}>
                  {classStudents.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < classStudents.length - 1 ? '1px solid #f9fafb' : 'none' }} className="hover:bg-gray-50">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={s.name} size="sm" />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>Roll No: {s.rollNo}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['Present', 'Absent', 'Late'] as AttendanceStatus[]).map((status) => {
                          const isActive = attendance[s.id] === status;
                          const bg = isActive ? (status === 'Present' ? '#059669' : status === 'Absent' ? '#e11d48' : '#d97706') : 'white';
                          const color = isActive ? 'white' : '#4b5563';
                          const border = isActive ? bg : '#e5e7eb';
                          return (
                            <button key={status} onClick={() => !submitted && setAttendance((p) => ({ ...p, [s.id]: status }))} disabled={submitted}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8, border: `1px solid ${border}`, backgroundColor: bg, color, cursor: submitted ? 'not-allowed' : 'pointer', opacity: submitted ? 0.6 : 1 }}>
                              {status === 'Present' ? <Check size={12} /> : status === 'Absent' ? <X size={12} /> : <Clock size={12} />}{status}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {submitted ? (
                  <Badge variant="success" showDot>✓ Attendance already submitted for this date</Badge>
                ) : (
                  <button onClick={submitAttendance} disabled={Object.values(attendance).some((v) => v === null)} style={{ padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer', opacity: Object.values(attendance).some((v) => v === null) ? 0.5 : 1 }}>Submit Attendance</button>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[{ v: `${averageAttendance}%`, l: isParent ? "Child's Attendance" : 'Overall Attendance', c: '#059669' }, { v: String(below75Count), l: 'Below 75%', c: '#e11d48' }, { v: String(perfectAttendanceCount), l: '95% and above', c: '#4f46e5' }].map((s) => (
                <div key={s.l} style={{ ...cs, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {isParent && parentChild && (
              <div style={{ ...cs, padding: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Month-wise Attendance</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{parentChild.name} - Class {parentChild.class}{parentChild.section}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={fetchMonthRecords} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#4f46e5', backgroundColor: '#eef2ff', borderRadius: 8, border: 'none', cursor: 'pointer' }}><RefreshCw size={12} /> Refresh</button>
                    <Badge variant="indigo">{buildAttendanceMonths()[selectedMonth].name}</Badge>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {buildAttendanceMonths().map((month, index) => (
                    <button
                      key={month.label}
                      onClick={() => setSelectedMonth(index)}
                      style={{
                        minHeight: 34,
                        minWidth: 52,
                        padding: '6px 12px',
                        borderRadius: 999,
                        border: `1px solid ${selectedMonth === index ? '#4f46e5' : '#e5e7eb'}`,
                        backgroundColor: selectedMonth === index ? '#4f46e5' : 'white',
                        color: selectedMonth === index ? 'white' : '#4b5563',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Present', value: monthSummary.Present, bg: '#ecfdf5', border: '#bbf7d0' },
                    { label: 'Absent', value: monthSummary.Absent, bg: '#fff1f2', border: '#fecdd3' },
                    { label: 'Late', value: monthSummary.Late, bg: '#fff7ed', border: '#fed7aa' },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: 12, borderRadius: 12, backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{item.value}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(34px, 1fr))', gap: 8, marginBottom: 8 }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(34px, 1fr))', gap: 8 }}>
                  {(() => {
                    const months = buildAttendanceMonths();
                    const { year, month } = months[selectedMonth];
                    const firstDay = new Date(year, month, 1).getDay();
                    const blanks = Array.from({ length: firstDay }, (_, i) => (
                      <div key={`blank-${i}`} />
                    ));
                    const days = parentMonthRows.map((row) => {
                      const future = isFutureDay(year, month, row.day);
                      const sunday = isSunday(year, month, row.day);
                      const greyed = future || sunday;
                      const colors = greyed
                        ? { bg: '#f9fafb', border: '#e5e7eb' }
                        : row.status === 'Present'
                          ? { bg: '#ecfdf5', border: '#bbf7d0' }
                          : row.status === 'Absent'
                            ? { bg: '#fff1f2', border: '#fecdd3' }
                            : { bg: '#fff7ed', border: '#fed7aa' };
                      const textColor = greyed ? '#d1d5db' : '#111827';
                      return (
                        <div key={row.day} style={{ aspectRatio: '1 / 1', minHeight: 34, borderRadius: 10, backgroundColor: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: textColor }}>
                          {row.day}
                        </div>
                      );
                    });
                    return [...blanks, ...days];
                  })()}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14 }}>
                  {[{ label: 'Present', color: '#22c55e' }, { label: 'Absent', color: '#ef4444' }, { label: 'Late', color: '#f59e0b' }].map((item) => (
                    <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: item.color }} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ ...cs, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Attendance Report</h3>
                <button onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#4f46e5', backgroundColor: '#eef2ff', borderRadius: 8, border: 'none', cursor: 'pointer' }}><Download size={12} /> Export CSV</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Student', 'Roll No', 'Attendance %'].map((h) => (
                      <th key={h} style={{ textAlign: h === 'Attendance %' ? 'center' : 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.slice(0, 15).map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb', backgroundColor: i % 2 === 1 ? '#fafafa' : 'white' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar name={s.name} size="sm" /><span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</span></div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280', textAlign: 'center' }}>{s.rollNo}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: s.attendancePercent >= 85 ? '#059669' : s.attendancePercent >= 75 ? '#d97706' : '#e11d48' }}>{s.attendancePercent}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
