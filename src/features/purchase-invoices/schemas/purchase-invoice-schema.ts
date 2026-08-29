import { z } from 'zod'

const YMD = /^\d{4}-\d{2}-\d{2}$/

/**
 * Header form for a purchase VAT / red invoice, shared by create and edit
 * (see `react-hook-form-zod`, same pattern as `import-receipt-schema.ts`).
 *
 * The supplier is not a field here — it is inherited from the parent import
 * receipt and shown read-only. `invoiceDate` is a `YYYY-MM-DD` calendar date
 * (Postgres `date` column); it is stored verbatim, with no timezone
 * conversion (see `@/utils/date`).
 */
export const purchaseInvoiceFormSchema = z.object({
  invoiceNumber: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số hóa đơn')
    .max(50, 'Số hóa đơn tối đa 50 ký tự'),
  invoiceDate: z
    .string()
    .min(1, 'Vui lòng chọn ngày hóa đơn')
    .regex(YMD, 'Ngày hóa đơn không hợp lệ')
    .refine(
      (value) => !Number.isNaN(new Date(`${value}T12:00:00`).getTime()),
      'Ngày hóa đơn không hợp lệ',
    ),
  notes: z.string().trim().max(1000, 'Ghi chú tối đa 1000 ký tự'),
})

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceFormSchema>
