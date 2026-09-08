-- Phase 7.2 — Revenue Report.
--
-- Both functions are read-only aggregations over `reportable_orders`' own
-- rule (status = 'completed'), reimplemented here directly against
-- `orders`/`order_payments` rather than selecting from the
-- `reportable_orders` view itself — a view can't accept parameters, and an
-- RPC needs `p_from`/`p_to_exclusive` bounds pushed into the WHERE clause
-- so the planner can use `idx_orders_status_completed_at` (wrapping
-- `completed_at` in a timezone conversion inside the predicate would
-- prevent that — see requirement §30). The predicate here
-- (`status = 'completed' AND completed_at >= / <`) is kept byte-for-byte
-- identical to the view's own rule.
--
-- SECURITY INVOKER (not DEFINER): pure read aggregation, no elevated
-- privilege needed — `orders`/`order_payments` already have a permissive
-- SELECT RLS policy for any authenticated user (see Phase 7.1's audit), so
-- running as the caller is both simpler and strictly safer than DEFINER.

create or replace function public.get_revenue_summary(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
returns table (
  total_revenue numeric,
  completed_order_count bigint,
  average_order_value numeric,
  paid_amount numeric,
  outstanding_amount numeric
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
  -- Summed independently from `revenue`, never via a join that multiplies
  -- `orders.total` by however many payment rows an order has (requirement
  -- §39) — this only ever sums `order_payments.amount` itself, which is
  -- safe to sum across however many rows match.
  paid as (
    select coalesce(sum(op.amount), 0)::numeric as paid_amount
    from public.order_payments op
    join public.orders o on o.id = op.order_id
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
  )
  select
    revenue.total_revenue,
    revenue.completed_order_count,
    case
      when revenue.completed_order_count = 0 then 0
      else round(revenue.total_revenue / revenue.completed_order_count)
    end as average_order_value,
    paid.paid_amount,
    -- Not clamped to >= 0: this app doesn't block overpayment (see
    -- `record_order_payment()`'s doc comment from Phase 6.5), so a
    -- genuinely over-collected period must show as such, not be silently
    -- floored to 0 (requirement §9).
    revenue.total_revenue - paid.paid_amount as outstanding_amount
  from revenue, paid;
$$;

comment on function public.get_revenue_summary(timestamptz, timestamptz) is
  'Revenue KPIs for [p_from, p_to_exclusive) — completed orders only, business date = completed_at. paid_amount sums order_payments for those same orders (not scoped by payment date — see Phase 7.2 report on why this is a sales-revenue collection status, not a cashflow-by-payment-date figure).';

revoke all on function public.get_revenue_summary(timestamptz, timestamptz) from public;
grant execute on function public.get_revenue_summary(timestamptz, timestamptz) to authenticated;

create or replace function public.get_revenue_timeseries(
  p_from timestamptz,
  p_to_exclusive timestamptz
)
returns table (
  report_date date,
  order_count bigint,
  revenue numeric
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with days as (
    -- Zero-fills every Vietnam-local calendar day in range, even ones with
    -- no completed orders (requirement §14) — generated from `timestamp`
    -- (Postgres has no `date`-typed `generate_series` step overload), cast
    -- to `date` only at the end.
    select generate_series(
      date_trunc('day', p_from at time zone 'Asia/Ho_Chi_Minh'),
      date_trunc('day', p_to_exclusive at time zone 'Asia/Ho_Chi_Minh') - interval '1 day',
      interval '1 day'
    )::date as report_date
  ),
  daily as (
    select
      -- Grouped by the Vietnam-local calendar day, not `DATE(completed_at)`
      -- under the (UTC) session timezone — reproducing that would be
      -- exactly the Phase 7.1 timezone bug (requirement §13). The WHERE
      -- predicate below stays on the raw `completed_at` column (unwrapped)
      -- so `idx_orders_status_completed_at` remains usable; the timezone
      -- conversion only happens in this GROUP BY projection.
      (o.completed_at at time zone 'Asia/Ho_Chi_Minh')::date as report_date,
      count(*)::bigint as order_count,
      sum(o.total)::numeric as revenue
    from public.orders o
    where o.status = 'completed'
      and o.completed_at >= p_from
      and o.completed_at < p_to_exclusive
    group by 1
  )
  select
    days.report_date,
    coalesce(daily.order_count, 0)::bigint as order_count,
    coalesce(daily.revenue, 0)::numeric as revenue
  from days
  left join daily using (report_date)
  order by days.report_date;
$$;

comment on function public.get_revenue_timeseries(timestamptz, timestamptz) is
  'Daily revenue/order-count series for [p_from, p_to_exclusive), zero-filled for days with no completed orders, grouped by Vietnam-local calendar date (Asia/Ho_Chi_Minh) — never the Postgres session timezone (UTC on Supabase).';

revoke all on function public.get_revenue_timeseries(timestamptz, timestamptz) from public;
grant execute on function public.get_revenue_timeseries(timestamptz, timestamptz) to authenticated;
