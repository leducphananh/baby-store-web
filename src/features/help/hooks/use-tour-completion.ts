import { useCallback, useState } from 'react'

const STORAGE_KEY = 'baby-wale.help.tours.completed'

function readCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is string => typeof value === 'string'))
  } catch {
    // Corrupt value, storage disabled, etc. — fall back rather than
    // throwing (this is a cosmetic preference, never load-bearing).
    return new Set()
  }
}

function writeCompleted(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Storage disabled/full — the preference just won't persist this time.
  }
}

/**
 * Per-viewer, localStorage-backed record of which tours a user has seen —
 * same shape/rationale as `useColumnVisibility`/`usePersistedPageSize`.
 * Purely informational (e.g. a "đã xem" mark in the Help Center); it never
 * gates anything. A tour marked complete can always be replayed — see
 * `help-button.tsx`'s "Xem lại hướng dẫn" and CLAUDE.md-adjacent rule that
 * completion must never permanently block a replay.
 */
export function useTourCompletion() {
  const [completed, setCompleted] = useState<Set<string>>(() => readCompleted())

  const markCompleted = useCallback((id: string) => {
    setCompleted((previous) => {
      if (previous.has(id)) return previous
      const next = new Set(previous)
      next.add(id)
      writeCompleted(next)
      return next
    })
  }, [])

  const isCompleted = useCallback((id: string) => completed.has(id), [completed])

  return { isCompleted, markCompleted }
}
