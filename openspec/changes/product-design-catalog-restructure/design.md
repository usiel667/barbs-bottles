## Context

Today `products` is a row per (name, series, size) combo with shared attributes (retention, warranty, handle, leak-proof), and `productDesigns` is a row per named colorway under a product with its own price/MSRP/quantity/inStock. The products page groups by `series::designName`, so the same design shows up as a separate row for every series it appears in, and there's no way to see or edit all sizes/series of one design together. `products.size` is a Postgres enum (`bottleSizeEnum`), so adding a new size today requires a migration; `series` is a free-text column with no persisted list of known values, so the UI has no reusable dropdown source beyond the hardcoded `ProductConstants.ts` array.

This design covers: (1) turning series and size into DB-backed lookups so users can add new options from the UI without a code deploy, (2) redesigning the products list to group by design name across series, and (3) two new edit surfaces — a bulk per-design editor and a single-variant editor — that cover the fast, common edits, while `ProductForm`'s edit mode stays in place for structural changes (see Decision 8).

## Goals / Non-Goals

**Goals:**
- Let a user add a new series or bottle size from the Add Product page without a code change or migration.
- Group the products list by design name, rolling up series/size availability, with a drill-down to every variant.
- Give users a fast way to bulk-update one design's price/MSRP/qty/active across all its variants.
- Give users a focused page to edit or remove exactly one product/design row.

**Non-Goals:**
- Not changing how orders reference products/designs (`order_items.productId` stays as-is).
- Not introducing per-series or per-size images, descriptions, or other new attributes — only the fields already on `products`/`productDesigns`.
- Not building a generic "admin lookup manager" UI; series/size lookups are managed only inline via the "Add" affordances described here.
- Not migrating historical `products.size` data beyond a straight value backfill (no renaming/consolidating existing size strings).

## Decisions

### 1. `products.size` moves from Postgres enum to a lookup-table FK
**Decision**: Add `bottle_sizes (id serial pk, code varchar unique, description varchar)`, seed it from the current `bottleSizeEnum` values, add `products.size_id integer references bottle_sizes(id)`, backfill from the existing `size` enum column, then drop the old `size` column and `bottleSizeEnum` type.
**Why**: Postgres enums can't have values added inside a transaction-safe, user-triggered flow (`ALTER TYPE ... ADD VALUE` has restrictions and isn't something we want triggered by an "Add" button in a server action). A lookup table makes "add a size" a plain `INSERT`.
**Alternative considered**: Keep `bottleSizeEnum` and run `ALTER TYPE ADD VALUE` from the server action. Rejected — can't run inside the same transaction as other DDL/DML reliably, and enum value order/removal is awkward long-term.

### 2. `products.series` moves from free-text to a lookup-table FK
**Decision**: Add `product_series (id serial pk, name varchar unique)`, seed from the current `ProductConstants.ProductSeries` list plus any distinct values already present in `products.series`, add `products.series_id integer references product_series(id)`, backfill, drop the old `series` text column.
**Why**: Matches the size lookup pattern and gives "Add Series" a real place to persist to, independent of whether a product using it has been saved yet.
**Alternative considered**: Leave `series` as free text and treat "Add" as a no-op (just type a new string). Rejected per user decision — needs to be a reusable, persisted option list.

### 3. Product Name stays free text, dropdown sourced from `DISTINCT products.name`
**Decision**: No new table. The Add Product page's Product Name dropdown queries distinct existing `products.name` values; "Add Product Name" just lets the user type a new one, which is persisted the moment the product row is saved.
**Why**: Unlike size (enum) and series (needed as a standalone persisted list per user decision), product name has no type constraint and a "not yet used" name has nowhere meaningful to live until a product actually uses it — the create flow always ends in a product insert, so there's no orphaned-option problem to solve.

### 4. Products page groups by `productDesigns.name` only
**Decision**: Query joins `products` + `productDesigns` as today, but the grouping key becomes `designName` (not `series::designName`). Each group's `variants` list now carries `series` and `size` per row (previously series was fixed per group, only size varied). Column set: expand chevron, `Design`, `Series Avail` (count of distinct series across the group's variants), `In Stock` (X of Y variants in stock), `Action`.
**Why**: Matches the requested UX — one row per design, see at a glance how many series carry it, drill into every series/size instance.
**Trade-off**: Two designs with the same name in genuinely unrelated product lines will now merge into one row. Accepted — the existing schema already treats `productDesigns.name` as the identity of a design (unique per product, no separate design entity), so this is consistent with current data modeling, not a regression.

### 5. Bulk design editor is a new route + one server action, not a variant of `ProductForm`
**Decision**: New page `app/(dashboard)/products/design/[name]/page.tsx` (or query-param equivalent) lists every `productDesigns` row with that name (joined to its product for series/size display) in an editable table; one server action accepts an array of `{productDesignId, price, msrpPrice, quantity, active}` and updates them in a single transaction.
**Why**: This is a materially different shape (N rows, one submit) from the existing single-product create/edit form — reusing `ProductForm` would require branching its entire render tree.

### 6. Single-variant editor is a new page, not `ProductForm` in disguise
**Decision**: New page scoped to one `productDesigns.id` (which implies one `products.id`). Renders Product Name (dropdown+add), Design Name (dropdown of designs already used elsewhere, for consistency, no free-text rename by default), Cold/Hot Retention, Warranty, Has Handle, Leak Proof (all `products` columns), Price/MSRP/Quantity (the `productDesigns` row), Active. Series and Size render as read-only header context (e.g. "Limitless Ultra v8 · 24oz"), sourced from the product but not submitted as editable fields.
**Why**: Per user decision, Series/Size identify *which* row this is — editing them would mean the user is describing a different product, which should go through "Add Product" (potentially reusing the existing product/design as a starting point), not an in-place edit.

