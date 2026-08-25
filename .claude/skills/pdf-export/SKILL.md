---
name: pdf-export
description: Conventions for generating and exporting PDFs (orders, invoices) from this app — data source, formatting, Vietnamese text/currency correctness, performance. Apply when building any PDF export feature.
---

# PDF export conventions

## Apply when
Implementing order PDF export or any other document export (e.g. import receipt summary).

## Rules

1. **Generate the PDF from the same domain data/formatting utilities the UI uses** — the
   same `formatVnd()`, date formatter, and order/line-item types as the on-screen view.
   Never hand-duplicate formatting logic just for the PDF path (see `clean-code`).
2. **Pick one PDF approach and use it consistently.** For a React app, prefer a
   React-component-to-PDF renderer (e.g. `@react-pdf/renderer`) so the document is described
   declaratively and can reuse domain formatting utilities, over a raw manual
   canvas/string-based PDF library, unless there's a strong reason otherwise. Don't add a
   second PDF library later for a different export.
3. **Vietnamese text must render correctly** — verify the chosen PDF library/font supports
   Vietnamese diacritics (many default PDF fonts don't); embed a font that does (e.g. a
   Noto/Roboto variant with Vietnamese glyph coverage) rather than discovering broken
   diacritics in production output.
4. **Money on the PDF is formatted exactly like the UI**: thousands separators, VND unit
   clearly labeled, computed from the same integer values — no separate rounding logic for
   print output.
5. **The export is generated from a service/util function** (`features/orders/utils/generate-order-pdf.ts`
   or similar), triggered by a component, not built inline inside a click handler.
6. **Show explicit loading/progress state while generating** (PDF generation can be slow for
   larger documents) and a clear error state if generation fails — don't leave the user
   staring at a button that appears to do nothing.
7. **The PDF includes all information needed to be a standalone business document**: store
   info, order/customer details, line items with quantity/unit price/subtotal, total in VND,
   date in Vietnamese format, and any required legal/business text — don't ship a partial
   document missing fields the paper equivalent would have.
8. **Large exports (e.g. many line items) are still performant** — generate off the main
   thread if the library supports it, or show a spinner rather than freezing the UI during
   generation.
9. **File naming for downloaded PDFs is predictable and useful**: e.g.
   `don-hang-{orderNumber}.pdf`, not a generic `export.pdf` or a raw UUID.

## Anti-patterns to reject in review

- PDF generation logic duplicating the VND/date formatting instead of importing the shared
  utilities.
- A PDF library chosen and wired up without first checking Vietnamese diacritics actually
  render.
- PDF generation triggered directly inside a JSX `onClick` inline handler with no loading/
  error handling.
