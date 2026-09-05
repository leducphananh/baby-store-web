import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { cn } from '@/lib/utils'
import { AttentionSection } from '@/features/dashboard/components/attention-section'
import { BusinessOverviewSection } from '@/features/dashboard/components/business-overview-section'
import { InventorySnapshotSection } from '@/features/dashboard/components/inventory-snapshot-section'
import { QuickActionsSection } from '@/features/dashboard/components/quick-actions-section'
import { TopProductsSection } from '@/features/dashboard/components/top-products-section'
import { reportsKeys } from '@/features/reports/api/query-keys'

/**
 * Executive Dashboard (Phase 7.7) — the final phase of Phase 7. Replaces
 * the Phase 1 placeholder that has occupied `/` ("Tổng quan" in the
 * sidebar) since project setup; no route/nav change was needed since this
 * slot already existed and had no real content to migrate away from (the
 * separate Phase 4.6 Inventory Dashboard at `/inventory` — "Kho hàng" —
 * is untouched and keeps its own sidebar entry, per requirement §36/§78).
 *
 * Two fundamentally different kinds of data on this page (requirement
 * §4/§5, the most important UX rule in this phase):
 *
 * - PERIOD metrics (`BusinessOverviewSection`, `TopProductsSection`) read
 *   the shared `useReportDateRangeStore` — changing "Tháng này" →
 *   "Tháng trước" changes these and only these.
 * - CURRENT-SNAPSHOT metrics (`InventorySnapshotSection`, most of
 *   `AttentionSection`) never read that store at all — there is no date
 *   range for them to respond to, by construction, not by convention.
 *
 * No new report RPC was written for this page (requirement §39/§40/§89):
 * every number comes from an existing Phase 7.2–7.6 hook
 * (`useProfitSummary`/`useProfitTimeseries`/`useProductPerformanceList`/
 * `useInventoryValueSummary`/`useExpirySummary`/`useSlowMovingSummary`),
 * so every figure here reconciles with its detailed report by
 * construction. "Làm mới" invalidates the whole `reportsKeys.all` space —
 * every query above lives under that one prefix — rather than tracking
 * each section's own refetch function or reloading the page.
 */
function HomePage() {
  const queryClient = useQueryClient()
  // Counts in-flight queries under the whole `reportsKeys.all` prefix —
  // every section's own query, without lifting each one's `isFetching`
  // up through props.
  const isRefetching = useIsFetching({ queryKey: reportsKeys.all }) > 0

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: reportsKeys.all })
  }

  return (
    <PageContent>
      <PageHeader
        title="Tổng quan"
        description="Kết quả kinh doanh theo kỳ, tồn kho hiện tại và các vấn đề cần chú ý."
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCw className={cn('size-4', isRefetching && 'animate-spin')} />
            Làm mới
          </Button>
        }
      />

      <BusinessOverviewSection />
      <TopProductsSection />
      <InventorySnapshotSection />
      <AttentionSection />
      <QuickActionsSection />
    </PageContent>
  )
}

export { HomePage }
