import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

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
import { Textarea } from '@/components/ui/textarea'
import {
  purchaseInvoiceFormSchema,
  type PurchaseInvoiceFormValues,
} from '@/features/purchase-invoices/schemas/purchase-invoice-schema'

/**
 * Pure header form for a purchase VAT / red invoice, shared by create and
 * edit (see `react-hook-form-zod`, same pattern as `import-receipt-form.tsx`).
 * The supplier is inherited from the parent import receipt and shown by the
 * dialog, not entered here.
 */
export function PurchaseInvoiceForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  formId,
}: {
  defaultValues: PurchaseInvoiceFormValues
  onSubmit: (values: PurchaseInvoiceFormValues) => void
  isSubmitting: boolean
  formId: string
}) {
  const form = useForm<PurchaseInvoiceFormValues>({
    resolver: zodResolver(purchaseInvoiceFormSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số hóa đơn</FormLabel>
                <FormControl>
                  <Input placeholder="VD: 0001234" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormDescription>Số hóa đơn GTGT do nhà cung cấp phát hành.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày hóa đơn</FormLabel>
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
