-- Phase 4.7: Import Receipt Confirmation & Inventory Posting
--
-- `confirm_import_receipt(p_receipt_id)` already existed (added in an
-- earlier phase, never wired up to any frontend action until now). This
-- migration:
--   1. Adds `confirmed_by` for symmetry with `created_by`/`confirmed_at` —
--      real audit-trail value ("who posted this stock"), set from
--      `auth.uid()` inside the function itself, never a client-supplied id.
--   2. Hardens the function with explicit server-side validation beyond the
--      existing draft-status guard: a receipt must have at least one item,
--      and every item must reference a real product, a positive quantity,
--      and a non-negative purchase price — using the same
--      `RAISE EXCEPTION 'text'` convention already used by
--      add_import_receipt_item/update_import_receipt_item/
--      delete_import_receipt_item (matched by substring in
--      get-import-receipt-line-error-message.ts), so the frontend maps
--      these to friendly Vietnamese messages the same way.
--   3. Keeps the existing `SELECT ... FOR UPDATE` row lock + conditional
--      status check (idempotency/concurrency protection), and the existing
--      `product_batches.import_item_id` UNIQUE constraint remains a second,
--      independent guard against ever double-posting the same line.
--   4. Re-asserts EXECUTE grants explicitly (authenticated only, not
--      anon/public) — CREATE OR REPLACE preserves them, but this makes the
--      intent explicit and self-documenting, consistent with this
--      project's existing revoke_*_execute_on_mutating_rpcs migrations.

alter table public.import_receipts
  add column if not exists confirmed_by uuid references public.profiles(id);

create or replace function public.confirm_import_receipt(p_receipt_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_receipt public.import_receipts%rowtype;
  v_item public.import_receipt_items%rowtype;
  v_batch_id uuid;
  v_item_count integer;
begin
  select * into v_receipt from public.import_receipts where id = p_receipt_id for update;
  if not found then
    raise exception 'Receipt not found';
  end if;

  if v_receipt.status = 'confirmed' then
    raise exception 'Receipt already confirmed';
  end if;
  if v_receipt.status = 'cancelled' then
    raise exception 'Receipt is cancelled and cannot be confirmed';
  end if;
  if v_receipt.status != 'draft' then
    raise exception 'Receipt must be in draft status to confirm';
  end if;

  select count(*) into v_item_count
  from public.import_receipt_items
  where import_receipt_id = p_receipt_id;

  if v_item_count = 0 then
    raise exception 'Receipt has no items to confirm';
  end if;

  for v_item in
    select * from public.import_receipt_items where import_receipt_id = p_receipt_id
  loop
    if v_item.product_id is null then
      raise exception 'Item is missing a product';
    end if;
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Item quantity must be greater than 0';
    end if;
    if v_item.purchase_price is null or v_item.purchase_price < 0 then
      raise exception 'Item purchase price must be greater than or equal to 0';
    end if;

    insert into public.product_batches (
      product_id, import_item_id, lot_number, manufacture_date, expiration_date,
      purchase_price, initial_quantity, remaining_quantity
    ) values (
      v_item.product_id, v_item.id, v_item.lot_number, v_item.manufacture_date, v_item.expiration_date,
      v_item.purchase_price, v_item.quantity, v_item.quantity
    ) returning id into v_batch_id;

    insert into public.inventory_transactions (
      product_id, batch_id, type, quantity, reference_type, reference_id, created_by
    ) values (
      v_item.product_id, v_batch_id, 'IMPORT', v_item.quantity, 'import', p_receipt_id, auth.uid()
    );
  end loop;

  update public.import_receipts
  set status = 'confirmed',
      confirmed_at = now(),
      confirmed_by = auth.uid(),
      updated_at = now()
  where id = p_receipt_id;
end;
$function$;

grant execute on function public.confirm_import_receipt(uuid) to authenticated;
revoke execute on function public.confirm_import_receipt(uuid) from public;
revoke execute on function public.confirm_import_receipt(uuid) from anon;
