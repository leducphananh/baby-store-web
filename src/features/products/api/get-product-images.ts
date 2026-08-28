import { supabase } from '@/lib/supabase'
import type { ProductImage } from '@/features/products/types/product'

/**
 * Product images with short-lived signed URLs — the `product-images` bucket
 * is private (see `supabase-storage`). Uploading images is a later phase;
 * this read path exists now so the detail view shows real images once they
 * exist rather than a placeholder forever. Primary image first.
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
    .from('product-images')
    .createSignedUrls(
      rows.map((row) => row.storage_path),
      60 * 60,
    )
  if (signError) throw signError

  const urlByPath = new Map<string, string>()
  for (const item of signed ?? []) {
    if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl)
  }

  return rows
    .map((row) => {
      const url = urlByPath.get(row.storage_path)
      if (!url) return null
      return { id: row.id, isPrimary: row.is_primary ?? false, url }
    })
    .filter((image): image is ProductImage => image !== null)
}
