# Storefront Phase S0 — Requirements & Architecture

**Status:** Audit + business decisions + architecture design. No storefront code, no
schema changes, no RPC changes, no installs. This document is the contract that
Phases S1–S12 implement against.

**Date:** 2026-09-09
**Backend audited at commit:** `8898251` (working tree clean)
**Audited from:** `supabase/migrations/*` (verbatim export of the live schema per
`supabase/migrations/README.md`), `src/types/database.ts` (generated), and every
`src/features/*` service function that touches orders / products / customers /
inventory / images.

---

## 0. Executive summary

| Question | Answer |
| --- | --- |
| Same Supabase backend? | **Yes.** No critical reason found to split. One project, two apps. |
| Repo layout | **Separate repo `baby-wale-storefront`.** No monorepo conversion of admin. |
| Framework | Next.js (latest stable), **App Router only**, RSC-by-default. |
| Can the storefront reuse `create_order()`? | **No.** `create_order()` immediately calls `complete_order()` — it posts inventory and marks the order `completed` in the same transaction. A web order must NOT deduct stock or become revenue at placement. A **new `create_storefront_order()` RPC** is required (built in S6). |
| What can `anon` read today? | **Nothing.** Phase 9.1 revoked all table/view grants from `anon` and every RLS policy is `TO authenticated`. The storefront needs a **new, explicit public data contract** (narrow security-invoker views + `anon` policies scoped to sellable rows). Never grant `anon` on base tables. |
| Customer login in MVP? | **No.** `profiles.role` is self-editable with zero authorization effect (documented Phase 9 debt), and staff + customers would both be Supabase `authenticated`. Enabling customer Auth now risks handing customers staff-level RLS. **Guest checkout only.** Customer accounts = Phase S11, after RBAC hardening. |
| Stock reservation on checkout? | **No (Option A).** Validate sellable stock at checkout, do not reserve. Admin `complete_order()` remains the real stock gate. Residual oversell risk is documented, not "solved". |
| Price trust | Browser submits `product_id` + `quantity` only. The RPC reads `products.selling_price` server-side and computes every money figure. |
| New order status (`pending_confirmation`)? | **Recommended: no.** Reuse existing `draft` + a new `orders.source` column. Adding a status ripples into reports, filters, RPC guards, and tests. Revisit only if the stakeholder requires distinct wording that a source badge can't cover. |
| Deployment | **Vercel** for MVP (SEO, TLS, image optimization, uptime). Ubuntu home server viable later via Docker + Cloudflare Tunnel. |

### The five backend gaps that block a storefront (all deferred to later S-phases)

1. **No non-completing order-creation path.** `create_order()` auto-completes. → new RPC (S6).
2. **No public read access.** `anon` has nothing. → public views + `anon` policies (S2).
3. **No product / category slugs.** URLs would be UUIDs. → additive columns + backfill (S2).
4. **No order provenance / snapshot / shipping / tracking columns** on `orders`
   (`source`, `customer_*_snapshot`, recipient + address + `shipping_fee`,
   `tracking_token`, idempotency key). → additive migration (S6).
5. **No customer identity model** separate from staff `profiles`. → Phase S11, gated on
   RBAC hardening.

---

# PART A — BACKEND AUDIT (current state, do not change in S0)

## A1. Schema — tables

All money columns are `numeric(15,0)` — **integer VND, never float**. Business timezone
is `Asia/Ho_Chi_Minh`; timestamps are stored UTC (`timestamptz`) and business-date logic
uses `(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`.

### `categories`
`id uuid pk`, `name text NOT NULL`, `description text`, `created_at`, `updated_at`.
**No `slug`. No ordering column. No image.**

### `products`
`id uuid pk`, `name NOT NULL`, `sku text NOT NULL`, `barcode`, `category_id → categories`,
`brand`, `unit text NOT NULL`, `description`, `default_purchase_price numeric(15,0) NOT NULL default 0`,
`selling_price numeric(15,0) NOT NULL default 0`, `tiktok_price numeric(15,0) NULL`,
`shopee_price numeric(15,0) NULL`, `minimum_stock int NOT NULL default 0`,
`status text` CHECK `('active','archived')`, `origin_country`, `manufacturer`,
`distributor`, `source_description`, `created_at`, `updated_at`.
- **No `slug`.** No storefront visibility flag beyond `status`. No SEO fields
  (meta title/description, OG image). No "featured/new/bestseller" flag.
- `default_purchase_price`, `tiktok_price`, `shopee_price`, `source_description` are
  **internal** — must never reach the storefront.
- Non-negativity CHECKs on `selling_price`, `default_purchase_price`, `minimum_stock`
  (Phase 9.7).

### `product_images`
`id`, `product_id → products`, `storage_path text NOT NULL`, `is_primary boolean`,
`created_at`. Files live in the **private** `product-images` Storage bucket. Admin renders
them via short-lived signed URLs (`createSignedUrls`, TTL 3600s) in
`src/features/products/api/get-product-images.ts`.

### `suppliers`, `import_receipts`, `import_receipt_items`, `purchase_invoices`, `purchase_invoice_files`
Purchasing side. **100% internal — storefront never touches any of these.** They carry
supplier identity, purchase costs, VAT/red-invoice data, invoice scan files (private
`purchase-invoices` bucket).

### `product_batches` — inventory source of truth
`id`, `product_id → products`, `import_item_id → import_receipt_items (UNIQUE)`,
`lot_number`, `manufacture_date date`, `expiration_date date`, `initial_quantity int`,
`remaining_quantity int` CHECK `>= 0`, `purchase_price numeric(15,0)` CHECK `>= 0`,
`created_at`.
- **`remaining_quantity` is the only stock source.** There is no `products.stock`
  column. "Stock on hand" for a product = `SUM(remaining_quantity)` over its batches.
- `purchase_price` per batch is **internal COGS input** — never exposed.
- Only `confirm_import_receipt()` creates batches. A client `INSERT` on `product_batches`
  is blocked (policy dropped in Phase 9.7).

### `inventory_transactions` — append-only ledger
`type` CHECK `('IMPORT','SALE','ORDER_CANCEL','MANUAL_ADJUSTMENT','RETURN','DAMAGE','EXPIRED','LOST','STOCK_COUNT')`,
`quantity` (signed), `reference_type`, `reference_id`, `batch_id`, `product_id`, `note`,
`created_by`, `created_at`. **Internal.** No client write path exists.

### `customers`
`id`, `name text NOT NULL`, `phone text NULL`, `email text NULL`, `address text NULL`,
`notes text NULL`, `status text NOT NULL default` (active/…), `created_at`, `updated_at`.
- **`phone` is nullable and has no uniqueness constraint or normalization.**
- `address` is a single free-text field. No province/district/ward structure.
- No `auth_user_id` / link to `auth.users`. No customer-facing credentials.
- `notes` is a **staff-facing internal note** — not a customer-entered field.

### `orders`
`id`, `order_number text NOT NULL`, `customer_id → customers NULL`,
`order_date timestamptz NOT NULL default now()`, `status text default 'draft'`
CHECK `('draft','confirmed','completed','cancelled')`,
`payment_status text default 'unpaid'` CHECK `('unpaid','partial','paid')`,
`subtotal numeric(15,0)` CHECK `>=0`, `discount numeric(15,0)` CHECK `>=0`,
`total numeric(15,0)` CHECK `>=0`, `note text NULL`, `created_by → profiles NULL`,
`created_at`, `updated_at`, `completed_at`, `cancelled_at`.
- **Missing for storefront:** `source` / `sales_channel`, customer snapshot
  (`customer_name_snapshot`, `phone_snapshot`, `shipping_address_snapshot`), delivery
  recipient, structured shipping address, `shipping_fee`, `tracking_token`,
  idempotency / `checkout_request_id`.
- `note` is a **single** field. There is no separate customer-note / internal-note split.
- `order_number` format is **`ORD-001`** — `ORD-` + zero-padded 3-digit sequence,
  generated inside `create_order()` under `pg_advisory_xact_lock`. **Sequential and
  trivially enumerable** → unsafe as a guest lookup key on its own.
- `discount` exists but is always written as `0` by every current path. No coupon engine.

### `order_items`
`id`, `order_id → orders`, `product_id → products`, `quantity int`, `unit_price numeric(15,0)`,
`discount numeric(15,0) default 0`, `line_total numeric(15,0)`. Non-negativity CHECKs.
Historical price snapshot — never rewritten (client UPDATE policy dropped Phase 9.1).

### `order_item_batches` — historical COGS snapshot
`id`, `order_item_id`, `batch_id`, `quantity`, `unit_cost numeric(15,0)` CHECK `>=0`.
Written only by `complete_order()` (FEFO). **Internal.** Storefront never sends or reads this.

