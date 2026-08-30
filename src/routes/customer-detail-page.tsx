import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Pencil } from 'lucide-react'

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
import { CustomerFormDialog } from '@/features/customers/components/customer-form-dialog'
import { useCustomer } from '@/features/customers/hooks/use-customer'
import { CustomerOrderSummaryCards } from '@/features/orders/components/customer-order-summary-cards'
import { CustomerOrdersCard } from '@/features/orders/components/customer-orders-card'

function BackLink() {
  return (
    <Link
      to={ROUTES.customers}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Danh sách khách hàng
    </Link>
  )
}

function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const customerQuery = useCustomer(id)
  const [isEditOpen, setIsEditOpen] = useState(false)

  if (customerQuery.isLoading) {
    return <PageLoading />
  }

  if (customerQuery.isError) {
    return (
      <PageContent>
        <BackLink />
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
        <BackLink />
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
      <BackLink />

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
