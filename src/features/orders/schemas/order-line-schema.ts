import { z } from 'zod'

/**
 * Validates one pending cart line before it's added (see
 * `OrderLineAddPanel`) — `maxQuantity` is the product's *sellable* (non-
 * expired) stock at the moment it was searched, so a cashier can't add more
 * than can actually be FEFO-allocated. This is the first of three layers
 * guarding "never sell unavailable stock": this form, the whole-cart check
 * in `order-form-schema.ts`, and finally `create_order()`'s own FEFO
 * allocation, which is the only one that's race-safe against concurrent
 * sales — see `domain-driven-frontend`.
 *
 * `quantity`/`unitPrice` are real `number`s (see `IntegerField`) — never
 * floats (CLAUDE.md §8: VND/quantities are integers, period).
 */
export function createOrderLineFormSchema(maxQuantity: number) {
  return z.object({
    quantity: z
      .number()
      .int('Số lượng phải là số nguyên')
      .positive('Số lượng phải lớn hơn 0')
      .max(maxQuantity, `Chỉ còn ${maxQuantity} có thể bán`),
    unitPrice: z.number().int('Đơn giá phải là số nguyên').min(0, 'Đơn giá không được âm'),
  })
}

export type OrderLineFormValues = z.infer<ReturnType<typeof createOrderLineFormSchema>>
