---
name: react-typescript
description: Core React + TypeScript component-writing rules for this project — functional/hooks-only components, minimal useEffect, no business logic in UI, composition over giant components. Apply whenever writing or editing a .tsx component.
---

# React + TypeScript component rules

## Apply when
Writing, editing, or reviewing any React component (`.tsx`) in this project.

## Rules

1. **Functional components only.** No class components, ever.
2. **Hooks-based architecture.** Local UI state via `useState`/`useReducer`; shared logic
   via custom hooks (`useProductForm`, `useOrderTotals`), not inheritance or HOCs.
3. **Avoid unnecessary `useEffect`.** Before writing one, check: can this be computed
   during render instead? Is this actually synchronizing with an external system
   (subscription, DOM API, non-React widget)? If it's just deriving state from props/state,
   compute it inline or with `useMemo`, don't `useEffect` + `setState`.
   - Never use `useEffect` to fetch data — that's TanStack Query's job (see `react-query`).
   - Never use `useEffect` to reset local state on prop change if a `key` prop remount
     solves it more simply.
4. **No business logic inside UI components.** Formatting VND, computing stock available,
   deciding FEFO batch order, validating a form shape — these live in `utils/`, `schemas/`,
   or a hook, not inline in JSX-adjacent code. A component orchestrates; it doesn't decide.
5. **Prefer composition over configuration.** Instead of one `<ProductForm mode="create" |
   "edit" | "readonly">` with internal branching, prefer composing smaller pieces, or at
   minimum keep mode-branches thin and delegate the differing behavior to props/callbacks.
6. **Avoid giant components.** If a component's JSX return exceeds ~150 lines, or it mixes
   more than one concern (fetching + form + table + modal), split it: extract subcomponents,
   extract a hook for the logic, extract the pure calculations to `utils/`.
7. **Props over context for one level.** Reach for context/Zustand only when state is
   genuinely shared across distant parts of the tree (auth user, sidebar collapse), not to
   avoid prop drilling two levels deep.
8. **Event handlers are named functions**, not inline arrow soup for anything non-trivial:
   `const handleDeleteProduct = () => {...}` not a 10-line inline arrow in JSX.
9. **Derived data uses `useMemo` only when the computation is actually expensive** or
   needed for referential stability (e.g. passed to a memoized child, or a query key). Don't
   wrap every derived value in `useMemo` "just in case" — the React Compiler (enabled in
   this project via the babel plugin) already handles most memoization; hand-written
   `useMemo`/`useCallback` should be rare and purposeful, not a default habit.
10. **Keys are stable, real IDs** (`product.id`), never array index for lists that can
    reorder, filter, or have items inserted/removed (product lists, order line items).

## Anti-patterns to reject in review

- `useEffect(() => { setTotal(items.reduce(...)) }, [items])` — compute `total` inline
  instead.
- A `ProductTable` component that also contains the Supabase fetch call and the VND
  formatting logic.
- A 400-line `OrderPage.tsx` that renders the header, the line-item table, the totals
  panel, and the payment dialog all inline.
