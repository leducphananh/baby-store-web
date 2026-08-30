import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailRow } from '@/components/common/detail-row'
import { formatCurrencyVND } from '@/utils/currency'
import { formatDate, formatDateTime } from '@/utils/date'
import { ImportReceiptStatusBadge } from '@/features/import-receipts/components/import-receipt-status-badge'
import type { ImportReceipt } from '@/features/import-receipts/types/import-receipt'

/** Read-only header facts for one import receipt. */
export function ImportReceiptDetailHeader({ receipt }: { receipt: ImportReceipt }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin phiếu nhập</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <DetailRow
            label="Mã phiếu"
            value={<span className="font-mono">{receipt.receiptNumber}</span>}
          />
          <DetailRow label="Trạng thái" value={<ImportReceiptStatusBadge status={receipt.status} />} />
          <DetailRow label="Nhà cung cấp" value={receipt.supplierName} />
          <DetailRow label="Ngày nhập" value={formatDate(receipt.importDate)} />
          <DetailRow
            label="Tổng chi phí (ghi nhận)"
            value={formatCurrencyVND(receipt.totalCost)}
          />
          <DetailRow label="Ghi chú" value={receipt.notes} />
          <DetailRow label="Người tạo" value={receipt.createdByName} />
          <DetailRow
            label="Ngày tạo"
            value={receipt.createdAt ? formatDateTime(receipt.createdAt) : null}
          />
          {receipt.status === 'confirmed' && (
            <>
              <DetailRow
                label="Xác nhận lúc"
                value={receipt.confirmedAt ? formatDateTime(receipt.confirmedAt) : null}
              />
              <DetailRow label="Xác nhận bởi" value={receipt.confirmedByName} />
            </>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
