import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { students, monthlyFeeCollection } from '@/data/mockData';
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

export function ReportsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = (id: string) => { setSelected(id); setLoading(true); setGenerated(false); setTimeout(() => { setLoading(false); setGenerated(true); }, 1000); };

  const exportCSV = () => {
    const data = selected === 'fee' ? monthlyFeeCollection.map((m) => ({ Month: m.month, 'Amount (₹)': m.amount }))
      : students.map((s) => ({ Name: s.name, Class: `${s.class}-${s.section}`, [selected === 'attendance' ? 'Attendance %' : 'Fee Status']: selected === 'attendance' ? s.attendancePercent : s.feeStatus }));
    const csv = Papa.unparse(data as any); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${selected}_report.csv`; a.click();
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate and export school reports" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {reportTypes.map((rt) => (
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
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{reportTypes.find((r) => r.id === selected)?.title}</h3>
            {generated && <button onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#4f46e5', backgroundColor: '#eef2ff', borderRadius: 8, border: 'none', cursor: 'pointer' }}><Download size={12} /> Export CSV</button>}
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
                    <BarChart data={monthlyFeeCollection}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} /><Tooltip /><Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Name', 'Class', selected === 'attendance' ? 'Attendance %' : 'Fee Status'].map((h) => (
                      <th key={h} style={{ textAlign: h.includes('%') || h === 'Fee Status' ? 'center' : 'left', padding: '12px 24px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 15).map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb', backgroundColor: i % 2 === 1 ? '#fafafa' : 'white' }}>
                      <td style={{ padding: '12px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar name={s.name} size="sm" /><span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</span></div>
                      </td>
                      <td style={{ padding: '12px 24px', fontSize: 14, color: '#6b7280' }}>{s.class}-{s.section}</td>
                      <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                        {selected === 'attendance' ? (
                          <span style={{ fontSize: 14, fontWeight: 600, color: s.attendancePercent >= 85 ? '#059669' : s.attendancePercent >= 75 ? '#d97706' : '#e11d48' }}>{s.attendancePercent}%</span>
                        ) : (
                          <Badge variant={s.feeStatus === 'Paid' ? 'success' : s.feeStatus === 'Overdue' ? 'danger' : 'warning'} showDot>{s.feeStatus}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
