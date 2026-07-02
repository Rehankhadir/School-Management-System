-- Run this in Supabase SQL Editor.
-- It creates the first database foundation for the school management apps.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'teacher', 'student', 'parent', 'accountant')),
  school_name text not null default 'Sunrise Public School',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id text primary key,
  name text not null,
  roll_no text not null,
  class text not null,
  section text not null,
  dob date not null,
  gender text not null,
  blood_group text not null,
  guardian_name text not null,
  guardian_phone text not null,
  guardian_email text not null,
  address text not null,
  photo_url text,
  admission_date date not null,
  fee_status text not null check (fee_status in ('Paid', 'Partially Paid', 'Due', 'Overdue')),
  attendance_percent numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id text primary key,
  name text not null,
  employee_id text not null unique,
  subjects text[] not null default '{}',
  class_assigned text not null,
  qualification text not null,
  phone text not null,
  email text not null unique,
  join_date date not null,
  salary numeric not null default 0,
  status text not null check (status in ('Active', 'On Leave', 'Inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  class text not null,
  section text not null,
  date date not null,
  status text not null check (status in ('Present', 'Absent', 'Late')),
  marked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

create table if not exists public.marks (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  exam text not null,
  subject text not null,
  max_marks numeric not null,
  scored numeric not null,
  grade text not null,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (student_id, exam, subject)
);

create table if not exists public.notifications (
  id text primary key,
  type text not null check (type in ('fee', 'attendance', 'announcement', 'leave', 'general')),
  title text not null,
  message text not null,
  time timestamptz not null default now(),
  read boolean not null default false,
  for_role text[] not null default '{}',
  target_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.holidays (
  id text primary key,
  title text not null,
  date date not null,
  end_date date,
  type text not null check (type in ('National', 'Festival', 'School Event', 'Vacation', 'Optional')),
  audience text not null check (audience in ('All', 'Students', 'Teachers', 'Staff')),
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fees (
  student_id text primary key references public.students(id) on delete cascade,
  fee_structure jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  balance numeric not null default 0,
  due_date date not null,
  status text not null check (status in ('Paid', 'Partially Paid', 'Due', 'Overdue')),
  payment_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id text primary key,
  name text not null,
  class text not null,
  section text,
  subject text,
  date date not null,
  time text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.timetable_entries (
  id text primary key,
  class text not null,
  section text not null,
  day text not null,
  period integer not null,
  time text not null,
  subject text not null,
  teacher text not null default '',
  is_break boolean not null default false,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (class, section, day, period)
);

create table if not exists public.leaves (
  id text primary key,
  applicant_id text not null,
  applicant_name text not null,
  applicant_role text not null,
  leave_type text not null,
  from_date date not null,
  to_date date not null,
  days numeric not null,
  reason text not null,
  status text not null check (status in ('Pending', 'Approved', 'Rejected')),
  applied_on date not null,
  remarks text,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id text primary key,
  title text not null,
  body text not null,
  audience text[] not null default '{}',
  priority text not null check (priority in ('Normal', 'Important', 'Urgent')),
  posted_by text not null,
  posted_at timestamptz not null default now(),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select name from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_name() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_name() to authenticated;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.attendance_records enable row level security;
alter table public.marks enable row level security;
alter table public.notifications enable row level security;
alter table public.holidays enable row level security;
alter table public.fees enable row level security;
alter table public.exams enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.leaves enable row level security;
alter table public.announcements enable row level security;

create policy "profiles read self or admin" on public.profiles
for select using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "students read by role or linked parent" on public.students
for select using (
  public.current_user_role() in ('admin', 'teacher', 'accountant')
  or guardian_email = (select email from public.profiles where id = auth.uid())
);

create policy "students admin write" on public.students
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "teachers read staff" on public.teachers
for select using (public.current_user_role() in ('admin', 'teacher'));

create policy "teachers admin write" on public.teachers
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "attendance read by role or linked parent" on public.attendance_records
for select using (
  public.current_user_role() in ('admin', 'teacher')
  or exists (
    select 1 from public.students s
    join public.profiles p on p.email = s.guardian_email
    where s.id = attendance_records.student_id and p.id = auth.uid()
  )
);

create policy "attendance staff write" on public.attendance_records
for all using (public.current_user_role() in ('admin', 'teacher'))
with check (public.current_user_role() in ('admin', 'teacher'));

create policy "marks read by role or linked parent" on public.marks
for select using (
  public.current_user_role() in ('admin', 'teacher')
  or exists (
    select 1 from public.students s
    join public.profiles p on p.email = s.guardian_email
    where s.id = marks.student_id and p.id = auth.uid()
  )
);

create policy "marks staff write" on public.marks
for all using (public.current_user_role() in ('admin', 'teacher'))
with check (public.current_user_role() in ('admin', 'teacher'));

create policy "notifications read by role and target" on public.notifications
for select using (
  public.current_user_role() = any(for_role)
  and (
    target_email is null
    or target_email = (select email from public.profiles where id = auth.uid())
  )
);

create policy "notifications authenticated insert" on public.notifications
for insert with check (auth.uid() is not null);

create policy "notifications owner update read flag" on public.notifications
for update using (
  public.current_user_role() = any(for_role)
  and (
    target_email is null
    or target_email = (select email from public.profiles where id = auth.uid())
  )
);

create policy "holidays read authenticated" on public.holidays
for select using (auth.uid() is not null);

create policy "holidays admin write" on public.holidays
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "fees read by role or linked parent" on public.fees
for select using (
  public.current_user_role() in ('admin', 'accountant')
  or exists (
    select 1 from public.students s
    join public.profiles p on p.email = s.guardian_email
    where s.id = fees.student_id and p.id = auth.uid()
  )
);

create policy "fees finance write" on public.fees
for all using (public.current_user_role() in ('admin', 'accountant'))
with check (public.current_user_role() in ('admin', 'accountant'));

create policy "exams read authenticated" on public.exams
for select using (auth.uid() is not null);

create policy "exams staff write" on public.exams
for all using (public.current_user_role() in ('admin', 'teacher'))
with check (public.current_user_role() in ('admin', 'teacher'));

create policy "timetable read authenticated" on public.timetable_entries
for select using (auth.uid() is not null);

create policy "timetable staff write" on public.timetable_entries
for all using (public.current_user_role() in ('admin', 'teacher'))
with check (public.current_user_role() in ('admin', 'teacher'));

create policy "leaves read scoped" on public.leaves
for select using (
  public.current_user_role() = 'admin'
  or applicant_id = auth.uid()::text
  or applicant_name = public.current_user_name()
);

create policy "leaves authenticated insert" on public.leaves
for insert with check (auth.uid() is not null);

create policy "leaves admin update" on public.leaves
for update using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "announcements read by audience" on public.announcements
for select using (
  'All' = any(audience)
  or initcap(public.current_user_role()) = any(audience)
  or (
    public.current_user_role() = 'parent'
    and 'Parents' = any(audience)
  )
);

create policy "announcements admin write" on public.announcements
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
