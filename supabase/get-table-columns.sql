-- Run once in Supabase Dashboard → SQL Editor (required for dynamic sales inserts)
-- Exposes information_schema.columns to the app via RPC.

create or replace function public.get_table_columns(p_table_name text)
returns table (column_name text)
language sql
security definer
stable
set search_path = public
as $$
  select c.column_name::text
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = lower(trim(p_table_name))
  order by c.ordinal_position;
$$;

revoke all on function public.get_table_columns(text) from public;
grant execute on function public.get_table_columns(text) to anon, authenticated;
