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
- [Query Functions](#query-functions)
- [Database Instance](#database-instance)
- [Middleware / Auth Config](#middleware--auth-config)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Database Tables

> `db/schema.ts`

| Table | Key Fields |
|-------|-----------|
| `customers` | id, firstName, lastName, email, phone, address1, address2, city, state, zipCode, notes, active, createdAt, updatedAt |
| `products` | id, name, description, size, material, basePrice, colors, features, designTemplate, designPreview, designVariations, active, createdAt, updatedAt |
| `orders` | id, customerId, productId, quantity, selectedColor, customDesignText, customLogoUrl, designNotes, designProofUrl, status, totalPrice, estimatedDelivery, assignedTo, createdAt, updatedAt |

**Relations:**

| Name | Description |
|------|-------------|
| `customerRelations` | customers → many orders |
| `productRelations` | products → many orders |
| `orderRelations` | orders → one customer, one product |

---

## Enums

> `db/schema.ts`

| Name | Values |
|------|--------|
| `OrderStatusEnum` | `pending`, `design`, `production`, `quality_check`, `shipped`, `delivered`, `canceled` |
| `bottleSizeEnum` | `12oz`, `16oz`, `20oz`, `24oz`, `32oz` |
| `bottleMaterialEnum` | `stainless_steel`, `plastic`, `glass`, `aluminum` |

---

## Product Constants

> `constants/ProductConstants.ts`

Each constant is an array of `{ id: string, description: string }` objects.

| Constant | Values |
|----------|--------|
| `BottleSizes` | 12oz, 16oz, 20oz, 24oz, 32oz |
| `BottleMaterials` | stainless_steel, plastic, glass, aluminum |
| `OrderStatuses` | pending, designing, production, quality_check, shipped, delivered, cancelled |
| `AvailableColors` | black, white, blue, red, green, purple, pink, orange |

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
| `insertCustomerSchema` | Zod schema | firstName, lastName, address1, city, state (2 chars), email, zipCode (5-digit), phone |
| `InsertCustomerType` | Type | Inferred from `insertCustomerSchema` |
| `selectCustomerSchema` | Zod schema | For querying customer records |
| `SelectCustomerType` | Type | Inferred from `selectCustomerSchema` |
| `updateCustomerSchema` | Zod schema | Same as insert minus createdAt/updatedAt |
| `UpdateCustomerType` | Type | Inferred from `updateCustomerSchema` |

> `zod-schema/order.ts`

| Name | Kind | Notes |
|------|------|-------|
| `insertOrderSchema` | Zod schema | id (number \| `"(New)"`), quantity (min 1), selectedColor (min 1), totalPrice (parsed > 0) |
| `InsertOrderType` | Type | Inferred from `insertOrderSchema` |
| `selectOrderSchema` | Zod schema | For querying order records |
| `SelectOrderType` | Type | Inferred from `selectOrderSchema` |

> `zod-schema/product.ts`

| Name | Kind | Notes |
|------|------|-------|
| `insertProductSchema` | Zod schema | name (min 1), basePrice (parsed > 0), colors (min 1) |
| `InsertProductType` | Type | Inferred from `insertProductSchema` |
| `selectProductSchema` | Zod schema | For querying product records |
| `SelectProductType` | Type | Inferred from `selectProductSchema` |

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

**Shared type:**

```ts
type FormState = { errors?: Record<string, string[]> } | null
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
