-- Phase 7.6 audit finding (requirement §16/§17): complete_order()'s FEFO
-- batch-eligibility filter excluded expired batches using bare
-- `CURRENT_DATE`, which resolves in the Postgres session's timezone — UTC
-- on Supabase (the same class of bug this project has repeatedly guarded
-- against in every Phase 7.x reporting RPC via explicit `+07:00` offsets).
--
-- Concrete failure window: Vietnam is UTC+7 with no DST, so from 00:00 to
-- 06:59 Vietnam time, UTC's calendar date is still "yesterday" relative to
-- Vietnam's. During that ~7-hour window each day, a batch whose
-- `expiration_date` equals Vietnam-yesterday (i.e., already expired by the
-- store's own local calendar) still satisfied `expiration_date >=
-- CURRENT_DATE`, because Postgres's UTC `CURRENT_DATE` had not yet rolled
-- over to match. `product_inventory_overview`'s own `has_expired`/
-- `stock_status` (Phase 4.6) has the identical `CURRENT_DATE` construction
-- and shares this narrow-window imprecision — intentionally NOT changed
-- here (display-only classification feeding an already-shipped dashboard,
-- out of this phase's scope); Phase 7.6's own Expiry Report RPCs compute
-- their classification independently using the same Vietnam-correct
-- expression as this fix, so the two may occasionally disagree by up to
-- one calendar day during that window — documented, not silently
-- contradictory.
--
-- This fix only tightens the eligibility check (a batch it newly excludes
-- was already expired by the store's own local calendar; it can never
-- newly *allow* a batch that was previously blocked), so it changes
-- nothing about already-completed historical orders and cannot regress
-- any currently-passing scenario — a strictly safer application of the
-- store's own pre-existing "never sell expired stock" rule, not new policy.
create or replace function public.complete_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item public.order_items%ROWTYPE;
  v_batch public.product_batches%ROWTYPE;
  v_qty_needed INTEGER;
  v_qty_allocated INTEGER;
  v_calc_subtotal NUMERIC(15,0) := 0;
  v_calc_total NUMERIC(15,0) := 0;
  v_item_count INTEGER := 0;
  v_business_today DATE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.status NOT IN ('draft', 'confirmed') THEN RAISE EXCEPTION 'Order must be draft or confirmed to complete'; END IF;

  -- Vietnam business-local calendar date, not the Postgres session's (UTC)
  -- `CURRENT_DATE` — see migration comment.
  v_business_today := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

  FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
    v_item_count := v_item_count + 1;
    IF v_item.quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be > 0'; END IF;
    IF v_item.unit_price < 0 THEN RAISE EXCEPTION 'Unit price must be >= 0'; END IF;
    IF v_item.discount < 0 THEN RAISE EXCEPTION 'Discount must be >= 0'; END IF;
    IF v_item.line_total < 0 THEN RAISE EXCEPTION 'Line total must be >= 0'; END IF;

    v_calc_subtotal := v_calc_subtotal + (v_item.quantity * v_item.unit_price);
    v_calc_total := v_calc_total + v_item.line_total;

    v_qty_needed := v_item.quantity;

    FOR v_batch IN
      SELECT * FROM public.product_batches
      WHERE product_id = v_item.product_id
      AND remaining_quantity > 0
      AND (expiration_date IS NULL OR expiration_date >= v_business_today)
      ORDER BY expiration_date ASC NULLS LAST, created_at ASC
      FOR UPDATE
    LOOP
      IF v_qty_needed <= 0 THEN EXIT; END IF;

      IF v_batch.remaining_quantity >= v_qty_needed THEN v_qty_allocated := v_qty_needed;
      ELSE v_qty_allocated := v_batch.remaining_quantity;
      END IF;

      UPDATE public.product_batches SET remaining_quantity = remaining_quantity - v_qty_allocated WHERE id = v_batch.id;

      INSERT INTO public.order_item_batches (order_item_id, batch_id, quantity, unit_cost)
      VALUES (v_item.id, v_batch.id, v_qty_allocated, v_batch.purchase_price);

      INSERT INTO public.inventory_transactions (product_id, batch_id, type, quantity, reference_type, reference_id, created_by)
      VALUES (v_item.product_id, v_batch.id, 'SALE', -v_qty_allocated, 'order', p_order_id, auth.uid());

      v_qty_needed := v_qty_needed - v_qty_allocated;
    END LOOP;

    IF v_qty_needed > 0 THEN RAISE EXCEPTION 'Insufficient non-expired stock for product %', v_item.product_id; END IF;
  END LOOP;

  IF v_item_count = 0 THEN RAISE EXCEPTION 'Order must contain at least one item'; END IF;

  UPDATE public.orders
  SET subtotal = v_calc_subtotal, total = v_calc_total, status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_order_id;
END;
$function$;
