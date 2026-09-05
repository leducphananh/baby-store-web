import type { StockStatus, StockStatusFilter } from '@/features/inventory/types/inventory-overview'

/**
 * Inventory Report domain types (Phase 7.5). Unlike Revenue/Profit/Product
 * Performance, this is a CURRENT-STATE snapshot — none of these types (or
 * the RPCs behind them) take a date range (requirement §2/§56). "Now"
 * means whatever `product_batches.remaining_quantity` says at query time.
 *
 * `StockStatus`/`StockStatusFilter` are reused verbatim from the Phase 4.6
 * Inventory Dashboard (`features/inventory/types/inventory-overview.ts`) —
 * this report's stock classification is the exact same
 * `product_inventory_overview.stock_status`, never a second definition
 * (requirement §72).
 */
export type { StockStatus, StockStatusFilter }

export type InventoryValueSummary = {
  /** `COUNT(DISTINCT product_id)` with `current_quantity > 0` — active or archived, any product with real physical stock (requirement §16/§21). */
  productsInStockCount: number
  /** `SUM(current_quantity)` across every in-stock product — a raw unit count across possibly-different packaging units, never implied to be physically comparable (requirement §17). */
  totalUnits: number
  /** Integer VND — `SUM(batch.remaining_quantity * batch.purchase_price)`, each remaining batch's own historical acquisition cost. Never current product/supplier price. */
  totalInventoryValue: number
  /** Same `product_inventory_overview.stock_status = 'low_stock'` count as the Phase 4.6 Inventory Dashboard's own alert card. */
  lowStockCount: number
  /** Same `product_inventory_overview.stock_status = 'out_of_stock'` count as the Phase 4.6 Inventory Dashboard's own alert card. */
  outOfStockCount: number
  /**
   * Defense-in-depth: batches with no `product_id` (schema-legal, unlike a
   * null cost or negative quantity, both prevented by NOT NULL/CHECK
   * constraints — see the migration comment) would otherwise silently
   * vanish from every per-product/category total here. Expected to always
   * be 0 for real data.
   */
  orphanBatchCount: number
  orphanBatchValue: number
}

export type InventoryReportSortField = 'name' | 'current_quantity' | 'batch_count' | 'average_cost' | 'inventory_value'

export type InventoryReportRow = {
  productId: string
  productName: string
  sku: string
  categoryId: string | null
  categoryName: string | null
  unit: string
  /** Current active/archived status — context only, never filtered on (requirement §21/§24: historical/current stock stays visible regardless). */
  productStatus: 'active' | 'archived'
  currentQuantity: number
  /** Count of batches with `remaining_quantity > 0`. */
  batchCount: number
  /** Integer VND — this product's share of `totalInventoryValue`. */
  inventoryValue: number
  /** Integer VND, rounded — `inventoryValue / currentQuantity` (weighted by remaining quantity, never a plain average of batch prices). `null` at zero quantity, never 0/NaN. */
  averageCost: number | null
  minimumStock: number
  stockStatus: StockStatus
  /** Soonest `expiration_date` among this product's batches with stock left; `null` if none. Lightweight context only — expiry risk analysis belongs to Phase 7.6 (requirement §38). */
  nearestExpiration: string | null
}

export type InventoryReportPage = {
  data: InventoryReportRow[]
  total: number
}

export type InventoryReportFilters = {
  search: string
  categoryId: string | null
  stockStatus: StockStatusFilter
  sortField: InventoryReportSortField
  sortDesc: boolean
  page: number
  pageSize: number
}

/** One category's current inventory valuation — `categoryId: null` groups every currently-uncategorized product together ("Chưa phân loại"), never dropped. */
export type InventoryCategoryRow = {
  categoryId: string | null
  categoryName: string | null
  productCount: number
  totalQuantity: number
  inventoryValue: number
}

/**
 * The two inventory alert types `get_inventory_alert_conditions()` (Phase
 * 8.2) reports on — deliberately not the full `AlertType` union: this RPC
 * only ever groups `product_inventory_overview.stock_status`, so it can
 * never produce an expiry/slow-moving condition.
 */
export type InventoryAlertType = 'inventory_out_of_stock' | 'inventory_low_stock'

/**
 * One inventory alert type's current occurrence data (Phase 8.2) — the
 * lightweight entity-aware replacement for reading `outOfStockCount`/
 * `lowStockCount` off `InventoryValueSummary` for alert purposes
 * specifically. `fingerprint` already encodes both the affected product-id
 * set AND the store-wide occurrence lifecycle (see
 * `OperationalAlert.fingerprint`'s doc comment) — never rebuild it
 * client-side from `sampleProductNames`, which is display-only and
 * truncated to at most 3 names.
 */
export type InventoryAlertCondition = {
  alertType: InventoryAlertType
  affectedCount: number
  fingerprint: string
  sampleProductNames: string[]
}
