import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'

import { createTestQueryClient } from '@/test/query-client'

type RenderWithProvidersOptions = {
  /** Initial `MemoryRouter` entry. Defaults to `/`. */
  route?: string
  /** Override the test QueryClient. Defaults to a fresh `createTestQueryClient()`. */
  queryClient?: QueryClient
  /** Passed straight through to RTL's `render` (e.g. `container`). */
  renderOptions?: Omit<RenderOptions, 'wrapper'>
}

/**
 * Render a component with the providers most tests actually need: a fresh
 * test QueryClient and an in-memory router.
 *
 * Deliberately does NOT include `AuthProvider` (it subscribes to Supabase
 * Auth on mount — a component that needs auth should mock `@/providers/auth-provider`
 * or wrap its own provider), `Toaster`, or `TooltipProvider`. Keep this
 * helper small; extend it when a real test needs more.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', queryClient = createTestQueryClient(), renderOptions }: RenderWithProvidersOptions = {},
): RenderResult & { queryClient: QueryClient } {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient }
}
