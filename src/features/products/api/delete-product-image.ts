import { supabase } from '@/lib/supabase'
import { PRODUCT_IMAGES_BUCKET } from '@/features/products/api/get-product-images'
import type { ProductImage } from '@/features/products/types/product'

/**
 * Remove one product image — storage object first, then the DB row.
 *
 * Order matters (see `file-upload` rule 7 / the phase brief): if the storage
 * delete fails we **keep** the DB row and abort, rather than deleting the
 * row and leaving an untracked file sitting in a private bucket. The
 * reverse (row gone, file briefly remains) is only reached when storage
 * succeeded, and is self-correcting — the object is already gone.
 *
 * If the deleted image was the primary one and others remain, the oldest
 * remaining image is promoted so a product with images always has a primary.
 */
export async function deleteProductImage({
  productId,
  image,
}: {
  productId: string
  image: Pick<ProductImage, 'id' | 'storagePath' | 'isPrimary'>
}): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([image.storagePath])
  if (storageError) throw storageError

  const { error: rowError } = await supabase.from('product_images').delete().eq('id', image.id)
  if (rowError) throw rowError

  if (!image.isPrimary) return

  const { data: remaining, error: remainingError } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (remainingError) throw remainingError

  const next = remaining?.[0]
  if (!next) return

  const { error: promoteError } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', next.id)
  if (promoteError) throw promoteError
}
