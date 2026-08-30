import type { CustomerOrdersFilters, OrdersFilters } from '@/features/orders/types/order'

/** Same convention as `importReceiptKeys` (see `react-query`). */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrdersFilters) => [...orderKeys.lists(), filters] as const,
  byCustomer: (customerId: string) => [...orderKeys.all, 'by-customer', customerId] as const,
  byCustomerList: (filters: CustomerOrdersFilters) =>
    [...orderKeys.byCustomer(filters.customerId), 'list', filters] as const,
  customerSummary: (customerId: string) => [...orderKeys.all, 'customer-summary', customerId] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  lines: (id: string) => [...orderKeys.detail(id), 'lines'] as const,
  payments: (id: string) => [...orderKeys.detail(id), 'payments'] as const,
}
