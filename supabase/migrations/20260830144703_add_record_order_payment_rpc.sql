-- Records a payment against a completed order and keeps
-- orders.payment_status in sync with it, atomically (Phase 6.5). Two
-- writes — insert the payment, then recompute payment_status from the real
-- sum of payments — done as sequential client calls could leave
-- payment_status stale if the second call failed (a real correctness bug:
-- nothing else in this schema maintains payment_status automatically, no
-- trigger exists on order_payments).
--
-- Only a `completed` order has a trustworthy `total` to collect against
-- (see `create_order`/`complete_order`'s own doc comments) — draft/
-- confirmed orders haven't been posted yet, and a cancelled order's debt
-- was voided by the cancellation.
create or replace function public.record_order_payment(
  p_order_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order public.orders%rowtype;
  v_payment_id uuid;
  v_total_paid numeric;
  v_new_status text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status != 'completed' then
    raise exception 'Only completed orders can receive payments';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than 0';
  end if;
  if p_payment_method not in ('cash', 'bank_transfer', 'other') then
    raise exception 'Invalid payment method';
  end if;

  insert into public.order_payments (order_id, amount, payment_method, note, created_by)
  values (p_order_id, p_amount, p_payment_method, nullif(trim(p_note), ''), auth.uid())
  returning id into v_payment_id;

  select coalesce(sum(amount), 0) into v_total_paid
  from public.order_payments
  where order_id = p_order_id;

  v_new_status := case when v_total_paid >= v_order.total then 'paid' else 'partial' end;

  update public.orders set payment_status = v_new_status, updated_at = now() where id = p_order_id;

  return v_payment_id;
end;
$function$;

grant execute on function public.record_order_payment(uuid, numeric, text, text) to authenticated;
revoke execute on function public.record_order_payment(uuid, numeric, text, text) from public;
revoke execute on function public.record_order_payment(uuid, numeric, text, text) from anon;
