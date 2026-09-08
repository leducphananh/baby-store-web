import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jest-dom matchers (toBeInTheDocument, toBeEnabled, toHaveAccessibleName, ...)
// registered on Vitest's `expect`.
import '@testing-library/jest-dom/vitest'

// With `globals: false`, `@testing-library/react` cannot auto-register its
// own `afterEach(cleanup)` (it only does so when `afterEach` is a global), so
// unmount the rendered tree between tests here. This is the one genuinely
// global piece of test setup — feature-specific mocks belong in their own
// test files, never here.
afterEach(() => {
  cleanup()
})
