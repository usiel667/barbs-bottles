# ProductForm: Design Name Field — Idea & Issues

Notes from planning a UI change to `app/(dashboard)/products/form/ProductForm.tsx` on `products-inventory-update`, before checking the data confirmed the idea wasn't viable as originally scoped. Kept as a record of the reasoning in case the idea resurfaces.

## The original idea

On the Add Product page:

1. Replace the top-level **Product Name** field with **Design Name** — reasoning being the Series dropdown already identifies the product, so the free-text name is really naming the design/variant.
2. Remove the per-row `name` field from the Designs section entirely, since that name would now be captured once at the top, "replacing" the old Product Name field.
3. The only fields left in each design row should be **price | msrp | quantity**.
4. Remove the "Remove" link next to quantity in each design row.

## Why this isn't just a UI change

`ProductForm.tsx` is the single shared component for both Add and Edit (see `Products_Data_Model.md`), so any change here applies to both pages automatically — no separate edit-page work needed. But the specific change above runs into the data layer, not just layout:

- **`db/schema.ts:91,99`** — `product_designs.name` is `NOT NULL`, and there's a **unique constraint on `(productId, name)`**. Every design row saved to the DB must have a non-empty name, and no two designs on the same product can share a name.
- **`zod-schema/productDesign.ts:6`** — `insertProductDesignSchema` requires `name.min(1, "Design name is required")`.
- **`app/(dashboard)/products/actions.ts`** — `parseDesignRows` (line 52) reads `designs[i][name]` for *every* row; `validateDesignRows` (lines 70, 84-90) rejects any row with no name and rejects duplicate names across rows in the same submit.

Removing the per-row name input without also changing `actions.ts` would make every Add/Edit submission fail validation on every design row — both `createProduct` and `updateProduct` share this same parsing/validation path.

This meant the plan only works if a product effectively has **one design**, so the top field can double as that design's name. If a product can have several named designs, the per-row name field is unavoidable — it's the only place each design's real, unique name lives.

## Data check

Queried the live database (2026-07-10) to see whether "one design per product" was realistic:

| Product | Designs |
|---|---|
| Coldest Limitless Ultra v8 46oz | 79 |
| Coldest Limitless Ultra v8 36oz | 74 |
| Coldest Tumbler v2 20oz | 64 |
| Coldest Limitless Ultra v8 15oz | 61 |
| Coldest Limitless Ultra v8 24oz | 58 |
| Coldest Limitless Gallon 128oz | 25 |
| Coldest Mini 6.7oz | 25 |
| Coldest First Responder 36oz | 10 |
| Coldest First Responder 46oz | 10 |
| Coldest Universal 36oz | 4 |

**All 10 existing products have multiple designs** (4–79 each) — not an edge case. Collapsing to one design per product would mean either losing the names of hundreds of existing design rows or picking one design to keep per product and orphaning/deleting the rest.

## Decision

Confirmed: a product still supports multiple designs. That rules out the original plan as scoped:

- The per-row design **`name` field stays** — it's the only place each design's unique name lives, and the DB constraint requires it.
- The top-level **Product Name field is not renamed to "Design Name"** and is not removed — a product isn't one design here, it's a container for many differently-named designs, so labeling its own name as "Design Name" would be inaccurate.
- The "only price | msrp | quantity" and "remove the Remove link" parts of the original idea are shelved along with it, since they were premised on the per-row name field going away.

Recorded as a memory (`product-design-name-field-decision`) so future edits to `ProductForm.tsx` keep the per-row name field intact.

## Open question

The original motivation still stands: does the Product Name field feel redundant next to the Series dropdown? If so, the fix isn't removing/renaming it — it's something that works with the fact that each product has many named designs (e.g. clarifying the label, or reconsidering what "Product Name" vs. design name each represent in this data model). Not yet resolved.

## Update (2026-07-29)

The redundancy concern is substantially addressed, though not by renaming the field. As part of `openspec/changes/product-design-catalog-restructure`:

- **Product Name** changed from a free-text input to a dropdown of existing distinct product names (with an inline "Add Product Name" entry) — it now reads as "which product line/name is this," clearly distinct from Series (which line variant) and Design Name (which colorway), rather than a second freeform label sitting next to Series.
- The products list itself moved to grouping by **design name**, with Series/Size shown as variant metadata rather than as the primary identity — so "Product Name" no longer competes with Series for top billing on that page either.
- The per-row design `name` field (this doc's original subject) is unchanged and still required, per the original decision above.

The field still isn't renamed to "Design Name," and the underlying three-way relationship between Product Name / Series / Design Name hasn't been formally redefined — so treat this as reduced friction, not full resolution.



