import { getStoreInfo } from '@/lib/store-info'
import type { OrderDetail, OrderLine, OrderPayment } from '@/features/orders/types/order-detail'

/** e.g. `buildOrderPdfFileName('ORD-001')` → `"don-hang-ORD-001.pdf"`. */
function buildOrderPdfFileName(orderNumber: string): string {
  return `don-hang-${orderNumber}.pdf`
}

/**
 * Renders one order to a PDF (via `@react-pdf/renderer`, not a screenshot —
 * see `pdf-export` skill rule 2) and triggers a browser download. Runs
 * entirely client-side; there is no server/edge-function step. Called from
 * `ExportOrderPdfButton`, never inline in a click handler (`pdf-export`
 * skill rule 5).
 *
 * `@react-pdf/renderer` (plus its `fontkit`/`yoga-layout` dependencies) is
 * a heavy library — roughly doubling the app's main bundle when imported
 * statically — that most page loads never touch. Both it and the document
 * definition are dynamically imported here so bundlers split them into a
 * separate chunk, fetched only when a user actually clicks "Xuất PDF"
 * (CLAUDE.md §11 priority 7 — performance).
 */
export async function downloadOrderPdf({
  order,
  lines,
  payments,
}: {
  order: OrderDetail
  lines: OrderLine[]
  payments: OrderPayment[]
}): Promise<void> {
  const [{ pdf }, { OrderPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/features/orders/components/order-pdf-document'),
  ])

  const blob = await pdf(
    <OrderPdfDocument
      order={order}
      lines={lines}
      payments={payments}
      storeInfo={getStoreInfo()}
      generatedAt={new Date()}
    />,
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = buildOrderPdfFileName(order.orderNumber)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Revoke on a delay, not immediately: some browsers start the download
  // asynchronously after the click, and revoking too early can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
