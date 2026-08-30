import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormReturn } from 'react-hook-form'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAllCategories } from '@/features/categories/hooks/use-all-categories'
import { IntegerField, NullableIntegerField } from '@/components/common/integer-field'
import { productFormSchema, type ProductFormValues } from '@/features/products/schemas/product-schema'

/** Sentinel for "no category" — Radix Select items can't have an empty value. */
const NO_CATEGORY = '__none__'

function Section({
  title,
  tourId,
  children,
}: {
  title: string
  /** Optional guided-tour spotlight target for this whole section — see `features/help`. */
  tourId?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4" data-tour={tourId}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  )
}

/**
 * Pure product form, shared by create and edit (see `react-hook-form-zod`
 * and the same pattern in `supplier-form.tsx`). The dialog decides which
 * mutation `onSubmit` runs; it receives the RHF instance too so it can map a
 * server-side unique-constraint error back onto the `sku`/`barcode` field.
 *
 * `imagesSection` is an optional slot for the dialog's image manager
 * (`ProductImagesManager` in edit mode, `PendingProductImages` in create
 * mode — see `product-form-dialog.tsx`). Images are deliberately NOT part of
 * `productFormSchema`/`ProductFormValues` — this form stays schema-driven
 * and has no idea whether it's looking at real uploaded images or local
 * pending files; it only renders whatever the dialog hands it, in the
 * "Ảnh sản phẩm" section of the form.
 */
export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  formId,
  imagesSection,
}: {
  defaultValues: ProductFormValues
  onSubmit: (values: ProductFormValues, form: UseFormReturn<ProductFormValues>) => void
  isSubmitting: boolean
  formId: string
  imagesSection?: ReactNode
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  })

  const categoriesQuery = useAllCategories()
  const categories = categoriesQuery.data ?? []

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit((values) => onSubmit(values, form))}
        className="space-y-6"
        noValidate
      >
        <Section title="Thông tin cơ bản" tourId="product-form-basic">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên sản phẩm</FormLabel>
                <FormControl>
                  <Input placeholder="VD: Bỉm Moony quần size L" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: MOONY-QUAN-L" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormDescription>Mã nội bộ, không trùng lặp.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã vạch</FormLabel>
                  <FormControl>
                    <Input placeholder="Không bắt buộc" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Danh mục</FormLabel>
                  <Select
                    value={field.value ? field.value : NO_CATEGORY}
                    onValueChange={(value) =>
                      field.onChange(value === NO_CATEGORY ? '' : value)
                    }
                    disabled={isSubmitting || categoriesQuery.isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>Chưa phân loại</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoriesQuery.isError && (
                    <FormDescription className="text-destructive">
                      Không tải được danh sách danh mục.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thương hiệu</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Moony" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn vị bán</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Gói, Hộp, Lon, Chai" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormDescription>
                    Đơn vị bán lẻ cơ bản. Mọi số lượng (tồn kho, đơn hàng, nhập hàng) đều tính theo
                    đơn vị này.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Không bắt buộc"
                    disabled={isSubmitting}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Section title="Giá & tồn kho" tourId="product-form-pricing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <IntegerField
              control={form.control}
              name="defaultPurchasePrice"
              label="Giá nhập mặc định"
              description="VND, số nguyên."
              disabled={isSubmitting}
            />
            <IntegerField
              control={form.control}
              name="sellingPrice"
              label="Giá bán"
              description="VND, số nguyên."
              disabled={isSubmitting}
            />
            <NullableIntegerField
              control={form.control}
              name="tiktokPrice"
              label="Giá TikTok"
              description="Để trống nếu chưa lên sàn TikTok Shop."
              disabled={isSubmitting}
            />
            <NullableIntegerField
              control={form.control}
              name="shopeePrice"
              label="Giá Shopee"
              description="Để trống nếu chưa lên sàn Shopee."
              disabled={isSubmitting}
            />
            <IntegerField
              control={form.control}
              name="minimumStock"
              label="Tồn kho tối thiểu"
              description="Ngưỡng cảnh báo sắp hết hàng."
              disabled={isSubmitting}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trạng thái kinh doanh</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Đang kinh doanh</SelectItem>
                    <SelectItem value="archived">Ngừng kinh doanh</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  "Ngừng kinh doanh" ẩn sản phẩm khỏi danh sách mặc định nhưng giữ nguyên lịch sử.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Section title="Nguồn gốc & xuất xứ" tourId="product-form-origin">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="originCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xuất xứ</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Nhật Bản" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhà sản xuất</FormLabel>
                  <FormControl>
                    <Input placeholder="Không bắt buộc" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="distributor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhà phân phối</FormLabel>
                  <FormControl>
                    <Input placeholder="Không bắt buộc" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả nguồn hàng</FormLabel>
                  <FormControl>
                    <Input placeholder="Không bắt buộc" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* Not wrapped in a `Section` — `ProductImagesManager`/`PendingProductImages`
            are each already a self-contained `Card` with their own title, matching
            how `ProductDetailPage` stacks its section cards (see those components). */}
        <div data-tour="product-form-images">{imagesSection}</div>
      </form>
    </Form>
  )
}
