import { isRouteErrorResponse, useRouteError } from 'react-router'

import { ErrorState } from '@/components/common/error-state'

/**
 * Basic route-level error boundary, wired via React Router's `errorElement`
 * (catches render/loader errors for the route tree it's attached to). Not
 * a substitute for handling expected errors locally (query `isError`,
 * mutation `onError`) — this is the backstop for anything unexpected (see
 * `error-handling`). "Thử lại" does a full reload — a genuine retry of
 * whatever crashed, not a silent navigate-away.
 */
function RouteErrorBoundary() {
  const error = useRouteError()

  const message = isRouteErrorResponse(error)
    ? `Lỗi ${error.status}: ${error.statusText || 'Đã xảy ra sự cố.'}`
    : 'Đã xảy ra sự cố ngoài dự kiến. Vui lòng thử lại.'

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <ErrorState
        title="Đã xảy ra lỗi"
        message={message}
        onRetry={() => window.location.reload()}
        className="max-w-md"
      />
    </div>
  )
}

export { RouteErrorBoundary }
