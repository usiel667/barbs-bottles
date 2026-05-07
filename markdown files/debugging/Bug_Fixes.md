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

## Fix 5 — Typo in auth error message

**File:** `app/(dashboard)/customers/actions.ts:38`

**Problem:** `createCustomer` throws `"Unathorized"` (missing the 'u').

**Fix:**
```ts
throw new Error("Unauthorized");
```