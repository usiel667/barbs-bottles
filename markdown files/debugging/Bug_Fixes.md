# Bug Fixes

---

## Fix 1 — Two different login screens (generic vs custom)

**Problem:** Visiting `/home` shows Kinde's generic hosted login instead of the custom `/login` page. This is caused by a stale compiled middleware in `.next/server/middleware.js` from an earlier version of the project that had Kinde's `withAuth` middleware. It intercepts requests before the dashboard layout can redirect to `/login`.

**Fix 1a — Clear the stale build**

Stop the dev server, then delete the `.next` folder and restart:

```bash
rm -rf .next
npm run dev
```

**Fix 1b — Fix the root `/` route**

`app/page.tsx` is still the default Next.js template. Replace the entire file contents with:

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}
```

After both fixes, visiting `/` or `/home` unauthenticated will correctly land on the custom login page.

---

Notes: Had issues with the redirect after login in.  that is now fixed.

---

## Fix 2 — `updateProductSchema` export error (stale build cache)

**Problem:** Error: `Export updateProductSchema doesn't exist in target module`. The export is correctly defined in `zod-schema/product.ts:21` — the error is a stale Turbopack dev cache.

**Fix — clear the build cache and restart:**

```bash
rm -rf .next
npm run dev
```

---

## Fix 3 — Design template field never saved to DB (typo)

**File:** `app/(dashboard)/products/actions.ts:25`

**Problem:** The `parseFormData` function has a double typo — the object key is `desingTemplates` (misspelled + plural) but the schema field is `designTemplate`. This means the design template value is always `undefined` when going to the database.

**Current code (broken):**
```ts
desingTemplates: formData.get("desingTemplate") || undefined,
```

**Fix:**
```ts
designTemplate: formData.get("designTemplate") || undefined,
```

Note: also check the form input's `name` attribute — it should be `designTemplate` to match.

---

## Fix 4 — `createProduct` crashes on DB constraint errors (no try/catch)

**File:** `app/(dashboard)/products/actions.ts:47`

**Problem:** `createProduct` has no error handling around `db.insert()`. If a database constraint is violated, the app throws an unhandled 500 instead of returning a friendly error. The `createCustomer` action handles this correctly.

**Current code (broken):**
```ts
await db.insert(products).values(parsed.data);
```

**Fix — wrap in a try/catch:**
```ts
try {
  await db.insert(products).values(parsed.data);
} catch (e) {
  if (
    e instanceof Error &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  ) {
    return { errors: { name: ["A product with this name already exists"] } };
  }
  throw e;
}
```

---

## Fix 6 — Active toggle always saves as inactive (products)

**File:** `app/(dashboard)/products/actions.ts:28`

**Problem:** `parseFormData` uses `formData.get("active") === "true"`. The form has a hidden input (`value="false"`) placed before the checkbox (`value="true"`) in the DOM. When the checkbox is checked, both values are submitted but `get()` always returns the first — the hidden `"false"` — so the product always saves as inactive regardless of the checkbox state.

**Fix — one line in `parseFormData()`:**
```ts
// Before (broken)
active: formData.get("active") === "true",

// After
active: formData.getAll("active").includes("true"),
```

Customers form is not affected — it has no hidden input for `active`.

---

---

## Fix 7 — `order_items` table missing from database (migration never run)

**File:** `app/(dashboard)/orders/page.tsx` — runtime error on DB query

**Problem:** The `order_items` table was added to `db/schema.ts` but `db:push` (or `db:migrate`) was never run. The query on `/orders` threw Postgres error 42P01: `relation "order_items" does not exist`.

**Fix:**
```bash
export $(grep -v '^#' .env.local | grep DATABASE_URL | xargs) && npm run db:push --force
```

The `--force` flag auto-approves dropping the 3 columns (`product_id`, `quantity`, `selected_color`) that moved from `orders` to `order_items`. Safe for dev/test data — use a manual migration with a data-copy INSERT for production. See [[DataBase_Debug]] for why `DATABASE_URL` must be exported manually before drizzle-kit commands.

---

## Fix 8 — `totalPrice` always 0, order creation rejected by Zod

**File:** `app/(dashboard)/orders/form/OrderForm.tsx`

