import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { classes, paymentModes, Fee, PaymentRecord, Student } from '@/data/mockData';
import { getFees, saveFee } from '@/services/schoolModulesService';
import { getStudents } from '@/services/studentService';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SlideOver } from '@/components/ui/SlideOver';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle, TrendingUp, CreditCard, Search, Eye } from 'lucide-react';

const cs: React.CSSProperties = { backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
const defaultFeeStructure = [
  { item: 'Tuition Fee', amount: 25000 },
  { item: 'Transport Fee', amount: 8000 },
  { item: 'Library Fee', amount: 2000 },
  { item: 'Lab Fee', amount: 3000 },
  { item: 'Activity Fee', amount: 2000 },
];

const createDefaultFee = (student: Student): Fee => ({
  studentId: student.id,
  feeStructure: defaultFeeStructure,
  totalAmount: 40000,
  amountPaid: student.feeStatus === 'Paid' ? 40000 : student.feeStatus === 'Partially Paid' ? 25000 : 0,
  balance: student.feeStatus === 'Paid' ? 0 : student.feeStatus === 'Partially Paid' ? 15000 : 40000,
  dueDate: '2026-03-31',
  status: student.feeStatus,
  paymentHistory: [],
});

export function FeesPage() {
  const { role, user } = useAuth();
  const canRecord = role === 'admin' || role === 'accountant';
  const [students, setStudents] = useState<Student[]>([]);
  const [feesData, setFeesData] = useState<Fee[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState<PaymentRecord | null>(null);
  const [payForm, setPayForm] = useState({ amount: 0, mode: 'Cash', reference: '', remarks: '', fullPay: false });

  useEffect(() => {
    let active = true;
    async function load() {
      const [studentResult, feeResult] = await Promise.all([getStudents(), getFees()]);
      if (!active) return;
      if (studentResult.error) setError(studentResult.error.message);
      else setStudents(studentResult.data);
      if (feeResult.error) setError(feeResult.error.message);
      else setFeesData(feeResult.data);
    }
    load();
    return () => { active = false; };
  }, []);

  const isParent = String(role || user?.role || '').toLowerCase() === 'parent';
  const parentEmail = (user?.email || '').trim().toLowerCase();
  const parentName = (user?.name || '').trim().toLowerCase();
  const linkedStudentIds = isParent
    ? students
      .filter((s) => (
        s.guardianEmail.trim().toLowerCase() === parentEmail ||
        s.guardianName.trim().toLowerCase() === parentName
      ))
      .map((s) => s.id)
    : null;
  const visibleStudents = linkedStudentIds
    ? students.filter((s) => linkedStudentIds.includes(s.id))
    : students;
  const feeByStudentId = new Map(feesData.map((fee) => [fee.studentId, fee]));
  const visibleFeesData = visibleStudents.map((student) => feeByStudentId.get(student.id) || createDefaultFee(student));

  const totalCollected = visibleFeesData.reduce((sum, f) => sum + f.amountPaid, 0);
  const totalPending = visibleFeesData.reduce((sum, f) => sum + f.balance, 0);
  const overdueCount = visibleFeesData.filter((f) => f.status === 'Overdue').length;
  const paymentCount = visibleFeesData.reduce((sum, f) => sum + f.paymentHistory.length, 0);

  const filtered = visibleFeesData.filter((f) => {
    const s = students.find((st) => st.id === f.studentId);
    if (!s) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterClass && s.class !== filterClass) return false;
    if (filterStatus && f.status !== filterStatus) return false;
    return true;
  });

  const handleRecordPayment = async () => {
    if (!showPayment) return;
    const student = students.find((s) => s.id === showPayment);
    if (!student) return;
    const fee = { ...(feesData.find((f) => f.studentId === showPayment) || createDefaultFee(student)) };
    const payAmt = payForm.fullPay ? fee.balance : payForm.amount;
    const receipt: PaymentRecord = { id: `pay-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: payAmt, mode: payForm.mode, receiptNo: `RCP-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`, recordedBy: role || 'Admin', remarks: payForm.remarks };
    fee.amountPaid += payAmt; fee.balance -= payAmt; fee.paymentHistory = [...fee.paymentHistory, receipt];
    fee.status = fee.balance <= 0 ? 'Paid' : fee.amountPaid > 0 ? 'Partially Paid' : 'Due';
    const { data, error } = await saveFee(fee);
    if (error || !data) {
      setError(error?.message || 'Unable to save payment.');
      return;
    }
    setFeesData((prev) => prev.some((f) => f.studentId === data.studentId)
      ? prev.map((f) => f.studentId === data.studentId ? data : f)
      : [data, ...prev]);
    setShowPayment(null); setShowReceipt(receipt); setPayForm({ amount: 0, mode: 'Cash', reference: '', remarks: '', fullPay: false });
  };

  const curFee = showPayment ? visibleFeesData.find((f) => f.studentId === showPayment) : null;
  const curStudent = showPayment ? students.find((s) => s.id === showPayment) : null;
  const histFee = showHistory ? visibleFeesData.find((f) => f.studentId === showHistory) : null;
  const histStudent = showHistory ? students.find((s) => s.id === showHistory) : null;

  const inputS: React.CSSProperties = { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none' };

  return (
    <>
      <PageHeader title="Fee Management" subtitle={isParent ? "Track your child's fee details" : 'Track and manage student fees'} />
      {error && <div style={{ padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff1f2', color: '#be123c', fontSize: 14, border: '1px solid #fecdd3' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Collected" value={totalCollected} prefix="₹" icon={<TrendingUp size={24} color="#059669" />} iconBg="bg-emerald-100" delay={0} />
        <StatCard label="Pending Amount" value={totalPending} prefix="₹" icon={<DollarSign size={24} color="#d97706" />} iconBg="bg-amber-100" delay={1} />
        <StatCard label="Overdue Count" value={overdueCount} icon={<AlertTriangle size={24} color="#e11d48" />} iconBg="bg-rose-100" delay={2} />
        <StatCard label={isParent ? 'Payments' : 'This Month'} value={isParent ? paymentCount : 580000} prefix={isParent ? '' : '₹'} icon={<CreditCard size={24} color="#4f46e5" />} iconBg="bg-indigo-100" delay={3} />
      </div>

      {/* Filters */}
      <div style={{ ...cs, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search by student name..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputS, paddingLeft: 36 }} />
          </div>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ ...inputS, width: 'auto' }}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputS, width: 'auto' }}>
            <option value="">All Status</option>
            {['Paid', 'Partially Paid', 'Due', 'Overdue'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cs, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Student', 'Class', 'Total Fee', 'Paid', 'Balance', 'Status', ...(canRecord ? ['Actions'] : [])].map((h) => (
                  <th key={h} style={{ textAlign: ['Total Fee', 'Paid', 'Balance'].includes(h) ? 'right' : h === 'Status' || h === 'Actions' ? 'center' : 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => {
                const s = students.find((st) => st.id === f.studentId);
                if (!s) return null;
                return (
                  <tr key={f.studentId} style={{ borderBottom: '1px solid #f9fafb', backgroundColor: i % 2 === 1 ? '#fafafa' : 'white' }} className="hover:bg-indigo-50/50 group">
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar name={s.name} size="sm" /><span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</span></div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>{s.class}-{s.section}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#111827', textAlign: 'right' }}>₹{f.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#059669', textAlign: 'right' }}>₹{f.amountPaid.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#e11d48', textAlign: 'right' }}>₹{f.balance.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Badge variant={f.status === 'Paid' ? 'success' : f.status === 'Overdue' ? 'danger' : f.status === 'Partially Paid' ? 'warning' : 'info'} showDot>{f.status}</Badge>
                    </td>
                    {canRecord && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {f.balance > 0 && (
                            <button onClick={() => { setShowPayment(f.studentId); setPayForm({ amount: 0, mode: 'Cash', reference: '', remarks: '', fullPay: false }); }} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#4f46e5', backgroundColor: '#eef2ff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Pay</button>
                          )}
                          <button onClick={() => setShowHistory(f.studentId)} style={{ padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#6b7280' }}><Eye size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && isParent && (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>No fee details are linked to this parent account.</div>
          )}
        </div>
      </div>

      {/* Record Payment */}
      <SlideOver isOpen={!!showPayment} onClose={() => setShowPayment(null)} title="Record Payment" subtitle={curStudent ? `${curStudent.name} — Class ${curStudent.class}-${curStudent.section}` : ''}
        footer={<div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}><button onClick={() => setShowPayment(null)} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#374151', background: 'white', border: '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}>Cancel</button><button onClick={handleRecordPayment} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'white', backgroundColor: '#4f46e5', border: 'none', borderRadius: 12, cursor: 'pointer' }}>Save Payment</button></div>}
      >
        {curFee && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="responsive-grid-3" style={{ display: 'grid', gap: 12, textAlign: 'center' }}>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#f9fafb' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>₹{curFee.totalAmount.toLocaleString()}</div><div style={{ fontSize: 11, color: '#6b7280' }}>Total</div></div>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#ecfdf5' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>₹{curFee.amountPaid.toLocaleString()}</div><div style={{ fontSize: 11, color: '#6b7280' }}>Paid</div></div>
              <div style={{ padding: 12, borderRadius: 12, backgroundColor: '#fff1f2' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#e11d48' }}>₹{curFee.balance.toLocaleString()}</div><div style={{ fontSize: 11, color: '#6b7280' }}>Balance</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setPayForm({ ...payForm, fullPay: true, amount: curFee.balance })} style={{ flex: 1, padding: '8px', fontSize: 14, fontWeight: 500, borderRadius: 12, border: payForm.fullPay ? '1.5px solid #059669' : '1.5px solid #e5e7eb', backgroundColor: payForm.fullPay ? '#059669' : 'white', color: payForm.fullPay ? 'white' : '#4b5563', cursor: 'pointer' }}>Mark Fully Paid</button>
              <button onClick={() => setPayForm({ ...payForm, fullPay: false, amount: 0 })} style={{ flex: 1, padding: '8px', fontSize: 14, fontWeight: 500, borderRadius: 12, border: !payForm.fullPay ? '1.5px solid #4f46e5' : '1.5px solid #e5e7eb', backgroundColor: !payForm.fullPay ? '#4f46e5' : 'white', color: !payForm.fullPay ? 'white' : '#4b5563', cursor: 'pointer' }}>Partial Payment</button>
            </div>
            {!payForm.fullPay && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Amount (₹)</label>
                <input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Math.min(Number(e.target.value), curFee.balance) })} style={inputS} />
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>New Balance: ₹{(curFee.balance - (payForm.fullPay ? curFee.balance : payForm.amount)).toLocaleString()}</div>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Payment Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {paymentModes.map((m) => (
                  <button key={m} onClick={() => setPayForm({ ...payForm, mode: m })} style={{ padding: '8px', fontSize: 14, fontWeight: 500, borderRadius: 12, border: payForm.mode === m ? '1.5px solid #4f46e5' : '1.5px solid #e5e7eb', backgroundColor: payForm.mode === m ? '#eef2ff' : 'white', color: payForm.mode === m ? '#4f46e5' : '#4b5563', cursor: 'pointer' }}>{m}</button>
                ))}
              </div>
            </div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Remarks (Optional)</label><textarea value={payForm.remarks} onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })} rows={2} style={{ ...inputS, resize: 'none' }} /></div>
          </div>
        )}
      </SlideOver>

      {/* Payment History */}
      <SlideOver isOpen={!!showHistory} onClose={() => setShowHistory(null)} title="Payment History" subtitle={histStudent?.name || ''}>
        {histFee && (
          <div>
            {histFee.paymentHistory.length === 0 ? <p style={{ textAlign: 'center', padding: 32, fontSize: 14, color: '#6b7280' }}>No payments recorded yet.</p> : (
              histFee.paymentHistory.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12, border: '1px solid #f3f4f6', marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#059669' }} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>₹{p.amount.toLocaleString()}</span><span style={{ fontSize: 12, color: '#6b7280' }}>{new Date(p.date).toLocaleDateString('en-IN')}</span></div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{p.mode} · Receipt: {p.receiptNo}</div>
                  </div>
                </div>
              ))
            )}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#6b7280' }}>Total Paid</span><span style={{ fontWeight: 600, color: '#059669' }}>₹{histFee.amountPaid.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 4 }}><span style={{ color: '#6b7280' }}>Balance Due</span><span style={{ fontWeight: 600, color: '#e11d48' }}>₹{histFee.balance.toLocaleString()}</span></div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Receipt Modal */}
      <Modal isOpen={!!showReceipt} onClose={() => setShowReceipt(null)} title="Payment Receipt" size="md">
        {showReceipt && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ border: '2px dashed #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Sunrise Public School</h3>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Payment Receipt</p>
              <div style={{ textAlign: 'left' }}>
                {[{ l: 'Receipt No', v: showReceipt.receiptNo }, { l: 'Date', v: new Date(showReceipt.date).toLocaleDateString('en-IN') }, { l: 'Amount', v: `₹${showReceipt.amount.toLocaleString()}` }, { l: 'Mode', v: showReceipt.mode }].map((r) => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                    <span style={{ color: '#6b7280' }}>{r.l}:</span>
                    <span style={{ fontWeight: r.l === 'Amount' ? 700 : 500, color: r.l === 'Amount' ? '#059669' : '#111827' }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => window.print()} style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}>Print Receipt</button>
          </div>
        )}
      </Modal>
    </>
  );
}
