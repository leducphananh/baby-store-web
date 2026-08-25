---
name: supabase-react
description: How Supabase is wired into this React app — client setup, service-function pattern, keeping components decoupled from the SDK. Apply whenever integrating Supabase with a feature or component.
---

# Supabase + React integration

## Apply when
Wiring Supabase into a feature, setting up the client, or reviewing where Supabase calls
live.

## Rules

1. **One Supabase client instance**, created once in `src/lib/supabase-client.ts`, imported
   everywhere it's needed — never instantiate `createClient` inside a component or hook.
   ```ts
   // src/lib/supabase-client.ts
   import { createClient } from '@supabase/supabase-js'
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY,
   )
   ```
2. **Components never import `supabase` directly.** All calls go through a feature's
   `api/` service functions, called from `hooks/` via TanStack Query. This keeps components
   testable and keeps the SDK swappable/mockable at one seam.
   ```ts
   // features/products/api/get-products.ts
   export async function getProducts(filters: ProductFilters): Promise<Product[]> {
     const { data, error } = await supabase.from('products').select('*').match(filters)
     if (error) throw error
     return data.map(toProduct) // map raw row -> domain type
   }
   ```
3. **Map raw Supabase rows to domain types at the service boundary** (`toProduct`,
   `toOrder`), so the rest of the app works with clean domain models, not raw snake_case DB
   rows with nullable-everything columns.
4. **Errors from Supabase calls are thrown, not swallowed**, so React Query's `isError`/
   `error` state can surface them — don't `console.log(error)` and return `null` silently.
5. **Env vars are `VITE_`-prefixed and only ever the anon/publishable key on the client**
   (see `supabase-auth` for the key/security boundary). Document required vars in
   `.env.example`.
6. **Realtime subscriptions (if used)** are set up inside a dedicated hook that cleans up
   the channel on unmount (`supabase.removeChannel`), and push updates into the React Query
   cache (`queryClient.setQueryData`/`invalidateQueries`), not into ad-hoc local state.
7. **Batch related calls in the service layer**, not the component — e.g. creating an
   import receipt plus its line items plus the resulting batches is one `api/` function
   (ideally one RPC/transaction), not three separate calls triggered from a component.
8. **Prefer a Postgres function/RPC for multi-step writes that must be atomic** (e.g.
   "receive import receipt → create batches → adjust inventory") over sequential client-side
   calls that can partially fail.

## Anti-patterns to reject in review

- `supabase.from('products').select()` inside a `.tsx` component body.
- A service function that returns raw DB rows with `snake_case` fields to the UI layer.
- Multiple sequential client calls for what should be one atomic server-side operation,
  risking partial writes (e.g. batch created but inventory not adjusted).
