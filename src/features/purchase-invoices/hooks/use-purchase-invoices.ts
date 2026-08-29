import { useQuery } from '@tanstack/react-query'

import { getPurchaseInvoices } from '@/features/purchase-invoices/api/get-purchase-invoices'
import { purchaseInvoiceKeys } from '@/features/purchase-invoices/api/query-keys'

export function usePurchaseInvoices(importReceiptId: string | undefined) {
  return useQuery({
    queryKey: purchaseInvoiceKeys.listByReceipt(importReceiptId ?? ''),
    queryFn: () => getPurchaseInvoices(importReceiptId as string),
    enabled: Boolean(importReceiptId),
    // Attachment signed URLs live for an hour; refetch well before they expire.
    staleTime: 30 * 60 * 1000,
  })
}
