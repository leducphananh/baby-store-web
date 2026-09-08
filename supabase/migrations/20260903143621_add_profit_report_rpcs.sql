-- Phase 7.3 — Profit Report.
--
-- Gross Profit only (Revenue - COGS), NOT net profit — no operating
-- expenses/salaries/rent/tax are deducted (see requirement §53). COGS uses
-- ONLY the historical `order_item_batches.unit_cost` snapshot written once
-- by `complete_order()` at the moment of sale (copied from
-- `product_batches.purchase_price` at that instant) — never
-- `products.default_purchase_price`/current `product_batches.purchase_price`,
-- which can change after the sale (requirement §3/§41). Purchasing
-- inventory (import receipts) is never treated as COGS — only the
-- historical cost of units actually sold counts (requirement §54/§55).
--
-- Revenue uses the exact same source/predicate as `get_revenue_summary`/
-- `get_revenue_timeseries` (Phase 7.2): `SUM(orders.total)` for
-- `status = 'completed'` orders in range, business date = `completed_at`.
-- `orders.total` already reflects order-level/item-level discounts (see
-- `complete_order()`: `total = SUM(order_items.line_total)`), so Gross
-- Profit is never computed from `subtotal` (requirement §7/§44). A
-- cancelled order keeps its historical `orders.total` and
-- `order_item_batches` rows for audit purposes, but is excluded here by
-- the `status = 'completed'` predicate alone, same as Revenue (§8/§45).
--
-- Safe join strategy (requirement §16/17): Revenue and COGS are each
-- aggregated independently (COGS sums `order_item_batches.quantity *
-- unit_cost` directly — it never touches `orders.total`), then combined —
-- so however many order_items/allocation rows one order has, its
-- `orders.total` is never fanned out and double-counted.
--
-- COGS coverage: `complete_order()` allocates each order_item's full
-- quantity across `order_item_batches` inside one atomic transaction,
-- raising (and rolling back the whole order) if stock runs out before the
-- full quantity is allocated — so a `completed` order can never exist with
-- partially-allocated cost. Combined with `order_item_batches.unit_cost`/
-- `quantity` both being `NOT NULL` (`quantity` also `CHECK > 0`), COGS is
-- guaranteed complete for every completed order at the DB level (verified
-- against real data while building this migration: 0 mismatches). The
-- `orders_with_missing_cost` field below is a defense-in-depth check for
-- this invariant, not evidence it's expected to ever be nonzero — see
-- Phase 7.3 completion report for why no "incomplete data" warning UI is
-- needed in the normal case.
--
-- SECURITY INVOKER (not DEFINER), same reasoning as the Revenue RPCs: pure
-- read aggregation over tables that already have a permissive SELECT RLS
-- policy for `authenticated`.

create or replace function public.get_profit_summary(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
returns table (
  total_revenue numeric,
  completed_order_count bigint,
  total_cogs numeric,
  gross_profit numeric,
  orders_with_missing_cost bigint
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with revenue as (
    select
      coalesce(sum(o.total), 0)::numeric as total_revenue,
      count(*)::bigint as completed_order_count
    from public.orders o
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
  ),
  cogs as (
    select coalesce(sum(oib.quantity * oib.unit_cost), 0)::numeric as total_cogs
    from public.order_item_batches oib
    join public.order_items oi on oi.id = oib.order_item_id
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
  ),
  missing_cost as (
    select count(distinct oi.order_id)::bigint as orders_with_missing_cost
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    left join (
      select order_item_id, sum(quantity) as allocated_qty
      from public.order_item_batches
      group by order_item_id
    ) alloc on alloc.order_item_id = oi.id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
      and coalesce(alloc.allocated_qty, 0) <> oi.quantity
  )
  select
    revenue.total_revenue,
    revenue.completed_order_count,
    cogs.total_cogs,
    revenue.total_revenue - cogs.total_cogs as gross_profit,
    missing_cost.orders_with_missing_cost
  from revenue, cogs, missing_cost;
$$;

comment on function public.get_profit_summary(timestamptz, timestamptz) is
  'Gross Profit KPIs for [p_from, p_to_exclusive) — completed orders only, business date = completed_at. COGS = SUM(order_item_batches.quantity * unit_cost), the historical cost snapshot from complete_order(), never current product/batch purchase price. Gross Profit = Revenue - COGS (never net profit — no operating expenses deducted). orders_with_missing_cost is a defense-in-depth data-quality check, expected to always be 0 given complete_order()''s allocation guarantee.';

revoke all on function public.get_profit_summary(timestamptz, timestamptz) from public;
revoke all on function public.get_profit_summary(timestamptz, timestamptz) from anon;
grant execute on function public.get_profit_summary(timestamptz, timestamptz) to authenticated;

create or replace function public.get_profit_timeseries(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
returns table (
  report_date date,
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
  with days as (
    select generate_series(
      date_trunc('day', p_from at time zone 'Asia/Ho_Chi_Minh'),
      date_trunc('day', p_to_exclusive at time zone 'Asia/Ho_Chi_Minh') - interval '1 day',
      interval '1 day'
    )::date as report_date
  ),
  daily_revenue as (
    select
      (o.completed_at at time zone 'Asia/Ho_Chi_Minh')::date as report_date,
      count(*)::bigint as order_count,
      sum(o.total)::numeric as revenue
    from public.orders o
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
    group by 1
  ),
  -- Aggregated independently from `daily_revenue` (same safe-join strategy
  -- as `get_profit_summary` above) — joined back only by `report_date`,
  -- never by `order_id`, so a day with many allocation rows across many
  -- orders never multiplies that day's revenue.
  daily_cogs as (
    select
      (o.completed_at at time zone 'Asia/Ho_Chi_Minh')::date as report_date,
      sum(oib.quantity * oib.unit_cost)::numeric as cogs
    from public.order_item_batches oib
    join public.order_items oi on oi.id = oib.order_item_id
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
    group by 1
  )
  select
    days.report_date,
    coalesce(daily_revenue.order_count, 0)::bigint as order_count,
    coalesce(daily_revenue.revenue, 0)::numeric as revenue,
    coalesce(daily_cogs.cogs, 0)::numeric as cogs,
    coalesce(daily_revenue.revenue, 0)::numeric - coalesce(daily_cogs.cogs, 0)::numeric as gross_profit
  from days
  left join daily_revenue using (report_date)
  left join daily_cogs using (report_date)
  order by days.report_date;
$$;

comment on function public.get_profit_timeseries(timestamptz, timestamptz) is
  'Daily revenue/COGS/gross-profit series for [p_from, p_to_exclusive), zero-filled for days with no completed orders, grouped by Vietnam-local calendar date (Asia/Ho_Chi_Minh) — same grouping convention as get_revenue_timeseries.';

revoke all on function public.get_profit_timeseries(timestamptz, timestamptz) from public;
revoke all on function public.get_profit_timeseries(timestamptz, timestamptz) from anon;
grant execute on function public.get_profit_timeseries(timestamptz, timestamptz) to authenticated;
