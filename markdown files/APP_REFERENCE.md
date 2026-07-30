# App Reference — Barbs Bottles

Quick-navigation index of every major constant, schema, type, function, and config value in the codebase.

---

## Table of Contents

- [Database Tables](#database-tables)
- [Enums](#enums)
- [Product Constants](#product-constants)
- [States Array](#states-array)
- [Zod Schemas & Types](#zod-schemas--types)
- [Utility Functions](#utility-functions)
- [Server Actions](#server-actions)
- [Pages & Components](#pages--components)
- [Query Functions](#query-functions)
- [Database Instance](#database-instance)
- [Middleware / Auth Config](#middleware--auth-config)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Design Constants](#design-constants)

---

## Database Tables

> `db/schema.ts`

| Table | Key Fields |
|-------|-----------|
| `customers` | id, firstName, lastName, email (unique, **nullable**), phone (**nullable**), address1, address2, city, state, zipCode, notes, active, createdAt, updatedAt |
| `products` | id, name, description, seriesId (FK → product_series), sizeId (FK → bottle_sizes), material, features, hasHandle, coldRetentionHours, hotRetentionHours, leakProof, warranty, rating, reviewCount, designTemplate, designPreview, designVariations, active, createdAt, updatedAt |
| `product_designs` | id, productId (FK → products, cascade), name, price, msrpPrice, inStock, quantity, createdAt, updatedAt — **one row per named design/colorway**, `unique(productId, name)` |
| `product_series` | id, name (unique), createdAt — lookup table; new series added via the Add Product page or single-variant editor, no migration needed |
| `bottle_sizes` | id, code (unique), description, createdAt — lookup table; new sizes added the same way |
| `orders` | id, customerId, customDesignText, customLogoUrl, designNotes, designProofUrl, status, totalPrice, estimatedDelivery, trackingNumber, assignedTo, createdAt, updatedAt |
| `order_items` | id, orderId (FK → orders, cascade), productId (FK → products), quantity, selectedColor, unitPrice, discount |

A product no longer has one price — pricing/stock live per-design in `product_designs`, and an order no longer has one product/quantity/color — those live per-line-item in `order_items`. `products.series`/`products.size` were replaced by `seriesId`/`sizeId` FKs into the two lookup tables above (was a free-text column + a Postgres enum). See `markdown files/debugging/Products_Data_Model.md` for the full data model and page-flow writeup.

**Relations:**

| Name | Description |
|------|-------------|
| `customerRelations` | customers → many orders |
| `productRelations` | products → many orderItems, many productDesigns, one productSeries (`seriesRef`), one bottleSize (`sizeRef`) |
| `productDesignRelations` | productDesigns → one product |
| `productSeriesRelations` | productSeries → many products |
| `bottleSizesRelations` | bottleSizes → many products |
| `orderRelations` | orders → one customer, many orderItems |
| `orderItemRelations` | orderItems → one order, one product |

---

## Enums

> `db/schema.ts`

| Name | Values |
|------|--------|
| `OrderStatusEnum` | `pending`, `design`, `production`, `quality_check`, `shipped`, `delivered`, `canceled` |
| `bottleMaterialEnum` | `stainless_steel` |

`bottleSizeEnum` no longer exists — bottle sizes are now rows in the `bottle_sizes` lookup table (see Database Tables above), not a fixed Postgres enum.

---

## Product Constants

> `constants/ProductConstants.ts`

Each constant is an array of `{ id: string, description: string }` objects.

| Constant | Values |
|----------|--------|
| `BottleSizes` | 6.7oz, 15oz, 20oz, 24oz, 36oz, 46oz, 64oz, 128oz |
| `ProductSeries` | Limitless Ultra v8, Limitless Gallon, Tumbler v2, Mini, Universal, First Responder |
| `OrderStatuses` | pending, designing, production, quality_check, shipped, delivered, cancelled |

`AvailableColors` and `BottleMaterials` no longer exist — colors are now per-design `name` values on `product_designs`, and material is fixed to `stainless_steel`.

`BottleSizes` and `ProductSeries` are **seed data only** — they seed the `bottle_sizes`/`product_series` lookup tables (`db/seed.ts`) but are no longer the runtime source of truth for the Add Product page's dropdowns; those read from the DB tables directly.

---

## States Array

> `constants/StatesArray.ts`

| Constant | Description |
|----------|-------------|
| `StatesArray` | All 50 US states + DC, each as `{ id: "XX", description: "Full Name" }` |

---

## Zod Schemas & Types

> `zod-schema/customer.ts`

| Name | Kind | Notes |
|------|------|-------|
| `insertCustomerSchema` | Zod schema | firstName, lastName, address1, city, state (2 chars), zipCode (5-digit); email and phone are `.optional()` — validated for format only when provided, not required |
| `InsertCustomerType` | Type | Inferred from `insertCustomerSchema` |
| `selectCustomerSchema` | Zod schema | For querying customer records |
| `SelectCustomerType` | Type | Inferred from `selectCustomerSchema` |
| `updateCustomerSchema` | Zod schema | Same as insert minus createdAt/updatedAt |
| `UpdateCustomerType` | Type | Inferred from `updateCustomerSchema` |

> `zod-schema/order.ts`

| Name | Kind | Notes |
|------|------|-------|
| `insertOrderSchema` | Zod schema | totalPrice (parsed > 0); extended with `items: insertOrderItemSchema[]` (min 1 item) |
| `insertOrderItemSchema` *(internal)* | Zod schema | quantity (min 1), selectedColor (min 1), unitPrice (parsed ≥ 0) — per line item |
| `selectOrderSchema` | Zod schema | For querying order records |
| `updateOrderSchema` | Zod schema | `insertOrderSchema` minus id/createdAt/updatedAt |
| `InsertOrderType` | Type | Inferred from `insertOrderSchema` |
| `SelectOrderType` | Type | Inferred from `selectOrderSchema` |

> `zod-schema/product.ts`

| Name | Kind | Notes |
|------|------|-------|
| `insertProductSchema` | Zod schema | name (min 1), seriesId (required, > 0), sizeId (required, > 0) |
| `InsertProductType` | Type | Inferred from `insertProductSchema` |
| `selectProductSchema` | Zod schema | For querying product records |
| `SelectProductType` | Type | Inferred from `selectProductSchema` |
| `updateProductSchema` | Zod schema | `insertProductSchema` minus createdAt/updatedAt |
| `updateProductType` | Type | Inferred from `updateProductSchema` |
| `productSchema` | Zod schema | `insertProductSchema.partial()` — all fields optional |

> `zod-schema/productDesign.ts`

| Name | Kind | Notes |
|------|------|-------|
| `insertProductDesignSchema` | Zod schema | name (min 1), price (parsed > 0), quantity (≥ 0) |
| `selectProductDesignSchema` | Zod schema | For querying design records |
| `InsertProductDesignType` | Type | Inferred from `insertProductDesignSchema` |
| `SelectProductDesignType` | Type | Inferred from `selectProductDesignSchema` |

> `zod-schema/productSeries.ts`

| Name | Kind | Notes |
|------|------|-------|
| `insertProductSeriesSchema` | Zod schema | name (min 1) |
| `selectProductSeriesSchema` | Zod schema | For querying series lookup rows |
| `InsertProductSeriesType` / `SelectProductSeriesType` | Type | Inferred types |

> `zod-schema/bottleSize.ts`

| Name | Kind | Notes |
|------|------|-------|
| `insertBottleSizeSchema` | Zod schema | code (min 1), description (min 1) |
| `selectBottleSizeSchema` | Zod schema | For querying size lookup rows |
| `InsertBottleSizeType` / `SelectBottleSizeType` | Type | Inferred types |

---

## Utility Functions

> `lib/utils.ts`

| Function | Signature | Description |
|----------|-----------|-------------|
| `cn` | `(...inputs: ClassValue[]) => string` | Merges Tailwind classes via clsx + tailwind-merge |
| `formatPrice` | `(price: string \| number) => string` | Returns USD currency string, e.g. `$12.00` |
| `formatDate` | `(date: Date \| string) => string` | Returns readable date, e.g. `Jan 4, 2026` |

---

## Server Actions

> `app/(dashboard)/customers/actions.ts`

| Function | Parameters | Description |
|----------|-----------|-------------|
| `createCustomer` | `(_prevState: FormState, formData: FormData)` | Creates a customer; validates auth, dedupes email |
| `updateCustomer` | `(id: number, _prevState: FormState, formData: FormData)` | Updates a customer; validates auth, dedupes email |

> `app/(dashboard)/orders/actions.ts`

| Function | Parameters | Description |
|----------|-----------|-------------|
| `createOrder` | `(_prevState: FormState, formData: FormData)` | Creates an order + its line items; validates auth, parses `items[i][...]` rows via `parseFormData()`, computes `totalPrice` server-side via `computeTotal()` (never trusts client total) |
| `updateOrder` | `(id: number, _prevState: FormState, formData: FormData)` | Updates an order by id; deletes and reinserts all `order_items` for that order (full replace, not a diff) |

> `app/(dashboard)/products/actions.ts`

| Function | Parameters | Description |
|----------|-----------|-------------|
| `createProduct` | `(_prevState: FormState, formData: FormData)` | Creates a product + its designs; validates auth, parses top-level fields via `parseFormData()` and `designs[i][...]` rows via `parseDesignRows()`/`validateDesignRows()` (rejects empty/duplicate design names) |
| `updateProduct` | `(id: number, _prevState: FormState, formData: FormData)` | Updates a product by id; deletes and reinserts all `product_designs` for that product (full replace, not a diff) |
| `createProductSeries` | `(name: string)` | Inserts a new `product_series` row; case-insensitive duplicate-name rejection; used by the Add Product page's inline "Add" for Series |
| `createBottleSize` | `(code: string, description: string)` | Inserts a new `bottle_sizes` row; same duplicate rejection, used by the Size "Add" |
| `updateDesignVariants` | `(updates: VariantUpdate[])` | Bulk design editor's save action — updates Price/MSRP/Quantity/Active for every variant in one `db.batch()` call (all-or-nothing; `neon-http` has no `db.transaction()`) |
| `updateProductDesignVariant` | `(productDesignId: number, _prevState: FormState, formData: FormData)` | Single-variant editor's save action — updates the shared `products` row fields and the one `product_designs` row |
| `removeProductDesignVariant` | `(productDesignId: number)` | Deletes one `product_designs` row; also deletes the parent `products` row if no other designs reference it |

**Shared type:**

```ts
type FormState = { errors?: Record<string, string[]> } | null
```

---

## Pages & Components

> `app/(dashboard)/products/`

| File | Kind | Description |
|------|------|-------------|
| `page.tsx` | Server Component | Products list — `products ⋈ product_designs ⋈ product_series ⋈ bottle_sizes`, grouped in memory by **design name alone** into expandable `DesignGroup` rows; columns `Design \| Series Avail \| In Stock \| Action`; desktop table + mobile cards |
| `ProductDesignRow.tsx` | Client Component | One expandable design row with a top-level "Edit" → bulk design editor; expands to show every series/size variant, each with its own "Edit" → single-variant editor, plus a "Manage Designs" link → `/products/form?id={productId}` |
| `actions.ts` | Server Actions | `createProduct`, `updateProduct`, `createProductSeries`, `createBottleSize`, `updateDesignVariants`, `updateProductDesignVariant`, `removeProductDesignVariant` |
| `form/page.tsx` | Server Component | Reads `?id` param, fetches product + its `product_designs` if editing, plus `product_series`/`bottle_sizes` lookup lists and distinct product names, renders `ProductForm` |
| `form/ProductForm.tsx` | Client Component | Add/edit form for a product **and** its design rows in one submit; uses `useActionState` + local `designRows` state (add/remove/update, starts empty on create); Product Name/Series/Size are dropdowns backed by the DB with inline "Add" actions (Series/Size call `createProductSeries`/`createBottleSize`) |
| `design/[name]/page.tsx` + `BulkDesignEditor.tsx` | Server + Client | Bulk design editor — every series/size variant of one design in an editable table (Price/MSRP/Quantity/Active), saved together via `updateDesignVariants` |
| `design-variant/[id]/page.tsx` + `SingleVariantEditor.tsx` | Server + Client | Single-variant editor — one `product_designs` row + its shared `products` fields; Series/Size read-only context; Update/Cancel/Remove |

Full schema/flow detail: `markdown files/debugging/Products_Data_Model.md`.

> `app/(dashboard)/customers/`

| File | Kind | Description |
|------|------|-------------|
| `page.tsx` | Server Component | Customers list — desktop table + mobile cards |
| `actions.ts` | Server Actions | `createCustomer`, `updateCustomer` |
| `form/page.tsx` | Server Component | Reads `?id` param, fetches customer if editing, renders `CustomerForm` |
| `form/CustomerForm.tsx` | Client Component | Add/edit form; uses `useActionState` |

> `app/(dashboard)/orders/`

| File | Kind | Description |
|------|------|-------------|
| `page.tsx` | Server Component | Orders list — joins customers for names, `order_items ⋈ products` for line items grouped by order; status badges colour-coded by stage |
| `OrderRow.tsx` | Client/presentational | Renders one order row + its item summary |
| `actions.ts` | Server Actions | `createOrder`, `updateOrder` — both compute `totalPrice` server-side from line items via `computeTotal()` |
| `form/page.tsx` | Server Component | Reads `?id`, fetches order + its `order_items` (if editing), all customers, all active products with their `product_designs` attached |
| `form/OrderForm.tsx` | Client Component | Add/edit form; multi-item `itemRows` state (add/remove/update), delegates each row to `OrderItemRow` and shared design/notes fields to `OrderDesignFields` |
| `form/OrderItemRow.tsx` | Client Component | One line item: product select → filters that product's in-stock `product_designs` into a "Design" (color) select, quantity input; `unitPrice` taken from the selected design, hidden in the DOM |
| `form/OrderDesignFields.tsx` | Client Component | Shared fields: estimated delivery, assigned-to, custom design text, design notes, custom logo URL |

**Shared helper (both form components):**

```ts
function FieldError({ errors }: { errors?: string[] })
// Renders the first validation error string in red below an input
```

---

## Query Functions

> `lib/queries/dashboard.ts`

| Function | Returns |
|----------|---------|
| `getDashboardStats()` | `{ totalOrders, totalCustomers, totalProducts, totalRevenue }` |

---

## Database Instance

> `db/index.ts`

| Export | Description |
|--------|-------------|
| `db` | Drizzle ORM instance using the Neon HTTP driver |

Both `db/index.ts` and `drizzle.config.ts` call `config({ path: ".env.local" })` (from `dotenv`) directly so `DATABASE_URL` is loaded outside of Next.js's own env handling too — needed for standalone `tsx`/drizzle-kit scripts. See `markdown files/debugging/DataBase_Debug.md`.

Drizzle config: `drizzle.config.ts` — schema: `./db/schema.ts`, output: `./db/migrations`, dialect: `postgresql`

---

## Middleware / Auth Config

> `proxy.ts`

Auth provided by **Kinde** (`@kinde-oss/kinde-auth-nextjs`). The middleware wraps `withAuth()` with `isReturnToCurrentPage: true`.

**Matcher excludes:** `api/*`, `_next/static/*`, `_next/image/*`, `favicon.ico`, `robots.txt`, `/images/*`, `/login`, `/` (root)

Auth route: `app/api/auth/[kindeAuth]/route.ts`

---

## Environment Variables

| Variable | Used In | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `drizzle.config.ts`, `db/index.ts` | Neon PostgreSQL connection string |
| `KINDE_*` | Auth middleware | Kinde auth credentials (client ID, secret, domain, redirect URLs) |

---

## Scripts

| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |
| `db:generate` | `drizzle-kit generate` |
| `db:migrate` | `tsx ./db/migrate.ts` |
| `db:seed` | `tsx ./db/seed.ts` |
| `db:push` | `drizzle-kit push` |
| `db:studio` | `drizzle-kit studio` |

---

## Design Constants

Tailwind class standards for buttons, text, badges, and containers are maintained in [[UI_Issues_Design]] under the **Design Constants** section. Check there before styling any new page element.
