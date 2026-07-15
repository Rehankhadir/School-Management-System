import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '@/context/StudentsContext';
import { useAuth } from '@/context/AuthContext';
import { teachers, type Student, attendanceRecords, type PendingSubmission, type OverrideAuditEntry, type DailyAttendanceStat } from '@/data/mockData';
import { pendingSubmissions as mockPending, overrideAuditLog as mockAuditLog, dailyAttendanceStats as mockStats } from '@/data/mockData';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, AlertTriangle, Send, FileText,
  Search, ChevronDown, ChevronRight, MessageSquare, Phone,
  Shield, Eye, Download, Calendar, TrendingDown, Users, BookOpen,
  Filter, ArrowLeft, RefreshCw, Bell, UserX,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  getAttendanceByDateRange,
  updateAttendanceRecord,
  getAttendanceStatsForDate,
  getChronicAbsentees,
  sendAttendanceOverrideNotification,
  getNotifications,
  createNotifications,
} from '@/services/schoolDataService';

const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
const selectS: React.CSSProperties = { padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };

type FlowTab = 'overview' | 'pending' | 'override' | 'alerts';

function getStatusColor(status: string) {
  if (status === 'Submitted' || status === 'Present') return '#22c55e';
  if (status === 'Pending' || status === 'Absent') return '#ef4444';
  if (status === 'Late') return '#f59e0b';
  return '#6b7280';
}

