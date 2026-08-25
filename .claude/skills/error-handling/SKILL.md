---
name: error-handling
description: Error-handling conventions across queries, mutations, forms, and unexpected UI crashes. Apply whenever a call can fail — network, validation, or rendering.
---

# Error handling conventions

## Apply when
Writing anything that can fail: a Supabase call, a mutation, a form submit, file upload,
PDF generation, or a component that could throw during render.

## Rules

1. **Never swallow an error silently.** No empty `catch {}`, no `catch (e) { console.log(e)
   }` with no user-facing consequence. Every failure either surfaces to the user (toast,
   inline error) or is deliberately, visibly handled with a comment explaining why it's safe
   to ignore.
2. **Query errors → error UI, not a blank/broken screen.** Every `useQuery` consumer checks
   `isError` and renders a real error state (message + retry action), per `react-query`.
3. **Mutation errors → toast + (if field-attributable) form field error.** A failed
   "create product" shows why it failed (e.g. "SKU đã tồn tại") mapped to the `sku` field
   when the server signals that, and a generic toast otherwise — never a silent no-op button.
4. **Distinguish expected domain errors from unexpected failures.** A "insufficient stock to
   fulfill this order" is an expected business-rule rejection — handle it with a clear
   message. A network timeout or unexpected 500 is unexpected — show a generic retryable
   error, and don't try to interpret its message as if it were a domain error.
5. **Service functions (`api/`) throw; they don't return `null`/`undefined` on failure.**
   Let React Query's error channel handle it — don't make callers guess whether `null` means
   "not found" or "request failed."
6. **"Not found" is not the same as "error."** A product/order that legitimately doesn't
   exist renders a not-found empty state, distinct from a network/server error state.
7. **A top-level React error boundary** catches unexpected render-time crashes and shows a
   recoverable "something went wrong" screen instead of a blank white page — this is a
   backstop, not a substitute for handling expected errors locally.
8. **Async actions disable their trigger while in flight** (`isPending`/`isSubmitting`) so
   users can't double-submit an order/payment while a previous request is still resolving.
   For critical mutations specifically (create order, create import receipt, record
   payment, inventory adjustment), treat this as the *first* line of defense only —
   frontend disabling can't stop a genuinely racing double-request (e.g. a flaky network
   retry). The real guarantee is backend-side: a unique constraint, an idempotency key, or
   the operation being wrapped in the same atomic RPC that makes it a single transaction
   (see `supabase-database`, `domain-driven-frontend`). Don't consider a critical mutation
   "duplicate-safe" just because the button was disabled.
9. **Log unexpected errors with enough context to debug** (which mutation, which entity id)
   without logging sensitive payloads (see `frontend-security`).
10. **User-facing error messages are in Vietnamese and specific enough to act on** — "Không
    thể lưu sản phẩm. Vui lòng thử lại." is acceptable for unexpected errors; expected
    validation/business errors should name the actual problem.

## Anti-patterns to reject in review

- `try { await createProduct(input) } catch {}` with no user feedback.
- A mutation's error handler showing the raw error object/stack trace to the user.
- A "not found" state rendered identically to a network error state, confusing the user
  about whether retrying will help.
- A submit button still clickable (and re-triggerable) while the mutation is pending.
