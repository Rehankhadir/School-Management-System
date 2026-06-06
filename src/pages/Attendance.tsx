import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { students, classes, sections } from '@/data/mockData';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { motion } from 'framer-motion';
import { Check, X, Clock, Download } from 'lucide-react';
import * as Papa from 'papaparse';

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | null;
const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
const selectS: React.CSSProperties = { padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };

export function AttendancePage() {
  const { role } = useAuth();
  const canMark = role === 'admin' || role === 'teacher';
  const [activeTab, setActiveTab] = useState(canMark ? 'mark' : 'reports');
  const [selClass, setSelClass] = useState('9');
  const [selSection, setSelSection] = useState('A');
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const classStudents = students.filter((s) => s.class === selClass && s.section === selSection);
  const presentCount = Object.values(attendance).filter((a) => a === 'Present').length;
  const absentCount = Object.values(attendance).filter((a) => a === 'Absent').length;
  const lateCount = Object.values(attendance).filter((a) => a === 'Late').length;

  const loadStudents = () => { const init: Record<string, AttendanceStatus> = {}; classStudents.forEach((s) => { init[s.id] = null; }); setAttendance(init); setLoaded(true); setSubmitted(false); };
  const markAll = (status: AttendanceStatus) => { const u: Record<string, AttendanceStatus> = {}; Object.keys(attendance).forEach((id) => { u[id] = status; }); setAttendance(u); };

  const exportCSV = () => {
    const data = students.map((s) => ({ Name: s.name, RollNo: s.rollNo, Class: `${s.class}-${s.section}`, 'Attendance %': s.attendancePercent }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'attendance_report.csv'; a.click();
  };

  const tabs = canMark ? [{ id: 'mark', label: 'Mark Attendance' }, { id: 'reports', label: 'View Reports' }] : [{ id: 'reports', label: 'View Reports' }];

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark and manage student attendance" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />

      <div style={{ marginTop: 24 }}>
        {activeTab === 'mark' && canMark && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ ...cs, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Class</label><select value={selClass} onChange={(e) => { setSelClass(e.target.value); setLoaded(false); }} style={selectS}>{classes.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Section</label><select value={selSection} onChange={(e) => { setSelSection(e.target.value); setLoaded(false); }} style={selectS}>{sections.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Date</label><input type="date" value={selDate} onChange={(e) => setSelDate(e.target.value)} style={selectS} /></div>
                <button onClick={loadStudents} style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}>Load Students</button>
              </div>
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
                  <Badge variant="success" showDot>✓ Attendance submitted for today</Badge>
                ) : (
                  <button onClick={() => setSubmitted(true)} disabled={Object.values(attendance).some((v) => v === null)} style={{ padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer', opacity: Object.values(attendance).some((v) => v === null) ? 0.5 : 1 }}>Submit Attendance</button>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[{ v: '92%', l: 'Overall Attendance', c: '#059669' }, { v: '4', l: 'Below 75%', c: '#e11d48' }, { v: '8', l: 'Perfect Attendance', c: '#4f46e5' }].map((s) => (
                <div key={s.l} style={{ ...cs, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>

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
                  {students.slice(0, 15).map((s, i) => (
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
