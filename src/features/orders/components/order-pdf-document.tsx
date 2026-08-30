import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatCurrencyVND } from '@/utils/currency'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import type { StoreInfo } from '@/lib/store-info'
import { ORDER_PAYMENT_STATUS_LABEL } from '@/features/orders/utils/order-payment-status-label'
import { ORDER_STATUS_LABEL } from '@/features/orders/utils/order-status-label'
import { PAYMENT_METHOD_LABEL } from '@/features/orders/utils/payment-method-label'
import type { OrderLine, OrderDetail, OrderPayment } from '@/features/orders/types/order-detail'

/**
 * `Nunito` — same family as the on-screen UI (`index.html`) — registered
 * once at module load from full-glyph TTFs served out of `public/fonts/`
 * (downloaded with a legacy-browser CSS request so each file embeds every
 * subset, Vietnamese included, in one binary; see the Phase 6.6 completion
 * report for how these were sourced/verified). `@react-pdf/renderer` has its
 * own font pipeline — a browser `@font-face` doesn't help it — so any font
 * used inside a `<Document>` must be registered here explicitly.
 */
Font.register({
  family: 'Nunito',
  fonts: [
    { src: '/fonts/Nunito-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Nunito-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Nunito-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/Nunito-ExtraBold.ttf', fontWeight: 800 },
  ],
})

// react-pdf's default hyphenation callback assumes English word-breaking
// rules — applied to Vietnamese text it can split a word at a nonsensical
// point. Vietnamese words don't hyphenate this way, so disable it: a long
// word simply wraps whole onto the next line instead.
Font.registerHyphenationCallback((word) => [word])

const COLORS = {
  text: '#18181b',
  muted: '#71717a',
  border: '#d4d4d8',
  headerBg: '#f4f4f5',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Nunito',
    fontSize: 9.5,
    color: COLORS.text,
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  storeName: {
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 3,
  },
  storeLine: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 1,
  },
  titleBlock: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  metaLine: {
    fontSize: 9,
    color: COLORS.muted,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8.5,
    color: COLORS.muted,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 9,
    color: COLORS.muted,
  },
  table: {
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.headerBg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
  },
  th: {
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  td: {
    fontSize: 9.5,
  },
  tdMuted: {
    fontSize: 8,
    color: COLORS.muted,
  },
  colIndex: { width: '5%', paddingHorizontal: 4 },
  colProduct: { width: '32%', paddingHorizontal: 4 },
  colUnit: { width: '10%', paddingHorizontal: 4, textAlign: 'center' },
  colQty: { width: '10%', paddingHorizontal: 4, textAlign: 'right' },
  colPrice: { width: '15%', paddingHorizontal: 4, textAlign: 'right' },
  colDiscount: { width: '13%', paddingHorizontal: 4, textAlign: 'right' },
  colTotal: { width: '15%', paddingHorizontal: 4, textAlign: 'right' },
  totalsBlock: {
    alignSelf: 'flex-end',
    width: '45%',
    marginBottom: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
  },
  totalsLabel: {
    fontSize: 9.5,
    color: COLORS.muted,
  },
  totalsValue: {
    fontSize: 9.5,
    fontWeight: 600,
  },
  totalsGrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    marginTop: 3,
    paddingTop: 5,
  },
  totalsGrandLabel: {
    fontSize: 10.5,
    fontWeight: 800,
  },
  totalsGrandValue: {
    fontSize: 12,
    fontWeight: 800,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    marginBottom: 6,
  },
  paymentsTable: {
    marginBottom: 16,
  },
  notesBlock: {
    marginBottom: 20,
  },
  notesText: {
    fontSize: 9.5,
    lineHeight: 1.4,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  signatureCol: {
    width: '40%',
    alignItems: 'center',
  },
  signatureTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    marginBottom: 2,
  },
  signatureHint: {
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 48,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 6,
  },
})

const LINE_COLUMNS: { key: keyof typeof styles; header: string }[] = [
  { key: 'colIndex', header: 'STT' },
  { key: 'colProduct', header: 'Sản phẩm' },
  { key: 'colUnit', header: 'ĐVT' },
  { key: 'colQty', header: 'SL' },
  { key: 'colPrice', header: 'Đơn giá' },
  { key: 'colDiscount', header: 'Giảm giá' },
  { key: 'colTotal', header: 'Thành tiền' },
]

/**
 * Print-friendly A4 document for one order (Phase 6.6). Pure presentation —
 * every field is read straight from `OrderDetail`/`OrderLine`/`OrderPayment`,
 * the same order-detail source of truth (and the same formatting utilities)
 * as the on-screen page; nothing here is recomputed or re-derived (see
 * `pdf-export` skill rule 1 and `OrderLine`'s own doc comment on historical
 * pricing).
 */
