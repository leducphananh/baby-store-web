import { ROUTES } from '@/routes/route-paths'
import type { Tour } from '@/features/help/types/tour'

/**
 * Content for every contextual guided tour, keyed by a stable tour id (see
 * `resolve-active-tour.ts` for how a route/screen maps to one of these ids).
 *
 * This is the ONE place tour copy lives — components only reference a tour
 * by id, they never inline step text (CLAUDE.md §12). Every `target` here
 * must have a matching `data-tour="..."` attribute somewhere in the actual
 * rendered UI; `tour-overlay.tsx` skips a step safely if its target isn't
 * currently on screen (conditionally hidden, empty table, responsive
 * layout, etc.) rather than getting stuck.
 *
 * Content only describes features that actually exist in the app as of
 * Phase 4.6 — see the completion report for the audit this was built from.
 */
export const TOUR_REGISTRY: Record<string, Tour> = {
  'products-list': {
    id: 'products-list',
    title: 'Danh sách sản phẩm',
    steps: [
      {
        target: 'products-search',
        title: 'Tìm kiếm sản phẩm',
        description:
          'Tìm nhanh sản phẩm theo tên, mã SKU hoặc mã vạch. Kết quả sẽ tự động cập nhật khi bạn gõ.',
      },
      {
        target: 'products-filters',
        title: 'Lọc sản phẩm',
        description:
          'Lọc theo danh mục hoặc theo trạng thái kinh doanh (Đang kinh doanh / Ngừng kinh doanh) để thu hẹp danh sách.',
      },
      {
        target: 'products-table',
        title: 'Bảng danh sách sản phẩm',
        description:
          'Mỗi dòng là một sản phẩm với ảnh, tên, danh mục, các mức giá (giá nhập, giá bán, giá TikTok, giá Shopee) và tồn kho hiện tại. Sản phẩm dưới định mức tồn kho tối thiểu sẽ được đánh dấu rõ ràng.',
      },
      {
        target: 'product-thumbnail',
        title: 'Xem ảnh sản phẩm',
        description: 'Bấm vào ảnh đại diện của sản phẩm để xem ảnh cỡ lớn ngay tại đây, không cần mở trang chi tiết.',
      },
      {
        target: 'column-visibility-button',
        title: 'Tùy chỉnh cột hiển thị',
        description:
          'Ẩn/hiện các cột theo nhu cầu của bạn — lựa chọn sẽ được ghi nhớ cho lần sau trên trình duyệt này.',
      },
      {
        target: 'page-size-selector',
        title: 'Số dòng mỗi trang',
        description: 'Chọn số sản phẩm hiển thị trên mỗi trang: 10, 20, 50 hoặc 100 dòng.',
      },
      {
        target: 'products-add-button',
        title: 'Thêm sản phẩm mới',
        description:
          'Mở biểu mẫu tạo sản phẩm — bạn có thể nhập thông tin cơ bản, giá, nguồn gốc và thêm ảnh ngay trong biểu mẫu này.',
      },
      {
        target: 'product-row-actions',
        title: 'Thao tác trên từng sản phẩm',
        description:
          'Mở menu này để xem chi tiết, sửa, nhân bản sản phẩm (tạo sản phẩm mới dựa trên sản phẩm có sẵn), chuyển trạng thái kinh doanh, hoặc xóa.',
      },
    ],
  },

  'product-form': {
    id: 'product-form',
    title: 'Tạo / sửa sản phẩm',
    steps: [
      {
        target: 'product-form-basic',
        title: 'Thông tin cơ bản',
        description:
          'Nhập tên sản phẩm, mã SKU nội bộ (không được trùng), mã vạch, danh mục, thương hiệu và đơn vị bán (ví dụ: Gói, Hộp, Lon).',
      },
      {
        target: 'product-form-pricing',
        title: 'Giá & tồn kho',
        description:
          'Giá nhập mặc định và giá bán là bắt buộc. Giá TikTok và giá Shopee không bắt buộc — để trống nếu sản phẩm chưa lên sàn tương ứng. Tồn kho tối thiểu dùng để cảnh báo khi sắp hết hàng.',
      },
      {
        target: 'product-form-origin',
        title: 'Nguồn gốc & xuất xứ',
        description:
          'Đây là thông tin mô tả sản phẩm: xuất xứ, nhà sản xuất và "Nhà phân phối" (đơn vị phân phối/nhập khẩu chính hãng ghi trên sản phẩm). Lưu ý: "Nhà phân phối" khác với "Nhà cung cấp" — nhà cung cấp là nơi cửa hàng thực sự nhập hàng, được quản lý riêng ở phiếu nhập hàng.',
      },
      {
        target: 'product-form-images',
        title: 'Ảnh sản phẩm',
        description:
          'Chọn ảnh từ máy tính hoặc dán trực tiếp bằng Ctrl+V (ví dụ ảnh vừa chụp màn hình hoặc sao chép từ nơi khác). Chọn một ảnh làm "ảnh chính" — đây là ảnh sẽ hiển thị trong danh sách sản phẩm.',
      },
      {
        target: 'product-form-submit',
        title: 'Lưu sản phẩm',
        description: 'Sau khi kiểm tra thông tin, bấm nút này để lưu. Hệ thống sẽ báo rõ nếu có lỗi cần sửa (ví dụ mã SKU đã tồn tại).',
      },
    ],
  },

  'product-detail': {
    id: 'product-detail',
    title: 'Chi tiết sản phẩm',
    steps: [
      {
        target: 'product-detail-header',
        title: 'Thao tác nhanh',
        description:
          'Từ đây bạn có thể sửa thông tin sản phẩm, nhân bản sản phẩm để tạo sản phẩm mới tương tự, hoặc chuyển trạng thái kinh doanh.',
      },
      {
        target: 'product-detail-pricing',
        title: 'Giá & định mức',
        description: 'Xem đầy đủ các mức giá đã thiết lập và chênh lệch giữa giá bán và giá nhập.',
      },
      {
        target: 'product-detail-inventory',
        title: 'Tồn kho & lô hàng',
        description:
          'Xem tổng tồn kho hiện tại và danh sách từng lô hàng (số lô, hạn sử dụng, số lượng còn lại), sắp xếp theo hạn sử dụng gần nhất trước — để ưu tiên xuất lô sắp hết hạn trước.',
      },
      {
        target: 'product-detail-images',
        title: 'Quản lý ảnh sản phẩm',
        description: 'Thêm, xóa hoặc đổi ảnh chính trực tiếp tại đây — thay đổi được lưu ngay lập tức.',
      },
    ],
  },

  categories: {
    id: 'categories',
    title: 'Danh mục sản phẩm',
    steps: [
      {
        target: 'categories-search',
        title: 'Tìm danh mục',
        description: 'Tìm nhanh danh mục theo tên.',
      },
      {
        target: 'categories-add-button',
        title: 'Thêm danh mục',
        description: 'Tạo danh mục mới với tên và mô tả ngắn gọn (không bắt buộc).',
      },
      {
        target: 'categories-table',
        title: 'Danh sách danh mục',
        description:
          'Mỗi danh mục có thể được sửa hoặc xóa. Nếu danh mục đang được sản phẩm sử dụng, hệ thống sẽ báo không thể xóa để tránh mất liên kết dữ liệu.',
      },
    ],
  },

  suppliers: {
    id: 'suppliers',
    title: 'Nhà cung cấp',
    steps: [
      {
        target: 'suppliers-search',
        title: 'Tìm nhà cung cấp',
        description: 'Tìm theo tên, số điện thoại hoặc email.',
      },
      {
        target: 'suppliers-add-button',
        title: 'Thêm nhà cung cấp',
        description:
          'Nhà cung cấp là đơn vị hoặc cá nhân mà cửa hàng thực sự nhập hàng từ đó — khác với "Nhà phân phối" ghi trên thông tin sản phẩm. Nhập tên, người liên hệ, số điện thoại, email, mã số thuế, địa chỉ và ghi chú.',
      },
      {
        target: 'suppliers-table',
        title: 'Danh sách nhà cung cấp',
        description:
          'Danh sách này được dùng khi tạo phiếu nhập hàng — chọn nhà cung cấp tương ứng cho mỗi phiếu nhập.',
      },
    ],
  },

  'imports-list': {
    id: 'imports-list',
    title: 'Phiếu nhập hàng',
    steps: [
      {
        target: 'imports-search',
        title: 'Tìm phiếu nhập',
        description: 'Tìm theo mã phiếu nhập.',
      },
      {
        target: 'imports-filters',
        title: 'Lọc phiếu nhập',
        description: 'Lọc theo nhà cung cấp, trạng thái (Nháp / Đã xác nhận / Đã hủy) hoặc khoảng ngày nhập.',
      },
      {
        target: 'imports-add-button',
        title: 'Tạo phiếu nhập',
        description: 'Tạo một phiếu nhập hàng mới ở trạng thái Nháp — bạn sẽ thêm sản phẩm vào phiếu ở bước tiếp theo.',
      },
      {
        target: 'imports-table',
        title: 'Danh sách phiếu nhập',
        description:
          'Bấm vào mã phiếu để xem chi tiết. Phiếu ở trạng thái Nháp có thể sửa hoặc hủy; phiếu Đã xác nhận / Đã hủy là tài liệu lịch sử, không thể chỉnh sửa.',
      },
    ],
  },

  'import-receipt-detail': {
    id: 'import-receipt-detail',
    title: 'Chi tiết phiếu nhập',
    steps: [
      {
        target: 'import-detail-header',
        title: 'Thông tin & trạng thái phiếu',
        description:
          'Xem nhà cung cấp, ngày nhập, tổng chi phí ghi nhận và trạng thái phiếu. Chỉ phiếu ở trạng thái Nháp mới có thể sửa hoặc hủy.',
      },
      {
        target: 'import-lines-add',
        title: 'Thêm sản phẩm vào phiếu',
        description:
          'Tìm và thêm từng sản phẩm vào phiếu nhập, nhập số lượng và đơn giá nhập cho mỗi dòng. Chỉ thực hiện được khi phiếu còn ở trạng thái Nháp.',
      },
      {
        target: 'import-lines-table',
        title: 'Chi tiết hàng hóa',
        description:
          'Mỗi dòng hàng có thể khai báo số lô và hạn sử dụng — thông tin này sẽ tạo thành từng lô hàng riêng trong kho, phục vụ theo dõi hạn sử dụng sau này.',
      },
      {
        target: 'import-batches',
        title: 'Lô hàng được tạo ra',
        description:
          'Khi phiếu nhập chuyển sang trạng thái "Đã xác nhận", hệ thống sẽ tự động tạo lô hàng tương ứng và ghi nhận vào tồn kho — đây là thời điểm số lượng tồn kho thực sự tăng lên, không phải khi vừa tạo phiếu.',
      },
      {
        target: 'import-invoices',
        title: 'Hóa đơn GTGT / hóa đơn đỏ',
        description: 'Đính kèm hóa đơn giá trị gia tăng của nhà cung cấp cho phiếu nhập này, kèm tệp scan (PDF hoặc ảnh) nếu có.',
      },
    ],
  },

  inventory: {
    id: 'inventory',
    title: 'Tổng quan kho hàng',
    steps: [
      {
        target: 'inventory-summary-cards',
        title: 'Thẻ cảnh báo tồn kho',
        description:
          'Bốn thẻ tổng hợp: sản phẩm hết hàng, dưới định mức tối thiểu, lô hàng sắp hết hạn và đã hết hạn. Bấm vào một thẻ để lọc nhanh danh sách bên dưới theo đúng nhóm đó.',
      },
      {
        target: 'inventory-search',
        title: 'Tìm và lọc sản phẩm',
        description: 'Tìm theo tên/SKU, lọc theo danh mục, tình trạng tồn kho hoặc hạn dùng.',
      },
      {
        target: 'inventory-table',
        title: 'Bảng tồn kho theo sản phẩm',
        description:
          'Mỗi dòng tổng hợp tồn kho thực tế của một sản phẩm từ dữ liệu lô hàng, kèm số lô còn hàng và hạn dùng gần nhất — không phải số liệu ước tính.',
      },
      {
        target: 'inventory-row-actions',
        title: 'Xem sản phẩm / lô hàng',
        description: 'Mở nhanh trang sản phẩm hoặc đi thẳng đến phần lô hàng của sản phẩm đó.',
      },
    ],
  },

  'inventory-transactions': {
    id: 'inventory-transactions',
    title: 'Giao dịch kho',
    steps: [
      {
        target: 'inventory-tx-filters',
        title: 'Lọc lịch sử giao dịch',
        description: 'Lọc theo sản phẩm, lô hàng, loại giao dịch hoặc khoảng thời gian.',
      },
      {
        target: 'inventory-tx-table',
        title: 'Nhật ký biến động tồn kho',
        description:
          'Đây là nhật ký lịch sử — mỗi giao dịch (nhập hàng, bán hàng, hủy đơn, điều chỉnh...) đều được ghi lại tự động và không thể sửa hoặc xóa trực tiếp, để đảm bảo có thể truy vết chính xác mọi biến động tồn kho.',
      },
      {
        target: 'page-size-selector',
        title: 'Số dòng mỗi trang',
        description: 'Chọn số giao dịch hiển thị trên mỗi trang.',
      },
    ],
  },
}

