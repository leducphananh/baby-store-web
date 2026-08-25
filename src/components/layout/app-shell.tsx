import { Outlet } from 'react-router'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

/**
 * Root admin shell for every authenticated page: a persistent sidebar on
 * desktop (`lg:` and up), a header with a drawer trigger on tablet/mobile,
 * and the routed page content. See `responsive-design` for the breakpoint
 * rationale and `react-router` for where this sits in the route tree
 * (nested under `RequireAuth`).
 */
function AppShell() {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="mx-auto w-full max-w-(--breakpoint-2xl) flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { AppShell }
