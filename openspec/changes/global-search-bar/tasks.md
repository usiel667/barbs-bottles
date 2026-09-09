## 1. Types and shared shapes

- [x] 1.1 Define `SearchResult` types (e.g. in a new `lib/search-types.ts` or colocated with the action): `CustomerResult`, `ProductResult`, `OrderResult`, each with `id`, display label(s), and `href`, plus a `GroupedSearchResults` shape with a `hasMore` flag per group

## 2. Server search action

- [x] 2.1 Create `app/actions/search.ts` (or equivalent colocated `"use server"` module) with a `searchAll(query: string)` function
- [x] 2.2 Enforce the 2-character minimum server-side — return an empty grouped result set without querying the DB for shorter/empty/whitespace-only queries
- [x] 2.3 Implement the customers query: `ILIKE` across firstName, lastName, email, phone, address1, address2, city, notes; `.limit(6)`
- [x] 2.4 Implement the products query: join `productDesigns` → `products` → `productSeries`/`bottleSizes`; `ILIKE` across product name, design name, series name, size code/description, product description; `.limit(6)`
- [x] 2.5 Implement the orders query: join `orders` → `customers`; `ILIKE` across status, shippingAddress1/2, shippingCity, designNotes, and joined customer first/last name; OR in an exact `eq(orders.id, n)` when the trimmed query parses as an integer; `.limit(6)`
- [x] 2.6 Run all three queries via `Promise.all`, trim each result set to 5 with a `hasMore` flag derived from the 6th row's presence
- [x] 2.7 Map each row to its `SearchResult` shape with the correct `href` per the design (`/customers/form?id=`, `/products/design-variant/{designId}`, `/orders/form?id=`)

## 3. Debounce hook

- [x] 3.1 Add a small `useDebouncedValue<T>(value: T, delayMs: number)` hook (e.g. in `lib/hooks/useDebouncedValue.ts`) using `useEffect` + `setTimeout`, no new dependency

## 4. SearchBar component

- [x] 4.1 Create `components/SearchBar.tsx` as a client component with input state, debounced value, loading flag, open/closed state, results state, and highlighted-index state
- [x] 4.2 Wire the debounced value to call the `searchAll` server action when it changes and its length is ≥ 2, guarding against out-of-order responses (e.g. request-id/AbortController check) so a slow earlier response can't overwrite a newer one
- [x] 4.3 Render the dropdown: loading state while a request is in flight, "no results" message when all groups are empty, grouped result lists (only non-empty groups) otherwise
- [x] 4.4 Render each group with its results and an overflow indicator when that group's `hasMore` is true
- [x] 4.5 Implement Arrow Up/Down to move the highlighted index across the flattened (Customers → Products → Orders) result list, wrapping or clamping at the ends
- [x] 4.6 Implement Enter to navigate to the highlighted result's `href` (via `next/navigation` router or a plain `Link` ref click)
- [x] 4.7 Implement Escape to close the dropdown and blur the input
- [x] 4.8 Implement click-outside-to-close via a container `ref` and a `document` `mousedown` listener in `useEffect`, cleaned up on unmount

## 5. Header integration

- [x] 5.1 Import and render `SearchBar` in `components/Header.tsx`, placed in the right-hand flex group before `ModeToggle`
- [x] 5.2 Verify layout at the existing `md:` breakpoint used by the nav links — confirm the search bar doesn't overlap or break the header on small viewports (resolve the open question from design.md: collapse vs. always-visible on mobile)

## 6. Verification

- [x] 6.1 Manually test: typing 1 character does not trigger a request; 2+ characters does, after the debounce delay
- [x] 6.2 Manually test: search matching each entity type independently, and a query matching more than one entity type at once
- [x] 6.3 Manually test: a query matching more than 5 results in one group shows the cap + overflow indicator
- [x] 6.4 Manually test: numeric query matching an order id surfaces that order
- [x] 6.5 Manually test: keyboard navigation (arrows, Enter, Escape) and click-outside dismissal
- [x] 6.6 Manually test: selecting each result type navigates to the correct existing edit page and pre-fills as expected
- [x] 6.7 Run `gitnexus_detect_changes()` before committing to confirm only expected symbols/flows are affected
