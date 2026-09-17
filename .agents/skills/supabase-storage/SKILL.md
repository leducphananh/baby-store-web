---
name: supabase-storage
description: Supabase Storage conventions for product images and invoice/receipt files — bucket structure, upload validation, access control. Apply whenever uploading, storing, or displaying a file.
---

# Supabase Storage conventions

## Apply when
Uploading or displaying product images, VAT/red invoice scans, or other store files.

## Rules

1. **One bucket per file category with a clear purpose**, e.g. `product-images`,
   `invoices`. Don't dump every file type into one generic `uploads` bucket.
2. **Path structure is predictable and scoped to the owning entity**, not flat random
   filenames:
   ```
   product-images/{productId}/{imageId}.webp
   invoices/{supplierId}/{importReceiptId}/{fileId}.pdf
   ```
3. **Validate before upload, client-side as a first line of defense:**
   - Allow-list MIME types per bucket (images: `image/jpeg`, `image/png`, `image/webp`;
     invoices: `application/pdf`, `image/jpeg`, `image/png`).
   - Enforce a max file size (e.g. 5MB for images, 10MB for invoice scans) and reject over
     the limit before calling `upload`.
   - Never trust the file's extension alone — check the actual `file.type`/MIME.
   - Real enforcement still belongs on the server side (Storage bucket policies /
     `file_size_limit` and `allowed_mime_types` on the bucket), client validation is UX only.
4. **Upload through a feature service function** (`features/products/api/upload-product-image.ts`),
   not inline in a component — same layering rule as `supabase-react`.
5. **Product images:** buckets/paths support multiple images per product with an explicit
   order/primary flag stored in the `product_images` table — don't encode order in the
   filename.
6. **Invoice/receipt files:** treat as sensitive business documents — private bucket, access
   via signed URLs generated server-side/on-demand, not public URLs, unless there's a
   specific reason a file must be public (e.g. a public product photo).
7. **Show upload progress and explicit error states** (file too large, wrong type, network
   failure) — never a silent failed upload with no user feedback.
8. **Clean up orphaned files** when the owning record is deleted (e.g. deleting a product
   removes its images from Storage too), via the service function that performs the delete,
   not left to accumulate.
9. **Generate a reasonable filename/id server-side or via `crypto.randomUUID()`**, don't use
   the raw user-supplied filename as the storage key (collision + path traversal risk).

## Anti-patterns to reject in review

- Uploading a file straight from an `<input type="file">` onChange handler with no MIME/size
  check.
- Public bucket used for invoice scans containing supplier pricing/cost data.
- Storage key built directly from `file.name` without sanitization.
- No cleanup path when a product/receipt with attached files is deleted.
