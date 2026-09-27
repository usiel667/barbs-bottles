## 1. Google Cloud and configuration (user actions)

- [ ] 1.1 Create a Google Cloud project, enable the **Maps Embed API**, and create an API key restricted to HTTP referrers (`http://localhost:3000/*` and the production domain) and to the Maps Embed API only
- [ ] 1.2 Add `GOOGLE_MAPS_EMBED_KEY` to `.env.local` (assistant must not read or print the key) and restart the dev server
- [ ] 1.3 Add `GOOGLE_MAPS_EMBED_KEY` to the Vercel project's environment variables

## 2. Map URL helper

- [ ] 2.1 Create `lib/maps.ts` with `formatAddress({ address1, city, state, zipCode })` returning `"address1, city, ST zip"` (no address line 2)
- [ ] 2.2 Add `getMapEmbedUrl(address: string)` returning the Google Maps Embed place URL (`https://www.google.com/maps/embed/v1/place?key=…&q=<encoded address>&zoom=15`) or `null` when `GOOGLE_MAPS_EMBED_KEY` is unset

## 3. AddressMap component

- [ ] 3.1 Run `gitnexus_impact` (upstream) on `AddressSection` and `CustomerDetailsCard` before editing them, and report the blast radius
- [ ] 3.2 Create `components/AddressMap.tsx` (`"use client"`) with props `{ embedUrl: string | null; address: string }`
- [ ] 3.3 Add small `MapFrame` (iframe with `title="Map of {address}"`, `loading="lazy"`, `referrerPolicy="no-referrer-when-downgrade"`) and `MapUnavailable` ("Map unavailable" placeholder filling the map area) components
- [ ] 3.4 Render the inline map with an expand button (`aria-label`) in `AddressMap`; render `MapUnavailable` with no expand button when `embedUrl` is null
- [ ] 3.5 Add the native `<dialog>` overlay: expand click sets `open` and calls `showModal()`; the dialog's `close` event sets `open` false; a close button calls `close()`; a click whose `target === currentTarget` (backdrop) calls `close()`; size `w-[90vw] max-w-5xl h-[80vh]`, styled for light/dark
- [ ] 3.6 Mount the overlay's `MapFrame` only while `open` is true
- [ ] 3.7 Confirm no `useEffect` is used for state changes (avoid `react-hooks/set-state-in-effect`) and each function stays under cyclomatic complexity 5

## 4. Integrate into the customer page

- [ ] 4.1 In `CustomerDetailsCard.tsx` `AddressSection`, build `address` with `formatAddress` and `embedUrl` with `getMapEmbedUrl`
- [ ] 4.2 Change `AddressSection` layout to `grid gap-6 md:grid-cols-2`: left cell is the single stacked column (Address 1, Address 2 when present, City, State, Zip); right cell is `<AddressMap>`; remove the inner 3-across City/State/Zip row
- [ ] 4.3 Give the map cell `h-64` on mobile and stretch to the left column's height with a `min-h-64` on `md+`
- [ ] 4.4 Keep `AddressSection` under cyclomatic complexity 5 (extract a `AddressFields` component if needed)

## 5. Verification

- [ ] 5.1 Run `npx tsc --noEmit` and `npx eslint` on the changed files; fix anything reported
- [ ] 5.2 Manually test (key set): the map appears to the right of a stacked address column on desktop, showing the correct location for each customer
- [ ] 5.3 Manually test: a customer with and without Address Line 2 — the field hides cleanly and the stack order is Address 1, (Address 2), City, State, Zip
- [ ] 5.4 Manually test: expand opens the large overlay; close button, Escape, and clicking outside all close it; clicking inside does not; focus returns to the expand button
- [ ] 5.5 Manually test: only one Google iframe on first load, and the overlay iframe is removed after closing
- [ ] 5.6 Manually test (key unset): "Map unavailable" placeholder shows, no expand button, layout unchanged, rest of the page normal
- [ ] 5.7 Manually test: mobile width shows the map below the fields at fixed height with no horizontal scroll (or note if the window can't be resized)
- [ ] 5.8 Re-check the customer page dividers, Orders card, Edit button, and 404 pages are unaffected
- [ ] 5.9 Run fallow `audit` against `main` and confirm 0 newly introduced findings
- [ ] 5.10 Run `gitnexus_detect_changes()` before committing to confirm only expected symbols/flows are affected

## 6. Docs

- [ ] 6.1 Update `In_Progress_Features.md` (Address Maps: mark Phase 1 built, correct the "Location not found" note and env-var name), `New_Pages.md`, and `Home.md`
- [ ] 6.2 Add `GOOGLE_MAPS_EMBED_KEY` and the address-to-Google disclosure to the production-readiness checklist in `Home.md`
