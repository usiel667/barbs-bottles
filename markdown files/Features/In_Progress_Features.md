# In Progress Features

Features currently being planned or built.

---

## In Progress

### Global Search Bar ✅ 2026-08-24

**Status:** Implemented and manually verified on branch `search-feature` (`openspec/changes/global-search-bar`). Not yet committed/merged.

**Location:** `components/Header.tsx` — always-visible text input in the header's right-hand group, positioned to the left of `ModeToggle` (day/night toggle), right of the nav links. Hidden below the `md:` breakpoint to match the existing nav's responsive behavior.

**Scope:** Global search across Customers, Products, and Orders in one box.

**Matched fields (per entity):**
- **Customers** — first/last name, email, phone, address1/address2, city, notes
- **Products** — product name, design name, series name, size code/description, product description (one result per matching design variant)
- **Orders** — status, shipping address, design notes, joined customer name, plus exact match on order id when the query is numeric

**Result UI:** Live dropdown under the search box as the user types, results grouped by entity type (Customers / Products / Orders — only non-empty groups render), each result linking directly to that record's edit page (`/customers/form?id=`, `/products/design-variant/{id}`, `/orders/form?id=`). Loading state while a request is in flight; a single "no results" message when all groups are empty; an overflow indicator per group when results exceed the cap.

**Execution:** `lib/queries/search.ts` — a `"use server"` `searchAll()` action running three `Promise.all`'d Drizzle queries (`ILIKE` per field, `.limit(6)`, capped to 5 displayed with a `hasMore` flag). Debounced ~300ms via a small custom `lib/hooks/useDebouncedValue.ts` hook (no new dependency).

**Resolved (were open items before implementation):**
- Minimum query length: 2 characters, enforced both client- and server-side
- Loading state: shown immediately once the query hits 2 characters (not just once the debounced request fires); empty state is a single centered message
- Keyboard navigation: Arrow Up/Down highlights across the flattened Customers→Products→Orders list, Enter navigates, Escape closes + blurs; click-outside closes via a container ref + `mousedown` listener
- Debounce: custom hook, not a library
- Result caps: per-group (top 5 each, independent), with a text overflow indicator rather than an exact count

**Deferred (not v1):** Fuzzy/typo-tolerant matching (`pg_trgm`) — see design.md's Non-Goals; straightforward to add later without touching the UI layer.
