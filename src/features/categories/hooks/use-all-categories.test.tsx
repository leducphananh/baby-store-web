import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Category } from '@/features/categories/types/category'
import { getAllCategories } from '@/features/categories/api/get-all-categories'
import { useAllCategories } from '@/features/categories/hooks/use-all-categories'
import { renderWithProviders } from '@/test/render'

/**
 * Foundation test — proves the TanStack Query test strategy: a fresh
 * `createTestQueryClient()` (retry: false) provided by `renderWithProviders`,
 * a query hook driven through its loading -> success transition, with the
 * `api/` module mocked at its boundary (Phase 9.8 / testing-react rule 5:
 * mock at the service boundary, never a live database, never deep Supabase
 * internals).
 *
 * `vi.mock` is hoisted above the import above, so `getAllCategories` is
 * already the mock function here.
 */
vi.mock('@/features/categories/api/get-all-categories', () => ({
  getAllCategories: vi.fn(),
}))

const getAllCategoriesMock = vi.mocked(getAllCategories)

/** Test-only probe (allowed inside a test file) to exercise the hook. */
function CategoriesProbe() {
  const query = useAllCategories()

  if (query.isPending) return <p>Đang tải…</p>
  if (query.isError) return <p role="alert">Lỗi</p>
  return (
    <ul>
      {query.data.map((category) => (
        <li key={category.id}>{category.name}</li>
      ))}
    </ul>
  )
}

describe('useAllCategories', () => {
  it('goes from loading to the fetched category list', async () => {
    const categories: Category[] = [
      { id: 'c1', name: 'Bỉm', description: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'c2', name: 'Sữa', description: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ]
    getAllCategoriesMock.mockResolvedValue(categories)

    renderWithProviders(<CategoriesProbe />)

    expect(screen.getByText('Đang tải…')).toBeInTheDocument()

    expect(await screen.findByText('Bỉm')).toBeInTheDocument()
    expect(screen.getByText('Sữa')).toBeInTheDocument()
    expect(getAllCategoriesMock).toHaveBeenCalledTimes(1)
  })
})
