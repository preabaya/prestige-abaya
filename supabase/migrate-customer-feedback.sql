-- Prestige Abaya — customer feedback (تقييمات / شكاوى / ملاحظات)
-- نفّذ في: Supabase Dashboard → SQL Editor

create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  customer_id text not null,
  customer_name text,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  feedback_type text not null default 'general'
    check (feedback_type in ('rating', 'complaint', 'note', 'general')),
  message text,
  sentiment text default 'neutral'
    check (sentiment in ('happy', 'angry', 'neutral')),
  created_at timestamptz not null default now()
);

create index if not exists customer_feedback_tenant_idx
  on public.customer_feedback (tenant_id, created_at desc);

create index if not exists customer_feedback_customer_idx
  on public.customer_feedback (tenant_id, customer_id);

comment on table public.customer_feedback is 'Customer ratings, complaints, and notes per tenant';

alter table public.customer_feedback enable row level security;

drop policy if exists "customer_feedback_tenant_select" on public.customer_feedback;
drop policy if exists "customer_feedback_tenant_insert" on public.customer_feedback;

create policy "customer_feedback_tenant_select" on public.customer_feedback
  for select using (tenant_id = public.current_tenant_id());

create policy "customer_feedback_tenant_insert" on public.customer_feedback
  for insert with check (tenant_id = public.current_tenant_id());
