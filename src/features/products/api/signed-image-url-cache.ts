import { supabase } from '@/lib/supabase'

const SIGNED_URL_TTL_SECONDS = 60 * 60 // matches the existing 1h TTL used by every caller

/**
 * Reuse a signed URL for up to this long — comfortably under the real 1h
 * Supabase token lifetime — so the *same* URL (and therefore the same
 * browser HTTP cache entry) is returned for the same file across repeated
 * Product List/Detail loads, instead of a fresh token being minted on every
 * single call.
 */
const REUSE_WINDOW_MS = 55 * 60 * 1000

/**
 * Hard cap so a long-lived admin tab can't grow this indefinitely as staff
 * browse many different products over a full workday — well above this
 * catalog's actual current image count (~190). Oldest-inserted is evicted
 * first once the cap is hit.
 */
const MAX_ENTRIES = 1000

type CacheEntry = { url: string; cachedAt: number }

/**
 * Egress fix (see the Phase 12 report): `supabase.storage.from(bucket)
 * .createSignedUrls(paths, ttl)` mints a brand-new token — and therefore a
 * brand-new URL — on *every* call, even for the exact same file. Since the
 * browser's HTTP cache is keyed on the full URL (query string included),
 * that churn defeats caching completely: Storage already sends a correct
 * `Cache-Control: max-age=3600` on the response, but it's useless if the
 * URL never repeats. Every Product List remount/refetch was re-downloading
 * every row's full-resolution image (avg ~415KB, up to 4.6MB), regardless
 * of whether the file had changed.
 *
 * This module reuses the same signed URL for a given `(bucket, path)` for
 * up to `REUSE_WINDOW_MS`, so the browser can actually serve a repeat
 * request from its own cache. It changes nothing about the bucket's
 * privacy or the app's authorization model — it's the exact same signed-URL
 * security boundary, just not needlessly re-minted (CLAUDE.md §9/§11).
 *
 * This is deliberately a small, bounded, single-purpose module-level cache
 * rather than the app's `QueryClient` (`@/lib/query-client`): a signed URL
 * is not itself business/server data (the thing `react-query` rule 1 says
 * must live in React Query) — it's a purely technical, short-lived access
 * token for reaching data that already lives there. Every other module in
 * this codebase only touches the `QueryClient` from a hook/provider (see
 * `app-providers.tsx`); this cache intentionally lives outside it so it is
 * never accidentally cleared by an unrelated business-data invalidation,
 * and clearing it (`clearSignedUrlCache`) is instead wired explicitly into
 * sign-out, matching the app's existing "no stale authenticated data
 * lingers" intent (see `use-sign-out.ts`).
 */
const cache = new Map<string, CacheEntry>()

function cacheKey(bucket: string, path: string): string {
  return `${bucket}:${path}`
}

function evictIfOverCapacity(): void {
  if (cache.size <= MAX_ENTRIES) return
  // `Map` preserves insertion order, so the first key is the oldest-cached
  // one. An approximate LRU (a cache *hit* doesn't move an entry), which is
  // enough for this cache's actual purpose: bounding memory over a long
  // session, not perfect recency.
  const oldestKey = cache.keys().next().value
  if (oldestKey !== undefined) cache.delete(oldestKey)
}

/**
 * Batched, cached signed-URL lookup for a private Storage bucket. Only
 * genuinely missing/expired paths are (re-)signed, and always in one
 * batched `createSignedUrls` call — never one request per image, preserving
 * the batching every existing caller already relied on.
 *
 * Throws on a real Storage error, same as a direct `createSignedUrls` call
 * would — callers that treat a thumbnail as purely cosmetic (e.g. the
 * product list) should catch/ignore it themselves, same as before this
 * cache existed.
 */
export async function getSignedUrlsCached(bucket: string, paths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (paths.length === 0) return result

  const now = Date.now()
  const toSign: string[] = []
  for (const path of paths) {
    const entry = cache.get(cacheKey(bucket, path))
    if (entry && now - entry.cachedAt < REUSE_WINDOW_MS) {
      result.set(path, entry.url)
    } else {
      toSign.push(path)
    }
  }

  if (toSign.length === 0) return result

  const { data: signed, error } = await supabase.storage.from(bucket).createSignedUrls(toSign, SIGNED_URL_TTL_SECONDS)
  if (error) throw error

  for (const item of signed ?? []) {
    if (!item.signedUrl || !item.path) continue
    result.set(item.path, item.signedUrl)
    cache.set(cacheKey(bucket, item.path), { url: item.signedUrl, cachedAt: now })
    evictIfOverCapacity()
  }
  return result
}

/**
 * Drop every cached signed URL — wired into sign-out (`use-sign-out.ts`)
 * alongside `queryClient.clear()` so no previously-authenticated access
 * token lingers in memory for the next user on a shared machine.
 */
export function clearSignedUrlCache(): void {
  cache.clear()
}
