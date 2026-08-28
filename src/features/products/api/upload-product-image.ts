import { supabase } from '@/lib/supabase'
import { PRODUCT_IMAGES_BUCKET } from '@/features/products/api/get-product-images'
import { validateImageFile } from '@/features/products/utils/validate-image-file'

/**
 * Thrown when the file fails client-side validation (type/size) — lets the
 * caller show a "file rejected" message distinct from an "upload failed"
 * (network/storage) error (see `file-upload` rule 6).
 */
export class ImageRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageRejectedError'
  }
}

/**
 * Upload one image for a product and record it in `product_images` — one
 * logical operation (see `file-upload` rule 7).
 *
 * Order and failure handling:
 *  1. validate (sniff bytes, not extension) → reject early, no network call
 *  2. upload the object under a random, entity-scoped key
 *     (`{productId}/{uuid}.{ext}`) — never the user's filename
 *  3. insert the DB row; **if that fails, delete the just-uploaded object**
 *     so a failed insert can't leave an orphan file in a private bucket
 *
 * The first image for a product (or the first when none is flagged) becomes
 * primary automatically.
 */
export async function uploadProductImage({
  productId,
  file,
}: {
  productId: string
  file: File
}): Promise<void> {
  const validation = await validateImageFile(file)
  if (!validation.ok) {
    throw new ImageRejectedError(validation.message)
  }

  const path = `${productId}/${crypto.randomUUID()}.${validation.ext}`

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: validation.contentType, upsert: false })
  if (uploadError) throw uploadError

  const { data: existing, error: existingError } = await supabase
    .from('product_images')
    .select('is_primary')
    .eq('product_id', productId)

  if (existingError) {
    await removeQuietly(path)
    throw existingError
  }

  const isPrimary = !(existing ?? []).some((row) => row.is_primary)

  const { error: insertError } = await supabase.from('product_images').insert({
    product_id: productId,
    storage_path: path,
    is_primary: isPrimary,
  })

  if (insertError) {
    // Roll back the upload so we don't leak an untracked file.
    await removeQuietly(path)
    throw insertError
  }
}

/** Best-effort cleanup; never masks the original error that triggered it. */
async function removeQuietly(path: string): Promise<void> {
  try {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
  } catch {
    // Swallowed on purpose: the caller is already throwing the real cause,
    // and a leftover object here is recoverable (same key is unreachable
    // from the UI and can be reaped later).
  }
}