### `order_payments`
`id`, `order_id`, `amount numeric(15,0)`, `payment_method text`
(`'cash' | 'bank_transfer' | 'other'`, enforced in `record_order_payment()`), `note`,
`paid_at`, `created_by`, `created_at`. Client access is **SELECT-only** (Phase 9.1);
creation goes through `record_order_payment()`.

### `profiles` — STAFF ONLY
`id (= auth.users.id)`, `full_name`, `role text NULL`, `created_at`.
- **`role` is self-editable and has ZERO authorization effect anywhere** (no RPC, no RLS
  policy, no route guard reads it — verified in the Phase 9.1 migration comment). It is a
  display label. **This is the single biggest blocker to customer authentication.**
- Rows are provisioned out-of-band by the developer. No signup flow, no
  `auth.users` → `profiles` trigger.

### `alert_condition_states`, `alert_read_states`
Operational alert lifecycle (low-stock, expiry). Internal.

## A2. Schema — views

| View | `security_invoker` | Granted to | Storefront relevance |
| --- | --- | --- | --- |
| `product_inventory_overview` | yes | `authenticated` only | Per-product `stock_quantity`, `stock_status`, `expiry_status`, `nearest_expiration`. **`stock_quantity` = `SUM(remaining_quantity)` over ALL batches — it does NOT exclude expired stock.** `stock_status` uses `minimum_stock` (internal threshold). Not directly reusable publicly. |
| `customer_order_summary` | yes (added 20260830103356) | `authenticated` only | Internal. |
| `reportable_orders` | yes | `authenticated` only | `status = 'completed'` only, `report_date = completed_at`. Confirms: **only completed orders are financial reality.** |

## A3. Critical RPCs (read-only audit — DO NOT MODIFY in S0)

| RPC | Security | Callable by | State transition | Mutates | Locking |
| --- | --- | --- | --- | --- | --- |
| `create_order(p_customer_id uuid, p_note text, p_items jsonb)` → jsonb | DEFINER, `search_path=public,pg_temp` | `authenticated` only | inserts `orders` as `draft` **then calls `complete_order()` in the same txn → ends `completed`** | `orders`, `order_items`, then everything `complete_order` touches | `pg_advisory_xact_lock('orders_order_number')` for the number; row locks via `complete_order` |
| `complete_order(p_order_id uuid)` → void | DEFINER | `authenticated` only | `draft`\|`confirmed` → `completed` (`completed_at` set) | `product_batches.remaining_quantity` (−), `order_item_batches` (COGS snapshot at `batch.purchase_price`), `inventory_transactions` (`SALE`, negative), `orders.subtotal`/`total` **recomputed from line items** | `SELECT ... FOR UPDATE` on order; `FOR UPDATE` on batches, `ORDER BY expiration_date ASC NULLS LAST, created_at ASC, id ASC` (FEFO + deterministic). **Only allocates batches where `expiration_date IS NULL OR >= VN-today`.** Raises + full rollback on insufficient non-expired stock. |
| `cancel_order(p_order_id uuid)` → void | DEFINER | `authenticated` only | **`completed` → `cancelled`** only (`cancelled_at` set) | restores `product_batches.remaining_quantity` (+), writes `ORDER_CANCEL` ledger rows. Does **not** zero `total`. | `FOR UPDATE` on order + batches, deterministic order |
| `cancel_draft_order` (client `UPDATE`, not an RPC — `src/features/orders/api/cancel-draft-order.ts`) | RLS policy `orders_upd` | `authenticated` | `draft`\|`confirmed` → `cancelled` | `orders.status` only (no inventory to reverse) | single-row guarded `UPDATE ... WHERE status IN ('draft','confirmed')` |
| `update_order_draft(p_order_id, p_customer_id, p_note, p_items jsonb)` → void | DEFINER | `authenticated` only | requires `draft`\|`confirmed`; DELETE+INSERT of `order_items` | `order_items`, `orders.customer_id`/`note` | `SELECT ... FOR UPDATE` on order |
| `confirm_import_receipt(p_receipt_id uuid)` → void | DEFINER | `authenticated` only | `draft` → `confirmed`; **the only producer of `product_batches`** | `product_batches` (+), `inventory_transactions` (`IMPORT`) | `FOR UPDATE` on receipt; `import_item_id` UNIQUE prevents double-post |
| `adjust_inventory(p_batch_id, p_operation_type, p_write_off_quantity, p_actual_quantity, p_note)` → table | DEFINER | `authenticated` only | write-off (`EXPIRED`/`DAMAGE`/`LOST`/`MANUAL_ADJUSTMENT`) or `STOCK_COUNT` (server computes delta from locked row) | `product_batches.remaining_quantity`, `inventory_transactions` | `SELECT ... FOR UPDATE` on batch first |
| `record_order_payment(p_order_id, p_amount, p_payment_method, p_note)` → uuid | DEFINER | `authenticated` only | requires order `= 'completed'`; inserts `order_payments`, recomputes `orders.payment_status` (`paid` if `sum(amount) >= total` else `partial`) | `order_payments`, `orders.payment_status` | `SELECT ... FOR UPDATE` on order. `payment_method ∈ {cash, bank_transfer, other}` |
| Report RPCs (`get_revenue_*`, `get_profit_*`, `get_product_performance_*`, `get_inventory_*`, `get_expiry_*`, `get_slow_moving_*`, `get_*_alert_conditions`) | **INVOKER** | `authenticated` only | read-only | none | — |

