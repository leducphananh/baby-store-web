---
name: table-data-grid
description: Conventions for data tables in this app — pagination, sorting, filtering, search, reusable table pattern built on TanStack Table + shadcn. Apply whenever displaying a list of business records.
---

# Data table conventions

## Apply when
Building any list view: products, orders, suppliers, import receipts, inventory
transactions, customers, batches.

## Rules

1. **One shared `DataTable` component** (in `src/components/`, built on `@tanstack/react-table`
   + shadcn `Table` primitives) used by every feature's list view — don't hand-build table
   markup per feature.
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
   export const productColumns: ColumnDef<Product>[] = [
     { accessorKey: 'name', header: 'Tên sản phẩm' },
     { accessorKey: 'unitPriceVnd', header: 'Giá', cell: (c) => formatVnd(c.getValue()) },
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
