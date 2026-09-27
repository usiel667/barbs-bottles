## ADDED Requirements

### Requirement: Orders card on customer detail page
The customer detail page SHALL show an Orders card below the customer details card, titled "Orders" with the total number of that customer's orders, listing every order belonging to that customer regardless of status.

#### Scenario: Customer with orders
- **WHEN** a customer has orders in any status (pending through delivered or canceled)
- **THEN** all of them appear in the card and the title shows the total count, e.g. "Orders (3)"

#### Scenario: Only this customer's orders
- **WHEN** other customers also have orders
- **THEN** the card lists only orders whose customer is the one being viewed

#### Scenario: Newest first
- **WHEN** a customer has multiple orders
- **THEN** they are ordered by creation date, newest first

### Requirement: Order summary columns
Each order in the card SHALL show its order number, placed (created) date, status badge, item count, total price, and estimated delivery date.

#### Scenario: Full row
- **WHEN** an order is listed
- **THEN** the row shows order number, created date, status badge, number of items on the order, total formatted as dollars with two decimals, and estimated delivery date

#### Scenario: No estimated delivery
- **WHEN** an order has no estimated delivery date
- **THEN** the estimated delivery cell shows a dash

#### Scenario: Order with no items
- **WHEN** an order has zero line items
- **THEN** it is still listed, with an item count of 0

#### Scenario: Status badge consistency
- **WHEN** an order's status is shown
- **THEN** its label and colors are identical to the badge on the Orders list page, for every order status value

### Requirement: Order rows link to the order
Each order in the card SHALL link to that order's existing edit page.

#### Scenario: Open an order
- **WHEN** a user clicks an order row
- **THEN** the browser navigates to `/orders/form?id={orderId}`

### Requirement: Empty state
When the customer has no orders, the card SHALL show an empty-state message and an Add Order button instead of a table.

#### Scenario: No orders
- **WHEN** a customer has zero orders
- **THEN** the card shows "No orders yet for this customer." and an Add Order button linking to `/orders/form`

### Requirement: Responsive layout
The Orders card SHALL render as a table at the `md` breakpoint and above, and as stacked cards below it, without horizontal page scroll.

#### Scenario: Desktop
- **WHEN** the viewport is `md` or wider
- **THEN** orders render as table rows

#### Scenario: Mobile
- **WHEN** the viewport is narrower than `md`
- **THEN** each order renders as a stacked card showing the same information
