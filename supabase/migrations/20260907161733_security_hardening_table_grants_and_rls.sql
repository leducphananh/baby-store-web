-- Phase 9.1 — Security Hardening & Permission Audit.
--
-- FINDING 1 (defense-in-depth, not currently exploitable): every base
-- table and two of the three report views still carried Supabase's
-- default schema-level GRANT ALL to `anon` — never explicitly revoked,
-- unlike every RPC in this schema (which has always had `revoke ... from
-- anon` applied consistently since Phase 7.2). RLS is enabled on every
-- table with policies scoped `TO authenticated` only, so `anon` is
-- currently blocked in practice (RLS default-denies with no matching
-- policy) — but the stale grant is a real latent risk: if RLS were ever
-- accidentally disabled on a table, or a policy accidentally added for
-- `public`/`anon`, the grant would immediately re-enable full anonymous
-- read/write. Revoking it now makes "anon has nothing" true at both
-- layers (grants AND RLS), matching every RPC's own convention.
revoke all on table
  public.categories,
  public.customers,
  public.import_receipt_items,
  public.import_receipts,
  public.inventory_transactions,
  public.order_item_batches,
  public.order_items,
  public.order_payments,
  public.orders,
  public.product_batches,
  public.product_images,
  public.products,
  public.profiles,
  public.purchase_invoice_files,
  public.purchase_invoices,
  public.suppliers,
  public.customer_order_summary,
  public.reportable_orders,
  public.product_inventory_overview,
  public.alert_read_states,
  public.alert_condition_states
from anon;

-- FINDING 2 (real, exploitable): several RLS UPDATE/INSERT policies were
-- broader than any actual frontend write path needs, meaning a direct
-- authenticated REST/SQL call — not the app UI — could bypass a
-- transactional RPC entirely. Audited every direct `.from(...).insert/
-- update/delete(...)` call in the frontend first (never assumed); each
-- fix below narrows a policy to EXACTLY what that audit found, without
-- touching any RPC (all of which are SECURITY DEFINER, owned by
-- `postgres`, and — since none of these tables has `FORCE ROW LEVEL
-- SECURITY` — already bypass RLS entirely as the table owner; none of
-- these changes can break them).

-- orders: the only direct-client write is `cancelDraftOrder()` (draft/
-- confirmed -> cancelled, a single guarded UPDATE with no side effects to
-- reverse). Before this fix, `orders_upd` was `USING (true) WITH CHECK
-- (true)` — a signed-in user could directly `UPDATE orders SET
-- status = 'completed'` on any draft order, completely bypassing
-- complete_order()'s FEFO allocation, inventory deduction, and ledger
-- recording (requirement §47, confirmed exploitable). Now: only rows
-- currently draft/confirmed are touchable, and the result must be
-- 'cancelled' — direct-to-completed is impossible.
drop policy if exists orders_upd on public.orders;
create policy orders_upd on public.orders
  for update to authenticated
  using (status in ('draft', 'confirmed'))
  with check (status = 'cancelled');

-- import_receipts: two direct-client writes exist — `updateImportReceipt()`
-- (draft -> draft, header fields only) and `cancelImportReceipt()` (draft
-- -> cancelled). Before this fix, `import_receipts_upd` was `USING (true)
-- WITH CHECK (true)` — a signed-in user could directly `UPDATE
-- import_receipts SET status = 'confirmed'` on a draft, marking it
-- confirmed WITHOUT ever creating the corresponding product_batches/
-- inventory_transactions rows that confirm_import_receipt() creates
-- (requirement §48, confirmed exploitable — an import that claims to be
-- posted but never touched stock). Now: only draft receipts are
-- touchable, and the result must stay draft or become cancelled —
-- direct-to-confirmed is impossible.
drop policy if exists import_receipts_upd on public.import_receipts;
create policy import_receipts_upd on public.import_receipts
  for update to authenticated
  using (status = 'draft')
  with check (status in ('draft', 'cancelled'));

-- order_items: audited every frontend call site — NONE ever updates this
-- table directly (`update_order_draft()` replaces a draft's lines via
-- DELETE+INSERT inside its own SECURITY DEFINER transaction, which
-- bypasses RLS as owner). The pre-existing `order_items_upd` (`USING
-- (true) WITH CHECK (true)`) therefore had zero legitimate use and let a
-- signed-in user directly rewrite a COMPLETED order's historical sale
-- price/quantity — a direct violation of "order line items snapshot
-- historical price, never rewritten" (`domain-driven-frontend` rule 12).
-- Dropped entirely; SELECT/INSERT (used by `create_order()`/
-- `update_order_draft()`, also DEFINER) are untouched.
drop policy if exists order_items_upd on public.order_items;

