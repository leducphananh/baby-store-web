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
import { useAllSuppliers } from '@/features/suppliers/hooks/use-all-suppliers'
import {
  importReceiptFormSchema,
  type ImportReceiptFormValues,
} from '@/features/import-receipts/schemas/import-receipt-schema'

/**
 * Pure header form for an import receipt, shared by create and edit (see
 * `react-hook-form-zod`, same pattern as `product-form.tsx`). The dialog
 * picks the mutation and can map a duplicate-code error back onto the
 * `receiptNumber` field via the passed `form`.
 */
export function ImportReceiptForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  formId,
}: {
  defaultValues: ImportReceiptFormValues
  onSubmit: (values: ImportReceiptFormValues, form: UseFormReturn<ImportReceiptFormValues>) => void
  isSubmitting: boolean
  formId: string
}) {
  const form = useForm<ImportReceiptFormValues>({
    resolver: zodResolver(importReceiptFormSchema),
    defaultValues,
  })

  const suppliersQuery = useAllSuppliers()
  const currentSupplierId = defaultValues.supplierId
  const suppliers = (suppliersQuery.data ?? []).filter(
    (supplier) => supplier.status === 'active' || supplier.id === currentSupplierId,
  )

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit((values) => onSubmit(values, form))}
        className="space-y-4"
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="receiptNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mã phiếu nhập</FormLabel>
                <FormControl>
                  <Input placeholder="VD: REC-004" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormDescription>Mã nội bộ, không trùng lặp.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="importDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày nhập</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nhà cung cấp</FormLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={isSubmitting || suppliersQuery.isLoading}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                      {supplier.status === 'archived' ? ' (ngừng hợp tác)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suppliersQuery.isError && (
                <FormDescription className="text-destructive">
                  Không tải được danh sách nhà cung cấp.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea placeholder="Không bắt buộc" rows={3} disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