### 7. Design rows on Add Product page only render after "Add Design" is clicked
**Decision**: Initialize `designRows` state to `[]` for the create flow (currently defaults to one `emptyDesignRow`); edit flow (`designs` prop populated) is unaffected. `FieldError` for "at least one design" still fires client/server-side if the user submits with zero rows.
**Why**: Matches the note directly; low risk, purely a client-state default change in `ProductForm.tsx:46-55`.

### 8. `/products/form?id=` (existing `ProductForm` edit path) stays, scoped to design-list management
**Decision**: Keep `ProductForm`'s edit mode reachable at `/products/form?id=`. Its job narrows to the one thing neither new page covers: adding a brand-new design/colorway to an existing product row, or removing a design while the designs-array UI is in view, plus editing the shared `products`-level fields (retention, warranty, handle, leak-proof) with full visibility of every sibling design on that row. The bulk design editor and single-variant editor become the fast paths for the common edits (price/stock/active tweaks, single-design field edits); `ProductForm` is the fallback for structural changes.
**Why**: The single-variant editor edits one `productDesigns` row and the shared `products` fields, but has no add-a-design control. The bulk design editor only ever touches Price/MSRP/Quantity/Active, never the shared `products` fields, and never adds/removes rows. Neither replaces "add a second colorway to this product" or "see every sibling design while changing a shared field." Removing `ProductForm`'s edit mode would leave that gap with no UI path.
**Trade-off / follow-up**: The single-variant editor lets a user edit Cold/Hot Retention, Warranty, Has Handle, and Leak Proof — but those columns live on the shared `products` row, so a change made while viewing one design silently applies to every sibling design on that same product row too. Label this clearly in the single-variant editor UI (e.g. "these fields apply to all designs on this product") so it isn't mistaken for a per-design setting.

### 9. "Add Product Name" is an inline text input, matching Series/Size
**Decision**: The Product Name "Add" control on the Add Product page is an inline text input next to the dropdown — the same pattern as the Series and Size "Add" affordances — not a modal.
**Why**: Series and Size already establish this pattern on the same form; a modal for just one of the three fields would be visually inconsistent and adds interaction overhead for a single-field add.

### 10. Design row visibility: inactive stays listed, only removal drops it from the products page
**Decision**: A design whose variants are all set to `active = false` (e.g. via a bulk edit) remains on the products page, shown with the existing "Inactive" badge treatment (`anyActive` logic). A design only disappears from the products page when its variants are actually deleted (via the single-variant editor's Remove action, or removal that leaves zero `productDesigns` rows for that name).
**Why**: Matches current behavior (`anyActive` already renders "Inactive" rather than hiding the row) — deactivating shouldn't be indistinguishable from deleting, since users need to find and reactivate a design without knowing it still exists.

## Risks / Trade-offs

- [Dropping `bottleSizeEnum`/text `series` column loses the DB-level constraint that caught typos] → Mitigate with a `NOT NULL` FK constraint plus server-action-level validation against the lookup table; the FK itself prevents orphaned/typo'd values.
- [Migration backfill on `products` (size enum → FK, series text → FK) touches every existing row] → Write the migration as: add nullable FK columns → backfill by joining old value to new lookup table → set `NOT NULL` → drop old columns, all in one migration file, and run `npx gitnexus analyze` + `gitnexus_detect_changes()` after, per repo convention.
- [Merging products page rows by design name across series (Decision 4) could visually combine unrelated designs that happen to share a name] → Accepted trade-off (see Decision 4); revisit only if it causes real confusion in practice.
- [Three product-editing surfaces now exist: bulk editor, single-variant editor, and `ProductForm`'s edit mode] → Document the split clearly in the products page (top-level Edit = bulk, per-variant Edit = single, and `ProductForm` is reached only for adding/removing a design or editing shared fields with full sibling visibility — see Decision 8) so the entry points are unambiguous.
- [Editing shared `products`-level fields from the single-variant editor silently affects every sibling design on that product row] → Mitigated by the UI label called out in Decision 8; no schema change needed since this reflects the existing data model (retention/warranty/handle/leak-proof are already per-product, not per-design).

## Migration Plan

1. Add `product_series` and `bottle_sizes` tables; seed both from `constants/ProductConstants.ts` values (and `product_series` also from any distinct `products.series` values already in the DB).
2. Add nullable `products.series_id` / `products.size_id` FK columns.
3. Backfill both from the existing `series` text column and `size` enum column.
4. Set both FK columns `NOT NULL`, drop the old `series` (text) and `size` (enum) columns, drop the `bottleSizeEnum` Postgres type.
5. Update `zod-schema/product.ts`, `constants/ProductConstants.ts` (become seed-only reference, not runtime source), server actions, and all reads (`ProductsPage`, `ProductForm`, `ProductDesignRow`) to use the new FK-joined shape.
6. Ship UI changes (grouping, bulk editor, single-variant editor, add-affordances) after the schema migration lands, since the new pages read the FK-joined shape.
7. Rollback: schema change is destructive (drops columns/type) — rollback requires restoring from the pre-migration backup rather than a reverse migration; call this out explicitly to the user before running it against real data.

## Open Questions

None remaining — all three tracked here (§8, §9, §10) have been resolved above.