**Consequence for the storefront:** every mutating RPC is `authenticated`-only and every
report RPC is INVOKER (would run with the caller's RLS = deny for `anon`). The storefront
gets **no usable RPC out of the box**. It needs its own purpose-built, minimal-surface
RPCs.

## A4. RLS & grants — current posture (Phase 9.1 + 9.7 hardening)

- **RLS enabled on every table.** Every policy is `TO authenticated`. There is **no
  policy for `anon` or `public` anywhere.**
- Phase 9.1 explicitly `REVOKE ALL ... FROM anon` on every base table and all three views.
  → `anon` fails at **both** the grant layer and the RLS layer.
- Every mutating RPC has `REVOKE EXECUTE ... FROM public` **and** `FROM anon`; only
  `authenticated` is granted.
- Write policies are now minimal: `orders` INSERT requires `status='draft'`, UPDATE only
  `draft|confirmed → cancelled`. Direct client writes to `product_batches`, `order_items`,
  `order_item_batches`, `inventory_transactions`, `order_payments`, `import_receipt_items`
  are **not possible** — all go through DEFINER RPCs.
- `profiles`: SELECT open to all `authenticated` (staff directory), UPDATE self-row only,
  no INSERT/DELETE policy. `role` column is not column-locked (deliberate — see A1).

**Do not loosen any of this in S0.** The storefront's public access is **additive** and
lives behind new, narrow surfaces (Part E).

## A5. Storage

| Bucket | Privacy | Limits | Used by |
| --- | --- | --- | --- |
| `product-images` | **private** | 5 MiB, `image/jpeg`, `image/png`, `image/webp` | admin product gallery, via `createSignedUrls` TTL 1h |
| `purchase-invoices` | **private** | hardened Phase 9.1 | admin invoice scans — internal |

There is **no public bucket.** Private-bucket signed URLs are unsuitable for a storefront
(they expire, defeat CDN caching, can't be crawled, and don't play well with
`next/image`). See C7 for the recommended fix.

## A6. Existing business invariants the storefront MUST preserve

1. **Draft import ≠ inventory.** Only `confirm_import_receipt()` posts stock.
2. **`product_batches.remaining_quantity` is the sole stock source.** Never introduce a
   second one (no `products.stock`).
3. **Inventory is never mutated from the storefront.** No direct writes; no calling
   `complete_order`/`cancel_order`/`adjust_inventory`.
4. **Only `completed` orders are revenue** (`reportable_orders`). A web order at placement
   must be non-`completed` and must not appear in revenue/profit/product-performance.
5. **COGS is server-authoritative and batch-snapshot-based** (`order_item_batches.unit_cost`
   captured by `complete_order()`). The storefront never sends cost, batch ids, or totals.
6. **Historical price is snapshotted on `order_items.unit_price`** and never recomputed
   from the live product.
7. **FEFO** batch allocation, non-expired only, is owned by `complete_order()`.
8. **Payments are real collected money** via `record_order_payment()`, only against
   `completed` orders. Placing a COD/bank-transfer order creates **no** payment row.
9. **Cancellation is a traceable reversal**, not a silent stock bump.
10. **`profiles.role` must not become authorization-bearing** without server-side
    enforcement first.

---

# PART B — BUSINESS DECISIONS

## B1. Product visibility

**Decision (MVP):** a product is shown on the storefront when **`status = 'active'`**.
Archived products 404 (or 410) on the storefront.

**Out-of-stock handling:** product stays visible, shows **"Hết hàng"**, "Thêm vào giỏ"
disabled. Do not hide it. (Better UX, better SEO, preserves inbound links.)

**Open decision O1 — "active but not on the website":** the current schema has no way to
say "this is a live catalog product but I don't want it on the public site". If the store
needs that (e.g. wholesale-only or channel-exclusive SKUs), add
`products.is_web_visible boolean NOT NULL DEFAULT false` (opt-in) or `DEFAULT true`
(opt-out) in S2. **Recommendation: add `is_web_visible DEFAULT false`** so nothing leaks
onto the web until a human ticks the box. Needs stakeholder confirmation before S2.

## B2. Price model

**Decision:** the storefront shows **`products.selling_price` only.** `tiktok_price` and
`shopee_price` are channel-internal and never exposed. `default_purchase_price` is COGS
input and never exposed. `discount` stays `0` (no coupon engine in MVP — §53).

## B3. Price trust model

- Cart may **display** a locally cached price for instant UX.
- Checkout **never trusts** any client-supplied `price` / `subtotal` / `discount` /
  `total`. The browser submits, per line, **`product_id` + `quantity`** only, plus
  contact/shipping fields.
- `create_storefront_order()` (S6) reads `selling_price` from `products` at call time and
  computes `unit_price`, `line_total`, `subtotal`, `total` server-side. This mirrors how
  `complete_order()` already recomputes `orders.subtotal`/`total` from real line items.
- If the server price differs from the cart's cached price, the checkout returns a
  structured `PRICE_CHANGED` error with the new figure; the customer must see and accept
  the new total before the order is created (§22, §62).

## B4. Stock availability model

**Sellable stock** for a product =
`SUM(remaining_quantity) WHERE expiration_date IS NULL OR expiration_date >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`
— exactly the predicate `complete_order()` uses for FEFO allocation.

**Do NOT** reuse `product_inventory_overview.stock_quantity` for storefront availability:
it counts expired physical stock. Example: 10 physical − 4 expired ⇒ storefront shows
**6 sellable**.

**Display (MVP):** status label only, no exact number.

| Sellable qty | Label | Add to cart |
| --- | --- | --- |
| `0` | **Hết hàng** | disabled |
| `≥ 1` | **Còn hàng** | enabled |

**"Sắp hết hàng"** is **deferred.** `minimum_stock` is an internal reorder threshold and
must not be exposed as a customer signal. If a "low stock" nudge is wanted later, define a
dedicated customer-facing constant (e.g. "≤ 5 left") in the storefront, not
`minimum_stock`.

**Max cart quantity** per line = current sellable stock (server-enforced at revalidation
and at checkout), min = 1. UI `max` attributes are UX only.

## B5. Checkout & customer model

**Decision:** **guest checkout only** in MVP. No account, no Supabase Auth for customers.

Required fields: full name, phone, shipping address (free text — matches
`customers.address`). Optional: email, order note.

**Customer matching (§29) — Decision: hybrid (B + C).**
1. `create_storefront_order()` normalizes the phone (B6) and looks up an existing
   `customers` row by normalized phone.
   - match ⇒ **reuse** that `customer_id` (link the order to the known customer).
   - no match ⇒ **create** a new `customers` row (`status` = active, `name`/`phone`/
     `email`/`address` from the form).
2. **Regardless of match**, the order **also stores its own snapshot** of
   name / phone / shipping address in new `orders.*_snapshot` columns (S6). The snapshot
   is the historical shipping truth; the `customers` master row may drift later.
   Admin order detail displays the snapshot, not the live customer record.
3. The storefront never updates an existing `customers` master row from a guest checkout
   (avoids a stranger overwriting a known customer's saved address). Admin can reconcile.

**Order customer snapshot (§30):** today `orders` stores only `customer_id`. This is a
real historical-correctness risk (customer edits address ⇒ old orders appear to have
shipped to the new address). S6 adds `customer_name_snapshot`, `phone_snapshot`,
`shipping_address_snapshot` (nullable, populated by the storefront RPC; admin-created
orders may leave them null and fall back to the live customer join).

## B6. Phone normalization

Vietnamese mobile numbers. Normalize to a single canonical form for matching and storage
comparison:

- Strip spaces, dots, dashes, parentheses.
- `+84XXXXXXXXX` → `0XXXXXXXXX`
- `84XXXXXXXXX` (no plus, 11–12 digits) → `0XXXXXXXXX`
- `0XXXXXXXXX` → unchanged
- Reject anything that isn't 9–11 digits after the above, or doesn't start `0` +
  valid VN mobile prefix, with a friendly Vietnamese message (`INVALID_CUSTOMER_DATA`).

Implement as **one pure, unit-tested function** shared by the client Zod schema (fast
feedback) and echoed in the RPC's own validation (authoritative). Store the canonical
`0XXXXXXXXX` form. Do **not** ship "simplistic logic without tests" (§46) — table-driven
tests covering every prefix form, plus invalid cases.

## B7. Address model

MVP: **free-text single field**, matching `customers.address`. Do not build
province/district/ward normalization now (§47). S6's `shipping_address_snapshot` is also
free text. When a shipping-carrier integration is scoped later, add structured columns
then — the snapshot column can hold a formatted string in the meantime.

## B8. Order lifecycle for web orders

**Decision: reuse the existing lifecycle. No new status.**

```
Customer submits checkout
      │  create_storefront_order()  (S6 RPC, SECURITY DEFINER)
      ▼
orders.status = 'draft'          ← NOT 'completed'. No inventory deducted.
orders.source = 'website'
orders.payment_status = 'unpaid'
orders.*_snapshot populated
order_items rows (server-priced)
      ▼
Admin sees it in the existing Orders list (filter/badge by source = 'website')
      ▼
Admin reviews, optionally edits via update_order_draft()
      ▼
Admin runs complete_order()      ← FEFO, stock deducted, becomes revenue, order_number stays
      ▼
Admin collects payment → record_order_payment()   (COD cash / bank_transfer)
```

Cancellation before completion: existing `cancelDraftOrder` path (`draft → cancelled`,
no inventory to reverse). After completion: existing `cancel_order()`.

**Why not `pending_confirmation` (§33):** a new enum value touches the `orders.status`
CHECK, `reportable_orders`, every `toOrderStatus()` mapper, admin list/detail filters,
`complete_order`/`update_order_draft`/`cancel` guards, and the test suite. A
`source = 'website'` column plus an admin badge gives staff the "new web order needs
attention" signal without any of that blast radius.

**Draft-semantics caveat (§117):** admin currently labels `draft` as "Nháp" and — because
`create_order()` auto-completes — **standing draft orders don't exist in the admin today**.
So admin Orders list / detail / edit have never been exercised with a persistent draft.
Phase **S9** is a dedicated admin-coordination phase: verify those screens render a
`source='website'` draft correctly, add the source filter/badge, and add an
"Xác nhận & hoàn tất" (accept & complete) action. Until S9 ships, web orders are visible
but unlabeled drafts.

## B9. Stock reservation

**Decision: Option A — no reservation in MVP.**

- `create_storefront_order()` **validates** current sellable stock per line at call time
  and rejects lines that exceed it (`OUT_OF_STOCK` / `QUANTITY_ADJUSTMENT_REQUIRED`).
- It does **not** decrement anything. Two customers can both order the last unit; the
  admin fulfils one and contacts the other.
- **This does not eliminate oversell** — validation without reservation is a UX
  courtesy, not a concurrency guarantee (§40). Documented, not hidden.
- Option B (reservation lifecycle: reserved qty, release on cancel/timeout,
  concurrency-safe checkout) and Option C (allocate-at-checkout) are real schema/
  lifecycle projects — out of MVP scope. Revisit if oversell becomes a real operational
  pain.

## B10. Payments

MVP methods: **COD** and **bank transfer (manual)**. No gateway (§48; gateway = S10).

- **COD (§49):** placing the order creates **no** `order_payments` row and does not set
  `payment_status`. The order is `unpaid` until the admin records the cash collected
  (`record_order_payment` with `payment_method = 'cash'`) *after* completion.
- **Bank transfer (§50):** the success page shows bank account details + the
  `order_number` as the transfer reference. The order is **not** marked paid. The admin
  reconciles the transfer and records it (`record_order_payment` with
  `payment_method = 'bank_transfer'`) after completion.
- Note `record_order_payment()` only accepts a payment once the order is `completed`.
  That's fine: for both methods, money is confirmed after admin processing.

**Open decision O8:** exact bank account details to display.

## B11. Shipping fee

`orders` has **no shipping-fee column** and `total` is computed by `complete_order()` as
`SUM(order_items.line_total)` — there is nowhere to fold a fee without corrupting the
line-item math.

**Decision (MVP): Option D — fee confirmed by admin after review.** The storefront shows
"Phí vận chuyển: sẽ được nhân viên xác nhận" and the displayed total is
goods-subtotal only. S6 adds `orders.shipping_fee numeric(15,0) NOT NULL DEFAULT 0` and
S9 lets admin set it; whether `complete_order()` should add it into `total` is a
**follow-up backend decision** (it currently must not, to keep reports consistent —
likely `total = goods + shipping_fee` needs a coordinated `complete_order` change and a
report review). **Do not silently fold shipping into product prices (§52).**

**Open decision O4:** free / flat-rate / admin-set. Recommendation: admin-set for MVP,
revisit flat-rate once delivery zones are known.

## B12. Discounts

**Decision: none.** `discount = 0` everywhere (§53). No coupons/promotions/loyalty in the
storefront roadmap through S12. The `orders.discount` / `order_items.discount` columns
stay zero.

## B13. Order number & guest tracking

- Keep `order_number` (`ORD-001`) as the **human-facing reference** shown to the customer
  and used as the bank-transfer memo.
- Because it's enumerable, guest order lookup must **not** be `order_number` alone.
- S6 adds `orders.tracking_token` — a 32-byte random value, URL-safe base64. **Store a
  SHA-256 hash** (`tracking_token_hash`), not the plaintext (§113): the plaintext lives
  only in the success URL / confirmation and the customer's hands; a DB leak doesn't
  hand out working tracking links. Lookup: hash the token from the URL, compare.
- Success page: `/dat-hang-thanh-cong/[token]`. Lookup page: `/tra-cuu-don-hang` accepts
  the token (from a saved link) — optionally `order_number` + `phone` as a
  weaker fallback, gated behind rate limiting (S12). Recommendation: **token only** for
  MVP simplicity and privacy.

## B14. Customer auth — why it's deferred (§74–§77)

- Staff authenticate as Supabase `authenticated`. Admin RLS is `TO authenticated` with
  **no role check** — effectively "any logged-in user is staff".
- If customers also become `authenticated`, **every customer gets staff-level RLS** on
  the admin tables. That is a critical privilege-escalation surface.
- `profiles.role` cannot be the fix: it's self-editable with no enforcement. A customer
  could set their own `role = 'admin'` the moment role becomes authorization-bearing.
- **Blocker to resolve before S11 (customer accounts):** choose and implement one of
  - secure, immutable role via a dedicated `SECURITY DEFINER` admin-role RPC + role-aware
    RLS, or
  - a separate `staff` / `admin_members` table that RLS checks (`EXISTS (SELECT 1 FROM
    staff WHERE user_id = auth.uid())`), or
  - custom JWT claims set by a trusted backend, or
  - keep the storefront entirely off direct DB access (all reads/writes via Next.js
    server + service-role-free RPCs) so customer `authenticated` never gains admin reach.
- **MVP: guest checkout, no customer Auth.** Auth model options (§45) evaluated in S11:
  recommendation leans to **`customers.auth_user_id uuid UNIQUE NULL REFERENCES
  auth.users`** (extend `customers`, keep one customer entity) *combined with* a `staff`
  table so `authenticated` alone grants nothing on admin tables.

---

# PART C — STOREFRONT ARCHITECTURE

## C1. System topology

```
                         Supabase Cloud project (ONE)
                    Postgres · Auth · Storage · PostgREST/RPC
                                     │
              ┌──────────────────────┴───────────────────────┐
              │                                              │
      Admin (existing)                              Storefront (new)
      React 19 + Vite 8                             Next.js App Router
      SPA on Vercel                                 SSR/RSC on Vercel
      supabase-js, anon key                         supabase-js server client, anon key
      trusted staff, authenticated                  public + guest, mostly anon
      full admin RLS surface                        narrow public data contract only
```

Shared backend confirmed appropriate: one catalog, one inventory ledger, one order book.
Splitting databases would force cross-DB sync of exactly the data that must stay
consistent (stock, prices, orders).

## C2. Repository

**Separate repo: `baby-wale-storefront`.** Pros: independent deploy cadence, no risk to
admin's build, clean dependency tree (Next vs Vite), smaller blast radius, separate
Vercel project. Cons: generated Supabase types maintained in two places (acceptable —
regenerate independently; see C11), some shared constants duplicated (money/date/phone
formatting — small, and the storefront's are customer-facing variants anyway).

**Not** a monorepo. **Do not** move admin into `apps/admin` (§98). Create the storefront
repo only after this document is approved (§97).

## C3. Next.js app structure (App Router)

```
baby-wale-storefront/
  app/
    (store)/
      layout.tsx                     server — <html>, header shell, footer
      page.tsx                       server — home
      san-pham/
        page.tsx                     server — catalog listing (reads ?q&danh-muc&sap-xep&trang)
        [slug]/page.tsx              server — product detail + generateMetadata + JSON-LD
      danh-muc/
        [slug]/page.tsx              server — category landing (delegates to listing)
      gio-hang/page.tsx              mostly client — cart
      thanh-toan/page.tsx            server shell + client checkout form
      dat-hang-thanh-cong/[token]/page.tsx   server — reads order by token (no-store)
      tra-cuu-don-hang/page.tsx      server shell + client lookup form
    api/
      checkout/route.ts             POST — validates, calls create_storefront_order RPC
      cart/revalidate/route.ts      POST — re-prices + re-checks stock for a cart payload
      orders/[token]/route.ts       GET  — token → safe order view (optional; page can do it directly)
    sitemap.ts                      products + categories + static
    robots.ts
    opengraph-image.tsx (optional)
  src/
    features/
      catalog/    { server/ (data fns), components/, schemas/ }
      cart/       { store.ts (zustand), components/, types.ts }
      checkout/   { schemas/, components/, client.ts }
      orders/     { server/, components/ }
    components/   ui/ (shadcn), common/ (Price, StockBadge, ...)
    lib/          supabase/server.ts, supabase/public.ts (opt), env.ts, format/
    types/        database.ts (generated), storefront.ts (public DTOs)
```

**Convention (§105):** a feature folder gets a `server/` subfolder **only** for modules
that must never run in the browser (they import the server Supabase client or read env
secrets). Client components live in `components/` and are marked `"use client"` at the
leaf. No blanket `server/` folders where there's nothing server-only.

## C4. Server / Client component responsibility matrix (§7)

| Server Components (default) | Client Components (`"use client"` leaves) |
| --- | --- |
| Home sections, category landing, catalog listing initial render | "Thêm vào giỏ" button, quantity stepper |
| Product detail content, gallery markup | Cart drawer, cart page mutations, cart count badge in header |
| `generateMetadata`, canonical URLs, JSON-LD, OG tags | Filter / sort / search controls (they write URL params → server re-renders) |
| Sitemap, robots | Checkout form (RHF + Zod), inline validation, submit state |
| Order success (reads by token, `no-store`) | Order lookup form |
| All Supabase reads (via `src/lib/supabase/server.ts`) | Toasts / notifications (`sonner`) |

**Never `"use client"` at a route or layout root.** The header is a server shell with a
small client cart-indicator island (§110).

## C5. Data access strategy (§8)

| Use case | Path | Why |
| --- | --- | --- |
| Catalog listing, product/category pages, home | **RSC → server Supabase client (anon key) → public views** | SEO, no waterfall, cache-controllable. RLS still applies (anon), so the public views + anon policies (Part E) are the security boundary. |
| Cart contents | **client only** (Zustand + persist) | per-browser, no server identity in MVP |
| Cart revalidation before checkout | **client → `POST /api/cart/revalidate` (Route Handler) → RPC/`server` fn** | needs authoritative price/stock; must be POST (payload = cart), not cacheable |
| Place order | **client → `POST /api/checkout` (Route Handler) → `create_storefront_order()` RPC** | one atomic DB transaction; observable; idempotency-key friendly; reusable by a future mobile client (§65) |
| Order lookup by token | **RSC (or `GET /api/orders/[token]`) → `get_storefront_order_by_token()` RPC** | `no-store`; returns safe fields only |

**Direct browser → Supabase is not used in MVP.** No client-side `supabase.from(...)` in
the storefront. If a genuine interactive need appears (e.g. type-ahead search suggestions
that shouldn't round-trip through Next), add a **read-only browser client hitting a public
view** then — behind RLS that's already safe (§8, §78). Default is: reads through RSC,
writes through Route Handlers.

## C6. Supabase clients (§9)

- **`src/lib/supabase/server.ts`** — created per request with `@supabase/ssr`
  (`createServerClient`), **anon/publishable key**, wired to Next's cookie store (so it's
  ready for customer sessions in S11 without a rewrite). Used by every RSC data function
  and Route Handler.
- **`src/lib/supabase/public.ts`** *(optional, only if C5's interactive exception is
  taken)* — browser client, anon key, no cookies needed for guest.
- **`service_role` key: not used anywhere.** Not in the browser (§9), and **not casually
  on the Next server either** (§9). The storefront's server-side needs are all satisfied
  by anon + `SECURITY DEFINER` RPCs that do the privileged work under controlled,
  minimal contracts. If a future server-only task genuinely needs elevation, introduce a
  single narrowly-scoped secret then, documented, least-privilege — never a blanket
  `service_role` client.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public by design).
  Any future secret is unprefixed and server-only. `.env.local` gitignored; prod values
  in Vercel project env; **never reuse prod credentials in tests** (§96).

## C7. Product images (§17, §18)

Private bucket + signed URLs is wrong for a public, crawlable, CDN-cached storefront.

**Recommendation: a dedicated public delivery path for web images.**

- **Option chosen: a separate public bucket `product-images-public`** (or a public
  prefix). Web-facing images are served by stable public URLs
  (`{SUPABASE_URL}/storage/v1/object/public/product-images-public/...`), consumable by
  `next/image` via `remotePatterns` (S1 config), cacheable, crawlable.
- The **private `product-images` bucket and admin's signed-URL workflow are unchanged.**
- A **publish step** copies an admin-selected image into the public bucket when a product
  is marked web-visible / an image is chosen as the web primary. Two ways, decided in S6/S9:
  1. small admin change: on "set web image", also upload to the public bucket; or
  2. a `SECURITY DEFINER` RPC / scheduled job that mirrors `is_primary` images for
     `is_web_visible` products into the public bucket.
- **Do not** simply flip the existing private bucket to public (§17) — it also holds
  images for archived/never-web products and is wired to admin's signed-URL assumptions.
- `next/image`: use `remotePatterns` for the Supabase public host (S1). A custom loader is
  unnecessary unless Supabase image transformations are adopted later.

**Open decision O3:** approve the separate-public-bucket approach and who owns the
publish step (admin change vs job).

## C8. Caching / revalidation (§61–§63)

Three tiers, not one TTL:

| Data | Strategy |
| --- | --- |
| Product descriptive content (name, description, brand, images, category) | RSC with `revalidate = 3600` (ISR) + on-demand `revalidateTag('product:<id>')` / `revalidateTag('catalog')` from a future admin webhook. Safe to be stale. |
| Price on catalog/detail pages | Same cache as content (short-ish, e.g. `revalidate = 600`). A stale *displayed* price is tolerable; a stale *charged* price is not. |
| Sellable stock badge | `revalidate = 60`–`120`, or render "Còn hàng/Hết hàng" from the same 10-min cache and accept minor lag. Never presented as a guarantee. |
| Cart revalidation + checkout + order lookup | **`no-store`.** Always live. `create_storefront_order()` re-reads price and stock transactionally. |

**Rule:** catalog cache is display-only; **checkout is the sole pricing/stock authority**
(§62, §63).

## C9. Cart architecture (§21–§23)

- **Zustand store + `persist` middleware → `localStorage`** (`zustand` skill: client/UI
  state only — a cart is exactly that; the authoritative order is server-side).
- Item shape: `{ productId, slug, name, primaryImageUrl, unit, quantity, cachedUnitPrice,
  cachedAt }`. The snapshot fields are display-only; `cachedUnitPrice` exists purely to
  detect drift and show "giá đã thay đổi".
- **Hydration (§109):** cart store is client-only. Guard against SSR mismatch — render the
  cart count / cart contents only after a `useHasHydrated()` flag flips post-mount
  (persist `onRehydrateStorage`). Server renders a neutral placeholder ("Giỏ hàng").
  **Never** read `localStorage` in an RSC.
- **Header (§110):** server-rendered shell; a small `"use client"` `<CartIndicator/>`
  island subscribes to the store for the count.
- **Quantity:** min 1; max = last-known sellable stock (UX only). Real enforcement is the
  revalidate endpoint + the RPC.

## C10. Cart revalidation contract (§22, §67)

`POST /api/cart/revalidate` with `{ items: [{ productId, quantity }] }` →

```jsonc
{
  "lines": [
    { "productId": "…", "status": "OK",
      "currentUnitPrice": 185000, "sellableQuantity": 12 },
    { "productId": "…", "status": "PRICE_CHANGED",
      "previousUnitPrice": 180000, "currentUnitPrice": 185000, "sellableQuantity": 5 },
    { "productId": "…", "status": "QUANTITY_ADJUSTMENT_REQUIRED",
      "requestedQuantity": 8, "sellableQuantity": 3, "currentUnitPrice": 99000 },
    { "productId": "…", "status": "OUT_OF_STOCK", "sellableQuantity": 0 },
    { "productId": "…", "status": "PRODUCT_UNAVAILABLE" }   // archived / not web-visible / deleted
  ],
  "subtotal": 1234000,          // server-computed from the corrected lines
  "hasBlockingIssues": true
}
```

The checkout UI must surface every non-`OK` line and require explicit re-confirmation of
the new total before it will submit (§22: never silently charge a different total).

## C11. Shared types & logic (§99, §100)

- **Generated Supabase types:** regenerate independently into
  `src/types/database.ts` in the storefront repo (`supabase gen types typescript`). No
  shared npm package (§99) — the coupling isn't worth the release friction for two apps.
- **Authoritative business logic stays in Postgres** (`create_storefront_order`,
  price/stock computation, phone normalization echoed server-side). Do not re-implement
  order/pricing rules in TS on either frontend (§100).
- Small formatting helpers (VND, date in `dd/MM/yyyy`, phone display) are re-authored in
  the storefront — they're tiny and the storefront's presentation differs from admin's.
  Currency is still integer VND, one `formatVnd()` (§91). Dates render in
  `Asia/Ho_Chi_Minh`, timestamps stored UTC (§92).

## C12. State libraries — decisions (§107, §108)

- **TanStack Query: not in MVP.** Catalog is RSC/SSR; there is no client server-state to
  cache. Add it only when an interactive, client-fetched surface appears (order-status
  polling on the lookup page, or S11 account pages). Don't mirror initial server data
  into it (§106, §107).
- **Zustand: yes, for the cart and cart-drawer UI state only** (§108). `persist` for
  cart. Nothing else needs global client state in MVP.
- **RHF + Zod: yes**, for the checkout form and the order-lookup form. Client Zod = fast
  UX; server Zod in the Route Handler = request validation; the RPC + DB constraints =
  authoritative invariants (§66).

## C13. SEO architecture (§54, §55, §112)

- App Router `metadata` / `generateMetadata`:
  - root: title template `%s | Baby Wale`, default description, `metadataBase`.
  - product: title = product name (+ brand), description from `description` (trimmed),
    canonical `/(store)/san-pham/[slug]`, OG image = public primary image.
  - category: title = category name, canonical `/danh-muc/[slug]`.
- `app/sitemap.ts`: all web-visible product slugs + category slugs + static routes,
  `lastModified` from `updated_at`.
- `app/robots.ts`: allow catalog; **disallow** `/gio-hang`, `/thanh-toan`,
  `/dat-hang-thanh-cong`, `/tra-cuu-don-hang`, `/api`.
- Canonical discipline on filtered listings (§112): `?trang=N` canonical to itself;
  `?q=` / multi-facet combinations get `robots: noindex, follow` to avoid indexing
  infinite filter permutations. Category + single-sort pages stay indexable.
- **Product JSON-LD** (`Product` + `Offer`, `priceCurrency: "VND"`, `availability` from
  sellable stock): designed now, implemented in S4 (§55).
- Structured data beyond Product, breadcrumbs, `Organization`: S12.

## C14. URL structure (§56) — Vietnamese, no diacritics in paths

```
/                                     home
/san-pham                             catalog listing (?q, ?danh-muc, ?sap-xep, ?trang)
/san-pham/[slug]                      product detail
/danh-muc/[slug]                      category landing
/gio-hang                             cart
/thanh-toan                           checkout
/dat-hang-thanh-cong/[token]          order success
/tra-cuu-don-hang                     guest order lookup
/tai-khoan                            (S11 — customer account)
```

Filter/sort/search/pagination live in **URL search params** (§111), not Zustand:
`?q=sua&danh-muc=bim-ta&sap-xep=gia-tang&trang=2`. Shareable, back-button-correct,
SSR-friendly, crawlable. Sort values: `moi-nhat` (default), `gia-tang`, `gia-giam`
(`ban-chay` later, needs C15).

## C15. Home page & best-sellers (§57, §84)

MVP home sections (content built in S3, not S0): hero/banner, category shortcuts,
new/featured products (`ORDER BY created_at DESC` over web-visible), store trust/info,
footer with contact.

**Best-sellers ("Bán chạy"):** the product-performance report RPCs are INVOKER and expose
internal metrics (COGS, gross profit) — **do not call them from the storefront** (§84).
If "Bán chạy" is wanted, S3/S12 adds a **public-safe** aggregate: a
`SECURITY DEFINER` RPC or materialized view exposing only
`{ product_id, sold_quantity }` over completed orders in a trailing window, granted to
`anon`. **Open decision O6:** is best-sellers in MVP scope?

## C16. Search & pagination (§58–§60)

- **Search: DB-side.** `pg_trgm` extension is installed (in the `extensions` schema) but
  there is **no trigram index on `products` today** and current admin search is plain
  `ILIKE`. For MVP, storefront search = `ILIKE` against the public view over
  `name` / `brand`, delimiter-sanitized (`frontend-security`). If the catalog grows or
  ranking matters, S3 adds a `gin (name extensions.gin_trgm_ops)` index (additive,
  reported per §10). Never filter the catalog client-side (§59).
- **Pagination: server-side, page-number** (`?trang=N`, fixed page size e.g. 24).
  Page-number is fine for a small catalog and gives stable, indexable category pages
  (§60, §112). Cursor pagination is unnecessary.
- Filters: category (single), price sort. Keep it minimal (§58) — no multi-facet filter
  matrix in MVP.

## C17. Server Actions vs Route Handlers (§64, §65)

**Use Route Handlers** (`app/api/**/route.ts`) for checkout, cart revalidation, and order
lookup — not Server Actions. Reasons: an explicit, versionable public API surface;
straightforward request validation and logging/observability; natural place for an
idempotency key and (S12) rate limiting; reusable by a future internal mobile client
(§65); and payment-gateway callbacks (S10) are Route Handlers anyway, so the checkout
family stays consistent.

Server Actions are fine for trivial, page-local, non-critical mutations if any appear
(e.g. a newsletter signup) — not for the order transaction.

**The business transaction itself is a Postgres RPC** (`create_storefront_order`); the
Route Handler only validates the request shape and orchestrates the single RPC call
(§65). That keeps the invariant enforceable outside Next.

## C18. Design system (§86–§89)

- The storefront is **customer-facing commerce**, not an admin dashboard. It does **not**
  import admin's layout/components. It gets its own header, nav, product cards, cart UX,
  mobile interactions, commercial visual hierarchy.
- Shared: brand identity (Baby Wale — mẹ & bé), logo (reuse existing asset, **do not
  regenerate** — §87), colour palette, type principles, VND/date formatting rules.
- Built on the same primitives family (Tailwind + shadcn/ui) for velocity, but styled as
  a storefront.
- **Mobile-first (§88):** primary flows (browse → detail → add to cart → checkout) must
  work well at ~390px. Design breakpoints from small up.
- **Accessibility from day one (§89):** semantic headings, labelled form controls,
  accessible names on icon buttons, keyboard operability, focus management for the cart
  drawer and dialogs, status never by colour alone (the stock badge has text), `alt` text
  on product images.
- **i18n (§90):** Vietnamese only. No i18n framework. Keep copy in a
  `messages/` module (plain TS maps) rather than scattered literals so a future locale is
  possible, but don't build the machinery now.
- Currency VND only, integer, `formatVnd()` (§91). No floats in any money path.

## C19. Deployment (§94, §95)

**Recommendation: Vercel for the storefront MVP.**

| Factor | Vercel | Ubuntu home server (Docker + Cloudflare Tunnel) |
| --- | --- | --- |
| SEO / SSR / ISR | first-class | works, but caching/ISR is on you |
| TLS | automatic | Cloudflare/again on you |
| `next/image` optimization | built-in | needs `sharp` + config, or an external optimizer |
| Uptime for a **public** site | high | tied to home power + residential internet — real risk for a storefront |
| Cost | free/low at this traffic | "free" but ops time + reliability cost |
| Deploy simplicity | git push | build/publish pipeline to maintain |

The admin is an internal tool where a home-server blip is tolerable; a public storefront
losing availability costs sales and SEO. Start on Vercel. If hosting cost or data
residency later matters, containerise (`output: 'standalone'`) and move behind Cloudflare
Tunnel on the Ubuntu box — the app is portable, this is not a lock-in.

Supabase stays Supabase Cloud either way. Environments (§96): local dev, Vercel Preview
(can point at the same Supabase project initially or a dedicated staging project — prefer
a **staging Supabase project** before real orders flow), Vercel Production. Never put
production keys in test/CI.

---

# PART E — PUBLIC DATA CONTRACT & RLS PLAN (design for S2; do not apply in S0)

## E1. Principle

Do **not** grant `anon` `SELECT` on any base table (§12). Expose a **small, explicit,
column-controlled contract**: `security_invoker` views over `products` / `categories` /
`product_batches` that select only public-safe columns, plus `anon` RLS policies on the
underlying tables scoped to sellable rows, plus `GRANT SELECT` on the views to `anon`.
Everything financial/internal is recomputed or omitted.

## E2. `storefront_products` view (recommended shape — SQL authored in S2)

```
storefront_products
  product_id          uuid       -- internal id (needed for cart line + RPC input)
  slug                text       -- from products.slug (S2)
  name                text
  brand               text
  description         text
  unit                text
  origin_country      text
  manufacturer        text
  distributor         text
  category_id          uuid
  category_slug        text
  category_name        text
  selling_price        numeric(15,0)   -- the ONLY price
  primary_image_path   text       -- object key in the PUBLIC bucket (C7)
  sellable_quantity    integer    -- SUM(remaining_quantity) WHERE not expired (B4)
  in_stock             boolean    -- sellable_quantity > 0
  updated_at           timestamptz
WHERE products.status = 'active' AND products.is_web_visible  -- (O1)
```

Explicitly **excluded**: `default_purchase_price`, `tiktok_price`, `shopee_price`,
`minimum_stock`, `sku`, `barcode`, `source_description`, `created_by`, any supplier /
batch-cost / COGS / import / invoice / inventory-transaction / alert / staff data (§11).

- `security_invoker = true` (same convention as the three existing views) so it re-checks
  RLS as the querying role — which for the storefront is `anon`, so E3 is what actually
  opens access.
- A sibling `storefront_categories` view: `{ category_id, slug, name, description,
  product_count }` over categories that have ≥1 web-visible product.

## E3. `anon` RLS policies (new, additive, S2)

```
-- products: anon may read only active, web-visible rows
CREATE POLICY products_anon_select ON public.products
  FOR SELECT TO anon
  USING (status = 'active' AND is_web_visible);

-- categories: anon may read all (names only ever surface via the view)
CREATE POLICY categories_anon_select ON public.categories
  FOR SELECT TO anon USING (true);

-- product_batches: anon may read only the columns the view needs, only rows with stock
CREATE POLICY product_batches_anon_select ON public.product_batches
  FOR SELECT TO anon
  USING (remaining_quantity > 0);
-- (column exposure is still controlled by the view's SELECT list; consider a
--  column-level GRANT on product_batches to anon limited to
--  product_id, remaining_quantity, expiration_date as defense-in-depth)

GRANT SELECT ON public.storefront_products, public.storefront_categories TO anon;
-- Also add column-level GRANTs on product_batches/products/categories limited
-- to the exact columns the views read (belt-and-braces against a future view change).
```

Everything else stays `TO authenticated`-only and `anon`-revoked. Orders, customers,
payments, profiles, suppliers, imports, invoices, inventory ledger: **no `anon` policy,
ever**. The storefront reaches order data only through the two RPCs below.

## E4. `create_storefront_order()` RPC (design for S6; NOT built in S0) (§36–§40)

```
create_storefront_order(
  p_customer_name        text,
  p_customer_phone       text,
  p_shipping_address     text,
  p_customer_email       text     default null,
  p_note                 text     default null,   -- customer note → orders.note
  p_payment_method       text,                     -- 'cod' | 'bank_transfer'
  p_items                jsonb,                    -- [{ product_id, quantity }]  ONLY
  p_idempotency_key      uuid
) RETURNS jsonb   -- { order_number, tracking_token, total, subtotal, shipping_fee,
                  --   payment_method, status, created_at }
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
GRANT EXECUTE TO anon, authenticated;   -- REVOKE FROM public
```

Responsibilities (§37), all server-authoritative:

1. Reject empty `p_items`; reject `jsonb` that isn't an array.
2. Reject a re-used `p_idempotency_key` — if a row with that key exists, **return its
   existing confirmation** (idempotent, §39), do not create a second order.
3. For each line: product must exist, be `status='active'` **and** `is_web_visible`
   (else `PRODUCT_UNAVAILABLE`); `quantity` integer `>= 1` (else `INVALID_QUANTITY`).
4. Read `selling_price` from `products` → `unit_price`; `line_total = quantity *
   unit_price`; `subtotal = Σ line_total`.
5. Compute `sellable_quantity` per product (non-expired batch sum, `FOR SHARE` on those
   batch rows to reduce — not eliminate — races). If `quantity > sellable_quantity` →
   `OUT_OF_STOCK`. **No decrement, no reservation** (B9). Document that this is a check,
   not a lock.
6. `shipping_fee = 0` for MVP (admin sets later); `total = subtotal` (+ `shipping_fee`
   once B11's follow-up lands).
7. Normalize phone (B6). Find `customers` by normalized phone → reuse id, else insert a
   new customer.
8. Generate `order_number` (reuse the existing `ORD-###` advisory-lock pattern) and a
   random `tracking_token`; store `sha256(tracking_token)`.
9. Insert `orders`: `status='draft'`, `source='website'`, `payment_status='unpaid'`,
   `customer_id`, all `*_snapshot` columns, `note`, `shipping_fee`, `idempotency_key`,
   `payment_method`.
10. Insert `order_items` (server-priced). **No `order_item_batches`, no COGS, no inventory
    write** — that's `complete_order()`'s job when admin accepts.
11. Return the safe confirmation (§116): `order_number`, plaintext `tracking_token`
    (once, to the caller), totals, method, status, timestamp. **Never** return the order
    UUID, COGS, batch data, or internal notes.

Atomicity (§38): the whole thing is one function invocation = one transaction. Any raise
rolls back everything. No "insert order then N client inserts".

## E5. `get_storefront_order_by_token()` RPC (design for S6) (§42, §43, §116)

```
get_storefront_order_by_token(p_token text) RETURNS jsonb
SECURITY DEFINER; GRANT EXECUTE TO anon, authenticated;
```

Hash `p_token`, look up `orders` by `tracking_token_hash`. Return **only**:
`order_number`, `status` (mapped to a customer-facing label — see E7), `payment_status`,
`payment_method`, `created_at`, `subtotal`, `shipping_fee`, `total`, line items as
`{ name_snapshot?, product_name, quantity, unit_price, line_total }`, and the
`*_snapshot` contact/shipping fields. **Never** `customer_id`, order UUID, `created_by`,
COGS, `order_item_batches`, staff/internal notes. No lookup by sequential id or
`order_number` alone (§72).

## E6. Idempotency (§39)

`orders.idempotency_key uuid UNIQUE` (S6). Client generates a UUID when the checkout form
mounts, sends it with the submit. Retries / double-clicks / refresh-replays carry the same
key → the RPC returns the first order's confirmation instead of creating a duplicate. The
Route Handler also disables the submit button while pending (`error-handling` skill) as
the first line of defence, but the unique constraint is the real guarantee (§14).

## E7. Error contract (§67) — surfaced by `/api/checkout` and `/api/cart/revalidate`

| Code | Cause | Customer-facing Vietnamese (example) |
| --- | --- | --- |
| `PRODUCT_NOT_FOUND` | product id doesn't exist | "Sản phẩm không tồn tại." |
| `PRODUCT_UNAVAILABLE` | archived / not web-visible | "Sản phẩm hiện không còn được bán." |
| `OUT_OF_STOCK` | sellable = 0 | "Sản phẩm đã hết hàng." |
| `QUANTITY_ADJUSTMENT_REQUIRED` | requested > sellable > 0 | "Chỉ còn {n} sản phẩm. Vui lòng điều chỉnh số lượng." |
| `PRICE_CHANGED` | cart price ≠ current | "Giá sản phẩm đã thay đổi. Vui lòng xem lại đơn hàng." |
| `INVALID_QUANTITY` | qty < 1 or non-integer | "Số lượng không hợp lệ." |
| `INVALID_CUSTOMER_DATA` | name/phone/address fails validation | field-level messages |
| `DUPLICATE_CHECKOUT` | idempotency key seen, returns original | (not an error — return original confirmation) |
| `ORDER_CREATE_FAILED` | unexpected DB error | "Không thể tạo đơn hàng. Vui lòng thử lại." |
| `RATE_LIMITED` (S12) | too many attempts | "Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát." |

**Never leak raw Postgres error text** to the customer (§67). The RPC raises with stable
prefixes (same convention as the existing RPCs); the Route Handler maps prefix → code →
Vietnamese message; unmapped → `ORDER_CREATE_FAILED` + server log.

Customer-facing status labels for `orders.status` + `source='website'` (§117):
`draft` → **"Đơn mới – chờ xác nhận"**, `completed` → **"Đã xử lý / hoàn tất"**,
`cancelled` → **"Đã huỷ"**. (`confirmed` is unused by this flow.)

---

# PART F — REQUIRED BACKEND CHANGES (summary; each reported & applied in its S-phase, never in S0)

| # | Change | Type | Phase | Impact |
| --- | --- | --- | --- | --- |
| F1 | `products.slug text`, `categories.slug text` + `UNIQUE` + backfill from name (unaccent + kebab, dedupe with `-2` suffix) | additive column + data backfill | S2 | none to admin logic; admin product form should later expose/allow editing slug (S9) |
| F2 | `products.is_web_visible boolean NOT NULL DEFAULT false` (pending O1) | additive column | S2 | admin needs a toggle (S9); nothing breaks if ignored |
| F3 | `storefront_products`, `storefront_categories` views (`security_invoker`) | additive views | S2 | none |
| F4 | `anon` SELECT policies on `products` / `categories` / `product_batches` (scoped) + `GRANT SELECT` on the two views + column GRANTs | additive RLS/grants | S2 | **widens `anon` from nothing to sellable catalog only** — reviewed carefully; admin `authenticated` policies untouched |
| F5 | optional `gin_trgm` index on `products.name` | additive index | S3 (if needed) | none |
| F6 | `orders.source text NOT NULL DEFAULT 'admin'` CHECK `('admin','website','tiktok','shopee','other')` | additive column | S6 | admin order list/detail should show it (S9); default keeps existing rows correct |
| F7 | `orders.customer_name_snapshot / phone_snapshot / shipping_address_snapshot text NULL` | additive columns | S6 | admin order detail should prefer snapshot when present (S9) |
| F8 | `orders.recipient_name text NULL` (if different from customer), `orders.shipping_fee numeric(15,0) NOT NULL DEFAULT 0` | additive columns | S6 | whether `complete_order()` adds `shipping_fee` into `total` is a **coordinated follow-up** — needs a report-consistency review before changing the RPC |
| F9 | `orders.tracking_token_hash text UNIQUE NULL`, `orders.idempotency_key uuid UNIQUE NULL`, `orders.payment_method text NULL` CHECK `('cod','bank_transfer')` | additive columns | S6 | none to admin |
| F10 | `create_storefront_order()` RPC (`SECURITY DEFINER`, `EXECUTE` to `anon`+`authenticated`) | new RPC | S6 | new; does not touch existing RPCs |
| F11 | `get_storefront_order_by_token()` RPC | new RPC | S6 | new |
| F12 | public "best-sellers" aggregate (RPC or matview, `anon`-safe, no COGS) — only if O6 = yes | additive | S3/S12 | none |
| F13 | public image bucket `product-images-public` + publish step (O3) | new bucket + admin/job change | S6/S9 | admin image flow gains a publish action; private bucket untouched |

**No destructive changes anywhere.** No table drops, no column renames, no historical-
relationship changes, no cascade deletes (CLAUDE.md §10). Every item above is additive and
backward-compatible; each is reported in its phase's completion report per §10.5.

---

# PART G — ADMIN COMPATIBILITY CHECKLIST (verified in S9 before web orders go live) (§79–§83)

- **Orders list** (`get-orders.ts`): already selects `status`, `payment_status`, `total`,
  `customers(name, phone)`. A `source='website'` `draft` with `customer_id` set will
  render. Add: `source` to the select, a channel badge, a "Kênh" filter, and make sure a
  `draft` row's row-actions make sense (it currently expects mostly `completed`).
- **Order detail** (`order-detail-page.tsx`, `get-order.ts`, `get-order-lines.ts`): must
  display `*_snapshot` contact/shipping fields when present; must show `shipping_fee`;
  must offer "Xác nhận & hoàn tất" (→ `complete_order`) for a website draft; `cancel`
  path uses existing `cancelDraftOrder`.
- **Order edit** (`update_order_draft`): already accepts `draft` — works, but the form was
  built for POS immediacy; confirm it round-trips a website draft's items/customer.
- **Customer detail**: a storefront-created or storefront-reused customer must list its
  website orders. `customer_order_summary.total_spent` counts `completed` only — a pending
  website order correctly contributes 0 until admin completes it (§82). ✔
- **Reports**: `reportable_orders` filters `status='completed'` — a website `draft`
  contributes nothing to revenue/profit/product-performance until admin completes it. ✔
  After completion it behaves exactly like an admin order. ✔
- **Inventory alerts (§83)**: no reservation ⇒ stock only moves on real `complete_order()`
  / `adjust_inventory` — alert behaviour is unchanged. ✔
- **PDF export** (`pdf-export` skill): order PDF should tolerate a `draft` and print
  snapshot address. Verify in S9.
- **Non-null expectations**: `orders.order_number` (RPC sets it), `order_date` (default
  `now()`), `subtotal`/`total`/`discount` (RPC sets; CHECK `>= 0`) — all satisfied by
  `create_storefront_order()`. `created_by` is nullable ✔ (a guest order has no staff
  actor).

---

# PART H — S1–S12 ROADMAP

Each phase ends with the standard completion report (CLAUDE.md §14) and
`lint`/`typecheck`/`test`/`build` green. Backend migrations are applied in-phase, reported
per §10.

| Phase | Title | Scope | Backend |
| --- | --- | --- | --- |
| **S1** | Storefront project scaffold | New `baby-wale-storefront` repo. Next.js (latest stable) App Router, TS strict, Tailwind + shadcn init, ESLint/Prettier, Vitest + RTL foundation mirroring admin's `TESTING.md` discipline, `src/lib/supabase/server.ts` (`@supabase/ssr`, anon key), `env.ts` (zod-validated), `next.config` `images.remotePatterns` for the Supabase public host, health route, Vercel project + Preview/Prod envs, `robots.ts` stub. **No business features.** | none |
| **S2** | Public catalog data contract | F1 (slugs + backfill), F2 (`is_web_visible`, pending O1), F3 (`storefront_products` / `storefront_categories` views), F4 (`anon` policies + grants). Verify `anon` can read exactly the contract and nothing else (negative tests against `orders`, `customers`, `product_batches` columns, cost fields). | F1–F4 |
| **S3** | Catalog browse | Home (hero, category shortcuts, new products, trust/footer), `/san-pham` listing as RSC with URL-param filter/sort/pagination, `/danh-muc/[slug]`, DB-side `ILIKE` search (+ F5 index if needed), `StockBadge`, `Price`, product card. Caching tiers (C8). | F5 (maybe), F12 (if O6=yes) |
| **S4** | Product detail | `/san-pham/[slug]` RSC, image gallery (public bucket), sellable-stock state + "Hết hàng", `generateMetadata` (title/description/canonical/OG), **Product JSON-LD**, related-in-category strip. 404/410 for archived/non-visible. | none |
| **S5** | Cart | Zustand + `persist` store, hydration guard, cart drawer, `/gio-hang` page, quantity stepper with stock ceiling, header `<CartIndicator/>` island, `POST /api/cart/revalidate` + the C10 contract, "giá đã thay đổi" / "chỉ còn n" UI. | none |
| **S6** | Order backend contract | F6–F11 (order columns, `create_storefront_order`, `get_storefront_order_by_token`), F13 (public image bucket + publish step, with O3 decided). Full RPC unit/integration tests (empty cart, bad product, price recompute, phone normalization table, idempotency replay, out-of-stock, snapshot population). | F6–F11, F13 |
| **S7** | Checkout | `/thanh-toan`: RHF + Zod contact/shipping form, cart revalidation gate, method selection (COD / bank transfer), `POST /api/checkout` → `create_storefront_order`, idempotency key, E7 error contract + Vietnamese mapping, disable-on-pending. No payment row created. | none |
| **S8** | Confirmation & lookup | `/dat-hang-thanh-cong/[token]` (RSC, `no-store`, `get_storefront_order_by_token`), bank-transfer instructions block (O8 details), `/tra-cuu-don-hang` token lookup. `robots` disallow. Transactional email/SMS deliberately deferred (§119) — placeholder hook only. | none |
| **S9** | Admin coordination | Make admin handle standing `source='website'` drafts: Orders list badge + "Kênh" filter, order detail snapshot/shipping-fee display + "Xác nhận & hoàn tất", edit round-trip check, PDF check, new-web-order signal via existing Alert Center (§118). Admin `is_web_visible` toggle + slug field on the product form. This phase edits the **admin** repo. | possibly `complete_order` + reports review for `shipping_fee` in `total` (coordinated, reported) |
| **S10** | Online payment | VNPay/MoMo via server-side Route Handler callbacks/webhooks; `order_payments` written by a trusted server path after gateway confirmation; reconcile with `payment_status`. Separate, additive. | payment-callback RPC / columns |
| **S11** | Customer accounts | **Gated on RBAC hardening** (B14): implement a `staff` table (or secure roles / custom claims) so `authenticated` alone grants nothing on admin tables; column-lock or RPC-gate `profiles.role`. Then `customers.auth_user_id`, Supabase Auth customer sign-in, `/tai-khoan` order history, address book, claim past guest orders by phone. | `staff` table + admin RLS rewrite, `customers.auth_user_id`, `profiles.role` enforcement |
| **S12** | Hardening & growth | Rate limiting (checkout / lookup / any form) at the edge/Route-Handler layer, security headers + CSP, `sitemap.ts` completeness, `Organization` + breadcrumb structured data, best-sellers (F12) if not already, performance pass (image sizing, RSC payloads), optional privacy-respecting analytics (§93), CAPTCHA only if abuse observed (§69). | F12 (maybe) |

**Do not begin S1 until this document is approved.** Do not auto-chain phases (§14).

---

# PART I — OPEN DECISIONS FOR THE STAKEHOLDER

| # | Decision | Recommendation | Needed by |
| --- | --- | --- | --- |
| **O1** | Is every `status='active'` product automatically on the website, or is there an "active but not web" case? | Add `products.is_web_visible DEFAULT false` (opt-in) — nothing leaks until ticked. | S2 |
| **O2** | New `pending_confirmation` order status, or reuse `draft` + `source='website'`? | Reuse `draft` + `source`. Add a status only if wording truly can't be a badge. | S6 |
| **O3** | Web image delivery: separate public bucket + publish step? Who owns the publish — admin change or job? | Separate public bucket `product-images-public`; publish on admin "set web image" (small admin change in S9). | S6 |
| **O4** | Shipping fee model: free / flat / admin-set-after-review? | Admin-set after review for MVP; `shipping_fee DEFAULT 0`. Revisit flat-rate with delivery zones. | S6/S9 |
| **O5** | Deployment: Vercel or the Ubuntu home server? | Vercel for the public storefront MVP; containerise to the home server later only if cost/residency demands it. | S1 |
| **O6** | "Bán chạy" (best-sellers) section on the home page in MVP? | Defer to S12 unless it's a launch must-have; needs a public-safe aggregate (F12). | S3 |
| **O7** | Guest order cancellation: "liên hệ cửa hàng" only for MVP (§121)? | Yes — no self-service cancel until order-status rules are designed. | S8 |
| **O8** | Bank account details to display for bank-transfer orders. | Provide account name / number / bank / branch; shown with `order_number` as memo. | S8 |
| **O9** | Staging: dedicated Supabase project before real orders, or Preview against production? | Dedicated staging Supabase project once S7 lands. | S6/S7 |
| **O10** | RBAC hardening approach for S11 (`staff` table vs secure roles vs claims). | `staff`/`admin_members` table checked by RLS + keep one `customers` entity via `auth_user_id`. | before S11 |

---

## Appendix — files & migrations read for this audit

**Source:** `src/types/database.ts`, `src/lib/supabase.ts`, `src/providers/auth-provider.tsx`,
`src/app/router.tsx`, `src/routes/create-order-page.tsx`,
`src/features/orders/{api/create-order.ts, api/cancel-draft-order.ts, api/get-orders.ts,
api/order-errors.ts, types/order.ts, schemas/order-form-schema.ts}`,
`src/features/products/{types/product.ts, api/search-products.ts, api/get-product-images.ts}`,
`package.json`, `TESTING.md`, `.claude/skills/domain-driven-frontend/SKILL.md`,
`supabase/migrations/README.md`.

**Migrations:** `20260830105659_add_create_order_rpc`,
`20260908083207_phase_9_7_deterministic_lock_ordering` (`complete_order` + `cancel_order`
current bodies), `20260830143106_add_update_order_draft_rpc`,
`20260830144703_add_record_order_payment_rpc`,
`20260830095115_confirm_import_receipt_validation_and_confirmed_by`,
`20260907152046_enhance_inventory_adjustment`,
`20260907161733_security_hardening_table_grants_and_rls`,
`20260907161810_security_hardening_function_search_path`,
`20260908083132_phase_9_7_lifecycle_write_hardening`,
`20260823163254` / `20260823163502` (anon/public RPC revokes),
`20260828100417_harden_product_images_bucket`,
`20260829140635_add_product_tiktok_shopee_prices`,
`20260829143857_add_product_inventory_overview_view`,
`20260830103320_add_customer_order_summary_view` (+ `20260830103356` security_invoker),
`20260830160128_add_reportable_orders_view`, `20260823163303_move_pg_trgm_to_extensions_schema`,
`20260902144316` / `20260903150401` (report RPC security/grants).

**Not changed. Nothing was applied to the database. No storefront code was written.**
