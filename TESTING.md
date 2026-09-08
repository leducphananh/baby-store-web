# Testing

Established in Phase 10.1 — a small, reliable foundation. This is **not**
feature coverage; it is the infrastructure future test phases build on.

## Stack

| Purpose | Package |
| --- | --- |
| Test runner | `vitest` (reuses the Vite pipeline) |
| DOM environment | `jsdom` |
| Component rendering | `@testing-library/react` (+ `@testing-library/dom`) |
| Matchers | `@testing-library/jest-dom` (`/vitest` entry) |
| Interactions | `@testing-library/user-event` |

All are `devDependencies`. **MSW is not installed** — see "Supabase strategy".
No coverage tooling yet (Phase 10.9). No Playwright/Cypress (Phase 10.6).

## Commands

```bash
yarn test          # run once, exit non-zero on failure (CI-safe)
yarn test:watch    # interactive watch mode
yarn typecheck     # tsc -b — also type-checks test files and vitest.config.ts
yarn lint          # eslint . — test paths keep lint clean
```

## Config

- `vitest.config.ts` — standalone, picked up in preference to `vite.config.ts`
  so `vite dev` / `vite build` are untouched. It shares only
  `@vitejs/plugin-react` and the `@/` alias with the app build; the
  React-Compiler babel pass and Tailwind plugin are build-time concerns with
  no value in jsdom tests.
- `environment: 'jsdom'`, `globals: false` (import `describe/it/expect/vi`
  explicitly), `setupFiles: ['./src/test/setup.ts']`.
- `clearMocks: true` + `restoreMocks: true` for per-test isolation;
  **not** `mockReset` (that would wipe `vi.mock` factory implementations).
- `test.env` provides deterministic, obviously-fake `VITE_SUPABASE_*` values
  so a stray transitive import of the real `@/lib/supabase` can't crash on
  module load. **No test uses the real client.**
- `src/test/setup.ts` — jest-dom matchers + an explicit `afterEach(cleanup)`
  (RTL can't auto-register it with `globals: false`). Nothing else global.

## File convention

Colocated: `thing.ts` → `thing.test.ts`, `Thing.tsx` → `Thing.test.tsx`.
No `__tests__/` directories. Shared helpers live in `src/test/`.

## Helpers (`src/test/`)

- `render.tsx` — `renderWithProviders(ui, { route?, queryClient?, renderOptions? })`.
  Wraps in a **fresh** test `QueryClient` + `MemoryRouter`. Deliberately no
  `AuthProvider`, `Toaster`, or `TooltipProvider` — add per-test when needed.
- `query-client.ts` — `createTestQueryClient()`: `retry: false` for queries
  and mutations so failures surface immediately. A **test** default; it does
  not describe or change the production Phase 9.2 retry policy. Fresh client
  per render — no global `clear()`.

## QueryClient strategy

Never import the production singleton (`@/lib/query-client`) into a test.
`renderWithProviders` creates a new `createTestQueryClient()` per render;
pass `{ queryClient }` only when a test needs to inspect the same instance.

## Router strategy

`MemoryRouter` via `renderWithProviders({ route })`. Never `BrowserRouter`,
never the production `router`. For route params / navigation assertions,
set `route` and read `window.location` or assert on rendered output.

## Auth strategy

Tests opt in to the auth state they need — there is **no global "everyone is
authenticated"**. A component that reads `useAuth()`:

- mock `@/providers/auth-provider` (`vi.mock`) to return a fixed `AuthState`, or
- render your own `<AuthContext.Provider value={...}>` wrapper.

Never let the real `AuthProvider` mount in a unit/component test — it
subscribes to Supabase Auth.

## Zustand strategy

Do not mock Zustand. If a test mutates a module-global store, reset it in
`afterEach` via the store's real API (`useXStore.setState(useXStore.getInitialState())`
or an explicit reset action). Production store code is not changed for tests.

## Supabase strategy — three layers

1. **Component / hook tests** — mock the feature's `api/` module or hook
   (`vi.mock('@/features/x/api/get-x')`). The database interaction is not
   under test; the wiring is.
2. **`api/` module unit tests** — mock `@/lib/supabase` with a **small local
   fake** modelling only the exact chain that module calls
   (`from().select().order()` and no more). See
   `src/features/categories/api/get-all-categories.test.ts`. Never build a
   generic chainable "fake Supabase" — it becomes an unmaintainable second
   client.
3. **Integration / RPC / RLS / concurrency** — a disposable database, Phase
   10.4+. Not in this foundation.

**No unit or component test contacts live Supabase, mutates a remote row,
uploads a Storage object, or creates a real auth user.**

## Storage / PDF / charts

- Storage: mock upload / signed-URL / failure at the feature `api/` boundary
  (Phase 10.3). No Storage emulation.
- `@react-pdf/renderer`: stays dynamically imported in production. Don't
  import it in test setup; mock the dynamic-export boundary in future PDF
  tests.
- Recharts: stays async in production. Future report tests assert the
  semantic summary / table alternative / data passed to the chart boundary,
  not Recharts internals.

## Selectors

Prefer `getByRole` / `getByLabelText` / `getByText` — this doubles as a
regression signal for the Phase 9.5 accessibility work. `data-testid` only
when there is no stable accessible or user-visible handle; do not add test
IDs to production components just to select them.

## Time & timezone

No global fake timers, no globally frozen clock. A test that needs time
control uses `vi.useFakeTimers()` + `vi.setSystemTime(...)` locally and
restores real timers after. The business timezone is `Asia/Ho_Chi_Minh`;
future business-date tests exercise the timezone-aware utilities/SQL
explicitly rather than forcing the whole process into a fake zone.

## Determinism

Explicit fixture values only — no `Math.random()`, no `faker` randomness, no
`Date.now()` as identity. No broad JSX snapshot tests.

## Foundation tests (Phase 10.1)

| File | Proves |
| --- | --- |
| `src/utils/currency.test.ts` | plain-TS tests run (pure formatting util) |
| `src/components/common/empty-state.test.tsx` | RTL + jest-dom, text-based assertions |
| `src/components/common/error-state.test.tsx` | `user-event` real click, accessible-role selectors |
| `src/components/common/back-link.test.tsx` | `renderWithProviders` + `MemoryRouter` |
| `src/features/categories/api/get-all-categories.test.ts` | `api/` module testable with the Supabase boundary mocked, no network |
| `src/features/categories/hooks/use-all-categories.test.tsx` | test `QueryClient` strategy, loading → success, `api/`-boundary mock |
