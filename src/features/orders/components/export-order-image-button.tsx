import { useState, useRef } from 'react'
import { Image, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'

import { Button } from '@/components/ui/button'
import { useOrderLines } from '@/features/orders/hooks/use-order-lines'
import { getStoreInfo } from '@/lib/store-info'
import { OrderImageDocument } from '@/features/orders/components/order-image-document'
import type { OrderDetail } from '@/features/orders/types/order-detail'

export function ExportOrderImageButton({ order }: { order: OrderDetail }) {
  const linesQuery = useOrderLines(order.id)
  const [isGenerating, setIsGenerating] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const lines = linesQuery.data
  const isDataReady = lines !== undefined

  async function handleExport() {
    if (!lines || !receiptRef.current) return
    setIsGenerating(true)
    try {
      // Ensure all weights of Nunito are fully decoded before canvas capture
      if (document.fonts) {
        try {
          await Promise.all([
            document.fonts.load('400 12px Nunito'),
            document.fonts.load('600 12px Nunito'),
            document.fonts.load('700 12px Nunito'),
            document.fonts.load('700 13px Nunito'),
            document.fonts.load('700 15px Nunito'),
            document.fonts.load('700 19px Nunito'),
            document.fonts.load('700 21px Nunito'),
          ])
          await document.fonts.ready
        } catch {
          // If font loading query throws, proceed with default font cache
        }
      }

      const canvas = await html2canvas(receiptRef.current, {
        scale: 4, // 302px * 4 = 1208px high-res thermal receipt image
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: receiptRef.current.offsetWidth,
        height: receiptRef.current.offsetHeight,
      })

      const image = canvas.toDataURL('image/png', 1.0)

      const link = document.createElement('a')
      link.download = `don-hang-${order.orderNumber}.png`
      link.href = image
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      toast.error('Không thể xuất ảnh đơn hàng. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button variant="outline" disabled={!isDataReady || isGenerating} onClick={() => void handleExport()}>
        {isGenerating ? <Loader2 className="animate-spin" /> : <Image />}
        {isGenerating ? 'Đang tạo...' : 'Xuất Ảnh'}
      </Button>

      {/* Hidden container behind page (z-index: -9999) inside viewport so fonts and layout are accurately computed */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        <div ref={receiptRef}>
          {isDataReady && (
            <OrderImageDocument
              order={order}
              lines={lines}
              storeInfo={getStoreInfo()}
              generatedAt={new Date()}
            />
          )}
        </div>
      </div>
    </>
  )
}
