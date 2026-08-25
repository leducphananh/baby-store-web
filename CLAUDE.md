# CLAUDE.md — Baby Store Management Web App

Always-on project rules. Detailed, topic-specific rules live in `.claude/skills/*/SKILL.md` —
Claude Code loads a skill's full instructions when the task matches it. This file is the
short version that must never be forgotten, even when no skill fires. Sections marked
**[always]** apply to every single change, no exceptions.

This file absorbs the project's "master prompt" for engineering discipline. It is not
copied verbatim anywhere else — its substance is split between this file (process/priority
rules that must always be active) and the relevant skills (technical detail). If you were
handed the master prompt directly, treat this file + the skills index in §12 as its
authoritative, de-duplicated home.

## 1. Project overview

Internal admin/management web app for a baby-products (diapers, formula/milk) retail store.
Not a public storefront — it is a back-office tool used by store staff to manage catalog,
inventory, suppliers, imports, orders, payments, and reporting.

Core domains: product categories, products, product images, units/packaging, origin,
suppliers, import receipts, VAT/red invoices, product batches, manufacture/expiry dates,
inventory + inventory transactions, customers, orders, payments, revenue/profit/inventory/
product-performance reports, expiring-product alerts, low-stock alerts, PDF order export.

**This is a business system of record, not a marketing site.** Correctness and
traceability of money, stock, and historical data outrank visual polish. When in doubt,
prioritize per §11.

## 2. Stack

Primary: React + TypeScript (strict) + Vite, React Router, TanStack Query, Zustand,
React Hook Form + Zod, Tailwind CSS + shadcn/ui, Supabase (DB, Auth, Storage).

Use the existing dependencies and architecture whenever possible. Do not introduce another
framework, another state-management library, another form library, or another data-fetching
library "because it's slightly nicer" — extend what's already chosen (see CLAUDE.md §2 in
its original form and `react-project-architecture`).

## 3. Before implementing any phase [always]

Do this, in order, before writing code for a new phase or feature — every time, even if a
similar phase was implemented before. Do not rely on assumptions from earlier phases if the
codebase may have changed since:

1. Read this file (CLAUDE.md).
2. Read the skills relevant to the phase (`.claude/skills/`).
3. Inspect the existing repository structure for the area you're touching.
4. Inspect existing architecture and conventions already used by similar features.
5. Inspect the database schema relevant to the feature (tables, columns, constraints).
6. Inspect existing TypeScript types/domain models for the entities involved.
7. Inspect RLS policies and Storage policies if the feature touches data access or files.
8. Reuse existing abstractions whenever appropriate — do not duplicate something that
   already exists (see `clean-code`, `react-project-architecture`).

Never blindly overwrite existing files. Never redesign working architecture without a
strong, stated reason. Never introduce an abstraction only because it's theoretically
reusable — see `clean-code` on justified abstraction.

## 4. Directory rules

```
src/
  app/            # app shell: root component, router setup, providers wiring
  components/     # shared, feature-agnostic UI (Button, DataTable, Dialog, ...)
  features/       # one folder per business domain — see below
  hooks/          # shared, feature-agnostic hooks
  lib/            # framework glue: supabase client, query client, utils
  providers/      # top-level React context/providers
  routes/         # route definitions / route components (thin, compose features)
  types/          # cross-feature shared types only
```

Each feature is self-contained:

```
src/features/products/
  api/            # supabase queries/mutations (service functions), one concern per file
  components/     # UI for this feature only
  hooks/          # useXQuery / useXMutation wrappers, feature-local hooks
  schemas/        # zod schemas (form + API validation)
  types/          # domain models, discriminated unions
  utils/          # pure helper functions (money, dates, FEFO ordering, etc.)
```

- A component never imports Supabase directly — it goes through a hook that wraps a query
  in `api/`.
- Cross-feature imports go through a feature's public surface, not deep relative paths into
  another feature's internals.
- Avoid deep relative imports (`../../../../lib/x`). Once a path alias is configured
  (`@/*` → `src/*`), use it for cross-top-level imports; relative imports stay fine within a
  feature.
- Before adding a new top-level folder or cross-cutting abstraction, inspect the existing
  structure first (§3). Extend what's there before inventing a parallel pattern.

## 5. Naming conventions

