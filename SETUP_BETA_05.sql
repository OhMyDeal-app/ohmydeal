-- OhMyDeal Beta 0.5: transitional per-user JSON cloud storage.
-- Run ONCE in Supabase SQL Editor. Existing 15 tables are NOT changed.
create table if not exists public.omd_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.omd_user_data enable row level security;
drop policy if exists omd_user_data_owner_select on public.omd_user_data;
drop policy if exists omd_user_data_owner_insert on public.omd_user_data;
drop policy if exists omd_user_data_owner_update on public.omd_user_data;
create policy omd_user_data_owner_select on public.omd_user_data for select to authenticated using (user_id = (select auth.uid()));
create policy omd_user_data_owner_insert on public.omd_user_data for insert to authenticated with check (user_id = (select auth.uid()));
create policy omd_user_data_owner_update on public.omd_user_data for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select,insert,update on public.omd_user_data to authenticated;
