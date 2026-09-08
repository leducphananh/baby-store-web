-- Phase 5.2: Customer Detail and Purchase History
--
-- Aggregated per-customer order stats (total orders, completed orders,
-- total spending, most recent order date) as one view, following the same
-- pattern already used for `product_inventory_overview` (Phase 4.6) —
-- avoids fetching every order row client-side just to sum/count them, and
-- avoids a query per order (see `table-data-grid`/`supabase-database`).
--
-- "Total spending" only counts `completed` orders: that's the one order
-- status whose `total` is guaranteed accurate (recalculated server-side by
-- `complete_order()` from the real line items at completion time, not a
-- client-supplied draft value) and where the sale is actually realized
-- (inventory was deducted). `draft`/`confirmed` orders aren't real sales
-- yet, and a `cancelled` order's stock was already reversed by
-- `cancel_order()` — so none of those should count as spending.
create view public.customer_order_summary as
select
  c.id as customer_id,
  count(o.id) as total_orders,
  count(o.id) filter (where o.status = 'completed') as completed_orders,
  coalesce(sum(o.total) filter (where o.status = 'completed'), 0) as total_spent,
  max(o.order_date) filter (where o.status = 'completed') as last_order_date
from public.customers c
left join public.orders o on o.customer_id = c.id
group by c.id;
