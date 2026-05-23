-- Prestige Abaya — Supabase schema (PostgreSQL)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- Extensions (usually enabled by default)
-- create extension if not exists "uuid-ossp";

-- ─── Products (inventory) ───
create table if not exists public.products (
  id text primary key,
  code text not null,
  name text not null,
  size text,
  color text,
  style text default 'classic',
  cost numeric(12,2) not null default 0,
  price numeric(12,2) not null default 0,
  quantity integer not null default 0,
  image text,
  -- timestamptz: client sends ISO 8601; omit on insert to use default now()
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  user_id uuid references auth.users(id) on delete set null
);

-- ─── Sales (orders / invoices) ───
create table if not exists public.sales (
  id text primary key,
  product_id text references public.products(id) on delete set null,
  product_name text,
  product_code text,
  product_color text,
  product_style text,
  quantity integer not null default 1,
  unit_price_aud numeric(12,2) not null,
  unit_cost_aud numeric(12,2) not null default 0,
  line_total_aud numeric(12,2),
  customer text,
  payment text,
  sale_source text default 'in_store',
  payment_method text default 'cash',
  invoice_number text,
  returned boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  created_by text,
  user_id uuid references auth.users(id) on delete set null
);

create index if not exists sales_created_at_idx on public.sales (created_at desc);
create index if not exists sales_user_id_idx on public.sales (user_id);

-- ─── Expenses ───
create table if not exists public.expenses (
  id text primary key,
  name text not null,
  category text not null,
  currency text default 'AUD',
  amount_original numeric(12,2) not null default 0,
  exchange_rate numeric(12,6) default 1,
  financials jsonb,
  due_date date,
  created_at timestamptz not null default now(),
  created_by text,
  user_id uuid references auth.users(id) on delete set null
);

-- ─── App settings (per user or global row) ───
create table if not exists public.app_settings (
  id text primary key default 'default',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade
);

-- ─── Row Level Security (RLS) ───
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.app_settings enable row level security;

-- Authenticated users can read/write their own rows (user_id = auth.uid())
create policy "sales_select_own" on public.sales for select using (auth.uid() = user_id);
create policy "sales_insert_own" on public.sales for insert with check (auth.uid() = user_id);
create policy "sales_update_own" on public.sales for update using (auth.uid() = user_id);
create policy "sales_delete_own" on public.sales for delete using (auth.uid() = user_id);

create policy "products_select_own" on public.products for select using (auth.uid() = user_id);
create policy "products_insert_own" on public.products for insert with check (auth.uid() = user_id);
create policy "products_update_own" on public.products for update using (auth.uid() = user_id);
create policy "products_delete_own" on public.products for delete using (auth.uid() = user_id);

create policy "expenses_select_own" on public.expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses for delete using (auth.uid() = user_id);

create policy "settings_select_own" on public.app_settings for select using (auth.uid() = user_id);
create policy "settings_upsert_own" on public.app_settings for all using (auth.uid() = user_id);

-- Optional: allow all authenticated users to see all rows (team shared store)
-- drop policies above and use: using (auth.role() = 'authenticated')
