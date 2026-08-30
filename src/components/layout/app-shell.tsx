import { Outlet } from 'react-router'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { HelpButton } from '@/features/help/components/help-button'
import { TourOverlay } from '@/features/help/components/tour-overlay'
import { WelcomeInvitation } from '@/features/help/components/welcome-invitation'

/**
 * Root admin shell for every authenticated page: a persistent sidebar on
 * desktop (`lg:` and up), a header with a drawer trigger on tablet/mobile,
 * and the routed page content. See `responsive-design` for the breakpoint
 * rationale and `react-router` for where this sits in the route tree
 * (nested under `RequireAuth`).
 *
 * The shell itself is pinned to exactly the viewport height (`h-svh`, not
 * `min-h-svh`) with `<main>` as the one scrolling region — on a long page
 * the sidebar and header must stay put while only the content scrolls, not
 * scroll away with the rest of the document (the previous `min-h-svh`
 * let the whole page grow taller than the viewport, so everything —
 * sidebar included — scrolled together).
 *
 * `<main>` also needs `min-h-0`: a flex item's default `min-height: auto`
 * refuses to shrink below its content's intrinsic height, so on a tall page
 * (e.g. Product Detail) `<main>`'s own `overflow-y-auto` wasn't enough —
 * without `min-h-0` the flex layout still let it push the document taller
 * than the viewport, producing a second, outer page-level scrollbar
 * alongside `<main>`'s own one.
 */
function AppShell() {
  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-(--breakpoint-2xl) px-4 py-6 sm:px-6">
            <Outlet />
          </div>
        </main>
      </div>

      <HelpButton />
      <TourOverlay />
      <WelcomeInvitation />
    </div>
  )
}

export { AppShell }
