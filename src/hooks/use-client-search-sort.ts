import { useMemo, useState } from 'react'

import type { DataTableSorting } from '@/components/common/data-table'

export type SortComparators<T> = Record<string, (a: T, b: T) => number>

/**
 * Client-side search + sort for an already-fully-fetched, small, bounded
 * row array — the counterpart to `DataTable`'s server-driven
 * `sorting`/`onSortingChange` props, for the case `table-data-grid` rule 3
 * explicitly carves out ("small, bounded lookup tables ... may filter/sort
 * client-side"). Only reach for this when the whole dataset is already in
 * memory and realistically bounded (e.g. one import receipt's line items or
 * batches) — anything that can grow (products, orders) stays server-driven
 * per rule 2, going through a query key instead.
 *
 * No debounce on `search`: rule 4's debounce requirement is for search that
 * triggers a network request per keystroke; this filters an in-memory array,
 * so there's nothing to debounce.
 *
 * `sorting` starts `null` — the caller's `rows` order (e.g. FEFO, oldest
 * line first) is the sensible default and stays untouched until the viewer
 * explicitly picks a column (`table-data-grid` rule 8).
 */
export function useClientSearchSort<T>(
  rows: T[],
  matches: (row: T, query: string) => boolean,
  comparators: SortComparators<T>,
) {
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<DataTableSorting | null>(null)

  const result = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query ? rows.filter((row) => matches(row, query)) : rows

    const comparator = sorting ? comparators[sorting.id] : undefined
    if (!comparator) return filtered

    const sorted = [...filtered].sort(comparator)
    return sorting?.desc ? sorted.reverse() : sorted
  }, [rows, search, sorting, matches, comparators])

  return { search, setSearch, sorting, setSorting, rows: result }
}
