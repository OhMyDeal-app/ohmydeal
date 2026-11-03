-- OhMyDeal Beta 0.8: additive schema; does not touch omd_user_data or existing storage.
create table if not exists public.omd_agent_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '', phone text not null default '', telegram text not null default '',
 verified boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.omd_agent_profiles enable row level security;
-- Only a trusted administrator/service role can set verified. Do not give UPDATE on verified to authenticated.
revoke all on public.omd_agent_profiles from anon, authenticated;
grant select (user_id, display_name, phone, telegram, verified, created_at) on public.omd_agent_profiles to authenticated;
grant insert (user_id, display_name, phone, telegram) on public.omd_agent_profiles to authenticated;
grant update (display_name, phone, telegram) on public.omd_agent_profiles to authenticated;
create or replace function public.omd_is_verified() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.omd_agent_profiles where user_id=auth.uid() and verified=true);
$$;
revoke all on function public.omd_is_verified() from public;
grant execute on function public.omd_is_verified() to authenticated;
drop policy if exists omd_profile_read on public.omd_agent_profiles;
create policy omd_profile_read on public.omd_agent_profiles for select to authenticated
 using (user_id=auth.uid() or (verified and public.omd_is_verified()));
drop policy if exists omd_profile_insert on public.omd_agent_profiles;
create policy omd_profile_insert on public.omd_agent_profiles for insert to authenticated with check(user_id=auth.uid() and verified=false);
drop policy if exists omd_profile_update on public.omd_agent_profiles;
create policy omd_profile_update on public.omd_agent_profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create table if not exists public.omd_shared_listings (
 id uuid primary key default gen_random_uuid(), agent_id uuid not null references public.omd_agent_profiles(user_id) on delete cascade,
 local_id text not null, title text not null, price numeric not null check(price>=0), area numeric check(area>=0),
 location text, floor text, rooms text, description text,
 sale_status text not null default 'В продаже' check(sale_status in ('В продаже','Бронь','Продан','Снят с продажи')),
 visibility text not null default 'Партнёры' check(visibility in ('Партнёры','Все агенты')),
 commission_mode text not null default 'percent' check(commission_mode in ('percent','amount')),
 commission_value numeric check(commission_value>=0),
 partner_mode text not null default 'percent' check(partner_mode in ('percent','amount')),
 partner_value numeric check(partner_value>=0),
 updated_at timestamptz not null default now(), unique(agent_id,local_id)
);
alter table public.omd_shared_listings enable row level security;
grant select,insert,update,delete on public.omd_shared_listings to authenticated;
drop policy if exists omd_listing_read on public.omd_shared_listings;
create policy omd_listing_read on public.omd_shared_listings for select to authenticated using (
 agent_id=auth.uid() or (visibility in ('Партнёры','Все агенты') and public.omd_is_verified())
);
drop policy if exists omd_listing_insert on public.omd_shared_listings;
create policy omd_listing_insert on public.omd_shared_listings for insert to authenticated with check (
 agent_id=auth.uid() and public.omd_is_verified()
);
drop policy if exists omd_listing_update on public.omd_shared_listings;
create policy omd_listing_update on public.omd_shared_listings for update to authenticated using(agent_id=auth.uid()) with check(agent_id=auth.uid());
drop policy if exists omd_listing_delete on public.omd_shared_listings;
create policy omd_listing_delete on public.omd_shared_listings for delete to authenticated using(agent_id=auth.uid());
-- No photos, cadastral code, owner contacts, private comments or client data in this table.
-- Client-facing links and protected image derivatives require a separate server-side release.
