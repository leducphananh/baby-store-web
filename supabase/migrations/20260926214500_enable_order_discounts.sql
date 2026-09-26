-- Thêm hỗ trợ Giảm giá (discount) cho create_order, update_order_draft và complete_order

-- 1. DROP các hàm cũ để thay đổi tham số (tránh lỗi overloaded)
DROP FUNCTION IF EXISTS public.create_order(uuid, text, jsonb, boolean);
DROP FUNCTION IF EXISTS public.update_order_draft(uuid, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.complete_order(uuid);

-- 2. CREATE lại create_order với tham số p_discount
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_id uuid,
  p_note text,
  p_items jsonb,
  p_is_draft boolean DEFAULT false,
  p_discount numeric DEFAULT 0
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_discount numeric;
  v_line_total numeric;
  v_item_count integer := 0;
  v_product_status text;
begin
  if p_items is null or jsonb_typeof(p_items) != 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if coalesce(p_discount, 0) < 0 then
    raise exception 'Order discount cannot be negative';
  end if;

  if p_customer_id is not null then
    perform 1 from public.customers where id = p_customer_id;
    if not found then raise exception 'Customer not found'; end if;
  end if;

  -- Validate every item's shape/invariants before creating anything.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_item_count := v_item_count + 1;

    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_discount := coalesce((v_item->>'discount')::numeric, 0);

    if v_product_id is null then raise exception 'Item is missing a product'; end if;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Item quantity must be greater than 0'; end if;
    if v_unit_price is null or v_unit_price < 0 then raise exception 'Item price must be greater than or equal to 0'; end if;
    if v_discount < 0 then raise exception 'Item discount must be greater than or equal to 0'; end if;

    select status into v_product_status from public.products where id = v_product_id;
    if not found then raise exception 'Product not found'; end if;
    if v_product_status != 'active' then raise exception 'Product is archived and cannot be sold'; end if;
  end loop;

  -- Serialize order_number generation against concurrent order creation
  perform pg_advisory_xact_lock(hashtext('orders_order_number'));

  select 'ORD-' || lpad((coalesce(max(substring(order_number from '^ORD-(\d+)$')::integer), 0) + 1)::text, 3, '0')
  into v_order_number
  from public.orders;

  insert into public.orders (order_number, customer_id, note, status, created_by, discount)
  values (v_order_number, p_customer_id, nullif(trim(p_note), ''), 'draft', auth.uid(), coalesce(p_discount, 0))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_discount := coalesce((v_item->>'discount')::numeric, 0);
    v_line_total := (v_quantity * v_unit_price) - v_discount;

    if v_line_total < 0 then
      v_line_total := 0; -- Or raise an exception, but clamping is safer for discounts
    end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price, discount, line_total)
    values (v_order_id, v_product_id, v_quantity, v_unit_price, v_discount, v_line_total);
  end loop;

  -- Nếu không phải là đơn nháp, thì mới post vào inventory (FEFO) và đổi sang completed
  if not coalesce(p_is_draft, false) then
    perform public.complete_order(v_order_id);
  end if;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
end;
$function$;

-- 3. CREATE lại update_order_draft với tham số p_discount
CREATE OR REPLACE FUNCTION public.update_order_draft(
  p_order_id uuid,
  p_customer_id uuid,
  p_note text,
  p_items jsonb,
  p_discount numeric DEFAULT 0
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_discount numeric;
  v_line_total numeric;
  v_product_status text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status not in ('draft', 'confirmed') then
    raise exception 'Order is no longer editable';
  end if;

  if p_items is null or jsonb_typeof(p_items) != 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if coalesce(p_discount, 0) < 0 then
    raise exception 'Order discount cannot be negative';
  end if;

  if p_customer_id is not null then
    perform 1 from public.customers where id = p_customer_id;
    if not found then raise exception 'Customer not found'; end if;
  end if;

  -- Validate every item's shape/invariants before touching any row.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_discount := coalesce((v_item->>'discount')::numeric, 0);

    if v_product_id is null then raise exception 'Item is missing a product'; end if;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Item quantity must be greater than 0'; end if;
    if v_unit_price is null or v_unit_price < 0 then raise exception 'Item price must be greater than or equal to 0'; end if;
    if v_discount < 0 then raise exception 'Item discount must be greater than or equal to 0'; end if;

    select status into v_product_status from public.products where id = v_product_id;
    if not found then raise exception 'Product not found'; end if;
    if v_product_status != 'active' then raise exception 'Product is archived and cannot be sold'; end if;
  end loop;

  delete from public.order_items where order_id = p_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_discount := coalesce((v_item->>'discount')::numeric, 0);
    v_line_total := (v_quantity * v_unit_price) - v_discount;

    if v_line_total < 0 then
      v_line_total := 0;
    end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price, discount, line_total)
    values (p_order_id, v_product_id, v_quantity, v_unit_price, v_discount, v_line_total);
  end loop;

  update public.orders
  set customer_id = p_customer_id, note = nullif(trim(p_note), ''), discount = coalesce(p_discount, 0), updated_at = now()
  where id = p_order_id;
end;
$function$;


-- 4. CREATE lại complete_order để tính toán subtotal và total bao gồm discount
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

  -- Apply order-level discount
  v_calc_total := v_calc_total - coalesce(v_order.discount, 0);
  IF v_calc_total < 0 THEN
    v_calc_total := 0;
  END IF;

  UPDATE public.orders
  SET subtotal = v_calc_subtotal, total = v_calc_total, status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_order_id;
END;
$function$;

-- 5. Cấp lại quyền
GRANT EXECUTE ON FUNCTION public.create_order(uuid, text, jsonb, boolean, numeric) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_order(uuid, text, jsonb, boolean, numeric) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.update_order_draft(uuid, uuid, text, jsonb, numeric) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_order_draft(uuid, uuid, text, jsonb, numeric) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.complete_order(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_order(uuid) FROM public, anon;
