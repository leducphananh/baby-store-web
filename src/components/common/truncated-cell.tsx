import { cn } from '@/lib/utils'

/**
 * Single-line ellipsis truncation for a table cell whose content can run
 * long (product/category/supplier names, ...) — visual only, the underlying
 * value is never altered. The full text stays reachable via the native
 * `title` attribute (hover tooltip) since the project has no dedicated
 * Tooltip primitive yet (see `table-data-grid`, `reusable-components`: reuse
 * the platform rather than add a tooltip library for this).
 *
 * `TableCell` defaults to `whitespace-nowrap` with no width cap, so a table
 * grows wide and scrolls horizontally instead of wrapping — this component
 * caps just the column it's used in via `max-width`, without touching that
 * shared default or any other column/table (opt in per-column, per
 * `table-data-grid` — not every cell should be truncated).
 *
 * Not for genuinely multi-line preview content (an address, a notes
 * excerpt) — that calls for `line-clamp-2`-style treatment instead, applied
 * locally where that specific shape of content is shown.
 */
export function TruncatedCell({
  value,
  maxWidth = 'max-w-48',
  className,
}: {
  value: string | null | undefined
  /** A Tailwind max-width class, e.g. `"max-w-48"` (the default) or `"max-w-64"`. */
  maxWidth?: string
  className?: string
}) {
  const text = value?.trim()
  if (!text) return <span className="text-muted-foreground">—</span>

  return (
    <span className={cn('block truncate', maxWidth, className)} title={text}>
      {text}
    </span>
  )
}
