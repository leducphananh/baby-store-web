# Database migrations

Every migration that has been applied to the Supabase project, one file per
migration, named `<version>_<name>.sql` (the Supabase CLI convention). The
`version` prefix is a UTC `YYYYMMDDHHMMSS` timestamp and defines apply order.

## Provenance

Phases 3–9 applied these migrations directly to the hosted Supabase project
through tooling rather than a local CLI, so until Phase 9.8 they lived **only**
in the project's `supabase_migrations.schema_migrations` table, not in this
repo. Phase 9.8 (Debt E — migration reproducibility) exported all of them here
**verbatim from that table**, so the repo can now recreate the schema from
scratch. The files were not hand-written and were not re-applied to the remote
— every version below was already present in the remote history at export
time.

## Applying

The remote project is already at the latest version. On a fresh database:

```bash
supabase db reset          # local
# or
supabase db push           # a new/empty remote, after `supabase link`
```

`supabase db push` against the existing project is a no-op: every version here
already appears in its `schema_migrations` table.

## Adding a migration

```bash
supabase migration new <name>
# edit the generated supabase/migrations/<version>_<name>.sql
supabase db push
```

Keep applying and repo state in lock step from here on — the Phase 9.8 export
exists so this never diverges again.

## What the schema covers

Catalog (categories, products, product images, TikTok/Shopee prices),
suppliers, import receipts + line-item RPCs, product batches, VAT/red
invoices, inventory + the append-only `inventory_transactions` ledger,
customers, orders + `order_items` + `order_item_batches` (historical COGS
snapshot), `order_payments`, the transactional RPCs (`create_order`,
`complete_order`, `cancel_order`, `confirm_import_receipt`, `adjust_inventory`,
`record_order_payment`, ...), the reporting RPCs/views (revenue, profit,
product performance, inventory, expiry, slow-moving), and the operational
alert-condition lifecycle. RLS is enabled on every table; the mutating RPCs
are `SECURITY DEFINER` with a pinned `search_path` and are callable by
`authenticated` only.
