-- Storefront Phase S3 — Public Catalog Data Contract.
--
-- Applied to the ONE shared Supabase project ("baby-store-management",
-- jtkmycvkthciiskwptqv) that also backs the admin app (baby-store-web). This
-- file is the storefront repo's own record of what it applied; the admin
-- repo's `supabase/migrations/` is the project's canonical migration
-- history and should receive a copy of this file too (flagged as an Admin
-- Coordination follow-up in the S3 completion report — not done here, per
-- CLAUDE.md §14: storefront Claude does not write into the admin repo).
--
-- Everything below is additive: new nullable-then-backfilled columns, two
-- new UNIQUE constraints, one new partial index, four new functions. No
-- table is dropped, no existing column/constraint/RLS policy/grant is
-- touched, no existing row is deleted. `anon` gains EXECUTE on exactly
-- three new SECURITY DEFINER functions and nothing else — no table or view
-- grant is added for `anon` anywhere (see the "why SECURITY DEFINER"
-- comment below; this deliberately does NOT follow S0 Part E's original
-- `security_invoker` view + `anon` RLS-on-base-tables sketch, which
-- CLAUDE.md §5 already corrected before this repo existed).

-- ============================================================================
-- 1. Vietnamese-safe slugs (S0 F1) — `unaccent`, kebab-case, dedupe with a
--    numeric suffix on collision, ordered by creation so the first product/
--    category with a given name keeps the bare slug.
-- ============================================================================

create extension if not exists unaccent with schema extensions;

create or replace function public.slugify(p_text text)
returns text
language sql
stable
as $$
  -- STABLE, not IMMUTABLE: extensions.unaccent() depends on a text search
  -- dictionary that is configuration state, not a pure function of its
  -- argument alone.
  select nullif(
    regexp_replace(
      regexp_replace(lower(extensions.unaccent(trim(p_text))), '[^a-z0-9]+', '-', 'g'),
      '(^-+)|(-+$)', '', 'g'
    ),
    ''
  )
$$;

revoke all on function public.slugify(text) from public;
grant execute on function public.slugify(text) to authenticated;

comment on function public.slugify(text) is
  'Vietnamese-safe kebab-case slug generator (unaccent + lowercase + hyphenate). Used for the products/categories slug backfill (S3) and available to admin for future manual slug edits (S9). Not granted to anon — the storefront never generates a slug client-side, it only reads stored ones.';

alter table public.products add column if not exists slug text;
alter table public.categories add column if not exists slug text;

with base as (
  select id, coalesce(public.slugify(name), 'sp-' || substr(id::text, 1, 8)) as base_slug
  from public.products
),
numbered as (
  select id, base_slug,
         row_number() over (partition by base_slug order by id) as rn
  from base
)
update public.products p
set slug = numbered.base_slug || case when numbered.rn > 1 then '-' || numbered.rn::text else '' end
from numbered
where p.id = numbered.id and p.slug is null;

with base as (
  select id, coalesce(public.slugify(name), 'dm-' || substr(id::text, 1, 8)) as base_slug
  from public.categories
),
numbered as (
  select id, base_slug,
         row_number() over (partition by base_slug order by id) as rn
  from base
)
update public.categories c
set slug = numbered.base_slug || case when numbered.rn > 1 then '-' || numbered.rn::text else '' end
from numbered
where c.id = numbered.id and c.slug is null;

alter table public.products alter column slug set not null;
alter table public.categories alter column slug set not null;

alter table public.products add constraint products_slug_key unique (slug);
alter table public.categories add constraint categories_slug_key unique (slug);

-- ============================================================================
-- 2. Storefront publication flag (S0 O1 — locked, CLAUDE.md §9): a product
--    may be active internally without being on the public website. Default
--    false so nothing publishes until an admin explicitly ticks it (S9
--    ships the actual admin toggle UI; for now it is set directly in SQL).
-- ============================================================================

alter table public.products add column if not exists is_web_visible boolean not null default false;

comment on column public.products.is_web_visible is
  'Storefront publication flag (S0 O1, CLAUDE.md §9). A product may be status=active (sellable internally / other channels) without being on the public website. Default false: nothing is web-visible until an admin explicitly sets this true. Admin UI toggle ships in S9 — until then, set directly via SQL.';

