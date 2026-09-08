-- Phase 7.6 — factual slow-moving summary KPIs (requirement §67/§69/§70).
-- No "slow-moving" classification: every field here is an objective count/
-- value ("never sold", "no sale in lookback"), not an interpretation.
-- Same fan-out-safe architecture as get_slow_moving_products() — inventory
-- and sales aggregated independently, joined only by product_id.
create or replace function public.get_slow_moving_summary(
  p_lookback_days integer default 30
)
returns table (
  never_sold_count bigint,
  never_sold_value numeric,
  no_sale_in_lookback_count bigint,
  no_sale_in_lookback_value numeric
)
language sql
security invoker
set search_path to 'public'
stable
as $$
  with today as (
    select (now() at time zone 'Asia/Ho_Chi_Minh')::date as business_today
  ),
  inventory_by_product as (
    select product_id, sum(remaining_quantity * purchase_price)::numeric as inventory_value
    from public.product_batches
    where product_id is not null and remaining_quantity > 0
    group by product_id
  ),
  last_sale_by_product as (
    select oi.product_id, max(o.completed_at) as last_sold_at
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status = 'completed'
    group by oi.product_id
  ),
  recent_sales_by_product as (
    select distinct oi.product_id
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    cross join today
    where o.status = 'completed'
      and o.completed_at >= ((today.business_today - p_lookback_days) at time zone 'Asia/Ho_Chi_Minh')
  )
  select
    count(*) filter (where ls.last_sold_at is null)::bigint as never_sold_count,
    coalesce(sum(inv.inventory_value) filter (where ls.last_sold_at is null), 0)::numeric as never_sold_value,
    count(*) filter (where rs.product_id is null)::bigint as no_sale_in_lookback_count,
    coalesce(sum(inv.inventory_value) filter (where rs.product_id is null), 0)::numeric as no_sale_in_lookback_value
  from inventory_by_product inv
  left join last_sale_by_product ls on ls.product_id = inv.product_id
  left join recent_sales_by_product rs on rs.product_id = inv.product_id;
$$;

comment on function public.get_slow_moving_summary(integer) is
  'Factual current-stock (current_quantity > 0) counts/values: never_sold = no completed sale ever; no_sale_in_lookback = no completed sale within p_lookback_days (ending now). Both are objective facts, never a "slow-moving" classification (requirement §67/§73).';

revoke all on function public.get_slow_moving_summary(integer) from public;
revoke all on function public.get_slow_moving_summary(integer) from anon;
grant execute on function public.get_slow_moving_summary(integer) to authenticated;
