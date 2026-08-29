import { useCallback, useMemo, useState } from 'react'

export type ColumnVisibilityConfig = {
  id: string
  /** Whether this column is shown when nothing has been persisted yet. */
  defaultVisible: boolean
  /** Never hidden, and never offered as a toggle (e.g. a table's Actions column). */
  alwaysVisible?: boolean
}

type StoredVisibility = Record<string, boolean>

function readStoredVisibility(storageKey: string): StoredVisibility {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

    // Only keep boolean entries — anything else is stale/invalid shape from
    // an older version of this preference and must not break the table.
    const result: StoredVisibility = {}
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'boolean') result[id] = value
    }
    return result
  } catch {
    // Corrupt JSON, storage disabled, etc. — fall back to defaults rather
    // than throwing (this is a cosmetic preference, never load-bearing).
    return {}
  }
}

function writeStoredVisibility(storageKey: string, value: StoredVisibility): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Storage disabled/full — the preference just won't persist this time.
  }
}

/**
 * Per-viewer, localStorage-backed column visibility for a `DataTable`
 * (`table-data-grid`). Persists only the columns the viewer has explicitly
 * toggled away from their default, keyed by stable column `id` — never
 * translated header text — so:
 * - a column newly added to the page (not yet in old stored JSON) falls
 *   back to its own `defaultVisible` rather than being hidden or crashing,
 * - a column removed from the page is simply never read back,
 * - `alwaysVisible` columns (the Actions column) can never be hidden, even
 *   from stale/tampered storage.
 *
 * This is plain client-only UI state — not a Supabase-persisted preference,
 * not React Query cache (CLAUDE.md §10) — same rationale as `useUiStore`'s
 * sidebar-collapse flag, but scoped to one table rather than app-wide, so a
 * plain `useState` + localStorage pair is the smallest fit rather than
 * routing it through the shared Zustand store.
 */
export function useColumnVisibility(storageKey: string, columns: ColumnVisibilityConfig[]) {
  const [overrides, setOverrides] = useState<StoredVisibility>(() => readStoredVisibility(storageKey))

  const visibility = useMemo(() => {
    const map: StoredVisibility = {}
    for (const column of columns) {
      map[column.id] = column.alwaysVisible ? true : (overrides[column.id] ?? column.defaultVisible)
    }
    return map
  }, [columns, overrides])

  const setVisible = useCallback(
    (id: string, visible: boolean) => {
      setOverrides((previous) => {
        const next = { ...previous, [id]: visible }
        writeStoredVisibility(storageKey, next)
        return next
      })
    },
    [storageKey],
  )

  const isVisible = useCallback((id: string) => visibility[id] ?? true, [visibility])

  return { visibility, isVisible, setVisible }
}
