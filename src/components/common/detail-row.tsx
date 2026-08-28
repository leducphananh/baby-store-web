import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Label / value row for read-only detail views (product detail, import
 * receipt detail, ...). Renders inside a `<dl>`. An empty value shows "—"
 * so a missing field never looks like a broken row.
 */
export function DetailRow({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-2 border-b py-2.5 text-sm last:border-0',
        className,
      )}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-foreground">{isEmpty ? '—' : value}</dd>
    </div>
  )
}
