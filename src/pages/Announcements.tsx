import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Announcement } from '@/data/mockData';
import { getAnnouncements, saveAnnouncement } from '@/services/schoolModulesService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { Plus, Pin, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const inputS: React.CSSProperties = { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };
const borderColors: Record<string, string> = { Normal: '#d1d5db', Important: '#f59e0b', Urgent: '#e11d48' };

export function AnnouncementsPage() {
  const { role } = useAuth();
  const [list, setList] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', body: '', audience: ['All'] as string[], priority: 'Normal' as 'Normal' | 'Important' | 'Urgent' });

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await getAnnouncements();
      if (!active) return;
      if (error) setError(error.message);
      setList(data);
    }
    load();
    return () => { active = false; };
  }, []);

  const handlePost = async () => {
    const newA: Announcement = { id: `a${Date.now()}`, title: form.title, body: form.body, audience: form.audience, priority: form.priority, postedBy: 'Admin', postedAt: new Date().toISOString(), pinned: false };
    const { data, error } = await saveAnnouncement(newA);
    if (error || !data) {
      setError(error?.message || 'Unable to post announcement.');
      return;
    }
    setList((p) => [data, ...p]); setShowForm(false); setForm({ title: '', body: '', audience: ['All'], priority: 'Normal' });
  };

  const sorted = [...list].sort((a, b) => { if (a.pinned && !b.pinned) return -1; if (!a.pinned && b.pinned) return 1; return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(); });

  return (
    <>
      <PageHeader title="Announcements" subtitle="Stay updated with school news" actions={role === 'admin' ? <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}><Plus size={16} /> Post Announcement</button> : undefined} />

      {error && <div style={{ padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff1f2', color: '#be123c', fontSize: 14, border: '1px solid #fecdd3' }}>{error}</div>}

      {showForm && role === 'admin' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="responsive-min-grid" style={{ display: 'grid', gap: 24, marginBottom: 24 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>New Announcement</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputS} /></div>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Body</label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} style={{ ...inputS, resize: 'none' }} /><span style={{ fontSize: 12, color: '#9ca3af' }}>{form.body.length} characters</span></div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Priority</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(['Normal', 'Important', 'Urgent'] as const).map((p) => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: p === 'Urgent' ? '#e11d48' : p === 'Important' ? '#d97706' : '#4b5563' }}>
                      <input type="radio" name="priority" checked={form.priority === p} onChange={() => setForm({ ...form, priority: p })} /> {p}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Target Audience</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['All', 'Teachers', 'Students', 'Parents'].map((a) => (
                    <button key={a} type="button" onClick={() => setForm({ ...form, audience: form.audience.includes(a) ? form.audience.filter((x) => x !== a) : [...form.audience, a] })} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 9999, border: '1.5px solid', cursor: 'pointer', backgroundColor: form.audience.includes(a) ? '#4f46e5' : 'white', color: form.audience.includes(a) ? 'white' : '#4b5563', borderColor: form.audience.includes(a) ? '#4f46e5' : '#e5e7eb' }}>{a}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#374151', background: 'white', border: '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handlePost} disabled={!form.title || !form.body} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'white', backgroundColor: '#4f46e5', border: 'none', borderRadius: 12, cursor: 'pointer', opacity: !form.title || !form.body ? 0.5 : 1 }}>Post</button>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Preview</h3>
            <div style={{ borderLeft: `4px solid ${borderColors[form.priority]}`, borderRadius: 12, padding: 16, backgroundColor: '#f9fafb' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Badge variant={form.priority === 'Urgent' ? 'danger' : form.priority === 'Important' ? 'warning' : 'neutral'} showDot>{form.priority}</Badge>
                {form.audience.map((a) => <Badge key={a} variant="info">{a}</Badge>)}
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{form.title || 'Announcement Title'}</h4>
              <p style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>{form.body || 'Announcement body text...'}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Just now · Admin</p>
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sorted.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 20, borderLeft: `4px solid ${borderColors[a.priority]}`, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
            className="hover:shadow-md"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {a.pinned && <Pin size={14} color="#4f46e5" />}
                  <Badge variant={a.priority === 'Urgent' ? 'danger' : a.priority === 'Important' ? 'warning' : 'neutral'} showDot>{a.priority}</Badge>
                  {a.audience.map((aud) => <Badge key={aud} variant="info">{aud}</Badge>)}
                  {a.priority === 'Urgent' && <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e11d48' }} />}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{a.title}</h3>
                <p style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>{a.body}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>Posted by {a.postedBy} · {formatDistanceToNow(new Date(a.postedAt), { addSuffix: true })}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16 }}>
                <Megaphone size={20} color="#4f46e5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
