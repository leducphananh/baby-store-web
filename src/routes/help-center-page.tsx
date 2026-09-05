import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  BookOpen,
  CircleHelp,
  FolderTree,
  PackagePlus,
  Rocket,
  ShoppingBasket,
  Sparkles,
  Truck,
  Warehouse,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContent } from '@/components/common/page-content'
import { PageHeader } from '@/components/common/page-header'
import { ROUTES } from '@/routes/route-paths'
import { QUICK_START_TOUR, TOUR_REGISTRY } from '@/features/help/config/tours'
import { useTourStore } from '@/features/help/hooks/use-tour-store'
import type { Tour } from '@/features/help/types/tour'

/** Where a tour's "Mở màn hình" link should go — the same routes the tour itself describes. */
const TOUR_ROUTES: Record<string, string> = {
  dashboard: ROUTES.home,
  'products-list': ROUTES.products,
  'product-detail': ROUTES.products,
  categories: ROUTES.categories,
  suppliers: ROUTES.suppliers,
  'imports-list': ROUTES.imports,
  'import-receipt-detail': ROUTES.imports,
  inventory: ROUTES.inventory,
  'inventory-transactions': ROUTES.inventoryTransactions,
  reports: ROUTES.reports,
  'revenue-report': ROUTES.revenueReport,
  'profit-report': ROUTES.profitReport,
  'product-performance-report': ROUTES.productPerformanceReport,
  'inventory-report': ROUTES.inventoryReport,
  'expiry-report': ROUTES.expiryReport,
  'alert-center': ROUTES.alerts,
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string
  icon: typeof Rocket
  title: string
  children: React.ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5 text-primary" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground">{children}</CardContent>
    </Card>
  )
}

/**
 * "Hướng dẫn sử dụng" — end-user documentation organized by business task
 * (Bắt đầu, Quản lý sản phẩm, Nhập hàng, ...), not by code module. Content
 * only describes functionality that actually exists as of Phase 4.6 — see
 * `features/help/config/tours.ts`'s doc comment for the same rule applied
 * to the guided tours this page can also launch/replay.
 */
function HelpCenterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const startTour = useTourStore((state) => state.start)

  // Deep link from the floating Help button's "Xem lại hướng dẫn"
  // (`/help#tours`) — scroll to the tour list once it's actually rendered.
  useEffect(() => {
    if (location.hash !== '#tours') return
    document.getElementById('tours')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  /**
   * A contextual tour's steps target elements that only exist on its own
   * screen — replaying one from here (a different route) has to navigate
   * there first, then start the tour once that page has had a moment to
   * mount. `TourOverlay`'s own missing-target skip is still the safety net
   * if a slower device needs a bit longer than this.
   */
  function replayTour(tour: Tour) {
    const targetRoute = TOUR_ROUTES[tour.id]
    if (targetRoute && targetRoute !== location.pathname) {
      navigate(targetRoute)
      window.setTimeout(() => startTour(tour), 300)
    } else {
      startTour(tour)
    }
  }

  return (
    <PageContent>
      <PageHeader
        title="Hướng dẫn sử dụng"
        description="Tài liệu và hướng dẫn tương tác cho từng nghiệp vụ trong Baby Wale."
        actions={
          <Button onClick={() => startTour(QUICK_START_TOUR)}>
            <Sparkles />
            Bắt đầu hướng dẫn nhanh
          </Button>
        }
      />

      <Section id="getting-started" icon={Rocket} title="Bắt đầu sử dụng Baby Wale">
        <p>Thứ tự thiết lập được khuyến nghị khi mới bắt đầu sử dụng hệ thống:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Tạo danh mục sản phẩm (Bỉm, Sữa bột, Bình sữa...).</li>
          <li>Khai báo các nhà cung cấp mà cửa hàng nhập hàng từ đó.</li>
          <li>Tạo sản phẩm: thông tin cơ bản, giá, nguồn gốc và ảnh minh họa.</li>
          <li>Khi nhận hàng, tạo phiếu nhập và thêm từng sản phẩm cùng số lượng, đơn giá.</li>
          <li>Khai báo số lô và hạn sử dụng cho từng dòng hàng nếu có.</li>
          <li>Theo dõi tồn kho, sản phẩm sắp hết hàng và lô hàng sắp hết hạn ở màn Kho hàng.</li>
        </ol>
        <Button variant="outline" size="sm" onClick={() => startTour(QUICK_START_TOUR)}>
          <Sparkles />
          Xem hướng dẫn nhanh từng bước
        </Button>
      </Section>

      <Section id="products" icon={ShoppingBasket} title="Quản lý sản phẩm">
        <p>
          Mỗi sản phẩm có thông tin cơ bản (tên, SKU, mã vạch, danh mục, đơn vị bán), các mức giá
          (giá nhập, giá bán, giá TikTok, giá Shopee — hai giá sau không bắt buộc), thông tin
          nguồn gốc và ảnh minh họa.
        </p>
        <Alert variant="info">
          <AlertTitle>"Nhà phân phối" khác với "Nhà cung cấp"</AlertTitle>
          <AlertDescription>
            "Nhà phân phối" trong thông tin sản phẩm là dữ liệu mô tả sản phẩm (đơn vị phân
            phối/nhập khẩu chính hãng ghi trên bao bì) — không phải nơi cửa hàng thực tế nhập
            hàng. "Nhà cung cấp" là một khái niệm riêng, thuộc về nghiệp vụ nhập hàng (xem mục
            "Nhập hàng" bên dưới), và một sản phẩm có thể được nhập từ nhiều nhà cung cấp khác
            nhau theo thời gian.
          </AlertDescription>
        </Alert>
        <p>
          Bạn có thể "Nhân bản sản phẩm" để tạo nhanh một sản phẩm mới dựa trên sản phẩm có sẵn —
          hệ thống sẽ sao chép thông tin nhưng không tự động tạo bản ghi cho đến khi bạn lưu, và
          không sao chép tồn kho/lô hàng của sản phẩm gốc.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.products)}>
          Mở danh sách sản phẩm
        </Button>
      </Section>

      <Section id="imports" icon={PackagePlus} title="Nhập hàng">
        <p>Quy trình ghi nhận một lần nhập hàng từ nhà cung cấp:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Tạo phiếu nhập mới (bắt đầu ở trạng thái "Nháp") và chọn nhà cung cấp.</li>
          <li>Thêm từng sản phẩm vào phiếu, nhập số lượng và đơn giá nhập.</li>
          <li>Khai báo số lô và hạn sử dụng cho từng dòng hàng nếu cần theo dõi hạn dùng.</li>
          <li>Có thể đính kèm hóa đơn giá trị gia tăng (hóa đơn đỏ) của nhà cung cấp, kèm tệp scan.</li>
        </ol>
        <Alert variant="warning">
          <AlertTitle>Tồn kho thay đổi khi nào?</AlertTitle>
          <AlertDescription>
            Tạo phiếu nhập và thêm dòng hàng CHƯA làm thay đổi tồn kho. Số lượng tồn kho chỉ thực
            sự tăng lên khi phiếu nhập ở trạng thái "Đã xác nhận" — lúc đó hệ thống mới tạo lô
            hàng và ghi nhận vào kho. Một phiếu "Nháp" có thể sửa hoặc hủy; phiếu "Đã xác nhận"
            hoặc "Đã hủy" là tài liệu lịch sử, không thể chỉnh sửa lại.
          </AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.imports)}>
          Đi tới Nhập hàng
        </Button>
      </Section>

      <Section id="inventory" icon={Warehouse} title="Quản lý kho">
        <p>
          Màn "Kho hàng" tổng hợp tồn kho thực tế theo từng sản phẩm từ dữ liệu lô hàng — không
          phải số liệu ước tính. Bốn thẻ ở đầu trang cho biết nhanh: sản phẩm hết hàng, dưới định
          mức tối thiểu, lô hàng sắp hết hạn và đã hết hạn; bấm vào một thẻ để lọc danh sách theo
          đúng nhóm đó.
        </p>
        <p>
          Màn "Giao dịch kho" là nhật ký lịch sử mọi biến động tồn kho (nhập hàng, bán hàng, hủy
          đơn, điều chỉnh...), chỉ ghi thêm — không sửa, không xóa, để đảm bảo có thể truy vết
          chính xác.
        </p>
        <Alert variant="info">
          <AlertTitle>Ưu tiên hạn sử dụng gần nhất (FEFO)</AlertTitle>
          <AlertDescription>
            Trên trang chi tiết sản phẩm, các lô hàng được sắp xếp theo hạn sử dụng gần nhất
            trước — ưu tiên lô có hạn sử dụng gần nhất khi xuất hàng để giảm hao hụt do hết hạn.
          </AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.inventory)}>
          Đi tới Kho hàng
        </Button>
      </Section>

      <Section id="suppliers" icon={Truck} title="Nhà cung cấp">
        <p>
          Nhà cung cấp là đơn vị hoặc cá nhân mà cửa hàng thực tế nhập hàng từ đó — được chọn khi
          tạo phiếu nhập hàng. Thông tin quản lý gồm tên, người liên hệ, số điện thoại, email, mã
          số thuế, địa chỉ và ghi chú.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.suppliers)}>
          Đi tới Nhà cung cấp
        </Button>
      </Section>

      <Section id="categories" icon={FolderTree} title="Danh mục">
        <p>
          Danh mục dùng để phân loại sản phẩm (ví dụ: Bỉm, Sữa bột, Bình sữa). Một danh mục đang
          được sản phẩm sử dụng sẽ không thể xóa — hệ thống sẽ báo rõ để tránh mất liên kết dữ
          liệu.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.categories)}>
          Đi tới Danh mục
        </Button>
      </Section>

      <Section id="faq" icon={BookOpen} title="Xử lý thường gặp">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Không xóa được sản phẩm/danh mục/nhà cung cấp?</strong> Bản ghi đó đang được
            dữ liệu khác tham chiếu (ví dụ sản phẩm đã có phiếu nhập hoặc đơn hàng). Hãy dùng
            "Ngừng kinh doanh" thay vì xóa để giữ lại lịch sử.
          </li>
          <li>
            <strong>Không sửa được phiếu nhập?</strong> Chỉ phiếu ở trạng thái "Nháp" mới có thể
            sửa. Phiếu "Đã xác nhận"/"Đã hủy" là tài liệu lịch sử, không thể thay đổi.
          </li>
          <li>
            <strong>Ảnh sản phẩm không tải lên được?</strong> Hệ thống chỉ nhận ảnh JPG, PNG hoặc
            WEBP, dung lượng tối đa 5MB mỗi ảnh.
          </li>
        </ul>
      </Section>

      <Card id="tours" className="scroll-mt-20">
        <CardHeader>
          <CardTitle>Hướng dẫn tương tác theo từng màn hình</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Khi tạo hoặc sửa sản phẩm, bấm biểu tượng{' '}
            <CircleHelp className="inline size-3.5 align-text-bottom" aria-hidden="true" /> ở góc
            biểu mẫu để xem hướng dẫn riêng cho màn đó.
          </p>
          {/* `product-form` isn't listed here: it only makes sense to open while the
              Create/Edit dialog is already open (see the icon above), not replayed
              blind from this page — see `resolve-active-tour.ts`. */}
          {Object.values(TOUR_REGISTRY)
            .filter((tour) => tour.id !== 'product-form')
            .map((tour) => (
            <div
              key={tour.id}
              className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{tour.title}</p>
                <p className="text-xs text-muted-foreground">{tour.steps.length} bước</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(TOUR_ROUTES[tour.id] ?? ROUTES.home)}>
                  Mở màn hình
                </Button>
                <Button size="sm" onClick={() => replayTour(tour)}>
                  Xem lại hướng dẫn
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageContent>
  )
}

export { HelpCenterPage }
