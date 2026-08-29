/**
 * Query key factory for batch views (see `react-query`). Batches listed
 * *by product* on the product detail page keep using
 * `productKeys.batches(productId)`; this factory covers the other entry
 * points.
 */
export const batchKeys = {
  all: ['batches'] as const,
  byReceipt: (receiptId: string) => [...batchKeys.all, 'by-receipt', receiptId] as const,
  /** Lean lot list for pickers/filters scoped to one product. */
  optionsByProduct: (productId: string) => [...batchKeys.all, 'options', productId] as const,
}
