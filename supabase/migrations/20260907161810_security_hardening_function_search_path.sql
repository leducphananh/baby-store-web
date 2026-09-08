-- Phase 9.1 — search_path hardening (requirement §13/§67).
--
-- Audit result: every SECURITY DEFINER function already had an explicit
-- `SET search_path TO 'public'` (never the implicit, mutable default) AND
-- every table/function reference inside every one of them is already
-- schema-qualified (`public.orders`, `public.product_batches`,
-- `auth.uid()`, etc. — verified by reading all 11 function bodies in
-- full). This already neutralizes the classic CVE-2018-1058-style attack
-- (a malicious session shadowing an unqualified name via a temp
-- table/function), because a schema-qualified reference is never affected
-- by search_path at all.
--
-- This migration is additive defense-in-depth on top of that, not a fix
-- for an exploited gap: explicitly appending `pg_temp` as the LAST search
-- path entry, matching Postgres's own documented safest pattern for
-- SECURITY DEFINER functions, so the temp schema's position is
-- deliberate and documented rather than left to its implicit
-- always-first-for-relations behavior. Only the 11 SECURITY DEFINER
-- functions are touched — SECURITY INVOKER functions (every report/alert
-- RPC) run with the CALLER's own privileges and RLS, so they do not carry
-- the same class of risk and are left unchanged.
alter function public.add_import_receipt_item(uuid, uuid, integer, numeric, text, date, date) set search_path = public, pg_temp;
alter function public.adjust_inventory(uuid, text, integer, integer, text) set search_path = public, pg_temp;
alter function public.cancel_order(uuid) set search_path = public, pg_temp;
alter function public.complete_order(uuid) set search_path = public, pg_temp;
alter function public.confirm_import_receipt(uuid) set search_path = public, pg_temp;
alter function public.create_order(uuid, text, jsonb) set search_path = public, pg_temp;
alter function public.delete_import_receipt_item(uuid) set search_path = public, pg_temp;
alter function public.recalc_import_receipt_total(uuid) set search_path = public, pg_temp;
alter function public.record_order_payment(uuid, numeric, text, text) set search_path = public, pg_temp;
alter function public.update_import_receipt_item(uuid, integer, numeric, text, date, date) set search_path = public, pg_temp;
alter function public.update_order_draft(uuid, uuid, text, jsonb) set search_path = public, pg_temp;
