---
name: tailwind-shadcn
description: Styling conventions using Tailwind CSS + shadcn/ui — utility-first, no custom CSS unless necessary, consistent design tokens, composing shadcn primitives. Apply whenever writing UI markup or styles.
---

# Tailwind CSS + shadcn/ui conventions

## Apply when
Writing or reviewing any component markup/styling.

## Rules

1. **Build UI from shadcn/ui primitives first.** Before hand-rolling a dialog, dropdown,
   table, date picker, or form field, check if shadcn already has it — install/generate it
   via the shadcn CLI rather than writing a custom equivalent.
2. **Utility-first Tailwind classes**, no separate CSS files/CSS-in-JS for component
   styling. Use `App.css`/`index.css` only for true globals (font imports, CSS resets,
   Tailwind directives) — new components don't get their own `.css` file.
3. **Use `cn()` (clsx + tailwind-merge) for conditional classes**, not string concatenation:
   ```tsx
   <button className={cn('btn-base', isActive && 'bg-primary text-white', className)} />
   ```
4. **Design tokens over magic values.** Use the Tailwind theme's spacing/color scale
   (`text-muted-foreground`, `bg-destructive`) and shadcn's CSS variables instead of
   arbitrary values (`text-[#7a7a7a]`, `mt-[13px]`) unless there's a real one-off reason.
5. **Component variants use `class-variance-authority` (cva)** for shadcn-style components
   with multiple visual states (e.g. a `StatusBadge` for order/payment status), not
   ad-hoc ternary class strings scattered through JSX.
6. **Keep className lists readable**: order roughly layout → spacing → typography → color →
   state. Extract to a `cva` variant or a small helper when a className string gets long and
   repeated across files.
7. **Don't override shadcn component internals with `!important` or deep selector
   overrides.** Use the component's documented props/variants, or compose a new variant, or
   wrap it — don't fight the primitive.
8. **Icons** come from the icon set already used by shadcn (lucide-react) — don't mix in a
   second icon library.
9. **Dark mode:** only implement if the project actually needs it; don't add dark-mode
   variants speculatively for an internal admin tool unless requested.
10. **Forms and tables reuse the same layout primitives** (see `reusable-components`,
    `table-data-grid`) — don't restyle spacing/borders per-page; that's a sign a shared
    component or class is missing.

## Anti-patterns to reject in review

- A custom `<Modal>` built from scratch when shadcn's `Dialog` would do.
- Inline `style={{ ... }}` for anything Tailwind can express.
- A new `.module.css` file for a component's layout.
- Copy-pasted status-color ternaries (`status === 'paid' ? 'text-green-600' : ...`) repeated
  in multiple files instead of one shared `StatusBadge`/variant map.
