-- Optional: branch_id on core tables (alias to tenant / store)
-- Run if you use current_branch_id in dashboard-service.js

alter table public.sales
  add column if not exists branch_id uuid references public.tenants (id) on delete cascade;

alter table public.inventory
  add column if not exists branch_id uuid references public.tenants (id) on delete cascade;

alter table public.expenses
  add column if not exists branch_id uuid references public.tenants (id) on delete set null;

alter table public.profiles
  add column if not exists branch_id uuid references public.tenants (id) on delete set null;

create index if not exists sales_branch_id_idx on public.sales (branch_id);
create index if not exists inventory_branch_id_idx on public.inventory (branch_id);
create index if not exists expenses_branch_id_idx on public.expenses (branch_id);

-- Backfill from tenant_id where applicable
update public.sales set branch_id = tenant_id where branch_id is null and tenant_id is not null;
update public.inventory set branch_id = tenant_id where branch_id is null and tenant_id is not null;
