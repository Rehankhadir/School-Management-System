import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useStudents } from '@/context/StudentsContext';
import { monthlyFeeCollection, fees, marks, leaves } from '@/data/mockData';
import { motion } from 'framer-motion';
import { CalendarCheck, DollarSign, BookOpen, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as Papa from 'papaparse';

const reportTypes = [
  { id: 'attendance', title: 'Attendance Report', desc: 'Class-wise attendance statistics', icon: <CalendarCheck size={24} />, bg: '#d1fae5', text: '#059669' },
  { id: 'fee', title: 'Fee Collection Report', desc: 'Monthly fee collection summary', icon: <DollarSign size={24} />, bg: '#fef3c7', text: '#d97706' },
  { id: 'marks', title: 'Marks Report', desc: 'Exam-wise marks analysis', icon: <BookOpen size={24} />, bg: '#e0e7ff', text: '#4f46e5' },
  { id: 'leave', title: 'Leave Report', desc: 'Staff and student leave records', icon: <FileText size={24} />, bg: '#ede9fe', text: '#7c3aed' },
];

const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
const inputS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none', backgroundColor: 'white', color: '#111827' };
const labelS: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 };

type ReportFilters = {
  class: string;
  section: string;
  feeStatus: string;
  attendanceRange: string;
  exam: string;
  subject: string;
  leaveStatus: string;
  leaveType: string;
  applicantRole: string;
  studentId: string;
};

const defaultFilters: ReportFilters = {
  class: '',
  section: '',
  feeStatus: '',
  attendanceRange: '',
  exam: '',
  subject: '',
  leaveStatus: '',
  leaveType: '',
  applicantRole: '',
  studentId: '',
};

function attendanceMatches(value: number, range: string) {
  if (!range) return true;
  if (range === 'Below 75%') return value < 75;
  if (range === '75% - 85%') return value >= 75 && value < 85;
  return value >= 85;
}

function getReportRows(selected: string | null, filters: ReportFilters, students: any[]) {
  const filteredStudents = students.filter((student) => (
    (!filters.class || student.class === filters.class) &&
    (!filters.section || student.section === filters.section) &&
    (!filters.studentId || student.id === filters.studentId)
  ));

  if (selected === 'fee') {
    return fees
      .map((fee) => ({ fee, student: students.find((item) => item.id === fee.studentId) }))
      .filter(({ fee, student }) => student && (!filters.class || student.class === filters.class) && (!filters.section || student.section === filters.section) && (!filters.feeStatus || fee.status === filters.feeStatus) && (!filters.studentId || student.id === filters.studentId))
      .map(({ fee, student }) => ({ Name: student!.name, Class: `${student!.class}-${student!.section}`, Status: fee.status, Balance: fee.balance }));
  }

  if (selected === 'marks') {
    return marks
      .map((mark) => ({ mark, student: students.find((item) => item.id === mark.studentId) }))
      .filter(({ mark, student }) => student && (!filters.class || student.class === filters.class) && (!filters.section || student.section === filters.section) && (!filters.exam || mark.exam === filters.exam) && (!filters.subject || mark.subject === filters.subject) && (!filters.studentId || student.id === filters.studentId))
      .map(({ mark, student }) => ({ Name: student!.name, Class: `${student!.class}-${student!.section}`, Exam: mark.exam, Subject: mark.subject, Score: `${mark.scored}/${mark.maxMarks}` }));
  }

  if (selected === 'leave') {
    return leaves
      .filter((leave) => (!filters.leaveStatus || leave.status === filters.leaveStatus) && (!filters.leaveType || leave.leaveType === filters.leaveType) && (!filters.applicantRole || leave.applicantRole === filters.applicantRole))
      .map((leave) => ({ Name: leave.applicantName, Role: leave.applicantRole, Type: leave.leaveType, Status: leave.status, Days: leave.days }));
  }

  return filteredStudents
    .filter((student) => attendanceMatches(student.attendancePercent, filters.attendanceRange))
    .map((student) => ({ Name: student.name, Class: `${student.class}-${student.section}`, 'Attendance %': student.attendancePercent }));
}

