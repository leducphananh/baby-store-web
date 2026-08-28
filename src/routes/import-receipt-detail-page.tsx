import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Ban, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { ROUTES } from '@/routes/route-paths'
import { ImportReceiptDetailHeader } from '@/features/import-receipts/components/import-receipt-detail-header'
import { ImportReceiptFormDialog } from '@/features/import-receipts/components/import-receipt-form-dialog'
import { ImportReceiptLinesCard } from '@/features/import-receipts/components/import-receipt-lines-card'
import { ImportReceiptStatusBadge } from '@/features/import-receipts/components/import-receipt-status-badge'
import { useCancelImportReceipt } from '@/features/import-receipts/hooks/use-cancel-import-receipt'
import { useImportReceipt } from '@/features/import-receipts/hooks/use-import-receipt'

function BackLink() {
  return (
    <Link
      to={ROUTES.imports}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Danh sách phiếu nhập
    </Link>
  )
}

function ImportReceiptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const receiptQuery = useImportReceipt(id)
  const cancelReceipt = useCancelImportReceipt()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  if (receiptQuery.isLoading) {
    return <PageLoading />
  }

  if (receiptQuery.isError) {
    return (
      <PageContent>
        <BackLink />
        <ErrorState
          message="Không thể tải thông tin phiếu nhập. Vui lòng thử lại."
          onRetry={() => void receiptQuery.refetch()}
        />
      </PageContent>
    )
  }

  const receipt = receiptQuery.data
  if (!receipt) {
    return (
      <PageContent>
        <BackLink />
        <EmptyState
          title="Không tìm thấy phiếu nhập"
          description="Phiếu nhập này có thể không tồn tại hoặc đường dẫn không đúng."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.imports}>Về danh sách phiếu nhập</Link>
            </Button>
          }
        />
      </PageContent>
    )
  }

  const isDraft = receipt.status === 'draft'

  return (
    <PageContent>
      <BackLink />

      <PageHeader
        title={`Phiếu nhập ${receipt.receiptNumber}`}
        description={
          receipt.supplierName
            ? `Nhà cung cấp: ${receipt.supplierName}`
            : 'Chưa gán nhà cung cấp'
        }
        actions={
          isDraft ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                <Pencil />
                Sửa
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={cancelReceipt.isPending}
                onClick={() => setIsCancelOpen(true)}
              >
                <Ban />
                Hủy phiếu
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <ImportReceiptStatusBadge status={receipt.status} />
        {receipt.status === 'confirmed' && <span>· Đã ghi vào kho</span>}
      </div>

      <ImportReceiptDetailHeader receipt={receipt} />
      <ImportReceiptLinesCard receipt={receipt} />

      <ImportReceiptFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        receipt={receipt}
      />

      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Hủy phiếu nhập"
        description={
          <>
            Bạn có chắc chắn muốn hủy phiếu nhập <strong>{receipt.receiptNumber}</strong>? Phiếu sẽ
            chuyển sang trạng thái "Đã hủy" và không thể chỉnh sửa lại.
          </>
        }
        confirmLabel="Hủy phiếu"
        variant="destructive"
        isConfirming={cancelReceipt.isPending}
        onConfirm={() =>
          cancelReceipt.mutate(receipt.id, { onSettled: () => setIsCancelOpen(false) })
        }
      />
    </PageContent>
  )
}

export { ImportReceiptDetailPage }
