import { z } from 'zod'

/**
 * One cart line on the Create Order screen (`OrderFormValues.items`).
 * `availableQuantity` is a client-side snapshot (the product's sellable
 * stock when it was searched/added) used only for the second layer of the
 * "don't oversell" guard below — never sent to the server and never treated
 * as authoritative. The RPC (`create_order` → `complete_order`) re-checks
 * real, row-locked stock at submit time regardless, so a stale snapshot can
 * only ever make this client-side guard *stricter* than reality, never
 * looser (see `create-order.ts`).
 */
const orderItemDraftSchema = z
  .object({
    productId: z.string(),
    productName: z.string(),
    productSku: z.string(),
    unit: z.string(),
    quantity: z.number().int('Số lượng phải là số nguyên').positive('Số lượng phải lớn hơn 0'),
    unitPrice: z.number().int('Đơn giá phải là số nguyên').min(0, 'Đơn giá không được âm'),
    availableQuantity: z.number().int(),
  })
  .refine((item) => item.quantity <= item.availableQuantity, {
    message: 'Số lượng vượt quá tồn kho khả dụng',
    path: ['quantity'],
  })

export const orderFormSchema = z.object({
  /** `null` = no customer (a walk-in / "khách lẻ" sale) — `orders.customer_id` is nullable. */
  customerId: z.string().nullable(),
  customerName: z.string().nullable(),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự'),
  items: z.array(orderItemDraftSchema).min(1, 'Đơn hàng phải có ít nhất một sản phẩm'),
})

export type OrderItemDraft = z.infer<typeof orderItemDraftSchema>
export type OrderFormValues = z.infer<typeof orderFormSchema>
