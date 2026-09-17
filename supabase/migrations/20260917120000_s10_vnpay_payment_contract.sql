-- Storefront Phase S10 — Online Payment (VNPay Sandbox)
-- 
-- 1. Alters orders.payment_method to accept 'vnpay'
-- 2. Creates record_storefront_online_payment() for IPN webhooks

-- Drop and recreate the constraint to include 'vnpay'
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method is null or payment_method in ('cod', 'bank_transfer', 'vnpay'));

-- Update create_storefront_order to allow 'vnpay'
-- We just need to replace the function with the new check.
create or replace function public.create_storefront_order(
  p_customer_name text default null,
  p_customer_phone text default null,
  p_shipping_address text default null,
  p_customer_email text default null,
  p_note text default null,
  p_payment_method text default null,
  p_items jsonb default null,
  p_idempotency_key uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_existing public.orders%rowtype;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_product record;
  v_unit_price numeric(15, 0);
  v_line_total numeric(15, 0);
  v_subtotal numeric(15, 0) := 0;
  v_shipping_fee numeric(15, 0) := 0;
  v_total numeric(15, 0);
  v_sellable_quantity integer;
  v_validated_items jsonb := '[]'::jsonb;
  v_normalized_phone text;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_tracking_token text;
  v_tracking_token_hash text;
  v_created_at timestamptz;
begin
  if p_idempotency_key is null then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"idempotency_key"}';
  end if;

  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'order_number', v_existing.order_number,
      'tracking_token', null,
      'total', v_existing.total,
      'subtotal', v_existing.subtotal,
      'shipping_fee', v_existing.shipping_fee,
      'payment_method', v_existing.payment_method,
      'status', v_existing.status,
      'created_at', v_existing.created_at
    );
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"customer_name"}';
  end if;
  if p_shipping_address is null or length(trim(p_shipping_address)) = 0 then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"shipping_address"}';
  end if;
  -- UPDATED: allow 'vnpay'
  if p_payment_method is null or p_payment_method not in ('cod', 'bank_transfer', 'vnpay') then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"payment_method"}';
  end if;
  if p_customer_email is not null and length(trim(p_customer_email)) > 0
     and p_customer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"customer_email"}';
  end if;

  v_normalized_phone := regexp_replace(coalesce(p_customer_phone, ''), '[^0-9+]', '', 'g');
  if left(v_normalized_phone, 3) = '+84' then
    v_normalized_phone := '0' || substr(v_normalized_phone, 4);
  elsif left(v_normalized_phone, 2) = '84' and length(v_normalized_phone) = 11 then
    v_normalized_phone := '0' || substr(v_normalized_phone, 3);
  end if;
  if v_normalized_phone !~ '^0[0-9]{9}$' then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"customer_phone"}';
  end if;

  if p_items is null or jsonb_typeof(p_items) != 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using message = 'INVALID_QUANTITY', detail = '{"reason":"empty_cart"}';
  end if;

  for v_item in
    select value from jsonb_array_elements(p_items) order by (value ->> 'product_id')
  loop
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    if v_product_id is null then
      raise exception using message = 'INVALID_QUANTITY', detail = '{"reason":"missing_product_id"}';
    end if;

    v_quantity := nullif(v_item ->> 'quantity', '')::integer;
    if v_quantity is null or v_quantity < 1 then
      raise exception using message = 'INVALID_QUANTITY',
        detail = jsonb_build_object('productId', v_product_id)::text;
    end if;

    select id, name, selling_price, status, is_web_visible
      into v_product
      from public.products
      where id = v_product_id
      for share;

    if not found then
      raise exception using message = 'PRODUCT_NOT_FOUND',
        detail = jsonb_build_object('productId', v_product_id)::text;
    end if;
    if v_product.status != 'active' or not v_product.is_web_visible then
      raise exception using message = 'PRODUCT_UNAVAILABLE',
        detail = jsonb_build_object('productId', v_product_id, 'productName', v_product.name)::text;
    end if;

    -- FIXED: row locking cannot appear in the same SELECT as an aggregate.
    -- Lock the candidate batch rows first (plain SELECT ... FOR SHARE),
    -- then sum over that locked set in a wrapping subquery.
    select coalesce(sum(locked.remaining_quantity), 0)
      into v_sellable_quantity
      from (
        select pb.remaining_quantity
        from public.product_batches pb
        where pb.product_id = v_product_id
          and pb.remaining_quantity > 0
          and (pb.expiration_date is null or pb.expiration_date >= v_business_today)
        for share
      ) as locked;

    if v_sellable_quantity = 0 then
      raise exception using message = 'OUT_OF_STOCK',
        detail = jsonb_build_object('productId', v_product_id, 'productName', v_product.name)::text;
    end if;
    if v_quantity > v_sellable_quantity then
      raise exception using message = 'QUANTITY_ADJUSTMENT_REQUIRED',
        detail = jsonb_build_object(
          'productId', v_product_id,
          'productName', v_product.name,
          'available', v_sellable_quantity
        )::text;
    end if;

    v_unit_price := v_product.selling_price;
    v_line_total := v_quantity * v_unit_price;
    v_subtotal := v_subtotal + v_line_total;

    v_validated_items := v_validated_items || jsonb_build_object(
      'product_id', v_product_id,
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'line_total', v_line_total
    );
  end loop;

  v_shipping_fee := 0;
  v_total := v_subtotal + v_shipping_fee;

  insert into public.customers (name, phone, email, address)
  values (
    trim(p_customer_name),
    v_normalized_phone,
    nullif(trim(coalesce(p_customer_email, '')), ''),
    trim(p_shipping_address)
  )
  on conflict (phone) do update set updated_at = now()
  returning id into v_customer_id;

  perform pg_advisory_xact_lock(hashtext('orders_order_number'));
  select 'ORD-' || lpad(
    (coalesce(max(substring(order_number from '^ORD-(\d+)$')::integer), 0) + 1)::text,
    3,
    '0'
  )
  into v_order_number
  from public.orders;

  v_tracking_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_tracking_token_hash := encode(extensions.digest(v_tracking_token, 'sha256'), 'hex');

  begin
    insert into public.orders (
      order_number, customer_id, status, subtotal, discount, total, note,
      payment_status, created_by, source, customer_name_snapshot,
      customer_phone_snapshot, shipping_address_snapshot, recipient_name,
      shipping_fee, tracking_token_hash, idempotency_key, payment_method
    ) values (
      v_order_number, v_customer_id, 'draft', v_subtotal, 0, v_total,
      nullif(trim(coalesce(p_note, '')), ''),
      'unpaid', null, 'website', trim(p_customer_name), v_normalized_phone,
      trim(p_shipping_address), null, v_shipping_fee, v_tracking_token_hash,
      p_idempotency_key, p_payment_method
    )
    returning id, created_at into v_order_id, v_created_at;
  exception
    when unique_violation then
      select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
      if found then
        return jsonb_build_object(
          'order_number', v_existing.order_number,
          'tracking_token', null,
          'total', v_existing.total,
          'subtotal', v_existing.subtotal,
          'shipping_fee', v_existing.shipping_fee,
          'payment_method', v_existing.payment_method,
          'status', v_existing.status,
          'created_at', v_existing.created_at
        );
      end if;
      raise exception using message = 'ORDER_CREATE_FAILED';
  end;

  insert into public.order_items (order_id, product_id, quantity, unit_price, discount, line_total)
  select v_order_id, (elem ->> 'product_id')::uuid, (elem ->> 'quantity')::integer,
         (elem ->> 'unit_price')::numeric, 0, (elem ->> 'line_total')::numeric
  from jsonb_array_elements(v_validated_items) as elem;

  return jsonb_build_object(
    'order_number', v_order_number,
    'tracking_token', v_tracking_token,
    'total', v_total,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'payment_method', p_payment_method,
    'status', 'draft',
    'created_at', v_created_at
  );
