/**
 * Client-side image validation for the `product-images` bucket. This is the
 * first line of defence only — the bucket itself now enforces
 * `allowed_mime_types` and `file_size_limit` server-side (see
 * `supabase-storage` rule 3, and the `harden_product_images_bucket`
 * migration).
 *
 * Crucially, the accepted type is decided by **sniffing the file's magic
 * bytes**, not by trusting `file.type` or the filename extension (which a
 * caller controls freely — `frontend-security` rule 4).
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MiB, matches the bucket limit

type SniffedImageType = 'image/jpeg' | 'image/png' | 'image/webp'

const EXT_BY_TYPE: Record<SniffedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Human list for UI copy and the `<input accept>` attribute. */
export const ACCEPTED_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
export const ACCEPTED_IMAGE_LABEL = 'JPG, PNG hoặc WEBP'

function bytesMatch(bytes: Uint8Array, offset: number, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte)
}

/**
 * Inspect the leading bytes of the file and return the real image type, or
 * `null` if it isn't one of the three formats we accept — regardless of what
 * extension or `file.type` claims.
 */
export async function sniffImageType(file: File): Promise<SniffedImageType | null> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())

  // JPEG: FF D8 FF
  if (bytesMatch(header, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytesMatch(header, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'

  // WEBP: "RIFF" .... "WEBP"
  if (bytesMatch(header, 0, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(header, 8, [0x57, 0x45, 0x42, 0x50])) {
    return 'image/webp'
  }

  return null
}

export type ImageValidationResult =
  | { ok: true; contentType: SniffedImageType; ext: string }
  | { ok: false; message: string }

/**
 * Full check for one file: size, then content sniff. Returns the canonical
 * content-type and extension to use when building the storage key so the
 * stored object never inherits an attacker-supplied name.
 */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (file.size === 0) {
    return { ok: false, message: `Tệp "${file.name}" rỗng.` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      message: `Tệp "${file.name}" vượt quá 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    }
  }

  const sniffed = await sniffImageType(file)
  if (!sniffed) {
    return {
      ok: false,
      message: `Tệp "${file.name}" không phải ảnh ${ACCEPTED_IMAGE_LABEL} hợp lệ.`,
    }
  }

  return { ok: true, contentType: sniffed, ext: EXT_BY_TYPE[sniffed] }
}
