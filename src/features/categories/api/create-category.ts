import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/database'
import type { CategoryFormValues } from '@/features/categories/schemas/category-schema'

export async function createCategory(values: CategoryFormValues): Promise<void> {
  const { error } = await supabase.from('categories').insert({
    name: values.name,
    description: values.description ? values.description : null,
    // `categories.slug` is `NOT NULL` with no SQL-level `DEFAULT` — it's
    // filled in by the `categories_set_slug` BEFORE INSERT trigger
    // (`set_slug_from_name()`), but only when the incoming value is
    // exactly `NULL` (never for `''`, which the trigger treats as an
    // already-chosen slug and leaves alone — verified in the trigger
    // body). The generated `Insert` type doesn't know about that trigger
    // and marks `slug` required; this is the one safe, deliberate cast for
    // that specific gap, not a general escape hatch (see
    // `product-row.ts`'s identical, more heavily-commented case for
    // `products.slug`, added by the same storefront-catalog migration).
    slug: null,
    // `null` and `string` don't overlap per TS's own cast-safety check —
    // routing through `unknown` is the standard, sanctioned way to perform
    // a deliberate cast for a case the generated type genuinely can't
    // express (see the comment above).
  } as unknown as TablesInsert<'categories'>)
  if (error) throw error
}
