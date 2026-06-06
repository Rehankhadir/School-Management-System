import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { students, marks as initialMarks, classes, sections, subjects } from '@/data/mockData';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { motion } from 'framer-motion';

const examTypes = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam'];
const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
const selectS: React.CSSProperties = { padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };

function getGrade(pct: number) { if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B'; if (pct >= 60) return 'C'; if (pct >= 50) return 'D'; return 'F'; }

export function MarksPage() {
  const { role } = useAuth();
  const canEnter = role === 'admin' || role === 'teacher';
  const [activeTab, setActiveTab] = useState(canEnter ? 'enter' : 'view');
  const [selExam, setSelExam] = useState('Unit Test 1');
  const [selClass, setSelClass] = useState('9');
  const [selSection, setSelSection] = useState('A');
  const [selSubject, setSelSubject] = useState('Mathematics');
  const [marksInput, setMarksInput] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const classStudents = students.filter((s) => s.class === selClass && s.section === selSection);
  const maxMarks = selExam.includes('Unit') ? 25 : 100;

  const loadStudents = () => {
    const init: Record<string, number> = {};
    classStudents.forEach((s) => { const e = initialMarks.find((m) => m.studentId === s.id && m.exam === selExam && m.subject === selSubject); init[s.id] = e?.scored || 0; });
    setMarksInput(init); setLoaded(true); setSaved(false);
  };

  const tabs = canEnter ? [{ id: 'enter', label: 'Enter Marks' }, { id: 'view', label: 'View Marks' }] : [{ id: 'view', label: 'View Marks' }];

  return (
    <>
      <PageHeader title="Marks" subtitle="Enter and manage student marks" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />

      <div style={{ marginTop: 24 }}>
        {activeTab === 'enter' && canEnter && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ ...cs, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Exam</label><select value={selExam} onChange={(e) => { setSelExam(e.target.value); setLoaded(false); }} style={selectS}>{examTypes.map((e) => <option key={e}>{e}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Class</label><select value={selClass} onChange={(e) => { setSelClass(e.target.value); setLoaded(false); }} style={selectS}>{classes.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Section</label><select value={selSection} onChange={(e) => { setSelSection(e.target.value); setLoaded(false); }} style={selectS}>{sections.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Subject</label><select value={selSubject} onChange={(e) => { setSelSubject(e.target.value); setLoaded(false); }} style={selectS}>{subjects.map((s) => <option key={s}>{s}</option>)}</select></div>
                <button onClick={loadStudents} style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}>Load Students</button>
              </div>
            </div>

            {loaded && (
              <>
                <div style={{ ...cs, overflow: 'hidden', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        {['Student', 'Roll No', `Marks (/${maxMarks})`, 'Grade'].map((h) => (
                          <th key={h} style={{ textAlign: h === 'Student' ? 'left' : 'center', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((s, i) => {
                        const val = marksInput[s.id] || 0;
                        const pct = (val / maxMarks) * 100;
                        const grade = getGrade(pct);
                        const invalid = val < 0 || val > maxMarks;
                        return (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb', backgroundColor: i % 2 === 1 ? '#fafafa' : 'white' }}>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280', textAlign: 'center' }}>{s.rollNo}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <input type="number" min={0} max={maxMarks} value={val}
                                onChange={(e) => setMarksInput((p) => ({ ...p, [s.id]: Number(e.target.value) }))} disabled={saved}
                                style={{ width: 80, padding: '4px 8px', fontSize: 14, textAlign: 'center', border: `1px solid ${invalid ? '#fda4af' : '#e5e7eb'}`, borderRadius: 8, outline: 'none', backgroundColor: invalid ? '#fff1f2' : 'white' }} />
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <Badge variant={grade.startsWith('A') ? 'success' : grade === 'B' ? 'info' : grade === 'C' ? 'warning' : 'danger'}>{grade}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {saved ? <Badge variant="success" showDot>✓ Marks saved successfully</Badge> : (
                  <button onClick={() => setSaved(true)} style={{ padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}>Save Marks</button>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'view' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ ...cs, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <select value={selExam} onChange={(e) => setSelExam(e.target.value)} style={selectS}>{examTypes.map((e) => <option key={e}>{e}</option>)}</select>
                <select value={selClass} onChange={(e) => setSelClass(e.target.value)} style={selectS}>{classes.map((c) => <option key={c} value={c}>Class {c}</option>)}</select>
                <select value={selSection} onChange={(e) => setSelSection(e.target.value)} style={selectS}>{sections.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
            </div>
            <div style={{ ...cs, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>Student</th>
                      {subjects.slice(0, 6).map((s) => (<th key={s} style={{ textAlign: 'center', padding: '12px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>{s.slice(0, 5)}</th>))}
                      <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s, i) => {
                      const sm = initialMarks.filter((m) => m.studentId === s.id && m.exam === selExam);
                      const ts = sm.reduce((sum, m) => sum + m.scored, 0);
                      const tm = sm.reduce((sum, m) => sum + m.maxMarks, 0);
                      const pct = tm > 0 ? Math.round((ts / tm) * 100) : 0;
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb', backgroundColor: i % 2 === 1 ? '#fafafa' : 'white' }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</td>
                          {subjects.slice(0, 6).map((sub) => { const m = sm.find((mk) => mk.subject === sub); return (<td key={sub} style={{ padding: '12px 8px', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>{m ? `${m.scored}/${m.maxMarks}` : '-'}</td>); })}
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#111827', textAlign: 'center' }}>{ts}/{tm}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#e11d48' }}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
