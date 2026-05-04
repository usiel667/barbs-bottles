# Product Pages — Step-by-Step Coding Guide

Mirrors the structure of [[Customer_Pages_Coding_Guide]] with product-specific differences called out clearly.

**Files you will create/edit (in order):**

1. `zod-schema/product.ts` — add `updateProductSchema` *(edit existing)*
2. `app/(dashboard)/products/actions.ts` — server actions *(new file)*
3. `app/(dashboard)/products/form/page.tsx` — form server wrapper *(new file)*
4. `app/(dashboard)/products/form/ProductForm.tsx` — form client component *(new file)*
5. `app/(dashboard)/products/page.tsx` — product list *(new file)*

---

## Architecture Schematic

```
app/
└── (dashboard)/
    └── products/
        ├── page.tsx                  ← Server Component (read all products)
        │     └── db.select(products).orderBy(desc(createdAt))
        │
        ├── actions.ts                ← "use server" — mutations
        │     ├── createProduct()
        │     └── updateProduct()
        │
        └── form/
              ├── page.tsx            ← Server Component (reads ?id param)
              │     └── db.select(products).where(eq(id))
              └── ProductForm.tsx     ← Client Component
                    └── useActionState(action, null)

zod-schema/
└── product.ts
      ├── insertProductSchema         ← Already exists
      └── updateProductSchema         ← You will add this

constants/
└── ProductConstants.ts              ← BottleSizes, BottleMaterials, AvailableColors
                                        Import these into ProductForm — do NOT hardcode the values
```

---

## Key Differences vs. Customer Pages

Products have three fields that need special handling — read these before you start:

**1. `colors` is a JSON array stored as a `text` column**
The DB stores colors as a JSON string e.g. `'["black","blue"]'`. This means:
- When **saving**: use `JSON.stringify(formData.getAll("colors"))` — `getAll` collects all checked checkbox values into an array
- When **loading for edit**: parse back with `JSON.parse(product.colors)` to get the array of selected color IDs

**2. `size` and `material` are enum fields**
Use the constants from `constants/ProductConstants.ts` to populate the `<select>` dropdowns. Never hardcode the options in the form.

**3. `basePrice` is a `decimal` column**
Drizzle stores and returns it as a string (e.g. `"29.99"`). The Zod schema already validates it is `> 0`. Your `<input>` should be `type="number" step="0.01"` and the value sent via FormData will be the string representation, which is what Drizzle expects.

---

## Step 1 — Update `zod-schema/product.ts`

**Why:** Same reason as the customer schema — `insertProductSchema` leaves `createdAt` and `updatedAt` as optional, meaning a crafted update request could overwrite them. A dedicated update schema strips those fields.

**What to add** at the bottom of the existing file (after the `selectProductSchema` export):

```ts
export const updateProductSchema = insertProductSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export type UpdateProductType = z.infer<typeof updateProductSchema>;
```

Your file should now export six things: `insertProductSchema`, `selectProductSchema`, `InsertProductType`, `SelectProductType`, `updateProductSchema`, `UpdateProductType`.

---

## Step 2 — Create `app/(dashboard)/products/actions.ts`

**Review issues applied in this file:**
- **[HIGH]** Auth check at the top of each action
- **[MEDIUM]** `colors` must use `formData.getAll("colors")` not `formData.get("colors")` — using the wrong one silently saves `'[""]'` to the DB when no color is checked, and saves only the first color when multiple are checked
- **[LOW]** Use `updateProductSchema` inside `updateProduct` so `createdAt`/`updatedAt` cannot be overwritten

```ts
"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { insertProductSchema, updateProductSchema } from "@/zod-schema/product";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

// colors uses getAll to collect all checked checkbox values into an array,
// then JSON.stringify to match the text column format in the DB.
// Optional text fields use || undefined so empty strings are not stored.
function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    size: formData.get("size"),
    material: formData.get("material"),
    basePrice: formData.get("basePrice"),
    colors: JSON.stringify(formData.getAll("colors")),
    features: formData.get("features") || undefined,
    designTemplate: formData.get("designTemplate") || undefined,
    designPreview: formData.get("designPreview") || undefined,
    designVariations: formData.get("designVariations") || undefined,
    active: formData.get("active") === "true",
  };
}

export async function createProduct(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // [HIGH FIX] Auth check — layout guard does NOT protect direct action calls
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = insertProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(products).values(parsed.data);

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // [HIGH FIX] Auth check
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);

  // [LOW FIX] Use updateProductSchema so createdAt/updatedAt cannot be overwritten
  const parsed = updateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.update(products).set(parsed.data).where(eq(products.id, id));

  revalidatePath("/products");
  redirect("/products");
}
```

> **Note:** Products have no unique constraint (unlike customer email), so there is no `23505` duplicate error to catch here.

---

## Step 3 — Create `app/(dashboard)/products/form/page.tsx`

**Why this file:** Server component that reads the `?id` search param and pre-fetches the product for edit mode.

**Review issue applied:**
- **[LOW]** `isNaN` guard on `parseInt` — same as customer form page

```tsx
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductForm } from "./ProductForm";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ProductFormPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const productId = id ? parseInt(id, 10) : null;

  // [LOW FIX] Guard against non-numeric ?id values
  if (productId !== null && isNaN(productId)) notFound();

  let product = null;
  if (productId !== null) {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!result.length) notFound();
    product = result[0];
  }

  return <ProductForm product={product} />;
}
```

---

## Step 4 — Create `app/(dashboard)/products/form/ProductForm.tsx`

