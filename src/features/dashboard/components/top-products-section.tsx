import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyVND } from '@/utils/currency'
import { ROUTES } from '@/routes/route-paths'
import { useReportDateRangeStore } from '@/features/reports/hooks/use-report-date-range-store'
import { useProductPerformanceList } from '@/features/reports/hooks/use-product-performance-list'
import { isValidReportDateRange } from '@/features/reports/utils/report-date-range'

const TOP_PRODUCTS_COUNT = 5

/**
 * "Hiệu quả sản phẩm" — top 5 by revenue for the same period as
 * `BusinessOverviewSection` (requirement §14). Reuses
 * `useProductPerformanceList()` (Phase 7.4) with `sortField: 'revenue'`
 * verbatim — the same RPC/ranking Product Performance itself uses, so this
 * is never a second "top product" formula (requirement §58/§59): the same
 * deterministic tiebreakers (revenue desc, then product_id) make this
 * ranking identical to the first 5 rows of that report for the identical
 * range.
 *
 * Explicitly labeled "theo doanh thu", never "bán chạy nhất" — that would
 * mean sold quantity, a different ranking entirely (requirement §15,
 * established in Phase 7.4).
 */
export function TopProductsSection() {
  const range = useReportDateRangeStore((state) => state.range)
  const isRangeValid = isValidReportDateRange(range)

  const listQuery = useProductPerformanceList(range, {
    search: '',
    categoryId: null,
    sortField: 'revenue',
    sortDesc: true,
    page: 1,
    pageSize: TOP_PRODUCTS_COUNT,
  })

  if (!isRangeValid) return null

  const products = listQuery.data?.data ?? []

  return (
    <section data-tour="dashboard-top-products">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Top 5 sản phẩm theo doanh thu</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.productPerformanceReport}>
              Xem báo cáo sản phẩm
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {listQuery.isError ? (
            <ErrorState message="Không thể tải hiệu quả sản phẩm." onRetry={() => void listQuery.refetch()} />
          ) : listQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: TOP_PRODUCTS_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu bán hàng trong khoảng thời gian này." />
          ) : (
            <ul className="divide-y">
              {products.map((product, index) => (
                <li key={product.productId} className="flex items-center gap-3 py-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={ROUTES.productDetail(product.productId)}
                      className="truncate font-medium text-foreground hover:underline"
                    >
                      {product.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">Số lượng bán: {product.soldQuantity}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-foreground">{formatCurrencyVND(product.revenue)}</p>
                    <p
                      className={
                        product.grossProfit < 0 ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'
                      }
                    >
                      LN gộp: {formatCurrencyVND(product.grossProfit)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
