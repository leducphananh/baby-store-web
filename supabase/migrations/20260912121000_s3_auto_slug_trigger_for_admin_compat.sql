-- Admin-compatibility fix, found by auditing the admin repo (not assumed):
-- `baby-store-web/src/features/products/api/create-product.ts` inserts a
-- new product without a `slug` (that column didn't exist when that code
-- was written). After 20260912120000 made `products.slug` / `categories
-- .slug` NOT NULL with no column default, the admin's existing "Add
-- product" flow (and any direct category insert) would start failing a
-- NOT NULL violation on every new row — a real regression, not a
-- hypothetical one (S3 phase brief §33: "admin queries continue to work").
--
-- Fix: a BEFORE INSERT trigger that fills `slug` from `name` (same
-- `slugify()` + numeric-suffix-on-collision rule as the backfill) ONLY
-- when the inserting caller left it NULL. An explicit slug provided by a
-- future admin "edit slug" feature (S9) is never overridden. Fires only on
-- INSERT, not UPDATE — a product's slug stays stable across renames
-- (desirable for URLs/SEO; S0 does not ask for auto-updating slugs).

create or replace function public.set_slug_from_name()
returns trigger
language plpgsql
as $$
declare
  v_table regclass := TG_RELID;
  v_base text;
  v_candidate text;
  v_suffix int := 1;
  v_exists boolean;
begin
  if NEW.slug is not null then
    return NEW;
  end if;

  v_base := coalesce(public.slugify(NEW.name), lower(TG_TABLE_NAME) || '-' || substr(gen_random_uuid()::text, 1, 8));
  v_candidate := v_base;

  loop
    execute format('select exists (select 1 from %s where slug = $1)', v_table) into v_exists using v_candidate;
    exit when not v_exists;
    v_suffix := v_suffix + 1;
    v_candidate := v_base || '-' || v_suffix::text;
  end loop;

  NEW.slug := v_candidate;
  return NEW;
end;
$$;

revoke execute on function public.set_slug_from_name() from anon, authenticated;

comment on function public.set_slug_from_name() is
  'BEFORE INSERT trigger function (products, categories): fills slug from name via slugify() + numeric-suffix dedupe, only when the caller left slug NULL. Admin-compatibility fix for S3 — see migration 20260912121000. Not directly callable (no EXECUTE grant); triggers run as the table owner regardless.';

drop trigger if exists products_set_slug on public.products;
create trigger products_set_slug
  before insert on public.products
  for each row
  execute function public.set_slug_from_name();

drop trigger if exists categories_set_slug on public.categories;
create trigger categories_set_slug
  before insert on public.categories
  for each row
  execute function public.set_slug_from_name();
