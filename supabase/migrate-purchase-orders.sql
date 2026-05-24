-- Prestige Abaya — purchase_orders (طلبات إعادة التوريد)
-- نفّذ في: Supabase Dashboard → SQL Editor

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  inventory_id uuid references public.inventory (id) on delete set null,
  product_name text not null,
  quantity_ordered integer not null default 1 check (quantity_ordered > 0),
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'completed', 'cancelled')),
  source text not null default 'manual'
    check (source in ('manual', 'auto_reorder')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchase_orders_tenant_status_idx
  on public.purchase_orders (tenant_id, status, created_at desc);

create index if not exists purchase_orders_product_idx
  on public.purchase_orders (tenant_id, product_name);

comment on table public.purchase_orders is 'Replenishment / reorder purchase orders';

alter table public.purchase_orders enable row level security;

drop policy if exists "purchase_orders_tenant_select" on public.purchase_orders;
drop policy if exists "purchase_orders_tenant_insert" on public.purchase_orders;
drop policy if exists "purchase_orders_tenant_update" on public.purchase_orders;

create policy "purchase_orders_tenant_select" on public.purchase_orders
  for select using (tenant_id = public.current_tenant_id());

create policy "purchase_orders_tenant_insert" on public.purchase_orders
  for insert with check (tenant_id = public.current_tenant_id());

create policy "purchase_orders_tenant_update" on public.purchase_orders
  for update
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- السماح بحذف تنبيهات ai_alerts الأقدم من 30 يوماً (تنظيف يومي)
drop policy if exists "ai_alerts_tenant_delete" on public.ai_alerts;
create policy "ai_alerts_tenant_delete" on public.ai_alerts
  for delete using (tenant_id = public.current_tenant_id());