**Problem:** `parseFormData` in `actions.ts` reads items using the pattern `items[0][productId]`, `items[0][quantity]`, `items[0][unitPrice]` etc., controlled by a hidden `itemCount` field. The form was submitting flat field names (`productId`, `quantity`, `selectedColor`) with no `itemCount`. So `itemCount` resolved to 0, the items array was empty, `computeTotal([])` returned `"0.00"`, and Zod rejected it with "Total price must be greater than 0".

**Fix:** Remove `name` from the product select (it's controlled via `onChange` state). Add hidden inputs that match the action's expected format:
```tsx
<input type="hidden" name="itemCount" value={itemRows.length} />
<input type="hidden" name={`items[${i}][productId]`} value={String(row.productId || "")} />
<input type="hidden" name={`items[${i}][unitPrice]`} value={product?.basePrice ?? "0"} />
<input type="hidden" name={`items[${i}][discount]`} value="0" />
```
Rename quantity and color inputs to `items[i][quantity]` and `items[i][selectedColor]`.

---

## Fix 9 — Duplicate React key on orders list (flat join returns multiple rows per order)

**File:** `app/(dashboard)/orders/page.tsx`

**Problem:** The page used a flat `innerJoin` with `orderItems`. Once orders could have multiple items, the join returned one row per item — so an order with 3 items produced 3 rows with the same `key={order.id}`, causing a React duplicate-key warning and incorrect rendering.

**Fix:** Split the query into two:
1. Fetch orders + customers (one row per order)
2. Fetch all order items + products for those order IDs using `inArray`

Group items by `orderId` in a `Map`, then render one `<OrderRow order={o} items={itemsByOrder.get(o.id) ?? []} />` per order.

---

## Fix 5 — Typo in auth error message

**File:** `app/(dashboard)/customers/actions.ts:38`

**Problem:** `createCustomer` throws `"Unathorized"` (missing the 'u').

**Fix:**
```ts
throw new Error("Unauthorized");
```


## Fix 10 — Design-centric products page backed by a normalized `product_designs` table


**Files:** `db/schema.ts`, `zod-schema/product.ts`, `zod-schema/productDesign.ts` (new), `app/(dashboard)/products/actions.ts`, `app/(dashboard)/products/form/ProductForm.tsx`, `app/(dashboard)/products/page.tsx`, `app/(dashboard)/products/ProductDesignRow.tsx` (new), `app/(dashboard)/orders/form/OrderItemRow.tsx`, `app/(dashboard)/orders/form/OrderForm.tsx`, `db/seed.ts`

**Problem:** three problems that all trace back to the same root cause, so they're tracked as one fix:
1. The products table should show **Design** (not per-size product rows) as the primary unit — Series, Price, In Stock, Status, Action — with a dropdown per design listing its sizes, same pattern as the Orders page.
2. `products.designs` is a JSON blob (`{name, inStock}[]`). Designs are added constantly, and quantities/prices change constantly — a JSON blob can't be updated one design at a time, can't be queried in SQL, and only supports a boolean in-stock flag, not a real count. It also can't represent per-design pricing, which the real data (`Coldest_Designs_Spreadsheet.md`) requires — e.g. Limitless Ultra v8 36oz MSRP splits between $68.24 and $68.92 depending on the design, same series+size.
3. `OrderItemRow.tsx:20-28`'s `getColorsForProduct` still reads `product.colors`, which was already renamed to `product.designs` in an uncommitted schema change — so the design/color `<select>` on `/orders/form` is permanently empty and new orders can't have a design selected at all.

**Root cause:** a "design" was never its own row — it's a JSON entry duplicated across every size in a series, with no independent identity, price, or queryable quantity. Fixing the products-page grouping (1) and the pricing gap (2) both require the same underlying change, and the order-form breakage (3) is a symptom of the same field having been reshaped without every reader being updated. Normalizing designs into their own table fixes all three at once.
**Decision — normalize into a `product_designs` table:**
****
```
┌─────────────────────────────────────────┐
│                 PRODUCTS                 │
├─────────────────────────────────────────┤
│  id              PK                      │
│  name                                    │
│  series          "Limitless Ultra v8"    │
│  size            enum                    │
│  material        enum                    │
│  ...             (other product fields)  │
│  (basePrice REMOVED — no product default)│
│  (msrpPrice REMOVED — no product default)│
│  (designs REMOVED — replaced by relation)│
└───────────────────┬───────────────────────┘
                    │ 1
                    │
                    │ many
┌───────────────────▼───────────────────────┐
│            PRODUCT_DESIGNS  (new)          │
├─────────────────────────────────────────────┤
│  design         "Stealth Black Ultra"      │  ← name
│  series         "Limitless Ultra v8"       │  ← via productId → products.series
│  price          $44.99   NOT NULL          │  ← per design, no product fallback
│  msrpPrice      $53.99   nullable          │  ← per design, no product fallback
│                                             │     (nullable — some designs have no
│                                             │      MSRP listed in the real data)
│  inStock        true/false                 │
│  quantity       int                        │
│  ─────────────────────────────             │
│  id             PK                         │
│  productId      FK → products.id (cascade) │
│  createdAt / updatedAt                     │
└─────────────────────────────────────────────┘

Constraints:
  • UNIQUE (productId, design)
  • quantity >= 0
  • ON DELETE CASCADE
```

| Column        | Type          | Constraints                                   | Notes                                                                   |
| ------------- | ------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| design (name) | varchar(255)  | NOT NULL                                      | e.g. "Stealth Black Ultra"                                              |
| series        | varchar(100)  | — (not stored here)                           | read via `productId → products.series`                                  |
| price         | decimal(10,2) | NOT NULL                                      | replaces `products.basePrice`; every design sets its own                |
| msrpPrice     | decimal(10,2) | nullable                                      | replaces `products.msrpPrice`; per design, null where MSRP isn't listed |
| inStock       | boolean       | NOT NULL, DEFAULT false                       |                                                                         |
| quantity      | integer       | NOT NULL, DEFAULT 0, CHECK >= 0               |                                                                         |
| id            | serial        | PRIMARY KEY                                   |                                                                         |
| productId     | integer       | NOT NULL, FK → products.id, ON DELETE CASCADE |                                                                         |
| createdAt     | timestamp     | NOT NULL, DEFAULT now()                       |                                                                         |
| updatedAt     | timestamp     | NOT NULL, DEFAULT now(), on update            |                                                                         |

`products.basePrice` and `products.msrpPrice` are dropped entirely — every price now lives on `product_designs`, no product-level fallback.

**Proposed code changes (for review — not yet implemented):**

**1. `db/schema.ts`** — remove `basePrice`/`msrpPrice`/`designs` from `products`, add the new table:
```ts
export const productDesigns = pgTable("product_designs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  msrpPrice: decimal("msrp_price", { precision: 10, scale: 2 }),
  inStock: boolean("in_stock").notNull().default(false),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  uniqueDesignPerProduct: unique().on(table.productId, table.name),
}));

export const productDesignRelations = relations(productDesigns, ({ one }) => ({
  product: one(products, {
    fields: [productDesigns.productId],
    references: [products.id],
  }),
}));

// productRelations gains: designs: many(productDesigns)
```
(`unique` needs adding to the `drizzle-orm/pg-core` import.)

**2. `zod-schema/productDesign.ts` (new)**
```ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { productDesigns } from "@/db/schema";
import { z } from "zod";

export const insertProductDesignSchema = createInsertSchema(productDesigns, {
  name: (schema) => schema.min(1, "Design name is required"),
  price: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Price must be greater than 0",
  }),
  quantity: (schema) => schema.refine((val) => val >= 0, {
    message: "Quantity cannot be negative",
  }),
});

export const selectProductDesignSchema = createSelectSchema(productDesigns);

export type InsertProductDesignType = z.infer<typeof insertProductDesignSchema>;
export type SelectProductDesignType = z.infer<typeof selectProductDesignSchema>;
```
`zod-schema/product.ts` drops the `basePrice`/`designs` refinements since those columns no longer exist on `products`.

**3. `app/(dashboard)/products/actions.ts`** — ✅ implemented. `parseFormData` drops `basePrice`/`msrpPrice`/`designs`; a new `parseDesignRows` reads a repeatable field group (same `name[i][field]` + hidden count pattern as `OrderForm`'s `items[i][...]`, see Fix 8), validated by `validateDesignRows`. **A product must have at least 1 design row** — both actions reject with a field error if `parseDesignRows()` returns an empty array, since `page.tsx`'s query is an `innerJoin` and a design-less product would otherwise silently vanish from the products page.

**Deviated from the original plan in two ways, both discovered while implementing:**
- **No `db.transaction()`.** `db/index.ts` connects via `drizzle-orm/neon-http`, whose driver throws `"No transactions support in neon-http driver"` at runtime (confirmed by reading `node_modules/drizzle-orm/neon-http/session.js`). The plan's transaction-wrapped code below would have failed the first time anyone saved a product. Replaced with plain sequential `await`s (insert/update, then delete-and-reinsert for designs) — acceptable since `products` is still placeholder data and this is a single-admin dev app, not because atomicity doesn't matter.
- **Added a same-submission duplicate-design-name check** in `validateDesignRows` (scoped to `productId`, matching the schema's `unique(productId, name)` — the same design name across *different* products/sizes is fine and expected). Without a transaction, `updateProduct`'s delete-then-reinsert has no rollback, so a `product_designs` unique-constraint violation on the reinsert would leave a product with zero designs (silently vanishing from the innerJoin'd products page). Catching duplicates before the DB call closes that failure mode entirely, so the `23505` catch block only needs to handle the pre-existing `products.name` conflict — no `product_designs`-specific branch was needed.

```ts
const designRowSchema = insertProductDesignSchema.omit({ productId: true });
type DesignRow = z.infer<typeof designRowSchema>;

function parseDesignRows(formData: FormData) {
  const count = Number(formData.get("designCount") || 0);
  return Array.from({ length: count }, (_, i) => ({
    name: formData.get(`designs[${i}][name]`),
    price: formData.get(`designs[${i}][price]`),
    msrpPrice: formData.get(`designs[${i}][msrpPrice]`) || undefined,
    inStock: formData.get(`designs[${i}][inStock]`) === "true",
    quantity: Number(formData.get(`designs[${i}][quantity]`) || 0),
  }));
}

function validateDesignRows(
  rows: ReturnType<typeof parseDesignRows>
): { errors: Record<string, string[]> } | { data: DesignRow[] } {
  if (rows.length === 0) {
    return { errors: { designs: ["At least one design is required"] } };
  }

  const data: DesignRow[] = [];
  const rowErrors: string[] = [];
  rows.forEach((row, i) => {
    const parsed = designRowSchema.safeParse(row);
    if (!parsed.success) {
      rowErrors.push(
        `Design ${i + 1}: ${Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")}`
      );
    } else {
      data.push(parsed.data);
    }
  });

  if (rowErrors.length > 0) {
    return { errors: { designs: rowErrors } };
  }

  const seenNames = new Set<string>();
  for (const d of data) {
    if (seenNames.has(d.name)) {
      return { errors: { designs: [`Duplicate design name: "${d.name}"`] } };
    }
    seenNames.add(d.name);
  }

  return { data };
}

