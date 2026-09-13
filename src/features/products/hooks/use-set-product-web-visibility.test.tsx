import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { setProductWebVisibility } from '@/features/products/api/set-product-web-visibility'
import { useSetProductWebVisibility } from '@/features/products/hooks/use-set-product-web-visibility'
import { renderWithProviders } from '@/test/render'

/**
 * Mocked at the `api/` boundary (see `TESTING.md` layer 1) — the Supabase
 * interaction itself is covered separately by
 * `set-product-web-visibility.test.ts`. This test is about the mutation
 * hook's own wiring: success/error toasts and that a failed mutation never
 * pretends to have changed anything (task §17 — never leave the UI in a
 * false "it worked" state).
 */
vi.mock('@/features/products/api/set-product-web-visibility', () => ({
  setProductWebVisibility: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const setProductWebVisibilityMock = vi.mocked(setProductWebVisibility)

/** Test-only probe exercising the mutation, like the `CategoriesProbe` pattern. */
function ToggleProbe({ isWebVisible }: { isWebVisible: boolean }) {
  const mutation = useSetProductWebVisibility()
  return (
    <button
      type="button"
      onClick={() => mutation.mutate({ id: 'prod-1', isWebVisible: !isWebVisible })}
    >
      {isWebVisible ? 'Ẩn khỏi website' : 'Đăng lên website'}
    </button>
  )
}

describe('useSetProductWebVisibility', () => {
  it('publishes successfully and shows a success toast', async () => {
    setProductWebVisibilityMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    const { queryClient } = renderWithProviders(<ToggleProbe isWebVisible={false} />)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(screen.getByRole('button', { name: 'Đăng lên website' }))

    expect(setProductWebVisibilityMock).toHaveBeenCalledWith(
      { id: 'prod-1', isWebVisible: true },
      expect.anything(),
    )
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Đã đăng sản phẩm lên website'))
    expect(invalidateSpy).toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows an error toast and never claims success on failure', async () => {
    setProductWebVisibilityMock.mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()
    const { queryClient } = renderWithProviders(<ToggleProbe isWebVisible={false} />)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(screen.getByRole('button', { name: 'Đăng lên website' }))

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    // Nothing to reconcile in the cache — the mutation is non-optimistic, so
    // a failure invalidates nothing and the previous badge state stands.
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
