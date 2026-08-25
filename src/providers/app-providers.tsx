import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'

/**
 * Composition root for every app-wide provider. Wraps the router (see
 * `src/app/app.tsx`), so anything rendered by any route has access to
 * TanStack Query and can trigger a toast.
 *
 * `AuthProvider` (Supabase Auth session context, see `supabase-auth`) will
 * be added here, wrapping `children`, once the auth phase is implemented —
 * intentionally not built yet per phase discipline (CLAUDE.md §14).
 */
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}

export { AppProviders }