create index if not exists products_storefront_visible_idx
  on public.products (category_id)
  where status = 'active' and is_web_visible;

-- ============================================================================
-- 3. The public catalog contract — three SECURITY DEFINER functions.
--
-- WHY SECURITY DEFINER (not S0 Part E's `security_invoker` view + `anon`
-- RLS-on-base-tables sketch): CLAUDE.md §5 explicitly corrects that S0
-- proposal — "Do not freeze that. ... No public base-table SELECT is
-- required." `anon` is granted EXECUTE on exactly these three functions
-- and nothing else; it never gains SELECT on `products`, `categories`, or
-- `product_batches`. Each function is owned by the migration-applying role
-- (matching every existing DEFINER RPC in this project), pins
-- `search_path = public, pg_temp` (Phase 9.1 convention — defends against
-- search_path hijacking), and is STABLE (read-only, no side effects).
--
-- Availability uses the EXACT predicate `complete_order()` uses for FEFO
-- allocation (`remaining_quantity > 0 AND (expiration_date IS NULL OR
-- expiration_date >= business_today)`, business_today = Vietnam-local date)
-- — copied verbatim, not re-derived, per S0 B4: "Do NOT reuse
-- `product_inventory_overview.stock_quantity` for storefront availability:
-- it counts expired physical stock." Only a boolean (`in_stock`) is
-- returned — never the numeric sellable quantity, batch ids, cost, lot
-- numbers, or expiry dates (S0 B4: "Display (MVP): status label only, no
-- exact number").
-- ============================================================================

create or replace function public.list_storefront_categories()
returns table (
  category_id uuid,
  slug text,
  name text,
  description text,
  product_count bigint
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    c.id,
    c.slug,
    c.name,
    c.description,
    count(p.id) as product_count
  from public.categories c
  join public.products p
    on p.category_id = c.id
   and p.status = 'active'
   and p.is_web_visible
  group by c.id, c.slug, c.name, c.description
  order by c.name asc;
$$;

revoke all on function public.list_storefront_categories() from public;
grant execute on function public.list_storefront_categories() to anon, authenticated;

comment on function public.list_storefront_categories() is
  'Public catalog contract (S3). Categories that currently have >=1 active, web-visible product, with that count. No internal fields. SECURITY DEFINER — see the block comment above this section for why. anon + authenticated may EXECUTE; nobody may SELECT the underlying tables directly as anon.';

create or replace function public.list_storefront_products(
  p_category_slug text default null,
  p_limit integer default 24,
  p_offset integer default 0
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
    ) as in_stock,
    p.updated_at,
    count(*) over () as total_count
  from public.products p
  left join public.categories c on c.id = p.category_id
  where p.status = 'active'
    and p.is_web_visible
    and (p_category_slug is null or c.slug = p_category_slug)
  order by p.created_at desc, p.id desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.list_storefront_products(text, integer, integer) from public;
grant execute on function public.list_storefront_products(text, integer, integer) to anon, authenticated;

comment on function public.list_storefront_products(text, integer, integer) is
  'Public catalog contract (S3). Paginated (default page size 24, hard-capped at 60), newest-first. Optional p_category_slug filter. Excludes default_purchase_price/tiktok_price/shopee_price/minimum_stock/sku/barcode/source_description and all batch/cost/supplier data. in_stock is a boolean derived from the same non-expired-batch predicate complete_order() uses for FEFO — never an exact quantity. Search (p_search) and additional sort orders are deferred to S4 as an additive parameter, not built here. SECURITY DEFINER — see the block comment above this section.';

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
  updated_at timestamptz
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
    p.updated_at
  from public.products p
  left join public.categories c on c.id = p.category_id
  where p.slug = p_slug
    and p.status = 'active'
    and p.is_web_visible;
end;
$$;

revoke all on function public.get_storefront_product_by_slug(text) from public;
grant execute on function public.get_storefront_product_by_slug(text) to anon, authenticated;

comment on function public.get_storefront_product_by_slug(text) is
  'Public catalog contract (S3). A single web-visible, active product by slug, same shape/exclusions as list_storefront_products (minus total_count). Returns zero rows for an archived/non-web-visible/unknown slug — never distinguishes "does not exist" from "not public" to an anon caller. SECURITY DEFINER — see the block comment above this section.';
