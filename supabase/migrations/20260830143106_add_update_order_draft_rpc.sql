-- Atomic edit for a draft/confirmed order (Phase 6.4). Replaces the order's
-- customer/note/items in one transaction. Only reachable while the order is
-- still `draft` or `confirmed` — the same statuses `complete_order()` itself
-- accepts, i.e. "hasn't been posted to inventory yet". Once `completed` or
-- `cancelled`, this raises rather than silently no-op'ing, so a stale UI
-- (someone else completed/cancelled it between load and save) can't corrupt
-- a finalized order.
--
-- `order_items` has no client DELETE policy (by design, same as every other
-- financial-record table in this app), so replacing its line items requires
-- a SECURITY DEFINER function regardless of status — this is that function.
-- A draft/confirmed order is guaranteed to have zero `order_item_batches`
-- rows (only `complete_order()` ever creates them), so deleting its
-- `order_items` here can never orphan a batch allocation.
create or replace function public.update_order_draft(
  p_order_id uuid,
  p_customer_id uuid,
  p_note text,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_unit_price numeric;
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

  if p_customer_id is not null then
    perform 1 from public.customers where id = p_customer_id;
    if not found then raise exception 'Customer not found'; end if;
  end if;

  -- Validate every item's shape/invariants before touching any row.
  for v_item in select * from jsonb_array_elements(p_items) loop
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

  delete from public.order_items where order_id = p_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_line_total := v_quantity * v_unit_price;

    insert into public.order_items (order_id, product_id, quantity, unit_price, discount, line_total)
    values (p_order_id, v_product_id, v_quantity, v_unit_price, 0, v_line_total);
  end loop;

  update public.orders
  set customer_id = p_customer_id, note = nullif(trim(p_note), ''), updated_at = now()
  where id = p_order_id;
end;
$function$;

grant execute on function public.update_order_draft(uuid, uuid, text, jsonb) to authenticated;
revoke execute on function public.update_order_draft(uuid, uuid, text, jsonb) from public;
revoke execute on function public.update_order_draft(uuid, uuid, text, jsonb) from anon;
