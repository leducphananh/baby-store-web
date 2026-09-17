---
name: zustand
description: Rules for when and how to use Zustand in this project — client/UI state only, never server-state cache. Apply whenever adding global state or reaching for Zustand.
---

# Zustand — client/UI state only

## Apply when
Considering adding global/shared state, or reviewing a proposed Zustand store.

## Rules

1. **Zustand is for client/application UI state only.** Legitimate uses:
   - Authenticated user/session context (if not fully handled by a Supabase Auth
     provider/context already).
   - Filters or search terms shared across multiple screens (e.g. a global date-range
     filter used by several report pages).
   - Sidebar collapsed/expanded state, active dashboard tab, other pure UI state.
   - App-wide preferences (e.g. selected store branch, if multi-branch).
2. **Zustand is never a cache for server data.** Product lists, order data, inventory
   counts, report numbers — these belong in TanStack Query. If a value comes from Supabase,
   it does not belong in a Zustand store, even "temporarily" or "for convenience."
3. **One store per concern**, not one giant global store. E.g. `useUiStore` for
   sidebar/layout, `useFiltersStore` for shared report filters — don't merge unrelated state
   into one blob.
4. **Keep stores flat and serializable-ish.** No class instances, no functions that close
   over React component state.
5. **Selectors, not whole-store destructuring**, in components that only need part of the
   state, to avoid unnecessary re-renders:
   ```ts
   const isSidebarOpen = useUiStore((s) => s.isSidebarOpen)
   ```
   not `const { isSidebarOpen, ...everythingElse } = useUiStore()`.
6. **Actions live inside the store**, not as separate loose functions mutating store state
   from outside:
   ```ts
   export const useUiStore = create<UiState>((set) => ({
     isSidebarOpen: true,
     toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
   }))
   ```
7. **Persist only what genuinely needs to survive a reload** (e.g. sidebar collapsed state),
   via the `persist` middleware, scoped to that one store — don't persist auth tokens here
   (Supabase Auth handles its own session persistence).
8. **Before adding a new store, ask: is this actually server data I'm about to duplicate?**
   If yes, it's a React Query hook, not a store.

## Anti-patterns to reject in review

- `useProductStore` holding a `products: Product[]` array populated from a Supabase fetch.
- Syncing React Query data into Zustand via `useEffect` "so other components can read it
  without prop drilling" — use the query hook directly instead.
- A single `useAppStore` with 30 unrelated fields (auth, filters, sidebar, form drafts, ...).
