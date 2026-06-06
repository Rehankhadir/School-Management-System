import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { students, marks, attendanceRecords, fees } from '@/data/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };

export function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const student = students.find((s) => s.id === id);
  if (!student) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Student Not Found</h2>
        <button onClick={() => navigate('/students')} style={{ color: '#4f46e5', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Students</button>
      </div>
    );
  }

  const sMarks = marks.filter((m) => m.studentId === id);
  const sAttend = attendanceRecords.filter((a) => a.studentId === id);
  const sFee = fees.find((f) => f.studentId === id);

  const presentCount = sAttend.filter((a) => a.status === 'Present').length;
  const absentCount = sAttend.filter((a) => a.status === 'Absent').length;
  const lateCount = sAttend.filter((a) => a.status === 'Late').length;

  const examPerf = ['Unit Test 1', 'Unit Test 2', 'Mid Term'].map((exam) => {
    const em = sMarks.filter((m) => m.exam === exam);
    const ts = em.reduce((s, m) => s + m.scored, 0);
    const tm = em.reduce((s, m) => s + m.maxMarks, 0);
    return { exam: exam.replace('Unit Test ', 'UT'), percentage: tm > 0 ? Math.round((ts / tm) * 100) : 0 };
  });

  const tabs = [{ id: 'profile', label: 'Profile' }, { id: 'attendance', label: 'Attendance' }, { id: 'marks', label: 'Marks' }, { id: 'fees', label: 'Fees' }, { id: 'documents', label: 'Documents' }];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={() => navigate('/students')} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Header card */}
      <div style={{ ...cs, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ height: 120, background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }} />
        <div style={{ padding: '0 24px 24px', marginTop: -40 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
            <Avatar name={student.name} size="xl" className="ring-4 ring-white" />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{student.name}</h1>
              <p style={{ fontSize: 14, color: '#6b7280' }}>Roll No: {student.rollNo}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Badge variant="indigo">Class {student.class}-{student.section}</Badge>
                <Badge variant={student.feeStatus === 'Paid' ? 'success' : student.feeStatus === 'Overdue' ? 'danger' : 'warning'} showDot>{student.feeStatus}</Badge>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { val: `${student.attendancePercent}%`, label: 'Attendance' },
                { val: `₹${sFee?.totalAmount?.toLocaleString()}`, label: 'Total Fees' },
                { val: `₹${sFee?.amountPaid?.toLocaleString()}`, label: 'Paid', color: '#059669' },
                { val: `₹${sFee?.balance?.toLocaleString()}`, label: 'Balance', color: '#e11d48' },
              ].map((s) => (
                <div key={s.label} style={{ padding: 12, borderRadius: 12, backgroundColor: '#f9fafb', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color || '#111827' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div style={{ marginTop: 24 }}>
        {activeTab === 'profile' && (
          <div style={{ ...cs, padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Personal Information</h3>
                {[
                  { icon: <Calendar size={16} />, label: 'Date of Birth', value: new Date(student.dob).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  { icon: <BookOpen size={16} />, label: 'Gender', value: student.gender },
                  { icon: <BookOpen size={16} />, label: 'Blood Group', value: student.bloodGroup },
                  { icon: <Calendar size={16} />, label: 'Admission Date', value: new Date(student.admissionDate).toLocaleDateString('en-IN') },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: 14, color: '#111827' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Guardian Information</h3>
                {[
                  { icon: <BookOpen size={16} />, label: 'Guardian Name', value: student.guardianName },
                  { icon: <Phone size={16} />, label: 'Phone', value: student.guardianPhone },
                  { icon: <Mail size={16} />, label: 'Email', value: student.guardianEmail },
                  { icon: <MapPin size={16} />, label: 'Address', value: student.address },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: 14, color: '#111827' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { val: presentCount, label: 'Present', color: '#059669' },
                { val: absentCount, label: 'Absent', color: '#e11d48' },
                { val: lateCount, label: 'Late', color: '#d97706' },
              ].map((s) => (
                <div key={s.label} style={{ ...cs, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ ...cs, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>February 2025</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 500, color: '#9ca3af', padding: 4 }}>{d}</div>
                ))}
                {Array.from({ length: 6 }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: 28 }, (_, i) => {
                  const date = `2025-02-${String(i + 1).padStart(2, '0')}`;
                  const record = sAttend.find((a) => a.date === date);
                  const dayOfWeek = new Date(date).getDay();
                  const isSunday = dayOfWeek === 0;
                  const bgColor = isSunday ? '#f3f4f6' : !record ? '#f9fafb' : record.status === 'Present' ? '#d1fae5' : record.status === 'Absent' ? '#ffe4e6' : '#fef3c7';
                  const textColor = isSunday ? '#9ca3af' : !record ? '#9ca3af' : record.status === 'Present' ? '#065f46' : record.status === 'Absent' ? '#9f1239' : '#92400e';
                  return (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, backgroundColor: bgColor, color: textColor }} title={record?.status || ''}>{i + 1}</div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
                {[{ c: '#d1fae5', l: 'Present' }, { c: '#ffe4e6', l: 'Absent' }, { c: '#fef3c7', l: 'Late' }].map((x) => (
                  <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: x.c }} /><span style={{ fontSize: 12, color: '#6b7280' }}>{x.l}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marks' && (
          <div>
            <div style={{ ...cs, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Performance Across Exams</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={examPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="exam" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {['Unit Test 1', 'Unit Test 2', 'Mid Term'].map((exam) => {
              const em = sMarks.filter((m) => m.exam === exam);
              if (!em.length) return null;
              return (
                <div key={exam} style={{ ...cs, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{exam}</h3>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        {['Subject', 'Max', 'Scored', '%', 'Grade'].map((h) => (
                          <th key={h} style={{ textAlign: h === 'Subject' ? 'left' : 'center', padding: '12px 24px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {em.map((m, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '12px 24px', fontSize: 14, color: '#111827' }}>{m.subject}</td>
                          <td style={{ padding: '12px 24px', fontSize: 14, color: '#6b7280', textAlign: 'center' }}>{m.maxMarks}</td>
                          <td style={{ padding: '12px 24px', fontSize: 14, fontWeight: 500, color: '#111827', textAlign: 'center' }}>{m.scored}</td>
                          <td style={{ padding: '12px 24px', fontSize: 14, color: '#6b7280', textAlign: 'center' }}>{Math.round((m.scored / m.maxMarks) * 100)}%</td>
                          <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                            <Badge variant={m.grade.startsWith('A') ? 'success' : m.grade === 'B' ? 'info' : m.grade === 'C' ? 'warning' : 'danger'}>{m.grade}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'fees' && sFee && (
          <div>
            <div style={{ ...cs, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Fee Structure</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {sFee.feeStructure.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '8px 0', fontSize: 14, color: '#374151' }}>{item.item}</td>
                      <td style={{ padding: '8px 0', fontSize: 14, fontWeight: 500, color: '#111827', textAlign: 'right' }}>₹{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#111827' }}>Total</td>
                    <td style={{ padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#111827', textAlign: 'right' }}>₹{sFee.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {sFee.paymentHistory.length > 0 && (
              <div style={{ ...cs, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Payment History</h3>
                {sFee.paymentHistory.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#059669' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>₹{p.amount.toLocaleString()} — {p.mode}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Receipt: {p.receiptNo} · {new Date(p.date).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={{ ...cs, padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><BookOpen size={32} color="#9ca3af" /></div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>No Documents</h3>
              <p style={{ fontSize: 14, color: '#6b7280' }}>Upload documents for this student</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
