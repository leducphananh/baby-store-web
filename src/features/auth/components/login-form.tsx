import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { getSignInErrorMessage, useSignIn } from '@/features/auth/hooks/use-sign-in'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login-schema'

/**
 * Login form: email + password, React Hook Form + Zod (see
 * `react-hook-form-zod`). Submission errors are shown as a form-level
 * banner rather than mapped to a specific field — Supabase's
 * `signInWithPassword` doesn't tell us whether the email or the password
 * was wrong, and revealing that distinction would leak account existence.
 */
function LoginForm() {
  const signIn = useSignIn()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: LoginFormValues) {
    signIn.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {signIn.isError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {getSignInErrorMessage(signIn.error)}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="username"
                  placeholder="ban@cuahang.com"
                  disabled={signIn.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  disabled={signIn.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </Form>
  )
}

export { LoginForm }
