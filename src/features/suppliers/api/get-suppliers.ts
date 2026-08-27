import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { Supplier, SupplierFilters, SupplierStatus } from '@/features/suppliers/types/supplier'

type SupplierRow = Tables<'suppliers'>

function isSupplierStatus(value: string): value is SupplierStatus {
  return value === 'active' || value === 'archived'
}

function toSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    taxCode: row.tax_code,
    contactPerson: row.contact_person,
    notes: row.notes,
    // Fall back to 'active' for the (currently impossible, per the DB
    // CHECK constraint) case of an unrecognized value, rather than
    // widening the domain type to `string`.
    status: isSupplierStatus(row.status) ? row.status : 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type SuppliersPage = {
  data: Supplier[]
  total: number
}

/**
 * Server-driven list query — same shape as `getCategories` (see
 * `table-data-grid`). Search matches name, phone, or email so staff can
 * find a supplier by whichever detail they have on hand.
 */
export async function getSuppliers(filters: SupplierFilters): Promise<SuppliersPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('suppliers').select('*', { count: 'exact' })

  const search = filters.search.trim()
  if (search) {
    // `,`/`(`/`)` are PostgREST `.or()` filter syntax delimiters — strip
    // them from user input so a search containing one can't break the
    // filter expression (see `frontend-security`: don't string-concatenate
    // raw input into a query filter without care).
    const safeSearch = search.replace(/[,()]/g, ' ').trim()
    if (safeSearch) {
      query = query.or(`name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`)
    }
  }

  query = query.order(filters.sortField, { ascending: !filters.sortDesc }).range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  return { data: data.map(toSupplier), total: count ?? 0 }
}