- Components: `PascalCase.tsx`, one primary component per file, filename matches export.
- Hooks: `useCamelCase.ts`, always start with `use`.
- Query/mutation hooks: `useProducts`, `useProduct(id)`, `useCreateProduct`,
  `useUpdateProduct`, `useDeleteProduct` — verb-based for mutations, noun-based for queries.
- Zod schemas: `productSchema`, `createProductInput`, `updateProductInput` — suffix `Schema`
  or `Input` consistently within a feature.
- Types/interfaces: `PascalCase`, domain nouns (`Product`, `ImportReceipt`, `StockBatch`).
  No `I` prefix.
- Files: kebab-case for non-component files (`format-currency.ts`, `product-service.ts`).
- Query keys: array form, feature-scoped, see `react-query` skill.
- Booleans: `isLoading`, `hasError`, `canEdit` — prefixed, never bare adjectives.
- Use real database status values in code (order status, payment status, receipt status) —
  never invent a frontend-only status the schema doesn't support.

## 6. TypeScript rules [always]

- `strict: true` always. No `any`, no `@ts-ignore`, no unsafe casting, no excessive
  non-null assertions (`!`). If a cast is genuinely unavoidable, add a one-line comment
  explaining why it's safe. See `typescript-strict`.
- Every domain entity (Product, Order, Batch, Invoice, Payment, ...) has an explicit type in
  the feature's `types/`, derived from Supabase generated types where possible, not
  hand-duplicated.
- Use discriminated unions for state that has real variants (order status, payment status,
  async UI state) instead of multiple optional booleans.
- Typed API/service boundaries: every exported service function has an explicit param and
  return type.

## 7. React rules

Functional components and hooks only. A page/route component primarily coordinates smaller
components and hooks — it does not contain large amounts of query logic, business logic, or
form logic inline. See `react-typescript`, `react-project-architecture` for the full rules
(avoid unnecessary `useEffect`, avoid giant components, avoid duplicated derived state,
avoid deep prop drilling, avoid premature memoization — the React Compiler is already
enabled in this project).

## 8. UI rules

- Desktop-first admin layout, responsive enough to remain usable on tablet (see
  `responsive-design`). Default language is **Vietnamese** for all user-facing text (see
  `vietnamese-business-ui`).
- Common page structure: title → short description → primary actions → filters →
  content/table. Keep this consistent across features.
- Money is always VND, integer only (never floating point), formatted through one shared
  `formatCurrencyVND()`-style utility — never manually formatted per component. Dates use
  shared `formatDate`/`formatDateTime` helpers in `dd/MM/yyyy`-style Vietnamese format —
  never duplicated per component, and never allowed to silently drift a date due to
  timezone conversion during rendering.
- Every important data screen handles loading, empty, error, and success states explicitly
  — no blank pages during loading (use skeletons), no raw Supabase error strings shown to
  users (translate to a useful Vietnamese message).
- Destructive actions always require confirmation that clearly identifies the affected
  entity. Prefer deactivate/archive over hard delete where the data model supports it; when
  a delete is blocked by a foreign-key relationship, surface a useful Vietnamese message,
  not a raw database error.
- Consistent shared primitives for buttons, dialogs, forms, table actions, badges, and
  notifications — see `reusable-components`, `tailwind-shadcn`.
- Semantic HTML, labeled forms, managed dialog focus, full keyboard operability, status
  never conveyed by color alone — see `accessibility`.

## 9. Supabase rules [always]

- Frontend uses only the Supabase URL and the anon/publishable key. The service role key,
  database password, and any private credential never reach client code or get committed.
- All Supabase access goes through dedicated `features/*/api/` service functions — never
  scatter direct `supabase.from(...)` calls across UI components.
- Respect RLS. **Frontend route/UI protection is not authorization** — real authorization
  is enforced by RLS policies or trusted backend functions. If a backend security gap is
  discovered (missing/incorrect RLS), report it explicitly; do not paper over it with a
  frontend-only check and call it solved.
- Prefer generated Supabase TypeScript types over hand-written table types once the schema
  exists.
- See `supabase-react`, `supabase-auth`, `supabase-storage`, `supabase-database`.

## 10. Database change discipline

Do not modify the database schema just because the frontend implementation would be more
convenient with a different shape.

