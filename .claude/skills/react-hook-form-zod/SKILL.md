---
name: react-hook-form-zod
description: Form and validation conventions using React Hook Form + Zod — schema-driven forms, shared create/edit schemas, server error mapping. Apply whenever building or editing a form.
---

# React Hook Form + Zod conventions

## Apply when
Building any data-entry form (product, supplier, import receipt, order, customer, batch,
payment) or editing validation logic.

## Rules

1. **Every form has a Zod schema in the feature's `schemas/`**, and the form's TS type is
   inferred from it — never hand-write a parallel `interface` for form values:
   ```ts
   // features/products/schemas/product-schema.ts
   export const productFormSchema = z.object({
     name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
     categoryId: z.string().uuid('Danh mục không hợp lệ'),
     unitPriceVnd: z.number().int().nonnegative('Giá phải là số nguyên không âm'),
   })
   export type ProductFormValues = z.infer<typeof productFormSchema>
   ```
2. **Validation messages are in Vietnamese** (user-facing UI language, see
   `vietnamese-business-ui`), field names/keys stay in English/camelCase.
3. **Wire with `zodResolver`:**
   ```ts
   const form = useForm<ProductFormValues>({
     resolver: zodResolver(productFormSchema),
     defaultValues,
   })
   ```
4. **Share schemas between create/edit where the shape overlaps**, and compose the
   difference instead of duplicating:
   ```ts
   export const productFormSchema = z.object({ ... })          // shared fields
   export const createProductInput = productFormSchema
   export const updateProductInput = productFormSchema.partial().extend({ id: z.string().uuid() })
   ```
5. **Money fields:** input/display as VND integers (no decimals, no floats). Parse input
   strings to integers, validate `z.number().int().nonnegative()`. Never store or validate
   money as a float.
6. **Dates:** manufacture date / expiry date fields validate as real dates and enforce
   domain rules in the schema with `.refine()` where relevant, e.g. expiry must be after
   manufacture date:
   ```ts
   .refine((d) => d.expiryDate > d.manufactureDate, {
     message: 'Hạn sử dụng phải sau ngày sản xuất',
     path: ['expiryDate'],
   })
   ```
7. **Server/mutation errors map back to fields** when the server rejects a specific field
   (e.g. duplicate SKU), using `form.setError('sku', { message: ... })` — don't just show a
   generic toast when the error is field-attributable.
8. **Use `Controller` for shadcn/ui inputs that aren't native `<input>`** (Select, DatePicker,
   Combobox) — don't hand-wire `onChange`/`value` around RHF's register for these.
9. **Submit handler validates via RHF, calls the feature's mutation hook, and does not
   contain business logic itself** — business rules belong in the schema or the service
   layer, not in the `onSubmit` callback.
10. **Disable the submit button while `form.formState.isSubmitting`** and show inline field
    errors (`form.formState.errors.field?.message`) next to each input, not only as a toast.
11. **Reset the form deliberately** (`form.reset(newDefaults)`) after a successful create/edit
    mutation, not via a `useEffect` watching query data.

## Anti-patterns to reject in review

- A form with hand-written `if (!name) setError(...)` validation instead of a Zod schema.
- A monetary field typed/validated as `z.number()` without `.int()`, allowing floats.
- Duplicated schema fields between the create and edit forms of the same entity that have
  drifted out of sync.
- Business rule validation (e.g. "SKU must be unique") attempted client-side only, with no
  server/RLS-level enforcement.