**Why this file:** Client component that owns form state, calls the right server action (create or update), and displays Zod validation errors inline.

**Things to understand before you type it:**
- `useActionState` returns `[state, formAction, isPending]` — pass `formAction` to `<form action={...}>`
- For edit mode the action is bound: `updateProduct.bind(null, product.id)`
- All inputs use `defaultValue` (not `value`) to stay uncontrolled
- Checkboxes use `defaultChecked` — parse the stored JSON string from `product.colors` to get the array of selected color IDs
- Import `BottleSizes`, `BottleMaterials`, and `AvailableColors` from `@/constants/ProductConstants` — do not hardcode these values

```tsx
"use client";

import { useActionState } from "react";
import { createProduct, updateProduct } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectProductType } from "@/zod-schema/product";
import { BottleSizes, BottleMaterials, AvailableColors } from "@/constants/ProductConstants";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

type Props = {
  product?: SelectProductType | null;
};

export function ProductForm({ product }: Props) {
  const isEditing = Boolean(product);

  // Parse the stored JSON colors string back to an array for defaultChecked comparisons
  let selectedColors: string[] = [];
  if (product?.colors) {
    try {
      selectedColors = JSON.parse(product.colors);
    } catch {
      selectedColors = [];
    }
  }

  const action = isEditing
    ? updateProduct.bind(null, product!.id)
    : createProduct;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Edit Product" : "Add Product"}
        </h1>
        <Button asChild variant="outline" className="dark:text-white">
          <Link href="/products">Cancel</Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            defaultValue={product?.name ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.name} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.description} />
        </div>

        {/* Size + Material */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Size <span className="text-red-500">*</span>
            </label>
            <select
              name="size"
              defaultValue={product?.size ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select size</option>
              {BottleSizes.map((s) => (
                <option key={s.id} value={s.id}>{s.description}</option>
              ))}
            </select>
            <FieldError errors={state?.errors?.size} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Material <span className="text-red-500">*</span>
            </label>
            <select
              name="material"
              defaultValue={product?.material ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select material</option>
              {BottleMaterials.map((m) => (
                <option key={m.id} value={m.id}>{m.description}</option>
              ))}
            </select>
            <FieldError errors={state?.errors?.material} />
          </div>
        </div>

        {/* Base Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="basePrice"
            step="0.01"
            min="0"
            defaultValue={product?.basePrice ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.basePrice} />
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Colors <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AvailableColors.map((color) => (
              <label key={color.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="colors"
                  value={color.id}
                  defaultChecked={selectedColors.includes(color.id)}
                />
                {color.description}
              </label>
            ))}
          </div>
          <FieldError errors={state?.errors?.colors} />
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Features <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="features"
            rows={2}
            defaultValue={product?.features ?? ""}
            placeholder="e.g. Double-wall insulated, BPA-free lid"
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.features} />
        </div>

        {/* Design Template URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Design Template URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            name="designTemplate"
            defaultValue={product?.designTemplate ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.designTemplate} />
        </div>

        {/* Design Preview URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Design Preview URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            name="designPreview"
            defaultValue={product?.designPreview ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <FieldError errors={state?.errors?.designPreview} />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="hidden"
            name="active"
            value="false"
          />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={product?.active ?? true}
            className="h-4 w-4"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending ? "Saving..." : isEditing ? "Update Product" : "Add Product"}
          </Button>
          <Button asChild variant="outline" className="dark:text-white">
            <Link href="/products">Cancel</Link>
          </Button>
        </div>

      </form>
    </div>
  );
}
```

---

## Step 5 — Create `app/(dashboard)/products/page.tsx`

**Why this file:** Lists all products with name, size, material, price, and active status. Includes links to add new and edit existing products.

```tsx
import { db } from "@/db";
import { products } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default async function ProductsPage() {
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {allProducts.length} product{allProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
          <Link href="/products/form">+ Add Product</Link>
        </Button>
      </div>

      {/* Empty state */}
      {allProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first product to get started.</p>
          <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/products/form">+ Add Product</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {allProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">

                    {/* Name + description */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      {product.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{product.description}</p>
                      )}
                    </td>

                    {/* Size */}
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {product.size}
                    </td>

                    {/* Material */}
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {product.material.replace("_", " ")}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      ${Number(product.basePrice).toFixed(2)}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Edit */}
                    <td className="px-6 py-4 text-right">
                      <Button asChild variant="outline" size="sm" className="dark:text-white">
                        <Link href={`/products/form?id=${product.id}`}>Edit</Link>
                      </Button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {allProducts.map((product) => (
              <div key={product.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="dark:text-white">
                    <Link href={`/products/form?id=${product.id}`}>Edit</Link>
                  </Button>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p>{product.size} · {product.material.replace("_", " ")}</p>
                  <p className="font-medium">${Number(product.basePrice).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
```

---

## Review Findings Checklist

| # | Severity | Issue | Where fixed |
|---|----------|-------|-------------|
| 1 | HIGH | Server actions callable without auth | Top of each function in `actions.ts` (Step 2) |
| 2 | MEDIUM | `colors` must use `formData.getAll` not `formData.get` | `parseFormData` in `actions.ts` (Step 2) |
| 3 | LOW | `insertProductSchema` reused for updates | `updateProductSchema` in `zod-schema/product.ts` and `actions.ts` (Steps 1 & 2) |
| 4 | LOW | `parseInt` NaN not guarded | `isNaN` check in `form/page.tsx` (Step 3) |

---

## Design and Logic Issues

*(Add issues here as you find them while testing)*
