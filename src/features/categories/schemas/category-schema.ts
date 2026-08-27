import { z } from 'zod'

/**
 * Shared by both create and edit forms (see `react-hook-form-zod`) — the
 * category form has the exact same two fields either way, so one schema
 * and one form component cover both, no `.partial()`/composition needed.
 *
 * `description` stays a plain (possibly empty) string here so the form
 * input is always controlled; the empty-string-vs-`null` mapping to the
 * database column happens at the API boundary (`toCategoryInsert`), not in
 * the schema.
 */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên danh mục')
    .max(100, 'Tên danh mục tối đa 100 ký tự'),
  description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự'),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
