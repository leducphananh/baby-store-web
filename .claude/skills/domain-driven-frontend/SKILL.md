---
name: domain-driven-frontend
description: How to model this store's specific business domain in code — products/batches/inventory/orders relationships, VND money handling, FEFO, expiry/low-stock rules. Apply when modeling a new entity or business rule.
---

# Domain-driven frontend modeling

## Apply when
Introducing a new domain entity/type, or implementing a business rule that spans more than
one entity (stock allocation, pricing, expiry alerts).

## Core domain model (mental map)

```
Category ──< Product >── ProductImage
                │
                ├── ProductUnit (packaging/unit of measure)
                ├── Origin
                │
Supplier ──< ImportReceipt >── VatInvoice
                │
                └──< ImportReceiptLine >── creates ── ProductBatch
                                                          │
ProductBatch ── has ── manufactureDate, expiryDate, quantity
                │
                └──< InventoryTransaction >── adjusts ── Inventory (per product, per batch)

Customer ──< Order >──< OrderLine (references Product + allocated Batch)
                │
                └──< Payment
```

## Rules

1. **Money is always an integer VND value in domain types** (`unitPriceVnd: number`,
   integer, never a `Money` class with floats). Format for display with a single shared
   `formatVnd()` utility (thousands separator, `₫` or "đ" suffix per `vietnamese-business-ui`)
   — never re-implement formatting per component.
2. **A `ProductBatch` is the unit that carries manufacture/expiry dates and links to a
   specific `ImportReceiptLine`.** Inventory is tracked per batch, not just per product —
   this is required for FEFO and expiry alerts to work at all. Don't model inventory as a
   single quantity-per-product with no batch breakdown.
3. **FEFO (First-Expired-First-Out) is the default allocation rule** whenever stock is
   deducted for an order: allocate from the batch with the soonest `expiryDate` first among
   batches with available quantity. Implement this as one named function
   (`allocateStockFefo`), reused everywhere stock is deducted — don't let each call site
   pick batches differently.
4. **Inventory changes are always represented as an `InventoryTransaction`** (type: receipt,
   sale, adjustment, return, expired-writeoff), forming an append-only ledger. "Current
   stock" is a derived/aggregated view over this ledger, not an independently-mutated field.
5. **Expiring-product and low-stock alerts are domain queries, not UI-layer guesses.**
   "Expiring soon" threshold (e.g. within 30 days) and "low stock" threshold (per product or
   global default) are explicit, named, configurable values living in one place
   (`features/alerts` or on the product record), not magic numbers scattered across
   components.
6. **Import receipts and VAT/red invoices are distinct entities that reference each other**
   — a receipt can exist before its invoice is attached (goods received, paperwork pending)
   — don't collapse them into one record if the business process allows them to arrive
   separately.
7. **An `Order` references specific `ProductBatch` allocations for its line items** (not
   just a product + quantity) once fulfilled, so profit reports can compute actual cost
   (from the batch's import cost) vs. sale price accurately.
8. **Profit reports need cost basis from the batch/import receipt, not a guessed margin.**
   Cost comes from what was actually paid per batch (import receipt line), matched to what
   was actually sold from that batch.
9. **Model status fields as discriminated unions** (order status, payment status, import
   receipt status) per `typescript-strict` — the domain has real, distinct states, not just
   independent booleans.
10. **When a new business rule doesn't fit the existing model**, check with the actual store
    process before inventing a structure — don't guess at retail/inventory semantics that
    conflict with how the store really operates (ask if genuinely ambiguous).

## Order lifecycle, atomicity, and financial-record integrity

11. **Order status drives editability, using real database status values** — never invent a
    frontend-only status. Typical pattern: `draft` (editable) → `completed` (restricted,
    most fields locked) → `cancelled` (read-only/restricted). Model this as a discriminated
    union per `typescript-strict`, and gate which UI actions are available by the actual
    status, not by guessing from other fields.
12. **Order line items snapshot historical price at time of sale.** An order's line-item
    price is stored on the order/order-item row and displayed as-is — never recomputed or
    re-displayed from the product's *current* selling price. A price change on a product
    must never alter the appearance of a historical order.
13. **Order creation is a critical, multi-step transaction** (create order → create order
    items → allocate batches via FEFO → deduct inventory → record inventory transactions →
    optionally record payment). This must not be implemented as a fragile client-side chain
    of sequential `await supabase.from(...).insert()` calls that can leave partial state if
    one step fails. Prefer a single Supabase RPC / Postgres function that performs the whole
    operation atomically (see `supabase-database`). **If the current schema/backend cannot
    guarantee atomicity for this operation, stop and report the limitation instead of
    shipping the fragile client-side chain** — data integrity outranks finishing the screen
    (see CLAUDE.md §11).
14. **Duplicate submission must be prevented on every critical mutation** (create order,
    create import receipt, record payment, inventory adjustment): disable the trigger while
    the mutation is pending (`isPending`, see `error-handling`), and treat this as a UX
    safeguard only — true protection against duplicates (e.g. double-click racing a slow
    network) requires a backend-side guarantee (unique constraint, idempotency key, or the
    same atomic RPC from #13), not frontend disabling alone.
15. **Cancelling an order that already deducted inventory must restore stock through
    traceable reversal transactions** (new inventory transactions of type e.g. `return`/
    `adjustment` referencing the cancelled order), never by directly incrementing
    `product.stockQuantity` or a batch's remaining quantity with no accompanying record.
    Cancellation preserves audit history — it doesn't rewrite what happened.
16. **Payments are historical financial events and are not silently overwritten.** A
    correction to a recorded payment is an explicit new correction/reversal record (if the
    schema supports it) or is blocked with a clear message — never a plain `UPDATE` that
    erases what was originally recorded. Total/paid/remaining are computed from these
    records using integer VND arithmetic, never floats.
17. **Purchasing history is immutable once finalized.** A finalized import receipt (goods
    received, invoice attached) has restricted editing — don't silently allow arbitrary
    edits to a completed receipt's quantities/costs after batches have been created from it.
    Import/purchase history is never silently deleted.
18. **Profit is never computed as `current selling price − current purchase price`.**
    Historical profit must come from the actual order-item sale price and the actual batch
    purchase cost (COGS) at the time of that transaction. If the current data model can't
    support accurate profit calculation for a given view, don't display a misleading number
    — report the limitation instead (see CLAUDE.md §11 on correctness over completeness).
19. **Expiration status classification (`expired` / `expiring soon` / `normal`) and its
    day-threshold are centralized in one shared helper/config**, never hardcoded per
    component. Show days remaining where useful, using the shared date utilities from
    `vietnamese-business-ui`.
20. **Low-stock thresholds are per-product where the schema supports it**, not one global
    hardcoded number — fall back to a global default only for products without an explicit
    threshold set.

## Anti-patterns to reject in review

- Inventory tracked as a single mutable `product.stockQuantity` with no batch/expiry
  breakdown — breaks FEFO and expiry alerts.
- Stock deducted for an order without going through the shared FEFO allocation function.
- Profit computed from a hardcoded margin percentage instead of actual batch cost.
- Money represented as a float anywhere in a domain type.
- An order detail view showing a line item's price recomputed from the product's current
  price instead of the price stored on the order.
- Order creation implemented as sequential client-side inserts (order, then items, then
  stock deduction) with no RPC/transaction and no plan for partial-failure cleanup.
- A cancel-order button that increments stock directly instead of writing a reversal
  inventory transaction.
- A submit button for "create order" / "record payment" that stays enabled and re-clickable
  while the mutation is still in flight.
