import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { signOutUser } from '@/features/auth/api/sign-out'
import { clearSignedUrlCache } from '@/features/products/api/signed-image-url-cache'

/**
 * Sign-out mutation. Clears the entire query cache on success so no
 * previously-authenticated data lingers for the next user on a shared
 * machine (see `supabase-auth`). No manual navigation here either — once
 * the auth state flips to `unauthenticated`, `RequireAuth` redirects to
 * `/login` on its own.
 *
 * Also clears the product-image signed-URL cache: it deliberately lives
 * outside the QueryClient (see `signed-image-url-cache.ts`), so
 * `queryClient.clear()` above wouldn't otherwise touch it, and a signed URL
 * is itself a bearer credential to a private file — the same
 * "nothing authenticated lingers" intent applies to it too.
 */
export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOutUser,
    onSuccess: () => {
      queryClient.clear()
      clearSignedUrlCache()
      toast.success('Đã đăng xuất')
    },
    onError: () => {
      toast.error('Không thể đăng xuất. Vui lòng thử lại.')
    },
  })
}
