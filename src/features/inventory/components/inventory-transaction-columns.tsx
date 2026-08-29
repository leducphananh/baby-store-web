import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type { DataTableColumn } from '@/components/common/data-table'
import { ROUTES } from '@/routes/route-paths'
import { formatDateTime } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import { formatUnitLabel } from '@/utils/unit'
import { InventoryTransactionTypeBadge } from '@/features/inventory/components/inventory-transaction-type-badge'
import { inventoryReferenceLabel } from '@/features/inventory/utils/inventory-transaction-labels'
import type { InventoryTransaction } from '@/features/inventory/types/inventory-transaction'

/**
 * Signed stock delta. The sign is spelled out (`+` / `−`), not conveyed by
 * colour alone (`accessibility`); the tint is a secondary cue.
 */
function renderQuantityDelta(transaction: InventoryTransaction): ReactNode {
  const isIncrease = transaction.quantity >= 0
  const sign = isIncrease ? '+' : '−'
  const amount = formatNumber(Math.abs(transaction.quantity))
  const unit = formatUnitLabel(transaction.productUnit)
  return (
    <span className={isIncrease ? 'font-medium text-foreground' : 'font-medium text-destructive'}>
      {sign}
      {amount} {unit}
    </span>
  )
}

/** The source document: a link to the import receipt, or the order number as text. */
function renderReference(transaction: InventoryTransaction): ReactNode {
  const { referenceType, referenceId, referenceLabel } = transaction
  const kindLabel = inventoryReferenceLabel(referenceType)

  if (referenceType === 'import' && referenceId) {
    return (
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{kindLabel}</span>
        <Link
          to={ROUTES.importDetail(referenceId)}
          className="font-mono text-xs text-foreground hover:underline"
        >
          {referenceLabel ?? 'Xem'}
        </Link>
      </div>
    )
  }

  if (referenceType === 'order' && (referenceLabel || referenceId)) {
    // Orders have no detail route yet — show the document number as text.
    return (
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{kindLabel}</span>
        <span className="font-mono text-xs text-foreground">{referenceLabel ?? '—'}</span>
      </div>
    )
  }

  return <span className="text-xs text-muted-foreground">{kindLabel}</span>
}

/**
 * Column definitions for the inventory-transaction ledger (see
 * `table-data-grid`). Read-only: the ledger is append-only, so there is no
 * actions column, no edit, no delete.
 */
export const inventoryTransactionColumns: DataTableColumn<InventoryTransaction>[] = [
  {
    id: 'time',
    header: 'Thời gian',
    cell: (transaction) =>
      transaction.createdAt ? (
        formatDateTime(transaction.createdAt)
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'product',
    header: 'Sản phẩm',
    cell: (transaction) => (
      <div className="flex flex-col">
        {transaction.productId ? (
          <Link
            to={ROUTES.productDetail(transaction.productId)}
            className="font-medium text-foreground hover:underline"
          >
            {transaction.productName ?? '—'}
          </Link>
        ) : (
          <span className="font-medium text-foreground">{transaction.productName ?? '—'}</span>
        )}
        {transaction.productSku && (
          <span className="font-mono text-xs text-muted-foreground">{transaction.productSku}</span>
        )}
      </div>
    ),
  },
  {
    id: 'batch',
    header: 'Lô hàng',
    cell: (transaction) =>
      transaction.batchId ? (
        <span className="font-mono text-xs">
          {transaction.batchLotNumber || '(không có số lô)'}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'type',
    header: 'Loại',
    cell: (transaction) => <InventoryTransactionTypeBadge type={transaction.type} />,
  },
  {
    id: 'quantity',
    header: 'Thay đổi',
    align: 'right',
    cell: (transaction) => renderQuantityDelta(transaction),
  },
  {
    id: 'reference',
    header: 'Chứng từ',
    cell: (transaction) => renderReference(transaction),
  },
  {
    id: 'note',
    header: 'Ghi chú',
    cell: (transaction) =>
      transaction.note ? (
        <span className="text-sm text-foreground">{transaction.note}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'user',
    header: 'Người thực hiện',
    cell: (transaction) => (
      <span className={transaction.createdByName ? 'text-foreground' : 'text-muted-foreground'}>
        {transaction.createdByName ?? '—'}
      </span>
    ),
  },
]
