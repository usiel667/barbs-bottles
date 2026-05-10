# Orders Pages — Step-by-Step Coding Guide

Follows the same structure as the Customer and Product guides. Orders are more complex because they have **foreign keys** to both customers and products, the color dropdown is dynamic (driven by whichever product is selected), and the list page requires database joins to show readable names.

**Files you will create/edit (in order):**

1. `zod-schema/order.ts` — fix missing import, add `updateOrderSchema` *(edit existing)*
2. `app/(dashboard)/orders/actions.ts` — server actions *(new file)*
3. `app/(dashboard)/orders/form/page.tsx` — form server wrapper *(new file)*
4. `app/(dashboard)/orders/form/OrderForm.tsx` — form client component *(new file)*
5. `app/(dashboard)/orders/page.tsx` — orders list *(new file)*

---
## Checklist

- [x] `zod-schema/order.ts` — file replaced with fixed version ✅ 2026-05-07
- [ ] `actions.ts` — `createOrder` and `updateOrder` created with auth checks
- [ ] `form/page.tsx` — fetches order + all customers + all active products
- [ ] `form/OrderForm.tsx` — color dropdown driven by selected product
- [ ] `page.tsx` — list with `innerJoin` for customer and product names
- [ ] Update `Home.md` mermaid diagram to add orders routes
- [ ] Update `APP_REFERENCE.md` — add order server actions, pages, and the fixed schemas
- [ ] Test: create an order, verify customer/product/color all save correctly
- [ ] Test: change status, verify badge updates on list page
- [ ] Test: edit an order, verify all fields pre-populate correctly

---
## Architecture Schematic

```
app/
└── (dashboard)/
    └── orders/
        ├── page.tsx                  ← Server Component
        │     └── db.select + innerJoin(customers) + innerJoin(products)
        │
        ├── actions.ts                ← "use server" — mutations
        │     ├── createOrder()
        │     └── updateOrder()
        │
        └── form/
              ├── page.tsx            ← Server Component (reads ?id param)
              │     ├── fetches order if editing
              │     ├── fetches ALL customers for dropdown
              │     └── fetches ALL active products for dropdown
              └── OrderForm.tsx       ← Client Component
                    ├── useActionState(action, null)
                    └── useState for selectedProductId → derives color options

zod-schema/
└── order.ts
      ├── insertOrderSchema           ← Exists (has bug — fix in Step 1)
      ├── selectOrderSchema           ← Exists (has bug — fix in Step 1)
      └── updateOrderSchema           ← You will add this
```

---

## Key Differences vs Customer and Product Pages

Read these before you start — they are the tricky parts:

**1. Foreign keys — orders JOIN customers and products**
The `orders` table stores `customerId` and `productId` integers. The list page needs customer and product names, so it uses `innerJoin` instead of a plain `db.select()`. The form page must fetch all customers and all active products from the server and pass them as props to the form component for the dropdowns.

**2. Color dropdown is dynamic**
`selectedColor` must be one of the colors available for the chosen product. Each product stores its available colors as a JSON array string (e.g. `'["black","blue"]'`). The `OrderForm` client component uses `useState` to track the selected product and derives available colors by parsing that JSON string on the client.

**3. `totalPrice` is a decimal — same treatment as `basePrice`**
Drizzle stores and returns it as a string. The Zod schema validates it is `> 0`. Use `type="number" step="0.01"` on the input.

**4. `estimatedDelivery` is a timestamp**
Use `type="date"` on the input. The value from FormData will be a string like `"2026-06-01"` — convert it with `new Date(...)` before passing to Drizzle. If the field is empty, pass `undefined`.

**5. Status enum — use schema values, NOT the constants**
`OrderStatuses` in `constants/ProductConstants.ts` has values like `"designing"` and `"cancelled"`. The database enum (`OrderStatusEnum` in `db/schema.ts`) uses `"design"` and `"canceled"` (different spelling). Always use the **schema enum values** for the status dropdown or the insert will fail. Import `OrderStatusEnum` config directly or hardcode the options from the schema.