// createProduct: no transaction (neon-http doesn't support them) — sequential inserts
const [product] = await db.insert(products).values(parsed.data).returning();
await db.insert(productDesigns).values(
  designsResult.data.map((d) => ({ ...d, productId: product.id }))
);

// updateProduct: same validation, then replace the set (simplest correct
// approach — delete + reinsert rather than diffing), sequential, no transaction:
await db.update(products).set(parsed.data).where(eq(products.id, id));
await db.delete(productDesigns).where(eq(productDesigns.productId, id));
await db.insert(productDesigns).values(
  designsResult.data.map((d) => ({ ...d, productId: id }))
);
```

**4. `ProductForm.tsx`** — ✅ implemented. Removed the "Sale Price + MSRP" fields and the "Designs (JSON)" textarea. Replaced with a repeatable design-row field group (mirrors `OrderForm`'s item rows — `useState<DesignRowState[]>` for `designRows`, seeded from the product's existing `product_designs` when editing, defaulting to one empty row when creating), plus an "Add Design"/"Remove" control per row. `inStock` is not a separate input — it's derived from `quantity > 0` into a hidden field on each row, same as the plan intended.

**Extra file not called out in the original plan:** `products/form/page.tsx` (the server component that renders `ProductForm`) also needed a change — `ProductForm` has no other way to seed `designRows` from a product's existing designs, since `product_designs` is a separate table and no longer nested on `SelectProductType`. It now queries `productDesigns` for the product being edited and passes the rows down as a new `designs` prop.

```tsx
const [designRows, setDesignRows] = useState<DesignRowState[]>(() =>
  designs?.length
    ? designs.map((d) => ({
        name: d.name,
        price: d.price,
        msrpPrice: d.msrpPrice ?? "",
        quantity: String(d.quantity),
      }))
    : [emptyDesignRow]
);