export function OrderPdfDocument({
  order,
  lines,
  payments,
  storeInfo,
  generatedAt,
}: {
  order: OrderDetail
  lines: OrderLine[]
  payments: OrderPayment[]
  storeInfo: StoreInfo | null
  generatedAt: Date
}) {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remaining = Math.max(order.total - totalPaid, 0)

  return (
    <Document title={`Đơn hàng ${order.orderNumber}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow} fixed>
          <View>
            {storeInfo ? (
              <>
                <Text style={styles.storeName}>{storeInfo.name}</Text>
                {storeInfo.address && <Text style={styles.storeLine}>{storeInfo.address}</Text>}
                {storeInfo.phone && <Text style={styles.storeLine}>ĐT: {storeInfo.phone}</Text>}
                {storeInfo.taxCode && <Text style={styles.storeLine}>MST: {storeInfo.taxCode}</Text>}
              </>
            ) : (
              <Text style={styles.storeName}>Baby Wale</Text>
            )}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>ĐƠN HÀNG</Text>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.metaLine}>Ngày đặt: {formatDate(order.orderDate)}</Text>
            <Text style={styles.metaLine}>Trạng thái: {ORDER_STATUS_LABEL[order.status]}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Khách hàng</Text>
            <Text style={styles.infoValue}>{order.customerName ?? 'Khách lẻ'}</Text>
            {order.customerPhone && <Text style={styles.infoSub}>ĐT: {order.customerPhone}</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Thanh toán</Text>
            <Text style={styles.infoValue}>{ORDER_PAYMENT_STATUS_LABEL[order.paymentStatus]}</Text>
            {order.createdByName && <Text style={styles.infoSub}>Người tạo: {order.createdByName}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            {LINE_COLUMNS.map((column) => (
              <Text key={column.key} style={[styles.th, styles[column.key]]}>
                {column.header}
              </Text>
            ))}
          </View>

          {lines.map((line, index) => (
            <View key={line.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.colIndex]}>{index + 1}</Text>
              <View style={styles.colProduct}>
                <Text style={styles.td}>{line.productName ?? '—'}</Text>
                {line.productSku && <Text style={styles.tdMuted}>{line.productSku}</Text>}
              </View>
              <Text style={[styles.td, styles.colUnit]}>{line.productUnit ?? '—'}</Text>
              <Text style={[styles.td, styles.colQty]}>{formatNumber(line.quantity)}</Text>
              <Text style={[styles.td, styles.colPrice]}>{formatCurrencyVND(line.unitPrice)}</Text>
              <Text style={[styles.td, styles.colDiscount]}>
                {line.discount > 0 ? formatCurrencyVND(line.discount) : '—'}
              </Text>
              <Text style={[styles.td, styles.colTotal]}>{formatCurrencyVND(line.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tạm tính</Text>
            <Text style={styles.totalsValue}>{formatCurrencyVND(order.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Giảm giá</Text>
            <Text style={styles.totalsValue}>{formatCurrencyVND(order.discount)}</Text>
          </View>
          <View style={styles.totalsGrandRow}>
            <Text style={styles.totalsGrandLabel}>Tổng cộng</Text>
            <Text style={styles.totalsGrandValue}>{formatCurrencyVND(order.total)}</Text>
          </View>
        </View>

        <View wrap={false}>
          <Text style={styles.sectionTitle}>Tình hình thanh toán</Text>
          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Đã thanh toán</Text>
              <Text style={styles.totalsValue}>{formatCurrencyVND(totalPaid)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Còn lại</Text>
              <Text style={styles.totalsValue}>{formatCurrencyVND(remaining)}</Text>
            </View>
          </View>

          {payments.length > 0 && (
            <View style={styles.paymentsTable}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: '30%', paddingHorizontal: 4 }]}>Ngày thanh toán</Text>
                <Text style={[styles.th, { width: '25%', paddingHorizontal: 4 }]}>Phương thức</Text>
                <Text style={[styles.th, { width: '20%', paddingHorizontal: 4, textAlign: 'right' }]}>Số tiền</Text>
                <Text style={[styles.th, { width: '25%', paddingHorizontal: 4 }]}>Ghi chú</Text>
              </View>
              {payments.map((payment) => (
                <View key={payment.id} style={styles.tableRow}>
                  <Text style={[styles.td, { width: '30%', paddingHorizontal: 4 }]}>
                    {payment.paidAt ? formatDateTime(payment.paidAt) : '—'}
                  </Text>
                  <Text style={[styles.td, { width: '25%', paddingHorizontal: 4 }]}>
                    {PAYMENT_METHOD_LABEL[payment.paymentMethod]}
                  </Text>
                  <Text style={[styles.td, { width: '20%', paddingHorizontal: 4, textAlign: 'right' }]}>
                    {formatCurrencyVND(payment.amount)}
                  </Text>
                  <Text style={[styles.tdMuted, { width: '25%', paddingHorizontal: 4 }]}>
                    {payment.note || '—'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {order.note && (
          <View style={styles.notesBlock} wrap={false}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <Text style={styles.notesText}>{order.note}</Text>
          </View>
        )}

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureCol}>
            <Text style={styles.signatureTitle}>Người mua hàng</Text>
            <Text style={styles.signatureHint}>(Ký, ghi rõ họ tên)</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text style={styles.signatureTitle}>Người bán hàng</Text>
            <Text style={styles.signatureHint}>(Ký, ghi rõ họ tên)</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Xuất lúc {formatDateTime(generatedAt)}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Trang ${pageNumber}/${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
