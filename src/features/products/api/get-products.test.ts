import { describe, expect, it, vi } from 'vitest'

import { getProducts } from '@/features/products/api/get-products'
import type { ProductFilters } from '@/features/products/types/product'

/**
 * Small local fakes modelling only the exact chains `getProducts` calls
 * (see `TESTING.md` layer 2 / `get-all-categories.test.ts`): the main
 * `products` query (`select().or()/.eq()*.order().order().range().returns()`)
 * plus the two batched follow-up queries it always issues
 * (`product_batches`/`product_images`, each `select().in(...)`). Never a
 * generic reusable fake Supabase client.
 */
const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock },
}))

const ROW = {
  id: 'prod-1',
  name: 'Bỉm Moony',
  sku: 'MOONY-L',
  barcode: null,
  category_id: null,
  brand: null,
  unit: 'Gói',
  description: null,
  default_purchase_price: 100_000,
  selling_price: 150_000,
  tiktok_price: null,
  shopee_price: null,
  minimum_stock: 0,
  status: 'active',
  is_web_visible: true,
  origin_country: null,
  manufacturer: null,
  distributor: null,
  source_description: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  categories: null,
}

function baseFilters(overrides: Partial<ProductFilters> = {}): ProductFilters {
  return {
    search: '',
    categoryId: null,
    status: 'all',
    webVisibility: 'all',
    page: 1,
    pageSize: 20,
    sortField: 'name',
    sortDesc: false,
    ...overrides,
  }
}

/** Wires `fromMock` for one test and returns the `products` builder to assert against. */
function mockProductsQuery() {
  const productsBuilder = {
    select: vi.fn(() => productsBuilder),
    or: vi.fn(() => productsBuilder),
    eq: vi.fn(() => productsBuilder),
    order: vi.fn(() => productsBuilder),
    range: vi.fn(() => productsBuilder),
    returns: vi.fn(() => Promise.resolve({ data: [ROW], error: null, count: 1 })),
  }
  const emptyRelated = {
    select: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
  }
  fromMock.mockImplementation((table: string) => {
    if (table === 'products') return productsBuilder
    if (table === 'product_batches' || table === 'product_images') return emptyRelated
    throw new Error(`Unexpected table in test: ${table}`)
  })
  return productsBuilder
}

describe('getProducts — storefront visibility filter', () => {
  it('applies no is_web_visible filter for "all"', async () => {
    const productsBuilder = mockProductsQuery()

    await getProducts(baseFilters({ webVisibility: 'all' }))

    expect(productsBuilder.eq).not.toHaveBeenCalledWith('is_web_visible', expect.anything())
  })

  it('filters for published products only', async () => {
    const productsBuilder = mockProductsQuery()

    await getProducts(baseFilters({ webVisibility: 'visible' }))

    expect(productsBuilder.eq).toHaveBeenCalledWith('is_web_visible', true)
  })

  it('filters for hidden products only', async () => {
    const productsBuilder = mockProductsQuery()

    await getProducts(baseFilters({ webVisibility: 'hidden' }))

    expect(productsBuilder.eq).toHaveBeenCalledWith('is_web_visible', false)
  })

  it('composes the visibility filter with search, category, status and pagination', async () => {
    const productsBuilder = mockProductsQuery()

    await getProducts(
      baseFilters({
        search: 'moony',
        categoryId: 'cat-1',
        status: 'active',
        webVisibility: 'visible',
        page: 2,
        pageSize: 10,
      }),
    )

    expect(productsBuilder.or).toHaveBeenCalledWith(expect.stringContaining('moony'))
    expect(productsBuilder.eq).toHaveBeenCalledWith('category_id', 'cat-1')
    expect(productsBuilder.eq).toHaveBeenCalledWith('status', 'active')
    expect(productsBuilder.eq).toHaveBeenCalledWith('is_web_visible', true)
    expect(productsBuilder.range).toHaveBeenCalledWith(10, 19)
  })

  it('maps is_web_visible onto the domain Product shape', async () => {
    mockProductsQuery()

    const result = await getProducts(baseFilters())

    expect(result.data[0]?.isWebVisible).toBe(true)
  })
})
