---
name: typescript-strict
description: Strict TypeScript rules for this project — no any, explicit domain models, discriminated unions, safe casting policy. Apply whenever writing types or reviewing type safety.
---

# TypeScript strictness rules

## Apply when
Writing any type, interface, function signature, or reviewing type safety of a change.

## Rules

1. **`strict: true` (already on via `tsconfig.app.json`) is non-negotiable.** Never weaken
   it (`strictNullChecks: false`, etc.) to make an error go away.
2. **No `any`.** Use `unknown` and narrow it, or define the real type. If a third-party
   value is genuinely untyped, write a small local type/schema (Zod) for it at the boundary,
   don't let `any` leak inward.
3. **Every domain entity has an explicit type** in the owning feature's `types/`
   (`Product`, `Order`, `StockBatch`, `ImportReceipt`, `Payment`) — don't pass around
   `Record<string, unknown>` or inline object-literal types for core business entities.
4. **Discriminated unions for real variants**, instead of multiple optional booleans/fields
   guessing at state:
   ```ts
   // Good
   type OrderStatus =
     | { status: 'draft' }
     | { status: 'confirmed'; confirmedAt: string }
     | { status: 'cancelled'; cancelledAt: string; reason: string }

   // Bad
   type Order = { isDraft: boolean; isConfirmed: boolean; confirmedAt?: string; ... }
   ```
   Use this for order status, payment status, async UI state (`idle | loading | success |
   error`), and any place where fields only make sense together.
5. **No unsafe type casting (`as X`) to silence the compiler.** A cast is acceptable only
   when you have external knowledge TypeScript can't infer (e.g. `document.getElementById`
   narrowing) — and should have a one-line comment explaining why it's safe. A cast used to
   paper over an actual type mismatch is a bug, not a shortcut.
6. **`as const` and type guards are the preferred narrowing tools**, not casts:
   ```ts
   function isConfirmedOrder(o: Order): o is Extract<Order, { status: 'confirmed' }> {
     return o.status === 'confirmed'
   }
   ```
7. **Function signatures are explicit** on exported functions (params + return type) —
   don't rely on inference for public API surfaces (service functions, hooks, utils),
   even though inference is fine for short local callbacks.
8. **Prefer `type` for unions/domain shapes, `interface` for extendable object shapes**
   (component props) — pick one per case, don't mix arbitrarily within the same file.
9. **Null vs. undefined:** be deliberate — DB-nullable fields come through as `| null`
   (matching Postgres/Supabase), optional/absent local state uses `undefined`. Don't mix
   both for the same concept in the same type.
10. **No `@ts-ignore`/`@ts-expect-error` to bypass a real error** without a linked reason;
    if used, it must be `@ts-expect-error` (fails loudly if the underlying issue is fixed)
    with a comment.

## Anti-patterns to reject in review

- `const data: any = await response.json()`
- `const order = raw as Order` where `raw`'s shape hasn't actually been validated.
- `{ isPaid: boolean; isPartiallyPaid: boolean; isPending: boolean }` instead of a
  `PaymentStatus` union.
- Exported service function with no return type annotation, inferring a wide/leaky type.
