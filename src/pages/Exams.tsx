import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { subjects, type ExamSchedule, type Student } from '@/data/mockData';
import { getExams, saveExam } from '@/services/schoolModulesService';
import { getStudents } from '@/services/studentService';
import { Badge } from '@/components/ui/Badge';
import { Plus, Edit2, Trash2, Calendar, Clock, BookOpen, Search } from 'lucide-react';

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', options);
}

function subjectExamSchedule(exam: ExamSchedule) {
  if (exam.subject) {
    return [{
      subject: exam.subject,
      date: exam.date,
      time: exam.time || 'Time not set',
    }];
  }

  const start = new Date(exam.date);
  return subjects.slice(0, 6).map((subject, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      subject,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      time: index < 3 ? '09:00 - 11:00' : '11:30 - 01:30',
    };
  });
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #f1f5f9',
  borderRadius: 18,
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.07)',
};

export function ExamsPage() {
  const { role, user } = useAuth();
  const canManage = role === 'admin' || role === 'teacher';
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: 'Unit Test 1', subject: subjects[0], class: '9', section: 'A', date: new Date().toISOString().slice(0, 10), time: '09:00 - 11:00' });

  useEffect(() => {
    let active = true;
    async function load() {
      const [studentResult, examResult] = await Promise.all([getStudents(), getExams()]);
      if (!active) return;
      if (studentResult.error) setError(studentResult.error.message);
      else setStudents(studentResult.data);
      if (examResult.error) setError(examResult.error.message);
      else setExams(examResult.data);
    }
    load();
    return () => { active = false; };
  }, []);

  const isParent = String(role || user?.role || '').toLowerCase() === 'parent';
  const linkedChildren = isParent
    ? students.filter((student) => (
      student.guardianEmail.trim().toLowerCase() === (user?.email || '').trim().toLowerCase() ||
      student.guardianName.trim().toLowerCase() === (user?.name || '').trim().toLowerCase()
    ))
    : [];
  const visibleExams = isParent
    ? exams.filter((exam) => linkedChildren.some((student) => exam.class === student.class && (!exam.section || exam.section === student.section)))
    : exams;

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return visibleExams.filter((exam) => (
      `${exam.name} ${exam.subject || ''} ${exam.class}${exam.section || ''} ${exam.date} ${exam.time || ''} ${exam.description || ''}`
        .toLowerCase()
        .includes(needle)
    ));
  }, [visibleExams, query]);

  const examGroups = filtered.reduce<Array<{ date: string; exams: ExamSchedule[] }>>((groups, exam) => {
    const existing = groups.find((group) => group.date === exam.date);
    if (existing) existing.exams.push(exam);
    else groups.push({ date: exam.date, exams: [exam] });
    return groups;
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: 'Unit Test 1', subject: subjects[0], class: '9', section: 'A', date: new Date().toISOString().slice(0, 10), time: '09:00 - 11:00' });
  };

  const startEdit = (exam: ExamSchedule) => {
    setEditing(exam.id);
    setForm({
      name: exam.name,
      subject: exam.subject || subjects[0],
      class: exam.class,
      section: exam.section || '',
      date: exam.date,
      time: exam.time || '09:00 - 11:00',
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextExam: ExamSchedule = {
      id: editing || `e${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`,
      name: form.name.trim() || 'Untitled Exam',
      subject: form.subject,
      class: form.class.trim() || '9',
      section: form.section.trim() || undefined,
      date: form.date || new Date().toISOString().slice(0, 10),
      time: form.time.trim(),
    };

    const { data, error } = await saveExam(nextExam);
    if (error || !data) {
      setError(error?.message || 'Unable to save exam.');
      return;
    }
    setExams((prev) => (editing ? prev.map((exam) => exam.id === data.id ? data : exam) : [...prev, data]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    resetForm();
  };

  const handleDelete = (id: string) => {
    setError('Exam delete is not enabled yet. You can edit or create exams in Supabase-backed mode.');
  };

  return (
    <div>
      <PageHeader title="Exams" subtitle={isParent ? "View your child's exam timetable" : 'Manage and view exam schedules'} />
      {error && <div style={{ padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff1f2', color: '#be123c', fontSize: 14, border: '1px solid #fecdd3' }}>{error}</div>}

      <div className={canManage ? 'responsive-sidebar-layout' : ''} style={{ display: 'grid', gap: 24, alignItems: 'start' }}>
        <section style={{ minWidth: 0 }}>
          <div style={{ ...cardStyle, padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 340px', maxWidth: 520 }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: 13 }} />
                <input
                  placeholder="Search exam, subject, class, date..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  style={{ width: '100%', height: 44, padding: '0 14px 0 42px', borderRadius: 14, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#111827', outline: 'none' }}
                />
              </div>
              <Badge variant="neutral">{filtered.length} exams</Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            {examGroups.map((group) => (
              <div key={group.date} style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
                <div style={{ borderRadius: 18, background: '#4f46e5', padding: '12px 8px', textAlign: 'center', boxShadow: '0 12px 24px rgba(79, 70, 229, 0.22)', position: 'sticky', top: 86 }}>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{formatDate(group.date, { day: '2-digit' })}</div>
                  <div style={{ color: '#c7d2fe', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginTop: 4 }}>{formatDate(group.date, { month: 'short' })}</div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ color: '#111827', fontSize: 15, fontWeight: 800 }}>{formatDate(group.date, { weekday: 'long', year: 'numeric' })}</div>
                  {group.exams.map((exam) => (
                    <article key={exam.id} style={{ ...cardStyle, display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr)', gap: 12, padding: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: '#4f46e5' }} />
                        <div style={{ width: 2, flex: 1, minHeight: 62, background: '#e0e7ff', marginTop: 8 }} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ color: '#111827', fontSize: 16, fontWeight: 800 }}>{exam.name}</div>
                            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{exam.subject ? `${exam.subject} paper` : 'Subject-wise exam schedule'}</div>
                          </div>
                          <Badge variant="primary">Class {exam.class}{exam.section || ''}</Badge>
                        </div>

                        <div style={{ display: 'grid', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                          {subjectExamSchedule(exam).map((paper) => (
                            <div key={`${exam.id}-${paper.subject}-${paper.date}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', borderRadius: 14, background: '#f8fafc', padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 999, background: '#4f46e5', flex: '0 0 auto' }} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ color: '#111827', fontSize: 13, fontWeight: 800 }}>{paper.subject}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, fontWeight: 600, marginTop: 3 }}>
                                    <Calendar size={14} /> {formatDate(paper.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: '#ccfbf1', color: '#0f766e', fontSize: 12, fontWeight: 800, padding: '6px 10px' }}>
                                <Clock size={14} /> {paper.time}
                              </div>
                            </div>
                          ))}
                        </div>

                        {canManage && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                            <button onClick={() => startEdit(exam)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #e0e7ff', background: '#eef2ff', color: '#4f46e5', borderRadius: 999, padding: '8px 11px', cursor: 'pointer', fontWeight: 700 }}>
                              <Edit2 size={15} /> Edit
                            </button>
                            <button onClick={() => handleDelete(exam.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #fecdd3', background: '#fff1f2', color: '#e11d48', borderRadius: 999, padding: '8px 11px', cursor: 'pointer', fontWeight: 700 }}>
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}

            {!filtered.length && (
              <div style={{ ...cardStyle, padding: 24, color: '#64748b', textAlign: 'center' }}>No exams found for the selected view.</div>
            )}
          </div>
        </section>

        {canManage && (
          <aside style={{ ...cardStyle, padding: 18, position: 'sticky', top: 86 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 16, background: '#eef2ff', display: 'grid', placeItems: 'center' }}>
                <BookOpen size={20} color="#4f46e5" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{editing ? 'Update exam' : 'Add exam'}</h3>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Create a subject paper entry</div>
              </div>
            </div>

            <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>Exam</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Unit Test 1" required style={{ padding: 11, borderRadius: 12, border: '1px solid #e6edf3' }} />

              <label style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>Subject</label>
              <select name="subject" value={form.subject} onChange={handleChange} required style={{ padding: 11, borderRadius: 12, border: '1px solid #e6edf3', background: '#fff' }}>
                {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>

              <div className="responsive-form-grid" style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>Class</label>
                  <input name="class" value={form.class} onChange={handleChange} placeholder="9" required style={{ width: '100%', marginTop: 6, padding: 11, borderRadius: 12, border: '1px solid #e6edf3' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>Section</label>
                  <input name="section" value={form.section} onChange={handleChange} placeholder="A" style={{ width: '100%', marginTop: 6, padding: 11, borderRadius: 12, border: '1px solid #e6edf3' }} />
                </div>
              </div>

              <label style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required style={{ padding: 11, borderRadius: 12, border: '1px solid #e6edf3' }} />

              <label style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>Time</label>
              <input name="time" value={form.time} onChange={handleChange} placeholder="09:00 - 11:00" required style={{ padding: 11, borderRadius: 12, border: '1px solid #e6edf3' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button type="button" onClick={resetForm} style={{ padding: '9px 13px', borderRadius: 999, border: '1px solid #e6edf3', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
                <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 15px', borderRadius: 999, background: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800 }}>
                  <Plus size={16} /> {editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
