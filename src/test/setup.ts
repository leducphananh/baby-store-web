import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jest-dom matchers (toBeInTheDocument, toBeEnabled, toHaveAccessibleName, ...)
// registered on Vitest's `expect`.
import '@testing-library/jest-dom/vitest'

// jsdom has no `ResizeObserver` at all — several Radix UI primitives (e.g.
// `Switch`'s size-tracking, `Select`'s positioning) call it unconditionally
// on mount, which throws `ReferenceError` with no stub present. This is a
// genuine jsdom environment gap, not feature-specific mocking, so it lives
// here alongside the other one global setup concern (RTL's `cleanup`).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

// With `globals: false`, `@testing-library/react` cannot auto-register its
// own `afterEach(cleanup)` (it only does so when `afterEach` is a global), so
// unmount the rendered tree between tests here. This is the one genuinely
// global piece of test setup — feature-specific mocks belong in their own
// test files, never here.
afterEach(() => {
  cleanup()
})
