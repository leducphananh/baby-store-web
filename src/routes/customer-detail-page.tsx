import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailRow } from '@/components/common/detail-row'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { PageLoading } from '@/components/common/page-loading'
import { formatDate } from '@/utils/date'
import { ROUTES } from '@/routes/route-paths'
import { BackLink } from '@/components/common/back-link'
import { CustomerFormDialog } from '@/features/customers/components/customer-form-dialog'
import { useCustomer } from '@/features/customers/hooks/use-customer'
import { CustomerOrderSummaryCards } from '@/features/orders/components/customer-order-summary-cards'
import { CustomerOrdersCard } from '@/features/orders/components/customer-orders-card'
import { useCustomerOrderSummary } from '@/features/orders/hooks/use-customer-order-summary'

function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const customerQuery = useCustomer(id)
  // Phase 9.8 (Debt A): start the order-summary request now, from the route
  // param alone, so it runs concurrently with useCustomer instead of waiting
  // for it to resolve and CustomerOrderSummaryCards to mount (which still owns
  // this hook for display; TanStack Query dedupes to one request per key —
  // count unchanged). CustomerOrdersCard's list query is left in the child on
  // purpose: its key depends on the child-local page / page-size state, not
  // just the route param (a legitimate dependency, cf. Edit Order's stockMap).
  useCustomerOrderSummary(id)
  const [isEditOpen, setIsEditOpen] = useState(false)

  if (customerQuery.isLoading) {
    return <PageLoading />
  }

  if (customerQuery.isError) {
    return (
      <PageContent>
        <BackLink to={ROUTES.customers} label="Danh sách khách hàng" />
        <ErrorState
          message="Không thể tải thông tin khách hàng. Vui lòng thử lại."
          onRetry={() => void customerQuery.refetch()}
        />
      </PageContent>
    )
  }

  const customer = customerQuery.data
  if (!customer) {
    return (
      <PageContent>
        <BackLink to={ROUTES.customers} label="Danh sách khách hàng" />
        <EmptyState
          title="Không tìm thấy khách hàng"
          description="Khách hàng này có thể đã bị xóa hoặc đường dẫn không đúng."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.customers}>Về danh sách khách hàng</Link>
            </Button>
          }
        />
      </PageContent>
    )
  }

  return (
    <PageContent>
      <BackLink to={ROUTES.customers} label="Danh sách khách hàng" />

      <PageHeader
        title={customer.name}
        description={customer.phone ?? 'Chưa có số điện thoại'}
        actions={
          <Button onClick={() => setIsEditOpen(true)}>
            <Pencil />
            Sửa
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
          {customer.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="Điện thoại" value={customer.phone} />
            <DetailRow label="Email" value={customer.email} />
            <DetailRow label="Địa chỉ" value={customer.address} />
            <DetailRow
              label="Ghi chú"
              value={customer.notes ? <span className="whitespace-pre-wrap">{customer.notes}</span> : null}
            />
            <DetailRow
              label="Ngày tạo"
              value={customer.createdAt ? formatDate(customer.createdAt) : null}
            />
          </dl>
        </CardContent>
      </Card>

      <CustomerOrderSummaryCards customerId={customer.id} />
      <CustomerOrdersCard customerId={customer.id} />

      <CustomerFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} customer={customer} />
    </PageContent>
  )
}

export { CustomerDetailPage }
