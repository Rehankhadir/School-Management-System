import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notifications as initialNotifications, Notification } from '@/data/mockData';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { Bell, DollarSign, CalendarCheck, Megaphone, FileText, Info, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<string, React.ReactNode> = { fee: <DollarSign size={16} />, attendance: <CalendarCheck size={16} />, announcement: <Megaphone size={16} />, leave: <FileText size={16} />, general: <Info size={16} /> };
const typeColors: Record<string, { bg: string; text: string }> = { fee: { bg: '#d1fae5', text: '#059669' }, attendance: { bg: '#fef3c7', text: '#d97706' }, announcement: { bg: '#e0e7ff', text: '#4f46e5' }, leave: { bg: '#ede9fe', text: '#7c3aed' }, general: { bg: '#f3f4f6', text: '#6b7280' } };

export function NotificationsPage() {
  const { role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([...initialNotifications]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const roleNotifs = notifications.filter((n) => n.forRole.includes(role || ''));
  const filtered = activeTab === 'all' ? roleNotifs : activeTab === 'unread' ? roleNotifs.filter((n) => !n.read) : roleNotifs.filter((n) => n.type === activeTab);
  const unreadCount = roleNotifs.filter((n) => !n.read).length;
  const selected = roleNotifs.find((n) => n.id === selectedId);

  const markAsRead = (id: string) => { setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n)); setSelectedId(id); };
  const markAllRead = () => { setNotifications((p) => p.map((n) => n.forRole.includes(role || '') ? { ...n, read: true } : n)); };

  const tabs = [{ id: 'all', label: 'All', count: roleNotifs.length }, { id: 'unread', label: 'Unread', count: unreadCount }, { id: 'fee', label: 'Fee Alerts' }, { id: 'attendance', label: 'Attendance' }, { id: 'announcement', label: 'Announcements' }, { id: 'leave', label: 'Leave' }];
  const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };

  return (
    <>
      <PageHeader title="Notifications" actions={unreadCount > 0 ? <button onClick={markAllRead} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#4f46e5', backgroundColor: '#eef2ff', borderRadius: 12, border: 'none', cursor: 'pointer' }}><CheckCheck size={16} /> Mark All as Read</button> : undefined} />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, ...cs, overflow: 'hidden' }}>
          {filtered.length === 0 ? <EmptyState title="No notifications" description="You're all caught up!" icon={<Bell size={32} color="#9ca3af" />} /> : (
            <div>
              {filtered.map((n, i) => {
                const tc = typeColors[n.type] || typeColors.general;
                return (
                  <div key={n.id} onClick={() => markAsRead(n.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none', backgroundColor: !n.read ? '#eef2ff' : selectedId === n.id ? '#f0f9ff' : 'transparent', transition: 'background-color 0.15s' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: tc.bg, color: tc.text }}>{typeIcons[n.type]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: !n.read ? 600 : 400, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                        {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4f46e5', flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{formatDistanceToNow(new Date(n.time), { addSuffix: true })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="hidden lg:block" style={{ width: 320, flexShrink: 0 }}>
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ ...cs, padding: 24, position: 'sticky', top: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: typeColors[selected.type]?.bg, color: typeColors[selected.type]?.text }}>{typeIcons[selected.type]}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{selected.title}</h3>
              <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>{selected.message}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16 }}>{formatDistanceToNow(new Date(selected.time), { addSuffix: true })}</p>
            </motion.div>
          ) : (
            <div style={{ ...cs, padding: 24, textAlign: 'center' }}>
              <Bell size={32} color="#d1d5db" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, color: '#9ca3af' }}>Select a notification to view details</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
