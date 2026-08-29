/**
 * Query key factory for batch views (see `react-query`). Batches listed
 * *by product* keep using `productKeys.batches(productId)` on the product
 * detail page; this factory covers the other entry points.
 */
export const batchKeys = {
  all: ['batches'] as const,
  byReceipt: (receiptId: string) => [...batchKeys.all, 'by-receipt', receiptId] as const,
}
