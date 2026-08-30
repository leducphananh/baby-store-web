/**
 * Domain model for `public.customers`. Same `active`/`archived` status
 * pattern as `Supplier` — `orders.customer_id` has `ON DELETE RESTRICT`, so
 * a customer with order history can't be hard-deleted; archiving via this
 * status column is the supported alternative (see `customer-schema.ts`,
 * `get-customer-error-message.ts`).
 */
export type CustomerStatus = 'active' | 'archived'

export type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  status: CustomerStatus
  createdAt: string | null
  updatedAt: string | null
}

export type CustomerSortField = 'name' | 'created_at'

export type CustomerFilters = {
  search: string
  page: number
  pageSize: number
  sortField: CustomerSortField
  sortDesc: boolean
}
