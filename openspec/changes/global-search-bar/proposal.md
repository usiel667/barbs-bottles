## Why

There is currently no way to jump to a specific customer, product design, or order without navigating to that list page and scanning/filtering manually. As the catalog and order history grow, finding a specific record by name, email, order id, or design name becomes slower. A global search bar in the header gives instant, cross-entity lookup from anywhere in the app.

## What Changes

- Add an always-visible search input to `components/Header.tsx`, positioned in the header's right-hand group, to the left of `ModeToggle` (day/night toggle) and right of the nav links.
- Typing (after a minimum query length) fires a debounced (~300ms) server-side search across Customers, Products, and Orders.
- Search matches:
  - **Customers** — first name, last name, email, phone, address1/address2, city, notes
  - **Products** — product name, design name (`product_designs.name`), series name, size code/description, product description
  - **Orders** — order id (numeric/exact), status, customer name (joined), shipping address, design notes
- Results render as a live dropdown under the search box, grouped by entity type (Customers / Products / Orders), each entry linking directly to that record's edit page (`/customers/form?id=`, `/products/design-variant/[id]`, `/orders/form?id=`).
- Dropdown supports keyboard navigation (arrow keys + Enter to select) and closes on click-outside or Escape.
- Each group is capped (e.g. top 5 results) to keep the dropdown short, with an indicator when a group's results are truncated.

## Capabilities

### New Capabilities
- `global-search`: Header search input, debounced query flow, and live grouped-dropdown result UI/keyboard interaction.
- `search-query-action`: Server-side search action that queries Customers, Products, and Orders via `ILIKE`/exact-id matching across the fields above, returning a capped, grouped, ranked result set.

### Modified Capabilities
(none — no existing specs are tracked yet for header/navigation or search)

## Impact

- **UI**: `components/Header.tsx` — new search input; new `components/SearchBar.tsx` (or similar) client component for input state, debounce, dropdown rendering, and keyboard handling.
- **Server actions**: new search action (e.g. `app/actions/search.ts` or colocated under an existing dashboard actions file) querying `customers`, `products` (joined to `productDesigns`, `productSeries`, `bottleSizes`), and `orders` (joined to `customers`).
- **DB**: read-only queries against existing tables — no schema changes required.
- **Routing**: no new routes; result links reuse existing edit-page URLs.
