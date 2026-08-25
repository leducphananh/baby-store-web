import { Loader2 } from 'lucide-react'

/**
 * Full-viewport loading state for app-wide gates (auth session
 * initialization) — distinct from `PageLoading`, which skeletons a single
 * page's content once the shell is already showing. Used by `RequireAuth`/
 * `PublicOnlyRoute` while the initial Supabase session check is in flight,
 * so the app never flashes the login form or protected content before the
 * real auth state is known (see CLAUDE.md §8, task: "prevent layout
 * flickering while session initialization is running").
 */
function FullPageLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background" aria-busy="true" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Đang tải...</span>
    </div>
  )
}

export { FullPageLoading }
