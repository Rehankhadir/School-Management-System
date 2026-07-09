import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { classes, sections, subjects, type MarkEntry, type Student, type Teacher } from '@/data/mockData';
import { getMarks, getTeachers, saveMarks } from '@/services/schoolModulesService';
import { getStudents } from '@/services/studentService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { motion } from 'framer-motion';
import { Award, BookOpen, Download, GraduationCap, Save, Search, TrendingUp, Users } from 'lucide-react';

const examTypes = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam'];
const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 20,
  border: '1px solid #eef2ff',
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.07)',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  fontSize: 14,
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  outline: 'none',
  backgroundColor: '#fff',
  color: '#111827',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  color: '#94a3b8',
  marginBottom: 6,
  letterSpacing: 0.5,
};

function getGrade(pct: number) { if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B'; if (pct >= 60) return 'C'; if (pct >= 50) return 'D'; return 'F'; }

function gradeVariant(grade: string): 'success' | 'info' | 'warning' | 'danger' {
  if (grade.startsWith('A')) return 'success';
  if (grade === 'B') return 'info';
  if (grade === 'C') return 'warning';
  return 'danger';
}

function escapeHtml(value: string | number) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function parseAssignedClasses(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean).map((label) => ({
    klass: label.replace(/[^\d]/g, ''),
    section: label.replace(/\d/g, '') || 'A',
    label,
  }));
}

