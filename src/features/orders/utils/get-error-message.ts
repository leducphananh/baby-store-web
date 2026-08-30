/**
 * Read a Postgres/PostgREST error's `.message` without relying on
 * `instanceof Error` — supabase-js's `.rpc()` rejects with a plain object
 * matching `PostgrestError`'s shape in this app's call paths (not always a
 * real `Error` instance), so `instanceof Error` alone silently misses every
 * one of these and falls through to a generic fallback message (found and
 * fixed for `create_order` in Phase 6.2 — see `get-create-order-error-message.ts`).
 * Shared here now that a second/third RPC error mapper needs the same fix.
 */
export function getPostgrestErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return ''
}