---

## Step 1 — Fix `zod-schema/order.ts`

There are two bugs in the existing file and one thing to add.

**Bug 1 — `createSelectSchema` is not imported**
Line 14 calls `createSelectSchema(orders)` but the import on line 1 only pulls in `createInsertSchema`. This throws a runtime error whenever `selectOrderSchema` is used.

**Bug 2 — `id` override is unnecessary**
`createInsertSchema` already marks `id` (a serial column) as optional. The `z.union([z.number(), z.literal("(New)")])` override serves no real purpose and adds confusion.

**What to add — `updateOrderSchema`**
Same reason as other pages — strips `createdAt`, `updatedAt`, and `id` so a crafted update cannot overwrite them.

Replace the entire file with:

```ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { orders } from "@/db/schema";
import { z } from "zod";

export const insertOrderSchema = createInsertSchema(orders, {
  quantity: (schema) => schema.min(1, "Quantity must be at least 1"),
  selectedColor: (schema) => schema.min(1, "Selected color is required"),
  totalPrice: (schema) => schema.refine((val) => parseFloat(val) > 0, {
    message: "Total price must be greater than 0",
  }),
});

export const selectOrderSchema = createSelectSchema(orders);

export const updateOrderSchema = insertOrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrderType = z.infer<typeof insertOrderSchema>;
export type SelectOrderType = z.infer<typeof selectOrderSchema>;
export type UpdateOrderType = z.infer<typeof updateOrderSchema>;
```

---

## Step 2 — Create `app/(dashboard)/orders/actions.ts`

**Things to note in this file:**
- Auth check on every action (same as customers and products)
- `customerId` and `productId` come from the form as strings — convert with `Number()`
- `quantity` also comes as a string — convert with `Number()`
- `estimatedDelivery` is optional — only convert to `Date` if it is not empty
- `status` is an enum — Drizzle/Zod will validate it matches the schema values
- No unique constraint on orders, so no `23505` try/catch needed

```ts
"use server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { insertOrderSchema, updateOrderSchema } from "@/zod-schema/order";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function parseFormData(formData: FormData) {
  const estimatedDeliveryRaw = formData.get("estimatedDelivery") as string | null;
  return {
    customerId: Number(formData.get("customerId")),
    productId: Number(formData.get("productId")),
    quantity: Number(formData.get("quantity") ?? 1),
    selectedColor: formData.get("selectedColor"),
    customDesignText: formData.get("customDesignText") || undefined,
    customLogoUrl: formData.get("customLogoUrl") || undefined,
    designNotes: formData.get("designNotes") || undefined,
    designProofUrl: formData.get("designProofUrl") || undefined,
    status: formData.get("status"),
    totalPrice: formData.get("totalPrice"),
    estimatedDelivery: estimatedDeliveryRaw ? new Date(estimatedDeliveryRaw) : undefined,
    assignedTo: formData.get("assignedTo") || "unassigned",
  };
}

export async function createOrder(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = insertOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(orders).values(parsed.data);

  revalidatePath("/orders");
  redirect("/orders");
}

export async function updateOrder(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const raw = parseFormData(formData);
  const parsed = updateOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.update(orders).set(parsed.data).where(eq(orders.id, id));

  revalidatePath("/orders");
  redirect("/orders");
}
```

---

## Step 3 — Create `app/(dashboard)/orders/form/page.tsx`

**Why this file is more involved than other form wrappers:**
It fetches three things from the database — the order (if editing), all customers (for the dropdown), and all active products (for the dropdown and color derivation). All three are passed as props to `OrderForm`.

