## Why

Clicking a customer today goes straight to the edit form, so there is no safe, read-only view of a customer and no way to see what that customer has ordered without leaving for the Orders list and scanning it. A dedicated customer page gives a single place to review a customer's details and full order history, with editing one deliberate click away.

## What Changes

- Add a read-only customer detail page at `/customers/{id}` (`app/(dashboard)/customers/[id]/page.tsx`), rendered as a server component under the existing `(dashboard)` auth guard.
- The page mirrors the layout of `CustomerForm.tsx` — same Personal Information / Address / Additional Information sections and grid — but shows values as text (email/phone as `mailto:`/`tel:` links, full state name, Active/Inactive badge) instead of inputs.
- Where the form's "Save Changes" button sits, the page shows an **Edit** button linking to `/customers/form?id={id}`. A "Back to Customers" button sits in the header.
- Add an **Orders** card below the customer card listing all of the customer's past and current orders, newest first: order #, placed date, status badge, item count, total, estimated delivery. Each row links to `/orders/form?id={orderId}`. Empty state shows a message and an **Add Order** button. Collapses to stacked cards below `md`.
- On the Customers list (`customers/page.tsx`), the customer's name (avatar + name) becomes a link to `/customers/{id}` in both the desktop table and mobile card list. The existing row **Edit** button is unchanged.
- Unknown or non-numeric ids return `notFound()`.

## Capabilities

### New Capabilities
- `customer-detail-view`: Read-only customer detail page — route, entry point from the Customers list, read-only field display mirroring the edit form, Edit button, not-found handling.
- `customer-order-history`: The Orders card on the detail page — which orders are listed, ordering, columns, row links, empty state, responsive behavior, and the query that backs it.

### Modified Capabilities
(none — no existing specs are tracked yet for customers or orders)

## Impact

- **UI**: new `app/(dashboard)/customers/[id]/page.tsx`; small edit to `app/(dashboard)/customers/page.tsx` to link the name cell (desktop + mobile).
- **Queries**: new read-only query module (e.g. `lib/queries/customers.ts`) fetching a customer by id and that customer's orders with a per-order item count.
- **DB**: read-only queries against existing `customers`, `orders`, and `order_items` — no schema changes or migrations.
- **Routing**: adds `/customers/[id]`; no conflict with `/customers/form` (static segments take precedence).
- **Out of scope**: pointing the global search bar's Customer results at the new page (one-line change in `lib/queries/search.ts`, decide separately); expandable line items on order rows; order filtering.
