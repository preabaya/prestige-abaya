-- Add user_role to profiles for AuthGuard (admin vs client)
alter table public.profiles
  add column if not exists user_role text not null default 'client'
  check (user_role in ('admin', 'client'));

comment on column public.profiles.user_role is 'ERP access: admin = central dashboard, client = client portal';
