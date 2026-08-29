/**
 * Extract usable image `File`s out of a paste event's clipboard data — the
 * one place `ClipboardEvent`/`DataTransferItem` handling lives, reused by
 * both `PendingProductImages` (create) and `ProductImagesManager` (edit) via
 * `useImagePaste`, so clipboard paste is never a separate upload pipeline —
 * every input method still ends up calling each component's existing
 * `handleFiles`, exactly like the file picker already does.
 *
 * Deliberately narrow: only `clipboardData.items` whose MIME type starts
 * with `image/` become files (via `item.getAsFile()`) — no `clipboard.read()`,
 * no scraping HTML/text items that might sit alongside the image, no
 * fetching a URL. What actually gets *accepted* (byte-sniffed type, size)
 * is still decided entirely by `validateImageFile`, exactly as for a
 * file-picker selection — this function only answers "is there an image
 * here at all" and gives it a safe name.
 */
export function getClipboardImageFiles(clipboardData: DataTransfer | null): File[] {
  if (!clipboardData) return []

  const files: File[] = []
  let index = 0
  for (const item of Array.from(clipboardData.items)) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (!file) continue
    files.push(renameClipboardFile(file, index))
    index += 1
  }
  return files
}

/**
 * Clipboard images routinely arrive with an empty, generic, or
 * OS-generated filename (`image.png`, `""`). The real Storage key never
 * uses this name — `uploadProductImage` always writes
 * `{productId}/{uuid}.{ext}` (see `upload-product-image.ts`) — but the name
 * still shows up in validation/error messages and pending-upload labels, so
 * give it a predictable one here, derived only from the MIME type (never
 * trusted from the clipboard/filename itself).
 */
function renameClipboardFile(file: File, index: number): File {
  const ext = extensionFromMimeType(file.type)
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')
  const name = `pasted-image-${timestamp}-${index + 1}.${ext}`
  return new File([file], name, { type: file.type, lastModified: file.lastModified })
}

function extensionFromMimeType(type: string): string {
  if (type === 'image/jpeg') return 'jpg'
  const subtype = type.split('/')[1]
  return subtype && /^[a-z0-9]+$/i.test(subtype) ? subtype : 'png'
}
