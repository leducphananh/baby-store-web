-- Storefront Phase S7 — Storefront Checkout + Storefront Order Backend
-- Contract.
--
-- Applied to the ONE shared Supabase project ("baby-store-management",
-- jtkmycvkthciiskwptqv) that also backs the admin app (baby-store-web).
-- This file is the storefront repo's own record of what it applied; per
-- CLAUDE.md §14 the admin repo's `supabase/migrations/` should receive a
-- copy too (Admin Coordination follow-up — not done here).
--
-- Everything below is additive (S0 Part F, F6-F11): nine new nullable-or-
-- defaulted columns on the existing `orders` table, two new check
-- constraints, two new SECURITY DEFINER functions. No table is dropped, no
-- existing column/constraint/RLS policy/grant is touched, no existing row
-- is rewritten (every new column is either DEFAULTed for historical rows or
-- stays NULL for them). Inspected before writing this migration: the live
-- bodies of `create_order`, `complete_order`, `cancel_order`,
-- `update_order_draft`, `record_order_payment`; the live `orders` /
-- `order_items` / `customers` / `products` column and constraint lists; and
-- the current RLS policies on `orders` / `order_items` / `customers`
-- (every one of them is `TO authenticated` only — `anon` has zero policy on
-- any of these tables, confirming SECURITY DEFINER is the only mechanism
-- available for a guest checkout to write an order).
--
-- Why `create_storefront_order()` cannot reuse/extend `create_order()`:
-- `create_order()` calls `complete_order()` immediately after inserting
-- `order_items` — it auto-completes and allocates FEFO stock. A storefront
-- checkout must NEVER auto-complete (CLAUDE.md §6, S0 O2) — it stops right
-- after inserting `order_items`, leaving the order at `status = 'draft'`
-- for staff to review and complete manually via the existing admin flow.

-- ============================================================================
-- 1. `orders` additive columns (S0 Part F, F6-F9).
-- ============================================================================

alter table public.orders
  add column if not exists source text not null default 'admin';

alter table public.orders
  add constraint orders_source_check
  check (source in ('admin', 'website', 'tiktok', 'shopee', 'other'));

comment on column public.orders.source is
  'Order origin channel (S0 F6). Existing rows default to ''admin'' (POS/manual entry, unchanged meaning). A storefront checkout (S7) always inserts ''website''.';

alter table public.orders add column if not exists customer_name_snapshot text;
alter table public.orders add column if not exists customer_phone_snapshot text;
alter table public.orders add column if not exists shipping_address_snapshot text;

comment on column public.orders.customer_name_snapshot is
  'What the customer typed at checkout (S0 F7), independent of the linked `customers` row, which may be edited later. NULL for pre-S7 / non-website orders.';
comment on column public.orders.customer_phone_snapshot is
  'Normalized phone as submitted at checkout (S0 F7). NULL for pre-S7 / non-website orders.';
comment on column public.orders.shipping_address_snapshot is
  'Shipping address as submitted at checkout (S0 F7). NULL for pre-S7 / non-website orders.';

alter table public.orders add column if not exists recipient_name text;

comment on column public.orders.recipient_name is
  'S0 F8 — reserved for a future "shipping to someone else" feature (a recipient name that differs from the paying customer). NOT populated by `create_storefront_order()` in S7 — the checkout form has no separate recipient field yet; `customer_name_snapshot` is the shipping contact name for every website order today. Additive column only, per S0''s Part F schedule for this phase.';

alter table public.orders
  add column if not exists shipping_fee numeric(15, 0) not null default 0;

alter table public.orders
  add constraint orders_shipping_fee_nonneg check (shipping_fee >= 0);

comment on column public.orders.shipping_fee is
  'S0 F8 / CLAUDE.md §8 — staff-confirmed, NOT financially integrated into `total` yet. `create_storefront_order()` always inserts 0 for MVP. Whether `complete_order()` should later add this into `total` is an explicit coordinated follow-up (§8), not decided here.';

alter table public.orders add column if not exists tracking_token_hash text;
alter table public.orders add constraint orders_tracking_token_hash_key unique (tracking_token_hash);

comment on column public.orders.tracking_token_hash is
  'sha256 hex digest of a random guest order-lookup token (S0 F9, E6, CLAUDE.md §6). The plaintext token is returned once, at order-creation time, to the caller of `create_storefront_order()` and is NEVER stored anywhere — this column is the only persisted form. `get_storefront_order_by_token()` hashes an incoming token and compares against this column. NULL for pre-S7 / non-website orders.';

alter table public.orders add column if not exists idempotency_key uuid;
alter table public.orders add constraint orders_idempotency_key_key unique (idempotency_key);

comment on column public.orders.idempotency_key is
  'S0 F9, E6 — client-generated once per checkout attempt. A retried/duplicated `create_storefront_order()` call with the same key returns the original order''s confirmation instead of creating a second order (see DUPLICATE_CHECKOUT in the function body). NULL for pre-S7 / non-website orders; the UNIQUE constraint still holds (Postgres treats each NULL as distinct).';

