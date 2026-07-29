## Why

The products catalog currently groups rows by series+design, forces every "add product" flow to retype the product name/series, and has no dedicated screen for editing a single design variant or for updating a design across all its sizes/series at once. This makes the catalog slow to maintain as designs are added across multiple series and sizes ("NEW DESIGN INFO" note in `markdown files/debugging/Bug_Fixes.md`).

## What Changes

- Products page groups rows by **design name only** (not series+design). Columns become `Design | Series Avail | In Stock | Action`, and expanding a row lists every series/size variant of that design.
- **BREAKING**: Removes the current per-series grouping and the `Status` column from the products list in favor of the design-first view.
- Add Product form:
  - `Product Name` becomes a dropdown of existing product names (distinct values already in `products.name`) with an inline "Add Product Name" action, replacing the free-text input. No new lookup table is needed since `name` is plain text with no enum constraint.
  - `Series` dropdown gains an inline "Add" action backed by a new `product_series` lookup table (replaces the hardcoded `ProductSeries` constant as the source of truth).
  - `Size` dropdown gains an inline "Add" action backed by a new `bottle_sizes` lookup table, **replacing** the `bottleSizeEnum` Postgres enum on `products.size` (enum values can't be extended at runtime).
  - Design rows no longer render one empty row by default — they only appear after "Add Design" is clicked (create flow only; edit flow still pre-populates existing designs).
- New **bulk design editor** page: opened from a design row's top-level Edit action, shows every series/size variant of that design as an inline-editable table (Price / MSRP / Qty / Active per row), saved together.
- New **single-variant design editor** page: opened from a variant row inside the expanded dropdown. Fields: Product Name (dropdown + add), Design Name (dropdown), Cold Retention, Hot Retention, Warranty, Has Handle, Leak Proof, Price, MSRP, Quantity, Active. Series and Size are shown read-only as page context (not editable — changing either identifies a different product row). Actions: `Update Design`, `Cancel`, and `Remove` (right-aligned).

## Capabilities

### New Capabilities
- `product-lookup-tables`: `product_series` and `bottle_sizes` reference tables that back dynamic "Add" affordances on the product form and replace the hardcoded series constant and the `bottleSizeEnum` Postgres enum.
- `design-grouped-catalog-view`: Products page grouped by design name with a series-availability rollup, expandable per-variant rows, and updated column set.
- `bulk-design-editor`: Dedicated page to edit Price/MSRP/Qty/Active for every series/size variant of one design in a single editable table and save them together.
- `design-variant-editor`: Dedicated single-variant edit page (distinct from the create-product form) scoped to one product/design row, with Series/Size shown as read-only context.

### Modified Capabilities
(none — no existing specs are tracked yet; the current products/product-design behavior is being captured as the new capabilities above rather than diffed against a prior spec)

## Impact

- **Schema**: `db/schema.ts` — new `product_series` and `bottle_sizes` tables; `products.size` changes from `bottleSizeEnum` to a varchar FK-style reference (migration required, including backfill of existing rows); `products.series` gains a lookup-backed source of truth.
- **Server actions**: `app/(dashboard)/products/actions.ts` — new actions for creating series/size/product-name lookup entries, bulk-updating a design's variants, and updating/removing a single variant.
- **UI**: `app/(dashboard)/products/page.tsx`, `ProductDesignRow.tsx`, `form/ProductForm.tsx`, plus two new routes/pages (bulk design editor, single-variant editor).
- **Validation**: `zod-schema/product.ts`, `zod-schema/productDesign.ts`, and new zod schemas for the lookup tables.
- **Constants**: `constants/ProductConstants.ts` — `ProductSeries` and `BottleSizes` arrays become seed data / fallback only, no longer the runtime source of truth.
- **Seed/migrations**: `db/seed.ts` and a new `db/migrations/*.sql` for the lookup tables and the `products.size` column type change.
