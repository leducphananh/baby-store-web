/**
 * Thrown when an update/cancel targets a receipt that is no longer a
 * `draft` (someone confirmed or cancelled it in another session between
 * load and save). Lets the UI show a clear "not editable" message instead
 * of a silent no-op — finalized stock documents are immutable
 * (CLAUDE.md §11, `domain-driven-frontend` rule 17).
 */
export class ImportReceiptNotEditableError extends Error {
  constructor(message = 'Phiếu nhập không còn ở trạng thái nháp.') {
    super(message)
    this.name = 'ImportReceiptNotEditableError'
  }
}
