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
import { useAlertsWithReadState } from '@/features/alerts/hooks/use-alerts-with-read-state'

type Filter = 'all' | 'unread'

/**
 * Alert Center (Phase 8.1) — full-page view of the SAME current
 * operational conditions the Dashboard's Attention section and header
 * Bell show (requirement §41/§44), plus this user's own read state. This
 * is current operational state, not a notification history (requirement
 * §58/§59) — there is no date range, no "last 6 months" browsing, just
 * what's true right now. Includes slow-moving conditions
 * (`includeSlowMoving: true`), unlike the header Bell (requirement §49).
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
        description="Các vấn đề vận hành đang xảy ra hiện tại — mở một cảnh báo để xem chi tiết ở báo cáo tương ứng."
        actions={
          <div className="flex items-center gap-2">
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
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <AlertList
              items={visibleAlerts}
              onOpen={markRead}
              emptyMessage={
                filter === 'unread'
                  ? alerts.length === 0
                    ? 'Hiện chưa có cảnh báo cần chú ý.'
                    : 'Không còn cảnh báo chưa đọc.'
                  : 'Hiện chưa có cảnh báo cần chú ý.'
              }
            />
          )}
        </CardContent>
      </Card>
    </PageContent>
  )
}

export { AlertCenterPage }