-- order_item_batches: audited — SELECT is genuinely used directly
-- (`get-order-lines.ts`, to show which batch/cost fulfilled a line), but
-- INSERT is not: only `complete_order()`/`cancel_order()` (both DEFINER)
-- ever write this table. The pre-existing `order_item_batches_ins`
-- (`WITH CHECK (true)`) let a signed-in user fabricate a fake historical
-- COGS allocation row directly, corrupting profit/product-performance
-- reports (requirement §51, confirmed exploitable). Dropped.
drop policy if exists order_item_batches_ins on public.order_item_batches;

-- import_receipt_items: audited — every mutation goes through
-- add/update/delete_import_receipt_item() (all DEFINER); the frontend
-- never inserts/updates this table directly. The pre-existing
-- `import_receipt_items_ins`/`_upd` (`WITH CHECK (true)`) let a signed-in
-- user insert or edit line items on an already-CONFIRMED receipt directly
-- — bypassing that RPC's own "must be draft" guard and corrupting the
-- historical purchase-cost record batches were already created from.
-- Both dropped; SELECT is untouched.
drop policy if exists import_receipt_items_ins on public.import_receipt_items;
drop policy if exists import_receipt_items_upd on public.import_receipt_items;

-- order_payments: audited — the frontend only ever SELECTs this table;
-- creation goes through record_order_payment() (DEFINER), which is also
-- the only place `orders.payment_status` gets recomputed consistently.
-- The pre-existing `order_payments_all` (ALL commands, `USING (true)
-- WITH CHECK (true)`) let a signed-in user insert an arbitrary payment
-- amount for any order (bypassing the recompute), or directly UPDATE/
-- DELETE a historical payment record — both direct violations of
-- "a recorded payment is a historical financial event, never silently
-- overwritten" (`domain-driven-frontend` rule 16, requirement §46).
-- Replaced with SELECT-only.
drop policy if exists order_payments_all on public.order_payments;
create policy order_payments_select on public.order_payments
  for select to authenticated
  using (true);

-- product_batches: `authenticated` already lacked the table-level UPDATE
-- GRANT (confirmed during Phase 8.4's audit), so the pre-existing
-- `product_batches_upd` policy (`USING (true) WITH CHECK (true)`) could
-- never actually fire — but a permissive-and-currently-inert policy is a
-- latent trap: if a future migration ever re-added the UPDATE grant
-- (e.g. an unrelated "grant all to authenticated" cleanup), this policy
-- would silently reopen direct `remaining_quantity` writes with no
-- further review (requirement §49/§75/§77). Dropped now, while it's
-- provably safe to do so, rather than left for someone to rediscover.
drop policy if exists product_batches_upd on public.product_batches;

-- profiles: audited — the frontend only ever reads its OWN row
-- (`getProfile(userId)`) and separately reads OTHER users' `full_name`
-- for display (e.g. "who confirmed this import" / "who made this
-- adjustment" — see `inventory-transactions` list, `orders.created_by`,
-- etc., all resolved via a `profiles!*_fkey(full_name)` join). It never
-- inserts, updates, or deletes a profile row — there is no signup flow
-- and no `auth.users` trigger that creates one either (both confirmed
-- absent); profile rows are provisioned out-of-band by the developer.
--
-- The pre-existing `profiles_all` (`USING (true) WITH CHECK (true)`,
-- flagged as a known gap in the Phase 2 completion report) meant ANY
-- signed-in user could UPDATE ANY OTHER user's profile row directly,
-- including their `role` column (requirement §20/§22/§85 — the
-- self/cross-user escalation this phase asks to test for). Replaced
-- with: SELECT open to every authenticated user (preserves the
-- legitimate cross-user name lookups above — profile id/name/role is
-- internal staff-directory data, not sensitive, in this single-store
-- admin app), and UPDATE restricted to a user's own row only. No INSERT/
-- DELETE policy for `authenticated` at all — nothing legitimate needs it.
--
-- Role-escalation note (reported honestly, not silently "solved"):
-- restricting UPDATE to `id = auth.uid()` stops one user editing ANOTHER
-- user's profile, but a user can still set their OWN `role` column via
-- this same policy (RLS is row-level, not column-level). `role` has zero
-- functional/authorization consequence anywhere in this app today (audited:
-- no RPC, no other RLS policy, no route guard reads it) — it is a display
-- label only. A column-level lock (e.g. a BEFORE UPDATE trigger rejecting
-- any `role` change) was deliberately NOT added: it would also block the
-- one legitimate way `role` is ever actually set today — a developer
-- correcting/assigning it directly via the Supabase dashboard, since
-- triggers fire regardless of connecting role, unlike RLS. If `role` ever
-- gains real authorization meaning, add server-side enforcement then
-- (e.g. a dedicated SECURITY DEFINER admin RPC for role changes, never a
-- raw table UPDATE) rather than a blanket trigger now.
drop policy if exists profiles_all on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
