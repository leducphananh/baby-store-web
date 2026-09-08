-- Phase 3.4: enforce image type + size at the real boundary (Storage bucket),
-- not just client-side. Additive, non-destructive: the bucket already exists
-- and is private; this only constrains what may be uploaded into it.
update storage.buckets
set
  file_size_limit = 5242880,                                  -- 5 MiB, matches supabase-storage skill
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';
