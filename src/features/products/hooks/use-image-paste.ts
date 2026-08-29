import { useCallback, type ClipboardEvent } from 'react'

import { getClipboardImageFiles } from '@/features/products/utils/clipboard-image-files'

/**
 * Wires "paste to add a product image" onto one DOM node via React's
 * `onPaste` prop — never a `document`/`window` listener, so it needs no
 * manual add/remove lifecycle and is automatically scoped to whichever
 * element it's attached to (`product-images-manager.tsx`,
 * `pending-product-images.tsx`). Because it's only ever attached there and
 * never globally, pasting into the product name/SKU/description/any other
 * field is completely unaffected — this handler's paste event never fires
 * for those (React's synthetic paste event only reaches handlers on the
 * focused element's ancestors, and the image manager isn't one).
 *
 * `preventDefault` is called only once a real image `File` was actually
 * found — a paste with no image is a no-op here (the caller's `onFiles`
 * still gets called, with an empty array, so it can show a "clipboard has
 * no usable image" message if it wants one; it never happens silently).
 */
export function useImagePaste(onFiles: (files: File[]) => void) {
  return useCallback(
    (event: ClipboardEvent) => {
      const files = getClipboardImageFiles(event.clipboardData)
      if (files.length > 0) event.preventDefault()
      onFiles(files)
    },
    [onFiles],
  )
}