export function ReportsPage() {
  const { role } = useAuth();
  const { students } = useStudents();
  const visibleReportTypes = reportTypes.filter((r) => role !== 'teacher' || r.id !== 'fee');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const rows = getReportRows(selected, filters, students);
  const classOptions = Array.from(new Set(students.map((student) => student.class)));
  const sectionOptions = Array.from(new Set(students.map((student) => student.section)));
  const examOptions = Array.from(new Set(marks.map((mark) => mark.exam)));
  const subjectOptions = Array.from(new Set(marks.map((mark) => mark.subject)));

  const handleGenerate = (id: string) => {
    setSelected(id);
    setLoading(true);
    setGenerated(false);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 1000);
  };
  const setFilter = (key: keyof ReportFilters, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));

  const exportCSV = () => {
    const csv = Papa.unparse(rows as any);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected}_report.csv`;
    a.click();
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate and export school reports" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {visibleReportTypes.map((rt) => (
          <motion.button key={rt.id} onClick={() => handleGenerate(rt.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ backgroundColor: 'white', borderRadius: 16, border: selected === rt.id ? '2px solid #c7d2fe' : '1px solid #f1f5f9', padding: 20, textAlign: 'left', cursor: 'pointer', boxShadow: selected === rt.id ? '0 0 0 4px #eef2ff' : '0 1px 2px rgba(0,0,0,0.04)', transition: 'all 0.15s' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: rt.bg, color: rt.text }}>{rt.icon}</div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{rt.title}</h3>
            <p style={{ fontSize: 12, color: '#6b7280' }}>{rt.desc}</p>
          </motion.button>
        ))}
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...cs, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{visibleReportTypes.find((r) => r.id === selected)?.title}</h3>
            {generated && <button onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#4f46e5', backgroundColor: '#eef2ff', borderRadius: 8, border: 'none', cursor: 'pointer' }}><Download size={12} /> Export CSV</button>}
          </div>

          <div style={{ padding: 24, borderBottom: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {selected !== 'leave' && (
              <>
                <div><label style={labelS}>Class</label><select value={filters.class} onChange={(e) => { setFilter('class', e.target.value); setFilter('studentId', ''); }} style={inputS}><option value="">All classes</option>{classOptions.map((item) => <option key={item} value={item}>Class {item}</option>)}</select></div>
                <div><label style={labelS}>Section</label><select value={filters.section} onChange={(e) => { setFilter('section', e.target.value); setFilter('studentId', ''); }} style={inputS}><option value="">All sections</option>{sectionOptions.map((item) => <option key={item} value={item}>Section {item}</option>)}</select></div>
                <div>
                  <label style={labelS}>Student</label>
                  <select value={filters.studentId} onChange={(e) => setFilter('studentId', e.target.value)} style={inputS}>
                    <option value="">All students</option>
                    {students.filter((s) => (!filters.class || s.class === filters.class) && (!filters.section || s.section === filters.section)).map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.class}-{s.section})</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {selected === 'attendance' && <div><label style={labelS}>Attendance</label><select value={filters.attendanceRange} onChange={(e) => setFilter('attendanceRange', e.target.value)} style={inputS}><option value="">All attendance</option>{['Below 75%', '75% - 85%', '85% and above'].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>}
            {selected === 'fee' && <div><label style={labelS}>Fee Status</label><select value={filters.feeStatus} onChange={(e) => setFilter('feeStatus', e.target.value)} style={inputS}><option value="">All statuses</option>{['Paid', 'Partially Paid', 'Due', 'Overdue'].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>}
            {selected === 'marks' && (
              <>
                <div><label style={labelS}>Exam</label><select value={filters.exam} onChange={(e) => setFilter('exam', e.target.value)} style={inputS}><option value="">All exams</option>{examOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div><label style={labelS}>Subject</label><select value={filters.subject} onChange={(e) => setFilter('subject', e.target.value)} style={inputS}><option value="">All subjects</option>{subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              </>
            )}
            {selected === 'leave' && (
              <>
                <div><label style={labelS}>Status</label><select value={filters.leaveStatus} onChange={(e) => setFilter('leaveStatus', e.target.value)} style={inputS}><option value="">All statuses</option>{['Pending', 'Approved', 'Rejected'].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div><label style={labelS}>Leave Type</label><select value={filters.leaveType} onChange={(e) => setFilter('leaveType', e.target.value)} style={inputS}><option value="">All types</option>{['Sick', 'Casual', 'Emergency', 'Other'].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div><label style={labelS}>Applicant</label><select value={filters.applicantRole} onChange={(e) => setFilter('applicantRole', e.target.value)} style={inputS}><option value="">All applicants</option>{['Teacher', 'Student'].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              </>
            )}
            <button onClick={() => setFilters(defaultFilters)} style={{ alignSelf: 'end', padding: '9px 12px', fontSize: 13, fontWeight: 600, color: '#4f46e5', backgroundColor: '#eef2ff', borderRadius: 12, border: 'none', cursor: 'pointer' }}>Clear filters</button>
          </div>

          {loading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (<div key={i} style={{ display: 'flex', gap: 16 }}><Skeleton className="h-4 w-40" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /></div>))}
            </div>
          ) : generated && (
            <div>
              {selected === 'fee' && (
                <div style={{ padding: 24 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyFeeCollection}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs ${v / 1000}K`} /><Tooltip /><Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="responsive-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {Object.keys(rows[0] || {}).slice(0, 5).map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 15).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb', backgroundColor: i % 2 === 1 ? '#fafafa' : 'white' }}>
                      {Object.entries(row).slice(0, 5).map(([key, value]) => (
                        <td key={key} style={{ padding: '12px 24px', fontSize: 14, color: '#6b7280' }}>
                          {key === 'Name' ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar name={String(value)} size="sm" /><span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{String(value)}</span></div> : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {!rows.length && <div style={{ padding: 32, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>No records match the selected filters.</div>}
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
