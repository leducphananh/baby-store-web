import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { Customer, CustomerFilters, CustomerStatus } from '@/features/customers/types/customer'

type CustomerRow = Tables<'customers'>

function isCustomerStatus(value: string): value is CustomerStatus {
  return value === 'active' || value === 'archived'
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    // Fall back to 'active' for the (currently impossible, per the DB CHECK
    // constraint) case of an unrecognized value, rather than widening the
    // domain type to `string`.
    status: isCustomerStatus(row.status) ? row.status : 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type CustomersPage = {
  data: Customer[]
  total: number
}

/**
 * Server-driven list query — same shape as `getSuppliers` (see
 * `table-data-grid`). Search matches name or phone only, per this
 * feature's scope (email isn't part of the customer search requirement).
 */
export async function getCustomers(filters: CustomerFilters): Promise<CustomersPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('customers').select('*', { count: 'exact' })

  const search = filters.search.trim()
  if (search) {
    // `,`/`(`/`)` are PostgREST `.or()` filter syntax delimiters — strip
    // them from user input so a search containing one can't break the
    // filter expression (see `frontend-security`).
    const safeSearch = search.replace(/[,()]/g, ' ').trim()
    if (safeSearch) {
      query = query.or(`name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`)
    }
  }

  query = query.order(filters.sortField, { ascending: !filters.sortDesc }).range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  return { data: data.map(toCustomer), total: count ?? 0 }
}
