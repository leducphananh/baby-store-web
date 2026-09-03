/**
 * Product Performance Report domain types (Phase 7.4). Mirrors
 * `get_product_performance_summary()`/`get_product_performance_list()`/
 * `get_category_performance()` exactly — all three already enforce
 * "completed orders only, business date = completed_at" server-side and
 * compute revenue/COGS strictly from historical snapshots (see their
 * migration comments); nothing here re-derives, re-filters, or recomputes
 * that rule.
 *
 * "Bán chạy" (sold quantity), "Doanh thu cao" (revenue) and "Lợi nhuận cao"
 * (gross profit) are three deliberately separate metrics/rankings — never
 * collapsed into one ambiguous "top product" figure (requirement §13).
 */

/** What a product/category row (and the table's sortable columns) can be ranked by. Not `average_order_value`-style — every field here is a real, independent business metric (requirement §13/§27). */
export type ProductPerformanceSortField =
  | 'sold_quantity'
  | 'order_count'
  | 'revenue'
  | 'cogs'
  | 'gross_profit'
  | 'gross_margin'

export type ProductPerformanceSummary = {
  /** `COUNT(DISTINCT product_id)` with actual sales in range — never includes a zero-sales product. */
  productsSoldCount: number
  /** `SUM(order_items.quantity)` across all products — a raw unit count across possibly-different packaging units (gói/hộp/bình...), shown with explicit "đơn vị" wording, never implied to be one physical unit (requirement §18). */
  totalUnitsSold: number
  /** The single highest-revenue product in range, or `null` if nothing sold. Not necessarily the highest by sold quantity. */
  topRevenueProduct: { id: string; name: string; revenue: number } | null
  /** The single highest-gross-profit product in range, or `null`. Derived from the same historical COGS as `topRevenueProduct`'s revenue — never from current product margin. */
  topProfitProduct: { id: string; name: string; grossProfit: number } | null
}

/** One product's sales performance for the selected range. */
export type ProductPerformanceRow = {
  productId: string
  productName: string
  sku: string
  /** `null` when the product currently has no category — rendered as "Chưa phân loại" (requirement §38). */
  categoryId: string | null
  categoryName: string | null
  unit: string
  /**
   * The product's CURRENT active/archived status — not a historical
   * snapshot. A product can be archived after its historical sales and
   * still show its full performance here (requirement §24/§67): this
   * report never filters by it, only displays it as context.
   */
  productStatus: 'active' | 'archived'
  soldQuantity: number
  /** Distinct completed orders containing this product — `COUNT(DISTINCT order_id)`, never a count of batch-allocation rows (requirement §47). */
  orderCount: number
  /** Integer VND — `SUM(order_items.line_total)` for this product. */
  revenue: number
  /** Integer VND — `SUM(order_item_batches.quantity * unit_cost)` for this product's allocations. Never current purchase price. */
  cogs: number
  /** Integer VND — `revenue - cogs`. Can be negative; never clamped. */
  grossProfit: number
}

export type ProductPerformancePage = {
  data: ProductPerformanceRow[]
  total: number
}

export type ProductPerformanceFilters = {
  search: string
  categoryId: string | null
  sortField: ProductPerformanceSortField
  sortDesc: boolean
  /** 1-based. */
  page: number
  pageSize: number
}

/** One category's aggregated sales performance for the selected range. */
export type CategoryPerformanceRow = {
  /** `null` groups every currently-uncategorized product's sales together — rendered as "Chưa phân loại", never dropped (requirement §38). */
  categoryId: string | null
  categoryName: string | null
  productCountSold: number
  soldQuantity: number
  orderCount: number
  revenue: number
  cogs: number
  grossProfit: number
}
