/**
 * Query key factory (see `react-query`) — same convention as
 * `importReceiptKeys` / `productKeys`. Purchase invoices are always listed
 * in the context of one import receipt, so the list key is scoped by
 * `importReceiptId`.
 */
export const purchaseInvoiceKeys = {
  all: ['purchase-invoices'] as const,
  lists: () => [...purchaseInvoiceKeys.all, 'list'] as const,
  listByReceipt: (importReceiptId: string) =>
    [...purchaseInvoiceKeys.lists(), { importReceiptId }] as const,
}
