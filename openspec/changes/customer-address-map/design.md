## Context

`CustomerDetailsCard.tsx` (a server component) renders the customer's address in `AddressSection` as stacked `Field`s, with City / State / Zip in a 3-across row. There is no map, no map provider, no `NEXT_PUBLIC_*` env var, no CSP header, and no `<dialog>` usage anywhere in the app. The `customers` table stores `address1`, `address2`, `city`, `state` (2-letter code), and `zipCode`; `address1`, `city`, `state`, and `zipCode` are `NOT NULL`, so every customer has a complete address by schema.

Decisions already made with the user (see `markdown files/Features/In_Progress_Features.md`): Google Maps Embed API as the provider; City/State/Zip all stacked in one left column; expand opens a large overlay; customers only for now (order maps and package tracking are later phases).

Constraint from the fallow audit: the repo has no tests, so fallow's CRAP score fails any function with cyclomatic complexity ≥ 5. Every new function needs to stay small.

## Goals / Non-Goals

**Goals:**
- Map of the customer's address beside the address fields on `/customers/[id]`, expandable to a large overlay.
- A reusable `AddressMap` component that Phase 2 (order delivery locations) can use with a different address, without changes to the component.
- No schema change, no new npm dependency, no coordinate storage.

**Non-Goals:**
- Order maps, package tracking, multi-marker maps, routes (later phases).
- Map on the edit form or the Customers list.
- Geocoding, stored latitude/longitude, or detecting whether Google could locate the address.
- Dark-mode map tiles (the Embed API has no theme option).

## Decisions

**1. Google Maps Embed API, "place" mode, via iframe.**
URL shape: `https://www.google.com/maps/embed/v1/place?key={KEY}&q={encoded address}&zoom=15`. Google geocodes the `q` string itself, so no geocoding service, coordinates, or dependency is needed. Alternative: Mapbox / Leaflet — rejected for Phase 1 (needs geocoding + stored coordinates + a new dependency); the provider choice is isolated to `lib/maps.ts` and the iframe in `AddressMap`, so a later swap doesn't touch callers.

**2. Address string: `address1, city, state zip` — address line 2 excluded.**
Apartment/suite text tends to confuse geocoding, and the map only needs street-level accuracy. Formatting lives in `formatAddress()` in `lib/maps.ts` (state as the 2-letter code, e.g. "456 Wellness St, San Francisco, CA 94105"). Phase 2 can pass an order's `shipping*` fields into the same helper.

**3. The API key is read on the server, not exposed via `NEXT_PUBLIC_`.**
`getMapEmbedUrl(address)` in `lib/maps.ts` reads `process.env.GOOGLE_MAPS_EMBED_KEY` and returns the full URL or `null` when the key is missing. `AddressSection` (server) calls it and passes `embedUrl: string | null` to the client `AddressMap`. The key still ends up in the iframe `src` the browser loads (unavoidable for the Embed API), so secrecy isn't the reason — the reason is that the env var is read at request time, needs no dev-server restart quirks of build-time inlining, and the client component stays provider-agnostic (it just receives a URL). Security therefore rests on restricting the key in Google Cloud (HTTP referrers + Maps Embed API only).

**4. `AddressMap` is a client component with two pieces of state at most: `open`.**
Props: `{ embedUrl: string | null; address: string }`. Renders `MapUnavailable` when `embedUrl` is null; otherwise the inline map with an expand button and a `<dialog>` for the overlay. Split into small components (`MapFrame`, `MapUnavailable`, and the main `AddressMap`) so each function stays under the complexity threshold.

**5. Overlay: native `<dialog>` with `showModal()`.**
No dependency, focus trapping and Escape handling come free. The expand button's click handler sets `open = true` and calls `dialogRef.current?.showModal()`; the dialog's `close` event (fired by Escape, the close button's `dialog.close()`, or a backdrop click that calls `close()`) sets `open = false`. No `useEffect` is involved, which avoids the `react-hooks/set-state-in-effect` lint rule that bit `SearchBar`. Backdrop click: an `onClick` on the `<dialog>` closes it when `event.target === event.currentTarget` (the inner content wrapper fills the dialog so only the `::backdrop` area produces that target).

**6. The overlay iframe only mounts while open.**
The expanded `MapFrame` renders only when `open` is true, so the page doesn't load two Google iframes on first paint. Closing unmounts it.

**7. Layout: two-column grid on `md+`, stacked below.**
`AddressSection` becomes `grid gap-6 md:grid-cols-2`: left cell is the existing single-column `Field` stack (Address 1, Address 2 when present, City, State, Zip); right cell is the `AddressMap`, `h-64` on mobile and stretching to the left column's height (with a `min-h-64`) on desktop. The old inner 3-across `md:grid-cols-3` row is removed.

**8. Missing key → "Map unavailable" placeholder; "can't geocode" is Google's own message.**
Because the map is a cross-origin iframe, the app cannot tell whether Google located the address. If Google can't find it, the iframe shows Google's own "can't find" text. The app's own fallback therefore only covers the cases it can detect: the key is unset (local dev without a key, or a Vercel deploy missing the variable). Address completeness is not a case — the schema guarantees the required parts. This corrects the earlier draft in `In_Progress_Features.md`, which promised an app-level "Location not found".

**9. Accessibility and iframe attributes.**
`title="Map of {address}"`, `loading="lazy"`, `referrerPolicy="no-referrer-when-downgrade"` (Google's recommendation for referrer-restricted keys), expand and close buttons with `aria-label`s.

## Risks / Trade-offs

- **[Address sent to Google]** The customer's street address is disclosed to a third party to render the map → acceptable for this business tool; note it next to the existing Sentry PII item in `Home.md`'s production checklist; revisit if a privacy policy is added.
- **[API key visible in page source]** Unavoidable for the Embed API → restrict the key to HTTP referrers (localhost + production domain) and to the Maps Embed API only; Embed usage is free, so abuse risk is low.
- **[Key not set in production]** Deploy would show "Map unavailable" everywhere → the fallback makes this non-breaking; tasks include adding the variable to Vercel and verifying.
- **[Google can't find an address]** The user sees Google's message inside the frame → cannot be detected from the app; the text address remains beside it, so nothing is lost.
- **[Embed API limits]** Single place only, no custom markers/routes → fine for Phase 1; Phases 2–3 may need Maps JS API or Mapbox, and the provider is isolated behind `lib/maps.ts` + `AddressMap`.
- **[No CSP today]** Nothing blocks the iframe now → if a CSP is added later, `frame-src https://www.google.com` is required.
- **[Function complexity]** fallow fails functions with cyclomatic ≥ 5 (0% coverage) → keep components and helpers small; re-run fallow `audit` after building.

## Migration Plan

1. Create a Google Cloud project, enable the **Maps Embed API**, and create an API key restricted to HTTP referrers (`http://localhost:3000/*` plus the production domain) and to the Maps Embed API only. (User action — needs a billing account on the project even though Embed usage is free.)
2. Add `GOOGLE_MAPS_EMBED_KEY` to `.env.local` and to the Vercel project's environment variables.
3. Ship the code. Rollback is reverting the commit; nothing persistent changes (no migration, no data).

## Open Questions

- Exact map heights and expanded-overlay size — start with `h-64` inline, `min-h-64` stretch on desktop, and an overlay of `w-[90vw] max-w-5xl h-[80vh]`; adjust after seeing it.
- Zoom level — start at 15 (street level); adjust if it looks too tight or loose.
