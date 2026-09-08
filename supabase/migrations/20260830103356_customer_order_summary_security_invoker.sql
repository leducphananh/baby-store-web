-- Match the same `security_invoker = true` convention already used by
-- `product_inventory_overview` (Phase 4.6) — the view must enforce the
-- querying user's own RLS/permissions, not the view owner's, closing the
-- Supabase linter's ERROR-level `security_definer_view` finding.
alter view public.customer_order_summary set (security_invoker = true);
