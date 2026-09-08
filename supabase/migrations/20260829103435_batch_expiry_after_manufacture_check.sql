-- Phase 4.4: enforce "expiration date cannot precede manufacture date" at the
-- database boundary, not only in Zod / the import-item RPCs (see
-- supabase-database skill rule 9). Additive, non-destructive: both tables were
-- checked to hold 0 violating rows before this ran. NULL dates are allowed
-- (many lines/batches don't track lot dates), so the check only bites when
-- BOTH dates are present.

alter table public.import_receipt_items
  add constraint import_receipt_items_expiry_after_manufacture_check
  check (
    manufacture_date is null
    or expiration_date is null
    or expiration_date >= manufacture_date
  );

alter table public.product_batches
  add constraint product_batches_expiry_after_manufacture_check
  check (
    manufacture_date is null
    or expiration_date is null
    or expiration_date >= manufacture_date
  );
