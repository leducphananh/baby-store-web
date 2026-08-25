---
name: responsive-design
description: Responsive layout rules for this desktop-first admin app — tablet-usable, no phone-first redesign needed. Apply when building page layouts, tables, and forms.
---

# Responsive design rules

## Apply when
Building any page layout, table, or form — deciding how it should behave across screen
sizes.

## Rules

1. **Desktop-first, not mobile-first.** This is an internal back-office tool primarily used
   on desktop/laptop screens at the store. Design the primary layout for a standard desktop
   viewport (≥1280px), then adapt down to tablet (~768–1024px) — don't burn effort on a
   phone-optimized redesign unless explicitly requested.
2. **Tablet must remain usable**, not pixel-perfect: sidebar can collapse to icons or a
   drawer, multi-column forms can stack to fewer columns, dense tables can enable horizontal
   scroll within their own container (never the page) — but every action must still be
   reachable and legible.
3. **Tables scroll horizontally within their own wrapper** (`overflow-x-auto` on the table
   container) rather than shrinking columns to illegibility or breaking the page layout.
4. **Use Tailwind's responsive prefixes (`md:`, `lg:`) sparingly and intentionally** — a
   layout that needs breakpoint overrides on every element is a sign the base layout should
   be reworked (e.g. a grid with sensible `minmax()` columns) rather than patched per
   breakpoint.
5. **Fixed-width layouts avoided** for main content — use `max-w-*` + fluid width so the
   admin shell adapts between typical desktop and tablet widths without a hard cutoff.
6. **Dashboard widgets/cards reflow** (grid columns reduce, e.g. 4 → 2 → 1) rather than
   overflowing or shrinking below a readable size.
7. **Touch targets on tablet** (buttons, row actions) stay at a reasonable minimum size
   (~40px) since staff may use a touchscreen device at a counter.
8. **Don't hide critical actions on smaller viewports** — collapse them into a menu
   (e.g. shadcn `DropdownMenu` for row actions) rather than removing them.
9. **Test the two viewports that matter**: a standard desktop width and a tablet width (both
   orientations if the store plans to use tablets) — phone-width correctness is not a
   priority for this app.

## Anti-patterns to reject in review

- A form that becomes unusable (overlapping/clipped fields) at tablet width because it
  assumed a fixed desktop width.
- A data table that breaks the page's horizontal layout instead of scrolling within its own
  container.
- Row actions that disappear entirely below a breakpoint with no alternative access.