<input type="hidden" name="designCount" value={designRows.length} />
{designRows.map((row, i) => (
  <div key={i} className="grid grid-cols-5 gap-2 items-end border rounded-md p-3 dark:border-gray-600">
    <input type="text" placeholder="Design name" value={row.name}
      onChange={(e) => updateDesignRow(i, "name", e.target.value)}
      name={`designs[${i}][name]`} className="col-span-2 ..." />
    <input type="number" step="0.01" min="0" placeholder="Price" value={row.price}
      onChange={(e) => updateDesignRow(i, "price", e.target.value)}
      name={`designs[${i}][price]`} className="..." />
    <input type="number" step="0.01" min="0" placeholder="MSRP (optional)" value={row.msrpPrice}
      onChange={(e) => updateDesignRow(i, "msrpPrice", e.target.value)}
      name={`designs[${i}][msrpPrice]`} className="..." />
    <input type="number" min="0" step="1" placeholder="Qty" value={row.quantity}
      onChange={(e) => updateDesignRow(i, "quantity", e.target.value)}
      name={`designs[${i}][quantity]`} className="..." />
    <input type="hidden" name={`designs[${i}][inStock]`} value={String(Number(row.quantity) > 0)} />
    <button type="button" onClick={() => removeDesignRow(i)}>Remove</button>
  </div>
))}
```

`products/form/page.tsx`:
```ts
let designs = undefined;
if (productId !== null) {
  // ...fetch product as before...
  designs = await db
    .select()
    .from(productDesigns)
    .where(eq(productDesigns.productId, productId));
}

