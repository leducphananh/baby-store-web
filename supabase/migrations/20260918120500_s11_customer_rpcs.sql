-- Migration: s11_customer_rpcs
-- Description: RPCs for fetching customer profile and order history

CREATE OR REPLACE FUNCTION public.get_storefront_customer_orders()
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders 
  WHERE customer_id IN (
    SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
  )
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_storefront_customer_profile()
RETURNS SETOF public.customers
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.customers WHERE auth_user_id = auth.uid();
$$;
