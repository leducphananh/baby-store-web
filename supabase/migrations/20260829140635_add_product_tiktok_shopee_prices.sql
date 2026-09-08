-- Additive: two optional per-channel list prices on products, matching the
-- existing money-column convention (numeric(15,0), integer VND). Nullable
-- with NO default, so existing rows and any product without a channel
-- listing read as NULL ("not set"), never 0 ("listed for free").
alter table public.products
  add column tiktok_price numeric(15, 0),
  add column shopee_price numeric(15, 0);

alter table public.products
  add constraint products_tiktok_price_check check (tiktok_price is null or tiktok_price >= 0),
  add constraint products_shopee_price_check check (shopee_price is null or shopee_price >= 0);
