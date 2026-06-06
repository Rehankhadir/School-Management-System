import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { timetable, subjectColors, classes, sections } from '@/data/mockData';
import { PageHeader } from '@/components/ui/PageHeader';
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

  const key = `${selClass}${selSection}`;
  const schedule = timetable[key] || timetable['9A'] || [];
  const periods = schedule[0]?.periods || [];

  const selectStyle: React.CSSProperties = { padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle={`Class ${selClass}-${selSection} Weekly Schedule`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                {editMode ? <><Check size={16} /> Save</> : <><Pencil size={16} /> Edit</>}
              </button>
            )}
          </div>
        }
      />

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
                          <div style={{ backgroundColor: '#f3f4f6', borderRadius: 12, padding: '8px', textAlign: 'center', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{p.subject}</div>
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
                        }}>
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
    </>
  );
}
