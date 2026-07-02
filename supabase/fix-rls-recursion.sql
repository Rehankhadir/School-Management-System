-- Fix RLS recursion that can surface as:
-- "stack depth limit exceeded"
--
-- Run this once in Supabase SQL Editor.

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

drop policy if exists "leaves read scoped" on public.leaves;
create policy "leaves read scoped" on public.leaves
for select using (
  public.current_user_role() = 'admin'
  or applicant_id = auth.uid()::text
  or applicant_name = public.current_user_name()
);

notify pgrst, 'reload schema';
