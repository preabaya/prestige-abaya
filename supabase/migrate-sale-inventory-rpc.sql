-- Prestige Abaya — بيع + خصم مخزون في معاملة واحدة (Transaction)
-- نفّذ في: Supabase Dashboard → SQL Editor

create or replace function public.insert_sale_with_inventory(p_sale jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_name text;
  v_qty integer;
  v_tenant_id uuid;
  v_inv_id uuid;
  v_stock integer;
  v_result jsonb;
begin
  if p_sale is null or p_sale = 'null'::jsonb then
    raise exception 'بيانات البيع غير صالحة';
  end if;

  v_product_name := trim(coalesce(p_sale->>'product_name', ''));
  if v_product_name = '' then
    raise exception 'اسم المنتج مطلوب';
  end if;

  v_qty := greatest(1, coalesce((p_sale->>'quantity')::integer, 1));

  begin
    v_tenant_id := nullif(trim(p_sale->>'tenant_id'), '')::uuid;
  exception
    when others then
      v_tenant_id := null;
  end;

  select i.id, i.stock_quantity
  into v_inv_id, v_stock
  from public.inventory i
  where trim(lower(i.product_name)) = trim(lower(v_product_name))
    and (
      v_tenant_id is null
      or i.tenant_id is null
      or i.tenant_id = v_tenant_id
    )
  order by i.last_updated desc nulls last
  limit 1
  for update;

  if v_inv_id is null then
    raise exception 'المنتج غير موجود في المخزون';
  end if;

  if coalesce(v_stock, 0) < v_qty then
    raise exception 'عفواً، الكمية غير كافية!';
  end if;

  update public.inventory
  set stock_quantity = stock_quantity - v_qty
  where id = v_inv_id;

  insert into public.sales (
    id,
    created_at,
    updated_at,
    customer_name,
    customer,
    product_name,
    price,
    quantity,
    created_by,
    invoice_number,
    line_total_aud,
    status,
    tenant_id,
    batch_id
  )
  values (
    coalesce(p_sale->>'id', gen_random_uuid()::text),
    coalesce((p_sale->>'created_at')::timestamptz, now()),
    coalesce((p_sale->>'updated_at')::timestamptz, now()),
    coalesce(nullif(trim(p_sale->>'customer_name'), ''), nullif(trim(p_sale->>'customer'), ''), 'POS Guest'),
    coalesce(nullif(trim(p_sale->>'customer'), ''), nullif(trim(p_sale->>'customer_name'), ''), 'POS Guest'),
    v_product_name,
    coalesce((p_sale->>'price')::numeric, 0),
    v_qty,
    coalesce(nullif(trim(p_sale->>'created_by'), ''), 'guest'),
    coalesce(p_sale->>'invoice_number', ''),
    coalesce((p_sale->>'line_total_aud')::numeric, 0),
    coalesce(nullif(trim(p_sale->>'status'), ''), 'completed'),
    v_tenant_id,
    nullif(trim(p_sale->>'batch_id'), '')
  )
  returning to_jsonb(public.sales.*) into v_result;

  return v_result;
end;
$$;

comment on function public.insert_sale_with_inventory(jsonb) is
  'Inserts a sales row and deducts inventory.stock_quantity atomically';

grant execute on function public.insert_sale_with_inventory(jsonb) to anon, authenticated;
