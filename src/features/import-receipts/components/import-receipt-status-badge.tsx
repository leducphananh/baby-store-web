import { Badge } from '@/components/ui/badge'
import type { ImportReceiptStatus } from '@/features/import-receipts/types/import-receipt'

const CONFIG: Record<ImportReceiptStatus, { label: string; variant: 'secondary' | 'success' | 'outline' }> = {
  draft: { label: 'Nháp', variant: 'secondary' },
  confirmed: { label: 'Đã xác nhận', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'outline' },
}

/** One place the receipt status → label/variant mapping lives (list + detail). */
export function ImportReceiptStatusBadge({ status }: { status: ImportReceiptStatus }) {
  const { label, variant } = CONFIG[status]
  return <Badge variant={variant}>{label}</Badge>
}
