import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/database'
import type { ProductFormValues } from '@/features/products/schemas/product-schema'
import { toProductRow } from '@/features/products/api/product-row'

/**
 * Returns the new row's id — needed by the create-product dialog to upload
 * any pending images under the real product id right after creation (see
 * `product-form-dialog.tsx`; images are never uploaded before this resolves).
 */
export async function createProduct(values: ProductFormValues): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...toProductRow(values),
      // `toProductRow` never sets `slug` (see its own comment) — the
      // generated `Insert` type still marks it required because it can't
      // see the BEFORE INSERT trigger that actually fills it in from
      // `name`. `null` (never `''`) is what makes that trigger generate a
      // real, unique slug; this is the one safe, deliberate cast for that
      // specific gap, confined to this single insert call.
      slug: null,
      // `null` and `string` don't overlap per TS's own cast-safety check —
      // routing through `unknown` is the standard, sanctioned way to
      // perform a deliberate cast for a case the generated type genuinely
      // can't express (see the comment above).
    } as unknown as TablesInsert<'products'>)
    .select('id')
    .single()
  if (error) throw error
  return { id: data.id }
}