```tsx
import { db } from "@/db";
import { orders, customers, products } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrderForm } from "./OrderForm";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function OrderFormPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const orderId = id ? parseInt(id, 10) : null;

  if (orderId !== null && isNaN(orderId)) notFound();

  // Fetch supporting data for dropdowns (always needed)
  const [allCustomers, allProducts] = await Promise.all([
    db.select().from(customers).orderBy(asc(customers.lastName)),
    db.select().from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.name)),
  ]);

  let order = null;
  if (orderId !== null) {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!result.length) notFound();
    order = result[0];
  }

  return (
    <OrderForm
      order={order}
      customers={allCustomers}
      products={allProducts}
    />
  );
}
```

---

## Step 4 — Create `app/(dashboard)/orders/form/OrderForm.tsx`

**Things to understand before you type this:**
- `customers` and `products` are passed as props — the server fetched them, the client just renders them
- `selectedProductId` lives in React state — when it changes, `availableColors` is derived from the matching product's `colors` JSON string
- `status` dropdown uses the **schema enum values** hardcoded directly: `pending`, `design`, `production`, `quality_check`, `shipped`, `delivered`, `canceled`
- `totalPrice` and `estimatedDelivery` formatting — show the existing values correctly in edit mode

```tsx
"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createOrder, updateOrder } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SelectOrderType } from "@/zod-schema/order";
import { SelectCustomerType } from "@/zod-schema/customer";
import { SelectProductType } from "@/zod-schema/product";

type FormState = {
  errors?: Record<string, string[]>;
} | null;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

// Use schema enum values — NOT the values from ProductConstants.ts (they differ)
const ORDER_STATUSES = [
  { id: "pending",       label: "Pending" },
  { id: "design",        label: "Design" },
  { id: "production",    label: "Production" },
  { id: "quality_check", label: "Quality Check" },
  { id: "shipped",       label: "Shipped" },
  { id: "delivered",     label: "Delivered" },
  { id: "canceled",      label: "Canceled" },
];

type Props = {
  order?: SelectOrderType | null;
  customers: SelectCustomerType[];
  products: SelectProductType[];
};

export function OrderForm({ order, customers, products }: Props) {
  const isEditing = Boolean(order);

  // Track selected product so we can derive available colors
  const [selectedProductId, setSelectedProductId] = useState<number | "">(
    order?.productId ?? ""
  );

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  // Parse the product's stored JSON colors string to get color options
  let availableColors: string[] = [];
  if (selectedProduct?.colors) {
    try {
      availableColors = JSON.parse(selectedProduct.colors);
    } catch {
      availableColors = [];
    }
  }

  const action = isEditing
    ? updateOrder.bind(null, order!.id)
    : createOrder;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  // Format estimatedDelivery for the date input (needs "YYYY-MM-DD")
  const deliveryDefault = order?.estimatedDelivery
    ? new Date(order.estimatedDelivery).toISOString().split("T")[0]
    : "";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Edit Order" : "New Order"}
        </h1>
        <Button asChild variant="outline" className="dark:text-white">
          <Link href="/orders">Cancel</Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">

        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            name="customerId"
            defaultValue={order?.customerId ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
          <FieldError errors={state?.errors?.customerId} />
        </div>

        {/* Product */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            name="productId"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.size} ({p.material.replace("_", " ")})
              </option>
            ))}
          </select>
          <FieldError errors={state?.errors?.productId} />
        </div>

        {/* Color — derived from selected product */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Color <span className="text-red-500">*</span>
          </label>
          <select
            name="selectedColor"
            defaultValue={order?.selectedColor ?? ""}
            disabled={availableColors.length === 0}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          >
            <option value="">
              {availableColors.length === 0 ? "Select a product first" : "Select color"}
            </option>
            {availableColors.map((color) => (
              <option key={color} value={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </option>
            ))}
          </select>
          <FieldError errors={state?.errors?.selectedColor} />
        </div>

        {/* Quantity + Total Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              step="1"
              defaultValue={order?.quantity ?? 1}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FieldError errors={state?.errors?.quantity} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="totalPrice"
              min="0"
              step="0.01"
              defaultValue={order?.totalPrice ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FieldError errors={state?.errors?.totalPrice} />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={order?.status ?? "pending"}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <FieldError errors={state?.errors?.status} />
        </div>

        {/* Estimated Delivery */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estimated Delivery <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            name="estimatedDelivery"
            defaultValue={deliveryDefault}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assigned To <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="assignedTo"
            defaultValue={order?.assignedTo ?? ""}
            placeholder="unassigned"
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Custom Design Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Design Text <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="customDesignText"
            rows={2}
            defaultValue={order?.customDesignText ?? ""}
            placeholder="e.g. Company name, slogan..."
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Design Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Design Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="designNotes"
            rows={2}
            defaultValue={order?.designNotes ?? ""}
            placeholder="Internal notes for the design team..."
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Custom Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Logo URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            name="customLogoUrl"
            defaultValue={order?.customLogoUrl ?? ""}
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPending ? "Saving..." : isEditing ? "Update Order" : "Create Order"}
          </Button>
          <Button asChild variant="outline" className="dark:text-white">
            <Link href="/orders">Cancel</Link>
          </Button>
        </div>

      </form>
    </div>
  );
}
```

