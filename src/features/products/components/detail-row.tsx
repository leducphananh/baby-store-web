import type { ReactNode } from 'react'

/** Label / value row used across the product detail cards. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2.5 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-foreground">{isEmpty ? '—' : value}</dd>
    </div>
  )
}
