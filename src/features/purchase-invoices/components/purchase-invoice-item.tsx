import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DetailRow } from '@/components/common/detail-row'
import { formatDate, formatDateTime } from '@/utils/date'
import { PurchaseInvoiceFileList } from '@/features/purchase-invoices/components/purchase-invoice-file-list'
import type { PurchaseInvoice } from '@/features/purchase-invoices/types/purchase-invoice'

/**
 * One purchase invoice inside the card: its header facts, its attachments,
 * and (when the receipt still allows management) edit / delete actions.
 */
export function PurchaseInvoiceItem({
  invoice,
  importReceiptId,
  canManage,
  onEdit,
  onDelete,
}: {
  invoice: PurchaseInvoice
  importReceiptId: string
  canManage: boolean
  onEdit: (invoice: PurchaseInvoice) => void
  onDelete: (invoice: PurchaseInvoice) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">
            Hóa đơn <span className="font-mono">{invoice.invoiceNumber}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Ngày hóa đơn: {formatDate(invoice.invoiceDate)}
          </p>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Thao tác với hóa đơn ${invoice.invoiceNumber}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(invoice)}>
                <Pencil />
                Sửa
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(invoice)}>
                <Trash2 />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <dl>
        <DetailRow label="Ghi chú" value={invoice.notes} />
        <DetailRow label="Người tạo" value={invoice.createdByName} />
        <DetailRow
          label="Ngày tạo"
          value={invoice.createdAt ? formatDateTime(invoice.createdAt) : null}
        />
      </dl>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Tệp đính kèm</p>
        <PurchaseInvoiceFileList
          importReceiptId={importReceiptId}
          invoiceId={invoice.id}
          files={invoice.files}
          canManage={canManage}
        />
      </div>
    </div>
  )
}
