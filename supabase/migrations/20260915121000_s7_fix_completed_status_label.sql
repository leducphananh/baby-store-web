-- Follow-up to 20260915120000_s7_storefront_order_backend_contract: the
-- `completed` status label hard-coded into get_storefront_order_by_token()
-- ("Đã xử lý / hoàn tất") was copied from S0 Part E7's error-contract table.
-- But S2.4 (`docs/design/S2.4-design-system-and-approval.md` §10.8) — the
-- project's authoritative design source of truth (CLAUDE.md §2: "overriding
-- S2.1-S2.3R wording where they conflict") — freezes a different label for
-- this exact status: "Đơn hàng đã được xác nhận". Same precedent already
-- applied in S6 (cart totals terminology): when a newer/other doc's
-- restated customer-facing copy conflicts with S2.4, S2.4 wins. `draft` and
-- `cancelled` are unaffected — S0 and S2.4 agree on those two.

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
      -- S2.4 §10.8 (frozen, authoritative over S0 E7's wording).
      when 'draft' then 'Đơn mới – chờ xác nhận'
      when 'completed' then 'Đơn hàng đã được xác nhận'
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
