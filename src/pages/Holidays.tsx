import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { type Holiday } from '@/data/mockData';
import { getHolidays } from '@/services/schoolModulesService';
import { Badge } from '@/components/ui/Badge';
import { CalendarDays, Clock, Filter, PartyPopper, Search } from 'lucide-react';

const months = ['All Months', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const types: Array<'All Types' | Holiday['type']> = ['All Types', 'National', 'Festival', 'School Event', 'Vacation', 'Optional'];

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #eef2ff',
  borderRadius: 20,
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.07)',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysBetween(start: string, end?: string) {
  if (!end) return 1;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return Math.max(1, Math.round((endTime - startTime) / 86400000) + 1);
}

function typeTone(type: Holiday['type']) {
  if (type === 'National') return { bg: '#eef2ff', color: '#4f46e5' };
  if (type === 'Festival') return { bg: '#fff7ed', color: '#d97706' };
  if (type === 'Vacation') return { bg: '#ecfdf5', color: '#059669' };
  if (type === 'School Event') return { bg: '#f5f3ff', color: '#9333ea' };
  return { bg: '#f8fafc', color: '#475569' };
}

export function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState('All Months');
  const [type, setType] = useState<(typeof types)[number]>('All Types');

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await getHolidays();
      if (!active) return;
      if (error) setError(error.message);
      setHolidays(data);
    }
    load();
    return () => { active = false; };
  }, []);

  const sortedHolidays = useMemo(() => [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [holidays]);
  const filtered = useMemo(() => sortedHolidays.filter((holiday) => {
    const holidayMonth = new Date(holiday.date).getMonth() + 1;
    const monthMatches = month === 'All Months' || holidayMonth === months.indexOf(month);
    const typeMatches = type === 'All Types' || holiday.type === type;
    const textMatches = `${holiday.title} ${holiday.type} ${holiday.note} ${holiday.audience}`.toLowerCase().includes(query.toLowerCase());
    return monthMatches && typeMatches && textMatches;
  }), [month, query, sortedHolidays, type]);

  const nextHoliday = sortedHolidays.find((holiday) => new Date(holiday.endDate || holiday.date).getTime() >= new Date().getTime()) || sortedHolidays[0];
  const totalDays = filtered.reduce((sum, holiday) => sum + daysBetween(holiday.date, holiday.endDate), 0);
  const vacationCount = filtered.filter((holiday) => holiday.type === 'Vacation').length;

  return (
    <div>
      <PageHeader title="Holidays" subtitle="View school holidays, vacations, and important closures" />
      {error && <div style={{ padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff1f2', color: '#be123c', fontSize: 14, border: '1px solid #fecdd3' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 22 }}>
        <div style={{ ...cardStyle, padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 16, background: '#eef2ff', display: 'grid', placeItems: 'center' }}><CalendarDays size={23} color="#4f46e5" /></div>
          <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Holidays</div><div style={{ color: '#111827', fontSize: 24, fontWeight: 900 }}>{filtered.length}</div></div>
        </div>
        <div style={{ ...cardStyle, padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 16, background: '#ecfdf5', display: 'grid', placeItems: 'center' }}><Clock size={23} color="#059669" /></div>
          <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Total Days</div><div style={{ color: '#111827', fontSize: 24, fontWeight: 900 }}>{totalDays}</div></div>
        </div>
        <div style={{ ...cardStyle, padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 16, background: '#fff7ed', display: 'grid', placeItems: 'center' }}><PartyPopper size={23} color="#d97706" /></div>
          <div><div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Vacation Blocks</div><div style={{ color: '#111827', fontSize: 24, fontWeight: 900 }}>{vacationCount}</div></div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 16, marginBottom: 20 }}>
        <div className="responsive-search-filter" style={{ display: 'grid', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: 13 }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search holidays..." style={{ width: '100%', height: 44, padding: '0 14px 0 42px', borderRadius: 14, border: '1px solid #e5e7eb', background: '#f8fafc', outline: 'none' }} />
          </div>
          <select value={month} onChange={(event) => setMonth(event.target.value)} style={{ height: 44, borderRadius: 14, border: '1px solid #e5e7eb', padding: '0 12px', background: '#fff' }}>
            {months.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value as typeof type)} style={{ height: 44, borderRadius: 14, border: '1px solid #e5e7eb', padding: '0 12px', background: '#fff' }}>
            {types.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {nextHoliday && (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #eef2ff, #ffffff)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4f46e5', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', marginBottom: 7 }}><Filter size={15} /> Next Holiday</div>
              <div style={{ color: '#111827', fontSize: 21, fontWeight: 900 }}>{nextHoliday.title}</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 5 }}>{formatDate(nextHoliday.date)}{nextHoliday.endDate ? ` to ${formatDate(nextHoliday.endDate)}` : ''}</div>
            </div>
            <Badge variant="indigo">{daysBetween(nextHoliday.date, nextHoliday.endDate)} day{daysBetween(nextHoliday.date, nextHoliday.endDate) > 1 ? 's' : ''}</Badge>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
        {filtered.map((holiday) => {
          const tone = typeTone(holiday.type);
          return (
            <article key={holiday.id} style={{ ...cardStyle, padding: 18, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#111827', fontSize: 17, fontWeight: 900 }}>{holiday.title}</div>
                  <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{formatDate(holiday.date)}{holiday.endDate ? ` - ${formatDate(holiday.endDate)}` : ''}</div>
                </div>
                <span style={{ color: tone.color, background: tone.bg, borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900 }}>{holiday.type}</span>
              </div>
              <p style={{ margin: 0, color: '#475569', fontSize: 13, lineHeight: 1.55 }}>{holiday.note}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{holiday.audience}</span>
                <span style={{ color: '#111827', fontSize: 12, fontWeight: 900 }}>{daysBetween(holiday.date, holiday.endDate)} day{daysBetween(holiday.date, holiday.endDate) > 1 ? 's' : ''}</span>
              </div>
            </article>
          );
        })}
      </div>

      {!filtered.length && <div style={{ ...cardStyle, padding: 28, color: '#64748b', textAlign: 'center' }}>No holidays match the selected filters.</div>}
    </div>
  );
}
