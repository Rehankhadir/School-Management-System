import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { classes, sections, Student } from '@/data/mockData';
import { deleteStudent, ensureParentCredentials, getStudents, saveStudent, ParentCredentialsResult } from '@/services/studentService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SlideOver } from '@/components/ui/SlideOver';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Pencil, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';

const feeStatusBadge = (status: string) => {
  const map: Record<string, { v: any; l: string }> = {
    Paid: { v: 'success', l: 'Paid' },
    'Partially Paid': { v: 'warning', l: 'Partial' },
    Due: { v: 'info', l: 'Due' },
    Overdue: { v: 'danger', l: 'Overdue' },
  };
  const m = map[status] || { v: 'neutral', l: status };
  return <Badge variant={m.v} showDot>{m.l}</Badge>;
};

const cs: React.CSSProperties = {
  backgroundColor: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden',
};

const inputS: React.CSSProperties = {
  padding: '8px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 12, outline: 'none', width: '100%',
};

export function StudentsPage() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterFee, setFilterFee] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [newlyAdded, setNewlyAdded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [parentCredentials, setParentCredentials] = useState<ParentCredentialsResult | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: 'Male', bloodGroup: 'B+',
    class: '9', section: 'A', rollNo: '', admissionDate: new Date().toISOString().split('T')[0], previousSchool: '',
    guardianName: '', relationship: 'Father', guardianPhone: '', guardianEmail: '', address: '',
  });

  const perPage = 10;

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      setLoading(true);
      setError('');
      const { data, error } = await getStudents();
      if (!active) return;
      if (error) setError(error.message || 'Unable to load students from Supabase.');
      setList(data);
      setLoading(false);
    }

    loadStudents();
    return () => { active = false; };
  }, [user?.id]);

  const isParent = String(role || user?.role || '').toLowerCase() === 'parent';
  const parentEmail = (user?.email || '').trim().toLowerCase();
  const parentName = (user?.name || '').trim().toLowerCase();
  const visibleStudents = isParent
    ? list.filter((s) => (
      s.guardianEmail.trim().toLowerCase() === parentEmail ||
      s.guardianName.trim().toLowerCase() === parentName
    ))
    : list;

  const filtered = visibleStudents.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.rollNo.includes(search)) return false;
    if (filterClass && s.class !== filterClass) return false;
    if (filterSection && s.section !== filterSection) return false;
    if (filterFee && s.feeStatus !== filterFee) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetForm = () => { setForm({ firstName: '', lastName: '', dob: '', gender: 'Male', bloodGroup: 'B+', class: '9', section: 'A', rollNo: '', admissionDate: new Date().toISOString().split('T')[0], previousSchool: '', guardianName: '', relationship: 'Father', guardianPhone: '', guardianEmail: '', address: '' }); setStep(1); };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setParentCredentials(null);

    if (editStudent) {
      const nextStudent: Student = {
        ...editStudent,
        name: `${form.firstName} ${form.lastName}`.trim(),
        rollNo: form.rollNo || editStudent.rollNo,
        class: form.class,
        section: form.section,
        dob: form.dob || editStudent.dob,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        guardianEmail: form.guardianEmail,
        address: form.address,
        admissionDate: form.admissionDate || editStudent.admissionDate,
      };
      const { data, error } = await saveStudent(nextStudent);
      if (error || !data) {
        setError(error?.message || 'Unable to update student in Supabase.');
        setSaving(false);
        return;
      }
      setList((p) => p.map((s) => s.id === editStudent.id ? data : s));
      setEditStudent(null);
    } else {
      const ns: Student = {
        id: `s${Date.now()}`, name: `${form.firstName} ${form.lastName}`.trim(), rollNo: form.rollNo || String(Math.floor(Math.random() * 900) + 100),
        class: form.class, section: form.section, dob: form.dob || '2010-01-01', gender: form.gender, bloodGroup: form.bloodGroup,
        guardianName: form.guardianName, guardianPhone: form.guardianPhone, guardianEmail: form.guardianEmail,
        address: form.address, photo: null, admissionDate: form.admissionDate, feeStatus: 'Due', attendancePercent: 100,
      };
      const { data, error } = await saveStudent(ns);
      if (error || !data) {
        setError(error?.message || 'Unable to create student in Supabase.');
        setSaving(false);
        return;
      }
      setList((p) => [data, ...p]);
      const { data: credentials, error: credentialsError } = await ensureParentCredentials(data);
      if (credentialsError) {
        setError(`Student saved, but parent login was not created: ${credentialsError.message}`);
      } else if (credentials) {
        setParentCredentials(credentials);
      }
      setNewlyAdded(data.id);
      setTimeout(() => setNewlyAdded(null), 3000);
      setShowAdd(false);
    }
    resetForm();
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError('');
    const { error } = await deleteStudent(deleteTarget.id);
    if (error) {
      setError(error.message || 'Unable to delete student in Supabase.');
      setSaving(false);
      return;
    }
    setList((p) => p.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
    setSaving(false);
  };

  const openEdit = (s: Student) => {
    const [first, ...rest] = s.name.split(' ');
    setForm({ ...form, firstName: first, lastName: rest.join(' '), dob: s.dob, gender: s.gender, bloodGroup: s.bloodGroup, class: s.class, section: s.section, rollNo: s.rollNo, guardianName: s.guardianName, guardianPhone: s.guardianPhone, guardianEmail: s.guardianEmail, address: s.address });
    setEditStudent(s);
  };

  const activeFilters = [
    filterClass && { label: `Class ${filterClass}`, clear: () => setFilterClass('') },
    filterSection && { label: `Section ${filterSection}`, clear: () => setFilterSection('') },
    filterFee && { label: filterFee, clear: () => setFilterFee('') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <>
      <PageHeader
        title="Students"
        badge={<Badge variant="indigo">{isParent ? `${filtered.length} child` : `${filtered.length} students`}</Badge>}
        actions={role === 'admin' ? (
          <button onClick={() => { resetForm(); setShowAdd(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', backgroundColor: '#4f46e5', color: 'white', fontSize: 14, fontWeight: 500, borderRadius: 12, border: 'none', cursor: 'pointer' }}>
            <Plus size={16} /> Add Student
          </button>
        ) : undefined}
      />

      {error && (
        <div style={{ padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff1f2', color: '#be123c', fontSize: 14, border: '1px solid #fecdd3' }}>
          {error}
        </div>
      )}

      {parentCredentials && (
        <div style={{ padding: 16, marginBottom: 16, borderRadius: 14, backgroundColor: '#ecfdf5', color: '#065f46', fontSize: 14, border: '1px solid #a7f3d0' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {parentCredentials.created ? 'Parent login created' : 'Parent login already exists'}
          </div>
          <div>Email: <strong>{parentCredentials.email}</strong></div>
          {parentCredentials.temporaryPassword && (
            <div>Temporary password: <strong>{parentCredentials.temporaryPassword}</strong></div>
          )}
          <div style={{ marginTop: 6, color: '#047857' }}>{parentCredentials.message}</div>
        </div>
      )}

      {/* Filters */}
      <div style={{ ...cs, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search by name or roll number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inputS, paddingLeft: 36 }} />
          </div>
          <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setPage(1); }} style={{ ...inputS, width: 'auto' }}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select value={filterSection} onChange={(e) => { setFilterSection(e.target.value); setPage(1); }} style={{ ...inputS, width: 'auto' }}>
            <option value="">All Sections</option>
            {sections.map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <select value={filterFee} onChange={(e) => { setFilterFee(e.target.value); setPage(1); }} style={{ ...inputS, width: 'auto' }}>
            <option value="">All Fee Status</option>
            {['Paid', 'Partially Paid', 'Due', 'Overdue'].map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {activeFilters.map((f) => (
              <span key={f.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: 12, fontWeight: 500, borderRadius: 9999 }}>
                {f.label}
                <button onClick={f.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4338ca' }}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={cs}>
        {loading ? (
          <div style={{ padding: 16 }}><TableSkeleton rows={5} cols={7} /></div>
        ) : paginated.length === 0 ? (
          <EmptyState title={isParent ? 'No child linked' : 'No students found'} description={isParent ? 'No student record is linked to this parent account.' : 'Try adjusting your filters or add a new student.'} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Student', 'Roll No', 'Class', 'Guardian', 'Fee Status', 'Attendance', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: h === 'Actions' ? 'right' : 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid #f9fafb',
                      backgroundColor: newlyAdded === s.id ? '#d1fae5' : i % 2 === 1 ? '#fafafa' : 'white',
                      transition: 'background-color 0.3s',
                    }}
                    className="group"
                    onMouseEnter={(e) => { if (newlyAdded !== s.id) e.currentTarget.style.backgroundColor = '#eef2ff'; }}
                    onMouseLeave={(e) => { if (newlyAdded !== s.id) e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#fafafa' : 'white'; }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={s.name} size="sm" />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{s.guardianPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#4b5563' }}>{s.rollNo}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#4b5563' }}>{s.class}-{s.section}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#4b5563' }}>{s.guardianName}</td>
                    <td style={{ padding: '12px 16px' }}>{feeStatusBadge(s.feeStatus)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: s.attendancePercent >= 85 ? '#059669' : s.attendancePercent >= 75 ? '#d97706' : '#e11d48' }}>
                        {s.attendancePercent}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/students/${s.id}`)} title="View" style={{ padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#4f46e5' }} className="hover:bg-indigo-50"><Eye size={16} /></button>
                        {role === 'admin' && (
                          <>
                            <button onClick={() => openEdit(s)} title="Edit" style={{ padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#d97706' }} className="hover:bg-amber-50"><Pencil size={16} /></button>
                            <button onClick={() => setDeleteTarget(s)} title="Delete" style={{ padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#e11d48' }} className="hover:bg-rose-50"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: 6, borderRadius: 8, border: 'none', cursor: page === 1 ? 'default' : 'pointer', background: 'transparent', opacity: page === 1 ? 0.4 : 1 }}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} style={{ width: 32, height: 32, fontSize: 14, borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: page === i + 1 ? '#4f46e5' : 'transparent', color: page === i + 1 ? 'white' : '#4b5563', fontWeight: page === i + 1 ? 600 : 400 }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: 6, borderRadius: 8, border: 'none', cursor: page === totalPages ? 'default' : 'pointer', background: 'transparent', opacity: page === totalPages ? 0.4 : 1 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SlideOver for Add/Edit */}
      <SlideOver
        isOpen={showAdd || !!editStudent}
        onClose={() => { setShowAdd(false); setEditStudent(null); resetForm(); }}
        title={editStudent ? 'Edit Student' : 'Add New Student'}
        subtitle={editStudent ? 'Update student information' : 'Fill in the student details'}
        footer={
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {step > 1 && <button onClick={() => setStep((s) => s - 1)} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#374151', background: 'white', border: '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}>Back</button>}
            {step < 3 ? (
              <button onClick={() => setStep((s) => s + 1)} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'white', backgroundColor: '#4f46e5', border: 'none', borderRadius: 12, cursor: 'pointer' }}>Next</button>
            ) : (
              <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'white', backgroundColor: saving ? '#a5b4fc' : '#4f46e5', border: 'none', borderRadius: 12, cursor: saving ? 'default' : 'pointer' }}>{saving ? 'Saving...' : editStudent ? 'Update' : 'Save Student'}</button>
            )}
          </div>
        }
      >
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: s < 3 ? 1 : undefined }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, backgroundColor: step >= s ? '#4f46e5' : '#f3f4f6', color: step >= s ? 'white' : '#9ca3af' }}>{s}</div>
              {s < 3 && <div style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: step > s ? '#4f46e5' : '#e5e7eb' }} />}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 16 }}>
          Step {step} of 3 — {step === 1 ? 'Personal Info' : step === 2 ? 'Academic Info' : 'Guardian & Contact'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 1 && <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>First Name</label><input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={inputS} /></div>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Last Name</label><input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={inputS} /></div>
            </div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Date of Birth</label><input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={inputS} /></div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 8 }}>Gender</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
                    <input type="radio" name="gender" checked={form.gender === g} onChange={() => setForm({ ...form, gender: g })} /> {g}
                  </label>
                ))}
              </div>
            </div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Blood Group</label>
              <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} style={inputS}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg}>{bg}</option>)}
              </select>
            </div>
          </>}

          {step === 2 && <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Class</label>
                <select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} style={inputS}>{classes.map((c) => <option key={c} value={c}>Class {c}</option>)}</select></div>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Section</label>
                <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} style={inputS}>{sections.map((s) => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Roll Number</label><input type="text" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} placeholder="Auto-generated if empty" style={inputS} /></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Admission Date</label><input type="date" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} style={inputS} /></div>
          </>}

          {step === 3 && <>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Guardian Name</label><input type="text" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} style={inputS} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Phone</label><input type="tel" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} style={inputS} /></div>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Email</label><input type="email" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} style={inputS} /></div>
            </div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>Address</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} style={{ ...inputS, resize: 'none' }} /></div>
          </>}
        </div>
      </SlideOver>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Student" message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`} confirmText={saving ? 'Deleting...' : 'Delete'} />
    </>
  );
}
