import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { getProductColumns } from '@/features/products/components/product-columns'
import type { Product } from '@/features/products/types/product'

/**
 * Focused test for the "Nhà phân phối" (distributor) column: it must render
 * `Product.distributor` exactly as stored (never derived from `suppliers`),
 * and fall back to the project's existing empty-value convention ("—" via
 * `TruncatedCell`, same as "Danh mục") rather than "N/A"/"Unknown"/a
 * fabricated value.
 */
function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    name: 'Bỉm Moony quần size L',
    sku: 'MOONY-QUAN-L',
    barcode: null,
    categoryId: null,
    categoryName: 'Bỉm',
    brand: 'Moony',
    unit: 'Gói',
    description: null,
    defaultPurchasePrice: 100_000,
    sellingPrice: 150_000,
    tiktokPrice: null,
    shopeePrice: null,
    minimumStock: 0,
    status: 'active',
    isWebVisible: false,
    originCountry: null,
    manufacturer: null,
    distributor: null,
    sourceDescription: null,
    stockQuantity: 0,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

const NOOP_ACTIONS = {
  onView: vi.fn(),
  onEdit: vi.fn(),
  onCopy: vi.fn(),
  onToggleStatus: vi.fn(),
  onToggleWebVisibility: vi.fn(),
  onDelete: vi.fn(),
  thumbnails: new Map<string, string>(),
}

function getDistributorCell(product: Product) {
  const columns = getProductColumns(NOOP_ACTIONS)
  const column = columns.find((c) => c.id === 'distributor')
  if (!column) throw new Error('distributor column not found')
  return column.cell(product)
}

describe('getProductColumns — distributor column', () => {
  it('is present with the "Nhà phân phối" header', () => {
    const columns = getProductColumns(NOOP_ACTIONS)
    const column = columns.find((c) => c.id === 'distributor')

    expect(column).toBeDefined()
    expect(column?.header).toBe('Nhà phân phối')
  })

  it('renders the product\'s distributor value as-is', () => {
    render(getDistributorCell(buildProduct({ distributor: 'Công ty ABC' })))

    expect(screen.getByText('Công ty ABC')).toBeInTheDocument()
  })

  it('falls back to the existing empty-value convention ("—") when null', () => {
    render(getDistributorCell(buildProduct({ distributor: null })))

    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument()
  })

  it('falls back to "—" for a blank/whitespace-only distributor too', () => {
    render(getDistributorCell(buildProduct({ distributor: '   ' })))

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
