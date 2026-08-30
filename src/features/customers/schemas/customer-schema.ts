import { z } from 'zod'

/**
 * Loose but real Vietnamese phone-number check: strips the punctuation
 * people naturally type (spaces, dots, dashes, parentheses), normalizes a
 * `+84`/`84` country-code prefix back to the domestic leading `0`, then
 * accepts the standard 10-digit mobile/landline length plus a little slack
 * (9–10 digits after the leading `0`) for older-format or business lines —
 * deliberately not locked to one exact carrier prefix list, so a real
 * customer number is never rejected just for looking slightly unusual.
 */
function isPlausibleVietnamesePhone(value: string): boolean {
  const normalized = value.replace(/[\s.\-()]/g, '').replace(/^(\+84|84)/, '0')
  return /^0\d{9,10}$/.test(normalized)
}

/**
 * Shared by create and edit (see `react-hook-form-zod`). Contact fields are
 * optional in the database, so they stay plain (possibly empty) strings
 * here for a fully-controlled form — the empty-string-to-`null` mapping
 * happens at the API boundary, not here (same pattern as
 * `supplier-schema.ts`). Format checks only run when a field is filled in.
 */
export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên khách hàng')
    .max(150, 'Tên khách hàng tối đa 150 ký tự'),
  phone: z
    .string()
    .trim()
    .max(20, 'Số điện thoại tối đa 20 ký tự')
    .refine(
      (value) => value === '' || isPlausibleVietnamesePhone(value),
      'Số điện thoại không hợp lệ. Ví dụ: 0912 345 678',
    ),
  email: z
    .string()
    .trim()
    .max(100, 'Email tối đa 100 ký tự')
    .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Email không hợp lệ'),
  address: z.string().trim().max(255, 'Địa chỉ tối đa 255 ký tự'),
  notes: z.string().trim().max(1000, 'Ghi chú tối đa 1000 ký tự'),
  status: z.enum(['active', 'archived']),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>
