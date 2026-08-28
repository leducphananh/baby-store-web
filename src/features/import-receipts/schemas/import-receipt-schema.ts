import { z } from 'zod'

const YMD = /^\d{4}-\d{2}-\d{2}$/

/**
 * Header form for an import receipt, shared by create and edit (see
 * `react-hook-form-zod`). Only the header is editable here — line items and
 * stock posting come in a later phase.
 *
 * `supplierId` is required by this form even though `import_receipts.
 * supplier_id` is nullable in the DB: a purchase document without a supplier
 * is a data-quality problem for the store (see `domain-driven-frontend`).
 * `importDate` is a `YYYY-MM-DD` calendar date; the API maps it to a
 * timestamp.
 */
export const importReceiptFormSchema = z.object({
  receiptNumber: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã phiếu nhập')
    .max(50, 'Mã phiếu nhập tối đa 50 ký tự'),
  supplierId: z.string().min(1, 'Vui lòng chọn nhà cung cấp'),
  importDate: z
    .string()
    .min(1, 'Vui lòng chọn ngày nhập')
    .regex(YMD, 'Ngày nhập không hợp lệ')
    .refine((value) => !Number.isNaN(new Date(`${value}T12:00:00`).getTime()), 'Ngày nhập không hợp lệ'),
  notes: z.string().trim().max(1000, 'Ghi chú tối đa 1000 ký tự'),
})

export type ImportReceiptFormValues = z.infer<typeof importReceiptFormSchema>
