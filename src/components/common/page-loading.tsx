import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shared page-loading skeleton — used while a page's primary query is
 * loading, instead of a blank screen or a spinner (see CLAUDE.md §8:
 * "no blank pages during loading (use skeletons)").
 */
function PageLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

export { PageLoading }
