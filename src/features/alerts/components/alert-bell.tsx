import { useState } from 'react'
import { Link } from 'react-router'
import { Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/common/error-state'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/route-paths'
import { AlertList } from '@/features/alerts/components/alert-list'
import { useAlertsWithReadState } from '@/features/alerts/hooks/use-alerts-with-read-state'

const PREVIEW_COUNT = 5
const BADGE_CAP = 99

function formatBadgeCount(count: number): string {
  return count > BADGE_CAP ? `${BADGE_CAP}+` : String(count)
}

/**
 * Header notification bell (requirement §33/§36) — lives in `AppShell`'s
 * `Header`, mounted once for the whole authenticated session. Deliberately
 * omits slow-moving from its query set (`includeSlowMoving: false`,
 * requirement §49) to keep the one set of global-App-Shell queries small;
 * the Alert Center page includes it.
 *
 * The badge counts unread ALERT CONDITIONS (aggregate alert rows), never
 * the affected-entity count they summarize (requirement §34/§84) — e.g.
 * "84 sản phẩm đã hết hàng" is one unread condition, so it contributes 1
 * to the badge, not 84.
 *
 * A failed alert query never breaks the rest of the header/App Shell
 * (requirement §68/§69): the trigger button always renders; only the
 * popover's own content shows the error/retry.
 */
export function AlertBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { alerts, unreadCount, isLoading, isError, refetch, markRead } = useAlertsWithReadState({
    includeSlowMoving: false,
  })

  const preview = alerts.slice(0, PREVIEW_COUNT)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Mở cảnh báo">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full',
                'bg-destructive px-1 text-[10px] font-medium text-white',
              )}
              aria-hidden="true"
            >
              {formatBadgeCount(unreadCount)}
            </span>
          )}
          <span className="sr-only">{unreadCount > 0 ? `${unreadCount} cảnh báo chưa đọc` : 'Không có cảnh báo chưa đọc'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Cảnh báo</p>
        </div>

        {isError ? (
          <ErrorState message="Không thể tải cảnh báo." onRetry={() => void refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <AlertList
            items={preview}
            emptyMessage="Hiện chưa có cảnh báo cần chú ý."
            onOpen={(alert) => {
              markRead(alert)
              setIsOpen(false)
            }}
          />
        )}

        {!isError && !isLoading && alerts.length > 0 && (
          <Link
            to={ROUTES.alerts}
            onClick={() => setIsOpen(false)}
            className="mt-3 block text-center text-sm font-medium text-primary hover:underline"
          >
            Xem tất cả
          </Link>
        )}
      </PopoverContent>
    </Popover>
  )
}
