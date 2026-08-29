import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PurchaseInvoiceFormDialog } from '@/features/purchase-invoices/components/purchase-invoice-form-dialog'
import { PurchaseInvoiceItem } from '@/features/purchase-invoices/components/purchase-invoice-item'
import { useDeletePurchaseInvoice } from '@/features/purchase-invoices/hooks/use-delete-purchase-invoice'
import { usePurchaseInvoices } from '@/features/purchase-invoices/hooks/use-purchase-invoices'
import type { PurchaseInvoice } from '@/features/purchase-invoices/types/purchase-invoice'
import type { ImportReceipt } from '@/features/import-receipts/types/import-receipt'

/**
 * Purchase VAT / red-invoice management for one import receipt, shown as a
 * card on the receipt detail page. The supplier is inherited from the
 * receipt (shown read-only, one source of truth); each invoice carries its
 * number, date, notes and file attachments.
 *
 * A `cancelled` receipt is a voided document — its invoices stay visible for
 * traceability but can no longer be added to or edited (`canManage`).
 */
export function PurchaseInvoicesCard({ receipt }: { receipt: ImportReceipt }) {
  const invoicesQuery = usePurchaseInvoices(receipt.id)
  const deleteInvoice = useDeletePurchaseInvoice(receipt.id)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PurchaseInvoice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PurchaseInvoice | null>(null)

  const canManage = receipt.status !== 'cancelled'
  const invoices = invoicesQuery.data ?? []
  const showEmpty = !invoicesQuery.isLoading && !invoicesQuery.isError && invoices.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hóa đơn GTGT / hóa đơn đỏ</CardTitle>
        <p className="text-sm text-muted-foreground">
          {receipt.supplierName
            ? `Nhà cung cấp: ${receipt.supplierName}`
            : 'Phiếu nhập chưa gán nhà cung cấp'}
        </p>
        <CardAction>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} disabled={!canManage}>
            <Plus />
            Thêm hóa đơn
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">
        {invoicesQuery.isError ? (
          <ErrorState
            message="Không thể tải danh sách hóa đơn."
            onRetry={() => void invoicesQuery.refetch()}
          />
        ) : invoicesQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : showEmpty ? (
          <EmptyState
            icon={FileText}
            title="Chưa có hóa đơn"
            description={
              canManage
                ? 'Thêm hóa đơn GTGT của nhà cung cấp và đính kèm bản scan (PDF hoặc ảnh).'
                : 'Phiếu nhập này đã hủy và không có hóa đơn nào được ghi nhận.'
            }
            action={
              canManage ? (
                <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
                  <Plus />
                  Thêm hóa đơn
                </Button>
              ) : undefined
            }
          />
        ) : (
          invoices.map((invoice) => (
            <PurchaseInvoiceItem
              key={invoice.id}
              invoice={invoice}
              importReceiptId={receipt.id}
              canManage={canManage}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </CardContent>

      <PurchaseInvoiceFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        importReceiptId={receipt.id}
      />

      <PurchaseInvoiceFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        importReceiptId={receipt.id}
        invoice={editTarget ?? undefined}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa hóa đơn"
        description={
          <>
            Xóa hóa đơn <strong>{deleteTarget?.invoiceNumber}</strong> khỏi phiếu nhập này? Mọi tệp
            đính kèm cũng sẽ bị xóa khỏi kho lưu trữ và không thể khôi phục.
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        isConfirming={deleteInvoice.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteInvoice.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })
        }}
      />
    </Card>
  )
}
