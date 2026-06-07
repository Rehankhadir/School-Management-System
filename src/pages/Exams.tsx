import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { students, exams as mockExams } from '@/data/mockData';
import { Badge } from '@/components/ui/Badge';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

export function ExamsPage() {
  const { role } = useAuth();
  const canManage = role === 'admin' || role === 'teacher';

  const [exams, setExams] = useState(mockExams.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', class: '', section: '', date: '', description: '' });

  const filtered = useMemo(() => exams.filter((e) => (e.name + e.class + (e.section || '') + (e.description || '')).toLowerCase().includes(query.toLowerCase())), [exams, query]);

  const startEdit = (ex: any) => {
    setEditing(ex.id);
    setForm({ name: ex.name, class: ex.class, section: ex.section || '', date: ex.date, description: ex.description || '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const idx = mockExams.findIndex((x: any) => x.id === editing);
      if (idx >= 0) {
        mockExams[idx] = { ...mockExams[idx], ...form } as any;
        setExams(mockExams.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
      setEditing(null);
      setForm({ name: '', class: '', section: '', date: '', description: '' });
      return;
    }
    const next = {
      id: `e${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`,
      name: form.name || 'Untitled Exam',
      class: form.class || '9',
      section: form.section || undefined,
      date: form.date || new Date().toISOString().slice(0, 10),
      description: form.description || '',
    } as any;
    mockExams.push(next);
    setExams(mockExams.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setForm({ name: '', class: '', section: '', date: '', description: '' });
  };

  const handleDelete = (id: string) => {
    const idx = mockExams.findIndex((x: any) => x.id === id);
    if (idx >= 0) mockExams.splice(idx, 1);
    setExams(mockExams.slice());
  };

  return (
    <div>
      <PageHeader title="Exams" subtitle="Manage and view exam schedules" />

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                placeholder="Search exams, class, description..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e6edf3', width: 420, background: 'white' }}
              />
              <div style={{ fontSize: 13, color: '#6b7280' }}>{filtered.length} results</div>
            </div>

            {canManage && (
              <button onClick={() => setEditing(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer' }}>
                <Plus size={16} /> Add Exam
              </button>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #eef2ff', padding: 8, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#64748b' }}>
              <div>Exam</div>
              <div>Class · Section</div>
              <div>Date</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
              {filtered.map((ex) => (
                <div key={ex.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: '#fff', border: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{ex.name}</div>
                    {ex.description && <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>{ex.description}</div>}
                  </div>
                  <div>
                    <Badge variant="neutral">Class {ex.class}{ex.section ? ` · ${ex.section}` : ''}</Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} /> <div style={{ fontSize: 13 }}>{formatDate(ex.date)}</div></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {canManage && (
                      <button onClick={() => startEdit(ex)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canManage && (
                      <button onClick={() => handleDelete(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {canManage && (
          <div style={{ width: 420 }}>
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{editing ? 'Edit Exam' : 'Add Exam'}</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 12, color: '#475569' }}>Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Exam title" required style={{ padding: 10, borderRadius: 8, border: '1px solid #e6edf3' }} />

              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#475569' }}>Class</label>
                  <input name="class" value={form.class} onChange={handleChange} placeholder="9" required style={{ padding: 10, borderRadius: 8, border: '1px solid #e6edf3' }} />
                </div>
                <div style={{ width: 100 }}>
                  <label style={{ fontSize: 12, color: '#475569' }}>Section</label>
                  <input name="section" value={form.section} onChange={handleChange} placeholder="A" style={{ padding: 10, borderRadius: 8, border: '1px solid #e6edf3' }} />
                </div>
              </div>

              <label style={{ fontSize: 12, color: '#475569' }}>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #e6edf3' }} />

              <label style={{ fontSize: 12, color: '#475569' }}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Optional notes" style={{ padding: 10, borderRadius: 8, border: '1px solid #e6edf3' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                {editing && (
                  <button type="button" onClick={() => { setEditing(null); setForm({ name: '', class: '', section: '', date: '', description: '' }); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e6edf3', background: 'white', cursor: 'pointer' }}>Cancel</button>
                )}
                <button type="submit" disabled={!canManage} style={{ padding: '10px 14px', borderRadius: 8, background: canManage ? '#4f46e5' : '#c7c4e9', color: 'white', border: 'none', cursor: canManage ? 'pointer' : 'not-allowed' }}>{editing ? 'Save Changes' : 'Create Exam'}</button>
              </div>
            </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