alter table public.orders add column if not exists payment_method text;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method is null or payment_method in ('cod', 'bank_transfer'));

comment on column public.orders.payment_method is
  'S0 F9 — MVP payment methods only (CLAUDE.md: "COD/bank-transfer only"). NULL for pre-S7 / non-website orders. No payment gateway integration exists; `bank_transfer` records intent only, per §8''s deferred shipping/payment-accounting decisions.';

-- ============================================================================
-- 2. `create_storefront_order()` (S0 E4, F10) — the storefront's only order-
--    write path. SECURITY DEFINER because every RLS policy on `orders` /
--    `order_items` / `customers` is `TO authenticated` only (verified live,
--    see the file header) — `anon` has no direct write path to any of these
--    tables, by design.
--
--    Every parameter defaults to NULL (rather than mirroring S0 E4's exact
--    "required params have no default" signature) purely because Postgres
--    requires defaulted parameters to be trailing in a CREATE FUNCTION
--    parameter list; S0's own order interleaves required and optional
--    params. Supabase/PostgREST always calls this function with named
--    arguments (a JSON object), so parameter order is not part of the real
--    call contract — only the body's explicit "is this NULL" checks are.
--
--    Error contract (S0 E7): every RAISE EXCEPTION here sets MESSAGE to the
--    exact stable code string from S0's table (PRODUCT_NOT_FOUND,
--    PRODUCT_UNAVAILABLE, OUT_OF_STOCK, QUANTITY_ADJUSTMENT_REQUIRED,
--    INVALID_QUANTITY, INVALID_CUSTOMER_DATA, ORDER_CREATE_FAILED) and,
--    where there is structured extra detail (e.g. how many units are
--    actually sellable), a DETAIL of a small JSON object. PostgREST/
--    supabase-js surface these as `error.message` / `error.details`
--    respectively — the Route Handler reads `error.message` directly as the
--    code (no fragile string-prefix parsing) and JSON.parses `error.details`
--    when present. PRICE_CHANGED is NOT raised by this function: `p_items`
--    never carries a client-submitted price for this function to compare
--    against (CLAUDE.md §4 — price is never trusted from the browser), so
--    there is nothing to "mismatch" from the RPC's point of view; a
--    friendly pre-submit price-drift check is the checkout page's own
--    responsibility (re-reading `get_storefront_product_by_slug`, an
--    existing S3 RPC — no new backend surface for that).
-- ============================================================================

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
  -- 1. Idempotency (S0 E6). A missing key is a client bug, not a business
  -- error, but we still reject it explicitly rather than silently creating
  -- an unreplayable order.
  if p_idempotency_key is null then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"idempotency_key"}';
  end if;

  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    -- DUPLICATE_CHECKOUT (S0 E7): not an error. The plaintext tracking
    -- token was never persisted (only its hash is, by design — CLAUDE.md
    -- §6), so a replay cannot return it a second time; the customer's
    -- browser already received it on the original response. Disclosed as a
    -- known limitation in the S7 completion report.
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

  -- 2. Customer fields.
  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"customer_name"}';
  end if;
  if p_shipping_address is null or length(trim(p_shipping_address)) = 0 then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"shipping_address"}';
  end if;
  if p_payment_method is null or p_payment_method not in ('cod', 'bank_transfer') then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"payment_method"}';
  end if;
  if p_customer_email is not null and length(trim(p_customer_email)) > 0
     and p_customer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"customer_email"}';
  end if;

  -- Vietnamese mobile phone: strip everything but digits/+, fold a leading
  -- +84/84 to a local 0-prefixed number, then require exactly 10 digits
  -- starting with 0.
  v_normalized_phone := regexp_replace(coalesce(p_customer_phone, ''), '[^0-9+]', '', 'g');
  if left(v_normalized_phone, 3) = '+84' then
    v_normalized_phone := '0' || substr(v_normalized_phone, 4);
  elsif left(v_normalized_phone, 2) = '84' and length(v_normalized_phone) = 11 then
    v_normalized_phone := '0' || substr(v_normalized_phone, 3);
  end if;
  if v_normalized_phone !~ '^0[0-9]{9}$' then
    raise exception using message = 'INVALID_CUSTOMER_DATA', detail = '{"field":"customer_phone"}';
  end if;

  -- 3. Items shape.
  if p_items is null or jsonb_typeof(p_items) != 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using message = 'INVALID_QUANTITY', detail = '{"reason":"empty_cart"}';
  end if;

  -- 4. Per item: validate shape, lock the product row, check
  -- availability/stock, price server-side. Locked in product_id order
  -- (matching complete_order()'s own convention) to avoid deadlocking
  -- against a concurrent checkout of an overlapping cart.
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

    select coalesce(sum(pb.remaining_quantity), 0)
      into v_sellable_quantity
      from public.product_batches pb
      where pb.product_id = v_product_id
        and pb.remaining_quantity > 0
        and (pb.expiration_date is null or pb.expiration_date >= v_business_today)
      for share;

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

  -- 5. Shipping/total (CLAUDE.md §8 — not financially integrated beyond a
  -- flat 0 for MVP).
  v_shipping_fee := 0;
  v_total := v_subtotal + v_shipping_fee;

  -- 6. Customer dedupe by normalized phone (S0 B5) — reuse the existing
  -- customer id without overwriting their stored name/email/address (the
  -- per-order `*_snapshot` columns already preserve exactly what THIS order
  -- submitted; the `customers` row is an identity/dedupe key, not a log).
  insert into public.customers (name, phone, email, address)
  values (
    trim(p_customer_name),
    v_normalized_phone,
    nullif(trim(coalesce(p_customer_email, '')), ''),
    trim(p_shipping_address)
  )
  on conflict (phone) do update set updated_at = now()
  returning id into v_customer_id;

  -- 7. order_number (reusing create_order()'s exact advisory-lock pattern,
  -- verified live before writing this) + a random, unguessable tracking
  -- token. Only the token's hash is ever persisted (CLAUDE.md §6).
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

  -- 8. Insert the order at status='draft' — and stop there. Unlike
  -- create_order(), this function never calls complete_order(): a website
  -- checkout must not auto-complete, allocate FEFO stock, or become
  -- revenue (CLAUDE.md §6, S0 O2).
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
      -- A genuine concurrent double-submit with the same idempotency key:
      -- the other transaction won the race and committed first. Return its
      -- confirmation instead of failing the customer's retry.
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

  -- 9. Safe confirmation only (S0 E4 §11) — never the order UUID, COGS,
  -- batch data, or internal notes.
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

comment on function public.create_storefront_order(text, text, text, text, text, text, jsonb, uuid) is
  'S0 E4/F10 — the storefront''s only order-write path. SECURITY DEFINER (every RLS policy on orders/order_items/customers is TO authenticated only). Validates + server-prices every line (products.selling_price, never a client-submitted price), checks non-expired sellable stock (the same FEFO predicate complete_order() uses, read-only here — no reservation, no decrement), dedupes the customer by normalized phone, and inserts one draft/source=website order + its order_items in a single transaction. Never calls complete_order() — a website order never auto-completes, allocates stock, or becomes revenue. Idempotent on p_idempotency_key (S0 E6): a replayed call returns the original order''s confirmation (tracking_token omitted on replay — only its hash is ever persisted, so a lost first response cannot be recovered by this function; the customer''s only recovery path is contacting the store with their phone/order number, matching O7). Error contract: RAISE EXCEPTION MESSAGE is one of S0 E7''s exact stable codes; DETAIL, when present, is a small JSON object with extra context (e.g. available quantity) for the Route Handler to interpolate into the Vietnamese message.';

-- ============================================================================
-- 3. `get_storefront_order_by_token()` (S0 E5, F11) — the storefront's only
--    order-read path for a guest. SECURITY DEFINER for the same reason as
--    above (no anon RLS policy on `orders`/`order_items` exists or should
--    exist). Looks up by the SHA-256 hash of an unguessable token only —
--    never by order_number or id alone (CLAUDE.md §6). Returns null (not
--    an error) for an unknown/malformed token, so a guessed token cannot be
--    distinguished from a malformed one.
-- ============================================================================

create or replace function public.get_storefront_order_by_token(p_token text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_token_hash text;
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return null;
  end if;

  v_token_hash := encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  select * into v_order from public.orders where tracking_token_hash = v_token_hash;
  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'productName', p.name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'lineTotal', oi.line_total
      )
      order by oi.id
    ),
    '[]'::jsonb
  )
  into v_items
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  where oi.order_id = v_order.id;

  return jsonb_build_object(
    'orderNumber', v_order.order_number,
    'status', case v_order.status
      when 'draft' then 'Đơn mới – chờ xác nhận'
      when 'completed' then 'Đã xử lý / hoàn tất'
      when 'cancelled' then 'Đã huỷ'
      else v_order.status
    end,
    'paymentStatus', v_order.payment_status,
    'paymentMethod', v_order.payment_method,
    'createdAt', v_order.created_at,
    'subtotal', v_order.subtotal,
    'shippingFee', v_order.shipping_fee,
    'total', v_order.total,
    'items', v_items,
    'customerNameSnapshot', v_order.customer_name_snapshot,
    'customerPhoneSnapshot', v_order.customer_phone_snapshot,
    'shippingAddressSnapshot', v_order.shipping_address_snapshot,
    'note', v_order.note
  );
end;
$$;

revoke all on function public.get_storefront_order_by_token(text) from public;
grant execute on function public.get_storefront_order_by_token(text) to anon, authenticated;

comment on function public.get_storefront_order_by_token(text) is
  'S0 E5/F11 — guest order lookup by unguessable token only (hashed with sha256, compared against orders.tracking_token_hash; never a lookup by order_number/id alone, CLAUDE.md §6). Returns NULL for an unknown or malformed token (no existence-leak). Returned shape is camelCase JSON (this function''s own convention, since a jsonb-returning function has no inherited column-name convention to match) and never includes customer_id, the order UUID, created_by, COGS, order_item_batches, or staff/internal notes.';
