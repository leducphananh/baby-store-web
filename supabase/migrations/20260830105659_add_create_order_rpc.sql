-- Atomic order creation for the POS "Create Order" screen (Phase 6.2).
-- Inserts the order header + items and immediately posts them to inventory
-- via the existing complete_order() (FEFO batch allocation, authoritative
-- subtotal/total recomputation) — all inside this one function invocation,
-- which Postgres runs as a single transaction. Any failure (bad item,
-- insufficient non-expired stock, ...) raises and rolls back everything
-- inserted so far: never a half-created order, never a partial inventory
-- deduction.
create or replace function public.create_order(
  p_customer_id uuid,
  p_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_unit_price numeric;
  v_line_total numeric;
  v_item_count integer := 0;
  v_product_status text;
begin
  if p_items is null or jsonb_typeof(p_items) != 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
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

    if v_product_id is null then raise exception 'Item is missing a product'; end if;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Item quantity must be greater than 0'; end if;
    if v_unit_price is null or v_unit_price < 0 then raise exception 'Item price must be greater than or equal to 0'; end if;

    select status into v_product_status from public.products where id = v_product_id;
    if not found then raise exception 'Product not found'; end if;
    if v_product_status != 'active' then raise exception 'Product is archived and cannot be sold'; end if;
  end loop;

  -- Serialize order_number generation against concurrent order creation
  -- (held for the rest of this transaction; released automatically on
  -- commit or rollback).
  perform pg_advisory_xact_lock(hashtext('orders_order_number'));

  select 'ORD-' || lpad((coalesce(max(substring(order_number from '^ORD-(\d+)$')::integer), 0) + 1)::text, 3, '0')
  into v_order_number
  from public.orders;

  insert into public.orders (order_number, customer_id, note, status, created_by)
  values (v_order_number, p_customer_id, nullif(trim(p_note), ''), 'draft', auth.uid())
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_line_total := v_quantity * v_unit_price;

    insert into public.order_items (order_id, product_id, quantity, unit_price, discount, line_total)
    values (v_order_id, v_product_id, v_quantity, v_unit_price, 0, v_line_total);
  end loop;

  -- Posts to inventory (FEFO), recomputes authoritative subtotal/total from
  -- the real line items, and marks the order 'completed'. Raises (rolling
  -- back this whole transaction, including everything inserted above) if
  -- any product lacks enough non-expired stock.
  perform public.complete_order(v_order_id);

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
end;
$function$;

grant execute on function public.create_order(uuid, text, jsonb) to authenticated;
revoke execute on function public.create_order(uuid, text, jsonb) from public;
revoke execute on function public.create_order(uuid, text, jsonb) from anon;
