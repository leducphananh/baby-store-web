---
name: supabase-auth
description: Supabase Auth conventions — session handling, protected routes, RLS as the real authorization boundary, key handling. Apply whenever touching login, session state, or access control.
---

# Supabase Auth conventions

## Apply when
Implementing login/logout, session handling, protected routes, or any access-control logic.

## Rules

1. **RLS is the real authorization boundary.** Every frontend check (hiding a "Delete"
   button from a non-admin, redirecting unauthenticated users) is UX convenience only —
   assume any request can bypass the UI. Every table with sensitive data (inventory cost,
   supplier pricing, customer data) has RLS policies enforcing who can read/write it.
2. **Never expose the service role key to the browser.** Only the anon/publishable key goes
   into `VITE_`-prefixed env vars. Anything requiring the service role key (bulk admin ops,
   trusted server logic) runs in a Supabase Edge Function or other backend, not client code.
3. **Session state comes from Supabase's own session management**
   (`supabase.auth.getSession()`, `supabase.auth.onAuthStateChange`), wrapped once in an
   `AuthProvider` (`src/providers/`) exposing the current user via context — don't
   re-implement session persistence by hand.
4. **`RequireAuth` route wrapper** redirects unauthenticated users to `/login`, used at the
   layout-route level (see `react-router`). Route guarding is one wrapper, not repeated
   per-page checks.
5. **Role/permission checks (if roles exist, e.g. admin vs. staff) read from the
   authenticated user's claims/profile**, fetched once and exposed via the auth context —
   don't infer role from client-side heuristics.
6. **Don't fetch or cache anything user-specific before auth is resolved.** Gate data
   queries (`enabled: !!user`) so a `useProducts()` call doesn't fire with no session.
7. **Sign-out clears both the Supabase session and the React Query cache**
   (`queryClient.clear()`) so no stale, previously-authenticated data lingers for the next
   user on a shared machine.
8. **Never log or display raw auth tokens/JWTs** in the UI or console, even for debugging.

## Anti-patterns to reject in review

- A "delete supplier" button hidden via `if (user.role === 'admin')` with no matching RLS
  policy on the `suppliers` table — the API is still open to any authenticated request.
- Service role key referenced anywhere under `src/`.
- Auth state duplicated into Zustand and manually kept in sync with Supabase's session
  events instead of reading Supabase's session directly through the auth provider.
