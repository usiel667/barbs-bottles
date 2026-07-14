# Products Data Model & Page Flows

Reference notes on how `products` / `product_designs` are shaped in the database, and how the products list, add-product, and edit-product pages read and write them. Written while researching UI changes to `ProductForm.tsx` on `products-inventory-update`.

## Schema

```mermaid
erDiagram
    products ||--o{ product_designs : "productId, cascade delete"
    products {
        serial id PK
        varchar_255 name "not null"
        varchar_100 series "not null"
        enum size "not null"
        varchar material
        boolean hasHandle
        boolean leakProof
        integer coldRetentionHours
        integer hotRetentionHours
        varchar warranty
        boolean active "default true"
        timestamp createdAt
        timestamp updatedAt
    }
    product_designs {
        serial id PK
        integer productId FK
        varchar_255 name "not null, unique per productId"
        decimal price "not null"
        decimal msrpPrice "nullable"
        boolean inStock "default false"
        integer quantity "default 0"
        timestamp createdAt
        timestamp updatedAt
    }
```

### `products` — one row per size/SKU

| Column | Type | Notes |
|---|---|---|
| `id` | serial | PK |
| `name` | varchar(255) | not null |
| `series` | varchar(100) | not null |
| `size` | enum | not null |
| `material`, `hasHandle`, `leakProof`, `coldRetentionHours`, `hotRetentionHours`, `warranty` | mixed | bottle spec fields |
| `description`, `features`, `rating`, `reviewCount`, `designTemplate`, `designPreview`, `designVariations` | mixed | descriptive/display fields |
| `active` | boolean | default `true` |
| `createdAt` / `updatedAt` | timestamp | |

Also referenced by `order_items.product_id` (out of scope here).

### `product_designs` — one row per named design

| Column | Type | Notes |
|---|---|---|
| `id` | serial | PK |
| `productId` | integer | FK → `products.id`, cascade delete |
| `name` | varchar(255) | not null, **`unique(productId, name)`** — a design name can't repeat within one product |
| `price` | decimal(10,2) | not null |
| `msrpPrice` | decimal(10,2) | nullable |
| `inStock` | boolean | default `false` |
| `quantity` | integer | default `0` |
| `createdAt` / `updatedAt` | timestamp | |

Every existing product currently has multiple designs — anywhere from **4 to 79** per product, confirmed by querying the live data (10 products, all multi-design).

## Page & data flow

```mermaid
flowchart TD
    subgraph List["Products list — /products"]
        L1["Query: products ⋈ product_designs (inner join)"] --> L2["Group in memory by series :: design.name → DesignGroup[]"]
        L2 --> L3["Render ProductDesignRow (expandable)"]
        L3 --> L4["Link → /products/form?id={productId} per variant"]
    end

    subgraph Add["Add product — /products/form"]
        A1["No ?id → product = null"] --> A2["ProductForm (isEditing = false), one blank design row"]
        A2 --> A3["createProduct(formData)"]
        A3 --> A4["validate: insertProductSchema + per-row insertProductDesignSchema"]
        A4 --> A5["INSERT products (1) → INSERT product_designs (N)"]
        A5 --> A6["revalidatePath + redirect → /products"]
    end

    subgraph Edit["Edit product — /products/form?id={id}"]
        E1["Fetch product by id + its designs (notFound() if missing)"] --> E2["ProductForm (isEditing = true), pre-filled rows (4-79)"]
        E2 --> E3["updateProduct(id, formData)"]
        E3 --> E4["validate: same schemas as create"]
        E4 --> E5["UPDATE products → DELETE product_designs → INSERT product_designs"]
        E5 --> E6["revalidatePath + redirect → /products"]
    end
```

### Products list — `/products` (`page.tsx`)

1. **Query**: `products ⋈ product_designs`, inner join, ordered by `product.createdAt desc`.
2. **Reshape in memory**: group rows by `series :: design.name` into `DesignGroup[]`, each holding a `variants[]` array (the product/size rows sharing that design name).
3. **Render**: `ProductDesignRow` — one expandable row per design; expanding shows the size variants.
4. **Link**: each variant's Edit button points to `/products/form?id={productId}`.

> One row on this page is a **design** spanning sizes, not a single product row — the grouping is computed on every page load, not stored.

### Add product — `/products/form`

1. No `?id` → `product = null`.
2. `ProductForm` renders with `isEditing = false`, starting with one blank design row (`+ Add Design` appends more).
3. Submit calls server action `createProduct(formData)`.
4. Validates via `insertProductSchema` (product) plus per-row `insertProductDesignSchema` (designs), including a duplicate-name check across rows.
5. Writes: `INSERT products` (1 row), then `INSERT product_designs` (N rows, `productId` = new product's id).
6. `revalidatePath("/products")` then redirect to `/products`.

> One submit creates exactly **one product row (= one size)** plus all of its named designs together.

### Edit product — `/products/form?id={id}`

1. Fetches the `product` row by id and all of its `product_designs` rows; `notFound()` if the id is missing or non-numeric.
2. Same `ProductForm` component, `isEditing = true`, pre-filled with existing designs (could be 4–79 rows).
3. Submit calls server action `updateProduct(id, formData)` (`id` bound via `.bind`).
4. Same validation as create.
5. Writes: `UPDATE products SET ... WHERE id`, then `DELETE product_designs WHERE productId = id`, then `INSERT product_designs` with whatever the form submitted.
6. `revalidatePath("/products")` then redirect to `/products`.

> Edit targets a **single product/size row**. Its whole design list is deleted and reinserted from what the form submits — nothing is diffed.

## Worth knowing

1. **Add and Edit are one component and one code path.** Both routes render `ProductForm.tsx` and share the same field-parsing/validation logic in `actions.ts` — a layout or field change made for one applies to both automatically.
2. **Editing replaces, not patches, the design list.** Every save deletes all existing `product_designs` rows for that product and reinserts whatever the form currently holds. For a product with 79 designs, that's 79 rows round-tripped through the browser on every edit.
3. **All 10 current products already have multiple designs** (4–79 each), so any form change that assumes "one design per product" would conflict with real, existing data.
