-- Phase 8.4 — Inventory Adjustment & Write-off.
--
-- Audit result (see completion report): `adjust_inventory(uuid,integer,text,
-- text,uuid)` already existed (Phase 4-era) but had ZERO frontend callers —
-- grep across src/ found only type-file references, never a real
-- `.rpc('adjust_inventory')` call. It already did the two hardest things
-- right (row lock via `FOR UPDATE`, negative-stock rejection, ledger
-- insert in the same transaction) but exposed a raw SIGNED delta with no
-- reason-specific validation (an 'EXPIRED' entry could be logged against a
-- non-expired batch; a positive delta could be logged as 'DAMAGE') and had
-- no support for the brief's required stock-count workflow (user enters
-- the ACTUAL counted quantity; the delta must be computed from the
-- server-locked row, never a client-precomputed value). Since there were
-- no real callers, this migration REPLACES it in place (same name, per
-- requirement §37) rather than leaving old+new as two competing mutation
-- paths (requirement §3).
--
-- additive: extend the type CHECK with the two new reasons this phase
-- needs (LOST, STOCK_COUNT) — every existing value is kept, nothing
-- renamed (requirement §8/§121).
alter table public.inventory_transactions
  drop constraint inventory_transactions_type_check;
alter table public.inventory_transactions
  add constraint inventory_transactions_type_check
  check (type = any (array['IMPORT','SALE','ORDER_CANCEL','MANUAL_ADJUSTMENT','RETURN','DAMAGE','EXPIRED','LOST','STOCK_COUNT']));

drop function if exists public.adjust_inventory(uuid, integer, text, text, uuid);

-- Five closed operation types map 1:1 onto `inventory_transactions.type`
-- (there is no separate "reason" column in this schema — the type value
-- itself IS the machine-readable reason, requirement §33):
--   EXPIRED / DAMAGE / LOST / MANUAL_ADJUSTMENT  -> write-off (always
--     decreases stock; MANUAL_ADJUSTMENT doubles as the "Khác" bucket and
--     requires a note, requirement §19/§34)
--   STOCK_COUNT -> physical-count correction (bidirectional: the caller
--     supplies the ACTUAL counted quantity, never a delta — this function
--     computes delta = actual - locked_current_quantity server-side,
--     requirement §10/§26/§41)
--
-- SECURITY DEFINER (kept, not switched to INVOKER): audited first
-- (requirement §96) — `authenticated` has no table-level UPDATE grant on
-- `product_batches` and no UPDATE/DELETE grant on `inventory_transactions`
-- (confirmed via information_schema.role_table_grants), matching every
-- other privileged business-mutation RPC in this schema
-- (`complete_order`/`cancel_order`/`confirm_import_receipt`/`create_order`,
-- all DEFINER for the identical reason) — a SECURITY INVOKER version of
-- this function would fail with "permission denied" for every real
-- authenticated caller, not just be "less consistent."
create or replace function public.adjust_inventory(
  p_batch_id uuid,
  p_operation_type text,
  p_write_off_quantity integer default null,
  p_actual_quantity integer default null,
  p_note text default null
) returns table (
  batch_id uuid,
  previous_quantity integer,
  new_quantity integer,
  delta integer
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_batch public.product_batches%rowtype;
  v_delta integer;
  v_new_quantity integer;
  v_business_today date;
begin
  if p_operation_type not in ('EXPIRED', 'DAMAGE', 'LOST', 'MANUAL_ADJUSTMENT', 'STOCK_COUNT') then
    raise exception 'Invalid adjustment operation type';
  end if;

  -- Row lock FIRST, before any validation that reads remaining_quantity —
  -- this is what makes two concurrent adjustments on the same batch
  -- serialize safely instead of racing on a stale read (requirement §25/§26).
  select * into v_batch from public.product_batches where id = p_batch_id for update;
  if not found then
    raise exception 'Batch not found';
  end if;

  if p_operation_type = 'STOCK_COUNT' then
    if p_actual_quantity is null or p_actual_quantity < 0 then
      raise exception 'Actual quantity must be zero or greater';
    end if;
    v_delta := p_actual_quantity - v_batch.remaining_quantity;
    if v_delta = 0 then
      raise exception 'No change: actual quantity matches current quantity';
    end if;
    v_new_quantity := p_actual_quantity;
  else
    -- Write-off family: always decreases stock. `p_write_off_quantity` is
    -- how much to remove, never a signed delta the caller could misuse to
    -- increase stock under a write-off reason (requirement §21).
    if p_write_off_quantity is null or p_write_off_quantity <= 0 then
      raise exception 'Write-off quantity must be greater than 0';
    end if;
    if p_write_off_quantity > v_batch.remaining_quantity then
      raise exception 'Write-off quantity exceeds remaining stock';
    end if;

    if p_operation_type = 'EXPIRED' then
      v_business_today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
      if v_batch.expiration_date is null or v_batch.expiration_date >= v_business_today then
        raise exception 'Batch is not expired';
      end if;
    end if;

    if p_operation_type = 'MANUAL_ADJUSTMENT' and (p_note is null or btrim(p_note) = '') then
      raise exception 'Note is required for this adjustment reason';
    end if;

    v_delta := -p_write_off_quantity;
    v_new_quantity := v_batch.remaining_quantity + v_delta;
  end if;

  -- `product_batches_remaining_quantity_check` (>= 0) is a second,
  -- DB-level backstop against negative stock beyond the checks above
  -- (requirement §22).
  update public.product_batches set remaining_quantity = v_new_quantity where id = p_batch_id;

  -- Ledger insert in the SAME transaction as the quantity update — either
  -- both commit or neither does (requirement §6/§130). `reference_type` =
  -- 'adjustment' (the existing convention, requirement §35); no
  -- reference_id — a manual adjustment has no real external document to
  -- point at, never a fabricated one (requirement §35). Actor is always
  -- `auth.uid()`, never a client-supplied id (requirement §31/§85).
  insert into public.inventory_transactions
    (product_id, batch_id, type, quantity, reference_type, reference_id, note, created_by)
  values
    (v_batch.product_id, p_batch_id, p_operation_type, v_delta, 'adjustment', null, p_note, auth.uid());

  batch_id := p_batch_id;
  previous_quantity := v_batch.remaining_quantity;
  new_quantity := v_new_quantity;
  delta := v_delta;
  return next;
end;
$function$;

comment on function public.adjust_inventory(uuid, text, integer, integer, text) is
  'Phase 8.4 — the sole path for manual inventory mutation (write-off: EXPIRED/DAMAGE/LOST/MANUAL_ADJUSTMENT, always decreases; STOCK_COUNT: caller supplies the actual counted quantity, server computes the signed delta from the row-locked current quantity). Never edits import/order history or batch.purchase_price. Always writes one inventory_transactions row in the same transaction as the product_batches update.';

revoke all on function public.adjust_inventory(uuid, text, integer, integer, text) from public;
revoke all on function public.adjust_inventory(uuid, text, integer, integer, text) from anon;
grant execute on function public.adjust_inventory(uuid, text, integer, integer, text) to authenticated;
