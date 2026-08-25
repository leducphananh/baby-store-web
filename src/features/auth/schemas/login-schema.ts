import { z } from 'zod'

/**
 * Login form validation. Messages are Vietnamese (see `vietnamese-business-ui`).
 * This only validates shape/presence — the actual credential check happens
 * server-side via Supabase Auth (`signInWithPassword`); a schema pass here
 * never implies the credentials are correct.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
