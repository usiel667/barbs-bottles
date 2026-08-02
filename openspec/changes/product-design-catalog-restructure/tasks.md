## 1. Lookup tables (`product-lookup-tables`)

- [x] 1.1 Add `bottle_sizes` (`id`, `code` unique, `description`) and `product_series` (`id`, `name` unique) tables in `db/schema.ts`
- [x] 1.2 Write migration: seed `bottle_sizes` from `bottleSizeEnum` values and `product_series` from `ProductConstants.ProductSeries` plus any distinct `products.series` values already in the DB
- [x] 1.3 Add nullable `products.size_id` / `products.series_id` FK columns in the same or a follow-up migration
- [x] 1.4 Backfill `products.size_id` from the old `size` enum column and `products.series_id` from the old `series` text column
- [x] 1.5 Set `size_id`/`series_id` `NOT NULL`, drop the old `size`/`series` columns and the `bottleSizeEnum` Postgres type
- [x] 1.6 Update `zod-schema/product.ts` to validate `sizeId`/`seriesId` instead of the raw enum/text
- [x] 1.7 Add server actions: create series, create bottle size, with case-insensitive duplicate-name rejection
- [x] 1.8 Update `constants/ProductConstants.ts` usages to only serve as migration seed data, not runtime source of truth
- [x] 1.9 Update `db/seed.ts` to seed through the new lookup tables

## 2. Add Product form updates

- [x] 2.1 Change Product Name input to a dropdown sourced from `SELECT DISTINCT name FROM products`, with an inline "Add Product Name" text entry
- [x] 2.2 Change Series dropdown to read from `product_series`, add inline "Add" control wired to the new server action
- [x] 2.3 Change Size dropdown to read from `bottle_sizes`, add inline "Add" control wired to the new server action
- [x] 2.4 Change `designRows` initial state in `ProductForm.tsx` to `[]` for the create flow (keep edit flow pre-populated from `designs` prop)
- [x] 2.5 Verify "at least one design" validation still fires (client FieldError + server action) when submitting with zero design rows

## 3. Design-grouped products page (`design-grouped-catalog-view`)

- [x] 3.1 Update the products page query/grouping in `app/(dashboard)/products/page.tsx` to key by `productDesigns.name` only, joining series/size per variant
- [x] 3.2 Compute `Series Avail` (distinct series count) and `In Stock` ("X of Y variants") per design group
- [x] 3.3 Update table header to `Design | Series Avail | In Stock | Action` (remove `Status` column)
- [x] 3.4 Update `ProductDesignRow.tsx` expanded sub-table to show Series and Size per variant row (not size alone)
- [x] 3.5 Add top-level design row Edit action linking to the bulk design editor route
- [x] 3.6 Add per-variant Edit action inside the expanded dropdown linking to the single-variant editor route
- [x] 3.7 Update mobile card list in `page.tsx` to reflect the new grouping/columns
- [x] 3.8 Confirm a design with all variants inactive still renders as a row (marked "Inactive" via `anyActive`), and only disappears from the list once its variants are actually deleted, not just deactivated

## 4. Bulk design editor (`bulk-design-editor`)

- [x] 4.1 Create route/page for the bulk design editor scoped by design name, listing every `productDesigns` row with that name joined to its product's series/size
- [x] 4.2 Render Price/MSRP/Quantity/Active as editable fields per variant row, no add/remove controls
- [x] 4.3 Add a server action that updates all changed variant rows in a single transaction, all-or-nothing on validation failure
- [x] 4.4 Derive `inStock` from `Quantity` (0 → false, >0 → true) on save
- [x] 4.5 Link this page from the products page's top-level design Edit action (task 3.5)
- [x] 4.6 Setting Active to false on every variant in this page must not delete or hide the design row on the products page — verify it still renders as "Inactive"

## 5. Single-variant editor (`design-variant-editor`)

- [x] 5.1 Create route/page scoped to one `productDesigns.id`, loading that row plus its parent `products` row
- [x] 5.2 Render Product Name (dropdown + add), Design Name (dropdown of existing design names), Cold Retention, Hot Retention, Warranty, Has Handle, Leak Proof, Price, MSRP, Quantity, Active as editable fields
- [x] 5.3 Render Series and Size as read-only page header/context, not submitted as form fields
- [x] 5.4 Add "Update Design" action persisting changes to the `products` and `productDesigns` rows
- [x] 5.5 Add "Cancel" action returning to the products page without saving
- [x] 5.6 Add right-aligned "Remove" action (with confirmation) that deletes the `productDesigns` row, and also deletes the parent `products` row if it has no other designs left
- [x] 5.7 Link this page from the expanded-row per-variant Edit action (task 3.6)
- [x] 5.8 Add a visible label/notice on the shared-field section (Cold/Hot Retention, Warranty, Has Handle, Leak Proof) noting these apply to every design on this product row, not just the one being viewed

## 6. Keep `/products/form?id=` for design-list management (Decision 8)

- [x] 6.1 Leave `ProductForm`'s edit mode reachable at `/products/form?id=`; do not remove or redirect it
- [x] 6.2 Confirm its designs-array UI (add/remove design rows) still works against the new lookup-table-backed series/size fields after the schema migration (section 1)
- [x] 6.3 Add an entry point to `/products/form?id=` for "add a new design to this product" (e.g. a link from the bulk design editor or products page) so it isn't orphaned now that per-variant edits move to the two new pages
- [x] 6.4 Update any in-app help/labels so users understand: bulk editor = price/stock across series for one design, single-variant editor = one design's fields, `ProductForm` edit = add/remove designs or edit shared fields with full sibling visibility

## 7. Verification

- [x] 7.1 Run `gitnexus_impact` on any modified shared symbols (query builders, server actions) before/while editing, per project convention
- [x] 7.2 Run `gitnexus_detect_changes()` before committing to confirm only expected symbols/flows are affected — flagged HIGH risk_level (33 changed symbols / 10 affected processes), reviewed and confirmed it matches the intended scope (products/orders pages + schema), not an unexpected spillover
- [ ] 7.3 Manually test: add a new series, add a new size, add a new product name, from the Add Product page
- [ ] 7.4 Manually test: products page groups a multi-series design into one row with correct Series Avail / In Stock counts
- [ ] 7.5 Manually test: bulk design editor saves multiple variant edits atomically
- [ ] 7.6 Manually test: single-variant editor update, cancel, and remove (both with and without sibling designs on the same product row)
- [ ] 7.7 Manually test: editing a shared field (e.g. Warranty) via the single-variant editor shows up on every sibling design of that product row
- [ ] 7.8 Manually test: bulk-deactivating all of a design's variants keeps it listed as "Inactive"; only removing its variants via the single-variant editor's Remove action makes it disappear from the products page
- [x] 7.9 Apply migration `0003_product_lookup_tables.sql` to the dev database (`npm run db:migrate`) — applied; verified 0 products with null series_id/size_id after backfill (10/10 products migrated cleanly)
