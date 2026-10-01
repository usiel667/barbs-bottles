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

---

### Address Maps (customer page → orders → package tracking)

**Status:** ✅ Phase 1 built and manually verified 2026-09-27 on branch `customer-detail-page` (`openspec/changes/customer-address-map`). Not yet committed/merged. `tsc`, `eslint`, and the fallow audit all pass with 0 new findings.

**Big picture:** Show addresses on a map across the app. Rather than three unrelated features, build **one reusable `AddressMap` component** and use it in three phases. Phase 1 is the first thing to build; Phases 2 and 3 are recorded here so the component is designed for them, but are separate changes.

| Phase | Where | What | Depends on |
|-------|-------|------|------------|
| 1 | Customer detail page (`/customers/[id]`) | Map of the customer's address, beside the address fields, expandable | `AddressMap` component + map provider decision |
| 2 | Orders (order form / customer's Orders card) | Map of an order's delivery location, including past/delivered orders | Phase 1 component; reads the order's `shipping*` fields (which can differ from the customer's address) |
| 3 | Orders | Package-in-transit tracking (live position / route) | A carrier tracking data source — **not available today**; separate feature |

**Standalone vs. integrated — recommendation:** integrate Phases 1 and 2 through the shared component (same props, same expand behavior, only the address source differs). Keep Phase 3 standalone: it needs external carrier data (the `orders.trackingNumber` column exists, but nothing turns a tracking number into locations) and likely a different kind of map (route/markers), so it should get its own spec once a carrier API is chosen.

#### Phase 1 — Customer address map ✅ built 2026-09-27

**Location:** `app/(dashboard)/customers/[id]/CustomerDetailsCard.tsx`, in `AddressSection`. Built as `components/AddressMap.tsx` (reusable client component; takes `{ embedUrl, address }`, not a customer) plus `lib/maps.ts` (`formatAddress`, `getMapEmbedUrl` — server-side, reads `GOOGLE_MAPS_EMBED_KEY`).

**Layout (desktop, `md+`):** the Address section is a two-column grid.
- **Left column:** the "Address" `<h2>` heading followed by `AddressFields` (Address Line 1, Address Line 2 when present, City, State, Zip Code, all stacked in one column — they used to sit in a 3-across row for City/State/Zip). The heading sits *inside* the grid's left cell (not above the grid) so its top edge sets the row's top.
- **Right column:** `AddressMap`, matching the left column's height exactly via CSS grid stretch — verified with actual bounding rects that the map's top edge equals the heading's top edge, and the map's bottom edge equals the fields' bottom edge (height 224px, both columns identical top and bottom) after two fixes (see Bugs fixed below).
- **Mobile (`< md`):** map stacks below the address fields at a fixed height (`h-64`).

**Behavior — all manually verified with a real Google Maps Embed key:**
- Map centers on and marks the customer's address (Address 1 + City + State + Zip — Address 2 is left out of the map query, see design.md).
- **Expandable:** an expand button (top-right of the inline map) opens the map in a large overlay (native `<dialog>`, `showModal()`), rendered at `w-[90vw] max-w-5xl h-[80vh]`. Verified: close button, Escape, and clicking the dimmed backdrop all close it; clicking inside the map does not. The overlay's own iframe only mounts while open (confirmed via iframe count: 1 normally, 2 while the overlay is open) and is removed on close. Escape-close correctly returns focus to the expand button (real click only — a JS-synthesized `.click()` does not focus the element first, so that path didn't return focus in an early test; this is expected browser behavior, not a bug).
- If `GOOGLE_MAPS_EMBED_KEY` isn't set, the map area shows a "Map unavailable" placeholder with no expand button, and the rest of the page is unaffected — verified.
- Read-only; no map on the edit form in Phase 1.

**Bugs fixed during build:**
1. **Map not flush with the fields at both ends.** `AddressMap`'s wrapper had `md:min-h-64` (256px minimum), taller than the address fields' actual content (224px). Since a CSS grid row stretches to its tallest item, that forced the whole row to 256px: the map (which has a visible border) filled that completely, while the fields column — top-aligned via `content-start` — left 32px of invisible blank space below "Zip Code". It looked like the map didn't line up with the fields at the top. Fix: removed `md:min-h-64` from both the map and the "Map unavailable" placeholder, letting the row height come from the fields' real content; confirmed via `getBoundingClientRect()` that both columns were then exactly 224px with identical top and bottom edges.
2. **Map top didn't align with the top of the "Address" heading.** The `<h2>` sat above the two-column grid, so the grid (and therefore the map) started below it, at the top of the fields — not at the top of the heading. Fix: moved the heading inside the grid's left cell, above `AddressFields`, so the grid row (and the map that stretches to fill it) now starts at the heading's top. Confirmed via `getBoundingClientRect()`: heading top, map top, and fields-column top are all the same pixel value.