function getStatusBg(status: string) {
  if (status === 'Submitted' || status === 'Present') return '#f0fdf4';
  if (status === 'Pending' || status === 'Absent') return '#fef2f2';
  if (status === 'Late') return '#fffbeb';
  return '#f9fafb';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

type CalendarDayStatus = 'Present' | 'Absent' | 'Late' | 'Not Taken';

export function AdminAttendancePage() {
  const navigate = useNavigate();
  const { students } = useStudents();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FlowTab>('overview');
  const today = new Date().toISOString().slice(0, 10);

  const tabs = [
    { id: 'overview' as FlowTab, label: 'Overview' },
    { id: 'pending' as FlowTab, label: 'Pending' },
    { id: 'override' as FlowTab, label: 'Override' },
    { id: 'alerts' as FlowTab, label: 'Absentees' },
  ];

  return (
    <div style={{ padding: 0 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Attendance Control</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Manage attendance across all classes. Monitor submissions, override records, and send alerts.</p>
      </div>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as FlowTab)}
      />
      <div style={{ marginTop: 20 }}>
        {activeTab === 'overview' && <OverviewFlow students={students} today={today} onNavigateTab={(tab) => setActiveTab(tab as FlowTab)} />}
        {activeTab === 'pending' && <PendingFlow students={students} today={today} />}
        {activeTab === 'override' && <OverrideFlow students={students} user={user} />}
        {activeTab === 'alerts' && <AlertsFlow students={students} user={user} />}
      </div>
    </div>
  );
}

export function OverviewFlow({ students, today, onNavigateTab }: { students: Student[]; today: string; onNavigateTab?: (tab: string) => void }) {
  const [stats, setStats] = useState(mockStats);
  const [phoneItem, setPhoneItem] = useState<{ name: string; phone: string } | null>(null);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const computedStats = useMemo(() => {
    const submitted = mockPending.filter((p) => p.status === 'Submitted').length;
    const pending = mockPending.filter((p) => p.status === 'Pending').length;
    const totalClasses = mockPending.length;
    const lowAtt = students.filter((s) => s.attendancePercent < 75).length;
    return { ...stats, classesSubmitted: submitted, classesPending: pending, totalClasses, lowAttendance: lowAtt };
  }, [students, stats]);

  const statCards = [
    { label: 'Total Classes', value: computedStats.totalClasses, icon: <BookOpen size={22} />, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Submitted', value: computedStats.classesSubmitted, icon: <CheckCircle size={22} />, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Pending', value: computedStats.classesPending, icon: <Clock size={22} />, color: '#ea580c', bg: '#fff7ed' },
    { label: 'Low Attendance', value: computedStats.lowAttendance, icon: <AlertTriangle size={22} />, color: '#dc2626', bg: '#fef2f2' },
  ];

  const quickActions = [
    { label: 'Chase Teachers', desc: `${computedStats.classesPending} pending`, icon: <Send size={18} />, color: '#ea580c', bg: '#fff7ed', tab: 'pending' },
    { label: 'Override', desc: 'Correct records', icon: <Shield size={18} />, color: '#4f46e5', bg: '#eef2ff', tab: 'override' },
    { label: 'Absentee Alerts', desc: `${computedStats.lowAttendance} flagged`, icon: <Bell size={18} />, color: '#dc2626', bg: '#fef2f2', tab: 'alerts' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat Cards — horizontal row, wraps on small screens */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {statCards.map((card, i) => (
          <div key={i} style={{ ...cs, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 180px', minWidth: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0 }}>
              {card.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Submission Status */}
      <div style={{ ...cs, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Today&apos;s Submission Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
          {mockPending.map((cls) => (
            <div
              key={cls.classSection}
              style={{
                padding: '12px 6px', borderRadius: 10, textAlign: 'center',
                backgroundColor: getStatusBg(cls.status), border: `1px solid ${getStatusColor(cls.status)}20`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: getStatusColor(cls.status) }}>{cls.classSection}</div>
              {cls.status === 'Submitted' ? <CheckCircle size={14} color="#22c55e" /> : <Clock size={14} color="#ea580c" />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#dcfce7' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{computedStats.classesSubmitted} Submitted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#fee2e2' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{computedStats.classesPending} Pending</span>
          </div>
        </div>
      </div>

      {/* Quick Actions — horizontal row, wraps on small screens */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => onNavigateTab?.(action.tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
              borderRadius: 12, border: '1px solid #f1f5f9', backgroundColor: 'white',
              cursor: 'pointer', textAlign: 'left', flex: '1 1 200px', minWidth: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = action.bg; e.currentTarget.style.borderColor = `${action.color}30`; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color, flexShrink: 0 }}>
              {action.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{action.label}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{action.desc}</div>
            </div>
            <ChevronRight size={16} color="#9ca3af" />
          </button>
        ))}
      </div>

      {/* Class Table */}
      <div style={{ ...cs, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>All Classes</div>
        <div className="responsive-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Class</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Teacher</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Students</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Submitted At</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Call</th>
              </tr>
            </thead>
            <tbody>
              {mockPending.map((cls) => (
                <tr key={cls.classSection} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#111827' }}>{cls.className}</td>
                  <td style={{ padding: '12px', color: '#374151' }}>{cls.teacherName}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#374151' }}>{cls.studentCount}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <Badge variant={cls.status === 'Submitted' ? 'success' : 'danger'}>{cls.status}</Badge>
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{cls.submittedAt ? formatTime(cls.submittedAt) : '—'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => setPhoneItem({ name: cls.teacherName, phone: cls.teacherPhone })}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', cursor: 'pointer', color: '#16a34a' }}
                    >
                      <Phone size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {phoneItem && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setPhoneItem(null)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Teacher Contact</div>
              <button onClick={() => setPhoneItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                <XCircle size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 10 }}>
              <Avatar name={phoneItem.name} size="md" />
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>{phoneItem.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Teacher</div>
              </div>
            </div>
            <div style={{ padding: 12, backgroundColor: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', textAlign: 'center', marginBottom: isMobile ? 16 : 0 }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>Phone Number</div>
              {isMobile ? (
                <a href={`tel:${phoneItem.phone}`} style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', textDecoration: 'none' }}>
                  {phoneItem.phone}
                </a>
              ) : (
                <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{phoneItem.phone}</div>
              )}
            </div>
            {isMobile && (
              <a
                href={`tel:${phoneItem.phone}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 10, border: 'none', backgroundColor: '#16a34a', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginTop: 16 }}
              >
                <Phone size={16} /> Call Now
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PendingFlow({ students, today }: { students: Student[]; today: string }) {
  const pendingList = mockPending.filter((p) => p.status === 'Pending');
  const [phoneItem, setPhoneItem] = useState<{ name: string; phone: string } | null>(null);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ ...cs, padding: 20, borderLeft: '4px solid #ef4444', flex: '1 1 0', minWidth: 120 }}>
          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Pending</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>{pendingList.length}</div>
        </div>
      </div>

      {pendingList.length > 0 && (
        <div style={{ ...cs, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Pending Submissions</div>
          <div className="responsive-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Class</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Teacher</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Students</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((cls) => (
                  <tr key={cls.classSection} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{cls.className}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={cls.teacherName} size="sm" />
                        <div>
                          <div style={{ color: '#111827', fontWeight: 500 }}>{cls.teacherName}</div>
                          <div style={{ color: '#6b7280', fontSize: 11 }}>{cls.teacherPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151' }}>{cls.studentCount}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => setPhoneItem({ name: cls.teacherName, phone: cls.teacherPhone })}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Phone size={12} /> Call
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {phoneItem && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setPhoneItem(null)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Teacher Contact</div>
              <button onClick={() => setPhoneItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                <XCircle size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 10 }}>
              <Avatar name={phoneItem.name} size="md" />
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>{phoneItem.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Teacher</div>
              </div>
            </div>
            <div style={{ padding: 12, backgroundColor: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', textAlign: 'center', marginBottom: isMobile ? 16 : 0 }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>Phone Number</div>
              {isMobile ? (
                <a href={`tel:${phoneItem.phone}`} style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', textDecoration: 'none' }}>
                  {phoneItem.phone}
                </a>
              ) : (
                <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{phoneItem.phone}</div>
              )}
            </div>
            {isMobile && (
              <a
                href={`tel:${phoneItem.phone}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 10, border: 'none', backgroundColor: '#16a34a', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginTop: 16 }}
              >
                <Phone size={16} /> Call Now
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OverrideFlow({ students, user }: { students: Student[]; user: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [auditLog, setAuditLog] = useState<OverrideAuditEntry[]>(mockAuditLog);
  const [selectedDate, setSelectedDate] = useState('');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<'Present' | 'Absent' | 'Late'>('Present');
  const [overrideReason, setOverrideReason] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [attendRecords, setAttendRecords] = useState<{ day: number; status: CalendarDayStatus }[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const year = new Date().getFullYear();
  const daysInMonth = getDaysInMonth(year, currentMonth);
  const monthName = new Date(year, currentMonth).toLocaleString('en-US', { month: 'long' });

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return students.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.rollNo.includes(q) ||
      `${s.class}${s.section}`.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [students, searchQuery]);

  const loadStudentAttendance = useCallback((student: Student) => {
    const records: { day: number; status: CalendarDayStatus }[] = [];
    const mockRecs = attendanceRecords.filter((r) => r.studentId === student.id);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = mockRecs.find((r) => r.date === dateStr);
      const dayOfWeek = new Date(year, currentMonth, d).getDay();
      if (dayOfWeek === 0) {
        records.push({ day: d, status: 'Not Taken' });
      } else if (record) {
        records.push({ day: d, status: record.status as CalendarDayStatus });
      } else {
        const now = new Date();
        const cellDate = new Date(year, currentMonth, d);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (cellDate > todayStart) {
          records.push({ day: d, status: 'Not Taken' });
        } else {
          records.push({ day: d, status: 'Not Taken' });
        }
      }
    }
    setAttendRecords(records);
  }, [currentMonth, year, daysInMonth]);

  useEffect(() => {
    if (selectedStudent) loadStudentAttendance(selectedStudent);
  }, [selectedStudent, loadStudentAttendance]);

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setShowOverrideForm(false);
  };

  const handleOverride = () => {
    if (!selectedStudent || !selectedDate || !overrideReason) return;
    const dateNum = parseInt(selectedDate.split('-')[2], 10);
    const originalRecord = attendRecords.find((r) => r.day === dateNum);
    const originalStatus = originalRecord?.status || 'Not Taken';

    const newEntry: OverrideAuditEntry = {
      id: `ov-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      classSection: `${selectedStudent.class}${selectedStudent.section}`,
      date: selectedDate,
      originalStatus,
      newStatus: overrideStatus,
      reason: overrideReason,
      overriddenBy: user?.name || 'Admin',
      overriddenAt: new Date().toISOString(),
    };

    setAuditLog((prev) => [newEntry, ...prev]);
    setAttendRecords((prev) => prev.map((r) => r.day === dateNum ? { ...r, status: overrideStatus } : r));
    setShowOverrideForm(false);
    setOverrideReason('');
    setSelectedDate('');
  };

  return (
    <div>
      <div className="responsive-two-col" style={{ gap: 20 }}>
        <div>
          <div style={{ ...cs, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Search Student</div>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by name, roll no, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' }}
              />
            </div>
            {filteredStudents.length > 0 && (
              <div style={{ marginTop: 8, border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      border: 'none', borderBottom: '1px solid #f3f4f6', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Avatar name={s.name} size="sm" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Class {s.class}{s.section} &middot; Roll {s.rollNo}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStudent && (
            <div style={{ ...cs, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar name={selectedStudent.name} size="md" />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selectedStudent.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>Class {selectedStudent.class}{selectedStudent.section} &middot; Roll {selectedStudent.rollNo} &middot; {selectedStudent.attendancePercent}% attendance</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <button onClick={() => setCurrentMonth((m) => Math.max(0, m - 1))} style={{ padding: 4, borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>&lt;</button>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{monthName} {year}</span>
                <button onClick={() => setCurrentMonth((m) => Math.min(11, m + 1))} style={{ padding: 4, borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>&gt;</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280', padding: 4 }}>{d}</div>
                ))}
              </div>

              {(() => {
                const firstDay = new Date(year, currentMonth, 1).getDay();
                const cells: React.ReactNode[] = [];
                for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} />);
                attendRecords.forEach((rec) => {
                  const dayOfWeek = new Date(year, currentMonth, rec.day).getDay();
                  const isClickable = dayOfWeek !== 0 && rec.status !== 'Not Taken';
                  const bgColor = rec.status === 'Present' ? '#dcfce7' : rec.status === 'Absent' ? '#fee2e2' : rec.status === 'Late' ? '#fef3c7' : '#f9fafb';
                  const textColor = rec.status === 'Present' ? '#166534' : rec.status === 'Absent' ? '#991b1b' : rec.status === 'Late' ? '#92400e' : '#9ca3af';
                  cells.push(
                    <div
                      key={rec.day}
                      onClick={() => {
                        if (isClickable) {
                          const dateStr = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(rec.day).padStart(2, '0')}`;
                          setSelectedDate(dateStr);
                          setShowOverrideForm(true);
                        }
                      }}
                      style={{
                        padding: 6, borderRadius: 6, textAlign: 'center', fontSize: 12, fontWeight: 500,
                        backgroundColor: bgColor, color: textColor,
                        cursor: isClickable ? 'pointer' : 'default',
                        border: isClickable ? '1px solid transparent' : 'none',
                      }}
                      onMouseEnter={(e) => { if (isClickable) e.currentTarget.style.borderColor = '#4f46e5'; }}
                      onMouseLeave={(e) => { if (isClickable) e.currentTarget.style.borderColor = 'transparent'; }}
                    >
                      {rec.day}
                    </div>
                  );
                });
                return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>{cells}</div>;
              })()}

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {[
                  { label: 'Present', color: '#22c55e', bg: '#dcfce7' },
                  { label: 'Absent', color: '#ef4444', bg: '#fee2e2' },
                  { label: 'Late', color: '#f59e0b', bg: '#fef3c7' },
                  { label: 'Not Taken', color: '#9ca3af', bg: '#f9fafb' },
                ].map((l) => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: l.bg, border: `1px solid ${l.color}40` }} />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{l.label}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Click a colored day to override attendance status.</p>
            </div>
          )}
        </div>

        <div>
          {showOverrideForm && selectedStudent && selectedDate && (
            <div style={{ ...cs, padding: 20, marginBottom: 20, border: '2px solid #4f46e5' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Override Attendance</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                {selectedStudent.name} &middot; {formatDate(selectedDate)}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>New Status</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Present', 'Absent', 'Late'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setOverrideStatus(s)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${overrideStatus === s ? getStatusColor(s) : '#e5e7eb'}`,
                        backgroundColor: overrideStatus === s ? getStatusBg(s) : 'white',
                        color: overrideStatus === s ? getStatusColor(s) : '#6b7280',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Reason (required)</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Parent called - was present, marked absent by mistake"
                  style={{ width: '100%', padding: 10, fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', resize: 'vertical', minHeight: 80 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleOverride}
                  disabled={!overrideReason}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: overrideReason ? 'pointer' : 'not-allowed',
                    backgroundColor: overrideReason ? '#4f46e5' : '#e5e7eb', color: overrideReason ? 'white' : '#9ca3af',
                  }}
                >
                  Save Override
                </button>
                <button
                  onClick={() => { setShowOverrideForm(false); setOverrideReason(''); }}
                  style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, fontWeight: 500, cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ ...cs, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Override Audit Log</div>
              <button onClick={() => setShowAuditLog(!showAuditLog)} style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                {showAuditLog ? 'Hide' : 'Show'} Log
              </button>
            </div>
            {showAuditLog && (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {auditLog.length === 0 && <p style={{ fontSize: 13, color: '#6b7280' }}>No overrides recorded yet.</p>}
                {auditLog.map((entry) => (
                  <div key={entry.id} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Shield size={14} color="#4f46e5" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{entry.studentName}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>Class {entry.classSection}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginLeft: 22 }}>
                      <span style={{ color: '#ef4444' }}>{entry.originalStatus}</span>
                      {' → '}
                      <span style={{ color: getStatusColor(entry.newStatus), fontWeight: 600 }}>{entry.newStatus}</span>
                      {' on '}
                      <span style={{ fontWeight: 500 }}>{formatDate(entry.date)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginLeft: 22, marginTop: 2, fontStyle: 'italic' }}>&quot;{entry.reason}&quot;</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginLeft: 22, marginTop: 2 }}>by {entry.overriddenBy} &middot; {formatTime(entry.overriddenAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlertsFlow({ students, user }: { students: Student[]; user: any }) {
  const [filterRange, setFilterRange] = useState('all');
  const [phoneStudent, setPhoneStudent] = useState<Student | null>(null);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const lowAttendanceStudents = useMemo(() => {
    let filtered = students.filter((s) => s.attendancePercent < 75);
    if (filterRange === 'critical') filtered = students.filter((s) => s.attendancePercent < 60);
    else if (filterRange === 'warning') filtered = students.filter((s) => s.attendancePercent >= 60 && s.attendancePercent < 75);
    return filtered.sort((a, b) => a.attendancePercent - b.attendancePercent);
  }, [students, filterRange]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ ...cs, padding: 20, borderLeft: '4px solid #dc2626', flex: '1 1 0', minWidth: 120 }}>
          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Critical (&lt;60%)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>{students.filter((s) => s.attendancePercent < 60).length}</div>
        </div>
        <div style={{ ...cs, padding: 20, borderLeft: '4px solid #ea580c', flex: '1 1 0', minWidth: 120 }}>
          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Warning (60-75%)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ea580c' }}>{students.filter((s) => s.attendancePercent >= 60 && s.attendancePercent < 75).length}</div>
        </div>
      </div>

      <div style={{ ...cs, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Students Below 75% Attendance</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={filterRange} onChange={(e) => setFilterRange(e.target.value)} style={selectS}>
              <option value="all">All below 75%</option>
              <option value="critical">Critical (&lt;60%)</option>
              <option value="warning">Warning (60-75%)</option>
            </select>
          </div>
        </div>

        <div className="responsive-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Student</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Class</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Attendance</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#6b7280' }}>Parent</th>
              </tr>
            </thead>
            <tbody>
              {lowAttendanceStudents.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={s.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 500, color: '#111827' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Roll {s.rollNo}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151' }}>{s.class}{s.section}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                      backgroundColor: s.attendancePercent < 60 ? '#fee2e2' : '#fff7ed',
                      color: s.attendancePercent < 60 ? '#dc2626' : '#ea580c', fontWeight: 700, fontSize: 13,
                    }}>
                      {s.attendancePercent}%
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#374151' }}>{s.guardianName}</span>
                      <button
                        onClick={() => setPhoneStudent(s)}
                        title={s.guardianPhone}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', cursor: 'pointer', color: '#16a34a' }}
                      >
                        <Phone size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...cs, padding: 20, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <TrendingDown size={16} color="#ea580c" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#9a3412' }}>Note</span>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Students with attendance below 75% are listed above. Contact parents to ensure regular attendance.
        </p>
      </div>

      {phoneStudent && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setPhoneStudent(null)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Parent Contact</div>
              <button onClick={() => setPhoneStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                <XCircle size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 10 }}>
              <Avatar name={phoneStudent.guardianName} size="md" />
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>{phoneStudent.guardianName}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{phoneStudent.name}'s Guardian</div>
              </div>
            </div>
            <div style={{ padding: 12, backgroundColor: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', textAlign: 'center', marginBottom: isMobile ? 16 : 0 }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>Phone Number</div>
              {isMobile ? (
                <a href={`tel:${phoneStudent.guardianPhone}`} style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', textDecoration: 'none' }}>
                  {phoneStudent.guardianPhone}
                </a>
              ) : (
                <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>
                  {phoneStudent.guardianPhone}
                </div>
              )}
            </div>
            {isMobile && (
              <a
                href={`tel:${phoneStudent.guardianPhone}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 10, border: 'none', backgroundColor: '#16a34a', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
              >
                <Phone size={16} /> Call Now
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsFlow({ students }: { students: Student[] }) {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'student'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [generating, setGenerating] = useState(false);

  const year = new Date().getFullYear();
  const monthName = new Date(year, selectedMonth).toLocaleString('en-US', { month: 'long' });

  const dailyStats = useMemo(() => {
    const mockRecs = attendanceRecords.filter((r) => r.date === selectedDate);
    const present = mockRecs.filter((r) => r.status === 'Present').length;
    const absent = mockRecs.filter((r) => r.status === 'Absent').length;
    const late = mockRecs.filter((r) => r.status === 'Late').length;
    return { present, absent, late, total: mockRecs.length };
  }, [selectedDate]);

  const monthlyStats = useMemo(() => {
    const monthRecs = attendanceRecords.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === year;
    });
    const present = monthRecs.filter((r) => r.status === 'Present').length;
    const absent = monthRecs.filter((r) => r.status === 'Absent').length;
    const late = monthRecs.filter((r) => r.status === 'Late').length;
    return { present, absent, late, total: monthRecs.length };
  }, [selectedMonth, year]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const generatePDF = (type: string) => {
    setGenerating(true);
    setTimeout(() => {
      const content = `
        <html><head><style>body{font-family:sans-serif;padding:20px}h1{color:#1e1b4b}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:13px}th{background:#f9fafb;font-weight:600}.stat{display:inline-block;padding:12px 20px;margin:8px;border-radius:8px;background:#f9fafb}</style></head><body>
        <h1>Attendance Report - ${type.charAt(0).toUpperCase() + type.slice(1)}</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${type === 'daily' ? `
          <div class="stat">Date: ${selectedDate}</div>
          <div class="stat">Present: ${dailyStats.present}</div>
          <div class="stat">Absent: ${dailyStats.absent}</div>
          <div class="stat">Late: ${dailyStats.late}</div>
        ` : type === 'monthly' ? `
          <div class="stat">Month: ${monthName} ${year}</div>
          <div class="stat">Present: ${monthlyStats.present}</div>
          <div class="stat">Absent: ${monthlyStats.absent}</div>
          <div class="stat">Late: ${monthlyStats.late}</div>
        ` : selectedStudent ? `
          <div class="stat">Student: ${selectedStudent.name}</div>
          <div class="stat">Class: ${selectedStudent.class}${selectedStudent.section}</div>
          <div class="stat">Attendance: ${selectedStudent.attendancePercent}%</div>
        ` : ''}
        <p style="color:#6b7280;margin-top:20px">Sunrise Public School - Attendance Management System</p>
        </body></html>
      `;
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${type}-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
    }, 1000);
  };

  return (
    <div>
      <div className="responsive-grid-3" style={{ marginBottom: 24 }}>
        {[
          { type: 'daily' as const, label: 'Daily Report', desc: 'Today\'s attendance summary', icon: <Calendar size={20} />, color: '#4f46e5' },
          { type: 'monthly' as const, label: 'Monthly Report', desc: 'Month-wise attendance data', icon: <FileText size={20} />, color: '#16a34a' },
          { type: 'student' as const, label: 'Student Report', desc: 'Individual student report', icon: <Users size={20} />, color: '#ea580c' },
        ].map((opt) => (
          <button
            key={opt.type}
            onClick={() => setReportType(opt.type)}
            style={{
              ...cs, padding: 20, textAlign: 'left', cursor: 'pointer',
              border: reportType === opt.type ? `2px solid ${opt.color}` : '1px solid #f1f5f9',
              backgroundColor: reportType === opt.type ? `${opt.color}08` : 'white',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${opt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: opt.color, marginBottom: 12 }}>
              {opt.icon}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{opt.label}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ ...cs, padding: 20 }}>
        {reportType === 'daily' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Daily Attendance Report</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Select Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ ...selectS, width: '100%' }} />
            </div>
            <div className="responsive-grid-4" style={{ marginBottom: 20 }}>
              <div style={{ padding: 16, borderRadius: 10, backgroundColor: '#f0fdf4', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{dailyStats.present}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Present</div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, backgroundColor: '#fef2f2', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{dailyStats.absent}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Absent</div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, backgroundColor: '#fffbeb', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{dailyStats.late}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Late</div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, backgroundColor: '#f9fafb', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#374151' }}>{dailyStats.total}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Total Records</div>
              </div>
            </div>
            <button onClick={() => generatePDF('daily')} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer' }}>
              <Download size={16} /> {generating ? 'Generating...' : 'Export Daily Report'}
            </button>
          </div>
        )}

        {reportType === 'monthly' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Monthly Attendance Report</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Select Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} style={{ ...selectS, width: '100%' }}>
                {Array.from({ length: new Date().getMonth() + 1 }, (_, i) => (
                  <option key={i} value={i}>{new Date(year, i).toLocaleString('en-US', { month: 'long' })} {year}</option>
                ))}
              </select>
            </div>
            <div className="responsive-grid-4" style={{ marginBottom: 20 }}>
              <div style={{ padding: 16, borderRadius: 10, backgroundColor: '#f0fdf4', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{monthlyStats.present}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Present</div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, backgroundColor: '#fef2f2', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{monthlyStats.absent}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Absent</div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, backgroundColor: '#fffbeb', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{monthlyStats.late}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Late</div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, backgroundColor: '#f9fafb', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#374151' }}>{monthlyStats.total}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Total Records</div>
              </div>
            </div>
            <button onClick={() => generatePDF('monthly')} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', backgroundColor: '#16a34a', color: 'white', fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer' }}>
              <Download size={16} /> {generating ? 'Generating...' : 'Export Monthly Report'}
            </button>
          </div>
        )}

        {reportType === 'student' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Student Attendance Report</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Select Student</label>
              <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} style={{ ...selectS, width: '100%' }}>
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - Class {s.class}{s.section}</option>
                ))}
              </select>
            </div>
            {selectedStudent && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, backgroundColor: '#f9fafb', marginBottom: 16 }}>
                  <Avatar name={selectedStudent.name} size="md" />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selectedStudent.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Class {selectedStudent.class}{selectedStudent.section} &middot; Roll {selectedStudent.rollNo}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: selectedStudent.attendancePercent >= 75 ? '#16a34a' : '#dc2626' }}>{selectedStudent.attendancePercent}%</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Overall Attendance</div>
                  </div>
                </div>
                <button onClick={() => generatePDF('student')} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', backgroundColor: '#ea580c', color: 'white', fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer' }}>
                  <Download size={16} /> {generating ? 'Generating...' : 'Export Student Report'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
