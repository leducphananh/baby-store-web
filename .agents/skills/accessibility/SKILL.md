---
name: accessibility
description: Accessibility baseline for this admin app — keyboard interaction, semantic HTML, labeled forms/tables, focus management for dialogs. Apply whenever building interactive UI.
---

# Accessibility rules

## Apply when
Building any interactive UI: forms, tables, dialogs, dropdowns, buttons, alerts.

## Rules

1. **Every interactive element is keyboard-operable.** Buttons are real `<button>`
   elements (not `<div onClick>`), links are `<a>`, custom widgets (built on shadcn/Radix
   primitives) come with keyboard support already — don't strip it by wrapping in a plain
   `div`.
2. **Every form input has a real, associated `<label>`** (via shadcn's `Label` + `htmlFor`/
   `id`, or wrapping), not just a placeholder as the only identifier. Placeholder text
   supplements a label, it never replaces one.
3. **Icon-only buttons have an accessible name** (`aria-label`, e.g. "Xóa sản phẩm" for a
   trash icon delete button) — a bare icon with no text is invisible to screen readers.
4. **Dialogs/modals (shadcn `Dialog`, `AlertDialog`) manage focus correctly**: focus moves
   into the dialog on open, is trapped while open, and returns to the triggering element on
   close — this comes for free from Radix primitives, don't override it with custom
   `onOpenChange` logic that breaks focus return.
5. **Destructive actions use `AlertDialog`, not a bare `confirm()`**, with clear Vietnamese
   copy stating exactly what will be deleted/cancelled and that it can't be undone.
6. **Tables use semantic markup** (`<table>`/`<thead>`/`<tbody>`/`<th scope="col">`) even
   when styled with a data-grid component — screen readers and keyboard nav depend on real
   table semantics, not `<div>` grids pretending to be tables.
7. **Color is never the only signal.** Status badges (paid/unpaid, in-stock/low-stock/
   expired) pair color with text or an icon, not color alone.
8. **Sufficient contrast** for body text and status colors against their background — don't
   rely on light gray-on-white for anything the user must read to act (e.g. an alert about
   expiring stock).
9. **Loading and error states are announced**, not just visual — use `aria-live="polite"`
   regions for toasts/inline async status messages so screen reader users get the update.
10. **Focus order follows visual/logical order.** Don't use `tabIndex` values above 0 to
    force an order; fix the DOM order instead.

## Anti-patterns to reject in review

- `<div className="button" onClick={...}>Xóa</div>` instead of a real `<button>`.
- An icon-only action button with no `aria-label` and no visible text.
- `window.confirm('Xóa?')` for deleting a product/order/batch instead of an `AlertDialog`.
- A custom-built dropdown/menu that doesn't respond to arrow keys/Escape, when shadcn's
  `DropdownMenu` already handles this.
