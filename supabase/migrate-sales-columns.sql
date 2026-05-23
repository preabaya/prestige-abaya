-- Prestige Abaya — Add ALL sales columns used by the app (run once in Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS on every column.

alter table public.sales
  add column if not exists product_id text,
  add column if not exists product_name text,
  add column if not exists product_code text,
  add column if not exists product_color text,
  add column if not exists product_style text default 'classic',
  add column if not exists product_size text,
  add column if not exists quantity integer not null default 1,
  add column if not exists unit_price_aud numeric(12,2) not null default 0,
  add column if not exists unit_cost_aud numeric(12,2) not null default 0,
  add column if not exists subtotal_aud numeric(12,2),
  add column if not exists line_total_aud numeric(12,2),
  add column if not exists discount_type text default 'none',
  add column if not exists discount_value numeric(12,2) default 0,
  add column if not exists extra_shipping_aud numeric(12,2) default 0,
  add column if not exists customer text,
  add column if not exists payment text,
  add column if not exists sale_source text default 'in_store',
  add column if not exists payment_method text default 'cash',
  add column if not exists invoice_number text,
  add column if not exists batch_id text,
  add column if not exists returned boolean not null default false,
  add column if not exists returned_at timestamptz,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by text,
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists sales_created_at_idx on public.sales (created_at desc);
create index if not exists sales_user_id_idx on public.sales (user_id);
create index if not exists sales_invoice_number_idx on public.sales (invoice_number);
create index if not exists sales_batch_id_idx on public.sales (batch_id);
