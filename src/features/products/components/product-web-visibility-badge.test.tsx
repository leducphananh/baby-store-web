import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProductWebVisibilityBadge } from '@/features/products/components/product-web-visibility-badge'

/**
 * The list/detail badge is the one place staff actually see storefront
 * publishing state — it must read strictly off `isWebVisible`, with distinct
 * text for both states (never color-only, see `accessibility`).
 */
describe('ProductWebVisibilityBadge', () => {
  it('shows "Đang hiển thị" when the product is published', () => {
    render(<ProductWebVisibilityBadge isWebVisible={true} />)

    expect(screen.getByText('Đang hiển thị')).toBeInTheDocument()
    expect(screen.queryByText('Đang ẩn')).not.toBeInTheDocument()
  })

  it('shows "Đang ẩn" when the product is hidden', () => {
    render(<ProductWebVisibilityBadge isWebVisible={false} />)

    expect(screen.getByText('Đang ẩn')).toBeInTheDocument()
    expect(screen.queryByText('Đang hiển thị')).not.toBeInTheDocument()
  })
})
