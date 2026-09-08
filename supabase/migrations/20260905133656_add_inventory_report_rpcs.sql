-- Phase 7.5 — Inventory Report.
--
-- Unlike Revenue/Profit/Product Performance, this is a CURRENT-STATE
-- snapshot report, not a sales-date-range report (requirement §2) — none of
-- these functions take a date range. "Now" means whatever
-- `product_batches.remaining_quantity` says at query time.
--
-- Authoritative current stock (requirement §4/§41): reuses
-- `public.product_inventory_overview` (Phase 4.6) directly for
-- product_id/name/sku/category/unit/minimum_stock/stock_quantity/
-- batch_count/nearest_expiration/stock_status — that view is already the
-- one place `SUM(product_batches.remaining_quantity)` and the low/out-of-
-- stock classification live (requirement §72: stock-status logic must not
-- be reimplemented in a second place). This migration only ADDS inventory
-- valuation (never in that view) via an independent aggregation over
-- `product_batches`, joined back onto the view by `product_id` — so this
-- report's stock quantities/status are guaranteed identical to the
-- existing Inventory Dashboard's (requirement §76), by construction, not
-- by coincidence.
--
-- Inventory Value = SUM(remaining_quantity * purchase_price) per batch,
-- i.e. each remaining batch's own historical acquisition cost (requirement
-- §8/§9) — never `products.default_purchase_price`/current supplier price.
-- `purchase_price` is `NOT NULL` and `remaining_quantity` has a `CHECK >= 0`
-- constraint on `product_batches` (verified directly against the schema),
-- so a null cost or negative quantity is impossible at the database level,
-- not just assumed absent (requirement §42/§43/§97) — no defensive
-- "missing cost" UI is needed for that. `product_batches.product_id` IS
-- nullable, though (unlike quantity/cost), so `orphan_batch_count`/
-- `orphan_batch_value` below is a genuine (if currently zero, verified)
-- defense-in-depth signal for a batch that would otherwise silently vanish
-- from every per-product aggregation.
--
-- Scope (requirement §21/§33): every function here covers EVERY product
-- with any batch history — active or archived — not just active ones.
-- `product_inventory_overview` itself already has no product-status
-- filter, so this is the natural, already-established scope; picking any
-- narrower scope for only some of these functions would violate the
-- mandatory KPI/category/table reconciliation requirement (§33/§73/§74).
-- Archived-but-still-physically-stocked inventory is real tied-up capital
-- and stays counted everywhere in this report.
--
-- SECURITY INVOKER, same reasoning as every other Phase 7.x report RPC —
-- `product_inventory_overview` is itself `security_invoker=true` already.

create or replace function public.get_inventory_value_summary()
returns table (
  products_in_stock_count bigint,
  total_units bigint,
  total_inventory_value numeric,
  low_stock_count bigint,
  out_of_stock_count bigint,
  orphan_batch_count bigint,
  orphan_batch_value numeric
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
  orphan as (
    select
      count(*)::bigint as orphan_batch_count,
      coalesce(sum(remaining_quantity * purchase_price), 0)::numeric as orphan_batch_value
    from public.product_batches
    where product_id is null
  )
  select
    count(*) filter (where v.stock_quantity > 0)::bigint as products_in_stock_count,
    coalesce(sum(v.stock_quantity), 0)::bigint as total_units,
    coalesce(sum(vp.inventory_value), 0)::numeric as total_inventory_value,
    count(*) filter (where v.stock_status = 'low_stock')::bigint as low_stock_count,
    count(*) filter (where v.stock_status = 'out_of_stock')::bigint as out_of_stock_count,
    max(orphan.orphan_batch_count) as orphan_batch_count,
    max(orphan.orphan_batch_value) as orphan_batch_value
  from public.product_inventory_overview v
  left join value_by_product vp on vp.product_id = v.product_id
  cross join orphan;
$$;

comment on function public.get_inventory_value_summary() is
  'Current inventory valuation KPIs — a snapshot, no date range. total_inventory_value = SUM(product_batches.remaining_quantity * purchase_price), each batch''s own historical acquisition cost, never current product/supplier price. low_stock_count/out_of_stock_count reuse product_inventory_overview.stock_status exactly (same numbers as the Phase 4.6 Inventory Dashboard). orphan_batch_count/value is a defense-in-depth check for a batch with a null product_id (schema-legal, unlike a null cost or negative quantity, both of which are prevented by NOT NULL/CHECK constraints) — expected to always be 0.';

revoke all on function public.get_inventory_value_summary() from public;
revoke all on function public.get_inventory_value_summary() from anon;
grant execute on function public.get_inventory_value_summary() to authenticated;

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
      -- Weighted average cost of CURRENT remaining inventory (requirement
      -- §11) — `inventory_value / current_quantity`, never a plain average
      -- of batch purchase prices. NULL (not an error) at zero quantity.
      case when v.stock_quantity > 0 then coalesce(vp.inventory_value, 0) / v.stock_quantity else null end as average_cost
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
  -- One numeric sort key column computed once (same "single CASE, not a
  -- duplicated ASC/DESC branch per candidate column" convention as
  -- `get_product_performance_list`) — `name` sorts on text separately
  -- below since it isn't a number.
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
    -- Deterministic tiebreaker so pagination never shifts rows between
    -- pages on an equal sort value.
    product_id asc
  limit p_limit offset p_offset;
$$;

comment on function public.get_inventory_product_list(text, uuid, text, text, boolean, int, int) is
  'Paginated per-product current inventory + valuation. p_sort_by is one of name | current_quantity | batch_count | average_cost | inventory_value (default). p_stock_status is one of product_inventory_overview.stock_status (out_of_stock | low_stock | normal) or null for all. Every product with any batch history is included regardless of current active/archived status (requirement §21/§24) — this report never filters by product status.';

revoke all on function public.get_inventory_product_list(text, uuid, text, text, boolean, int, int) from public;
revoke all on function public.get_inventory_product_list(text, uuid, text, text, boolean, int, int) from anon;
grant execute on function public.get_inventory_product_list(text, uuid, text, text, boolean, int, int) to authenticated;

create or replace function public.get_inventory_category_summary()
returns table (
  category_id uuid,
  category_name text,
  product_count integer,
  total_quantity bigint,
  inventory_value numeric
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
  )
  -- Grouped by (category_id, category_name) together, same as
  -- get_category_performance() (Phase 7.4) — a product with no category
  -- groups as one (null, null) row here, rendered "Chưa phân loại" by the
  -- frontend, never dropped (requirement §32/§38).
  select
    v.category_id,
    v.category_name,
    count(*) filter (where v.stock_quantity > 0)::integer as product_count,
    coalesce(sum(v.stock_quantity), 0)::bigint as total_quantity,
    coalesce(sum(vp.inventory_value), 0)::numeric as inventory_value
  from public.product_inventory_overview v
  left join value_by_product vp on vp.product_id = v.product_id
  group by v.category_id, v.category_name
  order by inventory_value desc, category_name asc nulls last, category_id asc nulls last;
$$;

comment on function public.get_inventory_category_summary() is
  'Category-level current inventory valuation, same scope/source as get_inventory_value_summary()/get_inventory_product_list() — every product with any batch history, active or archived. A product with a null category_id groups under one (null, null) row.';

revoke all on function public.get_inventory_category_summary() from public;
revoke all on function public.get_inventory_category_summary() from anon;
grant execute on function public.get_inventory_category_summary() to authenticated;
