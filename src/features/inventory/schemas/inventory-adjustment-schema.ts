import { z } from 'zod'

import { INVENTORY_ADJUSTMENT_OPERATION_TYPES } from '@/features/inventory/types/inventory-adjustment'

/**
 * Client-side validation only — for immediate feedback (requirement §61).
 * The DB (`adjust_inventory()`) remains authoritative for every one of
 * these rules, re-checked against the row-locked current quantity at
 * submit time; this schema exists so a typo doesn't need a round trip to
 * discover, not to replace server validation (requirement §41/§124).
 *
 * A factory (not a static schema) because "is this quantity valid" depends
 * on `currentQuantity`, known only once a batch is selected — same
 * justified-abstraction reasoning as any other runtime-parameterized Zod
 * schema in this codebase.
 */
export function buildInventoryAdjustmentFormSchema(currentQuantity: number) {
  return z
    .object({
      operationType: z.enum(INVENTORY_ADJUSTMENT_OPERATION_TYPES),
      /** Meaningful only for write-off reasons. */
      writeOffQuantity: z.number().int(),
      /** Meaningful only for `STOCK_COUNT`. */
      actualQuantity: z.number().int().min(0, 'Số lượng thực tế không được nhỏ hơn 0'),
      note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự'),
    })
    .superRefine((values, ctx) => {
      if (values.operationType === 'STOCK_COUNT') {
        if (values.actualQuantity === currentQuantity) {
          ctx.addIssue({
            code: 'custom',
            message: 'Số lượng thực tế trùng với tồn hiện tại — không có gì để điều chỉnh',
            path: ['actualQuantity'],
          })
        }
        return
      }

      if (values.writeOffQuantity <= 0) {
        ctx.addIssue({ code: 'custom', message: 'Số lượng hủy phải lớn hơn 0', path: ['writeOffQuantity'] })
      } else if (values.writeOffQuantity > currentQuantity) {
        ctx.addIssue({
          code: 'custom',
          message: `Số lượng hủy không được vượt quá tồn hiện tại (${currentQuantity})`,
          path: ['writeOffQuantity'],
        })
      }

      if (values.operationType === 'MANUAL_ADJUSTMENT' && values.note.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Vui lòng nhập ghi chú cho lý do "Khác"', path: ['note'] })
      }
    })
}

export type InventoryAdjustmentFormValues = z.infer<ReturnType<typeof buildInventoryAdjustmentFormSchema>>
