import type {
  InventoryReferenceType,
  InventoryTransactionType,
} from '@/features/inventory/types/inventory-transaction'

type BadgeTone = 'success' | 'secondary' | 'outline' | 'destructive'

type TypeMeta = {
  /** Vietnamese label shown in the type column and the type filter. */
  label: string
  /** `Badge` variant — a loss (damage/expiry) reads differently from a normal sale. */
  tone: BadgeTone
}

/**
 * The one place `inventory_transactions.type` values become Vietnamese
 * labels + a badge tone. Keys are exactly the DB `CHECK` values — no
 * invented types (see `domain-driven-frontend` rule 5).
 */
export const INVENTORY_TYPE_META: Record<InventoryTransactionType, TypeMeta> = {
  IMPORT: { label: 'Nhập kho', tone: 'success' },
  SALE: { label: 'Bán hàng', tone: 'secondary' },
  ORDER_CANCEL: { label: 'Hủy đơn – hoàn kho', tone: 'success' },
  MANUAL_ADJUSTMENT: { label: 'Điều chỉnh thủ công', tone: 'outline' },
  RETURN: { label: 'Trả hàng', tone: 'outline' },
  DAMAGE: { label: 'Hư hỏng', tone: 'destructive' },
  EXPIRED: { label: 'Hết hạn – hủy', tone: 'destructive' },
}

const REFERENCE_LABEL: Record<InventoryReferenceType, string> = {
  import: 'Phiếu nhập',
  order: 'Đơn hàng',
  adjustment: 'Điều chỉnh',
}

export function inventoryReferenceLabel(referenceType: InventoryReferenceType): string {
  return REFERENCE_LABEL[referenceType]
}
