-- Optional: SQL view alias "inventory" → products (for reporting tools)
-- The inventory.html page reads from public.products directly.

create or replace view public.inventory as
select
  id,
  name as product_name,
  quantity as available_quantity,
  cost as cost_price,
  price as sale_price,
  case
    when quantity = 0 then 'نفد المخزون'
    when quantity < 5 then 'تنبيه — مخزون منخفض'
    else 'طبيعي'
  end as alert_status,
  tenant_id,
  updated_at
from public.products;

comment on view public.inventory is 'Read-only inventory view over products; ERP app uses products.quantity';
