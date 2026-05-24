-- Prestige Abaya — security_logs (نشاط مشبوه في المبيعات)
-- نفّذ في: Supabase Dashboard → SQL Editor

create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  sale_id text,
  alert_type text not null,
  severity text not null default 'warning'
    check (severity in ('info', 'warning', 'critical')),
  message text not null,
  sale_snapshot jsonb default '{}'::jsonb,
  reviewed boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now()
);

create index if not exists security_logs_tenant_reviewed_idx
  on public.security_logs (tenant_id, reviewed, created_at desc);

comment on table public.security_logs is 'Suspicious sale activity pending manager review';

alter table public.security_logs enable row level security;

drop policy if exists "security_logs_tenant_select" on public.security_logs;
drop policy if exists "security_logs_tenant_insert" on public.security_logs;
drop policy if exists "security_logs_tenant_update" on public.security_logs;

create policy "security_logs_tenant_select" on public.security_logs
  for select using (tenant_id = public.current_tenant_id());

create policy "security_logs_tenant_insert" on public.security_logs
  for insert with check (tenant_id = public.current_tenant_id());

create policy "security_logs_tenant_update" on public.security_logs
  for update
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
