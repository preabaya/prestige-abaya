-- Super Admin tenants table — run in Supabase SQL Editor

alter table public.tenants add column if not exists company_name text;
alter table public.tenants add column if not exists subscription_tier text default 'basic';
alter table public.tenants add column if not exists status text default 'active';
alter table public.tenants add column if not exists health_score integer default 100;

-- Migrate legacy name → company_name
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tenants' and column_name = 'name'
  ) then
    update public.tenants set company_name = name where company_name is null and name is not null;
  end if;
end $$;

update public.tenants set company_name = 'Unnamed Company' where company_name is null;
update public.tenants set subscription_tier = 'basic' where subscription_tier is null;
update public.tenants set status = 'active' where status is null;
update public.tenants set health_score = 100 where health_score is null;

alter table public.tenants alter column company_name set not null;
alter table public.tenants alter column subscription_tier set not null;
alter table public.tenants alter column status set not null;
alter table public.tenants alter column health_score set not null;

alter table public.tenants drop constraint if exists tenants_subscription_tier_check;
alter table public.tenants add constraint tenants_subscription_tier_check
  check (subscription_tier in ('basic', 'pro', 'vip'));

alter table public.tenants drop constraint if exists tenants_status_check;
alter table public.tenants add constraint tenants_status_check
  check (status in ('active', 'suspended'));

alter table public.tenants drop constraint if exists tenants_health_score_check;
alter table public.tenants add constraint tenants_health_score_check
  check (health_score >= 0 and health_score <= 100);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', '')
  ) = 'super_admin';
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to anon, authenticated;

alter table public.tenants enable row level security;

drop policy if exists "tenants_super_admin_select" on public.tenants;
drop policy if exists "tenants_super_admin_update" on public.tenants;
drop policy if exists "tenants_super_admin_insert" on public.tenants;

create policy "tenants_super_admin_select" on public.tenants
  for select using (public.is_super_admin());
create policy "tenants_super_admin_update" on public.tenants
  for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy "tenants_super_admin_insert" on public.tenants
  for insert with check (public.is_super_admin());

-- Optional demo rows (skip if company_name already exists)
insert into public.tenants (company_name, subscription_tier, status, health_score)
select v.company_name, v.subscription_tier, v.status, v.health_score
from (values
  ('Prestige Abaya', 'vip', 'active', 92),
  ('Demo Store Basic', 'basic', 'active', 78),
  ('Demo Store Pro', 'pro', 'suspended', 45)
) as v(company_name, subscription_tier, status, health_score)
where not exists (
  select 1 from public.tenants t where t.company_name = v.company_name
);
