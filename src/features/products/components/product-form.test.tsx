import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { useAllCategories } from '@/features/categories/hooks/use-all-categories'
import { ProductForm } from '@/features/products/components/product-form'
import type { ProductFormValues } from '@/features/products/schemas/product-schema'
import { renderWithProviders } from '@/test/render'

/**
 * Mocked at the hook boundary — the category dropdown's own data-fetching
 * isn't what this test is about (see `use-all-categories.test.tsx` for that).
 */
vi.mock('@/features/categories/hooks/use-all-categories', () => ({
  useAllCategories: vi.fn(),
}))

vi.mocked(useAllCategories).mockReturnValue({
  data: [],
  isLoading: false,
  isError: false,
} as unknown as ReturnType<typeof useAllCategories>)

const VALID_VALUES: ProductFormValues = {
  name: 'Bỉm Moony quần size L',
  sku: 'MOONY-QUAN-L',
  barcode: '',
  categoryId: '',
  brand: '',
  unit: 'Gói',
  description: '',
  originCountry: '',
  manufacturer: '',
  distributor: '',
  sourceDescription: '',
  defaultPurchasePrice: 100_000,
  sellingPrice: 150_000,
  tiktokPrice: null,
  shopeePrice: null,
  minimumStock: 0,
  status: 'active',
  isWebVisible: false,
}

/**
 * Covers task §20's create/edit visibility cases at the form-component
 * level: a new product's toggle renders off by default and can be switched
 * on, and an existing (published) product's toggle renders on and can be
 * switched off — both directions, driven by the same `Switch` the real form
 * renders (selected by its accessible name, not a class/test id).
 */
describe('ProductForm — website visibility', () => {
  it('defaults a new product to hidden and allows enabling it', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ProductForm
        defaultValues={{ ...VALID_VALUES, isWebVisible: false }}
        onSubmit={vi.fn()}
        isSubmitting={false}
        formId="test-form"
      />,
    )

    const toggle = screen.getByRole('switch', { name: 'Hiển thị trên website' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('reflects an already-published product and allows hiding it', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ProductForm
        defaultValues={{ ...VALID_VALUES, isWebVisible: true }}
        onSubmit={vi.fn()}
        isSubmitting={false}
        formId="test-form"
      />,
    )

    const toggle = screen.getByRole('switch', { name: 'Hiển thị trên website' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('submits the current toggle value, independent of business status', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <ProductForm
        defaultValues={{ ...VALID_VALUES, isWebVisible: false }}
        onSubmit={onSubmit}
        isSubmitting={false}
        formId="test-form"
      />,
    )

    await user.click(screen.getByRole('switch', { name: 'Hiển thị trên website' }))
    // `ProductForm` renders no submit button of its own — the real submit
    // button lives outside it, in the dialog footer, associated via
    // `form="test-form"` (see `product-form-dialog.tsx`). Submitting the
    // `<form id="test-form">` element directly exercises the same
    // `handleSubmit` path without re-implementing the dialog here.
    const form = document.getElementById('test-form')
    if (!form) throw new Error('form#test-form not found')
    fireEvent.submit(form)

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ isWebVisible: true, status: 'active' }),
      expect.anything(),
    )
  })
})
