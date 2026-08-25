---
name: frontend-performance
description: Performance rules for this project — pagination over large tables, memoization discipline, code splitting, avoiding unnecessary re-renders. Apply when building data-heavy views (tables, dashboards, reports).
---

# Frontend performance rules

## Apply when
Building any view that renders a list/table of business data, a dashboard, or a report —
places where dataset size and re-render frequency actually matter.

## Rules

1. **Never render an unbounded dataset.** Product lists, order history, inventory
   transactions — all paginated or virtualized from the start (see `table-data-grid`).
   Don't ship a "select all rows" query and slice client-side once it's already slow.
2. **Server-side filtering/sorting/pagination**, not client-side filtering of a fully-fetched
   dataset, once a table can realistically grow past a few hundred rows.
3. **Let the React Compiler do routine memoization.** It's enabled in this project (babel
   plugin in `vite.config.ts`) — don't reflexively wrap every value in `useMemo`/`useCallback`.
   Hand-written memoization is for cases the compiler can't help with: expensive
   computations (e.g. large report aggregation), or referential stability required by a
   third-party API (e.g. a chart library prop).
4. **Debounce search/filter inputs** that trigger a query (product search, customer search)
   — don't fire a network request on every keystroke.
5. **Code-split rarely-visited, heavy routes** (PDF export view, yearly reports) via
   `React.lazy`; keep the core daily-use flows (dashboard, products, orders) in the main
   bundle so they're instant.
6. **Images:** product images served at a reasonable size/format (prefer `webp`, sized
   thumbnails for list views vs. full-size for detail views) — don't load full-resolution
   originals into a table thumbnail.
7. **Avoid prop-drilling large unstable objects into memoized children** — pass primitives
   or stable references, or the memoization does nothing.
8. **Dashboard widgets fetch independently** (separate query hooks per widget) rather than
   one giant "dashboard data" query that blocks the whole page on the slowest metric —
   unless a single aggregated RPC is genuinely more efficient server-side.
9. **Set appropriate `staleTime`** per query type in TanStack Query — data that changes
   rarely (categories, suppliers) can have a long `staleTime`; near-real-time data
   (current stock counts) shorter, but still avoid refetch-on-every-render.
10. **Profile before optimizing.** Don't add complexity (virtualization, manual memoization,
    web workers) speculatively — reach for it when a table/report is measurably slow, not by
    default for every list.

## Anti-patterns to reject in review

- `supabase.from('orders').select('*')` with no `.range()`/limit feeding a table that
  will accumulate thousands of rows.
- A search box calling the query on every `onChange` with no debounce.
- `useMemo`/`useCallback` wrapping trivial values "for performance" with no evidence it
  was needed, adding noise without benefit.
- A dashboard page that fails to render anything until the slowest report query resolves.
