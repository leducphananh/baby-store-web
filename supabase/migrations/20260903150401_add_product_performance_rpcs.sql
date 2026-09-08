-- Phase 7.4 — Product Performance Report.
--
-- Same historical-correctness rules as Phase 7.2/7.3: completed orders
-- only, business date = completed_at, revenue from order_items.line_total
-- (never current products.selling_price), COGS from
-- order_item_batches.unit_cost (never current products.default_purchase_price
-- or current product_batches.purchase_price).
--
-- order-level discount audit (requirement §6): both create_order() and
-- update_order_draft() always insert order_items.discount = 0, and
-- complete_order() never touches orders.discount — so today
-- SUM(order_items.line_total) per order equals orders.total exactly (the
-- same invariant Phase 7.3 relied on for its own revenue definition). If a
-- nonzero order-level discount is ever introduced, product-level revenue
-- here would need proportional allocation (line_total's share of the
-- order's pre-discount subtotal) to keep reconciling with Revenue Report —
-- NOT implemented now (no real nonzero-discount data exists to allocate
-- against), but documented here as the future-safe approach per the
-- phase's own instructions.
--
-- Fan-out safety (requirement §48/49): sales (quantity/order_count/revenue)
-- and COGS are aggregated in independent CTEs — COGS never joins through to
-- `orders.total`/`order_items.line_total`, so a product split across
-- multiple batch allocation rows can never multiply its sold quantity or
-- revenue. `order_count` is `COUNT(DISTINCT order_id)`, never a count of
-- allocation rows.
--
-- SECURITY INVOKER, same reasoning as every other Phase 7.x report RPC.

create or replace function public.get_product_performance_summary(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
returns table (
  products_sold_count bigint,
  total_units_sold bigint,
  top_revenue_product_id uuid,
  top_revenue_product_name text,
  top_revenue_amount numeric,
  top_profit_product_id uuid,
  top_profit_product_name text,
  top_profit_amount numeric
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with sales_by_product as (
    select
      oi.product_id,
      sum(oi.quantity)::bigint as sold_quantity,
      sum(oi.line_total)::numeric as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
    group by oi.product_id
  ),
  cogs_by_product as (
    select
      oi.product_id,
      sum(oib.quantity * oib.unit_cost)::numeric as cogs
    from public.order_item_batches oib
    join public.order_items oi on oi.id = oib.order_item_id
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
    group by oi.product_id
  ),
  combined as (
    select
      s.product_id,
      p.name as product_name,
      s.sold_quantity,
      s.revenue,
      coalesce(c.cogs, 0)::numeric as cogs,
      s.revenue - coalesce(c.cogs, 0)::numeric as gross_profit
    from sales_by_product s
    join public.products p on p.id = s.product_id
    left join cogs_by_product c on c.product_id = s.product_id
  ),
  totals as (
    select
      count(*)::bigint as products_sold_count,
      coalesce(sum(sold_quantity), 0)::bigint as total_units_sold
    from combined
  ),
  -- Deterministic tiebreak (requirement §69): revenue/profit DESC, then
  -- product name, then id — never an arbitrary/unstable row pick on a tie.
  top_revenue as (
    select product_id, product_name, revenue
    from combined
    order by revenue desc, product_name asc, product_id asc
    limit 1
  ),
  top_profit as (
    select product_id, product_name, gross_profit
    from combined
    order by gross_profit desc, product_name asc, product_id asc
    limit 1
  )
  select
    totals.products_sold_count,
    totals.total_units_sold,
    top_revenue.product_id,
    top_revenue.product_name,
    top_revenue.revenue,
    top_profit.product_id,
    top_profit.product_name,
    top_profit.gross_profit
  from totals
  left join top_revenue on true
  left join top_profit on true;
$$;

comment on function public.get_product_performance_summary(timestamptz, timestamptz) is
  'Product Performance KPIs for [p_from, p_to_exclusive) — completed orders only, business date = completed_at. Revenue = SUM(order_items.line_total) (never current products.selling_price); COGS = SUM(order_item_batches.quantity * unit_cost) (never current purchase price). products_sold_count/total_units_sold only count products with actual sales in range.';

revoke all on function public.get_product_performance_summary(timestamptz, timestamptz) from public;
revoke all on function public.get_product_performance_summary(timestamptz, timestamptz) from anon;
grant execute on function public.get_product_performance_summary(timestamptz, timestamptz) to authenticated;

create or replace function public.get_product_performance_list(
  p_from timestamptz,
  p_to_exclusive timestamptz,
  p_search text default null,
  p_category_id uuid default null,
  p_sort_by text default 'revenue',
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
  sold_quantity bigint,
  order_count bigint,
  revenue numeric,
  cogs numeric,
  gross_profit numeric,
  total_count bigint
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with sales_by_product as (
    select
      oi.product_id,
      sum(oi.quantity)::bigint as sold_quantity,
      count(distinct oi.order_id)::bigint as order_count,
      sum(oi.line_total)::numeric as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
    group by oi.product_id
  ),
  cogs_by_product as (
    select
      oi.product_id,
      sum(oib.quantity * oib.unit_cost)::numeric as cogs
    from public.order_item_batches oib
    join public.order_items oi on oi.id = oib.order_item_id
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
    group by oi.product_id
  ),
  combined as (
    select
      s.product_id,
      p.name as product_name,
      p.sku,
      p.category_id,
      cat.name as category_name,
      p.unit,
      p.status as product_status,
      s.sold_quantity,
      s.order_count,
      s.revenue,
      coalesce(c.cogs, 0)::numeric as cogs,
      s.revenue - coalesce(c.cogs, 0)::numeric as gross_profit
    from sales_by_product s
    join public.products p on p.id = s.product_id
    left join cogs_by_product c on c.product_id = s.product_id
    left join public.categories cat on cat.id = p.category_id
    where
      -- Historical sales stay visible regardless of current product status
      -- (requirement §24/§67) — no status filter here at all.
      (p_category_id is null or p.category_id = p_category_id)
      and (
        p_search is null or btrim(p_search) = ''
        or p.name ilike '%' || btrim(p_search) || '%'
        or p.sku ilike '%' || btrim(p_search) || '%'
      )
  ),
  -- One sort key column computed once (requirement §13/§27's ranking
  -- options), rather than a duplicated ASC/DESC CASE per candidate column —
  -- `gross_margin` divides safely (NULL, not error/Infinity, at 0 revenue;
  -- NULLS LAST below keeps those rows at the bottom of either direction).
  ranked as (
    select
      combined.*,
      case p_sort_by
        when 'sold_quantity' then sold_quantity::numeric
        when 'order_count' then order_count::numeric
        when 'cogs' then cogs
        when 'gross_profit' then gross_profit
        when 'gross_margin' then case when revenue = 0 then null else gross_profit / revenue end
        else revenue
      end as sort_key
    from combined
  )
  select
    product_id, product_name, sku, category_id, category_name, unit, product_status,
    sold_quantity, order_count, revenue, cogs, gross_profit,
    count(*) over ()::bigint as total_count
  from ranked
  order by
    case when p_sort_desc then sort_key end desc nulls last,
    case when not p_sort_desc then sort_key end asc nulls last,
    -- Deterministic tiebreaker (requirement §70) so pagination never
    -- shifts rows between pages on equal sort values.
    product_id asc
  limit p_limit offset p_offset;
$$;

comment on function public.get_product_performance_list(timestamptz, timestamptz, text, uuid, text, boolean, int, int) is
  'Paginated per-product sales performance for [p_from, p_to_exclusive). p_sort_by is one of sold_quantity | order_count | revenue | cogs | gross_profit | gross_margin (defaults to revenue for any other value). total_count is the full matching row count (before limit/offset), via a window function, for server-side pagination.';

revoke all on function public.get_product_performance_list(timestamptz, timestamptz, text, uuid, text, boolean, int, int) from public;
revoke all on function public.get_product_performance_list(timestamptz, timestamptz, text, uuid, text, boolean, int, int) from anon;
grant execute on function public.get_product_performance_list(timestamptz, timestamptz, text, uuid, text, boolean, int, int) to authenticated;

create or replace function public.get_category_performance(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
returns table (
  category_id uuid,
  category_name text,
  product_count_sold bigint,
  sold_quantity bigint,
  order_count bigint,
  revenue numeric,
  cogs numeric,
  gross_profit numeric
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with sales_by_item as (
    select oi.id as order_item_id, oi.product_id, oi.order_id, oi.quantity, oi.line_total
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
  ),
  -- Pre-aggregated one row per order_item (fan-out safe — requirement
  -- §48/§50): joining this back to `sales_by_item` 1:1 by order_item_id
  -- can never multiply that item's own quantity/line_total, regardless of
  -- how many batches it was allocated across.
  cogs_by_item as (
    select oib.order_item_id, sum(oib.quantity * oib.unit_cost)::numeric as cogs
    from public.order_item_batches oib
    join sales_by_item si on si.order_item_id = oib.order_item_id
    group by oib.order_item_id
  ),
  item_with_category as (
    select
      si.order_item_id,
      si.product_id,
      si.order_id,
      si.quantity,
      si.line_total,
      coalesce(ci.cogs, 0)::numeric as item_cogs,
      p.category_id
    from sales_by_item si
    join public.products p on p.id = si.product_id
    left join cogs_by_item ci on ci.order_item_id = si.order_item_id
  )
  -- LEFT JOIN to `categories`, grouped by (id, name) together — a product
  -- with `category_id is null` groups as one (null, null) row here, never
  -- dropped (requirement §38); the frontend renders that row as
  -- "Chưa phân loại", matching this app's existing null-category label
  -- convention (see `product-form.tsx`).
  select
    c.id as category_id,
    c.name as category_name,
    count(distinct i.product_id)::bigint as product_count_sold,
    coalesce(sum(i.quantity), 0)::bigint as sold_quantity,
    count(distinct i.order_id)::bigint as order_count,
    coalesce(sum(i.line_total), 0)::numeric as revenue,
    coalesce(sum(i.item_cogs), 0)::numeric as cogs,
    coalesce(sum(i.line_total), 0)::numeric - coalesce(sum(i.item_cogs), 0)::numeric as gross_profit
  from item_with_category i
  left join public.categories c on c.id = i.category_id
  group by c.id, c.name
  order by revenue desc, category_name asc nulls last, category_id asc nulls last;
$$;

comment on function public.get_category_performance(timestamptz, timestamptz) is
  'Category-level sales performance for [p_from, p_to_exclusive), same completed-orders/historical-cost rules as get_product_performance_list(). A product with a null category_id groups under one (null, null) row — rendered as "Chưa phân loại" by the frontend, never dropped.';

revoke all on function public.get_category_performance(timestamptz, timestamptz) from public;
revoke all on function public.get_category_performance(timestamptz, timestamptz) from anon;
grant execute on function public.get_category_performance(timestamptz, timestamptz) to authenticated;
