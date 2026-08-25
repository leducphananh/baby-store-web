---
name: supabase-database
description: Database access and modeling conventions for Supabase/Postgres in this project — generated types, query shape, batches/FEFO, money/date handling, transactions. Apply whenever writing queries, mutations, or reasoning about schema.
---

# Supabase database conventions

## Apply when
Writing a query/mutation against Postgres via Supabase, or reasoning about how a domain
concept (batches, inventory, invoices) should be modeled/queried.

## Rules

1. **Use generated types once the schema exists** (`supabase gen types typescript --project-id
   ... > src/types/database.ts` or via CLI/migrations), and type the client with them:
   ```ts
   export const supabase = createClient<Database>(url, anonKey)
   ```
   Don't hand-maintain a parallel guess at the table shape once generated types exist.
2. **Domain types in `features/*/types/` are derived from generated `Database` types**,
   narrowed/renamed to the app's domain vocabulary (e.g. `Row<'products'>` → `Product`),
   not duplicated by hand.
3. **Select only the columns needed** for a given view (`select('id, name, price')`) rather
   than `select('*')` on list views with many/heavy columns; use `select('*')` for detail
   views where all fields are shown.
4. **Money columns are integer VND (smallest unit, no decimals)** in the schema and in
   application code — no `numeric`/float arithmetic for prices, totals, or payments. Sum/
   compute with integers.
5. **Dates:** store `manufacture_date`/`expiry_date`/etc. as `date` (not `timestamp`) when
   time-of-day is irrelevant. Always query/display in a consistent timezone-safe way — don't
   let a `Date` object's local-timezone parsing shift a date by a day.
6. **Batches and FEFO:** when selecting stock to fulfill an order or report expiring stock,
   order batches by `expiry_date ASC` (First-Expired-First-Out), not by creation order or
   arbitrary order. Encode this as a named query/service function
   (`getBatchesForFefoAllocation`), not inline logic repeated per call site.
7. **Multi-step writes that must be atomic use a Postgres function (RPC)**, e.g. "record
   import receipt" or "create order" (order + items + batch allocation + inventory
   deduction + transactions) — don't perform this as several independent client calls that
   can leave the DB inconsistent if one fails partway. **If no such atomic RPC exists yet
   for a critical multi-step write, do not approximate it with sequential client calls —
   stop, report the gap, and propose the RPC/migration** (see CLAUDE.md §11, and
   `domain-driven-frontend` for the order-creation case specifically). This is a hard rule
   for anything touching orders, inventory deduction, or payments — a partially-completed
   business transaction is worse than a blocked screen.
8. **Inventory changes are always recorded as inventory transactions** (append-only ledger:
   receipt, sale, adjustment, return), and current stock is derived/aggregated from that
   ledger (or a maintained running total kept consistent with it) — never mutate a bare
   `stock_quantity` column with no accompanying transaction record.
9. **Foreign keys and constraints enforce data integrity in Postgres**, not just in app-level
   validation (e.g. an order line item must reference a real product/batch; expiry must be
   after manufacture date, enforced via a `CHECK` constraint too, not only Zod).
10. **Pagination uses `range()`/keyset pagination** for list queries expected to grow
    (products, orders, inventory transactions) — never fetch an entire table into the client.
11. **RLS policies are part of the data model**, not an afterthought — when adding a new
    table, define its access policy alongside it (see `supabase-auth`, `frontend-security`).

## Anti-patterns to reject in review

- `unitPrice: number` with decimal cents math (`0.1 + 0.2` territory) anywhere near VND
  totals.
- Computing "current stock" purely as a mutable counter with no transaction history backing
  it.
- A list query with no `.range()`/limit against a table that will grow unbounded.
- Multi-table writes performed as separate sequential `await supabase.from(...).insert()`
  calls from the client where a single RPC would guarantee atomicity.
