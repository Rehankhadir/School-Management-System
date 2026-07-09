import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { classes, sections, subjects, type DayTimetable, type TimetableEntry, type Teacher } from '@/data/mockData';
import { getTeachers, getTimetable, saveTimetable } from '@/services/schoolModulesService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';

const subjectBg: Record<string, { bg: string; text: string }> = {
  'Mathematics': { bg: '#dbeafe', text: '#1e40af' },
  'Science': { bg: '#d1fae5', text: '#065f46' },
  'English': { bg: '#ede9fe', text: '#5b21b6' },
  'Hindi': { bg: '#ffedd5', text: '#9a3412' },
  'Social Studies': { bg: '#fef9c3', text: '#854d0e' },
  'Computer Science': { bg: '#cffafe', text: '#155e75' },
  'Physical Education': { bg: '#ffe4e6', text: '#9f1239' },
  'Sanskrit': { bg: '#fce7f3', text: '#9d174d' },
  'Break': { bg: '#f3f4f6', text: '#6b7280' },
  'Lunch': { bg: '#f3f4f6', text: '#6b7280' },
};

export function TimetablePage() {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'teacher';
  const [selClass, setSelClass] = useState('9');
  const [selSection, setSelSection] = useState('A');
  const [editMode, setEditMode] = useState(false);
  const [timetableData, setTimetableData] = useState<Record<string, DayTimetable[]>>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editing, setEditing] = useState<{ day: string; period: TimetableEntry } | null>(null);
  const [form, setForm] = useState({ subject: '', teacher: '', time: '', isBreak: false });
  const [error, setError] = useState('');

  const key = `${selClass}${selSection}`;
  const schedule = timetableData[key] || timetableData['9A'] || [];
  const periods = schedule[0]?.periods || [];

  const selectStyle: React.CSSProperties = { padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 };

  useEffect(() => {
    let active = true;
    async function load() {
      const [timetableResult, teacherResult] = await Promise.all([getTimetable(), getTeachers()]);
      if (!active) return;
      if (timetableResult.error) setError(timetableResult.error.message);
      else setTimetableData(timetableResult.data);
      if (teacherResult.error) setError(teacherResult.error.message);
      else setTeachers(teacherResult.data);
    }
    load();
    return () => { active = false; };
  }, []);

  const startEdit = (day: string, period: TimetableEntry) => {
    if (!editMode || !canEdit) return;
    setEditing({ day, period });
    setForm({ subject: period.subject, teacher: period.teacher || '', time: period.time, isBreak: !!period.isBreak });
  };

  const savePeriod = async () => {
    if (!editing || !form.subject.trim() || !form.time.trim()) return;
    const nextPeriod: TimetableEntry = {
      ...editing.period,
      subject: form.subject.trim(),
      teacher: form.isBreak ? '' : form.teacher.trim(),
      time: form.time.trim(),
      isBreak: form.isBreak,
    };

    const baseSchedule = timetableData[key] || timetableData['9A'] || [];
    const nextData = {
      ...timetableData,
      [key]: baseSchedule.map((daySchedule) => (
        daySchedule.day === editing.day
          ? { ...daySchedule, periods: daySchedule.periods.map((period) => period.period === nextPeriod.period ? nextPeriod : period) }
          : daySchedule
      )),
    };
    const { error } = await saveTimetable(nextData);
    if (error) {
      setError(error.message || 'Unable to save timetable.');
      return;
    }
    setTimetableData(nextData);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle={`Class ${selClass}-${selSection} Weekly Schedule`}
        actions={
          <div className="responsive-header-actions" style={{ display: 'flex', alignItems: 'center' }}>
            <select value={selClass} onChange={(e) => setSelClass(e.target.value)} style={selectStyle}>
              {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select value={selSection} onChange={(e) => setSelSection(e.target.value)} style={selectStyle}>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {canEdit && (
              <button onClick={() => setEditMode(!editMode)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500,
                borderRadius: 12, border: 'none', cursor: 'pointer', color: 'white',
                backgroundColor: editMode ? '#059669' : '#4f46e5',
              }}>
                {editMode ? <><Check size={16} /> Done</> : <><Pencil size={16} /> Edit</>}
              </button>
            )}
          </div>
        }
      />
      {error && <div style={{ padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff1f2', color: '#be123c', fontSize: 14, border: '1px solid #fecdd3' }}>{error}</div>}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', minWidth: 120, position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>Period</th>
                {schedule.map((d) => (
                  <th key={d.day} style={{ textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', minWidth: 140 }}>{d.day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period, pIdx) => (
                <tr key={pIdx} style={{ borderBottom: '1px solid #f9fafb', backgroundColor: period.isBreak ? '#fafafa' : 'white' }}>
                  <td style={{ padding: '8px 16px', position: 'sticky', left: 0, backgroundColor: period.isBreak ? '#fafafa' : 'white', zIndex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{period.isBreak ? period.subject : `Period ${period.period}`}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{period.time}</div>
                  </td>
                  {schedule.map((daySchedule, dIdx) => {
                    const p = daySchedule.periods[pIdx];
                    if (!p) return <td key={dIdx} />;
                    const colors = subjectBg[p.subject] || { bg: '#f3f4f6', text: '#6b7280' };
                    if (p.isBreak) {
                      return (
                        <td key={dIdx} style={{ padding: '4px 8px' }}>
                          <div
                            style={{
                              backgroundColor: '#f3f4f6',
                              borderRadius: 12,
                              padding: '8px',
                              textAlign: 'center',
                              fontSize: 12,
                              color: '#6b7280',
                              fontWeight: 500,
                              border: editMode ? '2px dashed #d1d5db' : 'none',
                              cursor: editMode ? 'pointer' : 'default',
                            }}
                            onClick={() => startEdit(daySchedule.day, p)}
                          >
                            {p.subject}
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={dIdx} style={{ padding: '4px 8px' }}>
                        <div style={{
                          borderRadius: 12, padding: 10, textAlign: 'center',
                          backgroundColor: colors.bg, color: colors.text,
                          border: editMode ? '2px dashed #d1d5db' : 'none',
                          cursor: editMode ? 'pointer' : 'default',
                          transition: 'all 0.15s',
                        }} onClick={() => startEdit(daySchedule.day, p)}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{p.subject}</div>
                          <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>{p.teacher}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        {Object.entries(subjectBg).filter(([k]) => k !== 'Break' && k !== 'Lunch').map(([subject, c]) => (
          <div key={subject} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, backgroundColor: c.bg, color: c.text }}>{subject}</div>
        ))}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Update Timetable" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', fontSize: 13, color: '#475569' }}>
            Class {selClass}-{selSection} · {editing?.day} · Period {editing?.period.period}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151' }}>
            <input type="checkbox" checked={form.isBreak} onChange={(event) => setForm({ ...form, isBreak: event.target.checked, teacher: event.target.checked ? '' : form.teacher })} />
            Break / Lunch period
          </label>
          <div>
            <label style={labelStyle}>Subject</label>
            <input list="subject-options" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} style={inputStyle} placeholder="Subject or break name" />
            <datalist id="subject-options">
              {[...subjects, 'Break', 'Lunch'].map((subject) => <option key={subject} value={subject} />)}
            </datalist>
          </div>
          {!form.isBreak && (
            <div>
              <label style={labelStyle}>Teacher</label>
              <input list="teacher-options" value={form.teacher} onChange={(event) => setForm({ ...form, teacher: event.target.value })} style={inputStyle} placeholder="Teacher name" />
              <datalist id="teacher-options">
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.name} />)}
              </datalist>
            </div>
          )}
          <div>
            <label style={labelStyle}>Time</label>
            <input value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} style={inputStyle} placeholder="8:00 - 8:45" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setEditing(null)} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#374151', background: 'white', border: '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}>Cancel</button>
            <button onClick={savePeriod} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'white', backgroundColor: '#4f46e5', border: 'none', borderRadius: 12, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
