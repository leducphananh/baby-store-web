import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BackLink } from '@/components/common/back-link'
import { renderWithProviders } from '@/test/render'

/**
 * Foundation test — a route-aware component. Proves the `renderWithProviders`
 * helper and its `MemoryRouter` strategy work, and that a link is found by
 * its accessible name.
 */
describe('BackLink', () => {
  it('renders a link with the given label pointing at the target route', () => {
    renderWithProviders(<BackLink to="/products" label="Danh sách sản phẩm" />)

    const link = screen.getByRole('link', { name: 'Danh sách sản phẩm' })
    expect(link).toHaveAttribute('href', '/products')
  })
})
