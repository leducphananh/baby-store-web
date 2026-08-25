import { Outlet } from 'react-router'

/**
 * Root admin shell — the layout route element wrapping every page.
 *
 * Deliberately minimal for now: a fixed top bar with the app name and the
 * routed page content below it. No sidebar/navigation yet, because there
 * are no feature routes to link to (see CLAUDE.md §14, phase discipline —
 * navigation gets built alongside the first real feature, not guessed at
 * here). Desktop-first, stays usable on tablet (see `responsive-design`).
 */
function AppShell() {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-(--breakpoint-2xl) items-center px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Baby Store Management
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-(--breakpoint-2xl) px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

export { AppShell }
