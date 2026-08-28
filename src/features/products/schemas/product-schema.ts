import { z } from 'zod'

/**
 * Shared by the create and edit forms (see `react-hook-form-zod`). The
 * product form has the same fields either way, so one schema and one form
 * component cover both.
 *
 * Optional text columns stay as plain (possibly empty) strings here so every
 * input is fully controlled; the empty-string → `null` mapping to the
 * database happens at the API boundary (`toProductRow`), not in the schema.
 * Money and stock fields are validated as non-negative integers — VND is
 * never a float (CLAUDE.md §8, `domain-driven-frontend` rule 1).
 */
const MAX_VND = 999_999_999_999

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên sản phẩm').max(200, 'Tên sản phẩm tối đa 200 ký tự'),
  sku: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã SKU')
    .max(60, 'Mã SKU tối đa 60 ký tự'),
  barcode: z.string().trim().max(60, 'Mã vạch tối đa 60 ký tự'),
  // '' means "no category" — `products.category_id` is nullable.
  categoryId: z.string(),
  brand: z.string().trim().max(120, 'Thương hiệu tối đa 120 ký tự'),
  unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị tính').max(30, 'Đơn vị tính tối đa 30 ký tự'),
  description: z.string().trim().max(2000, 'Mô tả tối đa 2000 ký tự'),
  originCountry: z.string().trim().max(100, 'Xuất xứ tối đa 100 ký tự'),
  manufacturer: z.string().trim().max(150, 'Nhà sản xuất tối đa 150 ký tự'),
  distributor: z.string().trim().max(150, 'Nhà phân phối tối đa 150 ký tự'),
  sourceDescription: z.string().trim().max(500, 'Mô tả nguồn hàng tối đa 500 ký tự'),
  defaultPurchasePrice: z
    .number()
    .int('Giá nhập phải là số nguyên')
    .min(0, 'Giá nhập không được âm')
    .max(MAX_VND, 'Giá nhập vượt quá giới hạn cho phép'),
  sellingPrice: z
    .number()
    .int('Giá bán phải là số nguyên')
    .min(0, 'Giá bán không được âm')
    .max(MAX_VND, 'Giá bán vượt quá giới hạn cho phép'),
  minimumStock: z
    .number()
    .int('Tồn kho tối thiểu phải là số nguyên')
    .min(0, 'Tồn kho tối thiểu không được âm')
    .max(1_000_000, 'Tồn kho tối thiểu vượt quá giới hạn cho phép'),
  status: z.enum(['active', 'archived']),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
