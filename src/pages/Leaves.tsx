import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { leaves as initialLeaves, LeaveRecord } from '@/data/mockData';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { motion } from 'framer-motion';
import { Plus, Check, X } from 'lucide-react';

const inputS: React.CSSProperties = { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };
const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };

const statusBadge = (status: string) => <Badge variant={status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : 'warning'} showDot>{status}</Badge>;

export function LeavesPage() {
  const { role, user } = useAuth();
  const canApprove = role === 'admin';
  const canApply = role !== 'parent';
  const [leavesList, setLeavesList] = useState<LeaveRecord[]>([...initialLeaves]);
  const [activeTab, setActiveTab] = useState(canApprove ? 'pending' : 'my');
  const [showForm, setShowForm] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ leave: LeaveRecord; action: 'approve' | 'reject' } | null>(null);
  const [form, setForm] = useState({ leaveType: 'Sick', fromDate: '', toDate: '', reason: '' });

  const pendingLeaves = leavesList.filter((l) => l.status === 'Pending');
  const myLeaves = leavesList.filter((l) => l.applicantName === user?.name);

  const handleApply = () => {
    const from = new Date(form.fromDate); const to = new Date(form.toDate);
    const days = Math.ceil((to.getTime() - from.getTime()) / (86400000)) + 1;
    const nl: LeaveRecord = { id: `l${Date.now()}`, applicantId: user?.id || '', applicantName: user?.name || '', applicantRole: user?.role || '', leaveType: form.leaveType, fromDate: form.fromDate, toDate: form.toDate, days, reason: form.reason, status: 'Pending', appliedOn: new Date().toISOString().split('T')[0] };
    setLeavesList((p) => [nl, ...p]); setShowForm(false); setForm({ leaveType: 'Sick', fromDate: '', toDate: '', reason: '' });
  };

  const handleApproveReject = (remarks?: string) => {
    if (!approveTarget) return;
    setLeavesList((p) => p.map((l) => l.id === approveTarget.leave.id ? { ...l, status: approveTarget.action === 'approve' ? 'Approved' : 'Rejected', remarks } as LeaveRecord : l));
    setApproveTarget(null);
  };

  const tabs = canApprove ? [{ id: 'pending', label: 'Pending', count: pendingLeaves.length }, { id: 'all', label: 'All Requests' }, { id: 'my', label: 'My Leaves' }] : [{ id: 'my', label: 'My Leaves' }];
  const displayLeaves = activeTab === 'pending' ? pendingLeaves : activeTab === 'my' ? myLeaves : leavesList;

  return (
    <>
      <PageHeader title="Leave Management" actions={canApply ? <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}><Plus size={16} /> Apply for Leave</button> : undefined} />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cs, padding: 24, marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Leave Application</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Leave Type</label><select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} style={inputS}>{['Sick', 'Casual', 'Emergency', 'Other'].map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>From</label><input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} style={inputS} /></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>To</label><input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} style={inputS} /></div>
          </div>
          <div style={{ marginTop: 16 }}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Reason</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} style={{ ...inputS, resize: 'none' }} /></div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#374151', background: 'white', border: '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleApply} disabled={!form.fromDate || !form.toDate || !form.reason} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'white', backgroundColor: '#4f46e5', border: 'none', borderRadius: 12, cursor: 'pointer', opacity: !form.fromDate || !form.toDate || !form.reason ? 0.5 : 1 }}>Submit</button>
          </div>
        </motion.div>
      )}

      <div style={{ marginTop: 24, ...cs, overflow: 'hidden' }}>
        {displayLeaves.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>No leave requests found.</div>
        ) : (
          <div>
            {displayLeaves.map((l, i) => (
              <div key={l.id} style={{ padding: '16px', borderBottom: i < displayLeaves.length - 1 ? '1px solid #f9fafb' : 'none' }} className="hover:bg-gray-50">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Avatar name={l.applicantName} size="sm" />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{l.applicantName}</span>
                        <Badge variant="neutral">{l.applicantRole}</Badge>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 13 }}>
                        <Badge variant="info">{l.leaveType}</Badge>
                        <span style={{ color: '#6b7280' }}>{new Date(l.fromDate).toLocaleDateString('en-IN')} — {new Date(l.toDate).toLocaleDateString('en-IN')} ({l.days} days)</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#4b5563', marginTop: 4 }}>{l.reason}</p>
                      {l.remarks && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, fontStyle: 'italic' }}>Remarks: {l.remarks}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {statusBadge(l.status)}
                    {canApprove && l.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <button onClick={() => setApproveTarget({ leave: l, action: 'approve' })} style={{ padding: 6, borderRadius: 8, backgroundColor: '#ecfdf5', color: '#059669', border: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                        <button onClick={() => setApproveTarget({ leave: l, action: 'reject' })} style={{ padding: 6, borderRadius: 8, backgroundColor: '#fff1f2', color: '#e11d48', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApproveReject}
        title={approveTarget?.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
        message={`Are you sure you want to ${approveTarget?.action} this leave request from ${approveTarget?.leave.applicantName}?`}
        confirmText={approveTarget?.action === 'approve' ? 'Approve' : 'Reject'}
        variant={approveTarget?.action === 'reject' ? 'danger' : 'warning'} showRemarks />
    </>
  );
}
