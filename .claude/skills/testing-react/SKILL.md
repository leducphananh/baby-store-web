---
name: testing-react
description: Testing strategy for this project — what to unit test, component test, and integration test, and what to avoid testing. Apply when adding tests or deciding test coverage for new code.
---

# Testing strategy

## Apply when
Adding tests for new code, or deciding what level of test a change needs. (Note: no test
runner is installed yet in this repo — when a phase needs tests, add Vitest + React Testing
Library, matching the existing Vite setup, rather than a heavier alternative.)

## Rules

1. **Unit test pure utility/domain functions** — the highest-value, cheapest tests in this
   project: VND formatting, FEFO batch sorting, stock-availability calculation, expiry/
   low-stock threshold logic, Zod schema validation (valid + invalid cases). These are pure
   functions with no React/network dependency — test them directly, no rendering involved.
2. **Component test important reusable components** — the shared building blocks in
   `src/components/` (DataTable, ConfirmDialog, form field wrappers) and complex feature
   components with real logic (e.g. an order line-item editor that computes totals) using
   React Testing Library. Test behavior from the user's perspective (render, interact via
   `userEvent`, assert on visible output) — not simple presentational components with no
   logic.
3. **Integration test critical business flows end-to-end within the app** (still mocking
   Supabase at the network boundary): creating an order and seeing stock decrease, recording
   an import receipt and seeing a new batch appear, a low-stock alert appearing when
   inventory crosses the threshold. These catch wiring bugs unit tests can't.
4. **Avoid testing implementation details.** Don't assert on internal state, hook call
   counts, or exact class names/DOM structure. Assert on what a user would see/do: visible
   text, form validation messages, disabled/enabled states, navigation results.
5. **Mock Supabase at the service (`api/`) boundary for component/integration tests** — don't
   hit a real database in tests, and don't mock deep inside the Supabase client's internals.
6. **Don't test third-party/library behavior** (shadcn primitives, React Hook Form's own
   validation engine) — trust it; test your usage of it (your schema, your submit handler).
7. **Every new domain utility function ships with tests for its edge cases**, especially
   money rounding, date-boundary logic (expiry exactly today), and empty/zero-quantity
   cases — these are exactly where off-by-one and floating-point bugs hide.
8. **Don't chase 100% coverage.** Skip trivial passthrough components and pure type
   definitions; prioritize business-critical and reusable-shared code.

## Anti-patterns to reject in review

- A test asserting a component's internal `useState` value via a hack instead of asserting
  rendered output.
- A "unit test" that actually hits the real Supabase project.
- Snapshot tests of large component trees with no assertion about actual behavior.
- New money/date utility function shipped with zero edge-case tests.
