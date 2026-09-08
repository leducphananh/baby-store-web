-- Phase 9.7 — deterministic lock ordering (audit §43 / §140.4).
--
-- complete_order() and cancel_order() lock product_batches / order_item_batches
-- rows inside per-item loops whose driving SELECTs had no ORDER BY. Two
-- concurrent transactions touching the same set of products in a different
-- order could acquire row locks in opposite order (A: P1 then P2; B: P2 then
-- P1) and deadlock. Postgres detects and aborts one — no partial state, since
-- each RPC is a single transaction — but it surfaces as a spurious failure.
--
-- Fix: order every lock-acquiring loop by a stable key (product_id, then
-- batch id). This is NOT a locking rewrite — it only makes the existing
-- acquisition order deterministic so concurrent callers queue instead of
-- cycling. Allocation results, COGS, totals and ledger contents are
-- byte-for-byte identical (FEFO order *within* a product is preserved; the
-- outer total is an order-independent sum). The batch-loop tiebreak also
-- gains a final `id` so two batches with equal expiration_date AND equal
-- created_at (possible for lots from one confirm_import_receipt() call)
-- allocate in a fixed order (§28).

CREATE OR REPLACE FUNCTION public.complete_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id ORDER BY product_id LOOP
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
      ORDER BY expiration_date ASC NULLS LAST, created_at ASC, id ASC
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

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item_batch public.order_item_batches%ROWTYPE;
  v_item public.order_items%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status != 'completed' THEN RAISE EXCEPTION 'Only completed orders can be cancelled'; END IF;

  FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id ORDER BY product_id LOOP
    FOR v_item_batch IN SELECT * FROM public.order_item_batches WHERE order_item_id = v_item.id ORDER BY batch_id LOOP
      PERFORM 1 FROM public.product_batches WHERE id = v_item_batch.batch_id FOR UPDATE;

      UPDATE public.product_batches SET remaining_quantity = remaining_quantity + v_item_batch.quantity WHERE id = v_item_batch.batch_id;

      INSERT INTO public.inventory_transactions (product_id, batch_id, type, quantity, reference_type, reference_id, created_by) 
      VALUES (v_item.product_id, v_item_batch.batch_id, 'ORDER_CANCEL', v_item_batch.quantity, 'order', p_order_id, auth.uid());
    END LOOP;
  END LOOP;

  UPDATE public.orders SET status = 'cancelled', cancelled_at = now(), updated_at = now() WHERE id = p_order_id;
END;
$function$;