return <ProductForm product={product} designs={designs} />;
```

**5. `page.tsx`** — join instead of parsing JSON, group by `(series, design name)`:
```tsx
const rows = await db
  .select({
    productId: products.id,
    series: products.series,
    size: products.size,
    active: products.active,
    designName: productDesigns.name,
    price: productDesigns.price,
    msrpPrice: productDesigns.msrpPrice,
    inStock: productDesigns.inStock,
    quantity: productDesigns.quantity,
  })
  .from(products)
  .innerJoin(productDesigns, eq(productDesigns.productId, products.id))
  .orderBy(desc(products.createdAt));

const groups = new Map<string, DesignGroup>();
for (const row of rows) {
  const key = `${row.series}::${row.designName}`;
  if (!groups.has(key)) groups.set(key, { design: row.designName, series: row.series, variants: [] });
  groups.get(key)!.variants.push({ productId: row.productId, size: row.size, price: row.price,
    msrpPrice: row.msrpPrice, inStock: row.inStock, quantity: row.quantity, active: row.active });
}
const designGroups = Array.from(groups.values());
const seriesCount = new Set(designGroups.map((g) => g.series)).size;
const totalInStock = designGroups.reduce((sum, g) => sum + g.variants.filter((v) => v.inStock).length, 0);
```
Header stats become `{designGroups.length} designs · {seriesCount} series · {totalInStock} in stock`, replacing `{allProducts.length} products`. Table header becomes blank chevron column, `Design`, `Series`, `In Stock`, `Status`, `Action` — **no `Price` column on the main table**; each design still appears exactly once (grouping is keyed by `series::designName`), and per-size detail (including price) lives entirely in the dropdown.

Desktop table markup:
```tsx
<div className="hidden md:block overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead className="bg-gray-50 dark:bg-gray-900">
      <tr>
        <th className="px-4 py-3 w-8" />
        <TableHeading label="Design" />
        <TableHeading label="Series" />
        <TableHeading label="In Stock" />
        <TableHeading label="Status" />
        <TableHeading label="Action" align="right" />
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {designGroups.map((group) => (
        <ProductDesignRow key={`${group.series}::${group.design}`} group={group} />
      ))}
    </tbody>
  </table>
