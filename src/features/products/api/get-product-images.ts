import { supabase } from '@/lib/supabase'
import { getSignedUrlsCached } from '@/features/products/api/signed-image-url-cache'
import type { ProductImage } from '@/features/products/types/product'

export const PRODUCT_IMAGES_BUCKET = 'product-images'

/**
 * Product images with short-lived signed URLs — the `product-images` bucket
 * is private (see `supabase-storage`). Primary image first, then oldest
 * first. A row whose object can't be signed (e.g. file went missing) is
 * dropped from the result rather than rendering a broken tile.
 *
 * Signed URLs go through `getSignedUrlsCached` rather than a direct
 * `createSignedUrls` call — same signing, but reused across repeat loads
 * instead of minting (and forcing the browser to re-download) a fresh URL
 * every time (see `signed-image-url-cache.ts`). This function still throws
 * on a real signing failure exactly as before — this manager's own image
 * gallery has always been an explicit `isError` state, never a silent
 * fallback.
 */
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('id, storage_path, is_primary, created_at')
    .eq('product_id', productId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw error

  const rows = data ?? []
  if (rows.length === 0) return []

  const urlByPath = await getSignedUrlsCached(
    PRODUCT_IMAGES_BUCKET,
    rows.map((row) => row.storage_path),
  )

  return rows
    .map((row): ProductImage | null => {
      const url = urlByPath.get(row.storage_path)
      if (!url) return null
      return {
        id: row.id,
        storagePath: row.storage_path,
        isPrimary: row.is_primary ?? false,
        createdAt: row.created_at,
        url,
      }
    })
    .filter((image): image is ProductImage => image !== null)
}
