## Context

The app has three list pages (Customers, Products, Orders) with no cross-entity search — finding a record means navigating to its list page and scanning. `components/Header.tsx` is a client component (`"use client"`) already rendering nav links, `ModeToggle`, and a logout button in a flex row; the search bar slots into that same right-hand group. There's no existing debounce utility or search infra in the codebase (`lib/utils.ts` only has `cn`, `formatPrice`, `formatDate`), and no dependencies like `lodash` or `use-debounce` are installed — the project's fallow audits have flagged unused dependencies before, so this design avoids adding a new package for a ~10-line debounce.

## Goals / Non-Goals

**Goals:**
- Fast, low-friction lookup of a customer, product design, or order from anywhere in the dashboard.
- Keep query load light — debounce, minimum query length, and per-group result caps.
- Reuse existing edit-page routes as result destinations; no new pages.

**Non-Goals:**
- Full-text/fuzzy search or ranking beyond simple relevance ordering (exact/prefix matches first). `ILIKE '%term%'` is sufficient at this data scale.
- Search history, recent-searches, or saved searches.
- Keyboard shortcut to focus the search box (e.g. `/` or `Cmd+K`) — can be a fast-follow, not required for v1.
- Searching soft/hard-deleted or inactive records differently than active ones — inactive customers/products/orders are still searchable (matches existing list-page behavior, which shows inactive records too).

## Decisions

### Debounce: custom hook, no new dependency
A small `useDebouncedValue<T>(value, delayMs)` hook (colocated in `components/SearchBar.tsx` or `lib/hooks/`) wraps the input value with a 300ms delay via `useEffect` + `setTimeout`. Simpler than pulling in `use-debounce` for one call site, and matches the project's existing preference (per prior fallow audits) to avoid unused/marginal dependencies.

### Minimum query length: 2 characters
Below 2 characters, no request fires and the dropdown stays closed. Avoids a flood of near-empty-string `ILIKE '%%'`-style queries that would return large, useless result sets. 2 chars balances responsiveness against noise (1 char is too broad for a several-hundred-row table).

### Search execution: one server action, three queries, no `db.batch`
A single `"use server"` action (e.g. `app/actions/search.ts`) runs three independent `db.select()` queries (customers, products joined to productDesigns/productSeries/bottleSizes, orders joined to customers) in parallel via `Promise.all`. Not using `db.batch()` here — batch is for atomic writes; these are independent reads with no transactional requirement, and `neon-http` handles parallel reads fine without it.

**Alternative considered**: a single UNION query across all three tables. Rejected — the three tables have different shapes/columns to search and different result-link formats; three targeted queries are simpler to read, tune, and cap independently than a UNION with padded/nullable columns.

### Order id matching
`orders.id` is a serial integer with no other free-text order identifier. If the trimmed query is a valid integer, add an exact-match `eq(orders.id, n)` OR-ed into the order query's where clause alongside the text-field `ILIKE`s; non-numeric queries skip the id comparison. This lets `"42"` find order #42 without every numeric-looking substring falsely matching unrelated text fields.

### Per-group result cap: top 5 each, with a "+N more" indicator
Each of the three queries takes `.limit(5)` (plus a `.limit(6)` trick — fetch 6, show 5, use the 6th's presence to know there are more — to render "+N more, refine your search" text without a second COUNT query). Caps apply independently per group, not as one combined cap across all 30 max results, so a strong Customers match doesn't crowd out Products/Orders.

### Dropdown state, loading, and empty states
`SearchBar.tsx` (client component) owns: raw input value, debounced value, open/closed state, loading flag (set on request start, cleared on response/error), and results. States:
- Query < 2 chars: dropdown closed.
- Query ≥ 2 chars, request in flight: dropdown open, shows a lightweight loading state (e.g. skeleton rows or a spinner per group) rather than flashing empty→populated.
- Request resolved, all three groups empty: dropdown open with a single "No results for '<query>'" message.
- Request resolved, ≥1 group has results: dropdown open, only non-empty groups render (an empty Products group isn't shown just because Customers matched).

### Keyboard navigation and dismissal
Arrow Up/Down move a highlighted index across the flattened, ordered result list (Customers group, then Products, then Orders); Enter navigates to the highlighted result's link; Escape closes the dropdown and blurs the input. Click-outside closes the dropdown via a `useEffect` + `mousedown` listener on `document`, checking a `ref` on the search container — same pattern as other dismissible-dropdown UI would use in this codebase (no existing example to match, so this follows the standard React click-outside idiom).

### Result link targets
- Customer → `/customers/form?id={id}`
- Product design → `/products/design-variant/{productDesigns.id}` (edits that specific variant, consistent with the existing design-variant editor from the catalog restructure)
- Order → `/orders/form?id={id}`

## Risks / Trade-offs

- **[Risk]** `ILIKE '%term%'` on unindexed text columns does a sequential scan per query → could get slow as tables grow. **Mitigation**: at current/expected data volume (dozens–low hundreds of rows per table) this is a non-issue; if it becomes one, add btree/trigram indexes on the searched columns rather than changing the query shape.
- **[Risk]** Three separate queries per keystroke (even debounced) is more DB load than one query. **Mitigation**: debounce + 2-char minimum already bound request frequency; `Promise.all` keeps latency to the slowest single query, not the sum.
- **[Risk]** Joining products → productDesigns → productSeries/bottleSizes for every search could return one row per design (a product with 79 designs surfaces 79 candidate rows before the `.limit(5)` trims it). **Mitigation**: apply the `ILIKE`/limit at the productDesigns-joined level (the query already targets design name specifically), so the DB does the trimming, not application code.
- **[Trade-off]** No fuzzy matching means typos won't surface results (e.g. "Reeder" won't find "Reader"). Accepted for v1 given the non-goal above; Postgres trigram search (`pg_trgm`) is a documented future option if this becomes a real pain point.

## Migration Plan

No data migration — read-only feature against existing tables. Rollout is a single deploy: merge the branch, no feature flag needed since the search bar is purely additive UI with no impact on existing flows if it's unused.

**Rollback**: revert the merge commit; no schema/data changes to unwind.

## Open Questions

- Should the search box collapse to icon-only on small/mobile viewports, given the header's nav already hides behind `md:` breakpoints? (Header currently shows nav as `hidden md:flex` — the search bar's mobile behavior isn't specified yet.)
- Should there be a `Cmd+K` / `/` global keyboard shortcut to focus the search box? Deferred as a non-goal for v1 but worth revisiting.
