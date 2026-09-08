-- Previous revoke from `anon` was a no-op: EXECUTE was granted to PUBLIC,
-- and every role (including anon) implicitly inherits PUBLIC grants.
-- Must revoke from PUBLIC itself, then anon truly loses access
-- while authenticated/service_role keep their explicit grants.
revoke execute on function public.complete_order(uuid) from public;
revoke execute on function public.cancel_order(uuid) from public;
revoke execute on function public.confirm_import_receipt(uuid) from public;
revoke execute on function public.adjust_inventory(uuid, integer, text, text, uuid) from public;
