/**
 * Domain model for `public.suppliers`. Unlike categories, this table has a
 * real `status` column (`active`/`archived`) — the delete flow leans on it:
 * a supplier blocked from hard deletion (still has import receipts) can be
 * archived instead of destroyed (see CLAUDE.md §32, `domain-driven-frontend`).
 */
export type SupplierStatus = 'active' | 'archived'

export type Supplier = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  taxCode: string | null
  contactPerson: string | null
  notes: string | null
  status: SupplierStatus
  createdAt: string | null
  updatedAt: string | null
}

export type SupplierSortField = 'name' | 'created_at'

export type SupplierFilters = {
  search: string
  page: number
  pageSize: number
  sortField: SupplierSortField
  sortDesc: boolean
}
