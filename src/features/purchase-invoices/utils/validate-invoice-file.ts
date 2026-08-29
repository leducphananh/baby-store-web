/**
 * Client-side validation for purchase-invoice attachments in the
 * `purchase-invoices` bucket. This is the first line of defence only — the
 * bucket itself enforces `allowed_mime_types` and `file_size_limit`
 * server-side (see `supabase-storage` rule 3, and the
 * `harden_purchase_invoices_bucket` migration).
 *
 * The accepted type is decided by **sniffing the file's magic bytes**, not
 * by trusting `file.type` or the filename extension (which a caller controls
 * freely — `frontend-security` rule 4).
 *
 * Accepted business formats: PDF, JPG/JPEG, PNG.
 */

export const MAX_INVOICE_FILE_BYTES = 10 * 1024 * 1024 // 10 MiB, matches the bucket limit

type SniffedInvoiceType = 'application/pdf' | 'image/jpeg' | 'image/png'

const EXT_BY_TYPE: Record<SniffedInvoiceType, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

/** For the `<input accept>` attribute and UI copy. */
export const ACCEPTED_INVOICE_ACCEPT = 'application/pdf,image/jpeg,image/png'
export const ACCEPTED_INVOICE_LABEL = 'PDF, JPG hoặc PNG'

function bytesMatch(bytes: Uint8Array, offset: number, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte)
}

/**
 * Inspect the leading bytes of the file and return the real type, or `null`
 * if it isn't one of the three formats we accept — regardless of what
 * extension or `file.type` claims.
 */
export async function sniffInvoiceType(file: File): Promise<SniffedInvoiceType | null> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())

  // PDF: "%PDF-"
  if (bytesMatch(header, 0, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'

  // JPEG: FF D8 FF
  if (bytesMatch(header, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytesMatch(header, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'

  return null
}

export type InvoiceFileValidationResult =
  | { ok: true; contentType: SniffedInvoiceType; ext: string }
  | { ok: false; message: string }

/**
 * Full check for one file: size, then content sniff. Returns the canonical
 * content-type and extension to use when building the storage key so the
 * stored object never inherits an attacker-supplied name.
 */
export async function validateInvoiceFile(file: File): Promise<InvoiceFileValidationResult> {
  if (file.size === 0) {
    return { ok: false, message: `Tệp "${file.name}" rỗng.` }
  }
  if (file.size > MAX_INVOICE_FILE_BYTES) {
    return {
      ok: false,
      message: `Tệp "${file.name}" vượt quá 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    }
  }

  const sniffed = await sniffInvoiceType(file)
  if (!sniffed) {
    return {
      ok: false,
      message: `Tệp "${file.name}" không phải ${ACCEPTED_INVOICE_LABEL} hợp lệ.`,
    }
  }

  return { ok: true, contentType: sniffed, ext: EXT_BY_TYPE[sniffed] }
}
