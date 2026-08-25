import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/providers/auth-provider'

/**
 * Composition root for every app-wide provider. Wraps the router (see
 * `src/app/app.tsx`), so anything rendered by any route has access to
 * TanStack Query, the auth session, and can trigger a toast.
 *
 * `AuthProvider` sits inside `QueryClientProvider` since the profile query
 * it enables (`useProfile`) needs the query client to already be available.
 */
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export { AppProviders }
