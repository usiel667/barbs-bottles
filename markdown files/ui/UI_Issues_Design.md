# UI Issues & Design

A running log of visual issues spotted in the app and design changes to make or remove.

---
  
## Open Issues

<!-- Add UI bugs and visual problems here -->
<!-- Example:
### [Page] — Short description
**Location:** `app/(dashboard)/...`
**Problem:** What looks wrong or broken.
**Fix:** What needs to change.
-->

### [Products Form] — Active toggle always saves as inactive
**Location:** `app/(dashboard)/products/form/ProductForm.tsx` — line 205, and `app/(dashboard)/products/actions.ts` — line 28
**Problem:** The form uses a hidden input (`value="false"`) placed *before* the checkbox (`value="true"`) in the DOM. When the checkbox is checked, both values are submitted — but `formData.get("active")` always returns the **first** one, which is always `"false"`. So the product is always saved as inactive regardless of what the checkbox shows.
**Fix:** One line change in `actions.ts` — switch from `get()` to `getAll().includes()`:

```ts
// Current (actions.ts line 28) — BROKEN, always returns false
active: formData.get("active") === "true",

// Fix
active: formData.getAll("active").includes("true"),
```

> Customers form does NOT have this bug — it uses a plain checkbox with no hidden input.




## Design Changes

<!-- Template — copy and fill in for each change:

### [Add | Remove | Change] — Short description
**Page:** `app/(dashboard)/...`
**Component:** Which file gets the change
**What:** Describe exactly what to add, remove, or restyle
**Where in the UI:** Where on the page it should appear
**Notes:** Any constraints, related fields, or validation to keep in mind

-->

### Add — Stock quantity field on Products
**Page:** `app/(dashboard)/products/page.tsx` and `app/(dashboard)/products/form/page.tsx`
**Component:** `ProductForm.tsx`, `products/page.tsx`
**What:** A numeric input showing how many units are in stock/inventory. Minimum 0.
**Where in the UI:** Products form — below Base Price. Products list table — new "Stock" column after Price.
**Notes:** Field does NOT exist yet — requires a DB migration. Changes needed:
1. `db/schema.ts` — add `stockQuantity: integer("stock_quantity").notNull().default(0)` to products table
2. Run `npm run db:generate` then `npm run db:migrate`
3. `zod-schema/product.ts` — drizzle-zod will pick it up automatically
4. `products/actions.ts` — add `stockQuantity` to `parseFormData()`
5. `ProductForm.tsx` — add number input (min 0)
6. `products/page.tsx` — add Stock column to table and mobile card


## Resolved

### ✅ [Products Page] — Edit buttons black → blue *(2026-05-06)*
Fixed all 4 button instances on `products/page.tsx` to use `bg-blue-600 hover:bg-blue-700 text-white`.

### ✅ [Products Page] — Add Product button text black → white *(2026-05-06)*
Added `text-white` to both Add Product buttons (top header + empty state) on `products/page.tsx`.

---

## Design Constants

Rules that every page must follow for visual consistency. When building or reviewing a page, check against this list.

---

### Buttons

| Type | Classes | Usage |
|------|---------|-------|
| Primary action (Add, Save, Submit) | `bg-blue-600 hover:bg-blue-700 text-white` | Top of page CTA, empty-state CTA |
| Edit | `bg-blue-600 hover:bg-blue-700 text-white` + `size="sm"` | Table rows and mobile cards |
| Destructive (Delete) | `bg-red-600 hover:bg-red-700 text-white` + `size="sm"` | Table rows and mobile cards |
| Ghost / secondary | `variant="ghost"` | Low-priority inline actions |

**Rules:**
- All Edit buttons must be blue (`bg-blue-600`) with white text (`text-white`) — never outline or default variant alone
- Never rely on `variant="default"` for color — always set `bg-` and `text-` explicitly to avoid theme bleed
- Always pair `bg-blue-600` with `hover:bg-blue-700` and `text-white`

---

### Text & Headings

| Element | Classes |
|---------|---------|
| Page title (`h1`) | `text-3xl font-bold text-gray-900 dark:text-white` |
| Section subtitle | `text-gray-600 dark:text-gray-300` |
| Table cell text | `text-sm text-gray-700 dark:text-gray-300` |
| Table header | `text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider` |

---

### Status Badges

| State | Classes |
|-------|---------|
| Active / success | `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300` |
| Inactive / neutral | `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300` |

Wrap with: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`

---

### Cards & Containers

| Element | Classes |
|---------|---------|
| Page card / table wrapper | `bg-white dark:bg-gray-800 rounded-lg shadow-sm border` |
| Empty state container | `text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border` |
| Avatar circle | `rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold` |
