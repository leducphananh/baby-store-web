import { supabase } from '@/lib/supabase'
import { nextDay } from '@/features/import-receipts/utils/import-receipt-date'
import type {
  ImportReceipt,
  ImportReceiptFilters,
  ImportReceiptStatus,
} from '@/features/import-receipts/types/import-receipt'

/**
 * Explicit shape of the list `select`. Built for `.returns<T>()` because the
 * dynamic filter chain plus embedded relations degrade supabase-js's
 * generic inference (same approach as `products/api/get-products.ts`).
 */
export type ImportReceiptListRow = {
  id: string
  receipt_number: string
  supplier_id: string | null
  import_date: string
  notes: string | null
  status: string
  total_cost: number
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  confirmed_at: string | null
  suppliers: { name: string } | null
  profiles: { full_name: string | null } | null
  confirmed_by_profile: { full_name: string | null } | null
  import_receipt_items: { count: number }[]
}

const LIST_COLUMNS =
  'id, receipt_number, supplier_id, import_date, notes, status, total_cost, created_by, ' +
  'created_at, updated_at, confirmed_at, suppliers(name), ' +
  'profiles!import_receipts_created_by_fkey(full_name), ' +
  // Second FK to the same `profiles` table needs both the `!constraint`
  // hint (to disambiguate from the `created_by` relation above) and an
  // alias (`confirmed_by_profile:`) so PostgREST doesn't collide both
  // relations under the same `profiles` response key.
  'confirmed_by_profile:profiles!import_receipts_confirmed_by_fkey(full_name), ' +
  'import_receipt_items(count)'

function toStatus(value: string): ImportReceiptStatus {
  // Guaranteed by the DB CHECK constraint; fall back rather than widening.
  if (value === 'confirmed') return 'confirmed'
  if (value === 'cancelled') return 'cancelled'
  return 'draft'
}

export function rowToImportReceipt(row: ImportReceiptListRow): ImportReceipt {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    supplierId: row.supplier_id,
    supplierName: row.suppliers?.name ?? null,
    importDate: row.import_date,
    notes: row.notes,
    status: toStatus(row.status),
    totalCost: row.total_cost,
    createdById: row.created_by,
    createdByName: row.profiles?.full_name ?? null,
    itemCount: row.import_receipt_items[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
    confirmedByName: row.confirmed_by_profile?.full_name ?? null,
  }
}

export type ImportReceiptsPage = {
  data: ImportReceipt[]
  total: number
}

/**
 * Server-driven import-receipt list: search by code, supplier, status, and
 * an inclusive `import_date` range — all in Postgres (see `table-data-grid`,
 * `supabase-database`). Item count comes from an embedded `count` aggregate,
 * so one round trip regardless of page size (no N+1).
 */
export async function getImportReceipts(
  filters: ImportReceiptFilters,
): Promise<ImportReceiptsPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('import_receipts').select(LIST_COLUMNS, { count: 'exact' })

  const search = filters.search.trim()
  if (search) {
    // Strip PostgREST filter delimiters from raw input (see `frontend-security`).
    const safeSearch = search.replace(/[,()%]/g, ' ').trim()
    if (safeSearch) query = query.ilike('receipt_number', `%${safeSearch}%`)
  }

  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId)
  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.fromDate) query = query.gte('import_date', filters.fromDate)
  // Exclusive upper bound at the start of the next day so the whole `toDate` is included.
  if (filters.toDate) query = query.lt('import_date', nextDay(filters.toDate))

  query = query
    .order(filters.sortField, { ascending: !filters.sortDesc })
    .order('id', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query.returns<ImportReceiptListRow[]>()
  if (error) throw error

  return { data: (data ?? []).map(rowToImportReceipt), total: count ?? 0 }
}
