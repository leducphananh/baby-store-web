import { describe, expect, it, vi } from 'vitest'

import { setProductWebVisibility } from '@/features/products/api/set-product-web-visibility'

/**
 * Mirrors `get-all-categories.test.ts`'s strategy: a small local fake
 * modelling only the exact chain this module calls —
 *   supabase.from('products').update({...}).eq('id', id)
 * — never a generic reusable fake client (see `TESTING.md`).
 */
const { eqMock, updateMock, fromMock } = vi.hoisted(() => {
  const eq = vi.fn()
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))
  return { eqMock: eq, updateMock: update, fromMock: from }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock },
}))

describe('setProductWebVisibility', () => {
  it('updates is_web_visible to true and touches updated_at', async () => {
    eqMock.mockResolvedValue({ error: null })

    await setProductWebVisibility({ id: 'prod-1', isWebVisible: true })

    expect(fromMock).toHaveBeenCalledWith('products')
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_web_visible: true, updated_at: expect.any(String) }),
    )
    expect(eqMock).toHaveBeenCalledWith('id', 'prod-1')
  })

  it('updates is_web_visible to false', async () => {
    eqMock.mockResolvedValue({ error: null })

    await setProductWebVisibility({ id: 'prod-2', isWebVisible: false })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_web_visible: false }),
    )
  })

  it('throws the Supabase error instead of pretending success', async () => {
    eqMock.mockResolvedValue({ error: new Error('permission denied for table products') })

    await expect(setProductWebVisibility({ id: 'prod-3', isWebVisible: true })).rejects.toThrow(
      'permission denied for table products',
    )
  })
})