end;
$$;

revoke all on function public.create_storefront_order(text, text, text, text, text, text, jsonb, uuid) from public;
grant execute on function public.create_storefront_order(text, text, text, text, text, text, jsonb, uuid) to anon, authenticated;

-- Create record_storefront_online_payment for webhook (IPN) use.
-- It maps to 'other' in order_payments to satisfy any strict checks admin repo has.
create or replace function public.record_storefront_online_payment(
  p_order_number text,
  p_amount numeric,
  p_gateway text,
  p_transaction_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_total_paid numeric;
  v_new_status text;
begin
  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then 
    raise exception 'Order not found'; 
  end if;
  
  if v_order.status not in ('draft', 'completed') then
    raise exception 'Order status % cannot receive online payments', v_order.status;
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than 0';
  end if;

  insert into public.order_payments (order_id, amount, payment_method, note, created_by)
  values (v_order.id, p_amount, 'other', p_gateway || ' Txn: ' || p_transaction_id, null);

  select coalesce(sum(amount), 0) into v_total_paid
  from public.order_payments
  where order_id = v_order.id;

  v_new_status := case when v_total_paid >= v_order.total then 'paid' else 'partial' end;

  update public.orders 
  set payment_status = v_new_status, updated_at = now() 
  where id = v_order.id;
end;
$$;

revoke all on function public.record_storefront_online_payment(text, numeric, text, text) from public;
grant execute on function public.record_storefront_online_payment(text, numeric, text, text) to anon, authenticated;
