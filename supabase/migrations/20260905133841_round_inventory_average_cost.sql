-- Corrective fix: `average_cost` (inventory_value / current_quantity) can
-- produce a long-tail decimal (e.g. 700000/3 = 233333.333...) — money is
-- always integer VND in this app (CLAUDE.md §8), so round it in SQL, same
-- convention as `get_revenue_summary()`'s `average_order_value`, rather
-- than leaving raw division exposed for the frontend to round.
create or replace function public.get_inventory_product_list(
  p_search text default null,
  p_category_id uuid default null,
  p_stock_status text default null,
  p_sort_by text default 'inventory_value',
  p_sort_desc boolean default true,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  product_id uuid,
  product_name text,
  sku text,
  category_id uuid,
  category_name text,
  unit text,
  product_status text,
  current_quantity integer,
  batch_count integer,
  inventory_value numeric,
  average_cost numeric,
  minimum_stock integer,
  stock_status text,
  nearest_expiration date,
  total_count bigint
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with value_by_product as (
    select product_id, sum(remaining_quantity * purchase_price)::numeric as inventory_value
    from public.product_batches
    where product_id is not null
    group by product_id
  ),
  combined as (
    select
      v.product_id,
      v.name as product_name,
      v.sku,
      v.category_id,
      v.category_name,
      v.unit,
      v.product_status,
      v.stock_quantity as current_quantity,
      v.batch_count,
      v.minimum_stock,
      v.stock_status,
      v.nearest_expiration,
      coalesce(vp.inventory_value, 0)::numeric as inventory_value,
      case when v.stock_quantity > 0 then round(coalesce(vp.inventory_value, 0) / v.stock_quantity) else null end as average_cost
    from public.product_inventory_overview v
    left join value_by_product vp on vp.product_id = v.product_id
    where
      (p_category_id is null or v.category_id = p_category_id)
      and (p_stock_status is null or v.stock_status = p_stock_status)
      and (
        p_search is null or btrim(p_search) = ''
        or v.name ilike '%' || btrim(p_search) || '%'
        or v.sku ilike '%' || btrim(p_search) || '%'
        or v.barcode ilike '%' || btrim(p_search) || '%'
      )
  ),
  ranked as (
    select
      combined.*,
      case p_sort_by
        when 'current_quantity' then current_quantity::numeric
        when 'batch_count' then batch_count::numeric
        when 'average_cost' then average_cost
        else inventory_value
      end as sort_key
    from combined
  )
  select
    product_id, product_name, sku, category_id, category_name, unit, product_status,
    current_quantity, batch_count, inventory_value, average_cost, minimum_stock, stock_status, nearest_expiration,
    count(*) over ()::bigint as total_count
  from ranked
  order by
    case when p_sort_by = 'name' and p_sort_desc then product_name end desc,
    case when p_sort_by = 'name' and not p_sort_desc then product_name end asc,
    case when p_sort_by <> 'name' and p_sort_desc then sort_key end desc nulls last,
    case when p_sort_by <> 'name' and not p_sort_desc then sort_key end asc nulls last,
    product_id asc
  limit p_limit offset p_offset;
$$;

comment on function public.get_inventory_product_list(text, uuid, text, text, boolean, int, int) is
  'Paginated per-product current inventory + valuation. p_sort_by is one of name | current_quantity | batch_count | average_cost | inventory_value (default). p_stock_status is one of product_inventory_overview.stock_status (out_of_stock | low_stock | normal) or null for all. Every product with any batch history is included regardless of current active/archived status (requirement §21/§24) — this report never filters by product status. average_cost is rounded to the nearest integer VND (money is always integer VND, CLAUDE.md §8).';

revoke all on function public.get_inventory_product_list(text, uuid, text, text, boolean, int, int) from public;
revoke all on function public.get_inventory_product_list(text, uuid, text, text, boolean, int, int) from anon;
grant execute on function public.get_inventory_product_list(text, uuid, text, text, boolean, int, int) to authenticated;
