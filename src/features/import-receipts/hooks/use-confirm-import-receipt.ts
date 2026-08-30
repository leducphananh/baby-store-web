import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { batchKeys } from '@/features/batches/api/query-keys'
import { confirmImportReceipt } from '@/features/import-receipts/api/confirm-import-receipt'
import { importReceiptKeys } from '@/features/import-receipts/api/query-keys'
import { getConfirmImportReceiptErrorMessage } from '@/features/import-receipts/utils/get-confirm-import-receipt-error-message'
import { inventoryOverviewKeys, inventoryTransactionKeys } from '@/features/inventory/api/query-keys'
import { productKeys } from '@/features/products/api/query-keys'

/**
 * Posts a draft receipt's stock into inventory (see
 * `confirm-import-receipt.ts`). On success, invalidates every query this
 * can affect — the receipt itself, the receipt list (status badge), the
 * batches it just created, and every stock-derived view (product list,
 * every product detail/batches, the inventory dashboard, the transaction
 * ledger) — since a multi-item receipt can touch several unrelated
 * products at once and the confirm RPC doesn't report back which ones
 * (`react-query` rule 8: invalidate at the narrowest correct scope, but a
 * scope that's still actually correct — see `productKeys.details()`, which
 * covers every product's `detail`/`batches` sub-keys via prefix match, not
 * just one specific id).
 */
export function useConfirmImportReceipt(receiptId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => confirmImportReceipt(receiptId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.detail(receiptId) })
      void queryClient.invalidateQueries({ queryKey: importReceiptKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: batchKeys.byReceipt(receiptId) })
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: productKeys.details() })
      void queryClient.invalidateQueries({ queryKey: inventoryOverviewKeys.all })
      void queryClient.invalidateQueries({ queryKey: inventoryTransactionKeys.lists() })
      toast.success('Xác nhận nhập hàng thành công.')
    },
    onError: (error) => {
      toast.error(getConfirmImportReceiptErrorMessage(error))
    },
  })
}
