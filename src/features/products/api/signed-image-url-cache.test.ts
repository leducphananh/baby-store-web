import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearSignedUrlCache, getSignedUrlsCached } from '@/features/products/api/signed-image-url-cache'

/**
 * Mirrors `set-product-web-visibility.test.ts`'s strategy: a small local
 * fake modelling only the exact chain this module calls —
 *   supabase.storage.from(bucket).createSignedUrls(paths, ttl)
 * This is the regression test for the egress fix (see the module's own
 * header comment): the same `(bucket, path)` must resolve to the exact same
 * URL across repeated calls within the reuse window, so the browser's HTTP
 * cache can actually serve it, and only genuinely new/expired paths should
 * ever trigger a real signing call.
 */
const { createSignedUrlsMock } = vi.hoisted(() => ({ createSignedUrlsMock: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: () => ({ createSignedUrls: createSignedUrlsMock }) } },
}))

function signedResult(paths: string[]) {
  return {
    data: paths.map((path) => ({ path, signedUrl: `https://example.test/${path}?token=${path}-v1` })),
    error: null,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  clearSignedUrlCache()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getSignedUrlsCached', () => {
  it('signs every path on a cold cache, in one batched call', async () => {
    createSignedUrlsMock.mockResolvedValue(signedResult(['a.jpg', 'b.jpg']))

    const result = await getSignedUrlsCached('product-images', ['a.jpg', 'b.jpg'])

    expect(createSignedUrlsMock).toHaveBeenCalledTimes(1)
    expect(createSignedUrlsMock).toHaveBeenCalledWith(['a.jpg', 'b.jpg'], 60 * 60)
    expect(result.get('a.jpg')).toBe('https://example.test/a.jpg?token=a.jpg-v1')
    expect(result.get('b.jpg')).toBe('https://example.test/b.jpg?token=b.jpg-v1')
  })

  it('reuses the same URL for a repeat call within the reuse window, with no new signing call', async () => {
    createSignedUrlsMock.mockResolvedValue(signedResult(['a.jpg']))
    const first = await getSignedUrlsCached('product-images', ['a.jpg'])

    vi.advanceTimersByTime(10 * 60 * 1000) // well under the 55-min reuse window
    const second = await getSignedUrlsCached('product-images', ['a.jpg'])

    expect(createSignedUrlsMock).toHaveBeenCalledTimes(1)
    expect(second.get('a.jpg')).toBe(first.get('a.jpg'))
  })

  it('only (re-)signs the paths that are missing or expired in a mixed batch', async () => {
    createSignedUrlsMock.mockResolvedValueOnce(signedResult(['a.jpg']))
    await getSignedUrlsCached('product-images', ['a.jpg'])

    createSignedUrlsMock.mockResolvedValueOnce(signedResult(['b.jpg']))
    const result = await getSignedUrlsCached('product-images', ['a.jpg', 'b.jpg'])

    expect(createSignedUrlsMock).toHaveBeenCalledTimes(2)
    expect(createSignedUrlsMock).toHaveBeenLastCalledWith(['b.jpg'], 60 * 60)
    expect(result.get('a.jpg')).toBe('https://example.test/a.jpg?token=a.jpg-v1')
    expect(result.get('b.jpg')).toBe('https://example.test/b.jpg?token=b.jpg-v1')
  })

  it('re-signs a path once its cached entry is past the reuse window', async () => {
    createSignedUrlsMock.mockResolvedValueOnce(signedResult(['a.jpg']))
    await getSignedUrlsCached('product-images', ['a.jpg'])

    vi.advanceTimersByTime(56 * 60 * 1000) // past the 55-min reuse window
    createSignedUrlsMock.mockResolvedValueOnce(signedResult(['a.jpg']))
    await getSignedUrlsCached('product-images', ['a.jpg'])

    expect(createSignedUrlsMock).toHaveBeenCalledTimes(2)
  })

  it('propagates a real Storage error instead of pretending success', async () => {
    createSignedUrlsMock.mockResolvedValue({ data: null, error: new Error('signing failed') })

    await expect(getSignedUrlsCached('product-images', ['a.jpg'])).rejects.toThrow('signing failed')
  })

  it('returns an empty map without calling Storage for an empty path list', async () => {
    const result = await getSignedUrlsCached('product-images', [])

    expect(result.size).toBe(0)
    expect(createSignedUrlsMock).not.toHaveBeenCalled()
  })
})
