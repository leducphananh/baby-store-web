import { useCallback, useState } from 'react'

function readStoredPageSize(storageKey: string, allowed: number[], fallback: number): number {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return fallback
    const parsed = Number(raw)
    return allowed.includes(parsed) ? parsed : fallback
  } catch {
    // Corrupt value, storage disabled, etc. — fall back rather than throwing
    // (this is a cosmetic preference, never load-bearing).
    return fallback
  }
}

function writeStoredPageSize(storageKey: string, value: number): void {
  try {
    localStorage.setItem(storageKey, String(value))
  } catch {
    // Storage disabled/full — the preference just won't persist this time.
  }
}

/**
 * Per-viewer, localStorage-backed "rows per page" preference for a
 * `DataTable` — same shape/rationale as `useColumnVisibility`: a stable
 * namespaced key, validated against the actual `options` so stale or
 * tampered storage can never produce an invalid page size (falls back to
 * `defaultPageSize` instead). Plain client-only UI state, not a Supabase
 * preference or React Query cache (CLAUDE.md §10) — feature-agnostic and
 * reusable by any table that opts into `DataTable`'s page-size selector
 * (see `data-table.tsx`), not Products-only.
 */
export function usePersistedPageSize(storageKey: string, options: number[], defaultPageSize: number) {
  const [pageSize, setPageSizeState] = useState(() =>
    readStoredPageSize(storageKey, options, defaultPageSize),
  )

  const setPageSize = useCallback(
    (next: number) => {
      setPageSizeState(next)
      writeStoredPageSize(storageKey, next)
    },
    [storageKey],
  )

  return [pageSize, setPageSize] as const
}
