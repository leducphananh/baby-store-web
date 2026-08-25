---
name: reusable-components
description: Rules for extracting and designing shared components (dialogs, forms, tables) in src/components — API design, props over configuration flags, promotion criteria. Apply when building or extracting a shared component.
---

# Reusable component design

## Apply when
Building a component intended for reuse across features, or deciding whether to extract one
from feature-specific code into `src/components/`.

## Rules

1. **Promote to `src/components/` only after real duplication exists** (used or clearly
   about to be used by 2+ features) — see `clean-code` on justified abstraction. A one-off
   stays in the feature's `components/`.
2. **Design the API around composition, not a growing prop-flag list.** Prefer
   children/slots over a component that grows `showHeader`, `showFooter`, `variant`,
   `mode` props indefinitely:
   ```tsx
   // Prefer
   <ConfirmDialog title="Xóa sản phẩm?" onConfirm={handleDelete}>
     Hành động này không thể hoàn tác.
   </ConfirmDialog>

   // Over: <ConfirmDialog type="delete" entity="product" ... />
   ```
3. **Core reusable set this project will need** — build these once, reuse everywhere:
   - `DataTable` (see `table-data-grid`)
   - `ConfirmDialog` / `AlertDialog` wrapper for destructive actions
   - `FormField` wrapper (label + input + error message, wired for RHF via `Controller`)
   - `PageHeader` (title + breadcrumb + primary action slot)
   - `EmptyState`, `ErrorState`, loading skeleton components
   - `StatusBadge` (order/payment/stock status, variant-driven via `cva`)
   - `MoneyDisplay` (renders a VND integer with consistent formatting)
   - `DatePicker`/date display formatted per `vietnamese-business-ui`
4. **A shared component owns its own styling** (Tailwind + shadcn), and exposes a
   `className` passthrough via `cn()` for the rare per-usage override — it doesn't require
   callers to restyle it externally to look right.
5. **Shared components don't know about specific features.** `DataTable` takes generic
   `columns`/`data`, it doesn't know about `Product` or `Order`. Feature-specific column
   definitions live in the feature, not inside the shared table.
6. **Accessibility and loading/error/empty states are built into the shared component once**
   (see `accessibility`, `error-handling`) so every feature using it gets them for free,
   instead of every feature re-implementing its own empty state.
7. **Document non-obvious props with a one-line comment or JSDoc**, especially for
   callback-shaped props (`onConfirm`, `onRowClick`) where the signature isn't self-evident.
8. **Breaking changes to a shared component require updating all call sites in the same
   change** — don't leave some features on an old prop shape.

## Anti-patterns to reject in review

- A `<Table>` component with a `productSpecificFormatting` prop — that logic belongs in the
  feature's column definitions, not baked into the shared table.
- A shared component that only handles the happy path and pushes loading/error/empty
  handling back onto every caller.
- Copy-pasting a component into a second feature folder instead of promoting the shared one.
