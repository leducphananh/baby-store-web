-- Phase 7.7 audit finding (requirement §1/§53): `product_inventory_overview`
-- (Phase 4.6) classifies `expiry_status` (has_expired/has_expiring_soon)
-- using bare `CURRENT_DATE`, which resolves in the Postgres session's
-- timezone — UTC on Supabase. Same class of bug already found and fixed in
-- `complete_order()` during Phase 7.6 (see `fix_complete_order_expiry_timezone`):
-- from 00:00 to 06:59 Vietnam time, UTC's calendar date is still
-- "yesterday" relative to Vietnam's, so a batch that expired by the
-- store's own local calendar could still show as "not expired" for up to
-- ~7 hours a day.
--
-- Scope of this fix, confirmed by inspection before changing anything:
-- - `stock_quantity`, `batch_count`, `nearest_expiration`, `stock_status`
--   (used by Phase 7.5's `get_inventory_*` RPCs and Phase 4.6's own
--   dashboard) do NOT use `CURRENT_DATE` at all — untouched, unaffected.
-- - Phase 7.5 (Inventory Report) never reads this view's `expiry_status` —
--   it only reuses `stock_quantity`/`stock_status`/`batch_count`/
--   `nearest_expiration`. Unaffected by this bug and unaffected by this fix.
-- - Phase 7.6 (Expiry & Slow-moving Report) has its own independent,
--   already-Vietnam-correct expiry classification RPCs — never reads this
--   view at all. Unaffected either way.
-- - Only Phase 4.6's own Inventory Dashboard (`/inventory` — its alert
--   cards' "Sắp hết hạn"/"Đã hết hạn" counts and its expiry-status filter)
--   reads `expiry_status` from this view. That is the one thing this fix
--   changes, and only during the narrow midnight window.
--
-- This fix only tightens the classification window (a batch it newly
-- marks "expired" was already expired by the store's own local calendar;
-- it can never newly mark something safe that was previously flagged), so
-- it changes nothing about quantities/values/stock-status and cannot
-- regress Phase 7.5 or the rest of Phase 4.6's dashboard.
create or replace view public.product_inventory_overview
with (security_invoker = true)
as
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
  coalesce(b.total_remaining, 0::bigint)::integer as stock_quantity,
  coalesce(b.batch_count, 0::bigint)::integer as batch_count,
  b.nearest_expiration,
  case
    when coalesce(b.total_remaining, 0::bigint) <= 0 then 'out_of_stock'::text
    when coalesce(b.total_remaining, 0::bigint) <= p.minimum_stock then 'low_stock'::text
    else 'normal'::text
  end as stock_status,
  case
    when coalesce(b.has_expired, false) then 'expired'::text
    when coalesce(b.has_expiring_soon, false) then 'expiring_soon'::text
    else 'none'::text
  end as expiry_status
from products p
left join categories c on c.id = p.category_id
left join lateral (
  select
    sum(pb.remaining_quantity) as total_remaining,
    count(*) filter (where pb.remaining_quantity > 0) as batch_count,
    min(pb.expiration_date) filter (where pb.remaining_quantity > 0) as nearest_expiration,
    -- Vietnam business-local calendar date, not the Postgres session's
    -- (UTC) `CURRENT_DATE` — see migration comment above.
    bool_or(
      pb.remaining_quantity > 0
      and pb.expiration_date is not null
      and pb.expiration_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date
    ) as has_expired,
    bool_or(
      pb.remaining_quantity > 0
      and pb.expiration_date is not null
      and pb.expiration_date >= (now() at time zone 'Asia/Ho_Chi_Minh')::date
      and pb.expiration_date <= (now() at time zone 'Asia/Ho_Chi_Minh')::date + 30
    ) as has_expiring_soon
  from product_batches pb
  where pb.product_id = p.id
) b on true;
