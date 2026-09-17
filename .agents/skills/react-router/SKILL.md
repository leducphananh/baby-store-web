---
name: react-router
description: Routing conventions with React Router for this admin app — route structure, layouts, param typing, guards, lazy loading. Apply when adding/editing routes or navigation.
---

# React Router conventions

## Apply when
Adding a new page/route, nesting layouts, handling route params, or guarding a route
behind auth.

## Rules

1. **Routes live under `src/routes/`**, mirroring the URL structure, and stay thin — they
   compose a feature's components, they don't implement forms or tables inline.
2. **Use nested routes + layout routes** for the shared admin shell (sidebar, header) instead
   of repeating layout markup per page:
   ```
   /                      -> DashboardLayout
     /products             -> ProductsListPage
     /products/:productId  -> ProductDetailPage
     /orders                -> OrdersListPage
     /orders/:orderId       -> OrderDetailPage
   ```
3. **Type route params explicitly.** Read `useParams<{ productId: string }>()` and validate/
   parse (e.g. `productId` must be present) before passing to a query hook — never assume
   the param exists or is a valid UUID without a check.
4. **Data loading goes through TanStack Query hooks inside the route component**, not
   React Router loaders, unless the project later standardizes on the data router's
   `loader`/`action` APIs — don't mix both strategies for the same data.
5. **Route guards for auth** live in a wrapper component (`<RequireAuth>`) used at the
   layout-route level, redirecting unauthenticated users to `/login`. This is a UX
   convenience — real authorization is still enforced by Supabase RLS (see
   `supabase-auth`).
6. **Lazy-load route components** (`React.lazy` + route-level code splitting) for large,
   rarely-visited pages (reports, PDF export views) to keep the initial bundle small; keep
   frequently used pages (dashboard, products, orders) eagerly loaded.
7. **Navigation uses `<Link>`/`useNavigate`**, never `window.location` or a raw `<a>` for
   in-app navigation (breaks SPA routing and loses state).
8. **Confirm before navigating away from unsaved form state** (e.g. mid-edit on an order or
   import receipt) using a blocker, not a silent discard.
9. **404 / not-found route** exists at the top level and per meaningful nested section
   (e.g. product not found shows a proper empty/error state, not a blank page).

## Anti-patterns to reject in review

- Fetching data with `useEffect` inside a route component instead of a query hook.
- Route param used directly in a query without validating it's defined/well-formed.
- Business logic (e.g. computing order totals) written inline in a route component instead
  of delegated to the feature.