/**
 * "Bắt đầu nhanh" — a business-workflow walkthrough, not a UI tour: its
 * steps have no `target` (see `TourStep`) because the workflow spans
 * several screens. Each step's optional `action` link jumps to the right
 * screen so the user can actually do that step, then reopen the guide from
 * the floating Help button to continue.
 */
export const QUICK_START_TOUR: Tour = {
  id: 'quick-start',
  title: 'Bắt đầu nhanh',
  steps: [
    {
      title: 'Chào mừng đến với Baby Wale',
      description:
        'Đây là hướng dẫn các bước cơ bản để bắt đầu sử dụng hệ thống quản lý cửa hàng, theo đúng thứ tự nên làm khi mới thiết lập.',
    },
    {
      title: '1. Tạo danh mục sản phẩm',
      description: 'Tạo các danh mục để phân loại sản phẩm, ví dụ: Bỉm, Sữa bột, Bình sữa.',
      action: { label: 'Đi tới Danh mục', to: ROUTES.categories },
    },
    {
      title: '2. Tạo nhà cung cấp',
      description: 'Khai báo các nhà cung cấp mà cửa hàng nhập hàng từ đó — sẽ được chọn khi tạo phiếu nhập.',
      action: { label: 'Đi tới Nhà cung cấp', to: ROUTES.suppliers },
    },
    {
      title: '3. Tạo sản phẩm',
      description:
        'Thêm sản phẩm với tên, danh mục, đơn vị bán, giá nhập/giá bán và ảnh minh họa. Đây là thông tin danh mục sản phẩm, chưa phải tồn kho thực tế.',
      action: { label: 'Đi tới Sản phẩm', to: ROUTES.products },
    },
    {
      title: '4. Tạo phiếu nhập hàng',
      description: 'Khi nhận hàng từ nhà cung cấp, tạo một phiếu nhập và thêm từng sản phẩm cùng số lượng, đơn giá nhập.',
      action: { label: 'Đi tới Nhập hàng', to: ROUTES.imports },
    },
    {
      title: '5. Khai báo lô và hạn sử dụng',
      description: 'Với mỗi dòng hàng trong phiếu nhập, có thể khai báo số lô và hạn sử dụng để theo dõi chính xác từng lô hàng.',
    },
    {
      title: '6. Tồn kho được cập nhật khi phiếu được xác nhận',
      description:
        'Số lượng tồn kho thực tế chỉ tăng lên khi phiếu nhập chuyển sang trạng thái "Đã xác nhận" — lúc đó hệ thống tự động tạo các lô hàng tương ứng.',
    },
    {
      title: '7. Theo dõi tồn kho',
      description: 'Xem tổng quan tồn kho, sản phẩm sắp hết hàng và lô hàng sắp hết hạn tại đây.',
      action: { label: 'Đi tới Kho hàng', to: ROUTES.inventory },
    },
  ],
}
