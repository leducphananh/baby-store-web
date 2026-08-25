---
name: react-project-architecture
description: Feature-based folder structure and layering rules (UI / hooks / query / mutation / service / schema / types / utils) for this project. Apply when creating new files, new features, or deciding where code belongs.
---

# Project architecture — feature-based layering

## Apply when
Deciding where a new file belongs, scaffolding a new feature/domain, or reviewing whether
existing code is in the right layer.

## Target structure

```
src/
  app/            # root component, router wiring, top-level providers composition
  components/     # shared, feature-agnostic UI (DataTable, ConfirmDialog, PageHeader...)
  features/       # one folder per business domain (see below)
  hooks/          # shared, feature-agnostic hooks (useDebounce, useMediaQuery...)
  lib/            # framework glue: supabase client, query client, generic utils
  providers/      # top-level context providers (auth, theme)
  routes/         # route components — thin, compose features, no business logic
  types/          # cross-feature shared types only (e.g. Money, PaginationParams)
```

```
src/features/<domain>/
  api/            # Supabase-calling service functions: getProducts, createProduct...
  components/     # UI specific to this feature
  hooks/          # useProducts, useCreateProduct — wrap TanStack Query around api/
  schemas/        # Zod schemas: form input + API payload validation
  types/          # domain models, discriminated unions specific to this feature
  utils/          # pure helpers specific to this feature (e.g. FEFO batch sort)
```

Example domains: `products`, `categories`, `suppliers`, `import-receipts`, `invoices`,
`batches`, `inventory`, `customers`, `orders`, `payments`, `reports`, `alerts`.

## Layer responsibilities (strict)

| Layer | Responsibility | Must NOT do |
|---|---|---|
| `api/` (service) | Call Supabase, shape raw rows into domain types | Contain React, contain UI state |
| `hooks/` (query/mutation) | Wrap `api/` functions in `useQuery`/`useMutation`, own query keys, cache config | Contain JSX, contain validation logic |
| `schemas/` | Zod shape + validation rules, inferred TS types for form input | Call network, import React |
| `types/` | Domain model shape, discriminated unions | Contain logic |
| `utils/` | Pure functions (formatting, sorting, calculations) | Call network, use hooks |
| `components/` | Render UI from props/hooks | Call Supabase directly, own business rules |

## Rules

1. **One-way dependency:** `components` → `hooks` → `api`. A component never imports `api/`
   directly; it goes through a hook. A hook never imports another feature's `components/`.
2. **Cross-feature reuse** goes through the other feature's `hooks/` or `types/`, not its
   `components/` or `api/` internals. If two features need the same low-level thing, promote
   it to `src/lib/` or `src/components/`.
3. **Routes are thin.** A file under `src/routes/` composes feature components and handles
   route-level concerns (params, redirects); it does not contain form logic or table logic.
4. **Before adding a new folder or pattern, check what already exists.** If `features/products`
   already has an `api/get-products.ts` pattern, follow it for `features/orders` rather than
   inventing a different shape (e.g. a class-based service).
5. **New shared abstraction bar:** promote something from a feature to `src/components/` or
   `src/lib/` only after it's needed by a second feature, not preemptively.
6. **Path aliases:** once configured (`@/` → `src/`), use them for cross-top-level imports;
   within a feature, relative imports are fine.

## Anti-patterns to reject in review

- A component importing `@supabase/supabase-js` and calling `.from()` directly.
- Business logic (e.g. low-stock threshold check) duplicated in both a component and a hook.
- A `features/shared/` grab-bag folder — put it in `src/components|hooks|lib` instead, named
  for what it does.
- A new feature that doesn't follow the `api/components/hooks/schemas/types/utils` shape
  without a documented reason.
