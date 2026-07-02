-- Run this once in Supabase SQL Editor after the initial schema.
-- It adds the remaining app modules: fees, exams, timetable, leaves, announcements.

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

alter table public.fees enable row level security;
alter table public.exams enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.leaves enable row level security;
alter table public.announcements enable row level security;

drop policy if exists "fees read by role or linked parent" on public.fees;
create policy "fees read by role or linked parent" on public.fees
for select using (
  public.current_user_role() in ('admin', 'accountant')
  or exists (
    select 1 from public.students s
    join public.profiles p on p.email = s.guardian_email
    where s.id = fees.student_id and p.id = auth.uid()
  )
);

drop policy if exists "fees finance write" on public.fees;
create policy "fees finance write" on public.fees
for all using (public.current_user_role() in ('admin', 'accountant'))
with check (public.current_user_role() in ('admin', 'accountant'));

drop policy if exists "exams read authenticated" on public.exams;
create policy "exams read authenticated" on public.exams
for select using (auth.uid() is not null);

drop policy if exists "exams staff write" on public.exams;
create policy "exams staff write" on public.exams
for all using (public.current_user_role() in ('admin', 'teacher'))
with check (public.current_user_role() in ('admin', 'teacher'));

drop policy if exists "timetable read authenticated" on public.timetable_entries;
create policy "timetable read authenticated" on public.timetable_entries
for select using (auth.uid() is not null);

drop policy if exists "timetable staff write" on public.timetable_entries;
create policy "timetable staff write" on public.timetable_entries
for all using (public.current_user_role() in ('admin', 'teacher'))
with check (public.current_user_role() in ('admin', 'teacher'));

drop policy if exists "leaves read scoped" on public.leaves;
create policy "leaves read scoped" on public.leaves
for select using (
  public.current_user_role() = 'admin'
  or applicant_id = auth.uid()::text
  or applicant_name = public.current_user_name()
);

drop policy if exists "leaves authenticated insert" on public.leaves;
create policy "leaves authenticated insert" on public.leaves
for insert with check (auth.uid() is not null);

drop policy if exists "leaves admin update" on public.leaves;
create policy "leaves admin update" on public.leaves
for update using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "announcements read by audience" on public.announcements;
create policy "announcements read by audience" on public.announcements
for select using (
  'All' = any(audience)
  or initcap(public.current_user_role()) = any(audience)
  or (
    public.current_user_role() = 'parent'
    and 'Parents' = any(audience)
  )
);

drop policy if exists "announcements admin write" on public.announcements;
create policy "announcements admin write" on public.announcements
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
