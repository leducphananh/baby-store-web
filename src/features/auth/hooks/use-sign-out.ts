import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { signOutUser } from '@/features/auth/api/sign-out'

/**
 * Sign-out mutation. Clears the entire query cache on success so no
 * previously-authenticated data lingers for the next user on a shared
 * machine (see `supabase-auth`). No manual navigation here either — once
 * the auth state flips to `unauthenticated`, `RequireAuth` redirects to
 * `/login` on its own.
 */
export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOutUser,
    onSuccess: () => {
      queryClient.clear()
      toast.success('Đã đăng xuất')
    },
    onError: () => {
      toast.error('Không thể đăng xuất. Vui lòng thử lại.')
    },
  })
}
