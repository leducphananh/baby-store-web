import { z } from 'zod'

/**
 * Shared by create and edit (see `react-hook-form-zod`). All contact fields
 * are optional in the database, so they stay plain (possibly empty)
 * strings here for a fully-controlled form — the empty-string-to-`null`
 * mapping happens at the API boundary, not in the schema (see
 * `category-schema.ts` for the same pattern). Format checks only run when
 * a field is actually filled in; an empty optional field is always valid.
 */
export const supplierFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên nhà cung cấp')
    .max(150, 'Tên nhà cung cấp tối đa 150 ký tự'),
  contactPerson: z.string().trim().max(100, 'Tên người liên hệ tối đa 100 ký tự'),
  phone: z
    .string()
    .trim()
    .max(20, 'Số điện thoại tối đa 20 ký tự')
    .refine((value) => value === '' || /^[0-9+\-\s]{6,20}$/.test(value), 'Số điện thoại không hợp lệ'),
  email: z
    .string()
    .trim()
    .max(100, 'Email tối đa 100 ký tự')
    .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Email không hợp lệ'),
  address: z.string().trim().max(255, 'Địa chỉ tối đa 255 ký tự'),
  taxCode: z.string().trim().max(20, 'Mã số thuế tối đa 20 ký tự'),
  notes: z.string().trim().max(1000, 'Ghi chú tối đa 1000 ký tự'),
  status: z.enum(['active', 'archived']),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>
