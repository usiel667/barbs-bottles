## Why

The customer detail page shows a customer's address only as text. Seeing where the customer actually is — for deliveries, pickups, or just sanity-checking a typo'd address — currently means copying the address into a separate maps tab. A map beside the address puts that context on the page, and building it as a reusable component sets up the same map for order delivery locations later.

## What Changes

- Add an `AddressMap` client component (`components/AddressMap.tsx`) that renders a Google Maps Embed iframe for a given address, with an expand control that opens the same map in a large overlay (native `<dialog>`).
- Rework the Address section of the customer detail page (`CustomerDetailsCard.tsx` → `AddressSection`) into two columns on `md+`: a single stacked column of Address Line 1, Address Line 2 (when present), City, State, Zip Code on the left, and the map on the right. On mobile the map stacks below the fields.
- Add a small server-side helper (`lib/maps.ts`) that formats the address and builds the embed URL from a `GOOGLE_MAPS_EMBED_KEY` environment variable.
- If the API key is not configured, the map area shows a "Map unavailable" placeholder instead of breaking the page.
- Read-only: no map on the edit form, no schema change, no stored coordinates.

## Capabilities

### New Capabilities
- `customer-address-map`: The map on the customer detail page — where it sits, what it shows, the stacked address layout beside it, responsive behavior, the embed-URL helper, and the missing-key fallback.
- `map-expand-overlay`: The expand-to-large-overlay behavior of the map — opening, closing (button, Escape, backdrop click), and what is rendered while open.

### Modified Capabilities
(none tracked in `openspec/specs/` — the new address layout amends the "Address" scenario of `customer-detail-view` from the unarchived `customer-detail-page` change, so it is captured as new requirements here rather than a delta)

## Impact

- **UI**: new `components/AddressMap.tsx`; `app/(dashboard)/customers/[id]/CustomerDetailsCard.tsx` (`AddressSection` only).
- **Server**: new `lib/maps.ts` (address formatting + embed URL building; reads `process.env.GOOGLE_MAPS_EMBED_KEY`).
- **External service**: Google Maps Embed API (free; needs a Google Cloud project and an API key restricted to HTTP referrers and to the Maps Embed API). The customer's address is sent to Google to render the map.
- **Config**: `GOOGLE_MAPS_EMBED_KEY` in `.env.local` and in the Vercel project environment variables.
- **DB / dependencies**: none — no migration, no new npm package.
- **Out of scope**: order delivery-location maps (Phase 2) and package-in-transit tracking (Phase 3) — see `markdown files/Features/In_Progress_Features.md` and `markdown/future-features/shipping-integration.md`.
