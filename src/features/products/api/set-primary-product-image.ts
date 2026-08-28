import { supabase } from '@/lib/supabase'

/**
 * Make one image the product's primary. `product_images.is_primary` has no
 * DB-level "exactly one per product" constraint, so this enforces it in two
 * steps — clear the current primary first, then set the new one — so there's
 * never a moment with two primaries (and it stays correct if such a
 * constraint is added later).
 */
export async function setPrimaryProductImage({
  productId,
  imageId,
}: {
  productId: string
  imageId: string
}): Promise<void> {
  const { error: clearError } = await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .eq('is_primary', true)
  if (clearError) throw clearError

  const { error: setError } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
  if (setError) throw setError
}
