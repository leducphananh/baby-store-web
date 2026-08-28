import { supabase } from '@/lib/supabase'
import type { ProductImage } from '@/features/products/types/product'

export const PRODUCT_IMAGES_BUCKET = 'product-images'
const SIGNED_URL_TTL_SECONDS = 60 * 60

/**
 * Product images with short-lived signed URLs — the `product-images` bucket
 * is private (see `supabase-storage`). Primary image first, then oldest
 * first. A row whose object can't be signed (e.g. file went missing) is
 * dropped from the result rather than rendering a broken tile.
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

  const { data: signed, error: signError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUrls(
      rows.map((row) => row.storage_path),
      SIGNED_URL_TTL_SECONDS,
    )
  if (signError) throw signError

  const urlByPath = new Map<string, string>()
  for (const item of signed ?? []) {
    if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl)
  }

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