**Keep in mind (from the fallow audit):** every function must stay under cyclomatic complexity 5 (repo has no tests, so fallow's CRAP score fails anything higher). Keep `AddressMap` and the section components small — split rather than branch.

**Map provider:**

| Option | Needs | Pros | Cons |
|--------|-------|------|------|
| Google Maps **Embed API** (iframe, `q=address`) | API key (free; Google Cloud project needed) | No geocoding, no npm dependency, no schema change; simplest | Only a single-place view — no custom markers/routes, so Phase 3 would need a different provider or the Maps JS API |
| **Mapbox** GL JS | Access token (free tier) | Markers, routes, geocoding API; suits Phases 2–3 | New dependency; geocoding + likely storing coordinates |
| **Leaflet** + OpenStreetMap tiles | Nothing for tiles; a geocoder | Free, no key | Public OSM tile/Nominatim geocoder policies discourage production use; needs a geocoder + stored coordinates; new dependency |

**Decision (confirmed 2026-09-26): Google Maps Embed API.** Start Phase 1 with the Google Maps Embed iframe behind the `AddressMap` component's props (`address` in, nothing provider-specific out). It needs no schema change, no geocoder and no new dependency (the repo already carries 8 unused ones — see [[fallow-audit-2026-09-26]]). If Phase 3 later needs markers/routes, the provider swap is isolated inside `AddressMap`, the same way fuzzy search was kept isolated behind the search action.

**Data / schema:** none required for the Embed option. Mapbox/Leaflet would add `latitude`/`longitude` (geocoded on save) to `customers` and to `orders` (for shipping address), which is a migration and a change to the create/update actions.

**Privacy / security:** the customer's address is sent to the map provider to render the map. Restrict the API key by HTTP referrer, load it from a server-side env var, `GOOGLE_MAPS_EMBED_KEY` (the URL is built on the server and passed to the client component), and note it alongside the existing production-readiness items (Sentry PII review) in [[Home]].

#### Phase 2 — Orders map (planned, not spec'd yet)
- Map of an order's delivery location using the order's own `shipping*` fields (can differ from the customer's address); shown for past/delivered orders too.
- Candidate placements: the order form/edit page, and/or per-order in the customer page's Orders card. To decide when we get to it.

#### Phase 3 — Package-in-transit tracking (planned, not spec'd yet)
- Needs a tracking data source. Existing fields: `orders.trackingNumber`, `orders.estimatedDelivery`, `orders.status` (`shipped` / `delivered`).
- **Related earlier note:** `markdown/future-features/shipping-integration.md` (written 2026-07-28) plans a shipping-label feature using a carrier aggregator (EasyPost or Shippo), with a carrier roadmap of **USPS → FedEx → UPS**, and saving the tracking number against the order. Package tracking would naturally build on that — aggregators also provide shipment tracking — so Phase 3 should be planned together with (and after) that shipping-integration feature. That note is in the top-level `markdown/` folder, outside this Obsidian vault and not linked from [[Home]]; consider moving it under `markdown files/Features/`.
- Still open: which carrier(s) and aggregator to use — decide when we get to shipping integration. Until then the most a map can show is the destination plus status/ETA.

**Resolved (2026-09-26):**
1. **Layout** — City, State, and Zip all stack in one column on the left, map on the right.
2. **Expand** — opens a large overlay (modal).
3. **Provider** — Google Maps Embed API (needs a Google Cloud project + API key, restricted by HTTP referrer, kept in an env var).
4. **Scope** — customers only for now; Phases 2 and 3 are not part of the first OpenSpec change.
5. **Carriers / tracking** — deferred; see Phase 3 and `markdown/future-features/shipping-integration.md`.

**Still to decide:**
- ~~Whether every customer gets a map~~ — resolved: yes, always (the schema guarantees a complete address).
- ~~Exact map height, zoom, and expanded-overlay size~~ — built with the design.md starting values (zoom 15, `h-64` inline/mobile, `w-[90vw] max-w-5xl h-[80vh]` overlay); no complaints after seeing it, but easy to adjust.

**Mobile/tablet verified 2026-10-01:** tested on a real iPad over a temporary Cloudflare quick tunnel (`cloudflared tunnel --url http://localhost:3000`, required temporarily pointing `KINDE_SITE_URL`/`KINDE_POST_LOGIN_REDIRECT_URL`/`KINDE_POST_LOGOUT_REDIRECT_URL` at the tunnel URL and adding it to Kinde's allowed callback/logout URLs — reverted after testing). The iPad showed the map beside the fields, not below — expected, since iPad width (≥768px) is at/above the `md` breakpoint and gets the same side-by-side layout as desktop, matching the rest of the app's responsive convention. Page scroll and the Orders card both looked correct. User accepted this as sufficient; the `< md` stacked case (actual phone width) remains code-correct but visually unconfirmed.

**Not yet verified:**
- A customer with an Address Line 2 (none of the four seeded customers has one — the field is coded to hide when empty and to be excluded from the map query, but untested against real data).
- `GOOGLE_MAPS_EMBED_KEY` in Vercel's environment variables — not yet added (local `.env.local` only).
