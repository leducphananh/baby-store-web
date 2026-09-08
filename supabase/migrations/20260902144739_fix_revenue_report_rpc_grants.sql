-- Corrective fix: `REVOKE ... FROM PUBLIC` alone does not remove `anon`'s
-- own default-privilege EXECUTE grant (the established convention in this
-- project — e.g. `record_order_payment` from Phase 6.5 — revokes from
-- `public` AND `anon` explicitly; this migration's original
-- `add_revenue_report_rpcs` missed the explicit `anon` revoke). Verified
-- via a real anon-key REST call before this fix: RLS already fully
-- blocked anon from seeing any row data (both functions returned all
-- zeros against real August 2026 data), so no data was ever exposed —
-- this closes the unintended EXECUTE grant itself as defense in depth,
-- matching every other RPC in this project.
revoke all on function public.get_revenue_summary(timestamptz, timestamptz) from anon;
revoke all on function public.get_revenue_timeseries(timestamptz, timestamptz) from anon;
