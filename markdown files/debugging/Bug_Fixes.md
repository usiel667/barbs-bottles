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