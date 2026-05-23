-- AI anomaly alerts — run in Supabase SQL Editor

create table if not exists public.ai_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  alert_type text not null,
  severity text not null default 'warning',
  table_name text,
  record_id text,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_alerts_tenant_created_idx
  on public.ai_alerts (tenant_id, created_at desc);

alter table public.ai_alerts enable row level security;

drop policy if exists "ai_alerts_tenant_select" on public.ai_alerts;
drop policy if exists "ai_alerts_tenant_insert" on public.ai_alerts;

create policy "ai_alerts_tenant_select" on public.ai_alerts
  for select using (tenant_id = public.current_tenant_id());

create policy "ai_alerts_tenant_insert" on public.ai_alerts
  for insert with check (tenant_id = public.current_tenant_id());
