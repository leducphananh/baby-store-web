-- Phase 4.3: enforce invoice attachment type + size at the real boundary
-- (Storage bucket), not just client-side. Additive, non-destructive: the
-- `purchase-invoices` bucket already exists and is private (public = false);
-- this only constrains what may be uploaded into it. The bucket is empty
-- (0 objects) so no existing file can be invalidated.
--
-- Accepted: PDF + JPG/JPEG (image/jpeg) + PNG. Max 10 MiB per file, matching
-- the `supabase-storage` skill's guidance for invoice/receipt scans.
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
where id = 'purchase-invoices';
