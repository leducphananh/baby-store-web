/**
 * Domain model for manual inventory adjustment/write-off (Phase 8.4) — the
 * one safe, auditable path for changing `product_batches.remaining_quantity`
 * outside of import/sale/cancellation. Every value here maps 1:1 onto a real
 * `inventory_transactions.type` value (there is no separate "reason" column
 * in this schema — the type IS the machine-readable reason, see
 * `adjust_inventory()`'s migration comment); the four write-off reasons are
 * a subset of `INVENTORY_TRANSACTION_TYPES`
 * (`features/inventory/types/inventory-transaction.ts`), never a second,
 * parallel vocabulary.
 */

/**
 * Write-off reasons: always DECREASE stock. `MANUAL_ADJUSTMENT` doubles as
 * the "Khác" (other) bucket and requires a note server-side.
 */
export const WRITE_OFF_OPERATION_TYPES = ['EXPIRED', 'DAMAGE', 'LOST', 'MANUAL_ADJUSTMENT'] as const
export type WriteOffOperationType = (typeof WRITE_OFF_OPERATION_TYPES)[number]

/** The one bidirectional reason: caller supplies the ACTUAL counted quantity, never a delta — the server computes the signed delta from the row-locked current quantity. */
export const STOCK_COUNT_OPERATION_TYPE = 'STOCK_COUNT' as const

export const INVENTORY_ADJUSTMENT_OPERATION_TYPES = [
  ...WRITE_OFF_OPERATION_TYPES,
  STOCK_COUNT_OPERATION_TYPE,
] as const
export type InventoryAdjustmentOperationType = (typeof INVENTORY_ADJUSTMENT_OPERATION_TYPES)[number]

/** Vietnamese, business-friendly labels — never a raw enum value shown to a user (requirement §101/§110). */
export const INVENTORY_ADJUSTMENT_OPERATION_LABELS: Record<InventoryAdjustmentOperationType, string> = {
  EXPIRED: 'Hàng hết hạn',
  DAMAGE: 'Hàng hỏng',
  LOST: 'Thất thoát / thiếu hàng',
  MANUAL_ADJUSTMENT: 'Khác',
  STOCK_COUNT: 'Kiểm kê thực tế',
}

/** The batch this adjustment targets — the minimum a dialog/entry point needs to know, never re-fetched internally (the caller already has it from the table row it came from). */
export type AdjustableBatch = {
  batchId: string
  productId: string
  productName: string
  /** `null` when the caller's data source doesn't carry it (e.g. the Expiry Report) — `formatQuantityWithUnit` falls back to a generic label; never blocks the adjustment itself. */
  unit: string | null
  lotNumber: string | null
  remainingQuantity: number
  expirationDate: string | null
}

export type AdjustInventoryInput = {
  batchId: string
  operationType: InventoryAdjustmentOperationType
  /** Required (> 0) for write-off reasons; ignored for `STOCK_COUNT`. */
  writeOffQuantity?: number
  /** Required (>= 0) for `STOCK_COUNT`; ignored for write-off reasons. */
  actualQuantity?: number
  note?: string
}

/** `adjust_inventory()`'s return row, mapped to camelCase. */
export type InventoryAdjustmentResult = {
  batchId: string
  previousQuantity: number
  newQuantity: number
  /** Signed: negative for a write-off or a downward count correction, positive for an upward one. */
  delta: number
}
