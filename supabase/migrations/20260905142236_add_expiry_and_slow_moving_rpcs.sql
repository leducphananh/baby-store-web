-- Phase 7.6 — Expiry & Slow-moving Report.
--
-- Two independent analytics concepts, deliberately not combined into one
-- score (requirement §2): Expiry Risk (batch/date-based, current physical
-- inventory only) and Slow-moving analysis (product/sales-velocity-based,
-- factual metrics only — no invented "slow" classification, requirement
-- §22/§67/§73).
--
-- CURRENT-INVENTORY basis (requirement §3): every function here uses
-- `product_batches.remaining_quantity > 0` — a depleted historical batch
-- never contributes to expiry exposure or slow-moving inventory value,
-- matching Phase 7.5's own "physical stock, not original quantity" rule.
--
-- Vietnam business "today" (requirement §6/§10/§26): computed once per
-- function as `(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date` — the same
-- construction already used by `get_revenue_timeseries()`/
-- `get_profit_timeseries()`, and by this same migration's
-- `complete_order()` fix. Never the Postgres session's (UTC) `CURRENT_DATE`.
--
-- Expired definition (requirement §7): `expiration_date < business_today`
-- — a batch is NOT yet expired on its own expiration_date (matches
-- `complete_order()`'s own sale-eligibility check and
-- `product_inventory_overview`/`classifyExpiry`'s existing convention —
-- one definition, reused everywhere, never redefined ad hoc).
--
-- Missing expiry (requirement §5): `expiration_date IS NULL` is its own
-- explicit state ("Chưa có HSD") everywhere below — never coerced into
-- "expired" or "safe".
--
-- Near-expiry horizon (requirement §8): `p_horizon_days` is a REPORT
-- FILTER the caller chooses (7/30/60/90), never a hardcoded permanent
-- "risk" business rule baked into these functions. 30 is only the
-- pre-existing app-wide default day count already used for this exact
-- purpose (`EXPIRING_SOON_DAYS` in `features/batches/utils/expiry.ts`,
-- Phase 4) — reused as this report's default selection, not reinvented.
--
-- SECURITY INVOKER, same convention as every other Phase 7.x report RPC.

