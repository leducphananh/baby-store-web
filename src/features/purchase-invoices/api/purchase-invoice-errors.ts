/**
 * Thrown when an attachment fails client-side validation (type/size) — lets
 * the caller show a "file rejected" message distinct from an "upload failed"
 * (network/storage) error (see `file-upload` rule 6).
 */
export class InvoiceFileRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvoiceFileRejectedError'
  }
}
