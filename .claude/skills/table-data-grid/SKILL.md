---
name: table-data-grid
description: Conventions for data tables in this app — pagination, sorting, filtering, search, reusable table pattern built on shadcn Table primitives. Apply whenever displaying a list of business records.
---

# Data table conventions

## Apply when
Building any list view: categories, products, orders, suppliers, import receipts, inventory
transactions, customers, batches.

## Rules

1. **One shared `DataTable` component** (`src/components/common/data-table.tsx`) used by
   every feature's list view — don't hand-build table markup per feature. It's a small
   hand-rolled component on top of the shadcn `Table` primitives (`src/components/ui/table.tsx`),
   **not** built on `@tanstack/react-table` — this project's installed major version (9.x)
   ships a ground-up-redesigned API (atoms/store/feature-slots), with the familiar v8-style
   hooks (`useReactTable`, `ColumnDef`, `getCoreRowModel`) only available as an explicitly
   `@deprecated` compatibility shim (`@tanstack/react-table/legacy`). Since every table in
   this app is manually/server-driven (rule 2/3 below) — the client-side row-model
   computation TanStack Table exists to do is never actually exercised — the shared
   `DataTable` implements manual sorting/pagination directly instead of taking on that
   dependency. Re-evaluate only if a future feature has a genuine need for client-side
   filtering/grouping/virtualization that justifies it.
2. **Server-side pagination, sorting, and filtering** once a dataset can realistically grow
   (products, orders, inventory transactions) — page/sort/filter state is passed into the
   query hook and becomes part of the query key (see `react-query`), not applied to an
   already-fully-fetched array client-side.
3. **Small, bounded lookup tables (e.g. categories, units) may paginate/filter client-side**
   — don't over-engineer server-side pagination for a table that will only ever have a few
   dozen rows.
4. **Search is debounced and server-side** for anything backed by a growing table (product
   search by name/SKU, customer search by phone/name).
5. **Column definitions live in the feature**, not in the shared `DataTable`:
   ```ts
   // features/products/components/product-columns.ts
   import type { DataTableColumn } from '@/components/common/data-table'

   export const productColumns: DataTableColumn<Product>[] = [
     { id: 'name', header: 'Tên sản phẩm', cell: (p) => p.name, sortable: true },
     { id: 'price', header: 'Giá', cell: (p) => formatCurrencyVND(p.unitPriceVnd), align: 'right' },
     ...
   ]
   ```
6. **Every table has explicit loading (skeleton rows), empty ("Chưa có sản phẩm nào" +
   relevant action), and error states** — not a table that just renders zero rows silently
   when data hasn't loaded or failed to load.
7. **Row actions (edit/delete/view) go in a dedicated actions column**, using a
   `DropdownMenu` for 3+ actions rather than a row of icon buttons that gets cramped.
8. **Sortable columns show clear sort direction indicators**, and default sort order is
   sensible for the domain (e.g. batches default-sorted by soonest expiry, orders by most
   recent).
9. **Selection (checkboxes) is only added when there's a real bulk action** (bulk delete,
   bulk export) — don't add row selection UI speculatively.
10. **Numeric/money columns are right-aligned**, text columns left-aligned, dates in a
    consistent Vietnamese format column-wide.
11. **Row click behavior is consistent across the app** (e.g. clicking a row opens detail,
    clicking an action button doesn't also trigger the row click) — pick one pattern and use
    it everywhere.

## Anti-patterns to reject in review

- A new feature hand-rolling its own `<table>` markup instead of using the shared
  `DataTable`.
- Fetching an entire table's data client-side then paginating with `.slice()` once the table
  is known to grow past a few hundred rows.
- A table with no empty state — just a header row and nothing else when there's no data.
- Search input firing a query on every keystroke with no debounce.
