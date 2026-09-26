-- Create storefront-images bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'storefront-images',
  'storefront-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- RLS policies for storage.objects on storefront-images
-- Note: 'authenticated' can upload/update/delete, 'public' can read
create policy "Allow authenticated users to insert storefront images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'storefront-images');

create policy "Allow authenticated users to update storefront images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'storefront-images');

create policy "Allow authenticated users to delete storefront images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'storefront-images');

create policy "Allow public to read storefront images"
  on storage.objects for select
  to public
  using (bucket_id = 'storefront-images');
