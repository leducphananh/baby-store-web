import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyState } from '@/components/common/empty-state'

/**
 * Foundation test — a simple shared presentational component. Proves React
 * Testing Library + jest-dom work and that assertions go through
 * user-visible text, not class names or DOM structure.
 */
describe('EmptyState', () => {
  it('shows the title', () => {
    render(<EmptyState title="Chưa có sản phẩm nào" />)

    expect(screen.getByText('Chưa có sản phẩm nào')).toBeInTheDocument()
  })

  it('shows the description only when one is given', () => {
    const { rerender } = render(<EmptyState title="Trống" />)
    expect(screen.queryByText('Thêm sản phẩm đầu tiên để bắt đầu.')).not.toBeInTheDocument()

    rerender(<EmptyState title="Trống" description="Thêm sản phẩm đầu tiên để bắt đầu." />)
    expect(screen.getByText('Thêm sản phẩm đầu tiên để bắt đầu.')).toBeInTheDocument()
  })

  it('renders the action slot', () => {
    render(<EmptyState title="Trống" action={<button type="button">Tạo mới</button>} />)

    expect(screen.getByRole('button', { name: 'Tạo mới' })).toBeInTheDocument()
  })
})