---

## Step 5 — Create `app/(dashboard)/orders/page.tsx`

**Why joins are needed:** The `orders` table only stores `customerId` and `productId` integers. To show the customer's name and product name in the list, you must join those tables. Use Drizzle's `.innerJoin()`.

**Status badge colors** — each status gets a distinct colour so you can scan at a glance:

| Status | Classes |
|--------|---------|
| pending | `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300` |
| design | `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300` |
| production | `bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300` |
| quality_check | `bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300` |
| shipped | `bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300` |
| delivered | `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300` |
| canceled | `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300` |

```tsx
import { db } from "@/db";
import { orders, customers, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

const STATUS_CLASSES: Record<string, string> = {
  pending:       "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  design:        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  production:    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  quality_check: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  shipped:       "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  delivered:     "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  canceled:      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending:       "Pending",
  design:        "Design",
  production:    "Production",
  quality_check: "Quality Check",
  shipped:       "Shipped",
  delivered:     "Delivered",
  canceled:      "Canceled",
};

export default async function OrdersPage() {
  const allOrders = await db
    .select({
      id: orders.id,
      quantity: orders.quantity,
      selectedColor: orders.selectedColor,
      status: orders.status,
      totalPrice: orders.totalPrice,
      estimatedDelivery: orders.estimatedDelivery,
      createdAt: orders.createdAt,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      productName: products.name,
      productSize: products.size,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .innerJoin(products, eq(orders.productId, products.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {allOrders.length} order{allOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/orders/form">+ New Order</Link>
        </Button>
      </div>

      {/* Empty state */}
      {allOrders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first order to get started.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/orders/form">+ New Order</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty / Color</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {allOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">#{order.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {order.customerFirstName} {order.customerLastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <p>{order.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.productSize}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <p>{order.quantity}×</p>
                      <p className="capitalize text-xs text-gray-500 dark:text-gray-400">{order.selectedColor}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[order.status] ?? ""}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      ${Number(order.totalPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href={`/orders/form?id=${order.id}`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {allOrders.map((order) => (
              <div key={order.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.customerFirstName} {order.customerLastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.productName}</p>
                  </div>
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href={`/orders/form?id=${order.id}`}>Edit</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[order.status] ?? ""}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{order.quantity}× {order.selectedColor}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">${Number(order.totalPrice).toFixed(2)}</span>
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

## Bugs Fixed in This Guide

| # | File | Bug | Fix Applied |
|---|------|-----|-------------|
| 1 | `zod-schema/order.ts` | `createSelectSchema` not imported — runtime error | Added to import in Step 1 |
| 2 | `zod-schema/order.ts` | `id` override unnecessary in `insertOrderSchema` | Removed in Step 1 |
| 3 | `zod-schema/order.ts` | No `updateOrderSchema` — `createdAt`/`updatedAt` could be overwritten | Added in Step 1 |

---

