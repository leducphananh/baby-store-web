import { describe, expect, it, vi } from 'vitest'

import { getAllCategories } from '@/features/categories/api/get-all-categories'

/**
 * Foundation test — proves an `api/` service module that goes through the
 * Supabase client boundary can be tested with NO network access, by mocking
 * the project's own `@/lib/supabase` module (not the internals of
 * `@supabase/supabase-js`). This is the pattern later API-layer tests
 * (Phase 10.2) will reuse; heavier query shapes get a disposable database
 * in Phase 10.4, never a live one.
 *
 * The chain here is exactly the one `getAllCategories` calls:
 *   supabase.from('categories').select(...).order('name', { ascending: true })
 * so the fake only models those three methods, nothing more (no generic
 * "fake Supabase" framework).
 */
const { orderMock, fromMock } = vi.hoisted(() => {
  const order = vi.fn()
  const select = vi.fn(() => ({ order }))
  const from = vi.fn(() => ({ select }))
  return { orderMock: order, fromMock: from }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock },
}))

describe('getAllCategories', () => {
  it('maps snake_case rows to the camelCase domain shape, name-sorted by the query', async () => {
    orderMock.mockResolvedValue({
      data: [
        {
          id: 'cat-1',
          name: 'Bỉm',
          description: 'Tã & bỉm',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
        {
          id: 'cat-2',
          name: 'Sữa',
          description: null,
          created_at: '2026-01-03T00:00:00Z',
          updated_at: '2026-01-03T00:00:00Z',
        },
      ],
      error: null,
    })

    const result = await getAllCategories()

    expect(fromMock).toHaveBeenCalledWith('categories')
    expect(orderMock).toHaveBeenCalledWith('name', { ascending: true })
    expect(result).toEqual([
      {
        id: 'cat-1',
        name: 'Bỉm',
        description: 'Tã & bỉm',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
      {
        id: 'cat-2',
        name: 'Sữa',
        description: null,
        createdAt: '2026-01-03T00:00:00Z',
        updatedAt: '2026-01-03T00:00:00Z',
      },
    ])
  })

  it('throws the Supabase error instead of returning a partial result', async () => {
    orderMock.mockResolvedValue({ data: null, error: new Error('permission denied for table categories') })

    await expect(getAllCategories()).rejects.toThrow('permission denied for table categories')
  })
})