-- ============================================================
-- get_expiry_bucket_summary: FULL distribution of every remaining batch
-- (regardless of horizon) into fixed, transparent buckets — reconciles
-- exactly with Phase 7.5's total inventory value/quantity (requirement
-- §42/§97), unlike the horizon-scoped functions below. Powers the expiry
-- chart.
-- ============================================================
create or replace function public.get_expiry_bucket_summary()
returns table (
  bucket text,
  bucket_order integer,
  batch_count bigint,
  quantity bigint,
  inventory_value numeric
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with today as (
    select (now() at time zone 'Asia/Ho_Chi_Minh')::date as business_today
  ),
  classified as (
    select
      pb.id,
      pb.remaining_quantity,
      pb.purchase_price,
      case
        when pb.expiration_date is null then 'missing_expiry'
        when pb.expiration_date < today.business_today then 'expired'
        when pb.expiration_date - today.business_today <= 7 then 'due_0_7'
        when pb.expiration_date - today.business_today <= 30 then 'due_8_30'
        when pb.expiration_date - today.business_today <= 60 then 'due_31_60'
        when pb.expiration_date - today.business_today <= 90 then 'due_61_90'
        else 'due_over_90'
      end as bucket
    from public.product_batches pb
    cross join today
    where pb.remaining_quantity > 0
  ),
  buckets(bucket, bucket_order) as (
    values
      ('expired', 1), ('due_0_7', 2), ('due_8_30', 3), ('due_31_60', 4),
      ('due_61_90', 5), ('due_over_90', 6), ('missing_expiry', 7)
  )
  select
    buckets.bucket,
    buckets.bucket_order,
    coalesce(count(classified.id), 0)::bigint as batch_count,
    coalesce(sum(classified.remaining_quantity), 0)::bigint as quantity,
    coalesce(sum(classified.remaining_quantity * classified.purchase_price), 0)::numeric as inventory_value
  from buckets
  left join classified on classified.bucket = buckets.bucket
  group by buckets.bucket, buckets.bucket_order
  order by buckets.bucket_order;
$$;

comment on function public.get_expiry_bucket_summary() is
  'Full expiry-distance distribution of ALL current remaining inventory (remaining_quantity > 0) into 7 fixed, transparent buckets — SUM(inventory_value) across every bucket here equals get_inventory_value_summary().total_inventory_value exactly (Phase 7.5), and SUM(quantity) equals total_units. Vietnam business-date arithmetic; expired = expiration_date < business_today.';

revoke all on function public.get_expiry_bucket_summary() from public;
revoke all on function public.get_expiry_bucket_summary() from anon;
grant execute on function public.get_expiry_bucket_summary() to authenticated;

-- ============================================================
-- get_expiry_summary: horizon-scoped KPIs (expired / near-expiry within
-- p_horizon_days / missing-expiry), all restricted to remaining_quantity > 0.
-- ============================================================
create or replace function public.get_expiry_summary(
  p_horizon_days integer default 30
)
returns table (
  expired_batch_count bigint,
  expired_quantity bigint,
  expired_inventory_value numeric,
  near_expiry_batch_count bigint,
  near_expiry_quantity bigint,
  near_expiry_inventory_value numeric,
  missing_expiry_batch_count bigint,
  missing_expiry_quantity bigint,
  missing_expiry_value numeric
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with today as (
    select (now() at time zone 'Asia/Ho_Chi_Minh')::date as business_today
  ),
  eligible as (
    select pb.*
    from public.product_batches pb
    where pb.remaining_quantity > 0
  )
  select
    count(*) filter (where e.expiration_date is not null and e.expiration_date < today.business_today)::bigint,
    coalesce(sum(e.remaining_quantity) filter (where e.expiration_date is not null and e.expiration_date < today.business_today), 0)::bigint,
    coalesce(sum(e.remaining_quantity * e.purchase_price) filter (where e.expiration_date is not null and e.expiration_date < today.business_today), 0)::numeric,
    count(*) filter (
      where e.expiration_date is not null
        and e.expiration_date >= today.business_today
        and e.expiration_date <= today.business_today + p_horizon_days
    )::bigint,
    coalesce(sum(e.remaining_quantity) filter (
      where e.expiration_date is not null
        and e.expiration_date >= today.business_today
        and e.expiration_date <= today.business_today + p_horizon_days
    ), 0)::bigint,
    coalesce(sum(e.remaining_quantity * e.purchase_price) filter (
      where e.expiration_date is not null
        and e.expiration_date >= today.business_today
        and e.expiration_date <= today.business_today + p_horizon_days
    ), 0)::numeric,
    count(*) filter (where e.expiration_date is null)::bigint,
    coalesce(sum(e.remaining_quantity) filter (where e.expiration_date is null), 0)::bigint,
    coalesce(sum(e.remaining_quantity * e.purchase_price) filter (where e.expiration_date is null), 0)::numeric
  from eligible e
  cross join today;
$$;

comment on function public.get_expiry_summary(integer) is
  'Expiry-risk KPIs for remaining inventory (remaining_quantity > 0) only. p_horizon_days is the caller-chosen report horizon (e.g. 7/30/60/90), not a permanent business threshold. expired = expiration_date < business_today; near-expiry = business_today <= expiration_date <= business_today + p_horizon_days; missing = expiration_date IS NULL, tracked separately, never folded into either other bucket.';

revoke all on function public.get_expiry_summary(integer) from public;
revoke all on function public.get_expiry_summary(integer) from anon;
grant execute on function public.get_expiry_summary(integer) to authenticated;

-- ============================================================
-- get_expiry_batch_list: paginated batch-level detail, scoped to expiry
-- risk (expired ∪ near-expiry-within-horizon ∪ missing-expiry) by design
-- (requirement §39) — never lists every long-dated "safe" batch.
-- ============================================================
create or replace function public.get_expiry_batch_list(
  p_horizon_days integer default 30,
  p_search text default null,
  p_category_id uuid default null,
  p_status_filter text default 'all',
  p_sort_by text default 'expiration_date',
  p_sort_desc boolean default false,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  batch_id uuid,
  product_id uuid,
  product_name text,
  sku text,
  category_id uuid,
  category_name text,
  product_status text,
  lot_number text,
  remaining_quantity integer,
  purchase_price numeric,
  inventory_value numeric,
  expiration_date date,
  days_remaining integer,
  expiry_status text,
  total_count bigint
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with today as (
    select (now() at time zone 'Asia/Ho_Chi_Minh')::date as business_today
  ),
  combined as (
    select
      pb.id as batch_id,
      p.id as product_id,
      p.name as product_name,
      p.sku,
      p.category_id,
      cat.name as category_name,
      p.status as product_status,
      pb.lot_number,
      pb.remaining_quantity,
      pb.purchase_price,
      (pb.remaining_quantity * pb.purchase_price)::numeric as inventory_value,
      pb.expiration_date,
      case when pb.expiration_date is not null then (pb.expiration_date - today.business_today) end as days_remaining,
      case
        when pb.expiration_date is null then 'missing_expiry'
        when pb.expiration_date < today.business_today then 'expired'
        else 'near_expiry'
      end as expiry_status
    from public.product_batches pb
    cross join today
    join public.products p on p.id = pb.product_id
    left join public.categories cat on cat.id = p.category_id
    where pb.remaining_quantity > 0
      and (p_category_id is null or p.category_id = p_category_id)
      and (
        p_search is null or btrim(p_search) = ''
        or p.name ilike '%' || btrim(p_search) || '%'
        or p.sku ilike '%' || btrim(p_search) || '%'
        or pb.lot_number ilike '%' || btrim(p_search) || '%'
      )
      -- Risk scope (requirement §39): expired, OR expiring within the
      -- selected horizon, OR missing expiry. A long-dated "safe" batch
      -- never appears here regardless of p_status_filter.
      and (
        (pb.expiration_date is not null and pb.expiration_date < today.business_today)
        or (pb.expiration_date is not null and pb.expiration_date <= today.business_today + p_horizon_days)
        or pb.expiration_date is null
      )
      and (
        p_status_filter is null or p_status_filter = 'all'
        or (p_status_filter = 'expired' and pb.expiration_date is not null and pb.expiration_date < today.business_today)
        or (p_status_filter = 'near_expiry' and pb.expiration_date is not null and pb.expiration_date >= today.business_today)
        or (p_status_filter = 'missing_expiry' and pb.expiration_date is null)
      )
  ),
  ranked as (
    select
      combined.*,
      case p_sort_by
        when 'inventory_value' then inventory_value
        when 'remaining_quantity' then remaining_quantity::numeric
        else null
      end as numeric_sort_key
    from combined
  )
  select
    batch_id, product_id, product_name, sku, category_id, category_name, product_status,
    lot_number, remaining_quantity, purchase_price, inventory_value, expiration_date, days_remaining, expiry_status,
    count(*) over ()::bigint as total_count
  from ranked
  order by
    case when p_sort_by = 'product_name' and p_sort_desc then product_name end desc,
    case when p_sort_by = 'product_name' and not p_sort_desc then product_name end asc,
    case when p_sort_by in ('inventory_value', 'remaining_quantity') and p_sort_desc then numeric_sort_key end desc nulls last,
    case when p_sort_by in ('inventory_value', 'remaining_quantity') and not p_sort_desc then numeric_sort_key end asc nulls last,
    -- Default: expiry_date ascending, expired first, missing-expiry
    -- deterministically last regardless of direction (requirement §40).
    case when p_sort_by = 'expiration_date' and p_sort_desc then expiration_date end desc nulls last,
    case when p_sort_by = 'expiration_date' and not p_sort_desc then expiration_date end asc nulls last,
    batch_id asc
  limit p_limit offset p_offset;
$$;

comment on function public.get_expiry_batch_list(integer, text, uuid, text, text, boolean, int, int) is
  'Paginated batch-level expiry-risk detail: expired ∪ near-expiry-within-p_horizon_days ∪ missing-expiry, remaining_quantity > 0 only. p_status_filter narrows within that risk scope (all | expired | near_expiry | missing_expiry) — never widens it to "safe" long-dated batches.';

revoke all on function public.get_expiry_batch_list(integer, text, uuid, text, text, boolean, int, int) from public;
revoke all on function public.get_expiry_batch_list(integer, text, uuid, text, text, boolean, int, int) from anon;
grant execute on function public.get_expiry_batch_list(integer, text, uuid, text, text, boolean, int, int) to authenticated;

-- ============================================================
-- get_slow_moving_products: factual current-inventory + recent-sales
-- metrics only — no invented "slow-moving" classification (requirement
-- §22/§67/§73). Fan-out safe (requirement §48/49): inventory and sales are
-- aggregated in independent CTEs and joined only by product_id, never by
-- a raw batches×order_items join. LEFT JOIN from inventory so a
-- never-sold product is never dropped (requirement §50).
-- ============================================================
create or replace function public.get_slow_moving_products(
  p_lookback_days integer default 30,
  p_search text default null,
  p_category_id uuid default null,
  p_sort_by text default 'last_sold_at',
  p_sort_desc boolean default false,
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
  inventory_value numeric,
  last_sold_at timestamptz,
  days_since_last_sale integer,
  sold_quantity_lookback bigint,
  order_count_lookback bigint,
  revenue_lookback numeric,
  total_count bigint
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with today as (
    select (now() at time zone 'Asia/Ho_Chi_Minh')::date as business_today
  ),
  -- Current inventory (Phase 7.5's exact same formula) — independent of sales.
  inventory_by_product as (
    select product_id, sum(remaining_quantity)::integer as current_quantity,
           sum(remaining_quantity * purchase_price)::numeric as inventory_value
    from public.product_batches
    where product_id is not null and remaining_quantity > 0
    group by product_id
  ),
  -- Ever-sold recency, unbounded by lookback — completed orders only.
  last_sale_by_product as (
    select oi.product_id, max(o.completed_at) as last_sold_at
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
    group by oi.product_id
  ),
  -- Recent activity within the selected lookback window, ending "now"
  -- (this is a live snapshot report, not a fixed historical range —
  -- unlike Phase 7.2-7.4's two-sided date range).
  recent_sales_by_product as (
    select
      oi.product_id,
      sum(oi.quantity)::bigint as sold_quantity,
      count(distinct oi.order_id)::bigint as order_count,
      sum(oi.line_total)::numeric as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    cross join today
    where o.status = 'completed'
      and o.completed_at >= ((today.business_today - p_lookback_days) at time zone 'Asia/Ho_Chi_Minh')
    group by oi.product_id
  ),
  combined as (
    select
      inv.product_id,
      p.name as product_name,
      p.sku,
      p.category_id,
      cat.name as category_name,
      p.unit,
      p.status as product_status,
      inv.current_quantity,
      inv.inventory_value,
      ls.last_sold_at,
      case when ls.last_sold_at is not null
        then (today.business_today - (ls.last_sold_at at time zone 'Asia/Ho_Chi_Minh')::date)
      end as days_since_last_sale,
      coalesce(rs.sold_quantity, 0)::bigint as sold_quantity_lookback,
      coalesce(rs.order_count, 0)::bigint as order_count_lookback,
      coalesce(rs.revenue, 0)::numeric as revenue_lookback
    from inventory_by_product inv
    cross join today
    join public.products p on p.id = inv.product_id
    left join public.categories cat on cat.id = p.category_id
    left join last_sale_by_product ls on ls.product_id = inv.product_id
    left join recent_sales_by_product rs on rs.product_id = inv.product_id
    where
      (p_category_id is null or p.category_id = p_category_id)
      and (
        p_search is null or btrim(p_search) = ''
        or p.name ilike '%' || btrim(p_search) || '%'
        or p.sku ilike '%' || btrim(p_search) || '%'
      )
  ),
  ranked as (
    select
      combined.*,
      case p_sort_by
        when 'inventory_value' then inventory_value
        when 'current_quantity' then current_quantity::numeric
        when 'sold_quantity' then sold_quantity_lookback::numeric
        when 'revenue' then revenue_lookback
        when 'order_count' then order_count_lookback::numeric
        when 'days_since_last_sale' then days_since_last_sale::numeric
        else null
      end as numeric_sort_key
    from combined
  )
  select
    product_id, product_name, sku, category_id, category_name, unit, product_status,
    current_quantity, inventory_value, last_sold_at, days_since_last_sale,
    sold_quantity_lookback, order_count_lookback, revenue_lookback,
    count(*) over ()::bigint as total_count
  from ranked
  order by
    case when p_sort_by = 'name' and p_sort_desc then product_name end desc,
    case when p_sort_by = 'name' and not p_sort_desc then product_name end asc,
    case when p_sort_by in ('inventory_value','current_quantity','sold_quantity','revenue','order_count','days_since_last_sale') and p_sort_desc then numeric_sort_key end desc nulls last,
    case when p_sort_by in ('inventory_value','current_quantity','sold_quantity','revenue','order_count','days_since_last_sale') and not p_sort_desc then numeric_sort_key end asc nulls last,
    -- Default factual sort (requirement §34): never-sold first (NULLS
    -- FIRST on ascending order), then oldest last-sale first — no
    -- invented "slow-moving" priority weighting, just recency.
    case when p_sort_by = 'last_sold_at' and p_sort_desc then last_sold_at end desc nulls last,
    case when p_sort_by = 'last_sold_at' and not p_sort_desc then last_sold_at end asc nulls first,
    product_id asc
  limit p_limit offset p_offset;
$$;

comment on function public.get_slow_moving_products(integer, text, uuid, text, boolean, int, int) is
  'Factual current-inventory + recent-sales metrics per product with current_quantity > 0 — no invented slow-moving/turnover/sell-through classification. p_lookback_days is the caller-chosen sales analysis window (e.g. 30/60/90), ending now. Default sort (last_sold_at ASC, NULLS FIRST) surfaces never-sold products first, then longest-since-last-sale. Cancelled orders never count (status = ''completed'' only, same as every other Phase 7.x report).';

revoke all on function public.get_slow_moving_products(integer, text, uuid, text, boolean, int, int) from public;
revoke all on function public.get_slow_moving_products(integer, text, uuid, text, boolean, int, int) from anon;
grant execute on function public.get_slow_moving_products(integer, text, uuid, text, boolean, int, int) to authenticated;
