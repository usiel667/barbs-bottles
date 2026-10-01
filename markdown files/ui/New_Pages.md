# New Pages

Planning notes for new pages to add to the app.

---

## Planned

### Customer Page (individual customer detail) ✅ 2026-09-27

**Status:** Implemented and committed on branch `customer-detail-page` (`openspec/changes/customer-detail-page`, commits `1f77c2e` and `ca55817`). Not yet merged. Now also has an address map on the Address section — see [[In_Progress_Features]].

**Purpose:** Each customer gets a dedicated read-only page, reached by clicking that customer's name on the Customers list. It looks like the Edit Customer page, but with an **Edit** button where "Save Changes" sits, and an **Orders** card at the bottom listing the customer's past and current orders.

**Route:** `app/(dashboard)/customers/[id]/page.tsx` → `/customers/{id}`
- Consistent with `/products/design-variant/[id]`; `/customers/form` still wins as a static segment (verified).
- Unknown or non-numeric id → `notFound()` (verified for `99999` and `abc`).

**Entry point (`customers/page.tsx`):** the avatar + name cell is now a `Link` to `/customers/{id}` on both the desktop table and the mobile card list. The row **Edit** button is unchanged and still goes straight to `/customers/form?id={id}`.

**As built — file layout (`app/(dashboard)/customers/[id]/`):**
- `page.tsx` — server component: awaits `params`, loads the customer and orders with `Promise.all`, renders the header (title, name, Back to Customers) plus the two cards.
- `CustomerDetailsCard.tsx` — Personal Information / Address / Additional Information as read-only text (`ContactField` for email/phone with `mailto:`/`tel:` and "No email"/"No phone" placeholders, `ActiveBadge`, address line 2 only when present, full state name via `StatesArray`, "No notes" placeholder), then the **Edit** button.
- `CustomerOrdersCard.tsx` — `Orders (n)` card: desktop table (`hidden md:block`), mobile stacked cards (`md:hidden`), empty state with **Add Order**. Each order row is fully clickable → `/orders/form?id={orderId}` (stretched link on desktop).
- Supporting new files: `lib/queries/customers.ts` (`getCustomerById`, `getCustomerOrders`, `CustomerOrder` type) and `constants/orderStatus.ts` (`STATUS_CLASSES` / `STATUS_LABELS`, moved out of `OrderRow.tsx` so the Orders list and this page share one set of badge styles).

**Orders query:** one `orders` → `LEFT JOIN order_items` `GROUP BY orders.id` query with `count(order_items.id)` as `itemCount`, `ORDER BY created_at DESC`. The left join keeps orders with zero items (count 0). Columns shown: Order #, Placed, Status badge, Items, Total, Est. Delivery (dash when null).

**Design decisions made along the way:**
- Sections are separated by a 2px divider (`border-t-2`, gray-300 / dark gray-600) with extra spacing (`space-y-8`, `pt-8`), and one above the Edit button. A first, lighter divider was too faint on the dark card, so it was strengthened at the user's request ("clear separation").
- The page was split into small components after the first fallow audit failed it (see below). fallow's CRAP score assumes 0% coverage since the repo has no tests, so any function with cyclomatic complexity ≥ 5 scores ≥ 30 and fails. Every function in the new files is kept under that.

**Resolved open questions (defaults taken):**
1. Only the name is a link on the list row (the row already contains `mailto:`/`tel:` links and the Edit button).
2. Orders card is order-level summary only — no expandable line items in v1.
3. The global search bar's Customer results still link to `/customers/form?id=`; switching them to `/customers/{id}` is a one-line change in `lib/queries/search.ts`, left as a follow-up.

**Verified in the browser (desktop, real data, including after the split into `CustomerDetailsCard`/`CustomerOrdersCard`):** name click → detail page; fields, placeholders, status badge; Edit → `/customers/form?id=`; `/customers/form` unaffected; orders with 0, 1, and 2 orders (newest first, correct counts/totals/badges/dash for missing delivery); empty state renders for a customer with 0 orders; full-row click opens the order; 404s for `99999` and `abc`; Orders list badges unchanged after the constants move; divider styling; the address map (see [[In_Progress_Features]] for map-specific verification).

**Not yet verified:**
- Mobile-width layout (name link, stacked order cards, stacked map) — the Chrome window couldn't be resized to test this.
- Clicking the empty-state **Add Order** button, and an order with zero line items (none exists in the data).
- A customer with an address line 2 (none of the four customers has one).

**Address map — done:** the Address section now shows a Google-Maps-Embed map to the right of the address fields (City/State/Zip stacked in one column on the left), expandable to a large overlay. Full build notes, the layout bug found and fixed, and what's still unverified are in [[In_Progress_Features]] under "Address Maps → Phase 1".

**Follow-ups noticed:**
- `lib/utils.ts` already exports `formatDate` and `formatPrice` (unused, flagged in [[fallow-audit-2026-08-02]]); `CustomerOrdersCard.tsx` defines its own equivalents. Consider reusing the shared ones.
- Pre-existing fallow complexity findings remain in `customers/page.tsx` (two row maps) and `OrderRow.tsx` — see [[fallow-audit-2026-09-26]].
