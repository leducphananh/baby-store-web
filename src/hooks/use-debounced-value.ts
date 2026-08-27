import { useEffect, useState } from 'react'

/**
 * Debounce a fast-changing value (typically a search input) before it's
 * used as a query param — avoids firing a request on every keystroke (see
 * `react-query`, `table-data-grid`). This is the one acceptable
 * `useEffect` for "syncing with a timer", not data fetching itself.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
