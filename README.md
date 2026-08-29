# Baby Wale — Quản lý cửa hàng

Ứng dụng quản trị nội bộ (back-office) cho cửa hàng mẹ & bé **Baby Wale** — sữa, bỉm và đồ
dùng cho mẹ và bé. Không phải trang bán hàng công khai; đây là công cụ nhân viên dùng để quản
lý danh mục, tồn kho, nhà cung cấp, phiếu nhập hàng, đơn hàng và báo cáo.

## Bộ nhận diện thương hiệu

- **Logo**: [`public/branding/favicon.png`](public/branding/favicon.png) — huy hiệu tròn
  cá voi & em bé, dùng cho favicon, sidebar, drawer điều hướng (mobile/tablet) và trang đăng
  nhập; đi kèm chữ "Baby Wale" đặt riêng (ảnh không có sẵn chữ).
- **Bảng màu** (định nghĩa tại [`src/index.css`](src/index.css), theo chuẩn token
  shadcn/ui — đổi giá trị ở một nơi, áp dụng toàn bộ ứng dụng):

  | Token | Hex | Vai trò |
  | --- | --- | --- |
  | `--primary` | `#0D2B4E` | Navy — sidebar, nút chính, tiêu đề |
  | `--secondary` | `#FF8FA3` | Hồng — nút phụ, điểm nhấn |
  | `--accent` | `#6FA8DC` | Xanh dương — hover, focus ring, badge active |
  | `--info` | `#B7D5F0` | Xanh nhạt — badge/alert thông tin |
  | `--pastel-pink` | `#FFE4E9` | Hồng pastel — nền trang trí (vd. trang đăng nhập) |
  | `--background` | `#FFF7F1` | Nền kem toàn ứng dụng |
  | `--success` | `#22C55E` | Thành công |
  | `--warning` | `#F59E0B` | Cảnh báo |
  | `--destructive` | `#EF4444` | Lỗi / nguy hiểm |
  | `--border` | `#E6EEF8` | Viền, input |

  Màu chữ trên các nền hồng/xanh/vàng trung tính (secondary, accent, warning) dùng navy đậm
  thay vì trắng để đảm bảo độ tương phản đạt WCAG AA — xem chú thích trực tiếp trong
  `src/index.css`.

- **Typography**: [Nunito](https://fonts.google.com/specimen/Nunito) (Google Fonts) cho cả
  tiêu đề (Bold/ExtraBold, bo tròn, thân thiện) và nội dung (Regular).
- **Bo góc & đổ bóng**: bán kính 14px (`--radius`), đổ bóng mềm
  `0 2px 8px rgba(13,43,78,0.06)` cho card/panel.

## Công nghệ sử dụng

React 19 · TypeScript (strict) · Vite · React Router · TanStack Query · Zustand ·
React Hook Form + Zod · Tailwind CSS + shadcn/ui · Supabase (Database, Auth, Storage).

Xem [`CLAUDE.md`](CLAUDE.md) và `.claude/skills/` để biết đầy đủ quy tắc kiến trúc, quy ước
đặt tên, và nguyên tắc nghiệp vụ (VND nguyên, FEFO, truy vết lịch sử...).

## Bắt đầu

```bash
yarn install
cp .env.example .env.local   # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
yarn dev
```

## Lệnh kiểm tra

```bash
yarn lint        # eslint .
yarn typecheck    # tsc -b
yarn build        # tsc -b && vite build
```
