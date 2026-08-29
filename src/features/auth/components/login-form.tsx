import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { AlertCircle, Eye, EyeOff } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  getSignInErrorMessage,
  useSignIn,
} from '@/features/auth/hooks/use-sign-in';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login-schema';

/**
 * Login form: email + password, React Hook Form + Zod (see
 * `react-hook-form-zod`). Submission errors are shown as a form-level
 * banner rather than mapped to a specific field — Supabase's
 * `signInWithPassword` doesn't tell us whether the email or the password
 * was wrong, and revealing that distinction would leak account existence.
 */
function LoginForm() {
  const signIn = useSignIn();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(values: LoginFormValues) {
    signIn.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {signIn.isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {getSignInErrorMessage(signIn.error)}
            </AlertDescription>
          </Alert>
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
                  placeholder="admin@babywale.com"
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
              <div className="relative">
                <FormControl>
                  <Input
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    disabled={signIn.isPending}
                    className="pr-10"
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  disabled={signIn.isPending}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {isPasswordVisible ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </Form>
  );
}

export { LoginForm };
