-- Phase 7.1 — Reports Foundation.
--
-- Centralizes the single business rule "which orders count toward financial
-- reporting" at the database level (CLAUDE.md §12 / domain-driven-frontend
-- rule 11) instead of letting every future report RPC re-derive its own
-- `status = 'completed'` predicate:
--   - draft/confirmed orders have no finalized total and no posted
--     inventory deduction (see `complete_order()`) — not a real sale yet.
--   - cancelled orders keep whatever `total` they had at the moment they
--     were completed (`cancel_order()` never zeroes it out) — a real trap
--     for a naive `status != 'draft'` filter; must stay excluded.
--   - only `completed` is a posted, financially real sale.
--
-- `report_date` is deliberately `completed_at`, NOT `order_date`. Neither
-- `order_date` nor `created_at` reflects when the sale actually happened —
-- both are stamped at row-insert time (when the cart was first created as a
-- draft), which can be days before the order is actually completed. Only
-- `completed_at` is the real business event: the moment `complete_order()`
-- posted the sale and deducted inventory. This is a deliberate departure
-- from `order_date` (what the Orders List/Customer history use for display/
-- filtering — a fine "when was this order placed" operational field, just
-- not the correct "when did this revenue happen" reporting field).
--
-- `security_invoker = true` so RLS on `orders` is re-checked for the
-- querying user, same convention as `customer_order_summary` and
-- `product_inventory_overview`.
create view public.reportable_orders
with (security_invoker = true) as
select
  o.id,
  o.order_number,
  o.customer_id,
  o.completed_at as report_date,
  o.subtotal,
  o.discount,
  o.total,
  o.payment_status
from public.orders o
where o.status = 'completed';

comment on view public.reportable_orders is
  'Orders that count toward financial reporting (status = completed only) — the single source every revenue/profit/product-performance report query should filter/join through, instead of re-deriving the reportable-status rule per report. report_date = completed_at (the actual sale event), not order_date/created_at (both stamped at draft-creation time).';

-- Every future report query is expected to filter by `status = 'completed'`
-- plus a `completed_at` date range (exactly the view's own predicate) —
-- there was no existing index supporting that (only `idx_orders_created_at`
-- and a customer-scoped one). Partial index: only completed rows are ever
-- matched by this predicate, so indexing the rest of the table would be
-- wasted space.
create index idx_orders_status_completed_at
  on public.orders (status, completed_at)
  where status = 'completed';
