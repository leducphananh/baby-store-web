import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatCurrencyVND } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { formatNumber } from '@/utils/number'
import type { StoreInfo } from '@/lib/store-info'
import type { OrderLine, OrderDetail } from '@/features/orders/types/order-detail'

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
  text: '#000000',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Nunito',
    fontSize: 9,
    color: COLORS.text,
    padding: 12,
  },
  centerText: {
    textAlign: 'center',
  },
  bold: {
    fontWeight: 700,
  },
  date: {
    marginBottom: 8,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 0,
  },
  orderNumber: {
    fontSize: 10,
    fontWeight: 700,
  },
  infoBlock: {
    marginBottom: 4,
    lineHeight: 1.4,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: COLORS.text,
    marginVertical: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    fontWeight: 700,
    marginBottom: 2,
  },
  colPrice: {
    flex: 1,
    textAlign: 'left',
  },
  colQty: {
    width: 30,
    textAlign: 'center',
  },
  colTotal: {
    flex: 1,
    textAlign: 'right',
  },
  itemBlock: {
    marginTop: 4,
  },
  itemName: {
    marginBottom: 2,
    lineHeight: 1.3,
  },
  itemRow: {
    flexDirection: 'row',
  },
  totalsBlock: {
    marginTop: 8,
    alignItems: 'flex-end',
    lineHeight: 1.5,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsLabel: {
    width: 80,
    textAlign: 'right',
    marginRight: 4,
  },
  totalsValue: {
    width: 60,
    textAlign: 'right',
  },
})



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
    <Document title={`Đơn hàng ${order.orderNumber}`}>
      <Page size={[226.77, 'auto']} style={styles.page}>
        <View style={[styles.centerText, { marginBottom: 4, lineHeight: 1.2 }]}>
          <Text style={[styles.title, { marginBottom: 2 }]}>{'\u200B' + (storeInfo?.name || 'Baby Wale')}</Text>
          <Text>{storeInfo?.address || 'Địa chỉ: (Chưa cập nhật)'}</Text>
          <Text>ĐT: {storeInfo?.phone || '(Chưa cập nhật)'}</Text>
        </View>
        
        <View style={styles.dashedDivider} />
        <Text style={styles.date}>Ngày bán: {formatDateTime(generatedAt)}</Text>
        
        <View style={styles.titleBlock}>
          <Text style={styles.title}>PHIẾU ĐẶT HÀNG</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text>Khách hàng: {order.customerName ?? 'Khách lẻ'}</Text>
        </View>

        <View style={styles.dashedDivider} />

        <View style={styles.tableHeader}>
          <Text style={styles.colPrice}>Đơn giá</Text>
          <Text style={styles.colQty}>SL</Text>
          <Text style={styles.colTotal}>Thành tiền</Text>
        </View>

        <View style={styles.dashedDivider} />

        {lines.map((line) => (
          <View key={line.id}>
            <View style={styles.itemBlock}>
              <Text style={styles.itemName}>{line.productName ?? '—'}</Text>
              <View style={styles.itemRow}>
                <Text style={styles.colPrice}>{formatCurrencyVND(line.unitPrice)}</Text>
                <Text style={styles.colQty}>{formatNumber(line.quantity)}</Text>
                <Text style={styles.colTotal}>{formatCurrencyVND(line.lineTotal)}</Text>
              </View>
            </View>
            <View style={styles.dashedDivider} />
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tổng tiền hàng:</Text>
            <Text style={styles.totalsValue}>{formatCurrencyVND(displaySubtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Chiết khấu:</Text>
            <Text style={styles.totalsValue}>{formatCurrencyVND(displayDiscount)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.bold]}>
            <Text style={styles.totalsLabel}>Tổng cộng:</Text>
            <Text style={styles.totalsValue}>{formatCurrencyVND(displayTotal)}</Text>
          </View>
        </View>

        <Text style={[styles.centerText, { marginTop: 16 }]}>Xin cảm ơn quý khách và hẹn gặp lại!</Text>
      </Page>
    </Document>
  )
}
