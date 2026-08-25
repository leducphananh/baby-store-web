import { useMutation } from '@tanstack/react-query'

import { signInWithPassword } from '@/features/auth/api/sign-in'

/**
 * Sign-in mutation. Deliberately does NOT navigate on success — the
 * redirect away from `/login` happens declaratively in `PublicOnlyRoute`
 * once `AuthProvider`'s `onAuthStateChange` listener flips the auth state
 * to `authenticated`. Navigating manually here would race that listener.
 */
export function useSignIn() {
  return useMutation({
    mutationFn: signInWithPassword,
  })
}

/**
 * Map a sign-in failure to a Vietnamese, user-safe message. Distinguishes
 * the expected "wrong credentials" case from unexpected/network failures
 * (see `error-handling`) — never surfaces the raw Supabase error string.
 */
export function getSignInErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không chính xác.'
  }
  if (message.includes('email not confirmed')) {
    return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.'
  }
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.'
  }
  return 'Không thể đăng nhập. Vui lòng thử lại.'
}
