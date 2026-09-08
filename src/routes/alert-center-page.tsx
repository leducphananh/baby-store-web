import { useState } from 'react'
import { CheckCheck, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AlertList } from '@/features/alerts/components/alert-list'
import { AlertSeverityBadge } from '@/features/alerts/components/alert-severity-badge'
import { useAlertsWithReadState } from '@/features/alerts/hooks/use-alerts-with-read-state'
import type { AlertSeverity } from '@/features/alerts/types/alert'

type Filter = 'all' | 'unread'

/**
 * Severity summary chips (Phase 8.5, requirement §5/§37/§39) — computed
 * straight from the already-loaded `alerts` array, no extra query. Each
 * count is the number of active ALERT CONDITIONS of that severity (e.g.
 * "critical: 2" means two conditions like "hàng hết hạn" and "hết hàng"
 * are both critical — never the sum of affected products/batches, which
 * could be in the hundreds). Always reflects the full current alert set,
 * independent of the All/Unread filter below, so it stays a stable
 * at-a-glance overview.
 */
function SeveritySummary({ severities }: { severities: AlertSeverity[] }) {
  const counts: Record<AlertSeverity, number> = { critical: 0, warning: 0, info: 0 }
  for (const severity of severities) counts[severity] += 1

  if (severities.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2" data-tour="alert-center-summary">
      {(['critical', 'warning', 'info'] as const)
        .filter((severity) => counts[severity] > 0)
        .map((severity) => (
          <AlertSeverityBadge key={severity} severity={severity} className="gap-1.5">
            {counts[severity]}
          </AlertSeverityBadge>
        ))}
    </div>
  )
}

/**
 * Alert Center (Phase 8.1, operational actions added Phase 8.5) — full-page
 * view of the SAME current operational conditions the Dashboard's
 * Attention section and header Bell show (requirement §41/§44), plus this
 * user's own read state and a recommended action per condition. This is
 * current operational state, not a notification history (requirement
 * §58/§59/§109) — there is no date range, no "last 6 months" browsing, no
 * resolved/history tab, just what's true right now. Includes slow-moving
 * conditions (`includeSlowMoving: true`), unlike the header Bell
 * (requirement §49).
 *
 * There is no generic "mark resolved" action anywhere on this page
 * (requirement §12/§116): every alert's action navigates to an existing
 * safe workflow (a filtered report, or the Imports list) and a condition
 * only ever disappears because `useOperationalAlerts()` stops producing it
 * — i.e. the real business data changed, not because of anything clicked
 * here.
 */
function AlertCenterPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { alerts, unreadCount, isLoading, isError, refetch, markRead, markAllRead } = useAlertsWithReadState({
    includeSlowMoving: true,
  })

  const visibleAlerts = filter === 'unread' ? alerts.filter((item) => !item.isRead) : alerts

  return (
    <PageContent>
      <PageHeader
        title="Cảnh báo"
        description="Các vấn đề vận hành đang xảy ra hiện tại — mở một cảnh báo để xem chi tiết và xử lý qua quy trình liên quan."
        actions={
          <div className="flex flex-wrap items-center gap-2" data-tour="alert-center-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck />
              Đánh dấu tất cả đã đọc
            </Button>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isLoading}>
              <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
              Làm mới
            </Button>
          </div>
        }
      />

      {!isLoading && !isError && <SeveritySummary severities={alerts.map((item) => item.alert.severity)} />}

      <div className="flex gap-2" data-tour="alert-center-filters">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tất cả
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Chưa đọc{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Button>
      </div>

      <Card data-tour="alert-center-list">
        <CardContent>
          {isError ? (
            <ErrorState message="Không thể tải cảnh báo." onRetry={() => void refetch()} />
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : filter === 'unread' && alerts.length > 0 && visibleAlerts.length === 0 ? (
            // Distinct from "no active alerts at all" (requirement §43):
            // the underlying issues may still be very real — the user has
            // simply already opened every one of them at least once.
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">Bạn đã đọc tất cả cảnh báo hiện tại.</p>
              <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                Xem tất cả cảnh báo
              </Button>
            </div>
          ) : (
            <AlertList
              items={visibleAlerts}
              onOpen={markRead}
              variant="detailed"
              // "Hiện không có cảnh báo cần xử lý." — never a claim like
              // "mọi thứ hoàn hảo" (requirement §42): the reports
              // themselves may still hold plenty of non-alert information,
              // this only says no active alert CONDITION exists right now.
              emptyMessage="Hiện không có cảnh báo cần xử lý."
            />
          )}
        </CardContent>
      </Card>
    </PageContent>
  )
}

export { AlertCenterPage }
