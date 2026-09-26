import { formatCurrencyVND } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import type { StoreInfo } from '@/lib/store-info'
import type { OrderLine, OrderDetail } from '@/features/orders/types/order-detail'

export function OrderImageDocument({
  order,
  lines,
  storeInfo,
  generatedAt,
}: {
  order: OrderDetail
  lines: OrderLine[]
  storeInfo: StoreInfo | null
  generatedAt: Date
}) {
  const isDraft = order.status === 'draft' || order.status === 'confirmed'
  const displaySubtotal = isDraft
    ? lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
    : order.subtotal
  const itemDiscounts = lines.reduce((sum, line) => sum + line.discount, 0)
  const displayDiscount = isDraft
    ? itemDiscounts + (order.discount ?? 0)
    : itemDiscounts + order.discount
  const displayTotal = isDraft
    ? Math.max(0, lines.reduce((sum, line) => sum + Math.max(0, line.quantity * line.unitPrice - line.discount), 0) - (order.discount ?? 0))
    : order.total

  return (
    <div
      style={{
        width: '302px',
        padding: '20px 16px',
        fontFamily: "'Nunito', sans-serif",
        fontSize: '12px',
        color: '#000000',
        backgroundColor: '#ffffff',
        lineHeight: 1.4,
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      <style>{`
        @font-face {
          font-family: 'Nunito';
          font-style: normal;
          font-weight: 400;
          src: url('/fonts/Nunito-Regular.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Nunito';
          font-style: normal;
          font-weight: 600;
          src: url('/fonts/Nunito-SemiBold.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Nunito';
          font-style: normal;
          font-weight: 700;
          src: url('/fonts/Nunito-Bold.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Nunito';
          font-style: normal;
          font-weight: 800;
          src: url('/fonts/Nunito-ExtraBold.ttf') format('truetype');
        }
      `}</style>

      {/* Thông tin cửa hàng */}
      <div style={{ textAlign: 'center', marginBottom: '16px', lineHeight: 1.3 }}>
        <div style={{ fontSize: '21px', fontWeight: 700, marginBottom: '8px' }}>
          {storeInfo?.name || 'Baby Wale'}
        </div>
        <div style={{ marginBottom: '6px' }}>{storeInfo?.address || 'Địa chỉ: (Chưa cập nhật)'}</div>
        <div>ĐT: {storeInfo?.phone || '(Chưa cập nhật)'}</div>
      </div>

      {/* Đường phân cách sau thông tin shop */}
      <div style={{ borderBottom: '1px dashed #000', margin: '0 0 10px 0', height: 0 }} />
      <div style={{ marginBottom: '14px' }}>Ngày bán: {formatDateTime(generatedAt)}</div>
      
      {/* Tiêu đề & Mã đơn */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '19px', fontWeight: 700, marginBottom: '6px' }}>
          PHIẾU ĐẶT HÀNG
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700 }}>
          {order.orderNumber}
        </div>
      </div>

      {/* Khách hàng */}
      <div style={{ marginBottom: '18px', lineHeight: 1.4 }}>
        Khách hàng: {order.customerName ?? 'Khách lẻ'}
      </div>

      {/* Đường phân cách trên bảng hàng */}
      <div style={{ borderBottom: '1px dashed #000', margin: '0 0 8px 0', height: 0 }} />

      {/* Tiêu đề cột */}
      <div style={{ display: 'flex', fontWeight: 700, marginBottom: '10px' }}>
        <div style={{ flex: 1, textAlign: 'left' }}>Đơn giá</div>
        <div style={{ width: '40px', textAlign: 'center' }}>SL</div>
        <div style={{ flex: 1, textAlign: 'right' }}>Thành tiền</div>
      </div>

      {/* Đường phân cách dưới tiêu đề cột */}
      <div style={{ borderBottom: '1px dashed #000', margin: '0', height: 0 }} />

      {/* Danh sách items (hàng hóa) */}
      {lines.map((line, index) => (
        <div key={line.id} style={{ marginTop: index === 0 ? '14px' : '0' }}>
          <div>
            <div style={{ marginBottom: '20px', lineHeight: 1.4 }}>
              {line.productName ?? '—'}
            </div>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
              <div style={{ flex: 1, textAlign: 'left' }}>{formatCurrencyVND(line.unitPrice)}</div>
              <div style={{ width: '40px', textAlign: 'center' }}>
                {formatNumber(line.quantity)}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                {formatCurrencyVND(line.lineTotal)}
              </div>
            </div>
          </div>
          <div style={{ borderBottom: '1px dashed #000', margin: '0', height: 0 }} />
          {index < lines.length - 1 && <div style={{ height: '14px' }} />}
        </div>
      ))}

      {/* Khối tính tổng */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.5 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '12px' }}>
          <div style={{ width: '107px', textAlign: 'right', marginRight: '5px' }}>Tổng tiền hàng:</div>
          <div style={{ minWidth: '80px', textAlign: 'right' }}>{formatCurrencyVND(displaySubtotal)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '16px' }}>
          <div style={{ width: '107px', textAlign: 'right', marginRight: '5px' }}>Chiết khấu:</div>
          <div style={{ minWidth: '80px', textAlign: 'right' }}>{formatCurrencyVND(displayDiscount)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', fontWeight: 700, fontSize: '15px' }}>
          <div style={{ width: '107px', textAlign: 'right', marginRight: '5px' }}>Tổng cộng:</div>
          <div style={{ minWidth: '80px', textAlign: 'right' }}>{formatCurrencyVND(displayTotal)}</div>
        </div>
      </div>

      {/* Lời cảm ơn */}
      <div style={{ textAlign: 'center', marginTop: '38px', marginBottom: '8px', fontSize: '12px', fontWeight: 400 }}>
        Xin cảm ơn quý khách và hẹn gặp lại!
      </div>
    </div>
  )
}