If the existing schema genuinely cannot support a requirement:
1. Identify the specific limitation.
2. Propose the smallest schema change that addresses it.
3. Explain the migration impact and which modules/features are affected.
4. Explain backward-compatibility considerations.
5. **Report this before proceeding** — for additive, clearly-safe changes explicitly
   required by the phase, follow the project's migration workflow; for anything destructive
   (dropping tables, renaming important columns, changing historical relationships,
   cascade-deleting business data), **stop and report first** rather than proceeding.

Never casually drop tables, rename important columns, change historical relationships, or
cascade-delete business data (orders, payments, inventory transactions, batches). Preserve
backward compatibility whenever possible.

## 11. Highest priority principles

When rules conflict, prioritize in this order:

1. **Data integrity** — inventory, orders, and payments must never end up in an
   inconsistent or partially-written state.
2. **Security** — no secrets exposed, no RLS bypassed, no unsafe input trusted.
3. **Business correctness** — money, stock, and status logic must match real store
   operations (FEFO, historical pricing, real order statuses).
4. **Historical traceability** — purchase, batch, order, and payment history is never
   silently rewritten; corrections are new, traceable records.
5. **Maintainability** — consistent architecture and reusable, well-placed code.
6. **User experience** — clear Vietnamese admin UI, good loading/empty/error states.
7. **Performance** — pagination, server-side aggregation, avoiding N+1s.
8. **Development speed** — last, and never at the expense of 1–4.

Never sacrifice inventory/order/accounting correctness merely to finish a feature faster.
If current schema/architecture cannot guarantee correctness for a critical operation (e.g.
atomic order creation — see `domain-driven-frontend` and `supabase-database`), **stop the
risky implementation and report the problem** rather than shipping a fragile version.

## 12. Code quality rules

- Small, focused files. A component doing UI + fetching + business rules is a signal to
  split it (UI component + hook + service function).
- No dead code, no commented-out code, no duplicated business rules — a rule like "how do
  we compute stock available" or "how do we format VND" lives in exactly one place.
- Do not abstract code merely to reduce line count. Create a reusable abstraction only when
  multiple real use cases exist (see `clean-code`).
- **Before creating a new abstraction (component, hook, util, provider), search the
  existing codebase for something that already does it or is close to it.** Extend/reuse
  before duplicating.

## 13. Verification commands [always]

Run at the end of every phase, before considering it complete:

```bash
yarn lint          # eslint .
yarn typecheck      # tsc -b (type-only check, no bundling)
yarn build          # tsc -b && vite build — type errors fail the build
```

Add `yarn test` here once a test runner (Vitest + React Testing Library, per
`testing-react`) is actually installed — do not add a `test` script that points at a
runner that isn't installed yet. If a script that should exist is missing, add it (as was
done for `typecheck`), don't work around its absence silently.

**Never claim a phase is complete if lint/typecheck/build fails because of your own
changes.** Fix issues you introduced before reporting completion; pre-existing unrelated
failures should be reported, not silently fixed as a side quest unless trivial and asked
for.

## 14. Phase discipline

Implement only the requested phase. If asked for "Phase 3.1 — Categories CRUD", do not also
implement suppliers, products, or inventory unless strictly required by that phase. Keep
scope controlled — do not automatically begin the next phase after finishing one.

### Completion report

At the end of each phase, report:

1. Phase completed
2. Features implemented
3. Files created
4. Files modified
5. Database changes (or "none")
6. Dependencies added (or "none")
7. Important architecture decisions
8. Verification results (actual lint/typecheck/build/test output, not assumed)
9. Known limitations
10. Recommended next phase

Do not automatically begin the recommended next phase — wait to be asked.

## 15. Skills index

See `.claude/skills/` for topic-specific, actionable rules: React/TS fundamentals,
architecture, routing, TanStack Query, Zustand, forms, Tailwind/shadcn, Supabase
(client/auth/storage/database), security, performance, accessibility, responsive design,
error handling, testing, code review, clean code, domain-driven frontend (order lifecycle,
FEFO, batches, profit/COGS, duplicate-submission and cancellation handling), reusable
components, data tables, dashboard UI, PDF export, file upload, and Vietnamese business UI
conventions. When a task touches one of these areas, read the matching skill before writing
code — especially `domain-driven-frontend` and `supabase-database` for anything touching
orders, batches, inventory, or payments, where correctness matters most.
