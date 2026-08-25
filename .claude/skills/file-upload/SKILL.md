---
name: file-upload
description: File upload UX and validation conventions for product images and invoice/receipt scans — client-side validation, progress, preview, error states. Apply whenever building an upload UI.
---

# File upload conventions

## Apply when
Building any upload UI: product images, VAT/red invoice scans, import receipt attachments.

## Rules

1. **Validate before upload starts**: file type (MIME allow-list) and size limit, checked
   immediately on file selection, with a clear inline error if rejected — don't let an
   invalid file reach the network call before failing (see `frontend-security`,
   `supabase-storage` for the specific limits per bucket).
2. **Show a preview for images** (thumbnail of the selected file before/while uploading) and
   a filename + size for non-image files (PDF invoices) so the user can confirm they picked
   the right file.
3. **Show real upload progress/state**: idle → selecting → uploading (with progress if the
   SDK exposes it) → success → error. Never a button that just "does nothing" for several
   seconds with no feedback.
4. **Support multi-file upload for product images** (a product can have several images),
   with per-file status and the ability to remove one before/after upload, and a way to mark
   one image as primary.
5. **Drag-and-drop is a nice-to-have on top of a real `<input type="file">`**, not a
   replacement for it — always keep a clickable, keyboard-accessible file picker as the
   baseline (see `accessibility`).
6. **On upload failure, the user can retry without re-selecting the file** if reasonably
   possible, and the error message distinguishes "file rejected" (type/size) from "upload
   failed" (network/server) per `error-handling`.
7. **Uploads go through the feature's `api/` service function** (e.g.
   `uploadProductImage`), which handles the Storage call and the corresponding DB row
   (e.g. inserting into `product_images`) — treat "upload file" and "record it in the DB" as
   one logical operation from the caller's perspective, and handle the case where one
   succeeds and the other fails (surface it, don't leave an orphaned file or a dangling DB
   row silently).
8. **Deleting a record with attached files removes the files too** (see `supabase-storage`)
   — the delete flow for a product/receipt is aware of its attachments.
9. **Never block the rest of the form on file upload** unless the file is strictly required
   before submit — let users fill in other fields while an image uploads in the background
   where that's a better UX, but be explicit about whether the form waits for upload
   completion before allowing submit.

## Anti-patterns to reject in review

- A file input with no client-side type/size validation, discovering the rejection only
  after a failed network round-trip.
- An upload with no visible progress or completion state.
- A record deleted while leaving its uploaded files orphaned in Storage.
- Drag-and-drop implemented with no accessible fallback file picker.