function buildProgressCardHtml(
  student: Student,
  examRows: { exam: string; total: number; max: number; percent: number }[],
  subjectRows: { subject: string; total: number; max: number; percent: number }[],
  markRows: { exam: string; subject: string; scored: number; maxMarks: number; percent: number; grade: string }[],
  overall: { total: number; max: number; percent: number }
) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const completeMarksByExam = examRows.map((examRow) => {
    const rows = markRows.filter((row) => row.exam === examRow.exam);
    return `<div class="exam-block"><h3>${escapeHtml(examRow.exam)}</h3><table><thead><tr><th>Subject</th><th>Score</th><th>Percentage</th><th>Grade</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.subject)}</td><td>${escapeHtml(row.scored)}/${escapeHtml(row.maxMarks)}</td><td>${escapeHtml(row.percent)}%</td><td><span class="grade">${escapeHtml(row.grade)}</span></td></tr>`).join('')}</tbody></table></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(student.name)} Progress Card</title><style>
    @page{size:A4;margin:24px}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111827;background:#f4f6fb}.page{background:#fff;min-height:100vh;border:1px solid #e5e7eb}.cover{background:#4f46e5;background-image:linear-gradient(135deg,#4f46e5,#111827);color:#fff;padding:30px 34px;position:relative;overflow:hidden}.cover:after{content:"";position:absolute;width:240px;height:240px;border-radius:999px;right:-80px;top:-80px;background:rgba(255,255,255,.12)}.school{font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:.82}.title{font-size:32px;font-weight:800;margin-top:8px}.meta{font-size:13px;opacity:.86;margin-top:8px}.student{display:flex;justify-content:space-between;gap:18px;padding:24px 34px;border-bottom:1px solid #eef2ff}.student h1{margin:0;font-size:24px}.student p{margin:7px 0 0;color:#6b7280;font-size:13px}.score{text-align:right}.score strong{color:#4f46e5;font-size:38px;line-height:1}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:22px 34px}.metric{border:1px solid #e5e7eb;border-radius:14px;padding:14px;background:#f8fafc}.metric b{font-size:20px}.metric span{display:block;margin-top:5px;color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:700}.section{padding:0 34px 22px}.section h2{font-size:16px;margin:10px 0 12px}.exam-block{margin-bottom:16px}.exam-block h3{margin:0 0 8px;font-size:14px;color:#4338ca}table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}th{background:#f8fafc;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:left;padding:12px}td{padding:12px;border-top:1px solid #eef2ff;font-size:13px}.grade{display:inline-block;min-width:34px;text-align:center;border-radius:999px;padding:5px 9px;background:#eef2ff;color:#4338ca;font-weight:800}.bar{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden}.bar span{display:block;height:100%;background:linear-gradient(90deg,#10b981,#4f46e5);border-radius:999px}.footer{display:flex;justify-content:space-between;padding:20px 34px 28px;color:#6b7280;font-size:12px}@media print{body{background:#fff}.page{border:0}.cover,.metric,th,.grade,.bar,.bar span{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><main class="page">
    <section class="cover"><div class="school">Sunrise Public School</div><div class="title">Student Progress Card</div><div class="meta">Complete academic performance across all exams</div></section>
    <section class="student"><div><h1>${escapeHtml(student.name)}</h1><p>Class ${escapeHtml(student.class)}${escapeHtml(student.section)} | Roll ${escapeHtml(student.rollNo)} | Generated ${escapeHtml(today)}</p></div><div class="score"><strong>${escapeHtml(overall.percent)}%</strong><p>Overall Grade ${escapeHtml(getGrade(overall.percent))}</p></div></section>
    <section class="grid"><div class="metric"><b>${escapeHtml(overall.total)}/${escapeHtml(overall.max)}</b><span>Total Marks</span></div><div class="metric"><b>${escapeHtml(examRows.length)}</b><span>Exams Covered</span></div><div class="metric"><b>${escapeHtml(subjectRows.length)}</b><span>Subjects</span></div></section>
    <section class="section"><h2>Exam Performance</h2><table><thead><tr><th>Exam</th><th>Score</th><th>Percentage</th><th>Grade</th></tr></thead><tbody>${examRows.map((row) => `<tr><td>${escapeHtml(row.exam)}</td><td>${escapeHtml(row.total)}/${escapeHtml(row.max)}</td><td>${escapeHtml(row.percent)}%</td><td><span class="grade">${escapeHtml(getGrade(row.percent))}</span></td></tr>`).join('')}</tbody></table></section>
    <section class="section"><h2>Complete Marks</h2>${completeMarksByExam}</section>
    <section class="section"><h2>Subject Performance</h2><table><thead><tr><th>Subject</th><th>Score</th><th>Average</th><th>Progress</th></tr></thead><tbody>${subjectRows.map((row) => `<tr><td>${escapeHtml(row.subject)}</td><td>${escapeHtml(row.total)}/${escapeHtml(row.max)}</td><td>${escapeHtml(row.percent)}%</td><td><div class="bar"><span style="width:${Math.min(100, row.percent)}%"></span></div></td></tr>`).join('')}</tbody></table></section>
    <section class="footer"><span>Prepared by School Management System</span><span>Authorized academic progress summary</span></section>
  </main><script>window.onload=()=>{setTimeout(()=>window.print(),250)}</script></body></html>`;
}

function MetricCard({ label, value, helper, icon, tone }: { label: string; value: string | number; helper: string; icon: React.ReactNode; tone: string }) {
  return (
    <div style={{ ...cardStyle, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: tone, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 24, color: '#111827', fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{helper}</div>
      </div>
    </div>
  );
}

export function MarksPage() {
  const { role, user } = useAuth();
  const canEnter = role === 'admin' || role === 'teacher';
  const [activeTab, setActiveTab] = useState(canEnter ? 'enter' : 'view');
  const [selExam, setSelExam] = useState('Unit Test 1');
  const [selClass, setSelClass] = useState('9');
  const [selSection, setSelSection] = useState('A');
  const [selSubject, setSelSubject] = useState('Mathematics');
  const [marksInput, setMarksInput] = useState<Record<string, number>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const isParent = String(role || user?.role || '').toLowerCase() === 'parent';
  const isTeacher = String(role || user?.role || '').toLowerCase() === 'teacher';
  const currentTeacher = isTeacher ? teachers.find((teacher) => teacher.email === user?.email || teacher.name === user?.name) : null;
  const assignedClasses = currentTeacher ? parseAssignedClasses(currentTeacher.classAssigned) : [];
  const classOptions = isTeacher && assignedClasses.length ? Array.from(new Set(assignedClasses.map((item) => item.klass))) : classes;
  const sectionOptions = isTeacher && assignedClasses.length
    ? assignedClasses.filter((item) => item.klass === selClass).map((item) => item.section)
    : sections;
  const subjectOptions = isTeacher && currentTeacher?.subjects.length ? currentTeacher.subjects : subjects;
  const parentEmail = (user?.email || '').trim().toLowerCase();
  const parentName = (user?.name || '').trim().toLowerCase();
  const visibleStudents = isParent
    ? students.filter((student) => (
      student.guardianEmail.trim().toLowerCase() === parentEmail ||
      student.guardianName.trim().toLowerCase() === parentName
    ))
    : students;
  const classStudents = isParent
    ? visibleStudents
    : visibleStudents.filter((student) => student.class === selClass && student.section === selSection);
  const maxMarks = selExam.includes('Unit') ? 25 : 100;
  const visibleExamTypes = isParent ? ['All Exams', ...examTypes] : examTypes;
  const selectedExamNames = isParent && selExam === 'All Exams' ? examTypes : [selExam];
  const progressStudent = isParent ? visibleStudents[0] : null;
  const progressMarks = progressStudent ? marks.filter((mark) => mark.studentId === progressStudent.id) : [];

  const progressExamRows = examTypes.map((exam) => {
    const rows = progressMarks.filter((mark) => mark.exam === exam);
    const total = rows.reduce((sum, mark) => sum + mark.scored, 0);
    const max = rows.reduce((sum, mark) => sum + mark.maxMarks, 0);
    return { exam, total, max, percent: max ? Math.round((total / max) * 100) : 0 };
  });
  const progressSubjectRows = Array.from(new Set(progressMarks.map((mark) => mark.subject))).map((subject) => {
    const rows = progressMarks.filter((mark) => mark.subject === subject);
    const total = rows.reduce((sum, mark) => sum + mark.scored, 0);
    const max = rows.reduce((sum, mark) => sum + mark.maxMarks, 0);
    return { subject, total, max, percent: max ? Math.round((total / max) * 100) : 0 };
  });
  const progressMarkRows = progressMarks.map((mark) => {
    const percent = Math.round((mark.scored / mark.maxMarks) * 100);
    return { exam: mark.exam, subject: mark.subject, scored: mark.scored, maxMarks: mark.maxMarks, percent, grade: mark.grade || getGrade(percent) };
  });
  const progressTotal = progressExamRows.reduce((sum, row) => sum + row.total, 0);
  const progressMax = progressExamRows.reduce((sum, row) => sum + row.max, 0);
  const overallPercent = progressMax ? Math.round((progressTotal / progressMax) * 100) : 0;

  const dashboardStats = useMemo(() => {
    const relevantMarks = isParent ? progressMarks : marks.filter((mark) => classStudents.some((student) => student.id === mark.studentId));
    const total = relevantMarks.reduce((sum, mark) => sum + mark.scored, 0);
    const max = relevantMarks.reduce((sum, mark) => sum + mark.maxMarks, 0);
    const avg = max ? Math.round((total / max) * 100) : 0;
    return {
      avg,
      subjects: new Set(relevantMarks.map((mark) => mark.subject)).size,
      exams: new Set(relevantMarks.map((mark) => mark.exam)).size,
      records: relevantMarks.length,
    };
  }, [classStudents, isParent, marks, progressMarks]);

  const generateProgressCard = () => {
    if (!progressStudent) return;
    const html = buildProgressCardHtml(progressStudent, progressExamRows, progressSubjectRows, progressMarkRows, {
      total: progressTotal,
      max: progressMax,
      percent: overallPercent,
    });
    const win = window.open('', '_blank', 'width=980,height=1200');
    if (!win) {
      alert('Please allow popups to generate the progress card PDF.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  const loadStudents = () => {
    const init: Record<string, number> = {};
    classStudents.forEach((student) => {
      const row = marks.find((mark) => mark.studentId === student.id && mark.exam === selExam && mark.subject === selSubject);
      init[student.id] = row?.scored || 0;
    });
    setMarksInput(init);
    setLoaded(true);
    setSaved(false);
  };

  const handleSaveMarks = async () => {
    const rows: MarkEntry[] = classStudents.map((student) => {
      const scored = Math.max(0, Math.min(maxMarks, Number(marksInput[student.id] || 0)));
      const percent = Math.round((scored / maxMarks) * 100);
      return {
        studentId: student.id,
        exam: selExam,
        subject: selSubject,
        maxMarks,
        scored,
        grade: getGrade(percent),
      };
    });
    const { data, error } = await saveMarks(rows);
    if (error) {
      setError(error.message || 'Unable to save marks.');
      return;
    }
    setMarks((prev) => {
      const changed = new Set(data.map((row) => `${row.studentId}-${row.exam}-${row.subject}`));
      return [
        ...prev.filter((row) => !changed.has(`${row.studentId}-${row.exam}-${row.subject}`)),
        ...data,
      ];
    });
    setSaved(true);
  };

  useEffect(() => {
    let active = true;
    async function load() {
      const [studentResult, markResult, teacherResult] = await Promise.all([getStudents(), getMarks(), getTeachers()]);
      if (!active) return;
      if (studentResult.error) setError(studentResult.error.message);
      else setStudents(studentResult.data);
      if (markResult.error) setError(markResult.error.message);
      else setMarks(markResult.data);
      if (teacherResult.error) setError(teacherResult.error.message);
      else setTeachers(teacherResult.data);
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!canEnter || activeTab !== 'enter') return;
    const nextClass = classOptions.includes(selClass) ? selClass : classOptions[0];
    const nextSections = isTeacher && assignedClasses.length
      ? assignedClasses.filter((item) => item.klass === nextClass).map((item) => item.section)
      : sections;
    const nextSection = nextSections.includes(selSection) ? selSection : nextSections[0];
    const nextSubject = subjectOptions.includes(selSubject) ? selSubject : subjectOptions[0];
    if (nextClass !== selClass) setSelClass(nextClass);
    if (nextSection !== selSection) setSelSection(nextSection);
    if (nextSubject !== selSubject) setSelSubject(nextSubject);
  }, [activeTab, assignedClasses, canEnter, classOptions, isTeacher, selClass, selSection, selSubject, subjectOptions]);

  useEffect(() => {
    if (!canEnter || activeTab !== 'enter') return;
    loadStudents();
  }, [activeTab, canEnter, selClass, selExam, selSection, selSubject]);

  const tabs = canEnter ? [{ id: 'enter', label: 'Enter Marks' }, { id: 'view', label: 'View Marks' }] : [{ id: 'view', label: 'View Marks' }];

  return (
    <>
      <PageHeader title="Marks" subtitle={isParent ? "View your child's academic performance" : 'Enter, review, and analyze student marks'} />
      {error && <div style={{ padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff1f2', color: '#be123c', fontSize: 14, border: '1px solid #fecdd3' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 22 }}>
        <MetricCard label="Average Score" value={`${dashboardStats.avg}%`} helper={isParent ? 'Child performance' : 'Selected class'} icon={<TrendingUp size={22} color="#059669" />} tone="#ecfdf5" />
        <MetricCard label="Exam Coverage" value={dashboardStats.exams} helper="Exam types recorded" icon={<Award size={22} color="#4f46e5" />} tone="#eef2ff" />
        <MetricCard label="Subjects" value={dashboardStats.subjects} helper="Subjects assessed" icon={<BookOpen size={22} color="#d97706" />} tone="#fff7ed" />
        <MetricCard label={isParent ? 'Child' : 'Students'} value={isParent ? visibleStudents.length : classStudents.length} helper={isParent ? 'Linked account' : 'Current roster'} icon={<Users size={22} color="#9333ea" />} tone="#f5f3ff" />
      </div>

      <div style={{ ...cardStyle, padding: 8, display: 'inline-flex', marginBottom: 22 }}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
      </div>

      {activeTab === 'enter' && canEnter && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ ...cardStyle, padding: 18, marginBottom: 18 }}>
            <div className="responsive-table-wrap">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) auto', gap: 12, alignItems: 'end', minWidth: 820 }}>
                <div><label style={labelStyle}>Exam</label><select value={selExam} onChange={(event) => setSelExam(event.target.value)} style={inputStyle}>{examTypes.map((exam) => <option key={exam}>{exam}</option>)}</select></div>
                <div><label style={labelStyle}>Class</label><select value={selClass} onChange={(event) => setSelClass(event.target.value)} style={inputStyle}>{classOptions.map((item) => <option key={item} value={item}>Class {item}</option>)}</select></div>
                <div><label style={labelStyle}>Section</label><select value={selSection} onChange={(event) => setSelSection(event.target.value)} style={inputStyle}>{sectionOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
                <div><label style={labelStyle}>Subject</label><select value={selSubject} onChange={(event) => setSelSubject(event.target.value)} style={inputStyle}>{subjectOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
                <button onClick={loadStudents} style={{ minHeight: 43, padding: '0 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 800, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Search size={17} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {loaded && (
            <>
              <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>Class {selClass}{selSection} - {selSubject}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{selExam} marks entry, maximum {maxMarks}</div>
                  </div>
                  <Badge variant="neutral">{classStudents.length} students</Badge>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #eef2ff' }}>
                        {['Student', 'Roll No', `Marks / ${maxMarks}`, 'Grade', 'Progress'].map((heading) => (
                          <th key={heading} style={{ textAlign: heading === 'Student' ? 'left' : 'center', padding: '13px 16px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student) => {
                        const value = marksInput[student.id] || 0;
                        const pct = Math.round((value / maxMarks) * 100);
                        const grade = getGrade(pct);
                        const invalid = value < 0 || value > maxMarks;
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{student.name}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Class {student.class}{student.section}</div>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: 14, color: '#64748b', textAlign: 'center' }}>{student.rollNo}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                max={maxMarks}
                                value={value}
                                onChange={(event) => setMarksInput((current) => ({ ...current, [student.id]: Number(event.target.value) }))}
                                disabled={saved}
                                style={{ width: 92, padding: '8px 10px', fontSize: 14, textAlign: 'center', border: `1px solid ${invalid ? '#fda4af' : '#e5e7eb'}`, borderRadius: 12, outline: 'none', backgroundColor: invalid ? '#fff1f2' : '#fff' }}
                              />
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}><Badge variant={gradeVariant(grade)}>{grade}</Badge></td>
                            <td style={{ padding: '14px 16px', minWidth: 150 }}>
                              <div style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444' }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {saved ? (
                <Badge variant="success" showDot>Marks saved successfully</Badge>
              ) : (
                <button onClick={handleSaveMarks} style={{ padding: '11px 20px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 800, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Save size={17} /> Save Marks
                </button>
              )}
            </>
          )}
        </motion.div>
      )}

      {activeTab === 'view' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ ...cardStyle, padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <select value={selExam} onChange={(event) => setSelExam(event.target.value)} style={{ ...inputStyle, width: 180 }}>{visibleExamTypes.map((exam) => <option key={exam}>{exam}</option>)}</select>
                {!isParent && (
                  <>
                    <select value={selClass} onChange={(event) => setSelClass(event.target.value)} style={{ ...inputStyle, width: 140 }}>{classes.map((item) => <option key={item} value={item}>Class {item}</option>)}</select>
                    <select value={selSection} onChange={(event) => setSelSection(event.target.value)} style={{ ...inputStyle, width: 130 }}>{sections.map((item) => <option key={item}>{item}</option>)}</select>
                  </>
                )}
              </div>
              {isParent && progressStudent && (
                <button onClick={generateProgressCard} style={{ padding: '11px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 800, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Download size={17} /> Generate Progress Card PDF
                </button>
              )}
            </div>
          </div>

          {isParent && progressStudent && (
            <div style={{ ...cardStyle, padding: 20, marginBottom: 18, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <GraduationCap size={22} color="#4f46e5" />
                  <h3 style={{ margin: 0, color: '#111827', fontSize: 18, fontWeight: 900 }}>{progressStudent.name}</h3>
                </div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Class {progressStudent.class}{progressStudent.section} | Roll {progressStudent.rollNo}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#4f46e5', fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{overallPercent}%</div>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, marginTop: 3 }}>Overall average</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedExamNames.map((examName) => (
              <div key={examName} style={{ ...cardStyle, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#111827', fontSize: 16, fontWeight: 900 }}>{examName}</div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>{isParent ? 'Subject-wise marks for linked child' : `Class ${selClass}${selSection} mark sheet`}</div>
                  </div>
                  <Badge variant="neutral">{classStudents.length} records</Badge>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #eef2ff' }}>
                        <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}>Student</th>
                        {subjects.slice(0, 6).map((subject) => (<th key={subject} style={{ textAlign: 'center', padding: '13px 10px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}>{subject.slice(0, 5)}</th>))}
                        <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}>Total</th>
                        <th style={{ textAlign: 'center', padding: '13px 16px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student) => {
                        const studentMarks = marks.filter((mark) => mark.studentId === student.id && mark.exam === examName);
                        const total = studentMarks.reduce((sum, mark) => sum + mark.scored, 0);
                        const max = studentMarks.reduce((sum, mark) => sum + mark.maxMarks, 0);
                        const pct = max > 0 ? Math.round((total / max) * 100) : 0;
                        return (
                          <tr key={`${examName}-${student.id}`} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{student.name}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Roll {student.rollNo}</div>
                            </td>
                            {subjects.slice(0, 6).map((subject) => {
                              const mark = studentMarks.find((item) => item.subject === subject);
                              return (<td key={subject} style={{ padding: '14px 10px', fontSize: 13, color: '#64748b', textAlign: 'center', fontWeight: 700 }}>{mark ? `${mark.scored}/${mark.maxMarks}` : '-'}</td>);
                            })}
                            <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 900, color: '#111827', textAlign: 'center' }}>{total}/{max}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{ display: 'inline-flex', minWidth: 54, justifyContent: 'center', borderRadius: 999, padding: '6px 10px', fontSize: 13, fontWeight: 900, color: pct >= 80 ? '#047857' : pct >= 60 ? '#b45309' : '#be123c', backgroundColor: pct >= 80 ? '#ecfdf5' : pct >= 60 ? '#fffbeb' : '#fff1f2' }}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {classStudents.length === 0 && isParent && (
                    <div style={{ padding: 32, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>No marks are linked to this parent account.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}
