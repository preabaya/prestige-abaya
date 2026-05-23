-- Multi-tenant RLS migration — run in Supabase SQL Editor
-- Links rows to tenant_id; users only see their tenant via public.current_tenant_id()

-- ─── Tenants ───
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  subscription_tier text not null default 'basic'
    check (subscription_tier in ('basic', 'pro', 'vip')),
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  health_score integer not null default 100
    check (health_score >= 0 and health_score <= 100),
  created_at timestamptz not null default now()
);

-- ─── User profile → tenant (session tenant comes from here or JWT metadata) ───
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  display_name text,
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
alter table public.sales add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;

create index if not exists products_tenant_id_idx on public.products (tenant_id);
create index if not exists sales_tenant_id_idx on public.sales (tenant_id);

-- Resolve tenant for the active auth session (JWT metadata or profiles row)
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid,
    nullif(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')::uuid,
    (select p.tenant_id from public.profiles p where p.id = auth.uid() limit 1)
  );
$$;

revoke all on function public.current_tenant_id() from public;
grant execute on function public.current_tenant_id() to anon, authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- Replace user_id policies with tenant isolation on products & sales
drop policy if exists "sales_select_own" on public.sales;
drop policy if exists "sales_insert_own" on public.sales;
drop policy if exists "sales_update_own" on public.sales;
drop policy if exists "sales_delete_own" on public.sales;

drop policy if exists "products_select_own" on public.products;
drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_delete_own" on public.products;

drop policy if exists "sales_tenant_select" on public.sales;
drop policy if exists "sales_tenant_insert" on public.sales;
drop policy if exists "sales_tenant_update" on public.sales;
drop policy if exists "sales_tenant_delete" on public.sales;

create policy "sales_tenant_select" on public.sales
  for select using (tenant_id = public.current_tenant_id());

create policy "sales_tenant_insert" on public.sales
  for insert with check (tenant_id = public.current_tenant_id());

create policy "sales_tenant_update" on public.sales
  for update
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "sales_tenant_delete" on public.sales
  for delete using (tenant_id = public.current_tenant_id());

drop policy if exists "products_tenant_select" on public.products;
drop policy if exists "products_tenant_insert" on public.products;
drop policy if exists "products_tenant_update" on public.products;
drop policy if exists "products_tenant_delete" on public.products;

create policy "products_tenant_select" on public.products
  for select using (tenant_id = public.current_tenant_id());

create policy "products_tenant_insert" on public.products
  for insert with check (tenant_id = public.current_tenant_id());

create policy "products_tenant_update" on public.products
  for update
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "products_tenant_delete" on public.products
  for delete using (tenant_id = public.current_tenant_id());

-- Example: create a default tenant and assign your user (replace UUIDs)
-- insert into public.tenants (id, company_name, subscription_tier, status, health_score)
-- values ('00000000-0000-0000-0000-000000000001', 'Prestige Abaya', 'vip', 'active', 92)
-- on conflict do nothing;
-- insert into public.profiles (id, tenant_id, display_name)
--   values ('YOUR_AUTH_USER_UUID', '00000000-0000-0000-0000-000000000001', 'Admin')
--   on conflict (id) do update set tenant_id = excluded.tenant_id;
