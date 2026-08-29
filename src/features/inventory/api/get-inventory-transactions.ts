import { supabase } from '@/lib/supabase'
import { nextDayYmd } from '@/utils/date'
import type {
  InventoryReferenceType,
  InventoryTransaction,
  InventoryTransactionFilters,
  InventoryTransactionsPage,
  InventoryTransactionType,
} from '@/features/inventory/types/inventory-transaction'
import { INVENTORY_TRANSACTION_TYPES } from '@/features/inventory/types/inventory-transaction'

/**
 * Explicit shape of the select — the three embedded relations degrade
 * supabase-js's generic inference, so this is a narrow, documented boundary
 * type (same approach as `get-products.ts` / `get-import-receipts.ts`).
 */
type InventoryTransactionRow = {
  id: string
  created_at: string | null
  product_id: string | null
  batch_id: string | null
  type: string
  quantity: number
  reference_type: string
  reference_id: string | null
  note: string | null
  created_by: string | null
  products: { name: string; sku: string; unit: string } | null
  product_batches: { lot_number: string | null; expiration_date: string | null } | null
  profiles: { full_name: string | null } | null
}

const LIST_COLUMNS =
  'id, created_at, product_id, batch_id, type, quantity, reference_type, reference_id, note, ' +
  'created_by, products(name, sku, unit), product_batches(lot_number, expiration_date), ' +
  'profiles!inventory_transactions_created_by_fkey(full_name)'

const TYPE_SET = new Set<string>(INVENTORY_TRANSACTION_TYPES)

function toType(value: string): InventoryTransactionType {
  // Guaranteed by the DB CHECK; fall back rather than widening the domain type.
  return TYPE_SET.has(value) ? (value as InventoryTransactionType) : 'MANUAL_ADJUSTMENT'
}

function toReferenceType(value: string): InventoryReferenceType {
  if (value === 'import') return 'import'
  if (value === 'order') return 'order'
  return 'adjustment'
}

/**
 * Server-driven inventory-transaction ledger: filter by product, batch,
 * type and an inclusive `created_at` date range, newest first, all in
 * Postgres — the client never downloads the whole ledger (`table-data-grid`,
 * `frontend-performance`). Reference document ids (`receipt_number` /
 * `order_number`) are resolved for the current page in two extra batched
 * queries, never one per row.
 */
export async function getInventoryTransactions(
  filters: InventoryTransactionFilters,
): Promise<InventoryTransactionsPage> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase
    .from('inventory_transactions')
    .select(LIST_COLUMNS, { count: 'exact' })

  if (filters.productId) query = query.eq('product_id', filters.productId)
  if (filters.batchId) query = query.eq('batch_id', filters.batchId)
  if (filters.type !== 'all') query = query.eq('type', filters.type)
  if (filters.fromDate) query = query.gte('created_at', filters.fromDate)
  // Exclusive upper bound at the start of the next day so the whole `toDate`
  // is included. `created_at` is `timestamptz`; users are all in one
  // timezone, so a plain date bound is close enough (same simplification as
  // the import-receipt list).
  if (filters.toDate) query = query.lt('created_at', nextDayYmd(filters.toDate))

  query = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query.returns<InventoryTransactionRow[]>()
  if (error) throw error

  const rows = data ?? []
  const referenceLabels = await resolveReferenceLabels(rows)

  const transactions: InventoryTransaction[] = rows.map((row) => {
    const referenceType = toReferenceType(row.reference_type)
    return {
      id: row.id,
      createdAt: row.created_at,
      productId: row.product_id,
      productName: row.products?.name ?? null,
      productSku: row.products?.sku ?? null,
      productUnit: row.products?.unit ?? null,
      batchId: row.batch_id,
      batchLotNumber: row.product_batches?.lot_number ?? null,
      batchExpirationDate: row.product_batches?.expiration_date ?? null,
      type: toType(row.type),
      quantity: row.quantity,
      referenceType,
      referenceId: row.reference_id,
      referenceLabel:
        row.reference_id && referenceType !== 'adjustment'
          ? (referenceLabels.get(`${referenceType}:${row.reference_id}`) ?? null)
          : null,
      note: row.note,
      createdById: row.created_by,
      createdByName: row.profiles?.full_name ?? null,
    }
  })

  return { data: transactions, total: count ?? 0 }
}

/**
 * `"import:<id>"` / `"order:<id>"` → `receipt_number` / `order_number`, for
 * the current page's rows only. Two `.in(...)` queries at most, run in
 * parallel.
 */
async function resolveReferenceLabels(
  rows: InventoryTransactionRow[],
): Promise<Map<string, string>> {
  const importIds = new Set<string>()
  const orderIds = new Set<string>()
  for (const row of rows) {
    if (!row.reference_id) continue
    if (row.reference_type === 'import') importIds.add(row.reference_id)
    else if (row.reference_type === 'order') orderIds.add(row.reference_id)
  }

  const [importRows, orderRows] = await Promise.all([
    fetchReceiptNumbers([...importIds]),
    fetchOrderNumbers([...orderIds]),
  ])

  const labels = new Map<string, string>()
  for (const receipt of importRows) labels.set(`import:${receipt.id}`, receipt.receipt_number)
  for (const order of orderRows) labels.set(`order:${order.id}`, order.order_number)
  return labels
}

async function fetchReceiptNumbers(
  ids: string[],
): Promise<{ id: string; receipt_number: string }[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('import_receipts')
    .select('id, receipt_number')
    .in('id', ids)
  if (error) throw error
  return data ?? []
}

async function fetchOrderNumbers(ids: string[]): Promise<{ id: string; order_number: string }[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('orders').select('id, order_number').in('id', ids)
  if (error) throw error
  return data ?? []
}
