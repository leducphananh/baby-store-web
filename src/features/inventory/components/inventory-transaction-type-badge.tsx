import { Badge } from '@/components/ui/badge'
import { INVENTORY_TYPE_META } from '@/features/inventory/utils/inventory-transaction-labels'
import type { InventoryTransactionType } from '@/features/inventory/types/inventory-transaction'

/** Vietnamese label + tone for one `inventory_transactions.type` value. */
export function InventoryTransactionTypeBadge({ type }: { type: InventoryTransactionType }) {
  const meta = INVENTORY_TYPE_META[type]
  return <Badge variant={meta.tone}>{meta.label}</Badge>
}
