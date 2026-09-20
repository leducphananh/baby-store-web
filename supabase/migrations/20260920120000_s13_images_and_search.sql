-- Storefront Phase S13 & S14 — Product Images and Search Support
--
-- Modifies the public catalog data contract to include:
-- 1. `image_storage_path` from `product_images` (where `is_primary = true`)
-- 2. `p_search` parameter for `list_storefront_products` (searching by name and brand).

create or replace function public.list_storefront_products(
  p_category_slug text default null,
  p_limit integer default 24,
  p_offset integer default 0,
  p_search text default null
)
returns table (
  product_id uuid,
  slug text,
  name text,
  brand text,
  description text,
  unit text,
  origin_country text,
  manufacturer text,
  distributor text,
  category_id uuid,
  category_slug text,
  category_name text,
  selling_price numeric,
  in_stock boolean,
  updated_at timestamptz,
  image_storage_path text,
  total_count bigint
)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_business_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_limit integer := least(greatest(coalesce(p_limit, 24), 1), 60);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_search_query text;
begin
  if p_search is null or trim(p_search) = '' then
    v_search_query := null;
  else
    v_search_query := '%' || lower(public.slugify(p_search)) || '%';
  end if;

  return query
  select
    p.id,
    p.slug,
    p.name,
    p.brand,
    p.description,
    p.unit,
    p.origin_country,
    p.manufacturer,
    p.distributor,
    p.category_id,
    c.slug,
    c.name,
    p.selling_price,
    exists (
      select 1 from public.product_batches pb
      where pb.product_id = p.id
        and pb.remaining_quantity > 0
        and (pb.expiration_date is null or pb.expiration_date >= v_business_today)
    ) as in_stock,
    p.updated_at,
    pi.storage_path as image_storage_path,
    count(*) over () as total_count
  from public.products p
  left join public.categories c on c.id = p.category_id
  left join public.product_images pi on pi.product_id = p.id and pi.is_primary = true
  where p.status = 'active'
    and p.is_web_visible
    and (p_category_slug is null or c.slug = p_category_slug)
    and (
      v_search_query is null or
      lower(public.slugify(p.name)) like v_search_query or
      (p.brand is not null and lower(public.slugify(p.brand)) like v_search_query)
    )
  order by p.created_at desc, p.id desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.list_storefront_products(text, integer, integer, text) from public;
grant execute on function public.list_storefront_products(text, integer, integer, text) to anon, authenticated;

-- Also update get_storefront_product_by_slug to return image_storage_path
create or replace function public.get_storefront_product_by_slug(p_slug text)
returns table (
  product_id uuid,
  slug text,
  name text,
  brand text,
  description text,
  unit text,
  origin_country text,
  manufacturer text,
  distributor text,
  category_id uuid,
  category_slug text,
  category_name text,
  selling_price numeric,
  in_stock boolean,
  updated_at timestamptz,
  image_storage_path text
)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_business_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  return query
  select
    p.id,
    p.slug,
    p.name,
    p.brand,
    p.description,
    p.unit,
    p.origin_country,
    p.manufacturer,
    p.distributor,
    p.category_id,
    c.slug,
    c.name,
    p.selling_price,
    exists (
      select 1 from public.product_batches pb
      where pb.product_id = p.id
        and pb.remaining_quantity > 0
        and (pb.expiration_date is null or pb.expiration_date >= v_business_today)
    ),
    p.updated_at,
    pi.storage_path as image_storage_path
  from public.products p
  left join public.categories c on c.id = p.category_id
  left join public.product_images pi on pi.product_id = p.id and pi.is_primary = true
  where p.slug = p_slug
    and p.status = 'active'
    and p.is_web_visible;
end;
$$;

revoke all on function public.get_storefront_product_by_slug(text) from public;
grant execute on function public.get_storefront_product_by_slug(text) to anon, authenticated;
