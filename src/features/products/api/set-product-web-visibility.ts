import { supabase } from '@/lib/supabase'

/**
 * Flip `products.is_web_visible` directly — the quick list-row publish/
 * unpublish action (see `product-columns.tsx`), independent of the full
 * create/edit form. Same shape as `setProductStatus`: one column, one
 * `updated_at` touch, no side effects. `is_web_visible` is the canonical
 * field the separate storefront app's public catalog contract also reads
 * — never a second, admin-only visibility flag.
 */
export async function setProductWebVisibility({
  id,
  isWebVisible,
}: {
  id: string
  isWebVisible: boolean
}): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_web_visible: isWebVisible, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
