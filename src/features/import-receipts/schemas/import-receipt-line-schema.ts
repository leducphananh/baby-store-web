import { z } from 'zod'

const YMD = /^\d{4}-\d{2}-\d{2}$/

/**
 * Shared by add and edit (see `react-hook-form-zod`). The product itself is
 * NOT part of this schema — it's chosen once via `ProductComboBox` when a
 * line is added and is fixed after that; to change which product a line
 * refers to, remove it and add a new one (matches how a real purchasing
 * form/PO works, and keeps "which product" from silently changing under an
 * already-confirmed cost calculation).
 *
 * `quantity`/`purchasePrice` are real `number`s (see `IntegerField`) — never
 * floats (CLAUDE.md §8, `domain-driven-frontend` rule 1). Dates stay plain
 * `YYYY-MM-DD` strings, optional (many receipts won't track lot/expiry for
 * every line), mapped to `null` at the API boundary.
 */
export const importReceiptLineFormSchema = z
  .object({
    quantity: z
      .number()
      .int('Số lượng phải là số nguyên')
      .positive('Số lượng phải lớn hơn 0'),
    purchasePrice: z
      .number()
      .int('Đơn giá phải là số nguyên')
      .min(0, 'Đơn giá không được âm'),
    lotNumber: z.string().trim().max(50, 'Số lô tối đa 50 ký tự'),
    manufactureDate: z
      .string()
      .trim()
      .refine((value) => value === '' || YMD.test(value), 'Ngày sản xuất không hợp lệ'),
    expirationDate: z
      .string()
      .trim()
      .refine((value) => value === '' || YMD.test(value), 'Hạn sử dụng không hợp lệ'),
  })
  .refine(
    (values) =>
      !values.manufactureDate || !values.expirationDate
        ? true
        : values.expirationDate >= values.manufactureDate,
    // Matches the DB CHECK and the import-item RPCs: equal dates are allowed,
    // expiry simply may not fall before manufacture.
    { message: 'Hạn sử dụng không được trước ngày sản xuất', path: ['expirationDate'] },
  )

export type ImportReceiptLineFormValues = z.infer<typeof importReceiptLineFormSchema>
