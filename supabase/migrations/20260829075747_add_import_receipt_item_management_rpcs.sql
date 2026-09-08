-- Phase 4.2: import receipt line-item management.
--
-- import_receipts.total_cost has no maintaining trigger and confirm_import_receipt()
-- never sets it — it must be recomputed server-side whenever items change so the
-- stored total is never derived from client-side arithmetic. These functions follow
-- the same house pattern as confirm_import_receipt/cancel_order/complete_order:
-- SECURITY DEFINER, lock the parent receipt row, reject anything but a draft
-- receipt, validate inputs, mutate, then recompute the total — all in one
-- transaction so there is no window where total_cost can drift from the actual
-- line rows.

CREATE OR REPLACE FUNCTION public.recalc_import_receipt_total(p_receipt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.import_receipts
  SET total_cost = COALESCE(
        (SELECT SUM(quantity * purchase_price)
         FROM public.import_receipt_items
         WHERE import_receipt_id = p_receipt_id),
        0
      ),
      updated_at = now()
  WHERE id = p_receipt_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_import_receipt_item(
  p_receipt_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_purchase_price numeric,
  p_lot_number text DEFAULT NULL,
  p_manufacture_date date DEFAULT NULL,
  p_expiration_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_receipt public.import_receipts%ROWTYPE;
  v_item_id uuid;
BEGIN
  SELECT * INTO v_receipt FROM public.import_receipts WHERE id = p_receipt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;
  IF v_receipt.status != 'draft' THEN RAISE EXCEPTION 'Receipt must be in draft status to add items'; END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than 0'; END IF;
  IF p_purchase_price IS NULL OR p_purchase_price < 0 THEN RAISE EXCEPTION 'Purchase price must be greater than or equal to 0'; END IF;
  IF p_expiration_date IS NOT NULL AND p_manufacture_date IS NOT NULL AND p_expiration_date < p_manufacture_date THEN
    RAISE EXCEPTION 'Expiration date must be on or after manufacture date';
  END IF;

  INSERT INTO public.import_receipt_items (
    import_receipt_id, product_id, quantity, purchase_price, lot_number, manufacture_date, expiration_date
  ) VALUES (
    p_receipt_id, p_product_id, p_quantity, p_purchase_price, p_lot_number, p_manufacture_date, p_expiration_date
  ) RETURNING id INTO v_item_id;

  PERFORM public.recalc_import_receipt_total(p_receipt_id);

  RETURN v_item_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_import_receipt_item(
  p_item_id uuid,
  p_quantity integer,
  p_purchase_price numeric,
  p_lot_number text DEFAULT NULL,
  p_manufacture_date date DEFAULT NULL,
  p_expiration_date date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item public.import_receipt_items%ROWTYPE;
  v_receipt public.import_receipts%ROWTYPE;
BEGIN
  SELECT * INTO v_item FROM public.import_receipt_items WHERE id = p_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;

  SELECT * INTO v_receipt FROM public.import_receipts WHERE id = v_item.import_receipt_id FOR UPDATE;
  IF v_receipt.status != 'draft' THEN RAISE EXCEPTION 'Receipt must be in draft status to edit items'; END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than 0'; END IF;
  IF p_purchase_price IS NULL OR p_purchase_price < 0 THEN RAISE EXCEPTION 'Purchase price must be greater than or equal to 0'; END IF;
  IF p_expiration_date IS NOT NULL AND p_manufacture_date IS NOT NULL AND p_expiration_date < p_manufacture_date THEN
    RAISE EXCEPTION 'Expiration date must be on or after manufacture date';
  END IF;

  UPDATE public.import_receipt_items
  SET quantity = p_quantity,
      purchase_price = p_purchase_price,
      lot_number = p_lot_number,
      manufacture_date = p_manufacture_date,
      expiration_date = p_expiration_date
  WHERE id = p_item_id;

  PERFORM public.recalc_import_receipt_total(v_receipt.id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_import_receipt_item(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item public.import_receipt_items%ROWTYPE;
  v_receipt public.import_receipts%ROWTYPE;
BEGIN
  SELECT * INTO v_item FROM public.import_receipt_items WHERE id = p_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;

  SELECT * INTO v_receipt FROM public.import_receipts WHERE id = v_item.import_receipt_id FOR UPDATE;
  IF v_receipt.status != 'draft' THEN RAISE EXCEPTION 'Receipt must be in draft status to remove items'; END IF;

  DELETE FROM public.import_receipt_items WHERE id = p_item_id;

  PERFORM public.recalc_import_receipt_total(v_receipt.id);
END;
$function$;

-- Match the project's existing convention for mutating RPCs (see the
-- revoke_anon_execute_on_mutating_rpcs / revoke_public_execute_on_mutating_rpcs
-- migrations): only `authenticated` may call these, never `anon`/`public`.
REVOKE EXECUTE ON FUNCTION public.recalc_import_receipt_total(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_import_receipt_item(uuid, uuid, integer, numeric, text, date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_import_receipt_item(uuid, integer, numeric, text, date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_import_receipt_item(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.recalc_import_receipt_total(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_import_receipt_item(uuid, uuid, integer, numeric, text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_import_receipt_item(uuid, integer, numeric, text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_import_receipt_item(uuid) TO authenticated;
