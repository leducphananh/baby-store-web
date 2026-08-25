---
name: vietnamese-business-ui
description: Vietnamese-market UI/business conventions for this app — language, currency formatting, date formats, phone/address formats, terminology consistency. Apply whenever writing user-facing text or formatting business data.
---

# Vietnamese business UI conventions

## Apply when
Writing any user-facing label/message, or formatting money, dates, phone numbers, or
addresses.

## Rules

1. **All user-facing UI text is Vietnamese** — labels, buttons, validation messages, empty
   states, error messages, toasts. Code (variable/function names, comments) stays in
   English. Don't mix English UI copy into a Vietnamese-facing screen.
2. **Money is always VND, integer, formatted with thousands separators**, using one shared
   `formatVnd()` utility everywhere (see `domain-driven-frontend`, `clean-code`):
   ```ts
   formatVnd(125000) // "125.000 ₫"  (or "đ" — pick one convention project-wide and stick to it)
   ```
   Never display raw unformatted integers for money, and never do money math with floats.
3. **Dates display in Vietnamese-friendly `dd/MM/yyyy` format** (e.g. `25/08/2026`), via one
   shared date-formatting utility — never rely on a raw `Date.toString()` or a US-style
   `MM/dd/yyyy` anywhere in the UI. Relative phrasing ("còn 5 ngày", "đã hết hạn") is
   encouraged for expiry alerts alongside the exact date.
4. **Phone numbers** follow Vietnamese mobile format (`0xxx xxx xxx`, 10 digits, leading 0),
   validated accordingly in Zod schemas for customer/supplier contact fields.
5. **Addresses** accommodate the Vietnamese administrative structure (province/city →
   district → ward → street) where a structured address is needed (e.g. customer delivery
   address) — a single free-text field is acceptable for simpler cases (e.g. supplier
   address) if the business doesn't need structured filtering on it.
6. **Terminology is consistent across the whole app** — pick one Vietnamese term per concept
   and use it everywhere (don't alternate between "Sản phẩm" and "Mặt hàng" for the same
   concept, or "Khách hàng" and "Người mua"). Maintain implicit consistency by checking
   existing screens' terminology before introducing a new label for the same concept.
   Suggested core terms: Sản phẩm (product), Danh mục (category), Nhà cung cấp (supplier),
   Phiếu nhập kho (import receipt), Hóa đơn đỏ/VAT (VAT invoice), Lô hàng (batch), Hạn sử
   dụng (expiry date), Ngày sản xuất (manufacture date), Tồn kho (inventory), Đơn hàng
   (order), Khách hàng (customer), Thanh toán (payment), Doanh thu (revenue), Lợi nhuận
   (profit).
7. **Number input accepts common Vietnamese formatting conventions** where users type
   (e.g. tolerate `.` as a thousands separator on paste) but store/validate as a clean
   integer — don't force users to strip formatting themselves.
8. **Keep UI copy concise and business-appropriate** — this is a staff tool, not
   consumer marketing copy; direct, clear instructions over friendly filler ("Xóa sản phẩm
   này?" not a long explanatory paragraph).
9. **Sort Vietnamese text correctly** (locale-aware sort, e.g. `localeCompare(b, 'vi')`) for
   name-based sorting (product names, customer names) so diacritics order correctly, not by
   raw byte/codepoint order.

## Anti-patterns to reject in review

- A mix of English and Vietnamese labels on the same screen ("Save" button next to
  "Xóa sản phẩm").
- Money shown as a raw number with no separator (`125000` instead of `125.000 ₫`).
- A date rendered as `2026-08-25` or `08/25/2026` in a user-facing view instead of
  `25/08/2026`.
- Two different Vietnamese terms used interchangeably for the same domain concept across
  different screens.
