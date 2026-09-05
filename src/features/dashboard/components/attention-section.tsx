import { AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertListItem } from '@/features/alerts/components/alert-list-item'
import { useOperationalAlerts } from '@/features/alerts/hooks/use-operational-alerts'

/**
 * "Cần chú ý" — renders the exact same `OperationalAlert[]` the header
 * Bell and Alert Center use (Phase 8.1's `useOperationalAlerts()`/
 * `buildOperationalAlerts()`, requirement §41/§42/§44), just without any
 * read-state awareness: every row renders identically regardless of
 * whether the signed-in user has already opened it elsewhere (requirement
 * §43 — a read problem is still a problem on the Dashboard). Visually and
 * factually unchanged from the pre-Phase-8.1 version of this section
 * (requirement §83) — only the mapping that used to live inline here now
 * lives in `features/alerts` so the Bell/Alert Center can share it.
 */
export function AttentionSection() {
  const { alerts, isLoading, isError, refetch } = useOperationalAlerts({ includeSlowMoving: true })

  return (
    <section data-tour="dashboard-attention">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-muted-foreground" aria-hidden="true" />
            Cần chú ý
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState message="Không thể tải cảnh báo." onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Hiện chưa có vấn đề cần chú ý.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertListItem key={alert.key} alert={alert} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
