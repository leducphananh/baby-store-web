import { ImageRejectedError } from '@/features/products/api/upload-product-image'

type ImageAction = 'upload' | 'delete' | 'primary'

/**
 * Vietnamese, user-safe message for an image mutation failure. A rejected
 * file (wrong type / too big — `ImageRejectedError`, or the bucket's own
 * `allowed_mime_types` / `file_size_limit` rejection) reads differently from
 * an upload that reached the server and failed there (see `file-upload`
 * rule 6, `error-handling`).
 */
export function getImageErrorMessage(error: unknown, action: ImageAction): string {
  if (error instanceof ImageRejectedError) {
    return error.message
  }

  const raw = error instanceof Error ? error.message.toLowerCase() : ''
  if (action === 'upload' && (raw.includes('mime') || raw.includes('size') || raw.includes('exceeded'))) {
    return `Tệp bị từ chối: chỉ nhận ảnh JPG, PNG hoặc WEBP dưới 5MB.`
  }

  switch (action) {
    case 'upload':
      return 'Tải ảnh lên thất bại. Vui lòng thử lại.'
    case 'delete':
      return 'Không thể xóa ảnh. Vui lòng thử lại.'
    case 'primary':
      return 'Không thể đặt ảnh chính. Vui lòng thử lại.'
  }
}
