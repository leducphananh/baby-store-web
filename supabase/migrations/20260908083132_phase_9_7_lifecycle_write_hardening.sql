-- Phase 9.7 — Data Integrity & Edge-case Audit
-- Make the DATABASE (not the client) the integrity boundary for the three
-- lifecycle-critical write holes proven in the audit, plus defence-in-depth
-- non-negativity CHECKs on money/quantity columns that only the frontend
-- currently guards.
--
-- All mutating RPCs (create_order, confirm_import_receipt, complete_order,
-- adjust_inventory, record_order_payment, ...) are SECURITY DEFINER owned by
-- `postgres` (rolbypassrls = true) and are therefore completely unaffected
-- by these RLS policy changes. Verified: the codebase has ZERO direct
-- client writes to product_batches / order_items / order_item_batches /
-- inventory_transactions / order_payments, and the only direct client
-- writes to orders / import_receipts are draft-status UPDATEs and a
-- draft-only INSERT (create-import-receipt.ts).
--
-- Existing-data check (run before this migration): 0 rows violate any of
-- the CHECKs below; 0 forged completed orders / confirmed receipts exist.

-- 1. HOLE 1 (critical): an authenticated client could INSERT arbitrary
--    product_batches rows, minting sellable stock out of nothing with no
--    import receipt and no inventory_transactions ledger row. The only
--    legitimate producer of batches is confirm_import_receipt() (RLS-exempt).
drop policy if exists "product_batches_ins" on public.product_batches;

-- 2. HOLE 2 (critical): an authenticated client could INSERT an orders row
--    with status = 'completed' + completed_at, inflating every revenue /
--    profit report (SUM(orders.total) over completed orders) while
--    contributing zero COGS. The orders_upd policy already blocks
--    draft/confirmed -> completed; this closes the INSERT path. create_order()
--    (RLS-exempt) still creates + completes orders normally.
drop policy if exists "orders_ins" on public.orders;
create policy "orders_ins" on public.orders
  for insert to authenticated
  with check (status = 'draft');

-- 3. HOLE 3: an authenticated client could INSERT an import_receipts row
--    with status = 'confirmed', bypassing the draft-first lifecycle the
--    import_receipts_upd policy enforces. No inventory impact on its own
--    (batches are the integrity-bearing rows) but it violates the state
--    machine. create-import-receipt.ts always inserts status = 'draft'.
drop policy if exists "import_receipts_ins" on public.import_receipts;
create policy "import_receipts_ins" on public.import_receipts
  for insert to authenticated
  with check (status = 'draft');

-- 4. Defence-in-depth non-negativity CHECKs. The frontend (Zod) already
--    rejects these, and the write RPCs validate the ones they touch, but
--    the columns themselves had no DB-level floor (unlike the newer
--    products.tiktok_price / shopee_price, order_items.*). These make a
--    negative value impossible regardless of entry path.
alter table public.products
  add constraint products_selling_price_nonneg check (selling_price >= 0),
  add constraint products_default_purchase_price_nonneg check (default_purchase_price >= 0),
  add constraint products_minimum_stock_nonneg check (minimum_stock >= 0);

alter table public.import_receipt_items
  add constraint import_receipt_items_purchase_price_nonneg check (purchase_price >= 0);

alter table public.product_batches
  add constraint product_batches_purchase_price_nonneg check (purchase_price >= 0);

-- Historical COGS snapshot: must always be a real, non-negative cost basis.
alter table public.order_item_batches
  add constraint order_item_batches_unit_cost_nonneg check (unit_cost >= 0);

-- Completed-order money: complete_order() recomputes these from order_items
-- (each CHECK-guarded >= 0), so a completed order can never carry a negative
-- figure via the RPC; this also blocks a direct draft/confirmed insert or
-- cancelled-order row from ever holding a negative total.
alter table public.orders
  add constraint orders_subtotal_nonneg check (subtotal >= 0),
  add constraint orders_discount_nonneg check (discount >= 0),
  add constraint orders_total_nonneg check (total >= 0);
