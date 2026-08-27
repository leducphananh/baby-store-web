import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { categoryFormSchema, type CategoryFormValues } from '@/features/categories/schemas/category-schema'

/**
 * Pure form — no dialog chrome, no create-vs-edit branching. The caller
 * (`CategoryFormDialog`) decides which mutation `onSubmit` triggers; this
 * component only knows about form fields and validation (see
 * `react-hook-form-zod`: share the form component between create/edit,
 * don't duplicate it).
 */
function CategoryForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  formId,
}: {
  defaultValues: CategoryFormValues
  onSubmit: (values: CategoryFormValues) => void
  isSubmitting: boolean
  /** The dialog's footer renders the actual submit button via `form={formId}`. */
  formId: string
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên danh mục</FormLabel>
              <FormControl>
                <Input placeholder="VD: Bỉm, Sữa bột, Bình sữa..." disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Input placeholder="Mô tả ngắn gọn (không bắt buộc)" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export { CategoryForm }
