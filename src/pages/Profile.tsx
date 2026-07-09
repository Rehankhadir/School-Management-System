import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { motion } from 'framer-motion';
import { Camera, Lock, Activity } from 'lucide-react';

const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', padding: 24 };
const inputS: React.CSSProperties = { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };
const labelS: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 };

export function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: '9876543210', dob: '1985-05-15', address: '42, MG Road, New Delhi' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [saved, setSaved] = useState(false);

  const ss = passwordForm.newPassword.length > 8 ? (passwordForm.newPassword.length > 12 ? 3 : 2) : passwordForm.newPassword.length > 4 ? 1 : 0;
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#e11d48', '#d97706', '#34d399', '#059669'];

  const activities = [
    { action: 'Marked attendance for Class 9A', time: '2 hours ago' },
    { action: 'Recorded payment for Arjun Singh', time: '5 hours ago' },
    { action: 'Posted announcement: Exam Schedule', time: '1 day ago' },
    { action: 'Added new student: Zara Hussain', time: '2 days ago' },
    { action: 'Generated fee collection report', time: '3 days ago' },
  ];

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account settings" />

      <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ height: 144, background: 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)', position: 'relative' }} />
        <div style={{ padding: '0 24px 24px', marginTop: -40, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={user?.name || ''} size="xl" className="ring-4 ring-white" />
            <button style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, backgroundColor: '#4f46e5', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
              <Camera size={16} />
            </button>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{user?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Badge variant="indigo">{user?.role}</Badge>
              <span style={{ fontSize: 14, color: '#6b7280' }}>{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="responsive-min-grid" style={{ display: 'grid', gap: 24 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cs}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Personal Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={labelS}>Full Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Date of Birth</label><input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={inputS} /></div>
            <div><label style={labelS}>Address</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} style={{ ...inputS, resize: 'none' }} /></div>
            <button onClick={() => setSaved(true)} style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}>
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cs}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Account Information</h3>
            {[
              { label: 'Email', value: user?.email },
              { label: 'Role', value: user?.role, isBadge: true },
              { label: 'School', value: user?.schoolName },
              { label: 'Last Login', value: 'Today, 9:30 AM' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontSize: 14, color: '#6b7280' }}>{item.label}</span>
                {item.isBadge ? <Badge variant="indigo">{item.value}</Badge> : <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{item.value}</span>}
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={cs}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lock size={16} color="#9ca3af" />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Change Password</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={labelS}>Old Password</label><input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} style={inputS} /></div>
              <div>
                <label style={labelS}>New Password</label>
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} style={inputS} />
                {passwordForm.newPassword && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < ss ? strengthColors[ss - 1] : '#e5e7eb' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{strengthLabels[ss]}</span>
                  </div>
                )}
              </div>
              <div><label style={labelS}>Confirm Password</label><input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} style={inputS} /></div>
              <button style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}>Update Password</button>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...cs, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity size={16} color="#9ca3af" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Recent Activity</h3>
        </div>
        {activities.map((log, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#818cf8', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 14, color: '#374151' }}>{log.action}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{log.time}</div>
          </div>
        ))}
      </motion.div>
    </>
  );
}
