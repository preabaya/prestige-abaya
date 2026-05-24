-- Prestige Abaya — جدول inventory (مخزون مستقل)
-- نفّذ في: Supabase Dashboard → SQL Editor

-- إن وُجد view قديم بنفس الاسم، احذفه أولاً
drop view if exists public.inventory;

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  min_threshold integer not null default 5 check (min_threshold >= 0),
  cost_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  last_updated timestamptz not null default now(),
  tenant_id uuid references public.tenants (id) on delete cascade
);

create index if not exists inventory_tenant_id_idx on public.inventory (tenant_id);
create index if not exists inventory_product_name_idx on public.inventory (product_name);
create index if not exists inventory_last_updated_idx on public.inventory (last_updated desc);

comment on table public.inventory is 'ERP inventory — stock per product with min_threshold alerts';
comment on column public.inventory.min_threshold is 'Alert when stock_quantity falls below this value';

-- تحديث last_updated تلقائياً
create or replace function public.inventory_set_last_updated()
returns trigger
language plpgsql
as $$
begin
  new.last_updated := now();
  return new;
end;
$$;

drop trigger if exists inventory_last_updated_trg on public.inventory;
create trigger inventory_last_updated_trg
  before insert or update on public.inventory
  for each row execute function public.inventory_set_last_updated();

-- RLS (نفس نمط products / sales)
alter table public.inventory enable row level security;

drop policy if exists "inventory_tenant_select" on public.inventory;
drop policy if exists "inventory_tenant_insert" on public.inventory;
drop policy if exists "inventory_tenant_update" on public.inventory;
drop policy if exists "inventory_tenant_delete" on public.inventory;

create policy "inventory_tenant_select" on public.inventory
  for select using (tenant_id = public.current_tenant_id());

create policy "inventory_tenant_insert" on public.inventory
  for insert with check (tenant_id = public.current_tenant_id());

create policy "inventory_tenant_update" on public.inventory
  for update
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "inventory_tenant_delete" on public.inventory
  for delete using (tenant_id = public.current_tenant_id());

-- اختياري: إذا كان anon key لا يمرّر JWT tenant، فعّل السياسات التالية مؤقتاً للتطوير:
-- drop policy if exists "inventory_anon_dev" on public.inventory;
-- create policy "inventory_anon_dev" on public.inventory for all to anon using (true) with check (true);