</div>
```

Mobile card list — correcting the earlier plan: `orders/page.tsx:104-134` shows the existing mobile cards are **static summaries with no expand**, not tap-to-expand as originally assumed. Match that same pattern instead of inventing a new one — one static, view-only card per design, no per-size breakdown and **no Edit button on mobile for now**:
```tsx
<div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
  {designGroups.map((group) => {
    const inStockCount = group.variants.filter((v) => v.inStock).length;
    const anyActive = group.variants.some((v) => v.active);
    return (
      <div key={`${group.series}::${group.design}`} className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{group.design}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{group.series}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${anyActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}>
            {anyActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {inStockCount} of {group.variants.length} sizes in stock
        </p>
      </div>
    );
  })}
</div>
```
**Deferred, not dropped:** editing from mobile/tablet is wanted eventually, but is being deferred rather than solved now — mainly because a design card has no single `productId` to link Edit to (it spans multiple size variants), and that needs a real answer (e.g. a per-size picker on the card, or a dedicated mobile-friendly edit flow) rather than the first-variant guess used in the earlier draft. Revisit once the desktop flow (schema + `ProductForm.tsx` + `ProductDesignRow.tsx`) is implemented and working.

**6. `ProductDesignRow.tsx` (new)** — sibling to `app/(dashboard)/orders/OrderRow.tsx`, same expand/collapse pattern (`useState` + `ChevronDown/ChevronRight`):
- Collapsed row: **Design**, **Series**, **In Stock** (`N of M sizes`), **Status** (Active if *any* variant's underlying product is active), **Action** (just the chevron). No price shown at this level.
- Expanded panel: sub-table of `variants`, one row per size — **Size | Price | In Stock (`N in stock` / "Out of stock") | Status badge | Edit** button linking to `/products/form?id={productId}`. All size-specific detail (sizes, pricing, per-size stock/status) lives here.

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

type Variant = {
  productId: number;
  size: string;
  price: string;
  msrpPrice: string | null;
  inStock: boolean;
  quantity: number;
  active: boolean;
};

type DesignGroup = {
  design: string;
  series: string;
  variants: Variant[];
};

export function ProductDesignRow({ group }: { group: DesignGroup }) {
  const [expanded, setExpanded] = useState(false);

  const inStockCount = group.variants.filter((v) => v.inStock).length;
  const anyActive = group.variants.some((v) => v.active);

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-4 text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{group.design}</td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{group.series}</td>
        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
          {inStockCount} of {group.variants.length} sizes
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${anyActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}>
            {anyActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-6 py-4 text-right" />
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} className="px-6 pb-4 bg-gray-50 dark:bg-gray-900">
            <table className="min-w-full text-sm mt-2">
              <thead>
                <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b dark:border-gray-700">
                  <th className="pb-2 text-left">Size</th>
                  <th className="pb-2 text-left">Price</th>
                  <th className="pb-2 text-left">In Stock</th>
                  <th className="pb-2 text-left">Status</th>
                  <th className="pb-2 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {group.variants.map((v) => (
                  <tr key={v.productId}>
                    <td className="py-2 text-gray-900 dark:text-white">{v.size}</td>
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      ${Number(v.price).toFixed(2)}
                      {v.msrpPrice && (
                        <span className="ml-2 text-xs text-gray-400 line-through">
                          ${Number(v.msrpPrice).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      {v.inStock ? `${v.quantity} in stock` : "Out of stock"}
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                        {v.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href={`/products/form?id=${v.productId}`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
```

**7. `OrderItemRow.tsx:20-28`** — ✅ implemented. Fixes the dead dropdown. Designs no longer live on `SelectProductType` at all (they're a separate table now), so the data fetch moved to **`app/(dashboard)/orders/form/page.tsx`** (`OrderFormPage` — a server component; `OrderForm.tsx`/`OrderItemRow.tsx` are both client components and can't query the DB). That query uses the same manual join + group-in-a-Map style already used in `products/page.tsx` and `orders/page.tsx`, for consistency with the rest of the codebase (not drizzle's relational `db.query...with` API, which nothing else here uses):
```ts
// OrderFormPage, replacing the current db.select().from(products)... line
const activeProducts = await db.select().from(products).where(eq(products.active, true)).orderBy(asc(products.name));
const allDesigns = activeProducts.length > 0
  ? await db.select().from(productDesigns).where(inArray(productDesigns.productId, activeProducts.map((p) => p.id)))
  : [];
const designsByProduct = new Map<number, typeof allDesigns>();
for (const d of allDesigns) {
  const list = designsByProduct.get(d.productId) ?? [];
  list.push(d);
  designsByProduct.set(d.productId, list);
}
const allProducts = activeProducts.map((p) => ({ ...p, designs: designsByProduct.get(p.id) ?? [] }));
```
`ProductWithDesigns` (the type flowing down through `OrderForm` → `OrderItemRow`) becomes:
```ts
type ProductWithDesigns = SelectProductType & { designs: SelectProductDesignType[] };

function getDesignsForProduct(products: ProductWithDesigns[], productId: number | ""): SelectProductDesignType[] {
  if (!productId) return [];
  const product = products.find((p) => p.id === Number(productId));
  return product?.designs.filter((d) => d.inStock) ?? [];
}
```
The `<select>` maps over `Design` objects (`d.name` for key/value; label appends `(N left)` when `d.quantity <= 5`, as a low-stock hint). The hidden `unitPrice` input needs the *selected design's* resolved price instead of `product.basePrice` (which no longer exists) — this means deriving `selectedDesign` first, the same way the previous code derived `product`:
```tsx
const availableDesigns = getDesignsForProduct(products, row.productId);
const selectedDesign = availableDesigns.find((d) => d.name === row.selectedColor);
// ...
<input type="hidden" name={`items[${index}][unitPrice]`} value={selectedDesign?.price ?? "0"} />

{availableDesigns.map((d) => (
  <option key={d.name} value={d.name}>
    {d.name}{d.quantity <= 5 ? ` (${d.quantity} left)` : ""}
  </option>
))}
```
Default here: out-of-stock designs are excluded from the dropdown entirely (via the `.filter((d) => d.inStock)` above) rather than shown disabled — revisit if that leaves too few options for some sizes.

**8. `db/seed.ts`** — re-seed using real per-design prices from `Coldest_Designs_Spreadsheet.md` instead of placeholder `{name, inStock}` pairs:
```ts
const [limitless15oz] = await db.insert(products).values({
  name: "Limitless Ultra v8 15oz",
  series: "Limitless Ultra v8",
  size: "15oz",
  // ...other product fields, no basePrice/msrpPrice/designs
}).returning();

await db.insert(productDesigns).values([
  { productId: limitless15oz.id, name: "Stealth Black Ultra", price: "44.99", msrpPrice: "53.99", inStock: true, quantity: 12 },
  { productId: limitless15oz.id, name: "Berry Bae Ultra", price: "44.99", msrpPrice: "53.99", inStock: false, quantity: 0 },
  // ...one row per design in Coldest_Designs_Spreadsheet.md for this size
]);
```
`db/clear.ts` (already exists) needs `product_designs` added to whatever it truncates/deletes — cascade delete from `products` should cover it, but confirm the clear order still works.

**Migration:** this is a real `drizzle-kit push` (drop `basePrice`/`msrpPrice`/`designs`, add `product_designs`) — since `products` is still placeholder data, safe to push and re-run the seed from scratch.

**Resolved:**
- No Price column on the main products-page row — confirmed intentional. Price only appears in the per-size dropdown.
- A product must have at least 1 design row to save (guard added to `createProduct`/`updateProduct`, §3 above).
- `OrderFormPage` fetches designs via manual join + group-in-a-Map (matches `products/page.tsx`/`orders/page.tsx` style), not drizzle's relational `db.query...with` API (§7 above).

**Still open / worth confirming before implementing:**
- Data-quality flag from the spreadsheet: "Cuddly Puppy Ultra" on Limitless Gallon 128oz lists MSRP $89.99 < sale price $114.99 — backwards. Worth re-pulling from the live Shopify feed (`curl -s "https://coldest.com/products.json?limit=250"`) before seeding as-is, or seed as-is for now and fix later.
- Whether excluding out-of-stock designs from the order-form dropdown (vs. showing them disabled) is the right call once real inventory is loaded.
- Whether `updateProduct`'s delete-and-reinsert approach for `product_designs` is acceptable, or whether preserving row IDs (diffing instead) matters for anything downstream (e.g. if `order_items.selectedColor` is ever changed to FK into `product_designs` instead of storing the name as a string).
- `inStock` (boolean) and `quantity` (int) are both stored on `product_designs` rather than deriving one from the other — kept as-is since it allows marking a design unavailable without losing its quantity count, but flagging in case that's not the intent.

Nothing in `db/schema.ts` or elsewhere has been changed yet — this is a plan only.