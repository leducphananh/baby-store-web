import type { OrderStatus } from '@/features/orders/types/order'

/**
 * One place the order status → Vietnamese label mapping lives — shared by
 * `OrderStatusBadge` (adds icon/color) and the PDF export (plain text, no
 * badge component available in `@react-pdf/renderer`'s render tree).
 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
}
