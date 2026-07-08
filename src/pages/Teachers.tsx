import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Teacher, subjects as allSubjects, classes, sections } from '@/data/mockData';
import { getTeachers, saveTeacher } from '@/services/schoolModulesService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SlideOver } from '@/components/ui/SlideOver';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil } from 'lucide-react';
import { clsx } from 'clsx';

export function TeachersPage() {
  const { role } = useAuth();
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [error, setError] = useState('');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    name: '', employeeId: '', subjects: [] as string[], classAssigned: '', qualification: '',
    phone: '', email: '', joinDate: new Date().toISOString().slice(0, 10), salary: 0,
  });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data, error } = await getTeachers();
      if (!active) return;
      if (error) setError(error.message);
      setTeachersList(data);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) setClassDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allClassSections = useMemo(() => classes.flatMap((k) => sections.map((s) => `${k}${s}`)), []);

  const availableClassSections = useMemo(() => {
    if (form.subjects.length === 0) return allClassSections;
    const otherTeachers = teachersList.filter((t) => t.id !== editTeacher?.id);
    return allClassSections.filter((cs) => {
      const isTaken = otherTeachers.some((t) =>
        t.classAssigned.split(',').map((s) => s.trim()).includes(cs) &&
        t.subjects.some((s) => form.subjects.includes(s))
      );
      return !isTaken;
    });
  }, [form.subjects, teachersList, editTeacher, allClassSections]);

  useEffect(() => {
    if (form.subjects.length === 0 || !form.classAssigned) return;
    const selected = form.classAssigned.split(',').map((s) => s.trim()).filter(Boolean);
    const stillValid = selected.filter((cs) => availableClassSections.includes(cs));
    if (stillValid.length !== selected.length) setForm((prev) => ({ ...prev, classAssigned: stillValid.join(', ') }));
  }, [availableClassSections]);

  const filtered = teachersList.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (t: Teacher) => {
    setForm({ name: t.name, employeeId: t.employeeId, subjects: [...t.subjects], classAssigned: t.classAssigned, qualification: t.qualification, phone: t.phone, email: t.email, joinDate: t.joinDate, salary: t.salary });
    setEditTeacher(t);
    setShowForm(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    const duplicateEmail = teachersList.find((t) => t.email.trim().toLowerCase() === form.email.trim().toLowerCase() && t.id !== editTeacher?.id);
    if (duplicateEmail) {
      setError(`A teacher with email "${form.email}" already exists.`);
      return;
    }
    const nextTeacher: Teacher = editTeacher
      ? { ...editTeacher, ...form, subjects: form.subjects }
      : { id: `t${Date.now()}`, ...form, status: 'Active' };
    const { data, error } = await saveTeacher(nextTeacher);
    if (error || !data) {
      setError(error?.message || 'Unable to save teacher.');
      return;
    }
    setTeachersList(prev => editTeacher ? prev.map(t => t.id === data.id ? data : t) : [data, ...prev]);
    setShowForm(false);
    setEditTeacher(null);
  };

  return (
    <>
      <PageHeader
        title="Teachers"
        badge={<Badge variant="indigo">{filtered.length} teachers</Badge>}
        actions={role === 'admin' && (
          <button onClick={() => { setForm({ name: '', employeeId: '', subjects: [], classAssigned: '', qualification: '', phone: '', email: '', joinDate: new Date().toISOString().slice(0, 10), salary: 0 }); setEditTeacher(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        )}
      />

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name or employee ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-80 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} cols={6} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Teacher</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Subjects</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} className={clsx('border-b border-gray-50 hover:bg-indigo-50/50 transition-colors group', i % 2 === 1 && 'bg-gray-50/50')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.qualification}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.employeeId}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.subjects.map(s => <Badge key={s} variant="info">{s}</Badge>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.classAssigned}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.phone}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.status === 'Active' ? 'success' : t.status === 'On Leave' ? 'warning' : 'danger'} showDot>{t.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {role === 'admin' && (
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTeacher(null); }}
        title={editTeacher ? 'Edit Teacher' : 'Add Teacher'}
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowForm(false); setEditTeacher(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">Save</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Employee ID</label>
            <input type="text" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Subjects</label>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map(s => (
                <button key={s} type="button" onClick={() => setForm({...form, subjects: form.subjects.includes(s) ? form.subjects.filter(x => x !== s) : [...form.subjects, s]})}
                  className={clsx('px-3 py-1 text-xs rounded-full border transition-colors', form.subjects.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300')}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="relative" ref={classDropdownRef}>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Class Assigned</label>
            <button type="button" onClick={() => setClassDropdownOpen(!classDropdownOpen)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-left bg-white focus:ring-2 focus:ring-indigo-500 flex items-center justify-between">
              <span className={clsx(!form.classAssigned && 'text-gray-400')}>{form.classAssigned || 'Select classes...'}</span>
              <svg className={clsx('w-4 h-4 text-gray-400 transition-transform', classDropdownOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {classDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                <div className="p-2 border-b border-gray-100 flex gap-2">
                  <button type="button" onClick={() => setForm({...form, classAssigned: availableClassSections.join(', ')})}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Select all</button>
                  <button type="button" onClick={() => setForm({...form, classAssigned: ''})}
                    className="text-xs text-gray-500 hover:text-gray-700">Clear all</button>
                </div>
                {availableClassSections.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">No classes available for selected subjects</div>
                ) : (
                  classes.map((klass) => {
                    const sectionsForClass = sections.map((sec) => `${klass}${sec}`).filter((cs) => availableClassSections.includes(cs));
                    if (sectionsForClass.length === 0) return null;
                    return (
                      <div key={klass}>
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">{`Class ${klass}`}</div>
                        {sectionsForClass.map((cs) => {
                          const selected = form.classAssigned.split(',').map((s) => s.trim()).includes(cs);
                          return (
                            <label key={cs} className="flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-50 cursor-pointer">
                              <input type="checkbox" checked={selected} readOnly
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                onChange={() => {
                                  const current = form.classAssigned.split(',').map((s) => s.trim()).filter(Boolean);
                                  const next = selected ? current.filter((c) => c !== cs) : [...current, cs];
                                  setForm({...form, classAssigned: next.join(', ')});
                                }} />
                              <span className="text-sm text-gray-700">{cs}</span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Qualification</label>
            <input type="text" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="teacher@school.com" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Salary (₹)</label>
              <input type="number" value={form.salary} onChange={e => setForm({...form, salary: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Join Date</label>
            <input type="date" value={form.joinDate} onChange={e => setForm({...form, joinDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </SlideOver>
    </>
  );
}
