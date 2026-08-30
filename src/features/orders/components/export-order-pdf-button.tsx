import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useOrderLines } from '@/features/orders/hooks/use-order-lines'
import { useOrderPayments } from '@/features/orders/hooks/use-order-payments'
import { downloadOrderPdf } from '@/features/orders/utils/generate-order-pdf'
import type { OrderDetail } from '@/features/orders/types/order-detail'

/**
 * Exports the current order to a print-friendly A4 PDF (Phase 6.6). Reuses
 * `useOrderLines`/`useOrderPayments` — the exact same TanStack Query cache
 * already backing `OrderLinesCard`/`OrderPaymentsCard` on this page — so the
 * PDF is always built from the same order-detail source of truth as what's
 * on screen, never a second/duplicated fetch (`pdf-export` skill rule 1).
 * Disabled until that data has actually loaded, so a click can never race an
 * in-flight query.
 */
export function ExportOrderPdfButton({ order }: { order: OrderDetail }) {
  const linesQuery = useOrderLines(order.id)
  const paymentsQuery = useOrderPayments(order.id)
  const [isGenerating, setIsGenerating] = useState(false)

  const lines = linesQuery.data
  const payments = paymentsQuery.data
  const isDataReady = lines !== undefined && payments !== undefined

  async function handleExport() {
    if (!lines || !payments) return
    setIsGenerating(true)
    try {
      await downloadOrderPdf({ order, lines, payments })
    } catch {
      toast.error('Không thể xuất PDF đơn hàng. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant="outline" disabled={!isDataReady || isGenerating} onClick={() => void handleExport()}>
      {isGenerating ? <Loader2 className="animate-spin" /> : <Download />}
      {isGenerating ? 'Đang tạo PDF...' : 'Xuất PDF'}
    </Button>
  )
}
