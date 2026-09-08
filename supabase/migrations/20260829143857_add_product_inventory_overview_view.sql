-- Read-only, per-product inventory aggregation for the Inventory Dashboard
-- (Phase 4.6). Additive only: no existing table/column touched.
--
-- Why a view instead of aggregating in the client: stock/expiry status are
-- derived from `product_batches`, not raw product columns, so correct
-- server-side filtering + pagination (CLAUDE.md §12 / `supabase-database`
-- rule 10 / `dashboard-ui` rule 7a — never paginate a filtered set after
-- fetching it client-side) requires the aggregation to happen in Postgres.
-- One `lateral` join per product row, computed by the planner as a single
-- pass over `product_batches` grouped by `product_id` — not one query per
-- product (avoids N+1, same spirit as the batched queries in
-- `get-products.ts`).
--
-- `security_invoker = true` (PG15+) is required so this view enforces RLS as
-- the *querying* user against the underlying tables, not the view owner's
-- privileges — the same access a direct query against `products` /
-- `product_batches` would get (CLAUDE.md §9, `frontend-security`).
--
-- The `expiring_soon` threshold (30 days) mirrors
-- `src/features/batches/utils/expiry.ts`'s `EXPIRING_SOON_DAYS` constant —
-- the one other place this business rule is allowed to live
-- (`domain-driven-frontend` rule 19). If that constant ever changes, this
-- view must be updated to match.
create or replace view public.product_inventory_overview
with (security_invoker = true) as
select
  p.id as product_id,
  p.name,
  p.sku,
  p.barcode,
  p.unit,
  p.minimum_stock,
  p.status as product_status,
  p.category_id,
  c.name as category_name,
  coalesce(b.total_remaining, 0)::integer as stock_quantity,
  coalesce(b.batch_count, 0)::integer as batch_count,
  b.nearest_expiration,
  case
    when coalesce(b.total_remaining, 0) <= 0 then 'out_of_stock'
    when coalesce(b.total_remaining, 0) <= p.minimum_stock then 'low_stock'
    else 'normal'
  end as stock_status,
  case
    when coalesce(b.has_expired, false) then 'expired'
    when coalesce(b.has_expiring_soon, false) then 'expiring_soon'
    else 'none'
  end as expiry_status
from public.products p
left join public.categories c on c.id = p.category_id
left join lateral (
  select
    sum(pb.remaining_quantity) as total_remaining,
    count(*) filter (where pb.remaining_quantity > 0) as batch_count,
    min(pb.expiration_date) filter (where pb.remaining_quantity > 0) as nearest_expiration,
    bool_or(
      pb.remaining_quantity > 0
      and pb.expiration_date is not null
      and pb.expiration_date < current_date
    ) as has_expired,
    bool_or(
      pb.remaining_quantity > 0
      and pb.expiration_date is not null
      and pb.expiration_date >= current_date
      and pb.expiration_date <= current_date + 30
    ) as has_expiring_soon
  from public.product_batches pb
  where pb.product_id = p.id
) b on true;

revoke all on public.product_inventory_overview from public;
revoke all on public.product_inventory_overview from anon;
grant select on public.product_inventory_overview to authenticated;
