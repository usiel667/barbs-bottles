## Context

Customers today have a list page (`customers/page.tsx`, a server component with desktop table + mobile cards) and an edit/create form (`customers/form/page.tsx` + `CustomerForm.tsx`, loaded via `?id=`). There is no read-only view, and no way to see a customer's orders from the customer side. Orders live in `orders` (FK `customerId`) with line items in `order_items`; the Orders list (`orders/page.tsx` + `OrderRow.tsx`) already renders status badges and totals.

Relevant existing patterns:
- `products/design-variant/[id]/page.tsx` — dynamic-segment detail page: `await params`, `parseInt`, `isNaN → notFound()`, empty result → `notFound()`.
- `lib/queries/dashboard.ts` and `lib/queries/search.ts` — read queries live in `lib/queries/`, not inline in pages; `Promise.all` for independent reads.
- Neon `neon-http` driver — no `db.transaction()`; irrelevant here since everything is read-only.

## Goals / Non-Goals

**Goals:**
- Read-only detail page at `/customers/{id}` visually matching `CustomerForm.tsx`.
- Edit button replacing "Save Changes", leading to the existing `/customers/form?id=`.
- Orders card with the customer's full order history, newest first.
- Reach the page by clicking a customer's name on the list.

**Non-Goals:**
- No schema changes, migrations, or new server actions (no writes at all).
- No order filtering, pagination, sorting controls, or expandable line items in v1.
- Not repointing global search results to the new page (separate one-line follow-up).
- No changes to the edit form or its actions.

## Decisions

**1. Route: `app/(dashboard)/customers/[id]/page.tsx`, not `?id=` on `/customers/form`.**
Matches `design-variant/[id]`, gives clean shareable URLs, and keeps the form route dedicated to editing. The `/customers/form` static segment wins over `[id]`, so no collision. Alternative: a `?view=1` mode on the form route — rejected; it overloads one page with two jobs.

**2. Server component, no client JS.**
Everything is static display; the only interactivity is links. Params are awaited (`params: Promise<{ id: string }>`), as the design-variant page does. Alternative: reuse `CustomerForm` with a `readOnly` prop — rejected; disabled inputs look editable, and the form is a client component with `useActionState`, so it would drag client code into a read-only page.

**3. Layout duplicated from `CustomerForm.tsx`, not extracted into shared components.**
Copy the section headings and grid classes so the two pages match; render values as label + text. Extracting shared layout primitives now is premature for two consumers. Trade-off: styling drift risk if the form's classes change (see Risks).

**4. Queries in `lib/queries/customers.ts`.**
- `getCustomerById(id)` — single select, `.limit(1)`, returns the row or `null`.
- `getCustomerOrders(customerId)` — select from `orders` where `customerId`, `orderBy desc(orders.createdAt)`, with `itemCount` computed via a `LEFT JOIN order_items … GROUP BY orders.id` and `count(order_items.id)`. A left join ensures orders with zero items still appear with count 0.
The page calls both with `Promise.all`. Alternative: fetch orders then a second grouped query on `order_items` `inArray` (what the Orders list does) — rejected here because only a count is needed, so one aggregate query is simpler. The orders read is skipped implicitly by `notFound()` only after the customer lookup resolves; running them in parallel wastes one cheap query for invalid ids, which is acceptable.

**5. Shared order-status styling via a small constants module.**
`STATUS_CLASSES` / `STATUS_LABELS` are currently private to `OrderRow.tsx` (a `"use client"` file). Move them to `constants/orderStatus.ts` (alongside the existing `constants/StatesArray`) and import them in both `OrderRow.tsx` and the new orders card so badges are identical and there is one source of truth. Alternative: copy the maps — rejected; two copies will drift when a status is added. This touches `OrderRow.tsx`, so impact analysis must be run on it before editing.

**6. Orders card rendered as a table on `md+`, stacked cards below.**
Same responsive split as the Customers list (`hidden md:block` / `md:hidden`). Each order row is a `Link` to `/orders/form?id={orderId}`. Columns: Order #, Placed, Status, Items, Total, Est. delivery (`—` when null). Currency uses `Number(totalPrice).toFixed(2)` like `OrderRow`.

**7. List entry point: link the name cell only.**
Wrap the avatar + name in a `Link` to `/customers/{id}` in both the desktop and mobile layouts. The row stays non-clickable as a whole because it already contains `mailto:`/`tel:` links and the Edit button; a full-row click target would conflict with them. The Edit button keeps going straight to the form.

**8. Empty state includes "Add Order".**
Links to `/orders/form`. Pre-selecting the customer is not attempted in v1 (see Open Questions).

## Risks / Trade-offs

- **[Styling drift between form and detail page]** → Both use the same Tailwind section/grid classes copied verbatim; a note in the page's header comment is not needed, but any future form restyle should check this page. Extract shared primitives if a third consumer appears.
- **[Large order history on one page]** → No pagination in v1. Customer order counts are small for this shop; add a limit + "show all" if a customer ever exceeds a few dozen orders.
- **[Editing `OrderRow.tsx` to extract constants]** → Small blast radius (removing two module-level consts, adding an import), but it is an existing execution flow; run `gitnexus_impact` on `OrderRow` first and verify the Orders list still renders identical badges.
- **[Redundant orders query on invalid id]** → One extra cheap indexed read when the customer doesn't exist; accepted to keep both reads parallel.
- **[Route naming]** → `/customers/{id}` could be confused with `/customers/form`; guarded by static-segment precedence, verified manually in tasks.

## Migration Plan

Purely additive: one new route, one new query module, one new constants module, and small edits to two existing files. No data migration. Rollback is reverting the commit; nothing persistent changes.

## Open Questions

- Should the empty-state **Add Order** button pre-select this customer on the order form? Requires reading a `customerId` query param in the order form — deferred unless wanted.
- Should the global search bar's Customer results link to `/customers/{id}` instead of the edit form? Deferred as a separate one-line change.
- Should order rows eventually expand to show line items like the Orders list? Deferred; v1 is summary-only.
