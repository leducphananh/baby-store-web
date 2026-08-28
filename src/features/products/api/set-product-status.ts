import { supabase } from '@/lib/supabase'
import type { ProductStatus } from '@/features/products/types/product'

/**
 * Flip a product between `active` and `archived` — the schema-supported,
 * non-destructive alternative to deletion (CLAUDE.md §8). Archiving keeps
 * the product and all its history (orders, batches, imports) intact while
 * removing it from day-to-day "active catalog" views.
 */
export async function setProductStatus({
  id,
  status,
}: {
  id: string
  status: ProductStatus
}): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
