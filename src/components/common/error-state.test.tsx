import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ErrorState } from '@/components/common/error-state'

/**
 * Foundation test — proves `@testing-library/user-event` works for a real
 * interaction and that accessible roles/names are usable as selectors
 * (a regression signal for the Phase 9.5 semantics).
 */
describe('ErrorState', () => {
  it('renders as an alert region with the message', () => {
    render(<ErrorState message="Không thể tải dữ liệu doanh thu." />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Không thể tải dữ liệu doanh thu.')
  })

  it('has no retry action when onRetry is not provided', () => {
    render(<ErrorState />)

    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument()
  })

  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorState onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
