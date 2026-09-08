-- Security fix: these RPCs are SECURITY DEFINER (bypass RLS). They must never be
-- callable by the unauthenticated `anon` role, only by `authenticated` users.
revoke execute on function public.complete_order(uuid) from anon;
revoke execute on function public.cancel_order(uuid) from anon;
revoke execute on function public.confirm_import_receipt(uuid) from anon;
revoke execute on function public.adjust_inventory(uuid, integer, text, text, uuid) from anon;
