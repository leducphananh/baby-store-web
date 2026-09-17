---
name: dashboard-ui
description: Conventions for the main dashboard and report views — widget composition, independent data fetching, alerts surfacing, chart choices. Apply when building dashboard or report pages.
---

# Dashboard & reports UI conventions

## Apply when
Building the main dashboard, or revenue/profit/inventory report views, or alert widgets
(expiring products, low stock).

## Rules

1. **Dashboard is a composition of independent widgets**, each with its own query hook and
   its own loading/error/empty state — one slow widget must not block the rest of the
   dashboard from rendering (see `frontend-performance`).
2. **Alerts are first-class, visually prominent, and actionable**, not buried: an expiring-
   product or low-stock widget shows the count, the key items, and links directly to the
   filtered list (e.g. "12 sản phẩm sắp hết hạn" → link to batches filtered by expiring soon)
   rather than being purely informational.
3. **KPI/summary cards show the number, a clear Vietnamese label, and the relevant unit**
   (VND for money, "sản phẩm"/"đơn hàng" counts) — never a bare unlabeled number.
4. **Charts are used for trends/comparisons, not for single numbers** — a single KPI is a
   stat card, not a one-bar chart. Use charts for revenue-over-time, top products, category
   breakdown, etc.
5. **Report date ranges are explicit and controllable** (day/week/month/custom range,
   defaulting to something sensible like "this month"), and the selected range is visible on
   the page, not implicit.
6. **Report filters shared across multiple report pages (date range, branch) can live in a
   Zustand store** per `zustand` — but the report *data* itself stays in React Query, keyed
   by those filters.
7. **Reports involving money always compute from integer VND**, and large totals are
   formatted with thousands separators — never show unformatted raw integers for money
   figures (see `vietnamese-business-ui`).
7a. **Reports never pull a full raw table into the browser to compute aggregates
   client-side.** Revenue/profit/inventory/product-performance numbers come from database
   aggregation — SQL, views, or RPCs — not from downloading every order/transaction row and
   summing in JavaScript. A genuinely tiny, bounded dataset (e.g. a handful of categories)
   is fine to aggregate client-side; anything that scales with orders/transactions is not.
8. **Profit figures are clearly distinguished from revenue** (separate cards/sections,
   explicit labels "Doanh thu" vs "Lợi nhuận") — never conflate the two or imply a margin
   that wasn't actually computed from batch cost data (see `domain-driven-frontend`).
9. **Dashboard/report pages are code-split** if heavy (charting libraries, large report
   computations) per `frontend-performance`.
10. **Every report/chart has a "no data for this period" empty state**, distinct from a
    loading or error state.

## Anti-patterns to reject in review

- One monolithic dashboard query that must fully resolve before anything on the page
  renders.
- A low-stock/expiring alert widget that just shows a number with no way to act on it.
- Revenue and profit shown with the same visual weight/no distinction, risking
  misinterpretation by store staff.
- A chart used to display a single static number that would be clearer as a stat card.
