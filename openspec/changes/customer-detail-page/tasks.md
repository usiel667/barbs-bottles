## 1. Shared order-status constants

- [x] 1.1 Run `gitnexus_impact` on `OrderRow` (upstream) and report blast radius before editing
- [x] 1.2 Create `constants/orderStatus.ts` exporting `STATUS_CLASSES` and `STATUS_LABELS` (moved verbatim from `app/(dashboard)/orders/OrderRow.tsx`)
- [x] 1.3 Update `OrderRow.tsx` to import them from the new module and delete the local copies; confirm the Orders list badges are unchanged

## 2. Customer queries

- [x] 2.1 Create `lib/queries/customers.ts` with `getCustomerById(id: number)` — select from `customers`, `.limit(1)`, return the row or `null`
- [x] 2.2 Add `getCustomerOrders(customerId: number)` — select from `orders` [[In_Progress_Features]](id, status, totalPrice, estimatedDelivery, createdAt) with `count(order_items.id)` as `itemCount` via `leftJoin` + `groupBy(orders.id)`, `where customerId`, `orderBy desc(orders.createdAt)`

## 3. Detail page

- [x] 3.1 Create `app/(dashboard)/customers/[id]/page.tsx` as a server component: `await params`, `parseInt`, `isNaN → notFound()`
- [x] 3.2 Load customer and orders with `Promise.all`; `notFound()` when the customer is `null`
- [x] 3.3 Render the page header ("Customer", `{firstName} {lastName}` subtitle, "Back to Customers" button) matching `CustomerForm.tsx`
- [x] 3.4 Render the customer card with Personal Information, Address, and Additional Information sections as read-only text using the form's section headings and grid classes (email `mailto:`, phone `tel:`, "No email"/"No phone" placeholders, address2 only when present, full state name via `StatesArray`, notes, Active/Inactive badge)
- [x] 3.5 Add the Edit button (`bg-blue-600 hover:bg-blue-700 text-white`) in the form's "Save Changes" position, linking to `/customers/form?id={id}`

## 4. Orders card

- [x] 4.1 Render the Orders card below the customer card with title "Orders ({count})"
- [x] 4.2 Desktop table (`hidden md:block`): Order #, Placed, Status badge (from `constants/orderStatus.ts`), Items, Total (`$` + `toFixed(2)`), Est. delivery (dash when null); each row a link to `/orders/form?id={orderId}`
- [x] 4.3 Mobile stacked cards (`md:hidden`) showing the same fields, each linking to the order
- [x] 4.4 Empty state: "No orders yet for this customer." with an Add Order button linking to `/orders/form`

## 5. Customers list entry point

- [x] 5.1 Run `gitnexus_impact` on the customers list page component (upstream) before editing
- [x] 5.2 In `app/(dashboard)/customers/page.tsx`, wrap the avatar + name in a `Link` to `/customers/{id}` in the desktop table row
- [x] 5.3 Do the same in the mobile card list; leave the Edit buttons pointing at `/customers/form?id={id}`

## 6. Verification

- [x] 6.1 Run `npx tsc --noEmit` and `npx eslint` on the changed files; fix anything reported
- [ ] 6.2 Manually test: clicking a name on the list (desktop and mobile widths) opens `/customers/{id}`; the row Edit button still opens the form directly
- [x] 6.3 Manually test: detail page fields match the edit form for a customer with all fields filled, and for one missing email, phone, and address line 2
- [x] 6.4 Manually test: Edit button opens `/customers/form?id={id}` pre-filled; Back to Customers returns to the list; `/customers/form` still opens the create form
- [x] 6.5 Manually test: a customer with several orders shows all of them newest first with correct item counts, totals, status badges, and dash for missing delivery date; clicking a row opens that order's edit page
- [ ] 6.6 Manually test: a customer with no orders shows the empty state and Add Order opens `/orders/form`; an order with zero items shows item count 0
- [x] 6.7 Manually test: `/customers/99999` and `/customers/abc` show the not-found page
- [x] 6.8 Manually test: Orders list page badges look identical to before the constants extraction
- [x] 6.9 Run `gitnexus_detect_changes()` before committing to confirm only expected symbols/flows are affected
